import { Request, Response } from "express";
import { validateModel } from "../libs/validateModel";
import { rateLimit } from "../middlewares/rateLimitMiddleware";
import { Mail } from "../models/Mail";
import { MailAddRepository } from "../repositories/MailAddRepository";
import { readLogs } from "../libs/fileHandler";
import path from "path";

export class MailAddController {
  private repository: MailAddRepository;

  constructor() {
    this.repository = new MailAddRepository();
  }

  addMail = (req: Request, res: Response) => {
    try {
      rateLimit(3, 5 * 60 * 1000);
      const missingFields = validateModel<Mail>(req.body, Mail);
      const filePath = path.join(__dirname, "../../jsons/mails.json");

      if (missingFields.length > 0) {
        return res.status(400).json({ error: "Lütfen zorunlu alanları doldurun." });
      }

      const email = req.body.email.trim().toLowerCase();
      const existingMails: { email: string }[] = readLogs(filePath);

      const isDuplicate = existingMails.some(mail => mail.email === email);
      if (isDuplicate) {
        return res.status(400).json({ error: "Bu e-posta adresi zaten eklenmiş!" });
      }
      
      this.repository.add(req.body);
      res.status(200).json({ message: "E-Posta başarıyla eklendi." });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
}
