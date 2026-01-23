import mongoose, { Schema, Document } from 'mongoose'

export type JobStatus = 'processing' | 'completed' | 'failed'

export interface IJob extends Document {
  jobId: string
  templateId: string
  status: JobStatus
  format: 'png' | 'jpeg'
  totalItems: number
  processedItems: number
  outputPaths: string[]
  errorMessages: string[]
  createdAt: Date
  completedAt?: Date
}

const JobSchema = new Schema<IJob>(
  {
    jobId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    templateId: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['processing', 'completed', 'failed'],
      default: 'processing',
    },
    format: {
      type: String,
      enum: ['png', 'jpeg'],
      default: 'png',
    },
    totalItems: {
      type: Number,
      required: true,
    },
    processedItems: {
      type: Number,
      default: 0,
    },
    outputPaths: {
      type: [String],
      default: [],
    },
    errorMessages: {
      type: [String],
      default: [],
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
)

export const Job = mongoose.model<IJob>('Job', JobSchema)
