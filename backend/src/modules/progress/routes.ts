import { Router, Response } from 'express';
import prisma from '../../config/db';
import { AuthRequest, authMiddleware } from '../../middleware/authMiddleware';

const router = Router();

// GET /api/progress/videos/:videoId
router.get('/videos/:videoId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const videoId = parseInt(req.params.videoId as string, 10);
    const userId = req.user!.userId;

    const progress = await prisma.videoProgress.findUnique({
      where: {
        user_id_video_id: { user_id: userId, video_id: videoId },
      },
    });

    res.json(progress || { last_position_seconds: 0, is_completed: false });
  } catch (error) {
    console.error('Get progress error:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// POST /api/progress/videos/:videoId
router.post('/videos/:videoId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const videoId = parseInt(req.params.videoId as string, 10);
    const userId = req.user!.userId;
    const { last_position_seconds, is_completed } = req.body;

    const progress = await prisma.videoProgress.upsert({
      where: {
        user_id_video_id: { user_id: userId, video_id: videoId },
      },
      update: {
        last_position_seconds: last_position_seconds ?? undefined,
        is_completed: is_completed ?? undefined,
        completed_at: is_completed ? new Date() : undefined,
      },
      create: {
        user_id: userId,
        video_id: videoId,
        last_position_seconds: last_position_seconds || 0,
        is_completed: is_completed || false,
        completed_at: is_completed ? new Date() : null,
      },
    });

    res.json(progress);
  } catch (error) {
    console.error('Update progress error:', error);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// GET /api/progress/subjects/:subjectId
router.get('/subjects/:subjectId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const subjectId = parseInt(req.params.subjectId as string, 10);
    const userId = req.user!.userId;

    // Get all videos in subject
    const sections = await prisma.section.findMany({
      where: { subject_id: subjectId },
      include: {
        videos: {
          select: { id: true },
        },
      },
    });

    const videoIds = sections.flatMap((s) => s.videos.map((v) => v.id));

    if (videoIds.length === 0) {
      res.json({ totalVideos: 0, completedVideos: 0, percentage: 0, progress: [] });
      return;
    }

    const progress = await prisma.videoProgress.findMany({
      where: {
        user_id: userId,
        video_id: { in: videoIds },
      },
    });

    const completedVideos = progress.filter((p) => p.is_completed).length;
    const percentage = Math.round((completedVideos / videoIds.length) * 100);

    res.json({
      totalVideos: videoIds.length,
      completedVideos,
      percentage,
      progress,
    });
  } catch (error) {
    console.error('Get subject progress error:', error);
    res.status(500).json({ error: 'Failed to fetch subject progress' });
  }
});

// GET /api/progress/overview
router.get('/overview', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;

    const subjects = await prisma.subject.findMany({
      where: { is_published: true },
      include: {
        sections: {
          include: {
            videos: { select: { id: true } },
          },
        },
      },
    });

    const allVideoIds = subjects.flatMap((s) =>
      s.sections.flatMap((sec) => sec.videos.map((v) => v.id))
    );

    const allProgress = await prisma.videoProgress.findMany({
      where: {
        user_id: userId,
        video_id: { in: allVideoIds },
      },
    });

    const progressMap = new Map(allProgress.map((p) => [p.video_id, p]));

    const overview = subjects.map((subject) => {
      const videoIds = subject.sections.flatMap((s) => s.videos.map((v) => v.id));
      const completed = videoIds.filter((id) => progressMap.get(id)?.is_completed).length;
      return {
        subjectId: subject.id,
        title: subject.title,
        slug: subject.slug,
        thumbnail: subject.thumbnail,
        totalVideos: videoIds.length,
        completedVideos: completed,
        percentage: videoIds.length > 0 ? Math.round((completed / videoIds.length) * 100) : 0,
      };
    });

    const totalVideos = allVideoIds.length;
    const totalCompleted = allProgress.filter((p) => p.is_completed).length;

    res.json({
      totalVideos,
      totalCompleted,
      overallPercentage: totalVideos > 0 ? Math.round((totalCompleted / totalVideos) * 100) : 0,
      subjects: overview,
    });
  } catch (error) {
    console.error('Get progress overview error:', error);
    res.status(500).json({ error: 'Failed to fetch progress overview' });
  }
});

export default router;
