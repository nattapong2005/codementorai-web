import { api } from "../utils/api";

export const getMyEnrollment = async () => {
    try {
        const { data } = await api.get("/enrollments/my", {
            withCredentials: true,
        });
        return data;
    } catch (err) {
        console.error("Error fetching enrollments:", err);
        throw err;
    }
};

export const createEnrollment = async (class_id: string, student_id: string) => {
    try {
        const { data } = await api.post("/enrollments", { class_id, student_id }, {
            withCredentials: true,
        });
        return data;
    } catch (err) {
        console.error("Error creating enrollment:", err);
        throw err;
    }
};