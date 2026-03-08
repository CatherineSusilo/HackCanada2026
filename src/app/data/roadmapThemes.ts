export interface RoadmapTheme {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  icon: string;
  requiredStories: number;
  totalStories: number;
  theme: string;
}

export const ROADMAP_THEMES: RoadmapTheme[] = [
  {
    id: 1,
    title: 'Bedtime Basics',
    subtitle: '5 stories about settling down',
    description: 'Learn the art of peaceful sleep',
    icon: '🌙',
    requiredStories: 0,
    totalStories: 5,
    theme: 'gentle bedtime routines and calming scenes',
  },
  {
    id: 2,
    title: 'Friendship Tales',
    subtitle: '5 stories about friends',
    description: 'Adventures with caring companions',
    icon: '🤝',
    requiredStories: 5,
    totalStories: 5,
    theme: 'friendship, kindness, and sharing',
  },
  {
    id: 3,
    title: 'Nature Wonders',
    subtitle: '5 stories in the forest',
    description: 'Explore magical woodlands',
    icon: '🌲',
    requiredStories: 10,
    totalStories: 5,
    theme: 'enchanted forests and woodland creatures',
  },
  {
    id: 4,
    title: 'Ocean Dreams',
    subtitle: '5 stories under the sea',
    description: 'Dive into peaceful waters',
    icon: '🌊',
    requiredStories: 15,
    totalStories: 5,
    theme: 'underwater kingdoms and sea adventures',
  },
  {
    id: 5,
    title: 'Space Voyage',
    subtitle: '5 stories among the stars',
    description: 'Float through the cosmos',
    icon: '⭐',
    requiredStories: 20,
    totalStories: 5,
    theme: 'starry journeys and space exploration',
  },
  {
    id: 6,
    title: 'Castle Chronicles',
    subtitle: '5 stories of brave knights',
    description: 'Find warmth and courage',
    icon: '🏰',
    requiredStories: 25,
    totalStories: 5,
    theme: 'castles, knights, and royal adventures',
  },
  {
    id: 7,
    title: 'Garden Magic',
    subtitle: '5 stories in bloom',
    description: 'Wander through flowers',
    icon: '🌸',
    requiredStories: 30,
    totalStories: 5,
    theme: 'magical gardens and blooming wonders',
  },
  {
    id: 8,
    title: 'Mountain Heights',
    subtitle: '5 stories on peaks',
    description: 'Climb to peaceful summits',
    icon: '⛰️',
    requiredStories: 35,
    totalStories: 5,
    theme: 'mountain adventures and high places',
  },
];

export function getNextTheme(currentThemeTitle: string): RoadmapTheme | null {
  const idx = ROADMAP_THEMES.findIndex(t => t.title === currentThemeTitle);
  if (idx === -1 || idx >= ROADMAP_THEMES.length - 1) return null;
  return ROADMAP_THEMES[idx + 1];
}
