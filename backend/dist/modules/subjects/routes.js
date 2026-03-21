"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../../config/db"));
const authMiddleware_1 = require("../../middleware/authMiddleware");
const router = (0, express_1.Router)();
// GET /api/subjects
router.get('/', async (_req, res) => {
    try {
        const subjects = await db_1.default.subject.findMany({
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
    }
    catch (error) {
        console.error('Get subjects error:', error);
        res.status(500).json({ error: 'Failed to fetch subjects' });
    }
});
// GET /api/subjects/:subjectId
router.get('/:subjectId', authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const subjectId = parseInt(req.params.subjectId, 10);
        const subject = await db_1.default.subject.findUnique({
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
        const totalVideos = subject.sections.reduce((acc, section) => acc + section.videos.length, 0);
        const completedVideos = await db_1.default.videoProgress.count({
            where: {
                user_id: req.user.userId,
                is_completed: true,
                video: {
                    section: { subject_id: subject.id },
                },
            },
        });
        res.json({
            ...subject,
            stats: {
                totalVideos,
                completedVideos,
                percentage: totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0,
            },
        });
    }
    catch (error) {
        console.error('Get subject error:', error);
        res.status(500).json({ error: 'Failed to fetch subject' });
    }
});
// GET /api/subjects/:subjectId/tree
router.get('/:subjectId/tree', authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const subjectId = parseInt(req.params.subjectId, 10);
        const subject = await db_1.default.subject.findUnique({
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
        const userId = req.user.userId;
        const orderedVideos = subject.sections.flatMap((section) => section.videos);
        const videoIds = orderedVideos.map((video) => video.id);
        const progressList = await db_1.default.videoProgress.findMany({
            where: {
                user_id: userId,
                video_id: { in: videoIds },
            },
            select: {
                video_id: true,
                is_completed: true,
                last_position_seconds: true,
                completed_at: true,
            },
        });
        const progressMap = new Map(progressList.map((entry) => [entry.video_id, entry]));
        let canUnlockNext = true;
        const sectionsWithLocks = subject.sections.map((section) => ({
            ...section,
            videos: section.videos.map((video) => {
                const progress = progressMap.get(video.id);
                const locked = !canUnlockNext;
                if (!locked && !progress?.is_completed) {
                    canUnlockNext = false;
                }
                return {
                    ...video,
                    locked,
                    progress: progress || {
                        video_id: video.id,
                        is_completed: false,
                        last_position_seconds: 0,
                        completed_at: null,
                    },
                };
            }),
        }));
        res.json({
            id: subject.id,
            title: subject.title,
            slug: subject.slug,
            description: subject.description,
            thumbnail: subject.thumbnail,
            is_published: subject.is_published,
            created_at: subject.created_at,
            sections: sectionsWithLocks,
        });
    }
    catch (error) {
        console.error('Get subject tree error:', error);
        res.status(500).json({ error: 'Failed to fetch subject tree' });
    }
});
exports.default = router;
//# sourceMappingURL=routes.js.map