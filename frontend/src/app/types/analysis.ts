export interface StudentInsight {
    studentName: string;
    reason: string;
}

export interface AssignmentAnalysis {
    id: string;
    assignment_id: string;
    overall_strengths: string;
    overall_weaknesses: string;
    students_needing_help: StudentInsight[];
    top_performers: StudentInsight[];
    created_at: string;
}
