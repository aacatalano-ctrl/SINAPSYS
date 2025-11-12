import { Request, Response, NextFunction } from 'express';
import { pubClient } from '../server.js'; // Import pubClient from server.ts

const cacheMiddleware = (duration: number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!pubClient) {
      console.warn('Redis client not available for cache middleware. Skipping cache.');
      return next();
    }

    const key = req.originalUrl;

    try {
      const cachedBody = await pubClient.get(key);

      if (cachedBody) {
        console.log(`Cache hit for ${key}`);
        return res.send(JSON.parse(cachedBody));
      } else {
        console.log(`Cache miss for ${key}`);
        // Monkey-patch res.send to cache the response
        const originalSend = res.send;
        res.send = (body: any) => {
          pubClient.setex(key, duration, JSON.stringify(body));
          originalSend.call(res, body);
          return res;
        };
        next();
      }
    } catch (err) {
      console.error('Redis cache error:', err);
      next(); // Continue without caching on error
    }
  };
};

export default cacheMiddleware;