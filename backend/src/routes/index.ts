import { Router } from "express";
import { asyncHandler } from "../middleware/errorHandler";
import { requireAuth } from "../middleware/auth";
import * as authController from "../controllers/authController";
import * as caseController from "../controllers/caseController";
import * as documentController from "../controllers/documentController";
import * as actionController from "../controllers/actionController";
import * as copilotController from "../controllers/copilotController";
import * as dashboardController from "../controllers/dashboardController";
import * as denialController from "../controllers/denialController";

const router = Router();

router.post("/auth/login", asyncHandler(authController.login));

router.use(requireAuth);

router.post("/cases", asyncHandler(caseController.createCase));
router.get("/cases", asyncHandler(caseController.listCases));
router.get("/cases/:id", asyncHandler(caseController.getCase));
router.post("/cases/:id/analyze", asyncHandler(caseController.analyzeCase));
router.get("/cases/:id/risk", asyncHandler(caseController.getRisk));
router.get("/cases/:id/documents", asyncHandler(caseController.getDocuments));
router.post("/cases/:id/documents", asyncHandler(caseController.addDocument));
router.patch("/documents/:id", asyncHandler(documentController.updateDocument));
router.get("/cases/:id/actions", asyncHandler(caseController.getActions));
router.patch("/actions/:id", asyncHandler(actionController.updateAction));
router.post("/cases/:id/simulate", asyncHandler(caseController.simulate));
router.get("/cases/:id/coverage", asyncHandler(caseController.getCoverage));
router.post("/cases/:id/copilot", asyncHandler(copilotController.ask));
router.get("/cases/:id/copilot", asyncHandler(copilotController.history));

router.get("/dashboard", asyncHandler(dashboardController.getDashboard));
router.get("/denials", asyncHandler(denialController.getDenials));

export default router;
