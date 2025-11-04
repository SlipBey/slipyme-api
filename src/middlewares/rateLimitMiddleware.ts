import { Request, Response, NextFunction } from "express";

const requestLog: Map<string, { count: number; startTime: number }> = new Map();

export const rateLimit = (maxRequests: number, timeWindowMs: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const ip: any = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress;

    if (!ip) {
      return res.status(400).json({ error: "Cihaz kimliği belirlenemedi." });
    }

    const currentTime = Date.now();
    const requestData = requestLog.get(ip);

    if (!requestData) {
      requestLog.set(ip, { count: 1, startTime: currentTime });
      return next();
    }

    if (currentTime - requestData.startTime > timeWindowMs) {
      requestLog.set(ip, { count: 1, startTime: currentTime });
      return next();
    }

    if (requestData.count >= maxRequests) {
      return res.status(429).json({
        error: `Çok fazla istek yaptınız. Lütfen ${timeWindowMs / 60000} dakika bekleyin.`,
      });
    }

    requestData.count++;
    requestLog.set(ip, requestData);

    next();
  };
};
