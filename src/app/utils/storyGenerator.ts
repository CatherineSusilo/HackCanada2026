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
  const { name, favoriteAnimal, favoritePlace } = profile;

  const segments: Record<string, string[]> = {
    introduction: [
      `Once upon a time, in the heart of the ${favoritePlace}, there lived a young ${favoriteAnimal} named Luna.`,
      `Luna had soft fur that shimmered in the moonlight, and bright eyes full of curiosity.`,
      `One peaceful evening, Luna decided to explore a part of the ${favoritePlace} she had never seen before.`,
    ],
    rising: [
      `As Luna wandered deeper into the ${favoritePlace}, she noticed how the trees seemed to whisper gentle secrets.`,
      `The air was warm and carried the scent of wildflowers. Luna felt safe and content.`,
      `She came across a clearing bathed in silver moonlight, where the grass was soft as clouds.`,
    ],
    settling: [
      `Luna lay down in the grass and looked up at the stars. They twinkled like tiny lanterns in the sky.`,
      `A gentle breeze rustled through the leaves, creating a soft, soothing melody.`,
      `Luna's eyes began to feel heavy. The world around her seemed to slow down, becoming peaceful and still.`,
    ],
    drifting: [
      `The stars above grew brighter, and Luna felt herself becoming lighter, as if floating on a soft cloud.`,
      `Everything in the ${favoritePlace} was quiet now. Even the breeze had settled to a gentle whisper.`,
      `Luna's breathing slowed. She felt warm, safe, and perfectly at peace.`,
    ],
    resolution: [
      `Luna closed her eyes and smiled. She had found the most wonderful place in all the ${favoritePlace}.`,
      `The moon watched over her as she curled up, tucked her nose under her tail, and let the night embrace her.`,
      `And there, under the stars, Luna drifted into the softest, most peaceful sleep. The ${favoritePlace} was quiet. The world was still. Everything was exactly as it should be.`,
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
