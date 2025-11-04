import { Router } from "express";
import { SocialController } from "../controllers/SocialController";

const router = Router();
const ctrl = new SocialController();

router.get("/stats", ctrl.getStats);
router.get("/feeds", ctrl.getFeeds);

export default { name: "/social", router };
