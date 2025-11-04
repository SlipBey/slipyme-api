import { Request, Response } from "express";
import { ContactRepository } from "../repositories/ContactRepository";
import { Contact } from "../models/Contact";
import { validateModel } from "../libs/validateModel";
import { rateLimit } from "../middlewares/rateLimitMiddleware";

export class ContactController {
  private repository: ContactRepository;

  constructor() {
    this.repository = new ContactRepository();
  }

  createContact = (req: Request, res: Response) => {
    try {
      rateLimit(3, 5 * 60 * 1000);
      const missingFields = validateModel<Contact>(req.body, Contact);

      if (missingFields.length > 0) {
        return res.status(400).json({ error: "Lütfen zorunlu alanları doldurun." });
      }
      
      this.repository.create(req.body);
      res.status(200).json({ message: "İletişim bilgileri başarıyla gönderildi." });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  };
}
