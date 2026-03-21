"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = __importDefault(require("../../config/db"));
const password_1 = require("../../utils/password");
const jwt_1 = require("../../utils/jwt");
const authMiddleware_1 = require("../../middleware/authMiddleware");
const router = (0, express_1.Router)();
// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            res.status(400).json({ error: 'Name, email, and password are required' });
            return;
        }
        if (password.length < 6) {
            res.status(400).json({ error: 'Password must be at least 6 characters' });
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            res.status(400).json({ error: 'Invalid email format' });
            return;
        }
        const existingUser = await db_1.default.user.findUnique({ where: { email } });
        if (existingUser) {
            res.status(409).json({ error: 'Email already registered' });
            return;
        }
        const password_hash = await (0, password_1.hashPassword)(password);
        await db_1.default.user.create({
            data: { name, email, password_hash },
        });
        res.status(201).json({ message: 'Registration successful' });
    }
    catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});
// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required' });
            return;
        }
        const user = await db_1.default.user.findUnique({ where: { email } });
        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const isValid = await (0, password_1.comparePassword)(password, user.password_hash);
        if (!isValid) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const tokenPayload = { userId: user.id, email: user.email };
        const accessToken = (0, jwt_1.generateAccessToken)(tokenPayload);
        const refreshToken = (0, jwt_1.generateRefreshToken)(tokenPayload);
        // Store refresh token in database
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        await db_1.default.refreshToken.create({
            data: {
                user_id: user.id,
                token: refreshToken,
                expires_at: expiresAt,
            },
        });
        // Set refresh token as HTTP-only cookie
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
            path: '/',
        });
        res.json({
            accessToken,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});
// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;
        if (!token) {
            res.status(401).json({ error: 'Refresh token required' });
            return;
        }
        // Verify token signature
        let payload;
        try {
            payload = (0, jwt_1.verifyRefreshToken)(token);
        }
        catch {
            res.status(401).json({ error: 'Invalid refresh token' });
            return;
        }
        // Check token exists in database
        const storedToken = await db_1.default.refreshToken.findUnique({ where: { token } });
        if (!storedToken || storedToken.expires_at < new Date()) {
            if (storedToken) {
                await db_1.default.refreshToken.delete({ where: { id: storedToken.id } });
            }
            res.status(401).json({ error: 'Refresh token expired' });
            return;
        }
        // Generate new tokens
        const newPayload = { userId: payload.userId, email: payload.email };
        const accessToken = (0, jwt_1.generateAccessToken)(newPayload);
        const newRefreshToken = (0, jwt_1.generateRefreshToken)(newPayload);
        // Replace old token with new one
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);
        await db_1.default.refreshToken.update({
            where: { id: storedToken.id },
            data: { token: newRefreshToken, expires_at: expiresAt },
        });
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000,
            path: '/',
        });
        const user = await db_1.default.user.findUnique({ where: { id: payload.userId } });
        res.json({
            accessToken,
            user: user ? { id: user.id, name: user.name, email: user.email } : null,
        });
    }
    catch (error) {
        console.error('Refresh error:', error);
        res.status(500).json({ error: 'Token refresh failed' });
    }
});
// POST /api/auth/logout
router.post('/logout', async (req, res) => {
    try {
        const token = req.cookies?.refreshToken;
        if (token) {
            await db_1.default.refreshToken.deleteMany({ where: { token } });
        }
        res.clearCookie('refreshToken', { path: '/' });
        res.json({ message: 'Logged out successfully' });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
});
// GET /api/auth/me
router.get('/me', authMiddleware_1.authMiddleware, async (req, res) => {
    try {
        const user = await db_1.default.user.findUnique({
            where: { id: req.user.userId },
            select: { id: true, name: true, email: true, created_at: true },
        });
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.json({ user });
    }
    catch (error) {
        console.error('Me error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});
exports.default = router;
//# sourceMappingURL=routes.js.map