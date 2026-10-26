import express from 'express';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { randomBytes, createHash } from 'node:crypto';
import Case from './models/Case.js';
import Investigation from './models/Investigation.js';
import { generateCase } from './services/gemini.service.js';
import { AppError } from './utils/AppError.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(express.json({ limit: '32kb' }));
app.use((req, res, next) => {
  const allowedOrigins = new Set((process.env.CLIENT_ORIGIN || '').split(',').map((value) => value.trim()).filter(Boolean));
  const origin = req.headers.origin;
  if (origin && allowedOrigins.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const hash = (token) => createHash('sha256').update(token).digest('hex');
const isProd = () => process.env.NODE_ENV === 'production';
function ownerCookie(res, token) {
  res.setHeader('Set-Cookie', `mystery_guest=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=2592000${isProd() ? '; Secure' : ''}`);
}
function requireOwner(req, res, next) {
  const token = req.cookies?.mystery_guest;
  if (!token || token.length < 40) return next(new AppError(401, 'UNAUTHORIZED', 'Your guest session has expired.'));
  req.ownerTokenHash = hash(token);
  next();
}
// Parse only the one signed-by-randomness, opaque owner cookie; never treat IDs as authorization.
app.use((req, _res, next) => {
  const cookie = req.headers.cookie || '';
  const token = cookie.split(';').map((part) => part.trim()).find((part) => part.startsWith('mystery_guest='))?.slice('mystery_guest='.length);
  req.cookies = token ? { mystery_guest: decodeURIComponent(token) } : {};
  next();
});

const windowMs = 60_000;
const attempts = new Map();
function generationLimit(req, _res, next) {
  const key = req.ip || 'unknown';
  const now = Date.now();
  const recent = (attempts.get(key) || []).filter((time) => now - time < windowMs);
  if (recent.length >= 3) return next(new AppError(429, 'RATE_LIMITED', 'Please wait a minute before creating another case.'));
  recent.push(now); attempts.set(key, recent); next();
}
const asyncRoute = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
function safeCase(record) {
  return { caseId: record._id, status: record.status, title: record.title, category: record.category, difficulty: record.difficulty, incident: record.incident, suspects: record.suspects, timeline: record.timeline, evidence: record.evidence, createdAt: record.createdAt };
}
async function ownedCase(caseId, ownerTokenHash) {
  if (!mongoose.isValidObjectId(caseId)) throw new AppError(404, 'CASE_NOT_FOUND', 'This case could not be found.');
  const record = await Case.findOne({ _id: caseId, ownerTokenHash });
  if (!record) throw new AppError(404, 'CASE_NOT_FOUND', 'This case could not be found.');
  return record;
}
async function ownedInvestigation(id, ownerTokenHash) {
  if (!mongoose.isValidObjectId(id)) throw new AppError(404, 'INVESTIGATION_NOT_FOUND', 'This investigation could not be found.');
  const record = await Investigation.findOne({ _id: id, ownerTokenHash });
  if (!record) throw new AppError(404, 'INVESTIGATION_NOT_FOUND', 'This investigation could not be found.');
  return record;
}

app.get('/api/health', (_req, res) => res.json({ success: true, data: { status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' } }));
app.post('/api/cases/generate', generationLimit, asyncRoute(async (req, res) => {
  const scenario = typeof req.body?.scenario === 'string' ? req.body.scenario.trim() : '';
  const difficulty = req.body?.difficulty === undefined ? 'medium' : req.body.difficulty;
  if (!['easy', 'medium', 'hard'].includes(difficulty)) throw new AppError(400, 'VALIDATION_ERROR', 'Choose an easy, medium, or hard difficulty.');
  const categories = ['theft', 'missing_person', 'corporate_mystery', 'suspicious_incident', 'general_mystery'];
  const category = req.body?.category === undefined ? 'general_mystery' : req.body.category;
  if (!categories.includes(category)) throw new AppError(400, 'VALIDATION_ERROR', 'Choose a supported mystery category.');
  if (scenario.length < 30 || scenario.length > 2000) throw new AppError(400, 'VALIDATION_ERROR', 'Your scenario must be between 30 and 2,000 characters.');
  const ownerToken = req.cookies.mystery_guest || randomBytes(32).toString('base64url');
  if (!req.cookies.mystery_guest) ownerCookie(res, ownerToken);
  const result = await generateCase({ scenario, difficulty, category });
  const record = await Case.create({ ...result, ownerTokenHash: hash(decodeURIComponent(ownerToken)) });
  res.status(201).json({ success: true, data: { caseId: record._id, status: 'READY', title: record.title, difficulty: record.difficulty } });
}));
app.get('/api/cases/:caseId', requireOwner, asyncRoute(async (req, res) => {
  res.json({ success: true, data: safeCase(await ownedCase(req.params.caseId, req.ownerTokenHash)) });
}));
app.get('/api/cases/:caseId/evidence', requireOwner, asyncRoute(async (req, res) => {
  const record = await ownedCase(req.params.caseId, req.ownerTokenHash);
  res.json({ success: true, data: record.evidence });
}));
app.post('/api/cases/:caseId/investigations', requireOwner, asyncRoute(async (req, res) => {
  const record = await ownedCase(req.params.caseId, req.ownerTokenHash);
  let investigation = await Investigation.findOne({ caseId: record._id, ownerTokenHash: req.ownerTokenHash, status: 'IN_PROGRESS' });
  if (!investigation) investigation = await Investigation.create({ caseId: record._id, ownerTokenHash: req.ownerTokenHash });
  res.status(200).json({ success: true, data: { investigationId: investigation._id, status: investigation.status, openedEvidenceIds: investigation.openedEvidenceIds } });
}));
app.patch('/api/investigations/:investigationId/progress', requireOwner, asyncRoute(async (req, res) => {
  const investigation = await ownedInvestigation(req.params.investigationId, req.ownerTokenHash);
  if (investigation.status !== 'IN_PROGRESS') throw new AppError(409, 'ALREADY_COMPLETED', 'This investigation is already complete.');
  const record = await ownedCase(investigation.caseId, req.ownerTokenHash);
  const ids = Array.isArray(req.body?.openedEvidenceIds) ? req.body.openedEvidenceIds : [];
  if (ids.some((id) => !record.evidence.some((item) => item.id === id))) throw new AppError(400, 'VALIDATION_ERROR', 'One or more evidence items do not belong to this case.');
  investigation.openedEvidenceIds = [...new Set([...investigation.openedEvidenceIds, ...ids])];
  await investigation.save();
  res.json({ success: true, data: { openedEvidenceIds: investigation.openedEvidenceIds } });
}));
app.post('/api/investigations/:investigationId/accusations', requireOwner, asyncRoute(async (req, res) => {
  const investigation = await ownedInvestigation(req.params.investigationId, req.ownerTokenHash);
  if (investigation.status !== 'IN_PROGRESS') throw new AppError(409, 'ALREADY_COMPLETED', 'Your accusation has already been submitted.');
  const record = await ownedCase(investigation.caseId, req.ownerTokenHash);
  const suspect = record.suspects.find((item) => item.id === req.body?.suspectId);
  if (!suspect) throw new AppError(400, 'INVALID_SUSPECT', 'Select a suspect from this case.');
  const correct = suspect.id === record.solution.culpritId;
  const result = { suspectId: suspect.id, isCorrect: correct, score: correct ? 100 : 0, correctCulprit: { id: record.solution.culpritId, name: record.suspects.find((item) => item.id === record.solution.culpritId).name }, explanation: record.solution.explanation, decisiveEvidenceIds: record.solution.decisiveEvidenceIds, submittedAt: new Date() };
  const updated = await Investigation.findOneAndUpdate({ _id: investigation._id, status: 'IN_PROGRESS', ownerTokenHash: req.ownerTokenHash }, { $set: { status: 'COMPLETED', result } }, { new: true });
  if (!updated) throw new AppError(409, 'ALREADY_COMPLETED', 'Your accusation has already been submitted.');
  res.json({ success: true, data: { investigationId: updated._id, ...result } });
}));
app.get('/api/investigations/:investigationId/result', requireOwner, asyncRoute(async (req, res) => {
  const investigation = await ownedInvestigation(req.params.investigationId, req.ownerTokenHash);
  if (investigation.status !== 'COMPLETED') throw new AppError(409, 'CASE_NOT_READY', 'Submit an accusation to see your result.');
  res.json({ success: true, data: { investigationId: investigation._id, ...investigation.result.toObject() } });
}));

app.use(notFound);
app.use(errorHandler);
export default app;
