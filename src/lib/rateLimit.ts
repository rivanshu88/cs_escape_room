import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const LIMIT = 8;
const WINDOW_MS = 10 * 60 * 1000;
const memoryWindows = new Map<string, number[]>();
let cleanupCounter = 0;

const redisUrl =
  process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const redisToken =
  process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

const redisLimiter =
  redisUrl && redisToken
    ? new Ratelimit({
        redis: new Redis({ url: redisUrl, token: redisToken }),
        limiter: Ratelimit.slidingWindow(LIMIT, "10 m"),
        prefix: "cs-escape-lab:mentor",
      })
    : null;

export async function checkRateLimit(
  request: Request
): Promise<{ ok: boolean; retryAfterSeconds: number }> {
  const clientId =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

  if (redisLimiter) {
    try {
      const result = await redisLimiter.limit(clientId);
      return {
        ok: result.success,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((result.reset - Date.now()) / 1000)
        ),
      };
    } catch {
      console.warn("Mentor rate-limit Redis request failed; allowing request.");
      return { ok: true, retryAfterSeconds: 0 };
    }
  }

  // This fallback is per-instance and best-effort; use Redis for shared production limits.
  const now = Date.now();
  cleanupCounter++;
  if (cleanupCounter >= 100) {
    cleanupCounter = 0;
    for (const [key, timestamps] of memoryWindows) {
      const active = timestamps.filter((timestamp) => now - timestamp < WINDOW_MS);
      if (active.length) memoryWindows.set(key, active);
      else memoryWindows.delete(key);
    }
  }

  const activeRequests = (memoryWindows.get(clientId) ?? []).filter(
    (timestamp) => now - timestamp < WINDOW_MS
  );

  if (activeRequests.length >= LIMIT) {
    memoryWindows.set(clientId, activeRequests);
    return {
      ok: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((activeRequests[0] + WINDOW_MS - now) / 1000)
      ),
    };
  }

  activeRequests.push(now);
  memoryWindows.set(clientId, activeRequests);

  return { ok: true, retryAfterSeconds: 0 };
}
