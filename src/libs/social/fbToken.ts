import crypto from "crypto";
import axios from "axios";
import { readIgTokens, writeIgTokens, IgTokenFile } from "./tokens";
import config from "../config";

const FB_VER = "v24.0";
const FB_G = `https://graph.facebook.com/${FB_VER}`;

export type TokenKind = "page" | "system" | "user";
type Candidate = { kind: TokenKind; token: string };

function appsecretProof(token: string) {
  const secret = String(config.fbAppSecret || "");
  return crypto.createHmac("sha256", secret).update(token).digest("hex");
}

function loadFile(): IgTokenFile { return readIgTokens(); }
function saveFile(p: Partial<IgTokenFile>) {
  const cur = readIgTokens();
  writeIgTokens({ ...cur, ...p });
}

export function pickCandidates(): Candidate[] {
  const f = loadFile();
  const list: Candidate[] = [];

  if (f.page_access_token) list.push({ kind: "page", token: f.page_access_token });
  if (f.system_user_token) list.push({ kind: "system", token: f.system_user_token });
  if (f.user_access_token) list.push({ kind: "user", token: f.user_access_token });

  if (config.pageAccessToken) list.push({ kind: "page", token: String(config.pageAccessToken) });
  if (config.systemUserToken) list.push({ kind: "system", token: String(config.systemUserToken) });
  if (config.igAccessToken) list.push({ kind: "user", token: String(config.igAccessToken) });

  const seen = new Set<string>();
  return list.filter(c => {
    if (!c.token) return false;
    if (seen.has(c.token)) return false;
    seen.add(c.token);
    return true;
  });
}

export async function debugToken(token: string) {
  const appId = String(config.fbAppId || "");
  const appSecret = String(config.fbAppSecret || "");
  if (!appId || !appSecret) return null;

  try {
    const resp = await axios.get(`${FB_G}/debug_token`, {
      params: { input_token: token, access_token: `${appId}|${appSecret}` },
      timeout: 12000,
    });
    return resp.data?.data ?? null;
  } catch (e:any) {
    return null;
  }
}

export async function getStableToken(): Promise<{ token: string; kind: TokenKind } | null> {
  const candidates = pickCandidates();

  for (const c of candidates) {
    const dbg = await debugToken(c.token);
    if (!dbg) continue;
    if (dbg.is_valid !== true) continue;

    const scopes: string[] = dbg.scopes || [];
    const need = ["pages_show_list", "pages_read_engagement", "instagram_basic"];
    const okForPage = need.every(s => scopes.includes(s));
    if (c.kind === "page" && !okForPage) {
      continue;
    }
    
    return { token: c.token, kind: c.kind };
  }
  return null;
}

export function withProofParams(token: string, params: Record<string, any> = {}) {
  const appId = String(config.fbAppId || "");
  const secret = String(config.fbAppSecret || "");
  const out: Record<string, any> = { ...params, access_token: token };
  if (appId && secret) out.appsecret_proof = appsecretProof(token);
  return out;
}

export function persistTokens(partial: Partial<IgTokenFile>) {
  saveFile(partial);
}
