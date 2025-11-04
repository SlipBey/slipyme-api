import { Router } from "express";
import { MailAddController } from "../controllers/MailAddController";

const router = Router();
const mailAddController = new MailAddController();

router.post("/", mailAddController.addMail);

export default { name: "/mail", router };
