import type { ChildProfile } from '../App';

interface GenerateStoryParams {
  profile: ChildProfile;
}

const API_URL = 'http://localhost:3001/api/generate-story';

export async function generateFullStory({ profile }: GenerateStoryParams): Promise<string> {
  console.log('Sending request to story generation server...');

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ profile }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`✓ Story generated successfully using ${data.modelUsed}`);
    return data.story;
    
  } catch (error: any) {
    console.error('Story generation failed:', error);
    
    if (error.message?.includes('Failed to fetch')) {
      throw new Error('Cannot connect to story server. Make sure the server is running on port 3001.');
    }
    
    throw new Error(error.message || 'Failed to generate story');
  }
}

// Helper function to convert image files to base64 for potential future use with images
export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      resolve(base64.split(',')[1]); // Remove the data:image/... prefix
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
