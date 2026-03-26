import { Enrollment } from "./enrollment";

export interface User {
  user_id: string;
  std_id: string;
  name: string;
  lastname: string;
  email: string;
  password: string;
  level: "VOC_1" | "VOC_2" | "VOC_3" | "VHC_1" | "VHC_2" | string;
  role: "STUDENT" | "TEACHER" | "ADMIN" | string; 
  enrollments: Enrollment[];
}