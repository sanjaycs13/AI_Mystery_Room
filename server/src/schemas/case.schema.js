import { z } from 'zod';

const idList = z.array(z.string().min(1));
const suspectSchema = z.object({ id: z.string().min(1), name: z.string().min(1), description: z.string().min(1), motive: z.string().min(1), alibi: z.string().min(1), portraitAssetId: z.string().nullable().optional() });
const messageSchema = z.object({ sender: z.string(), content: z.string(), timestamp: z.string() });
const evidenceSchema = z.object({
  id: z.string().min(1), type: z.enum(['chat', 'cctv', 'witness', 'call_log', 'access_log', 'forensic', 'incident_report', 'photograph', 'physical']),
  title: z.string().min(1), description: z.string().default(''), timestamp: z.string().optional(), location: z.string().optional(), participants: z.array(z.string()).default([]),
  messages: z.array(messageSchema).default([]), events: z.array(z.object({ timestamp: z.string(), description: z.string() })).default([]),
  witnessName: z.string().optional(), relationship: z.string().optional(), statement: z.string().optional(), collectedAt: z.string().optional(), reliabilityNotes: z.string().optional(), relatedEvidenceIds: idList.default([]),
});
export const generatedCaseSchema = z.object({
  title: z.string().min(3), category: z.enum(['theft', 'missing_person', 'corporate_mystery', 'suspicious_incident', 'general_mystery']), difficulty: z.enum(['easy', 'medium', 'hard']),
  incident: z.object({ summary: z.string().min(20), location: z.string().min(1), occurredAt: z.string().min(1) }),
  suspects: z.array(suspectSchema).min(3).max(5),
  timeline: z.array(z.object({ id: z.string().min(1), timestamp: z.string(), description: z.string().min(1), relatedEvidenceIds: idList.default([]) })).min(3),
  evidence: z.array(evidenceSchema).min(5),
  solution: z.object({ culpritId: z.string().min(1), explanation: z.string().min(30), decisiveEvidenceIds: idList.min(2), hints: z.array(z.string()).default([]) }),
});

export function validateCaseReferences(data) {
  const suspectIds = data.suspects.map((item) => item.id);
  const evidenceIds = data.evidence.map((item) => item.id);
  const timelineIds = data.timeline.map((item) => item.id);
  if (new Set(suspectIds).size !== suspectIds.length || new Set(evidenceIds).size !== evidenceIds.length || new Set(timelineIds).size !== timelineIds.length) throw new Error('Generated case contains duplicate IDs.');
  if (!suspectIds.includes(data.solution.culpritId)) throw new Error('Generated culprit does not match a suspect.');
  if (new Set(data.solution.decisiveEvidenceIds).size < 2 || data.solution.decisiveEvidenceIds.some((id) => !evidenceIds.includes(id))) throw new Error('Generated decisive clues do not match evidence.');
  for (const item of data.timeline) if (item.relatedEvidenceIds.some((id) => !evidenceIds.includes(id))) throw new Error('Timeline references missing evidence.');
  for (const item of data.evidence) if (item.relatedEvidenceIds.some((id) => !evidenceIds.includes(id))) throw new Error('Evidence references missing evidence.');
  return data;
}
