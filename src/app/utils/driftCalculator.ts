export function calculateDriftScore(
  initialState: 'wound-up' | 'normal' | 'almost-there',
  elapsedSeconds: number
): number {
  const startScores = {
    'wound-up': 15,
    'normal': 35,
    'almost-there': 60,
  };

  const startScore = startScores[initialState];

  const targetDuration = 900;
  const progress = Math.min(elapsedSeconds / targetDuration, 1);

  const easedProgress = easeInOutCubic(progress);

  const score = startScore + (100 - startScore) * easedProgress;

  const noise = Math.sin(elapsedSeconds * 0.05) * 1;

  return Math.min(100, Math.max(0, score + noise));
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}
