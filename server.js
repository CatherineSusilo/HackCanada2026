import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { fal } from '@fal-ai/client';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);

// fal.ai will use FAL_KEY from environment variables automatically

app.post('/api/generate-story', async (req, res) => {
  try {
    const { profile } = req.body;

    if (!profile) {
      return res.status(400).json({ error: 'Profile is required' });
    }

    const toneDescriptions = {
      calming: 'Use a gentle, soothing tone with peaceful imagery and slow pacing. Focus on relaxing descriptions and comforting themes.',
      energetic: 'Use an exciting, vibrant tone with dynamic descriptions and engaging action. Keep the energy high but appropriate for bedtime.',
      sad: 'Use a thoughtful, empathetic tone that validates emotions while providing comfort. The story should be gentle and understanding.',
      adventurous: 'Use a sense of wonder and discovery. Include mysterious elements and brave exploration while maintaining a bedtime-appropriate pace.',
      none: 'Use a neutral, natural storytelling tone. Keep it engaging but balanced.',
    };

    const initialStateDescriptions = {
      'wound-up': 'The child is full of energy and needs a story that gradually calms them down. Start with more engaging elements and progressively become more soothing.',
      'normal': 'The child is ready for a story. Use a balanced approach that entertains while gently guiding towards sleep.',
      'almost-there': 'The child is already very sleepy. Use extremely gentle, peaceful language from the start.',
    };

    const prompt = `You are a master bedtime storyteller. Generate a beautiful, engaging bedtime story that is approximately 250 words long.

Child's Details:
- Name: ${profile.name}
- Age: ${profile.age} years old
- Current state: ${initialStateDescriptions[profile.initialState]}
- Desired storytelling tone: ${profile.storytellingTone} - ${toneDescriptions[profile.storytellingTone]}

Story Theme/Prompt from Parent: ${profile.parentPrompt}

Requirements:
1. Make the story exactly around 250 words
2. Include ${profile.name} as the main character
3. Follow the ${profile.storytellingTone} tone throughout
4. Base the story on this theme: "${profile.parentPrompt}"
5. Structure the story with:
   - An engaging beginning that captures attention
   - A gentle middle with wonderful imagery
   - A peaceful, soothing ending that guides towards sleep
6. Use age-appropriate language for a ${profile.age}-year-old
7. Include sensory details that create a calming, immersive experience
8. The story should gradually become more peaceful and slower-paced as it progresses
9. End with ${profile.name} feeling safe, content, and ready for sleep
10. Do not include a title, just the story text
11. IMPORTANT: Break the story into short paragraphs of ONLY 1-2 sentences each. Each paragraph should be separated by a newline. This is crucial for pacing and narration.

Generate the story now:`;

    console.log('Attempting to generate story...');

    // Use the most stable model name
    const modelName = 'gemini-2.5-flash';
    
    try {
      console.log(`Using model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const response = result.response;
      const story = response.text();

      console.log(`✓ Success! Generated ${story.length} characters`);
      
      // Generate image prompts for each paragraph
      const paragraphs = story.split('\n').filter(p => p.trim().length > 0);
      const imagePrompts = await generateImagePrompts(paragraphs, profile);
      
      return res.json({ story, imagePrompts, modelUsed: modelName });
    } catch (error) {
      const errMsg = error?.message || error?.toString() || 'Unknown error';
      console.error('Generation failed:', errMsg);
      throw error;
    }

  } catch (error) {
    console.error('Story generation error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate story',
      details: error.toString()
    });
  }
});

// Generate image description prompts for each paragraph
async function generateImagePrompts(paragraphs, profile) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  
  const imagePrompts = [];
  
  for (let i = 0; i < Math.min(paragraphs.length, 10); i++) {
    const paragraph = paragraphs[i];
    
    try {
      const prompt = `Based on this bedtime story paragraph for a ${profile.age}-year-old child, create a SHORT image description (max 30 words) suitable for ${profile.storytellingTone} bedtime imagery. Focus on peaceful, dreamy, child-friendly visuals. Be specific and visual.

Paragraph: "${paragraph}"

Generate ONLY the image description, nothing else.`;

      const result = await model.generateContent(prompt);
      const imageDesc = result.response.text().trim();
      
      imagePrompts.push({
        paragraphIndex: i,
        prompt: imageDesc
      });
      
      console.log(`Generated image prompt ${i + 1}/${paragraphs.length}`);
    } catch (error) {
      console.error(`Failed to generate image prompt for paragraph ${i}:`, error.message);
      imagePrompts.push({
        paragraphIndex: i,
        prompt: `A peaceful, dreamy bedtime scene for ${profile.name}`
      });
    }
  }
  
  return imagePrompts;
}

// Generate image using Flux via fal.ai
app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, paragraphIndex } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Image prompt is required' });
    }

    console.log(`Generating image for paragraph ${paragraphIndex}...`);

    // Use Flux Schnell for fast generation (2-4 seconds)
    const result = await fal.subscribe("fal-ai/flux/schnell", {
      input: {
        prompt: `${prompt}, dreamy illustration, soft colors, peaceful bedtime atmosphere, children's book style`,
        image_size: "landscape_16_9",
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: true
      },
      logs: true,
      onQueueUpdate: (update) => {
        if (update.status === "IN_PROGRESS") {
          console.log(`Image generation progress: ${paragraphIndex}`);
        }
      }
    });

    if (result.data && result.data.images && result.data.images[0]) {
      const imageUrl = result.data.images[0].url;
      console.log(`✓ Image generated successfully for paragraph ${paragraphIndex}`);
      return res.json({ imageUrl, paragraphIndex });
    } else {
      throw new Error('No image generated');
    }

  } catch (error) {
    console.error('Image generation failed:', error);
    return res.status(500).json({
      error: 'Failed to generate image',
      details: error.toString()
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Story API server running on http://localhost:${PORT}`);
  console.log(`Gemini API Key: ${process.env.VITE_GEMINI_API_KEY ? '✓ Configured' : '✗ Missing'}`);
  console.log('Server is listening for requests...');
}).on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use. Try closing other apps or change the port.`);
  } else {
    console.error('❌ Server error:', err);
  }
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  process.exit(1);
});