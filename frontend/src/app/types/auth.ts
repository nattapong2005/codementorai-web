export interface LoginRequest {
    std_id: string;
    password: string;
}
export interface LoginResponse {
    token: string;
    user_id: number;
    name: string;
    role: string;
    message?: string
}

export interface JwtPayload {
    user_id?: string;
}

