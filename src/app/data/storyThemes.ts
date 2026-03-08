export interface StoryTheme {
  id: number;
  name: string;
  description: string;
  icon: string;
}

export const DEFAULT_STORY_THEMES: StoryTheme[] = [
  { id: 1, name: 'enchanted forest', description: 'magical creatures and hidden paths', icon: '🌲' },
  { id: 2, name: 'ocean adventure', description: 'underwater worlds and friendly sea life', icon: '🌊' },
  { id: 3, name: 'space explorer', description: 'stars, planets, and cosmic journeys', icon: '✨' },
  { id: 4, name: 'cozy village', description: 'warm homes and kind neighbors', icon: '🏡' },
  { id: 5, name: 'friendly dragons', description: 'gentle dragons and castle tales', icon: '🐉' },
  { id: 6, name: 'bedtime circus', description: 'soft acrobats and sleepy performers', icon: '🎪' },
];
