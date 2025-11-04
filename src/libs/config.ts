import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const config = {
  apiKey: process.env.API_KEY || "",
  botToken: process.env.BOT_TOKEN || "",
  DISCORD_API_BASE: "https://discord.com/api/v10",
  botId: "967163782528925756",
  guildId: "904103710903390218",
  port: 9128,
  httpPort: 8080,
  ssl: {
    keyPath: "src/cr/private.key",
    certPath: "src/cr/certificate.crt",
  },

  ytApiKey: process.env.YT_API_KEY || process.env.YT_APIKEY || "",
  ytChannelId: process.env.YT_CHANNEL_ID || "",

  igUserId: process.env.IG_USER_ID || "",
  igAccessToken: process.env.IG_ACCESS_TOKEN || "",
  fbAppId: process.env.FB_APP_ID || "",
  fbAppSecret: process.env.FB_APP_SECRET || "",

  systemUserToken: process.env.SYSTEM_USER_TOKEN || "",
  pageAccessToken: process.env.PAGE_ACCESS_TOKEN || "",

  logLevel: (process.env.LOG_LEVEL || "info") as "debug" | "info" | "warn" | "error",
  logPretty: process.env.LOG_PRETTY === "1",
};

export default config;
