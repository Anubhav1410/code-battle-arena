import mongoose, { Schema, Document } from 'mongoose'

export interface IMatchPlayer {
  userId: mongoose.Types.ObjectId
  username: string
  ratingBefore: number
  ratingAfter: number
  language: string
  finalCode: string
  testCasesPassed: number
  totalTestCases: number
  solveTime: number
  status: 'solved' | 'partial' | 'unsolved'
}

export interface IMatchEvent {
  timestamp: number
  playerId: string
  type: 'code_change' | 'submit' | 'run_tests' | 'test_result'
  data: unknown
}

export interface IMatch extends Document {
  players: IMatchPlayer[]
  problemId: mongoose.Types.ObjectId
  winner: mongoose.Types.ObjectId | null
  result: 'player1' | 'player2' | 'draw' | 'timeout'
  state: 'waiting' | 'countdown' | 'in_progress' | 'finished'
  duration: number
  events: IMatchEvent[]
  spectatorCount: number
  startedAt: Date | null
  endedAt: Date | null
  createdAt: Date
}

const matchSchema = new Schema<IMatch>(
  {
    players: [
      {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        username: { type: String, required: true },
        ratingBefore: { type: Number, required: true },
        ratingAfter: { type: Number, default: 0 },
        language: { type: String, default: 'cpp' },
        finalCode: { type: String, default: '' },
        testCasesPassed: { type: Number, default: 0 },
        totalTestCases: { type: Number, default: 0 },
        solveTime: { type: Number, default: 0 },
        status: { type: String, enum: ['solved', 'partial', 'unsolved'], default: 'unsolved' },
      },
    ],
    problemId: { type: Schema.Types.ObjectId, ref: 'Problem', required: true },
    winner: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    result: { type: String, enum: ['player1', 'player2', 'draw', 'timeout'], default: 'timeout' },
    state: {
      type: String,
      enum: ['waiting', 'countdown', 'in_progress', 'finished'],
      default: 'waiting',
    },
    duration: { type: Number, default: 0 },
    events: [
      {
        timestamp: Number,
        playerId: String,
        type: { type: String, enum: ['code_change', 'submit', 'run_tests', 'test_result'] },
        data: Schema.Types.Mixed,
      },
    ],
    spectatorCount: { type: Number, default: 0 },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
  }
)

matchSchema.index({ state: 1 })
matchSchema.index({ 'players.userId': 1 })

export const Match = mongoose.model<IMatch>('Match', matchSchema)
