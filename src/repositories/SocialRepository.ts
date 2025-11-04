import path from "path";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import {
  fetchInstagramFeed,
  getInstagramProfile as igGetProfile,
  ensureTokenReady,
} from "../libs/social/instagram";
import config from "../libs/config";
import { MediaItem, SocialSnapshot } from "../models/Socials";
import { getYouTubeStats } from "../libs/social/youtube";

export class SocialRepository {
  private baseDir = path.join(process.cwd(), "jsons");
  private socialPath = path.join(this.baseDir, "social.json");
  private feedsPath = path.join(this.baseDir, "feeds.json");

  private static DAY_MS = 24 * 60 * 60 * 1000;

  private ensureDir() {
    try { mkdirSync(this.baseDir, { recursive: true }); } catch { }
  }

  private readJson<T>(p: string): T | null {
    if (!existsSync(p)) return null;
    try { return JSON.parse(readFileSync(p, "utf-8")); } catch { return null; }
  }

  private writeJson(p: string, data: unknown) {
    try { this.ensureDir(); writeFileSync(p, JSON.stringify(data, null, 2), "utf-8"); } catch { }
  }

  private isFresh(updatedAt?: string | null, maxAgeMs = SocialRepository.DAY_MS) {
    if (!updatedAt) return false;
    const t = new Date(updatedAt).getTime();
    return Number.isFinite(t) && Date.now() - t < maxAgeMs;
  }

  async getStats({ force = false }: { force?: boolean } = {}): Promise<SocialSnapshot> {
    const last = this.readLastSnapshot();
    if (!force && last && this.isFresh(last.updatedAt)) return last;

    const result: SocialSnapshot = { updatedAt: new Date().toISOString() };

    try {
      const ig = await igGetProfile();
      result.instagram = {
        followers: ig.followers,
        mediaCount: ig.mediaCount,
      };
    } catch (e: any) {
      result.errors = { ...(result.errors ?? {}), instagram: e?.message ?? "IG error" };
    }

    try {
      result.youtube = await getYouTubeStats();
    } catch (e: any) {
      result.errors = { ...(result.errors ?? {}), youtube: e?.message ?? "YT error" };
    }

    this.writeJson(this.socialPath, result);
    return result;
  }

  readLastSnapshot(): SocialSnapshot | null {
    return this.readJson<SocialSnapshot>(this.socialPath);
  }

  async getFeeds(opts: { igLimit?: number; ytMax?: number; ytChannelId?: string; force?: boolean } = {}) {
    const { force = false } = opts;
    const last = this.readJson<any>(this.feedsPath);
    if (!force && last && this.isFresh(last?.updatedAt)) return last;

    const igLimit = Math.min(Number(opts.igLimit ?? 12), 24);
    const ytMax = Math.min(Number(opts.ytMax ?? 8), 12);

    const out: {
      updatedAt: string;
      instagram: MediaItem[];
      youtube: Array<{
        id: string;
        title: string;
        publishedAt: string;
        thumbnail: string;
        views: number;
        likes: number;
        comments: number;
      }>;
      errors?: Record<string, string>;
    } = { updatedAt: new Date().toISOString(), instagram: [], youtube: [] };

    try {
      out.instagram = await fetchInstagramFeed(igLimit);
    } catch (e: any) {
      out.errors = { ...(out.errors ?? {}), instagram: e?.message ?? "IG feed error" };
    }

    try {
      const key = config.ytApiKey;
      const channelId = opts.ytChannelId || config.ytChannelId;
      if (key && channelId) {
        const searchUrl = new URL("https://www.googleapis.com/youtube/v3/search");
        searchUrl.searchParams.set("part", "snippet");
        searchUrl.searchParams.set("channelId", channelId);
        searchUrl.searchParams.set("maxResults", String(ytMax));
        searchUrl.searchParams.set("order", "date");
        searchUrl.searchParams.set("type", "video");
        searchUrl.searchParams.set("key", key);

        const s = await fetch(searchUrl.toString()).then((r) => r.json());
        const vids = (s?.items ?? [])
          .map((it: any) => ({
            id: it?.id?.videoId as string,
            title: it?.snippet?.title ?? "",
            publishedAt: it?.snippet?.publishedAt ?? "",
            thumbnail:
              it?.snippet?.thumbnails?.medium?.url ||
              it?.snippet?.thumbnails?.high?.url ||
              it?.snippet?.thumbnails?.default?.url ||
              "",
          }))
          .filter((x: any) => x.id);

        if (vids.length) {
          const ids = vids.map((v: any) => v.id).join(",");
          const videosUrl = new URL("https://www.googleapis.com/youtube/v3/videos");
          videosUrl.searchParams.set("part", "statistics");
          videosUrl.searchParams.set("id", ids);
          videosUrl.searchParams.set("key", key);

          const v = await fetch(videosUrl.toString()).then((r) => r.json());
          const statMap = new Map<string, { views: number; likes: number; comments: number }>();
          for (const it of v?.items ?? []) {
            const st = it?.statistics ?? {};
            statMap.set(it?.id, {
              views: Number(st?.viewCount ?? 0),
              likes: Number(st?.likeCount ?? 0),
              comments: Number(st?.commentCount ?? 0),
            });
          }

          out.youtube = vids.map((v: any) => {
            const st = statMap.get(v.id) || { views: 0, likes: 0, comments: 0 };
            return {
              id: v.id,
              title: v.title,
              publishedAt: v.publishedAt,
              thumbnail: v.thumbnail,
              views: st.views,
              likes: st.likes,
              comments: st.comments,
            };
          });
        }
      }
    } catch (e: any) {
      out.errors = { ...(out.errors ?? {}), youtube: e?.message ?? "YT feed error" };
    }

    this.writeJson(this.feedsPath, out);
    return out;
  }

  async refreshAll() {
    await ensureTokenReady();
    await this.getStats({ force: true });
    await this.getFeeds({ igLimit: 6, ytMax: 6, force: true });
  }
}
