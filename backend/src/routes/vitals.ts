import { Router } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { z } from 'zod';

const router = Router();

const recordVitalsSchema = z.object({
  childId: z.string().optional(),
  storySessionId: z.string().optional(),
  pulseRate: z.number().optional(),
  breathingRate: z.number().optional(),
  signalQuality: z.number().optional(),
  timestamp: z.string().optional(),
});

// Record a vitals reading — public endpoint for iOS app (no auth required)
router.post('/record', async (req, res) => {
  try {
    const body = recordVitalsSchema.parse(req.body);

    const reading = await prisma.vitalsReading.create({
      data: {
        childId: body.childId,
        storySessionId: body.storySessionId,
        pulseRate: body.pulseRate,
        breathingRate: body.breathingRate,
        signalQuality: body.signalQuality,
        timestamp: body.timestamp ? new Date(body.timestamp) : new Date(),
      },
    });

    res.status(201).json(reading);
  } catch (error) {
    console.error('Record vitals error:', error);
    res.status(500).json({ error: 'Failed to record vitals' });
  }
});

// Get latest vitals readings (public, for dashboard polling)
router.get('/latest', async (req, res) => {
  try {
    const { hours = '24' } = req.query;

    const since = new Date();
    since.setHours(since.getHours() - parseInt(hours as string));

    const readings = await prisma.vitalsReading.findMany({
      where: {
        timestamp: { gte: since },
      },
      orderBy: { timestamp: 'asc' },
    });

    res.json(readings);
  } catch (error) {
    console.error('Get latest vitals error:', error);
    res.status(500).json({ error: 'Failed to get latest vitals' });
  }
});

// Get vitals readings for a specific child (auth required)
router.get('/child/:childId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const auth0Id = req.auth?.payload?.sub;
    const { childId } = req.params;
    const { hours = '24' } = req.query;

    if (!auth0Id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { auth0Id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify child belongs to user
    const child = await prisma.child.findFirst({
      where: { id: childId, userId: user.id },
    });

    if (!child) {
      return res.status(404).json({ error: 'Child not found' });
    }

    const since = new Date();
    since.setHours(since.getHours() - parseInt(hours as string));

    const readings = await prisma.vitalsReading.findMany({
      where: {
        childId,
        timestamp: { gte: since },
      },
      orderBy: { timestamp: 'asc' },
    });

    res.json(readings);
  } catch (error) {
    console.error('Get child vitals error:', error);
    res.status(500).json({ error: 'Failed to get vitals' });
  }
});

// Get vitals for a specific story session (auth required)
router.get('/session/:storySessionId', authMiddleware, async (req: AuthRequest, res) => {
  try {
    const auth0Id = req.auth?.payload?.sub;
    const { storySessionId } = req.params;

    if (!auth0Id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
      where: { auth0Id },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify story session belongs to user's child
    const storySession = await prisma.storySession.findFirst({
      where: {
        id: storySessionId,
        child: { userId: user.id },
      },
    });

    if (!storySession) {
      return res.status(404).json({ error: 'Story session not found' });
    }

    const readings = await prisma.vitalsReading.findMany({
      where: { storySessionId },
      orderBy: { timestamp: 'asc' },
    });

    res.json(readings);
  } catch (error) {
    console.error('Get session vitals error:', error);
    res.status(500).json({ error: 'Failed to get session vitals' });
  }
});

export default router;
