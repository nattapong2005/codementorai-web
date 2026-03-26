import { api } from "@/app/utils/api";

export interface AnalysisData {
    id: string;
    assignment_id: string;
    total_students: number;
    submitted_count: number;
    average_score: number;
    max_score: number;
    min_score: number;
    common_mistakes: string[]; // Or specific object structure depending on schema
    difficulty_level: string;
    topics_needing_review: string[];
    created_at: string;
    updated_at: string;
    // Add other fields as per schema
}


export const getClassPerformance = async (assignment_id: string, confirm: boolean = false) => {
    try {
        const config = {
            withCredentials: true,
            params: confirm ? { confirm: true } : {}, 
        };
        const { data } = await api.get(`/performance/a/${assignment_id}`, config);
        return data;
    } catch (err) {
        console.error("Error fetching class performance analysis:", err);
        throw err;
    }
};

export const getAllAnalysis = async () => {
    try {
        const response = await api.get('/performance');
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const getClassAnalysisByAssignmentId = async (assignment_id: string, confirm: boolean = false, force: boolean = false) => {
    try {
        const response = await api.get(`/performance/a/${assignment_id}?confirm=${confirm}&force=${force}`);
        return response.data;
    } catch (error) {
        throw error;
    }
}

export const getAnalysisById = async (analysis_id: string) => {
    try {
        const response = await api.get(`/performance/${analysis_id}`);
        return response.data;
    } catch (error) {
        throw error;
    }
}
