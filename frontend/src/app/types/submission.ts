export interface Submission {
  submission_id: string;
  student_id: string;
  code: string;
  submitted_at: string;
  status: string;
  score: number;
  ai_feedback: string | AIFeedbackDetail | null;
  teacher_feedback: string;
  assignment_id: string;
}

export interface CodeQuality {
  dimension: string;
  description: string;
  isAppropriate: boolean;
}

export interface AIFeedbackDetail {
  feedback: string;
  score?: number;
  mistake_tags?: string[];
  foundSyntaxError?: boolean;
  conceptExplanation?: string;
  codeQuality?: CodeQuality[];
}