import { Router } from "express";
import { analyzeController } from "../controllers/analyze.performance.controller";
export const analyzeRoute = Router();

analyzeRoute.get("/", analyzeController.getAllAnalysis);
analyzeRoute.get("/a/:assignment_id", analyzeController.getClassAnalysis);
analyzeRoute.get("/:analysis_id", analyzeController.getAnalysisById);
analyzeRoute.delete("/:analysis_id", analyzeController.deleteAnalasis);