import { Router } from "express";
import { enrollController } from "../controllers/enrollment.controller";

export const enrollRoute = Router();

enrollRoute.get("/", enrollController.getAllEnrollment);
enrollRoute.get("/c/:classroom_id", enrollController.getEnrollmentByClassId);
enrollRoute.get("/c/:classroom_id/not-enrolled", enrollController.getStudentsNotEnrolled);
enrollRoute.get("/my", enrollController.getMyEnrollment);
enrollRoute.post("/", enrollController.createEnrollment);