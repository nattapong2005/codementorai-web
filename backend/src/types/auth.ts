import { Role } from "../generated/prisma";

export interface AuthUser {
  user_id: string;
  role: Role;
}
