import { Request, Response, NextFunction } from "express";
import { writeLog } from "../libs/fileHandler";
import path from "path";
import geoip from "geoip-lite";

export const loggerMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const filePath = path.join(__dirname, "../../jsons/logs.json");
  // const ip = req.headers["x-forwarded-for"] as string || req.socket.remoteAddress || "Unknown";

  // const geo = geoip.lookup(ip);
  // const location = geo
  //   ? {
  //       country: geo.country,
  //       region: geo.region,
  //       city: geo.city,
  //       ll: geo.ll,
  //     }
  //   : "Unknown";

  res.on("finish", () => {
    const logData = {
      timestamp: new Date().toISOString(),
      // ip,
      // location,
      userAgent: req.headers["user-agent"],
      method: req.method,
      endpoint: req.originalUrl,
      requestBody: req.body,
      responseStatus: res.statusCode,
      responseMessage: res.statusMessage,
      durationMs: Date.now() - start,
    };

    writeLog(logData, filePath);
  });

  next();
};
