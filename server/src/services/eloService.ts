const K = 32

function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400))
}

export function calculateElo(
  ratingA: number,
  ratingB: number,
  actualScoreA: number
): { newRatingA: number; newRatingB: number } {
  const expectedA = expectedScore(ratingA, ratingB)
  const expectedB = expectedScore(ratingB, ratingA)
  const actualScoreB = 1 - actualScoreA

  const newRatingA = Math.round(ratingA + K * (actualScoreA - expectedA))
  const newRatingB = Math.round(ratingB + K * (actualScoreB - expectedB))

  return { newRatingA, newRatingB }
}
