import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import categoriesRouter from "./categories";
import productsRouter from "./products";
import billsRouter from "./bills";
import reportsRouter from "./reports";
import settingsRouter from "./settings";
import uploadRouter from "./upload";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(categoriesRouter);
router.use(productsRouter);
router.use(billsRouter);
router.use(reportsRouter);
router.use(settingsRouter);
router.use(uploadRouter);

export default router;
