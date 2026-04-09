import { Redis } from '@upstash/redis';
import { nanoid } from 'nanoid';

// In-memory fallback for local dev (no Redis configured)
const memStore = new Map();
const memIndex = [];

function getRedisConfig() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || null;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || null;
  if (url && token) return { url, token };
  return null;
}

function useMemory() {
  return !getRedisConfig();
}

let _redis = null;
function getRedis() {
  if (!_redis) {
    const config = getRedisConfig();
    if (!config) throw new Error('Redis not configured');
    _redis = new Redis({ url: config.url, token: config.token });
  }
  return _redis;
}

export async function saveCreator(data) {
  const id = nanoid(9);
  const now = new Date().toISOString();
  const creator = {
    id,
    name: data.name || 'Unknown',
    niche: data.niche || '',
    primaryPlatform: data.primaryPlatform || 'Instagram',
    platforms: data.platforms || {},
    engagement: data.engagement || '',
    products: data.products || [],
    reputation: data.reputation || '',
    research: data.research || '',
    meeting: {
      brandDealPct: '',
      previousSales: '',
      followerQuestions: '',
      topContent: '',
      dmTopics: '',
      audienceProblem: '',
      emailList: '',
      storyViewRate: '',
      exclusivity: '',
    },
    notes: '',
    offerId: null,
    createdAt: now,
    updatedAt: now,
  };

  const summary = {
    id,
    name: creator.name,
    niche: creator.niche,
    primaryPlatform: creator.primaryPlatform,
    followers: _getPrimaryFollowers(creator),
    createdAt: now,
  };

  if (useMemory()) {
    memStore.set(`creator:${id}`, JSON.stringify(creator));
    memIndex.unshift(summary);
  } else {
    const redis = getRedis();
    await redis.set(`creator:${id}`, JSON.stringify(creator));
    await redis.zadd('creators:index', { score: Date.now(), member: JSON.stringify(summary) });
  }

  return { id };
}

export async function getCreator(id) {
  if (useMemory()) {
    const raw = memStore.get(`creator:${id}`);
    return raw ? JSON.parse(raw) : null;
  }
  const redis = getRedis();
  const raw = await redis.get(`creator:${id}`);
  if (!raw) return null;
  return typeof raw === 'string' ? JSON.parse(raw) : raw;
}

export async function listCreators() {
  if (useMemory()) {
    return [...memIndex];
  }
  const redis = getRedis();
  const members = await redis.zrange('creators:index', 0, -1, { rev: true });
  return members.map(m => typeof m === 'string' ? JSON.parse(m) : m);
}

export async function updateCreator(id, updates) {
  const existing = await getCreator(id);
  if (!existing) return null;

  // Deep merge meeting if provided
  if (updates.meeting) {
    updates.meeting = { ...existing.meeting, ...updates.meeting };
  }

  const updated = { ...existing, ...updates, id, updatedAt: new Date().toISOString() };

  const summary = {
    id,
    name: updated.name,
    niche: updated.niche,
    primaryPlatform: updated.primaryPlatform,
    followers: _getPrimaryFollowers(updated),
    createdAt: updated.createdAt,
  };

  if (useMemory()) {
    memStore.set(`creator:${id}`, JSON.stringify(updated));
    const idx = memIndex.findIndex(s => s.id === id);
    if (idx >= 0) memIndex[idx] = summary;
  } else {
    const redis = getRedis();
    await redis.set(`creator:${id}`, JSON.stringify(updated));
    // Remove old index entry and add updated one
    const allMembers = await redis.zrange('creators:index', 0, -1, { rev: true });
    for (const m of allMembers) {
      const parsed = typeof m === 'string' ? JSON.parse(m) : m;
      if (parsed.id === id) {
        await redis.zrem('creators:index', typeof m === 'string' ? m : JSON.stringify(m));
        break;
      }
    }
    await redis.zadd('creators:index', { score: Date.now(), member: JSON.stringify(summary) });
  }

  return updated;
}

export async function searchCreators(query) {
  const all = await listCreators();
  const q = query.toLowerCase();
  return all.filter(c =>
    (c.name || '').toLowerCase().includes(q) ||
    (c.niche || '').toLowerCase().includes(q)
  );
}

function _getPrimaryFollowers(creator) {
  if (!creator.platforms) return 0;
  const plat = (creator.primaryPlatform || 'instagram').toLowerCase();
  const p = creator.platforms[plat];
  if (!p) {
    // Return first available follower count
    for (const key of Object.keys(creator.platforms)) {
      const val = creator.platforms[key];
      if (val && (val.followers || val.subscribers)) return val.followers || val.subscribers || 0;
    }
    return 0;
  }
  return p.followers || p.subscribers || 0;
}
