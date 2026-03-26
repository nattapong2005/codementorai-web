"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getUserById } from "@/app/services/user";
import { User } from "@/app/types/user";
import { useParams } from "next/navigation";

export default function Page() {

    const { classroom_id, student_id } = useParams<{ classroom_id: string, student_id: string }>();

    const [student, setStudent] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStudentDetails = async () => {
            try {
                const studentData = await getUserById(student_id);
                setStudent(studentData);
            } catch (err) {
                setError("Failed to fetch student details.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchStudentDetails();
    }, [student_id]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-500 mt-10">
                <h2 className="text-2xl font-semibold">Error</h2>
                <p>{error}</p>
                <Link href={`/teacher/classrooms/${classroom_id}/students`} className="text-blue-500 hover:underline mt-4 inline-block">
                    &larr; Back to Classroom Students
                </Link>
            </div>
        );
    }

    if (!student) {
        return (
            <div className="text-center text-gray-500 mt-10">
                <h2 className="text-2xl font-semibold">Student Not Found</h2>
                <Link href={`/teacher/classrooms/${classroom_id}/students`} className="text-blue-500 hover:underline mt-4 inline-block">
                    &larr; Back to Classroom Students
                </Link>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <Link href={`/teacher/classrooms/${classroom_id}/students`} className="text-blue-500 hover:underline">
                    &larr; Back to Classroom Students
                </Link>
            </div>
            <div className="bg-white rounded-lg shadow-xl p-8">
                <div className="flex items-center flex-col md:flex-row">
                    <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center mb-6 md:mb-0 md:mr-8">
                        <span className="text-5xl font-bold text-gray-500">{student.name.charAt(0)}{student.lastname.charAt(0)}</span>
                    </div>
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl font-bold text-gray-800">{student.name} {student.lastname}</h1>
                        <p className="text-xl text-gray-600">{student.email}</p>
                    </div>
                </div>
                <div className="mt-8 border-t border-gray-200 pt-6">
                    <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Student ID</dt>
                            <dd className="mt-1 text-lg text-gray-900">{student.std_id}</dd>
                        </div>
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Level</dt>
                            <dd className="mt-1 text-lg text-gray-900">{student.level}</dd>
                        </div>
                        <div className="sm:col-span-1">
                            <dt className="text-sm font-medium text-gray-500">Role</dt>
                            <dd className="mt-1 text-lg text-gray-900 capitalize">{student.role.toLowerCase()}</dd>
                        </div>
                    </dl>
                </div>
            </div>
        </div>
    );
}
