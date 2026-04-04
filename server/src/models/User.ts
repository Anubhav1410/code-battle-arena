import mongoose, { Schema, Document } from 'mongoose'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export interface IUser extends Document {
  username: string
  email: string
  passwordHash: string
  role: 'user' | 'admin'
  rating: {
    elo: number
    wins: number
    losses: number
    draws: number
    history: Array<{ date: Date; elo: number; matchId: mongoose.Types.ObjectId }>
  }
  stats: {
    totalMatches: number
    avgSolveTime: number
    fastestSolve: number
    problemsSolved: number
    winStreak: number
    bestWinStreak: number
    languageDistribution: Map<string, number>
  }
  preferredLanguage: string
  avatar: string
  lastActive: Date
  createdAt: Date
  comparePassword(password: string): Promise<boolean>
}

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      minlength: 3,
      maxlength: 20,
      match: /^[a-zA-Z0-9_]+$/,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    rating: {
      elo: { type: Number, default: 1200 },
      wins: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      draws: { type: Number, default: 0 },
      history: [
        {
          date: { type: Date, default: Date.now },
          elo: Number,
          matchId: { type: Schema.Types.ObjectId, ref: 'Match' },
        },
      ],
    },
    stats: {
      totalMatches: { type: Number, default: 0 },
      avgSolveTime: { type: Number, default: 0 },
      fastestSolve: { type: Number, default: 0 },
      problemsSolved: { type: Number, default: 0 },
      winStreak: { type: Number, default: 0 },
      bestWinStreak: { type: Number, default: 0 },
      languageDistribution: { type: Map, of: Number, default: {} },
    },
    preferredLanguage: {
      type: String,
      default: 'cpp',
    },
    avatar: String,
    lastActive: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
)

userSchema.pre('save', async function (next) {
  if (this.isModified('passwordHash') && !this.passwordHash.startsWith('$2a$')) {
    this.passwordHash = await bcrypt.hash(this.passwordHash, 12)
  }

  if (!this.avatar) {
    const hash = crypto.createHash('md5').update(this.email.toLowerCase()).digest('hex')
    this.avatar = `https://gravatar.com/avatar/${hash}?d=retro`
  }

  next()
})

userSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.passwordHash)
}

userSchema.set('toJSON', {
  transform(_doc, ret) {
    const obj = { ...ret }
    delete (obj as Record<string, unknown>).passwordHash
    delete (obj as Record<string, unknown>).__v
    return obj
  },
})

export const User = mongoose.model<IUser>('User', userSchema)
