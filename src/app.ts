import cors from "cors";
import * as fs from "fs";
import * as http from "http";
import * as https from "https";
import * as path from "path";
import express from "express";
import Discord from "discord.js";

import config from "./libs/config";
import { loggerMiddleware } from "./middlewares/loggerMiddleware";
import { SocialRepository } from "./repositories/SocialRepository";

const routers = fs.readdirSync(path.resolve(process.cwd(), "src/routes"));
const app = express();

app.set("trust proxy", true);
app.use(express.json());
app.use(cors());
app.use(loggerMiddleware);

app.use((req, res, next) => {
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol;
  if (proto !== "https") {
    if (config.httpPort) {
      const host = req.headers.host?.replace(/:\d+$/, "") || "";
      const portPart = config.port === 443 ? "" : `:${config.port}`;
      return res.redirect(301, `https://${host}${portPart}${req.originalUrl}`);
    }
  }
  next();
});

app.use((req, res, next) => {
  const token = req.headers["authorization"];
  if (!token || token !== `Bearer ${config.apiKey}`) {
    return res.status(401).json({ status: "error", message: "Unauthorized: Invalid token" });
  }
  next();
});

for (const route of routers) {
  const importedModule = require(path.resolve(process.cwd(), "src/routes", route));
  const router = importedModule.default || importedModule;
  if (!router.name || !router.router) continue;
  app.use("/api" + router.name, router.router);
}

function readIfExists(p?: string) {
  if (!p) return undefined;
  const abs = path.resolve(process.cwd(), p);
  return fs.existsSync(abs) ? fs.readFileSync(abs) : undefined;
}

const key = readIfExists(config.ssl.keyPath);
const cert = readIfExists(config.ssl.certPath);

const httpsServer = https.createServer(
  { key, cert },
  app
);

app.use((req, res, next) => {
  if (req.secure) {
    res.setHeader("Strict-Transport-Security", "max-age=15552000; includeSubDomains; preload");
  }
  next();
});

process.on("unhandledRejection", () => { });

httpsServer.listen(config.port, async () => {
  console.log(`[HTTPS] API started on port ${config.port}`);

  const socialRepo = new SocialRepository();
  const DAY = 24 * 60 * 60 * 1000;
  setInterval(async () => {
    try {
      console.log("[cron] IG/YT refreshAll started");
      await socialRepo.refreshAll();
      console.log("[cron] IG/YT refreshAll done");
    } catch (e) {
      console.error("[cron] refreshAll failed:", (e as any)?.message || e);
    }
  }, DAY);
});

if (config.httpPort && Number.isFinite(config.httpPort) && config.httpPort > 0) {
  const httpServer = http.createServer((req, res) => {
    const host = req.headers.host?.replace(/:\d+$/, "") || "";
    const portPart = config.port === 443 ? "" : `:${config.port}`;
    const location = `https://${host}${portPart}${req.url}`;
    res.writeHead(301, { Location: location });
    res.end();
  });
  httpServer.listen(config.httpPort, () => {
    console.log(`[HTTP] Redirect server on port ${config.httpPort} → HTTPS:${config.port}`);
  });
}

export const client: any = new Discord.Client({
  intents: [
    Discord.GatewayIntentBits.GuildMembers,
    Discord.GatewayIntentBits.Guilds,
    Discord.GatewayIntentBits.GuildEmojisAndStickers,
    Discord.GatewayIntentBits.GuildMessages,
    Discord.GatewayIntentBits.MessageContent,
  ],
  partials: [
    Discord.Partials.GuildMember,
    Discord.Partials.User,
    Discord.Partials.Reaction,
    Discord.Partials.Message,
  ],
  sweepers: {
    ...Discord.Options.DefaultSweeperSettings,
    invites: { interval: 30, lifetime: 30 },
    messages: { interval: 3600, lifetime: 30 },
  },
});

client.login(config.botToken);
