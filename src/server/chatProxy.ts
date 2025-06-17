
import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import jwt from 'jsonwebtoken';

const router = express.Router();

// Middleware: Authenticate and attach user info
router.use('/ws', (req: express.Request, res: express.Response, next: express.NextFunction) => {
  let token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    token = (req.query.token as string | undefined) ?? '';
  }

  if (!token) {
    console.warn('ChatProxy: No token provided for WebSocket connection attempt from IP:', req.ip);
    res.status(401).send('No token');
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    (req as any).user = decoded;
    // Assuming the decoded token has an 'id' or 'sub' field for user identifier
    const userId = (decoded as any).id || (decoded as any).sub;
    console.log(`ChatProxy: JWT verification successful for WebSocket. User: ${userId || 'Unknown'}, IP: ${req.ip}`);
    next();
  } catch (err: any) {
    console.error(`ChatProxy: JWT verification failed for WebSocket. IP: ${req.ip}, Error: ${err.message || 'Unknown error'}`);
    res.status(401).send('Invalid token');
    return;
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
    onProxyReqWs: (proxyReq, req, socket, options, head) => {
      const userId = (req as any).user?.id || (req as any).user?.sub || 'Unknown authenticated user';
      console.log(`ChatProxy: Proxying WebSocket request for User: ${userId}, IP: ${req.ip} to Target: ${options.target}`);
    },
    onError: (err, req, res_or_socket, target) => {
      // Note: 'target' might be a string URL or an object with host/port.
      // The 'res_or_socket' can be an HTTP response or a WebSocket socket.
      const targetUrl = typeof target === 'string' ? target : JSON.stringify(target);
      console.error(`ChatProxy: Error proxying to ${targetUrl}. IP: ${req.ip}, Error: ${err.message}`);

      // Ensure the socket is properly closed if it's a WebSocket error
      if (res_or_socket && typeof (res_or_socket as any).end === 'function') {
        // For HTTP response during initial handshake phase if error occurs
        if (!(res_or_socket as any).writableEnded) {
             try {
                (res_or_socket as any).writeHead?.(500, { 'Content-Type': 'text/plain' });
                (res_or_socket as any).end('WebSocket proxy error.');
             } catch (e) {
                console.error("ChatProxy: Error sending error response:", e);
             }
        }
      } else if (res_or_socket && typeof (res_or_socket as any).destroy === 'function') {
        // For WebSocket socket itself
        (res_or_socket as any).destroy();
      }
    }
  })
);

export default router;
