import Cookies from "js-cookie";
import { api } from "../utils/api";

interface createAssignmentPayload {
    class_id: string;
    title: string;
    score: number;
    feedback_level: string;
    description: string;
    due_date: string;
};

interface updateAssignmentPayload {
    title: string;
    score: number;
    feedback_level: string;
    description: string;
    due_date: string;
};

export const getAssignment = async () => {
    try {
        const { data } = await api.get("/assignments", {
            withCredentials: true,
        });
        return data;
    } catch (err) {
        console.error("Error fetching assignments:", err);
        throw err;
    }
};

export const getAssignmentById = async (assignment_id: string) => {
    try {
        const { data } = await api.get(`/assignments/${assignment_id}`, {
            withCredentials: true,
        });
        return data;
    } catch (err) {
        console.error("Error fetching assignment:", err);
        throw err;
    }
};

export const getAssignmentByClassId = async (class_id: string) => {
    try {
        const token = Cookies.get("auth_token");
        const { data } = await api.get(`/assignments/c/${class_id}`, {
            withCredentials: true,
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return data;
    } catch (err) {
        console.error("Error fetching assignment:", err);
        throw err;
    }
};

export const getAssignmentStatus = async (class_id: string) => {
    try {
        const { data } = await api.get(`/assignments/status/${class_id}`, {
            withCredentials: true,
        });
        return data;
    } catch (err) {
        console.error("Error fetching assignment status:", err);
        throw err;
    }
};


export const postAssignment = async (payload: createAssignmentPayload) => {
    try {
        const { data } = await api.post(
            "/assignments",
            payload,
            {
                withCredentials: true,
            }
        );
        return data;
    } catch (err) {
        console.error("Error posting assignment:", err);
        throw err;
    }
}

export const updateAssignment = async (assignment_id: string, payload: updateAssignmentPayload) => {
    try {
        const { data } = await api.put(`/assignments/${assignment_id}`, payload, {
            withCredentials: true,
        }); 
        return data;
    } catch (err) {
        console.error("Error updating assignment:", err);
        throw err;
    }
};

export const deleteAssignment = async (assignment_id: string) => {
    try {
        const { data } = await api.delete(`/assignments/${assignment_id}`, {
            withCredentials: true,
        });
        return data;
    } catch (err) {
        console.error("Error deleting assignment:", err);
        throw err;
    }
};