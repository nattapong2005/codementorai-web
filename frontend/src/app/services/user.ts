import { api } from "../utils/api";

interface createUser {
    std_id: string;
    name: string;
    lastname: string;
    email: string;
    password: string;
    level: "VOC_1" | "VOC_2" | "VOC_3" | "VHC_1" | "VHC_2" | string;
    role: "STUDENT" | "TEACHER" | "ADMIN" | string;
}

export const getUser = async () => {
    try {
        const { data } = await api.get("/users", {
            withCredentials: true,
        });
        return data;
    } catch (err) {
        console.error("Error fetching users:", err);
        throw err;
    }
};

export const getStudent = async () => {
    try {
        const { data } = await api.get("/users/students", {
            withCredentials: true,
        });
        return data;
    } catch (err) {
        console.error("Error fetching students:", err);
        throw err;
    }
};

export const getUserByClassId = async (class_id: string) => {
    try {
        const { data } = await api.get(`/enrollments/c/${class_id}`, {
            withCredentials: true,
        });
        return data;
    } catch (err) {
        console.error("Error fetching user:", err);
        throw err;
    }
};

export const getUserNotEnrolled = async (class_id: string) => {
    try {
        const { data } = await api.get(`/enrollments/c/${class_id}/not-enrolled`, {
            withCredentials: true,
        });
        return data;
    } catch (err) {
        console.error("Error fetching user:", err);
        throw err;
    }
};


export const createUser = async (payload: createUser) => {
    try {
        const res = await api.post('/users', payload, {
            withCredentials: true,
        });
        return res
    } catch (err) {
        console.error("Error creating user:", err);
        throw err;
    }
};

export const getUserById = async (student_id: string) => {
    try {
        const { data } = await api.get(`/users/${student_id}`, {
            withCredentials: true,
        });
        return data;
    } catch (err) {
        console.error("Error getting user:", err);
        throw err;
    }
};

export const getMe = async () => {
    try {
        const { data } = await api.get("/users/me", {
            withCredentials: true,
        });
        return data;
    } catch (err) {
        console.error("Error fetching me:", err);
        throw err;
    }
}

export const deleteUser = async (user_id: string) => {
    try {
        await api.delete(`/users/${user_id}`, {
            withCredentials: true,
        });
    } catch (err) {
        console.error("Error deleting user:", err);
        throw err;
    }
};

export const updateUser = async (user_id: string, payload: Partial<createUser>) => {
    try {
        const { data } = await api.put(`/users/${user_id}`, payload, {
            withCredentials: true,
        });
        return data;
    } catch (err) {
        console.error("Error updating user:", err);
        throw err;
    }
};