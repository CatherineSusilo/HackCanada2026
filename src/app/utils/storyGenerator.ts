import type { ChildProfile } from '../App';

interface StorySegmentParams {
  profile: ChildProfile;
  driftScore: number;
  phase: number;
  elapsedSeconds: number;
}

export function generateStorySegment({
  profile,
  driftScore,
  phase,
  elapsedSeconds,
}: StorySegmentParams): string {
  const { name, parentPrompt, storytellingTone } = profile;
  
  // Use the parent's prompt as the story theme
  const storyTheme = parentPrompt || 'a magical adventure';

  // Tone-based story modifiers
  const toneModifiers = {
    calming: { pace: 'slowly and gently', atmosphere: 'peaceful and serene', feeling: 'calm and safe' },
    energetic: { pace: 'with excitement', atmosphere: 'vibrant and lively', feeling: 'excited and adventurous' },
    sad: { pace: 'thoughtfully', atmosphere: 'gentle and reflective', feeling: 'understood and comforted' },
    adventurous: { pace: 'with wonder', atmosphere: 'mysterious and enchanting', feeling: 'curious and brave' },
    none: { pace: 'naturally', atmosphere: 'comfortable', feeling: 'content' },
  };
  
  const tone = toneModifiers[storytellingTone];

  const segments: Record<string, string[]> = {
    introduction: [
      `Once upon a time, ${name} embarked on ${storyTheme}. The world around them felt ${tone.atmosphere}.`,
      `${name} discovered something wonderful ahead. They moved ${tone.pace}, feeling ${tone.feeling}.`,
      `In this special moment, ${name} began their journey. Everything seemed ${tone.atmosphere} and inviting.`,
    ],
    rising: [
      `As ${name} continued, the world around them became even more ${tone.atmosphere}.`,
      `${name} felt ${tone.feeling} as they explored deeper into the experience.`,
      `The journey was unfolding ${tone.pace}, revealing beautiful moments one by one.`,
    ],
    settling: [
      `${name} found a peaceful place to rest. The world felt ${tone.atmosphere} and welcoming.`,
      `Everything around ${name} moved ${tone.pace}, creating a soothing rhythm.`,
      `${name}'s mind began to quiet, feeling ${tone.feeling} in this moment.`,
    ],
    drifting: [
      `The world around ${name} grew softer. Everything moved ${tone.pace} now.`,
      `${name} felt ${tone.feeling}, wrapped in comfort and peace.`,
      `Time seemed to slow. ${name} let themselves drift into this ${tone.atmosphere} space.`,
    ],
    resolution: [
      `${name} closed their eyes and smiled. This had been a beautiful journey.`,
      `The world around ${name} was ${tone.atmosphere}. Everything was perfect.`,
      `And there, ${name} drifted into the softest, most peaceful sleep. All was well.`,
    ],
  };

  if (driftScore < 25) {
    return segments.introduction[phase % segments.introduction.length];
  } else if (driftScore < 50) {
    return segments.rising[phase % segments.rising.length];
  } else if (driftScore < 75) {
    return segments.settling[phase % segments.settling.length];
  } else if (driftScore < 85) {
    return segments.drifting[phase % segments.drifting.length];
  } else {
    return segments.resolution[Math.min(phase, segments.resolution.length - 1)];
  }
}
