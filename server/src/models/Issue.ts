import mongoose, { Schema } from 'mongoose';
import { IIssue } from '../types/index.js';

const IssueSchema = new Schema<IIssue>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  cycle: {
    type: Schema.Types.ObjectId,
    ref: 'Cycle'
  },
  station: {
    type: Schema.Types.ObjectId,
    ref: 'Station'
  },
  type: {
    type: String,
    enum: ['CYCLE_DAMAGE', 'PAYMENT_ISSUE', 'APP_BUG', 'STATION_ISSUE', 'OTHER'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
    default: 'OPEN'
  },
  priority: {
    type: String,
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    default: 'MEDIUM'
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  resolution: String,
  attachments: [String]
}, {
  timestamps: true
});

IssueSchema.index({ user: 1 });
IssueSchema.index({ status: 1 });
IssueSchema.index({ priority: 1 });
IssueSchema.index({ createdAt: -1 });

export const Issue = mongoose.model<IIssue>('Issue', IssueSchema);