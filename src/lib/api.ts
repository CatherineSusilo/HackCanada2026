import { useAuth0 } from '@auth0/auth0-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const useApi = () => {
  const { getAccessTokenSilently } = useAuth0();

  const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
    try {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
          scope: 'openid profile email',
        }
      });
      
      console.log('🔑 Access Token (first 50 chars):', token.substring(0, 50) + '...');
      console.log('📍 Making request to:', `${API_URL}${endpoint}`);
      
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          ...options.headers,
        },
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error('❌ API Error:', error);
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('🔥 fetchWithAuth error:', error);
      throw error;
    }
  };

  return {
    // User
    getProfile: () => fetchWithAuth('/users/me'),
    updateProfile: (data: any) => fetchWithAuth('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

    // Children
    getChildren: () => fetchWithAuth('/children'),
    getChild: (childId: string) => fetchWithAuth(`/children/${childId}`),
    createChild: (data: any) => fetchWithAuth('/children', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    updateChild: (childId: string, data: any) => fetchWithAuth(`/children/${childId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    deleteChild: (childId: string) => fetchWithAuth(`/children/${childId}`, {
      method: 'DELETE',
    }),

    // Stories
    getStories: (childId: string, limit = 20, offset = 0) => 
      fetchWithAuth(`/stories/child/${childId}?limit=${limit}&offset=${offset}`),
    getStory: (storyId: string) => fetchWithAuth(`/stories/${storyId}`),
    createStory: (data: any) => fetchWithAuth('/stories', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    updateStory: (storyId: string, data: any) => fetchWithAuth(`/stories/${storyId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    deleteStory: (storyId: string) => fetchWithAuth(`/stories/${storyId}`, {
      method: 'DELETE',
    }),

    // Sleep
    getSleepSessions: (childId: string, limit = 30, offset = 0) => 
      fetchWithAuth(`/sleep/child/${childId}?limit=${limit}&offset=${offset}`),
    getSleepSession: (sleepId: string) => fetchWithAuth(`/sleep/${sleepId}`),
    createSleepSession: (data: any) => fetchWithAuth('/sleep', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    updateSleepSession: (sleepId: string, data: any) => fetchWithAuth(`/sleep/${sleepId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
    deleteSleepSession: (sleepId: string) => fetchWithAuth(`/sleep/${sleepId}`, {
      method: 'DELETE',
    }),

    // Statistics
    getSleepStats: (childId: string, days = 30) => 
      fetchWithAuth(`/statistics/sleep/${childId}?days=${days}`),
    getStoryStats: (childId: string, days = 30) => 
      fetchWithAuth(`/statistics/stories/${childId}?days=${days}`),
    getInsights: (childId: string) => fetchWithAuth(`/statistics/insights/${childId}`),

    // Vitals
    getLatestVitals: (hours = 24) => fetchWithAuth(`/vitals/latest?hours=${hours}`),
    getChildVitals: (childId: string, hours = 24) => 
      fetchWithAuth(`/vitals/child/${childId}?hours=${hours}`),
    getSessionVitals: (storySessionId: string) => 
      fetchWithAuth(`/vitals/session/${storySessionId}`),

    // Audio
    generateAudio: async (text: string, voiceId?: string) => {
      const token = await getAccessTokenSilently({
        authorizationParams: {
          audience: import.meta.env.VITE_AUTH0_AUDIENCE,
          scope: 'openid profile email',
        }
      });

      const response = await fetch(`${API_URL}/audio`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text, voiceId }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error('Audio API error:', response.status, errorBody);
        throw new Error(`Failed to generate audio: ${response.status} ${errorBody}`);
      }

      return response.blob();
    },
    getVoices: () => fetchWithAuth('/audio/voices'),

    // Interactions
    saveInteraction: (storyId: string, interactionId: string, response: any) =>
      fetchWithAuth(`/stories/${storyId}/interaction`, {
        method: 'PATCH',
        body: JSON.stringify({ interactionId, response }),
      }),

    // Themes
    getThemes: () => fetchWithAuth('/themes'),
    createTheme: (data: { name: string; description: string; icon: string }) =>
      fetchWithAuth('/themes', { method: 'POST', body: JSON.stringify(data) }),
    deleteTheme: (themeId: string) =>
      fetchWithAuth(`/themes/${themeId}`, { method: 'DELETE' }),

    // Characters
    getCharacters: () => fetchWithAuth('/characters'),
    getCharacter: (id: string) => fetchWithAuth(`/characters/${id}`),
    createCharacter: (data: { name: string; description: string; personality?: string; icon?: string }) =>
      fetchWithAuth('/characters', { method: 'POST', body: JSON.stringify(data) }),
    updateCharacter: (id: string, data: any) =>
      fetchWithAuth(`/characters/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteCharacter: (id: string) =>
      fetchWithAuth(`/characters/${id}`, { method: 'DELETE' }),
    matchCharacterVoice: (id: string) =>
      fetchWithAuth(`/characters/${id}/match-voice`, { method: 'POST' }),

    // Story generation
    generateStory: (profile: any) => fetchWithAuth('/generate/story', {
      method: 'POST',
      body: JSON.stringify({ profile }),
    }),
    generateImage: (prompt: string) => fetchWithAuth('/generate/image', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    }),
    analyzeText: (text: string) => fetchWithAuth('/generate/analyze-text', {
      method: 'POST',
      body: JSON.stringify({ text }),
    }),

    // Voice cloning
    cloneVoice: (name: string, description: string, files: string[]) =>
      fetchWithAuth('/audio/clone-voice', {
        method: 'POST',
        body: JSON.stringify({ name, description, files }),
      }),
  };
};
