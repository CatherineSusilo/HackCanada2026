import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { z } from 'zod';
import axios from 'axios';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = Router();

async function getUserId(req: AuthRequest): Promise<string> {
  const auth0Id = req.auth?.payload?.sub;
  if (!auth0Id) throw new Error('Unauthorized');
  const user = await prisma.user.findUnique({ where: { auth0Id } });
  if (!user) throw new Error('User not found');
  return user.id;
}

const createCharacterSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  personality: z.string().optional(),
  icon: z.string().optional(),
});

const updateCharacterSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  personality: z.string().optional(),
  icon: z.string().optional(),
  voiceId: z.string().optional(),
  voiceName: z.string().optional(),
});

// GET / — list all user characters with story stats
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = await getUserId(req);
    const characters = await prisma.character.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(characters);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get characters', details: error.message });
  }
});

// GET /:id — single character with detailed stats
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = await getUserId(req);
    const character = await prisma.character.findFirst({
      where: { id: req.params.id, userId },
    });
    if (!character) return res.status(404).json({ error: 'Character not found' });

    let stories: any[] = [];
    if (character.storyIds.length > 0) {
      stories = await prisma.storySession.findMany({
        where: { id: { in: character.storyIds } },
        select: { id: true, storyTitle: true, startTime: true, completed: true, duration: true },
        orderBy: { startTime: 'desc' },
        take: 20,
      });
    }

    res.json({ ...character, stories });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to get character', details: error.message });
  }
});

// POST / — create character
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = await getUserId(req);
    const data = createCharacterSchema.parse(req.body);
    const character = await prisma.character.create({
      data: {
        userId,
        name: data.name,
        description: data.description,
        personality: data.personality || '',
        icon: data.icon || '🧸',
      },
    });
    res.status(201).json(character);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to create character', details: error.message });
  }
});

// PATCH /:id — update character
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = await getUserId(req);
    const data = updateCharacterSchema.parse(req.body);
    const existing = await prisma.character.findFirst({ where: { id: req.params.id, userId } });
    if (!existing) return res.status(404).json({ error: 'Character not found' });

    const character = await prisma.character.update({
      where: { id: req.params.id },
      data,
    });
    res.json(character);
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to update character', details: error.message });
  }
});

// DELETE /:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = await getUserId(req);
    const existing = await prisma.character.findFirst({ where: { id: req.params.id, userId } });
    if (!existing) return res.status(404).json({ error: 'Character not found' });

    await prisma.character.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to delete character', details: error.message });
  }
});

// POST /:id/match-voice — use Gemini to pick the best ElevenLabs voice for a character
router.post('/:id/match-voice', async (req: AuthRequest, res: Response) => {
  try {
    const userId = await getUserId(req);
    const character = await prisma.character.findFirst({ where: { id: req.params.id, userId } });
    if (!character) return res.status(404).json({ error: 'Character not found' });

    if (!process.env.ELEVENLABS_API_KEY || !process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: 'API keys not configured' });
    }

    const voicesRes = await axios.get('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': process.env.ELEVENLABS_API_KEY },
    });
    const voices = voicesRes.data.voices || [];

    const voiceSummary = voices.map((v: any) => ({
      id: v.voice_id,
      name: v.name,
      labels: v.labels || {},
      description: v.description || '',
    }));

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

    const prompt = `You are helping pick the best voice for a bedtime story character.

Character:
- Name: ${character.name}
- Description: ${character.description}
- Personality: ${character.personality || 'not specified'}

Available voices:
${JSON.stringify(voiceSummary, null, 1)}

Pick the single best matching voice for this character. Consider the character's personality, age implications, gender, and tone.

Return ONLY valid JSON, no markdown:
{"voiceId":"...","voiceName":"...","reason":"one sentence explaining why this voice fits"}`;

    const result = await model.generateContent(prompt);
    let text = result.response.text();
    if (!text) throw new Error('Empty response');
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const match = JSON.parse(text);

    await prisma.character.update({
      where: { id: character.id },
      data: { voiceId: match.voiceId, voiceName: match.voiceName },
    });

    res.json(match);
  } catch (error: any) {
    console.error('Voice matching failed:', error.message);
    res.status(500).json({ error: 'Failed to match voice', details: error.message });
  }
});

export default router;
