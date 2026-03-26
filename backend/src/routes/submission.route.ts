import { Router } from "express";
import { submissionController } from '../controllers/submission.controller';

export const submissionRoute = Router();

submissionRoute.get("/", submissionController.getAllSubmission);
submissionRoute.get("/:submission_id", submissionController.getSubmissionById);
submissionRoute.get("/assignment/:assignment_id", submissionController.getSubmissionByAssignmentId);
submissionRoute.post("/", submissionController.createSubmission);
submissionRoute.post("/test", submissionController.testSubmit);
submissionRoute.post("/test-concurrent", submissionController.testConcurrent);
submissionRoute.put("/:submission_id", submissionController.updateSubmission);
submissionRoute.delete("/:submission_id", submissionController.deleteSubmission);
