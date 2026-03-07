import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import axios from 'axios';

const router = Router();

interface ChildProfile {
  childId: string;
  name: string;
  age: number;
  storytellingTone: string;
  parentPrompt: string;
  initialState: string;
}

router.post('/story', async (req: AuthRequest, res: Response) => {
  try {
    const { profile } = req.body as { profile: ChildProfile };

    if (!profile || !profile.name || !profile.parentPrompt) {
      return res.status(400).json({ error: 'Invalid profile data' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    console.log('📖 Generating story for:', profile.name);

    let childData = null;
    if (profile.childId) {
      childData = await prisma.child.findUnique({
        where: { id: profile.childId },
        include: { preferences: true },
      });
    }

    const childPersonality = childData?.preferences?.personality || '';
    const childMedia = childData?.preferences?.favoriteMedia || '';

    const storyResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{
          parts: [{
            text: `You are a bedtime story narrator. Create a calming, soothing bedtime story told in third person.

Theme/idea: ${profile.parentPrompt}
Tone: ${profile.storytellingTone}
Target age: ${profile.age}
${childPersonality ? `Child's personality (use to tailor themes, NOT to address child): ${childPersonality}` : ''}
${childMedia ? `Child's interests (weave into plot naturally): ${childMedia}` : ''}

IMPORTANT RULES:
- Do NOT address or mention the child by name. Do NOT use "${profile.name}" in the story.
- Tell a story about characters, animals, or magical beings — NOT about the child.
- Use third person narration ("the little fox walked...", "she whispered...")
- The story should gradually slow down in pace and become dreamier as it progresses.
- 10-12 paragraphs, each 2-3 short sentences.
- Keep sentences short and simple — this will be displayed as subtitles.

Format: Return ONLY the story paragraphs, separated by double line breaks. No titles, no "The End".`,
          }],
        }],
        generationConfig: {
          temperature: 0.9,
          maxOutputTokens: 2048,
        },
      }
    );

    const story = storyResponse.data.candidates[0].content.parts[0].text;
    console.log('✅ Story generated');

    const imageStyle = 'dreamy digital painting, soft glowing lighting, cinematic wide shot, children illustration style, no text';
    
    let imagePrompts: any[] = [];
    try {
      console.log('🎨 Generating image prompts...');
      const imagePromptsResponse = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: [{
            parts: [{
              text: `Based on this bedtime story, create exactly 5 image prompts for key scenes.

Story:
${story}

Style: ${imageStyle}

Return ONLY a valid JSON array, no markdown, no code blocks:
[{"scene":"opening","prompt":"..."},{"scene":"middle1","prompt":"..."},{"scene":"middle2","prompt":"..."},{"scene":"climax","prompt":"..."},{"scene":"ending","prompt":"..."}]

Each prompt must be a single line with no line breaks. Be very descriptive and visual.`,
            }],
          }],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 1024,
          },
        }
      );

      let text = imagePromptsResponse.data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        console.warn('⚠️ No text in image prompts response:', JSON.stringify(imagePromptsResponse.data.candidates?.[0]));
      } else {
        console.log('📝 Raw image prompts text:', text.substring(0, 300));
        text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        // Fix line breaks inside JSON strings that Gemini sometimes produces
        text = text.replace(/\n/g, ' ').replace(/\r/g, '');
        // Fix any double spaces
        text = text.replace(/\s+/g, ' ');
        imagePrompts = JSON.parse(text);
        console.log('✅ Image prompts generated:', imagePrompts.length, 'prompts');
      }
    } catch (parseErr: any) {
      console.warn('⚠️ Image prompt generation/parse failed:', parseErr.response?.data || parseErr.message);
    }

    res.json({ story, imagePrompts, modelUsed: 'gemini-2.5-flash' });

  } catch (error: any) {
    console.error('❌ Story generation error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to generate story',
      details: error.response?.data || error.message 
    });
  }
});

// Generate image with fal.ai
router.post('/image', async (req: AuthRequest, res: Response) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.FAL_API_KEY) {
      return res.status(500).json({ error: 'FAL API key not configured' });
    }

    console.log('🎨 Generating image...');

    const response = await axios.post(
      'https://fal.run/fal-ai/fast-sdxl',
      {
        prompt,
        image_size: 'landscape_16_9',
        num_images: 1,
        enable_safety_checker: true,
      },
      {
        headers: {
          'Authorization': `Key ${process.env.FAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );

    console.log('📦 Fal.ai response keys:', Object.keys(response.data));
    const imageUrl = response.data?.images?.[0]?.url;
    if (!imageUrl) {
      throw new Error('No image URL in response');
    }

    console.log('✅ Image generated');
    res.json({ imageUrl });

  } catch (error: any) {
    console.error('❌ Image generation error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to generate image',
      details: error.response?.data || error.message 
    });
  }
});

export default router;
