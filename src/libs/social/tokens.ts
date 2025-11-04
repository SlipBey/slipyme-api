import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";

export type IgTokenFile = {
  ig_user_id?: string;

  page_access_token?: string;
  system_user_token?: string;
  user_access_token?: string;

  long_user_token?: string;
  short_user_token?: string;
};

const TOKENS_PATH = join(process.cwd(), "jsons/ig_tokens.json");

function ensureDir(p: string) {
  const dir = dirname(p);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

export function readIgTokens(): IgTokenFile {
  try {
    if (!existsSync(TOKENS_PATH)) return {};
    const raw = readFileSync(TOKENS_PATH, "utf-8");
    return JSON.parse(raw || "{}");
  } catch {
    return {};
  }
}

export function writeIgTokens(data: IgTokenFile) {
  try {
    ensureDir(TOKENS_PATH);
    writeFileSync(TOKENS_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch {}
}
