"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../../config/db"));
const authMiddleware_1 = require("../../middleware/authMiddleware");
const router = (0, express_1.Router)();
async function isVideoUnlocked(userId, videoId) {
    const target = await db_1.default.video.findUnique({
        where: { id: videoId },
        include: {
            section: {
                select: { subject_id: true },
            },
        },
    });
    if (!target) {
        return false;
    }
    const videosInSubject = await db_1.default.video.findMany({
        where: { section: { subject_id: target.section.subject_id } },
        orderBy: [{ section: { order_index: 'asc' } }, { order_index: 'asc' }],
        select: { id: true },
    });
    const targetIndex = videosInSubject.findIndex((video) => video.id === videoId);
    if (targetIndex <= 0) {
        return true;
    }
    const previousVideoId = videosInSubject[targetIndex - 1].id;
    const previousProgress = await db_1.default.videoProgress.findUnique({
        where: {
            user_id_video_id: {
                user_id: userId,
                video_id: previousVideoId,
            },
        },
        select: { is_completed: true },
    });
    return Boolean(previousProgress?.is_completed);
}
// GET /api/progress/videos/:videoId
router.get('/videos/:videoId', authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const videoId = parseInt(req.params.videoId, 10);
        const userId = req.user.userId;
        const progress = await db_1.default.videoProgress.findUnique({
            where: {
                user_id_video_id: { user_id: userId, video_id: videoId },
            },
        });
        res.json(progress || { last_position_seconds: 0, is_completed: false });
    }
    catch (error) {
        console.error('Get progress error:', error);
        res.status(500).json({ error: 'Failed to fetch progress' });
    }
});
// POST /api/progress/videos/:videoId
router.post('/videos/:videoId', authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const videoId = parseInt(req.params.videoId, 10);
        const userId = req.user.userId;
        const { last_position_seconds, is_completed } = req.body;
        const unlocked = await isVideoUnlocked(userId, videoId);
        if (!unlocked) {
            res.status(403).json({ error: 'Video is locked. Complete previous video first.' });
            return;
        }
        const progress = await db_1.default.videoProgress.upsert({
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
    }
    catch (error) {
        console.error('Update progress error:', error);
        res.status(500).json({ error: 'Failed to update progress' });
    }
});
// GET /api/progress/subjects/:subjectId
router.get('/subjects/:subjectId', authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const subjectId = parseInt(req.params.subjectId, 10);
        const userId = req.user.userId;
        // Get all videos in subject
        const sections = await db_1.default.section.findMany({
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
        const progress = await db_1.default.videoProgress.findMany({
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
    }
    catch (error) {
        console.error('Get subject progress error:', error);
        res.status(500).json({ error: 'Failed to fetch subject progress' });
    }
});
// GET /api/progress/overview
router.get('/overview', authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const subjects = await db_1.default.subject.findMany({
            where: { is_published: true },
            include: {
                sections: {
                    include: {
                        videos: { select: { id: true } },
                    },
                },
            },
        });
        const allVideoIds = subjects.flatMap((s) => s.sections.flatMap((sec) => sec.videos.map((v) => v.id)));
        const allProgress = await db_1.default.videoProgress.findMany({
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
    }
    catch (error) {
        console.error('Get progress overview error:', error);
        res.status(500).json({ error: 'Failed to fetch progress overview' });
    }
});
exports.default = router;
//# sourceMappingURL=routes.js.map