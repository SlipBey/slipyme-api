import axios from "axios";
import config from "../config";

export async function getYouTubeStats(): Promise<{ subs: number; views: number }> {
  const key = config.ytApiKey;
  const channelId = config.ytChannelId;
  if (!key || !channelId) throw new Error("YouTube API key or channelId missing");

  const { data } = await axios.get("https://www.googleapis.com/youtube/v3/channels", {
    params: { part: "statistics", id: channelId, key },
  });

  const stats = data?.items?.[0]?.statistics;
  return {
    subs: Number(stats?.subscriberCount ?? 0),
    views: Number(stats?.viewCount ?? 0),
  };
}
