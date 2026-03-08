import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function matchVoiceForCharacter(character: { name: string; description: string; personality: string }, voices: any[]): Promise<{ voiceId: string; voiceName: string } | null> {
  if (!voices.length) return null;
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const voiceSummary = voices.map((v: any) => ({
    id: v.voice_id,
    name: v.name,
    labels: v.labels || {},
    description: v.description || '',
  }));
  const prompt = `Pick the best voice for this bedtime story character.
Character: ${character.name} — ${character.description}. Personality: ${character.personality || 'gentle'}
Available voices: ${JSON.stringify(voiceSummary, null, 1)}
Return ONLY valid JSON: {"voiceId":"...","voiceName":"...","reason":"..."}`;
  const MODEL_CHAIN = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite'];
  for (const modelName of MODEL_CHAIN) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      let text = result.response.text().replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const match = JSON.parse(text);
      return { voiceId: match.voiceId, voiceName: match.voiceName };
    } catch (e: any) {
      if (e.message?.includes('429') || e.message?.includes('404')) continue;
      return null;
    }
  }
  return null;
}

const router = Router();

const MODEL_FALLBACK_CHAIN = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
];

async function generateWithFallback(genAI: InstanceType<typeof GoogleGenerativeAI>, prompt: string): Promise<{ text: string; modelUsed: string }> {
  for (const modelName of MODEL_FALLBACK_CHAIN) {
    try {
      console.log(`  🤖 Trying model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      console.log(`  ✅ Success with: ${modelName}`);
      return { text, modelUsed: modelName };
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.includes('429') || msg.includes('quota') || msg.includes('Too Many Requests')) {
        console.warn(`  ⚠️ ${modelName} quota exceeded, trying next...`);
        continue;
      }
      if (msg.includes('404') || msg.includes('not found')) {
        console.warn(`  ⚠️ ${modelName} not available, trying next...`);
        continue;
      }
      throw err;
    }
  }
  throw new Error('All Gemini models exhausted — quota exceeded on all available models. Please wait or check billing.');
}

interface StoryCharacter {
  id: string;
  name: string;
  description: string;
  personality: string;
  voiceId?: string;
}

interface ChildProfile {
  childId: string;
  name: string;
  age: number;
  storytellingTone: string;
  parentPrompt: string;
  initialState: string;
  interactionFrequency?: 'none' | 'every' | 'every3' | 'every5';
  storyLength?: 'short' | 'medium' | 'long';
  characters?: StoryCharacter[];
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

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

    // Determine paragraph count based on story length
    const lengthConfig = {
      short: { paragraphs: '10-12', sentences: '2-3' },
      medium: { paragraphs: '18-22', sentences: '3-4' },
      long: { paragraphs: '28-35', sentences: '3-5' },
    };
    const len = lengthConfig[profile.storyLength || 'medium'];

    // Build character context
    const chars = profile.characters || [];
    let characterSection = '';
    if (chars.length > 0) {
      characterSection = `\nSTORY CHARACTERS (these MUST appear as main characters in the story):
${chars.map((c, i) => `${i + 1}. ${c.name} — ${c.description}${c.personality ? `. Personality: ${c.personality}` : ''}`).join('\n')}
- Weave ALL listed characters naturally into the plot as named characters.
- Give each character dialogue and actions consistent with their personality.
- Characters should interact with each other meaningfully.
- IMPORTANT: Each character MUST have spoken dialogue using this exact format: "dialogue text," said ${chars[0]?.name || 'CharacterName'}.
- Always attribute dialogue by name after the quote (e.g. "Goodnight," whispered ${chars[0]?.name || 'CharacterName'}.)
- Use varied speech verbs: said, whispered, murmured, called, giggled, sighed, asked, replied, sang, hummed.\n`;
    }

    const dialogueInstructions = `
DIALOGUE RULES (VERY IMPORTANT):
- Every named character MUST speak at least 2-3 times throughout the story.
- Format dialogue EXACTLY like this: "Goodnight, little one," whispered Mama Bear.
- Always put the character's name RIGHT AFTER the speech verb.
- Use varied speech verbs: said, whispered, murmured, called, giggled, sighed, asked, replied, sang, hummed.
- Make dialogue warm, gentle, and age-appropriate.`;

    const storyPrompt = `You are a bedtime story narrator. Create a calming, soothing bedtime story told in third person.

Theme/idea: ${profile.parentPrompt}
Tone: ${profile.storytellingTone}
Target age: ${profile.age}
${childPersonality ? `Child's personality (use to tailor themes, NOT to address child): ${childPersonality}` : ''}
${childMedia ? `Child's interests (weave into plot naturally): ${childMedia}` : ''}
${characterSection}
IMPORTANT RULES:
- Do NOT address or mention the child by name. Do NOT use "${profile.name}" in the story.
- Tell a story about characters, animals, or magical beings — NOT about the child.
- Use third person narration ("the little fox walked...", "she whispered...")
- The story should gradually slow down in pace and become dreamier as it progresses.
- Write ${len.paragraphs} paragraphs, each ${len.sentences} sentences long. THIS IS IMPORTANT — do NOT write fewer paragraphs.
- Keep sentences short and simple — this will be displayed as subtitles.
- Make the story rich and detailed. Each paragraph should advance the plot meaningfully.
${dialogueInstructions}

Format: Return ONLY the story paragraphs, separated by double line breaks. No titles, no "The End".`;

    const storyResponse = await generateWithFallback(genAI, storyPrompt);
    const story = storyResponse.text;
    const usedModel = storyResponse.modelUsed;
    console.log('✅ Story generated with', usedModel);

    const imageStyle = 'dreamy digital painting, soft glowing lighting, cinematic wide shot, children illustration style, no text';
    
    let imagePrompts: any[] = [];
    try {
      console.log('🎨 Generating image prompts...');
      
      const imagePromptText = `Based on this bedtime story, create exactly 5 image prompts for key scenes.

Story:
${story}

Style: ${imageStyle}

Return ONLY a valid JSON array, no markdown, no code blocks:
[{"scene":"opening","prompt":"..."},{"scene":"middle1","prompt":"..."},{"scene":"middle2","prompt":"..."},{"scene":"climax","prompt":"..."},{"scene":"ending","prompt":"..."}]

Each prompt must be a single line with no line breaks. Be very descriptive and visual.`;

      const imageResult = await generateWithFallback(genAI, imagePromptText);
      let text = imageResult.text;
      
      if (!text) {
        console.warn('⚠️ No text in image prompts response');
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
      console.warn('⚠️ Image prompt generation/parse failed:', parseErr.message);
    }

    // Generate interactive learning elements based on frequency setting
    const freq = profile.interactionFrequency || 'none';
    let interactions: any[] = [];

    if (freq !== 'none') {
      try {
        const paragraphs = story.split('\n').filter((p: string) => p.trim().length > 0);
        const paraCount = paragraphs.length;
        const step = freq === 'every' ? 1 : freq === 'every3' ? 3 : 5;

        const indices: number[] = [];
        for (let i = step; i < paraCount - 1; i += step) {
          indices.push(i);
        }
        const count = indices.length;
        if (count === 0) indices.push(Math.floor(paraCount * 0.5));

        console.log(`🧩 Generating ${indices.length} interactions (freq: ${freq})...`);

        const types = ['choice', 'quiz', 'drawing'] as const;
        const interactionDescriptions = indices.map((idx, n) => {
          const t = types[n % types.length];
          const num = n + 1;
          if (t === 'choice') {
            return `  ${num}. Type "choice" at paragraphIndex ${idx}: Give 3 options (emoji + text). ${profile.age <= 4 ? 'Emojis and 1-2 words only.' : 'Emojis with short phrases.'} Include "bridgeTexts" for each option and an "imagePrompt".`;
          } else if (t === 'quiz') {
            return `  ${num}. Type "quiz" at paragraphIndex ${idx}: A true/false question about the story so far. ${profile.age <= 4 ? 'Very simple.' : 'Age-appropriate.'} Include "correctAnswer" (boolean) and an "imagePrompt".`;
          } else {
            return `  ${num}. Type "drawing" at paragraphIndex ${idx}: A creative prompt to draw/photograph something the character needs. Include an "imagePrompt".`;
          }
        }).join('\n');

        const exampleObjects = indices.map((idx, n) => {
          const t = types[n % types.length];
          const id = `interaction_${n + 1}`;
          if (t === 'choice') {
            return `{"id":"${id}","type":"choice","paragraphIndex":${idx},"prompt":"...","imagePrompt":"...","options":[{"id":"a","emoji":"...","text":"..."},{"id":"b","emoji":"...","text":"..."},{"id":"c","emoji":"...","text":"..."}],"bridgeTexts":{"a":"...","b":"...","c":"..."}}`;
          } else if (t === 'quiz') {
            return `{"id":"${id}","type":"quiz","paragraphIndex":${idx},"prompt":"...","imagePrompt":"...","correctAnswer":true}`;
          } else {
            return `{"id":"${id}","type":"drawing","paragraphIndex":${idx},"prompt":"...","imagePrompt":"..."}`;
          }
        }).join(',\n  ');

        const interactionPrompt = `Based on this bedtime story, create ${indices.length} interactive learning moment(s) for a ${profile.age}-year-old child.

Story (${paraCount} paragraphs):
${story}

Create these interactions:
${interactionDescriptions}

Rules:
- Each "imagePrompt" should describe a dreamy children's illustration related to that interaction scene.
- Choice prompts: 3 options with emoji+text, plus bridgeTexts (a short continuation sentence per option).
- Quiz prompts: a true/false question with correctAnswer boolean.
- Drawing prompts: a fun creative ask tied to the plot.

Return ONLY a valid JSON array, no markdown, no code blocks:
[
  ${exampleObjects}
]`;

        const interactionResult = await generateWithFallback(genAI, interactionPrompt);
        let iText = interactionResult.text;

        if (iText) {
          iText = iText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
          interactions = JSON.parse(iText);
          interactions.forEach((i: any) => { i.response = null; });
          console.log(`✅ Generated ${interactions.length} interactions`);
        }
      } catch (parseErr: any) {
        console.warn('⚠️ Interaction generation failed (non-critical):', parseErr.message);
      }
    }

    // Auto-extract characters from the story and add to character pool
    let characterVoices: Array<{ name: string; voiceId: string }> = chars.filter(c => c.voiceId).map(c => ({
      name: c.name,
      voiceId: c.voiceId!,
    }));
    let allCharacterIds = chars.map(c => c.id);

    const auth0Id = req.auth?.payload?.sub;
    if (auth0Id) {
      try {
        const user = await prisma.user.findUnique({ where: { auth0Id } });
        if (user) {
          console.log('🔍 Extracting characters from story...');
          const extractPrompt = `Extract all named characters from this bedtime story. Return ONLY a valid JSON array, no markdown:
[{"name":"CharacterName","description":"brief 1-sentence description","personality":"1-2 personality traits","icon":"single emoji"}]

Story:
${story}

Rules:
- Only include characters that SPEAK or ACT in the story (not just mentioned).
- Use the character's exact name from the story.
- The icon should be a single emoji that best represents the character.
- Keep descriptions short and child-friendly.`;

          const extractResult = await generateWithFallback(genAI, extractPrompt);
          let eText = extractResult.text;
          if (eText) {
            eText = eText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            const extracted: Array<{ name: string; description: string; personality: string; icon: string }> = JSON.parse(eText);
            console.log(`✅ Extracted ${extracted.length} characters from story`);

            let voices: any[] = [];
            if (process.env.ELEVENLABS_API_KEY) {
              try {
                const voicesRes = await axios.get('https://api.elevenlabs.io/v1/voices', {
                  headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY },
                });
                voices = voicesRes.data.voices || [];
              } catch {}
            }

            const db = prisma as any;
            const existingChars: Array<{ id: string; name: string; voiceId: string | null; voiceName: string | null }> = await db.character.findMany({
              where: { userId: user.id },
              select: { id: true, name: true, voiceId: true, voiceName: true },
            });

            for (const ec of extracted) {
              const existing = existingChars.find(
                (c: any) => c.name.toLowerCase() === ec.name.toLowerCase()
              );
              if (existing) {
                if (!allCharacterIds.includes(existing.id)) {
                  allCharacterIds.push(existing.id);
                }
                if (existing.voiceId && !characterVoices.find(cv => cv.name.toLowerCase() === ec.name.toLowerCase())) {
                  characterVoices.push({ name: ec.name, voiceId: existing.voiceId });
                }
              } else {
                let voiceId: string | null = null;
                let voiceName: string | null = null;
                if (voices.length > 0 && process.env.GEMINI_API_KEY) {
                  const match = await matchVoiceForCharacter(ec, voices);
                  if (match) {
                    voiceId = match.voiceId;
                    voiceName = match.voiceName;
                    characterVoices.push({ name: ec.name, voiceId: match.voiceId });
                    console.log(`  🎤 Matched voice for ${ec.name}: ${match.voiceName}`);
                  }
                }
                const newChar = await db.character.create({
                  data: {
                    userId: user.id,
                    name: ec.name,
                    description: ec.description,
                    personality: ec.personality || '',
                    icon: ec.icon || '🧸',
                    voiceId,
                    voiceName,
                  },
                });
                allCharacterIds.push(newChar.id);
                existingChars.push({ id: newChar.id, name: ec.name, voiceId, voiceName });
                console.log(`  ✨ Created character: ${ec.name}`);
              }
            }
          }
        }
      } catch (extractErr: any) {
        console.warn('⚠️ Character extraction failed (non-critical):', extractErr.message);
      }
    }

    res.json({ story, imagePrompts, interactions, characterVoices, characterIds: allCharacterIds, modelUsed: usedModel });

  } catch (error: any) {
    console.error('❌ Story generation error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to generate story',
      details: error.response?.data || error.message 
    });
  }
});

// Generate image with Gemini Flash image generation (free tier)
router.post('/image', async (req: AuthRequest, res: Response) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    console.log('🎨 Generating image with Gemini Flash...');

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp-image-generation:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: `Generate an image: ${prompt}` }] }],
        generationConfig: {
          responseModalities: ['IMAGE', 'TEXT'],
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 60000,
      }
    );

    console.log('📦 Gemini image response received');
    const parts = response.data?.candidates?.[0]?.content?.parts || [];
    const imagePart = parts.find((p: any) => p.inlineData);
    if (!imagePart) {
      throw new Error('No image data in response');
    }

    const { mimeType, data: base64Image } = imagePart.inlineData;
    const imageUrl = `data:${mimeType};base64,${base64Image}`;
    
    console.log('✅ Image generated successfully');
    res.json({ imageUrl });

  } catch (error: any) {
    console.error('❌ Image generation error:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to generate image',
      details: error.response?.data || error.message 
    });
  }
});

// Analyze pasted text and extract a theme + story script from it
router.post('/analyze-text', async (req: AuthRequest, res: Response) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length < 20) {
      return res.status(400).json({ error: 'Please provide at least a few sentences of text' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'Gemini API key not configured' });
    }

    console.log('🔍 Analyzing text for theme extraction...');

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

    const prompt = `Analyze this text and extract a bedtime story theme from it. Then rewrite it as a soothing bedtime story suitable for children ages 3-8.

Text:
${text.substring(0, 5000)}

Return ONLY valid JSON, no markdown:
{
  "theme": {
    "name": "short theme name (2-4 words)",
    "description": "one sentence description",
    "icon": "single emoji that fits"
  },
  "story": "The rewritten bedtime story, 10-12 paragraphs separated by double line breaks. Calming, dreamy tone. Third person narration."
}`;

    const result = await generateWithFallback(genAI, prompt);
    let responseText = result.text;

    if (!responseText) {
      throw new Error('Empty response from Gemini');
    }

    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(responseText);

    console.log('✅ Text analyzed, theme:', parsed.theme?.name);
    res.json(parsed);

  } catch (error: any) {
    console.error('❌ Text analysis error:', error.message);
    res.status(500).json({
      error: 'Failed to analyze text',
      details: error.message,
    });
  }
});

export default router;
