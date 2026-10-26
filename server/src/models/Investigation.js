import mongoose from 'mongoose';

const investigationSchema = new mongoose.Schema({
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Case', required: true, index: true },
  ownerTokenHash: { type: String, required: true, index: true },
  openedEvidenceIds: { type: [String], default: [] },
  status: { type: String, enum: ['IN_PROGRESS', 'COMPLETED'], default: 'IN_PROGRESS' },
  result: { suspectId: String, isCorrect: Boolean, score: Number, correctCulprit: { id: String, name: String }, explanation: String, decisiveEvidenceIds: [String], submittedAt: Date },
}, { timestamps: true });

export default mongoose.model('Investigation', investigationSchema);
