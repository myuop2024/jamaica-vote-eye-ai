
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware: Authenticate and attach user info
router.use('/ws', (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).send('No token');
  try {
    // Replace with your JWT secret
    const user = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    (req as any).user = user;
    next();
  } catch {
    return res.status(401).send('Invalid token');
  }
});

// Proxy WebSocket traffic to tl-rtc-file
router.use(
  '/ws',
  createProxyMiddleware({
    target: 'ws://localhost:9092', // tl-rtc-file backend
    changeOrigin: true,
    ws: true,
    pathRewrite: { '^/api/chat/ws': '/' },
  })
);

export default router;
