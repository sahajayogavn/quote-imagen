import mongoose, { Schema, Document } from 'mongoose'

export interface ITemplate extends Document {
  templateId: string
  name: string
  width: number
  height: number
  fabricJson: object
  variables: string[]
  previewUrl?: string
  createdAt: Date
  updatedAt: Date
}

const TemplateSchema = new Schema<ITemplate>(
  {
    templateId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    width: {
      type: Number,
      required: true,
      default: 1080,
    },
    height: {
      type: Number,
      required: true,
      default: 1080,
    },
    fabricJson: {
      type: Schema.Types.Mixed,
      required: true,
    },
    variables: {
      type: [String],
      default: [],
    },
    previewUrl: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
)

export const Template = mongoose.model<ITemplate>('Template', TemplateSchema)
