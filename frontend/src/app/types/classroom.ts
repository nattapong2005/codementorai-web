import { Assignment } from "./assignment";
import { Submission } from "./submission";
import { User } from "./user";

export interface Classroom {
  class_id: string;
  class_name: string;
  class_color: string;
  description: string;
  announce: string[];
  teacher_id: string;
  teacher: Teacher;
  studentList?: User[];
  studentCount?: number;
  assignmentCount?: number;
}

export interface Teacher {
  name: string;
  lastname: string;
  email: string;
  role: string;
}
