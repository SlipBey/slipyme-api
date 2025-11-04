import { Router } from "express";
import { ContactController } from "../controllers/ContactController";

const router = Router();
const contactController = new ContactController();

router.post("/", contactController.createContact);

export default { name: "/contact", router };
