import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { TooManyRequestsError } from "../errors/app-error.js";

export interface RateLimitOptions {
  max: number;
  windowMs: number;
}

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Lightweight, zero-dependency in-memory IP rate limiter hook.
 * Protects endpoints from abuse without external runtime dependencies.
 */
export function registerRateLimiter(
  fastify: FastifyInstance,
  options: RateLimitOptions
): void {
  const buckets = new Map<string, Bucket>();

  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets.entries()) {
      if (bucket.resetAt <= now) {
        buckets.delete(key);
      }
    }
  }, Math.max(options.windowMs, 10000));
  cleanupTimer.unref();

  fastify.addHook("onClose", async () => {
    clearInterval(cleanupTimer);
    buckets.clear();
  });

  fastify.addHook("onRequest", async (request: FastifyRequest, reply: FastifyReply) => {
    if (request.url.startsWith("/health")) {
      return;
    }

    const now = Date.now();
    const clientIp = request.ip || "unknown";
    let bucket = buckets.get(clientIp);

    if (!bucket || bucket.resetAt <= now) {
      bucket = {
        count: 0,
        resetAt: now + options.windowMs,
      };
      buckets.set(clientIp, bucket);
    }

    bucket.count += 1;
    const remaining = Math.max(options.max - bucket.count, 0);

    reply.header("X-RateLimit-Limit", String(options.max));
    reply.header("X-RateLimit-Remaining", String(remaining));
    reply.header("X-RateLimit-Reset", String(Math.ceil(bucket.resetAt / 1000)));

    if (bucket.count > options.max) {
      throw new TooManyRequestsError();
    }
  });
}
