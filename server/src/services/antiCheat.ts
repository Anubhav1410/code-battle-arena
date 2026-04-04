import { Match } from '../models/Match'

interface SuspiciousEvent {
  type: 'large_paste' | 'tab_switch' | 'code_similarity'
  playerId: string
  timestamp: number
  details: string
}

// Jaccard similarity on tokenized code
function tokenize(code: string): Set<string> {
  return new Set(
    code
      .replace(/[^a-zA-Z0-9_]/g, ' ')
      .split(/\s+/)
      .filter((t) => t.length > 1)
  )
}

export function jaccardSimilarity(code1: string, code2: string): number {
  const set1 = tokenize(code1)
  const set2 = tokenize(code2)

  if (set1.size === 0 && set2.size === 0) return 0

  let intersection = 0
  for (const token of set1) {
    if (set2.has(token)) intersection++
  }

  const union = set1.size + set2.size - intersection
  return union > 0 ? intersection / union : 0
}

export async function logSuspiciousEvent(
  matchId: string,
  event: SuspiciousEvent
): Promise<void> {
  try {
    await Match.findByIdAndUpdate(matchId, {
      $push: {
        events: {
          timestamp: event.timestamp,
          playerId: event.playerId,
          type: 'code_change' as const,
          data: {
            suspicious: true,
            suspiciousType: event.type,
            details: event.details,
          },
        },
      },
    })
  } catch {
    // non-critical, don't crash
  }
}

export async function checkCodeSimilarity(matchId: string): Promise<number> {
  const match = await Match.findById(matchId)
  if (!match || match.players.length < 2) return 0

  const code1 = match.players[0].finalCode || ''
  const code2 = match.players[1].finalCode || ''

  if (code1.length < 50 || code2.length < 50) return 0

  const similarity = jaccardSimilarity(code1, code2)

  if (similarity > 0.8) {
    await logSuspiciousEvent(matchId, {
      type: 'code_similarity',
      playerId: 'system',
      timestamp: Date.now(),
      details: `Code similarity: ${Math.round(similarity * 100)}%`,
    })
  }

  return similarity
}
