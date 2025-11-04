import mongoose from 'mongoose';
import type { Note } from '../../../types.js';

export const noteSchema = new mongoose.Schema<Note>({
  text: { type: String, required: true },
  timestamp: { type: Date, required: true },
  author: { type: String, required: true },
});
