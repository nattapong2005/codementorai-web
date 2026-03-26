import { api } from "../utils/api";
import { LoginRequest, LoginResponse } from "../types/auth";

export const login = async ({ std_id, password }: LoginRequest): Promise<LoginResponse> => {
    try {
        const { data } = await api.post<LoginResponse>(
            "/auth/login",
            { std_id, password },
            { withCredentials: true }
        );
        return data;
    } catch (err: unknown) {
        console.error(err);
        const error = err as { response?: { data?: { message?: string } }, message: string };
        throw new Error(error.response?.data?.message || error.message);
    }
};
export const logout = async () => {
    try {
        const response = await api.post("/auth/logout", {},
            { withCredentials: true });
        return response;
    } catch (err) {
        console.error("Logout error:", err);
        throw new Error('Logout failed');
    }
};