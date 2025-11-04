import { Request, Response } from "express";
import { SocialRepository } from "../repositories/SocialRepository";

export class SocialController {
  private repo = new SocialRepository();

  getStats = async (_req: Request, res: Response) => {
    try {
      const data = await this.repo.getStats();
      res.status(200).json(data);
    } catch (err: any) {
      res.status(500).json({ error: "Internal Server Error", details: err?.message });
    }
  };

  getFeeds = async (req: Request, res: Response) => {
    try {
      const igLimit = Number(req.query.igLimit ?? 12);
      const ytMax = Number(req.query.ytMax ?? 8);
      const ytChannelId = (req.query.ytChannelId as string) || undefined;
      const data = await this.repo.getFeeds({ igLimit, ytMax, ytChannelId });
      res.status(200).json({ data });
    } catch {
      res.status(200).json({ data: { instagram: [], youtube: [] } });
    }
  };
}
