import { Request, Response } from "express";
import { JobApplicationRepository } from "../repositories/JobApplicationRepository";
import { validateModel } from "../libs/validateModel";
import { rateLimit } from "../middlewares/rateLimitMiddleware";
import { JobApplication } from "../models/JobApplication";

export class JobApplicationController {
  private repository: JobApplicationRepository;

  constructor() {
    this.repository = new JobApplicationRepository();
  }

  createApplication = (req: Request, res: Response) => {
    try {
      rateLimit(3, 5 * 60 * 1000);
      const missingFields = validateModel<JobApplication>(req.body, JobApplication);

      if (missingFields.length > 0) {
        return res.status(400).json({ error: "Lütfen zorunlu alanları doldurun." });
      }
      
      this.repository.create(req.body);
      res.status(200).json({ message: "Başvuru başarıyla gönderildi." });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
}
