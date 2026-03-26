"use client";
import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { FaChalkboardTeacher, FaUsers, FaFileAlt, FaClipboardCheck, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { MdClass, MdAssignment, MdPieChart } from "react-icons/md";
import { getMyClassroom } from "@/app/services/classroom";
import { getStudent } from "@/app/services/user";
import { getSubmission } from "@/app/services/submission";
import { getAssignment } from "@/app/services/assignment";
import { Classroom } from "@/app/types/classroom";
import { User } from "@/app/types/user";
import { Submission } from "@/app/types/submission";
import { Assignment } from "@/app/types/assignment";
import { ThaiDate } from "@/app/utils/date";
import { LoadingPage } from "@/app/components/utils/LoadingPage";
import ErrorPage from "@/app/components/utils/ErrorPage";


export default function Page() {
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [students, setStudents] = useState<User[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submissionPage, setSubmissionPage] = useState(1);
    const submissionsPerPage = 5;

    useEffect(() => {
        const fetchData = async () => {
            const safeFetch = async <T,>(fn: () => Promise<T>, fallback: T): Promise<T> => {
                try {
                    return await fn();
                } catch (error) {
                    console.warn("Data fetch failed:", error);
                    return fallback;
                }
            };

            try {
                const [classData, studentData, submissionData, assignmentData] = await Promise.all([
                    safeFetch(getMyClassroom, []),
                    safeFetch(getStudent, []),
                    safeFetch(getSubmission, []),
                    safeFetch(getAssignment, [])
                ]);

                setClassrooms(classData || []);
                setStudents(studentData || []);

                // Filter assignments and submissions by teacher's classrooms
                const myClassIds = new Set((classData || []).map((c: Classroom) => c.class_id));
                
                const filteredAssignments = (assignmentData || []).filter((a: Assignment) => 
                    myClassIds.has(a.class_id)
                );
                setAssignments(filteredAssignments);

                const assignmentIds = new Set(filteredAssignments.map((a: Assignment) => a.assignment_id));
                const filteredSubmissions = (submissionData || []).filter((s: Submission) => 
                    assignmentIds.has(s.assignment_id)
                );
                setSubmissions(filteredSubmissions);

            } catch (err) {
                console.error("Error fetching dashboard data:", err);
                setError("ไม่สามารถโหลดข้อมูลแดชบอร์ดได้");
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const totalStudentsCount = useMemo(() => {
        const studentIds = new Set<string>();
        classrooms.forEach(cls => {
            cls.studentList?.forEach(s => studentIds.add(s.user_id));
        });
        return studentIds.size;
    }, [classrooms]);

    const totalPending = useMemo(() => {
        return submissions.filter(s => s.status === "PENDING" || s.status === "รอตรวจ").length;
    }, [submissions]);

    const stats = [
        { label: "ห้องเรียนทั้งหมด", value: classrooms.length.toString(), icon: <FaChalkboardTeacher />, color: "bg-blue-500" },
        { label: "ผู้เรียนทั้งหมด", value: totalStudentsCount.toString(), icon: <FaUsers />, color: "bg-green-500" },
        { label: "งานที่มอบหมาย", value: assignments.length.toString(), icon: <FaFileAlt />, color: "bg-purple-500" },
        { label: "รอตรวจ", value: totalPending.toString(), icon: <FaClipboardCheck />, color: "bg-orange-500" },
    ];

    const recentClassroomsData = useMemo(() => {
        return classrooms.slice(0, 4).map((cls) => {
            return {
                id: cls.class_id,
                name: cls.class_name,
                students: cls.studentCount || 0,
                activeAssignments: cls.assignmentCount || 0
            };
        });
    }, [classrooms]);

    const recentSubmissionsData = useMemo(() => {
        const startIndex = (submissionPage - 1) * submissionsPerPage;
        return [...submissions]
            .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime())
            .slice(startIndex, startIndex + submissionsPerPage)
            .map((sub) => {
                const student = students.find(s => s.user_id === sub.student_id);
                const assignment = assignments.find(a => a.assignment_id === sub.assignment_id);
                return {
                    id: sub.submission_id,
                    student: student ? `${student.name} ${student.lastname}` : "ไม่ทราบชื่อ",
                    assignment: assignment ? assignment.title : "ไม่ทราบงาน",
                    time: ThaiDate(sub.submitted_at),
                    status: sub.status === "PENDING" || sub.status === "รอตรวจ" ? "รอตรวจ" : "ตรวจแล้ว"
                };
            });
    }, [submissions, students, assignments, submissionPage]);

    const totalSubmissionPages = Math.ceil(submissions.length / submissionsPerPage);

    const totalExpected = useMemo(() => {
        return classrooms.reduce((acc, cls) => {
            return acc + ((cls.studentCount || 0) * (cls.assignmentCount || 0));
        }, 0);
    }, [classrooms]);

    const submissionStats = useMemo(() => {
        const total = Math.max(submissions.length, totalExpected, 1);
        const graded = submissions.filter(s => s.status === "DONE" || s.status === "ตรวจแล้ว").length;
        const pending = submissions.filter(s => s.status === "PENDING" || s.status === "รอตรวจ").length;

        const gradedPercent = Math.round((graded / total) * 100);
        const pendingPercent = Math.round((pending / total) * 100);
        const notSubmittedPercent = Math.max(0, 100 - gradedPercent - pendingPercent);

        return [
            { label: "ตรวจแล้ว", value: gradedPercent, color: "#10B981" },
            { label: "รอตรวจ", value: pendingPercent, color: "#F59E0B" },
            { label: "ยังไม่ส่ง", value: notSubmittedPercent, color: "#EF4444" },
        ];
    }, [submissions, totalExpected]);

    if (isLoading) return <LoadingPage />;
    if (error) return <ErrorPage errorMessage={error} />;

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-slate-800">ภาพรวมของชั้นเรียน</h1>
                <p className="text-slate-500 text-lg">สรุปข้อมูลของชั้นเรียน</p>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
                        <div className={`${stat.color} p-4 rounded-lg text-white text-2xl`}>
                            {stat.icon}
                        </div>
                        <div>
                            <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
                            <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Submission Progress Pie Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-1">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center mb-6">
                        <MdPieChart className="mr-2 text-indigo-600" /> สรุปการส่งงาน
                    </h2>
                    <div className="flex flex-col items-center">
                        <div className="relative w-48 h-48">
                            <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                                <circle cx="18" cy="18" r="16" fill="transparent" stroke="#f1f5f9" strokeWidth="4" />
                                {/* Dynamic segments using stroke-dasharray and stroke-dashoffset */}
                                <circle
                                    cx="18" cy="18" r="16" fill="transparent"
                                    stroke={submissionStats[0].color}
                                    strokeWidth="4"
                                    strokeDasharray={`${submissionStats[0].value} 100`}
                                    strokeDashoffset="0"
                                />
                                <circle
                                    cx="18" cy="18" r="16" fill="transparent"
                                    stroke={submissionStats[1].color}
                                    strokeWidth="4"
                                    strokeDasharray={`${submissionStats[1].value} 100`}
                                    strokeDashoffset={`-${submissionStats[0].value}`}
                                />
                                <circle
                                    cx="18" cy="18" r="16" fill="transparent"
                                    stroke={submissionStats[2].color}
                                    strokeWidth="4"
                                    strokeDasharray={`${submissionStats[2].value} 100`}
                                    strokeDashoffset={`-${submissionStats[0].value + submissionStats[1].value}`}
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                                <span className="text-3xl font-bold text-slate-800">
                                    {submissionStats[0].value + submissionStats[1].value}%
                                </span>
                                <span className="text-xs text-slate-400">ส่งแล้วรวม</span>
                            </div>
                        </div>
                        <div className="mt-6 w-full space-y-2">
                            {submissionStats.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center">
                                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: item.color }}></div>
                                        <span className="text-slate-600">{item.label}</span>
                                    </div>
                                    <span className="font-semibold text-slate-800">{item.value}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Classrooms */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-2">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center">
                            <MdClass className="mr-2 text-blue-600" /> ห้องเรียนล่าสุด
                        </h2>
                        <Link href="/teacher/classrooms" className="text-blue-600 text-sm font-semibold hover:underline">ดูทั้งหมด</Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {recentClassroomsData.map((cls) => (
                            <Link
                                key={cls.id}
                                href={`/teacher/dashboard/${cls.id}`}
                                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-all hover:shadow-md border border-transparent hover:border-blue-100 group"
                            >
                                <div>
                                    <h4 className="font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">{cls.name}</h4>
                                    <p className="text-sm text-slate-500">{cls.students} ผู้เรียน | {cls.activeAssignments} งาน</p>
                                </div>
                                <div className="text-blue-600 font-bold transform group-hover:translate-x-1 transition-transform">→</div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Recent Submissions */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 lg:col-span-3">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-slate-800 flex items-center">
                            <MdAssignment className="mr-2 text-orange-600" /> ผู้เรียนที่ส่งงานล่าสุด
                        </h2>
                        <button className="text-blue-600 text-sm font-semibold hover:underline">ดูทั้งหมด</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-slate-500 text-sm border-b">
                                    <th className="pb-3 font-medium">ชื่อ-สกุล</th>
                                    <th className="pb-3 font-medium">หัวข้องาน</th>
                                    <th className="pb-3 font-medium">สถานะ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {recentSubmissionsData.map((sub) => (
                                    <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="py-4">
                                            <div className="font-medium text-slate-800">{sub.student}</div>
                                            <div className="text-xs text-slate-400">{sub.time}</div>
                                        </td>
                                        <td className="py-4 text-sm text-slate-600">{sub.assignment}</td>
                                        <td className="py-4">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${sub.status === "รอตรวจ" ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600"
                                                }`}>
                                                {sub.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex justify-between items-center mt-4 pt-4 border-t border-slate-100">
                        <span className="text-sm text-slate-500">
                            หน้าที่ {submissionPage} จาก {totalSubmissionPages || 1}
                        </span>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => setSubmissionPage(prev => Math.max(prev - 1, 1))}
                                disabled={submissionPage === 1}
                                className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 transition-colors"
                            >
                                <FaChevronLeft />
                            </button>
                            <button
                                onClick={() => setSubmissionPage(prev => Math.min(prev + 1, totalSubmissionPages))}
                                disabled={submissionPage === totalSubmissionPages || totalSubmissionPages === 0}
                                className="p-2 rounded-full hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 transition-colors"
                            >
                                <FaChevronRight />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
