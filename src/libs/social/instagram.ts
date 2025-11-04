import axios, { AxiosRequestConfig } from "axios";
import { readIgTokens } from "./tokens";
import config from "../config";
import { IgStats } from "../../models/Socials";
import { getStableToken, withProofParams, persistTokens } from "./fbToken";

const FB_VER = "v24.0";
const FB_G = `https://graph.facebook.com/${FB_VER}`;

const is190_463 = (err: any) => {
  const e = err?.response?.data?.error;
  return e?.code === 190 || e?.error_subcode === 463;
};

let ensuring: Promise<boolean> | null = null;

function pickIgId(): string {
  const f = readIgTokens();
  return f.ig_user_id || String(config.igUserId || "");
}
async function probeProfile(igUserId: string, token: string) {
  try {
    const resp = await axios.get(`${FB_G}/${encodeURIComponent(igUserId)}`, {
      params: withProofParams(token, { fields: "id,username" }),
      timeout: 12000,
    });
    return resp.data;
  } catch (e:any) {
    throw e;
  }
}

export async function ensureTokenReady() {
  if (!ensuring) {
    ensuring = (async () => {
      const stable = await getStableToken();
      if (!stable) return false;

      let igId = pickIgId();

      if (!igId) {
        return false;
      }

      try {
        await probeProfile(igId, stable.token);
        return true;
      } catch {
        return false;
      }
    })().finally(() => (ensuring = null));
  }
  return ensuring;
}

async function igGet<T = any>(url: string, cfg?: AxiosRequestConfig, retry = true): Promise<T> {
  const stable = await getStableToken();
  if (!stable) throw new Error("IG: no valid token");

  try {
    const merged = { timeout: 12000, ...(cfg || {}) };
    const params = withProofParams(stable.token, (merged.params as any) || {});
    const { data } = await axios.get<T>(url, { ...merged, params });
    return data;
  } catch (err:any) {
    if (retry && is190_463(err)) {
      await ensureTokenReady();
      return igGet<T>(url, cfg, false);
    }
    throw err;
  }
}

export async function getInstagramProfile(): Promise<IgStats> {
  const ok = await ensureTokenReady();
  if (!ok) throw new Error("IG not ready");

  const igUserId = pickIgId();
  if (!igUserId) throw new Error("IG: ig_user_id missing");

  const fields = "followers_count,media_count";
  const data = await igGet<any>(`${FB_G}/${encodeURIComponent(igUserId)}`, {
    params: { fields },
  });

  return {
    followers: Number(data?.followers_count ?? 0),
    mediaCount: Number(data?.media_count ?? 0),
  };
}

export async function getInstagramStats(): Promise<IgStats> {
  return getInstagramProfile();
}

export async function fetchInstagramFeed(limit: number) {
  const ok = await ensureTokenReady();
  if (!ok) return [];

  const igUserId = pickIgId();
  if (!igUserId) return [];

  const fields = "id,media_type,media_url,thumbnail_url,permalink,caption,timestamp";
  const data = await igGet<any>(`${FB_G}/${encodeURIComponent(igUserId)}/media`, {
    params: { fields, limit },
  });

  const items = Array.isArray(data?.data) ? data.data : [];
  return items
    .map((it: any) => ({
      id: String(it?.id ?? Math.random().toString(36).slice(2, 10)),
      media_type: (it?.media_type as "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM") ?? "IMAGE",
      media_url: it?.media_url ?? "",
      thumbnail_url: it?.thumbnail_url ?? undefined,
      permalink: it?.permalink ?? "",
      caption: it?.caption ?? "",
      timestamp: it?.timestamp ?? undefined,
    }))
    .filter((x: any) => x.media_url && x.permalink);
}
