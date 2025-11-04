import mongoose from 'mongoose';

interface Sequence {
  _id: string;
  seq: number;
}

const SequenceSchema = new mongoose.Schema<Sequence>({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});

export const SequenceModel = mongoose.model<Sequence>('Sequence', SequenceSchema);
