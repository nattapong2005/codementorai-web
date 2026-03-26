import { api } from "../utils/api";

interface SubmitPayload {
    assignment_id?: string,
    code?: string,
    student_id?: string;
    status?: string;
    score?: number;
    teacher_feedback?: string;
}

export const getSubmission = async () => {
    try {
        const res = await api.get("/submissions",
            {
                withCredentials: true,
            }
        );
        return res.data;
    } catch (err) {
        console.error("Error getting submission:", err);
        throw err;
    }
};

export const postSubmission = async (payload: SubmitPayload) => {
    try {
        const res = await api.post("/submissions/test", payload,
            {
                withCredentials: true,
            }
        );
        return res.data;
    } catch (err) {
        console.error("Error sending submission:", err);
        throw err;
    }
};

export const updateSubmission = async (submission_id: string, payload: SubmitPayload) => {
    try {
        const res = await api.put(`/submissions/${submission_id}`, payload,
            {
                withCredentials: true,
            }
        );
        return res.data;
    } catch (err) {
        console.error("Error updating submission:", err);
        throw err;
    }
};


export const getSubmissionById = async (submission_id: string) => {
    try {
        const { data } = await api.get(`/submissions/${submission_id}`, {
            withCredentials: true,
        });
        return data;
    } catch (err) {
        console.error("Error getting submission:", err);
        throw err;
    }
}

export const getSubmissionByAssignmentId = async (assignment_id: string) => {
    try {
        const { data } = await api.get(`/submissions/assignment/${assignment_id}`, {
            withCredentials: true,
        });
        return data;
    } catch (err) {
        console.error("Error getting submission:", err);
        throw err;
    }
};


export const deleteSubmission = async (submission_id: string) => {
    try {
        const res = await api.delete(`/submissions/${submission_id}`,
            {
                withCredentials: true,
            }
        );
        return res.data;
    } catch (err) {
        console.error("Error deleting submission:", err);
        throw err;
    }
};