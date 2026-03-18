import { Router, Request, Response } from 'express';
import prisma from '../../config/db';

const router = Router();

// GET /api/subjects
router.get('/', async (_req: Request, res: Response) => {
  try {
    const subjects = await prisma.subject.findMany({
      where: { is_published: true },
      orderBy: { created_at: 'desc' },
      include: {
        sections: {
          include: {
            videos: true,
          },
        },
      },
    });

    const result = subjects.map((s) => {
      const totalVideos = s.sections.reduce((acc, sec) => acc + sec.videos.length, 0);
      return {
        id: s.id,
        title: s.title,
        slug: s.slug,
        description: s.description,
        thumbnail: s.thumbnail,
        totalSections: s.sections.length,
        totalVideos,
        created_at: s.created_at,
      };
    });

    res.json(result);
  } catch (error) {
    console.error('Get subjects error:', error);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// GET /api/subjects/:subjectId
router.get('/:subjectId', async (req: Request, res: Response) => {
  try {
    const subjectId = parseInt(req.params.subjectId as string, 10);
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        sections: {
          orderBy: { order_index: 'asc' },
          include: {
            videos: {
              orderBy: { order_index: 'asc' },
            },
          },
        },
      },
    });

    if (!subject) {
      res.status(404).json({ error: 'Subject not found' });
      return;
    }

    res.json(subject);
  } catch (error) {
    console.error('Get subject error:', error);
    res.status(500).json({ error: 'Failed to fetch subject' });
  }
});

// GET /api/subjects/:subjectId/tree
router.get('/:subjectId/tree', async (req: Request, res: Response) => {
  try {
    const subjectId = parseInt(req.params.subjectId as string, 10);
    const subject = await prisma.subject.findUnique({
      where: { id: subjectId },
      include: {
        sections: {
          orderBy: { order_index: 'asc' },
          include: {
            videos: {
              orderBy: { order_index: 'asc' },
              select: {
                id: true,
                title: true,
                description: true,
                youtube_url: true,
                order_index: true,
                duration_seconds: true,
                section_id: true,
              },
            },
          },
        },
      },
    });

    if (!subject) {
      res.status(404).json({ error: 'Subject not found' });
      return;
    }

    res.json(subject);
  } catch (error) {
    console.error('Get subject tree error:', error);
    res.status(500).json({ error: 'Failed to fetch subject tree' });
  }
});

export default router;
