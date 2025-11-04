import { Router } from "express";
import { JobApplicationController } from "../controllers/JobApplicationController";

const router = Router();
const jobApplicationController = new JobApplicationController();

router.post("/", jobApplicationController.createApplication);

export default { name: "/job", router };
