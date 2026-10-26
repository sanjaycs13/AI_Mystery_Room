import mongoose from 'mongoose';

const caseSchema = new mongoose.Schema({
  ownerTokenHash: { type: String, required: true, index: true },
  status: { type: String, enum: ['READY'], default: 'READY' },
  title: { type: String, required: true },
  category: { type: String, required: true },
  difficulty: { type: String, required: true },
  incident: { summary: String, location: String, occurredAt: String },
  suspects: [{ id: String, name: String, description: String, motive: String, alibi: String, portraitAssetId: { type: String, default: null } }],
  timeline: [{ id: String, timestamp: String, description: String, relatedEvidenceIds: [String] }],
  evidence: [{ id: String, type: String, title: String, description: String, timestamp: String, location: String, participants: [String], messages: [{ sender: String, content: String, timestamp: String }], events: [{ timestamp: String, description: String }], witnessName: String, relationship: String, statement: String, collectedAt: String, reliabilityNotes: String, relatedEvidenceIds: [String] }],
  solution: { culpritId: String, explanation: String, decisiveEvidenceIds: [String], hints: [String] },
}, { timestamps: true, minimize: false });

export default mongoose.model('Case', caseSchema);
