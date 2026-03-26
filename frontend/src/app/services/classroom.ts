import { api } from "../utils/api";
import Cookies from "js-cookie";

export interface classroomPayload {
    class_name: string;
    description?: string;
    class_color?: string;
    announce?: string[];
}

export const getClassroom = async () => {
    try {
        const token = Cookies.get("auth_token");
        const { data } = await api.get("/classrooms", {
            withCredentials: true,
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return data;
    } catch (err) {
        console.error("Error fetching classrooms:", err);
        throw err;
    }
};

export const getClassroomById = async (class_id: string) => {
    try {
        const token = Cookies.get("auth_token");
        const { data } = await api.get(`/classrooms/${class_id}`, {
            withCredentials: true,
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return data;
    } catch (err) {
        console.error("Error fetching classrooms:", err);
        throw err;
    }
};

export const createClassroom = async (payload: classroomPayload) => {
    try {
        const token = Cookies.get("auth_token");
        const { data } = await api.post(
            "/classrooms",
            payload,
            {
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return data;
    } catch (err) {
        console.error("Error fetching classrooms:", err);
        throw err;
    }
};

export const editClassroom = async (class_id: string, payload: Partial<classroomPayload>) => {
    try {
        const token = Cookies.get("auth_token");
        const  res  = await api.put(`/classrooms/${class_id}`,
            payload,
            {
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return res.data;
    } catch (err) {
        console.log("Error editing classroom:", err);
        throw err;
    }
}

export const deleteClassroom = async (class_id: string) => {
    try {
        const token = Cookies.get("auth_token");
        const { data } = await api.delete(`/classrooms/${class_id}`,
            {
                withCredentials: true,
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            }
        );
        return data;
    } catch (err) {
        console.log("Error deleting classroom:", err);
        throw err;
    }
}

// for teacher
export const getMyClassroom = async () => {
    try {
        const { data } = await api.get(`/classrooms/teacher/my`, {
            withCredentials: true,
        });
        return data;
    } catch (err) {
        console.error("Error fetching classrooms:", err);
        throw err;
    }
};

