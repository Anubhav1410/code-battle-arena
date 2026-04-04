import mongoose, { Schema, Document } from 'mongoose'

export interface IProblem extends Document {
  title: string
  slug: string
  description: string
  difficulty: 'easy' | 'medium' | 'hard'
  tags: string[]
  constraints: string
  examples: Array<{
    input: string
    output: string
    explanation: string
  }>
  testCases: Array<{
    input: string
    expectedOutput: string
    isHidden: boolean
    timeLimit: number
    memoryLimit: number
  }>
  starterCode: {
    cpp: string
    python: string
    javascript: string
    java: string
  }
  metadata: {
    timesUsed: number
    avgSolveTime: number
    solveRate: number
  }
  createdAt: Date
}

const problemSchema = new Schema<IProblem>(
  {
    title: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      required: true,
    },
    tags: [String],
    constraints: String,
    examples: [
      {
        input: String,
        output: String,
        explanation: String,
      },
    ],
    testCases: [
      {
        input: { type: String, default: '' },
        expectedOutput: { type: String, required: true },
        isHidden: { type: Boolean, default: false },
        timeLimit: { type: Number, default: 2000 },
        memoryLimit: { type: Number, default: 256 },
      },
    ],
    starterCode: {
      cpp: String,
      python: String,
      javascript: String,
      java: String,
    },
    metadata: {
      timesUsed: { type: Number, default: 0 },
      avgSolveTime: { type: Number, default: 0 },
      solveRate: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
)

problemSchema.index({ difficulty: 1 })
problemSchema.index({ tags: 1 })

export const Problem = mongoose.model<IProblem>('Problem', problemSchema)
