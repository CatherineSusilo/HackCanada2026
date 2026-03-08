import { Router } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

const router = Router();

const createThemeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).default(''),
  icon: z.string().max(10).default('📖'),
});

router.get('/', async (req: AuthRequest, res) => {
  try {
    const auth0Id = req.auth?.payload?.sub;
    if (!auth0Id) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { auth0Id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const themes = await prisma.storyTheme.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
    });

    res.json(themes);
  } catch (error) {
    console.error('Get themes error:', error);
    res.status(500).json({ error: 'Failed to get themes' });
  }
});

router.post('/', async (req: AuthRequest, res) => {
  try {
    const auth0Id = req.auth?.payload?.sub;
    if (!auth0Id) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { auth0Id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const body = createThemeSchema.parse(req.body);

    const theme = await prisma.storyTheme.create({
      data: {
        userId: user.id,
        name: body.name,
        description: body.description,
        icon: body.icon,
      },
    });

    res.status(201).json(theme);
  } catch (error) {
    console.error('Create theme error:', error);
    res.status(500).json({ error: 'Failed to create theme' });
  }
});

router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const auth0Id = req.auth?.payload?.sub;
    if (!auth0Id) return res.status(401).json({ error: 'Unauthorized' });

    const user = await prisma.user.findUnique({ where: { auth0Id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const theme = await prisma.storyTheme.findUnique({ where: { id: req.params.id } });
    if (!theme || theme.userId !== user.id) {
      return res.status(404).json({ error: 'Theme not found' });
    }

    await prisma.storyTheme.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    console.error('Delete theme error:', error);
    res.status(500).json({ error: 'Failed to delete theme' });
  }
});

export default router;
