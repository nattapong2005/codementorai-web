"use client";
import React, { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { FaUserGraduate, FaBook, FaClipboardList, FaChalkboardTeacher, FaChevronLeft, FaChevronRight, FaCheckCircle, FaExclamationTriangle, FaLightbulb } from "react-icons/fa";
import { MdAssignment, MdDateRange, MdPieChart, MdBarChart, MdAnalytics, MdOutlineDescription } from "react-icons/md";
import { getClassroomById } from "@/app/services/classroom";
import { getAssignmentByClassId } from "@/app/services/assignment";
import { getSubmission } from "@/app/services/submission";
import { getStudent, getUserByClassId } from "@/app/services/user";
import { getAllAnalysis, getClassAnalysisByAssignmentId } from "@/app/services/analyze";
import { Classroom } from "@/app/types/classroom";
import { Assignment } from "@/app/types/assignment";
import { Submission } from "@/app/types/submission";
import { User } from "@/app/types/user";
import { Enrollment } from "@/app/types/enrollment";
import { AssignmentAnalysis, StudentInsight } from "@/app/types/analysis";
import { ThaiDate } from "@/app/utils/date";
import { LoadingPage } from "@/app/components/utils/LoadingPage";
import ErrorPage from "@/app/components/utils/ErrorPage";
import BackButton from "@/app/components/utils/BackButton";
import ConfirmModal from "@/app/components/modal/Confirm";
import { toast } from "react-toastify";
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
} from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';

ChartJS.register(
    ArcElement,
    Tooltip,
    Legend,
    CategoryScale,
    LinearScale,
    BarElement,
    Title
);

export default function Page() {
    const { class_id } = useParams<{ class_id: string }>();

    const [classroom, setClassroom] = useState<Classroom | null>(null);
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [submissions, setSubmissions] = useState<Submission[]>([]);
    const [classStudents, setClassStudents] = useState<User[]>([]);
    const [analyses, setAnalyses] = useState<AssignmentAnalysis[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [studentPage, setStudentPage] = useState(1);
    const studentsPerPage = 5;
    const [assignmentPage, setAssignmentPage] = useState(1);
    const assignmentsPerPage = 5;

    // State for UI
    const [expandedAssignmentId, setExpandedAssignmentId] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState<string | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [analyzeTarget, setAnalyzeTarget] = useState<{ id: string, force: boolean } | null>(null);

    const fetchData = React.useCallback(async (showLoading = true) => {
        if (!class_id) return;

        const safeFetch = async <T,>(fn: () => Promise<T>, fallback: T): Promise<T> => {
            try {
                return await fn();
            } catch (error) {
                console.warn("Class dashboard safeFetch failed:", error);
                return fallback;
            }
        };

        try {
            if (showLoading) setIsLoading(true);

            // 1. Fetch Classroom Basic Info (Critical - if this fails, we might still want to show error or empty state, but let's try to load what we can)
            // We'll treat classroom info as somewhat critical, but still use safeFetch to prevent total crash if backend returns 404 text instead of JSON
            const [clsData, asmData] = await Promise.all([
                safeFetch(() => getClassroomById(class_id), null),
                safeFetch(() => getAssignmentByClassId(class_id), [])
            ]);

            setClassroom(clsData);
            setAssignments(asmData || []);

            // 2. Fetch Students & Enrollments (Partial Critical)
            const [allStudents, enrollmentsData] = await Promise.all([
                safeFetch(getStudent, []),
                safeFetch(() => getUserByClassId(class_id), [])
            ]);

            // Filter students who are enrolled in this class
            const enrolledStudentIds = new Set((enrollmentsData as Enrollment[] || []).map(e => e.student_id));
            const filteredStudents = (allStudents as User[] || []).filter(s => enrolledStudentIds.has(s.user_id));
            setClassStudents(filteredStudents);

            // 3. Fetch Submissions (Safe)
            const allSubmissions = await safeFetch(getSubmission, []);
            const classAssignmentIds = new Set((asmData as Assignment[] || []).map(a => a.assignment_id));
            // Ensure we filter correctly even if assignment fetch failed/returned empty
            if (classAssignmentIds.size > 0) {
                const classSubmissions = (allSubmissions as Submission[] || []).filter(s => classAssignmentIds.has(s.assignment_id));
                setSubmissions(classSubmissions);
            } else {
                setSubmissions([]);
            }

            // 4. Fetch Analysis (Safe)
            const allAnalyses = await safeFetch(getAllAnalysis, []);
            const classAnalyses = (allAnalyses as AssignmentAnalysis[] || []).filter(an => classAssignmentIds.has(an.assignment_id));
            setAnalyses(classAnalyses);

        } catch (err) {
            console.error("Error fetching class dashboard data:", err);
            // Don't set global error to block UI if possible, only if critical data missing?
            // For now, let's allow partial render.
            // setError("ไม่สามารถโหลดข้อมูลห้องเรียนได้"); 
        } finally {
            if (showLoading) setIsLoading(false);
        }
    }, [class_id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const executeAnalyze = async (assignmentId: string, force: boolean = false) => {
        try {
            setIsAnalyzing(assignmentId);
            const res = await getClassAnalysisByAssignmentId(assignmentId, true, force);
            if (res) {
                setAnalyses(prev => {
                    const filtered = prev.filter(a => a.assignment_id !== assignmentId);
                    return [...filtered, res];
                });
                toast.success("วิเคราะห์ข้อมูลเรียบร้อยแล้ว");
                fetchData(false);
            }
        } catch (err: unknown) {
            const error = err as { response: { data: { error: string } } };
            toast.error(error.response?.data.error || "เกิดข้อผิดพลาดในการวิเคราะห์")
        } finally {
            setIsAnalyzing(null);
        }
    };

    const handleAnalyze = (assignmentId: string, force: boolean = false) => {
        setAnalyzeTarget({ id: assignmentId, force });
        setIsConfirmOpen(true);
    };

    const handleConfirmAnalyze = () => {
        if (analyzeTarget) {
            executeAnalyze(analyzeTarget.id, analyzeTarget.force);
        }
        setIsConfirmOpen(false);
        setAnalyzeTarget(null);
    };

    const stats = useMemo(() => {
        const totalPending = submissions.filter(s => s.status === "PENDING" || s.status === "รอตรวจ").length;
        return [
            { label: "ผู้เรียน", value: classStudents.length, icon: <FaUserGraduate />, color: "bg-blue-500", shadow: "shadow-blue-200" },
            { label: "งานทั้งหมด", value: assignments.length, icon: <FaBook />, color: "bg-purple-500", shadow: "shadow-purple-200" },
            { label: "ส่งงานแล้ว", value: submissions.length, icon: <FaClipboardList />, color: "bg-green-500", shadow: "shadow-green-200" },
            { label: "รอตรวจ", value: totalPending, icon: <MdAssignment />, color: "bg-orange-500", shadow: "shadow-orange-200" },
        ];
    }, [classStudents, assignments, submissions]);

    const assignmentProgress = useMemo(() => {
        return assignments.map(asm => {
            const asmSubmissions = submissions.filter(s => s.assignment_id === asm.assignment_id);
            const submittedCount = asmSubmissions.length;
            const pendingCount = asmSubmissions.filter(s => s.status === "PENDING" || s.status === "รอตรวจ").length;
            const gradedCount = asmSubmissions.filter(s => s.status === "DONE" || s.status === "ตรวจแล้ว").length;

            const totalStudents = Math.max(classStudents.length, 1);
            const percent = Math.round((submittedCount / totalStudents) * 100);

            return {
                ...asm,
                submittedCount,
                pendingCount,
                gradedCount,
                percent: Math.min(percent, 100)
            };
        });
    }, [assignments, submissions, classStudents]);

    const analysisData = useMemo(() => {
        // Pie Chart Data
        const realTotal = classStudents.length * assignments.length;
        const gradedCount = submissions.filter(s => s.status === "DONE" || s.status === "ตรวจแล้ว").length;
        const pendingCount = submissions.filter(s => s.status === "PENDING" || s.status === "รอตรวจ").length;

        let gradedPercent = 0;
        let pendingPercent = 0;
        let missingPercent = 100;

        if (realTotal > 0) {
            gradedPercent = Math.round((gradedCount / realTotal) * 100);
            pendingPercent = Math.round((pendingCount / realTotal) * 100);
            missingPercent = Math.max(0, 100 - gradedPercent - pendingPercent);
        } else if (submissions.length > 0) {
            const total = submissions.length;
            gradedPercent = Math.round((gradedCount / total) * 100);
            pendingPercent = Math.round((pendingCount / total) * 100);
            missingPercent = 0;
        } else if (assignments.length === 0) {
            missingPercent = 0; // No assignments means no missing work
        }

        const pieData = [
            { label: "ตรวจแล้ว", value: gradedPercent, color: "#10B981" },
            { label: "รอตรวจ", value: pendingPercent, color: "#F59E0B" },
            { label: "ยังไม่ส่ง", value: missingPercent, color: "#EF4444" },
        ];

        // Bar Chart Data (Assignment Performance)
        const barData = assignments.map(asm => {
            const asmSubs = submissions.filter(s => s.assignment_id === asm.assignment_id);
            const totalScore = asmSubs.reduce((acc, s) => acc + (s.score || 0), 0);
            const avgScore = asmSubs.length > 0 ? totalScore / asmSubs.length : 0;
            return {
                title: asm.title,
                avg: avgScore,
                max: asm.score
            };
        });

        // AI Analysis Data
        const aiAnalysisData = assignments.map(asm => {
            const analysis = analyses.find(a => a.assignment_id === asm.assignment_id);
            const topPerformers = (analysis?.top_performers as unknown as StudentInsight[]) || [];
            const helpStudents = (analysis?.students_needing_help as unknown as StudentInsight[]) || [];

            return {
                id: asm.assignment_id,
                title: asm.title,
                topCount: topPerformers.length,
                helpCount: helpStudents.length,
                topPerformers,
                helpStudents,
                analysis,
                hasAnalysis: !!analysis
            };
        }).filter(d => d.hasAnalysis);

        return { pieData, barData, aiAnalysisData };
    }, [assignments, submissions, classStudents, analyses]);

    // Calculate AI Stats per student
    const studentAIStats = useMemo(() => {
        const stats: Record<string, { top: number, help: number, analyzed_count: number }> = {};

        // Initialize stats for known students
        classStudents.forEach(s => {
            stats[s.user_id] = { top: 0, help: 0, analyzed_count: analyses.length };
        });

        analyses.forEach(analysis => {
            const tops = (analysis.top_performers as unknown as StudentInsight[]) || [];
            const helps = (analysis.students_needing_help as unknown as StudentInsight[]) || [];

            tops.forEach(p => {
                // Try to match by Full Name or First Name
                const student = classStudents.find(s =>
                    `${s.name} ${s.lastname}`.trim() === p.studentName.trim() ||
                    s.name.trim() === p.studentName.trim()
                );
                if (student && stats[student.user_id]) {
                    stats[student.user_id].top += 1;
                }
            });

            helps.forEach(p => {
                const student = classStudents.find(s =>
                    `${s.name} ${s.lastname}`.trim() === p.studentName.trim() ||
                    s.name.trim() === p.studentName.trim()
                );
                if (student && stats[student.user_id]) {
                    stats[student.user_id].help += 1;
                }
            });
        });

        return stats;
    }, [classStudents, analyses]);

    const indexOfLastStudent = studentPage * studentsPerPage;
    const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
    const currentStudents = classStudents.slice(indexOfFirstStudent, indexOfLastStudent);
    const totalStudentPages = Math.ceil(classStudents.length / studentsPerPage);

    const indexOfLastAssignment = assignmentPage * assignmentsPerPage;
    const indexOfFirstAssignment = indexOfLastAssignment - assignmentsPerPage;
    const currentAssignments = assignmentProgress.slice(indexOfFirstAssignment, indexOfLastAssignment);
    const totalAssignmentPages = Math.ceil(assignmentProgress.length / assignmentsPerPage);

    if (isLoading) return <LoadingPage />;
    if (error) return <ErrorPage errorMessage={error} />;

    return (
        <div className="mx-auto space-y-8 pb-20 px-4 sm:px-6">
            {/* Header */}
            <header className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between py-8 border-b border-slate-200">
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-3 rounded-xl text-white shadow-lg shadow-blue-200 shrink-0">
                            <FaChalkboardTeacher size={24} className="sm:text-[28px]" />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight truncate">
                                {classroom?.class_name || "ไม่พบข้อมูลห้องเรียน"}
                            </h1>
                            <p className="text-slate-500 font-medium text-sm sm:text-base truncate">{classroom?.description || "ไม่มีคำอธิบาย"}</p>
                        </div>
                    </div>
                </div>
                <div className="inline-flex">
                    <BackButton />
                </div>
            </header>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 flex items-center justify-between group">
                        <div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</p>
                            <h3 className="text-3xl font-black text-slate-800">{stat.value}</h3>
                        </div>
                        <div className={`${stat.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg ${stat.shadow} group-hover:scale-110 transition-transform duration-300`}>
                            {stat.icon}
                        </div>
                    </div>
                ))}
            </div>

            {/* Analysis Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Submission Progress Pie Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-1 flex flex-col">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                            <MdPieChart className="text-indigo-600" size={22} />
                        </div>
                        สรุปการส่งงาน
                    </h2>
                    <div className="flex-1 flex flex-col items-center justify-center py-4 relative">
                        <div className="relative w-full h-64">
                            <Pie
                                data={{
                                    labels: analysisData.pieData.map(d => d.label),
                                    datasets: [
                                        {
                                            data: analysisData.pieData.map(d => d.value),
                                            backgroundColor: analysisData.pieData.map(d => d.color),
                                            borderWidth: 2,
                                            borderColor: '#ffffff',
                                        },
                                    ],
                                }}
                                options={{
                                    responsive: true,
                                    cutout: '75%',
                                    maintainAspectRatio: false,
                                    plugins: {
                                        legend: {
                                            position: 'bottom',
                                            labels: {
                                                usePointStyle: true,
                                                padding: 20,
                                                font: {
                                                    family: "inherit",
                                                    size: 12
                                                }
                                            }
                                        },
                                        tooltip: {
                                            callbacks: {
                                                label: function (context) {
                                                    return ` ${context.label}: ${context.raw}%`;
                                                }
                                            }
                                        }
                                    }
                                }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none pb-8">
                                <span className="text-4xl font-black text-slate-800">
                                    {analysisData.pieData[0].value + analysisData.pieData[1].value}%
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Submitted</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Assignment Average Scores Bar Chart */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2 flex flex-col">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center">
                            <MdBarChart className="text-indigo-600" size={22} />
                        </div>
                        คะแนนเฉลี่ยแต่ละงาน
                    </h2>
                    {analysisData.barData.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3 min-h-[250px] bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <MdAssignment size={40} className="text-slate-300" />
                            <p className="font-medium text-sm">ยังไม่มีข้อมูลคะแนน</p>
                        </div>
                    ) : (
                        <div className="flex-1 w-full h-[300px]">
                            <Bar
                                data={{
                                    labels: analysisData.barData.map(d => d.title),
                                    datasets: [
                                        {
                                            label: 'คะแนนเฉลี่ย',
                                            data: analysisData.barData.map(d => d.avg),
                                            backgroundColor: '#6366f1', // indigo-500
                                            borderRadius: 4,
                                        }
                                    ]
                                }}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    scales: {
                                        y: {
                                            beginAtZero: true,
                                            grid: {
                                                color: '#f1f5f9'
                                            }
                                        },
                                        x: {
                                            grid: {
                                                display: false
                                            }
                                        }
                                    },
                                    plugins: {
                                        legend: {
                                            display: false
                                        },
                                        tooltip: {
                                            callbacks: {
                                                title: (items) => items[0].label,
                                                label: (context) => {
                                                    const data = analysisData.barData[context.dataIndex];
                                                    return `Avg: ${Number(context.raw).toFixed(1)} / ${data.max}`;
                                                }
                                            }
                                        }
                                    }
                                }}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Assignments List */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center">
                            <FaClipboardList className="text-blue-600" size={20} />
                        </div>
                        ติดตามงานที่มอบหมาย
                    </h2>
                </div>

                <div className="space-y-4">
                    {assignmentProgress.length === 0 ? (
                        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                            <MdOutlineDescription className="mx-auto text-slate-300 mb-3" size={48} />
                            <p className="text-slate-500 font-medium">ยังไม่มีการมอบหมายงานในขณะนี้</p>
                        </div>
                    ) : (
                        currentAssignments.map((asm) => (
                            <div
                                key={asm.assignment_id}
                                className={`border rounded-xl transition-all duration-300 overflow-hidden ${expandedAssignmentId === asm.assignment_id ? 'border-indigo-200 ring-4 ring-indigo-50/50 bg-white shadow-md' : 'border-slate-200 hover:border-indigo-200 hover:shadow-sm bg-white'}`}
                            >
                                <div
                                    className="p-5 cursor-pointer"
                                    onClick={() => setExpandedAssignmentId(expandedAssignmentId === asm.assignment_id ? null : asm.assignment_id)}
                                >
                                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-bold text-lg text-slate-800 line-clamp-1" title={asm.title}>{asm.title}</h3>
                                                <span className="bg-slate-100 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border border-slate-200 whitespace-nowrap">
                                                    {asm.score} คะแนน
                                                </span>
                                            </div>
                                            <div className="flex items-center text-sm text-slate-500">
                                                <MdDateRange className="mr-1.5 text-slate-400" size={16} />
                                                <span className="whitespace-nowrap">ครบกำหนด:</span> <span className="font-medium ml-1 text-slate-700 truncate">{ThaiDate(asm.due_date)}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 w-full sm:w-auto sm:min-w-[200px]">
                                            <div className="flex-1">
                                                <div className="flex justify-between text-xs mb-1.5 font-medium">
                                                    <span className="text-slate-600">ความคืบหน้า</span>
                                                    <span className="text-indigo-600">{asm.percent}%</span>
                                                </div>
                                                <div className="w-full bg-slate-100 rounded-full h-2">
                                                    <div
                                                        className="bg-indigo-600 h-2 rounded-full transition-all duration-500 shadow-sm shadow-indigo-200"
                                                        style={{ width: `${asm.percent}%` }}
                                                    ></div>
                                                </div>
                                                <div className="flex gap-3 mt-2 text-[10px] font-medium flex-wrap">
                                                    <span className="text-green-600 flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                                        ตรวจแล้ว {asm.gradedCount}
                                                    </span>
                                                    <span className="text-orange-500 flex items-center gap-1">
                                                        <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>
                                                        รอตรวจ {asm.pendingCount}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className={`p-2 rounded-full transition-transform duration-300 ${expandedAssignmentId === asm.assignment_id ? 'bg-indigo-50 text-indigo-600 rotate-90' : 'text-slate-400'}`}>
                                                <FaChevronRight size={14} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                {expandedAssignmentId === asm.assignment_id && (
                                    <div className="border-t border-slate-100 bg-slate-50/50 p-4 sm:p-6 animate-in slide-in-from-top-2 duration-300">
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                            {/* Left: Student List Table */}
                                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
                                                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                                                    <h4 className="font-bold text-slate-700 flex items-center gap-2 text-sm">
                                                        <FaUserGraduate className="text-slate-400" />
                                                        รายการส่งงาน ({asm.submittedCount})
                                                    </h4>
                                                </div>
                                                <div className="overflow-auto max-h-[300px] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                                                    <table className="min-w-full divide-y divide-slate-100">
                                                        <thead className="bg-white sticky top-0 z-10 shadow-sm">
                                                            <tr>
                                                                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">ชื่อ-นามสกุล</th>
                                                                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">คะแนน</th>
                                                                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">สถานะ</th>
                                                                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">ความเห็น AI</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="bg-white divide-y divide-slate-50">
                                                            {submissions.filter(s => s.assignment_id === asm.assignment_id).map(sub => {
                                                                const student = classStudents.find(s => s.user_id === sub.student_id);
                                                                let feedbackText = "-";
                                                                if (sub.ai_feedback) {
                                                                    if (typeof sub.ai_feedback === 'string') {
                                                                        feedbackText = sub.ai_feedback;
                                                                    } else if (typeof sub.ai_feedback === 'object' && 'feedback' in sub.ai_feedback) {
                                                                        feedbackText = (sub.ai_feedback as { feedback: string }).feedback;
                                                                    }
                                                                }

                                                                return (
                                                                    <tr key={sub.submission_id} className="hover:bg-slate-50 transition-colors">
                                                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700 font-medium">{student ? `${student.name} ${student.lastname}` : 'ไม่พบข้อมูล'}</td>
                                                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-indigo-600">{sub.score}</td>
                                                                        <td className="px-4 py-3 whitespace-nowrap">
                                                                            <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide ${sub.status === 'DONE' || sub.status === 'ตรวจแล้ว' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                                                                {sub.status === 'DONE' || sub.status === 'ตรวจแล้ว' ? 'ตรวจแล้ว' : 'รอตรวจ'}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-4 py-3 text-xs text-slate-500 relative group/tooltip">
                                                                            <div className="truncate max-w-[120px] cursor-help border-b border-dotted border-slate-300 inline-block">
                                                                                {feedbackText}
                                                                            </div>
                                                                            {feedbackText !== "-" && (
                                                                                <div className="absolute right-0 bottom-full mb-2 hidden group-hover/tooltip:block bg-slate-800 text-white text-xs p-3 rounded-lg shadow-xl z-50 w-[250px] whitespace-normal leading-relaxed">
                                                                                    {feedbackText}
                                                                                    <div className="absolute right-4 top-full w-2 h-2 bg-slate-800 rotate-45 -mt-1"></div>
                                                                                </div>
                                                                            )}
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                            {asm.submittedCount === 0 && (
                                                                <tr>
                                                                    <td colSpan={4} className="px-4 py-8 text-center text-slate-400 italic">ยังไม่มีใครส่งงานนี้</td>
                                                                </tr>
                                                            )}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>

                                            {/* Right: AI Analysis Panel */}
                                            <div className="flex flex-col h-full">
                                                <div className="flex justify-between items-center mb-4">
                                                    <h4 className="font-bold text-slate-700 flex items-center gap-2 text-sm">
                                                        <MdAnalytics className="text-purple-600" size={18} />
                                                        วิเคราะห์ผลลัพธ์ด้วย AI
                                                    </h4>
                                                    {/* <button 
                                                        onClick={(e) => { e.stopPropagation(); handleAnalyze(asm.assignment_id, true); }}
                                                        disabled={isAnalyzing === asm.assignment_id}
                                                        className="text-xs bg-white text-purple-700 px-3 py-1.5 rounded-lg border border-purple-200 hover:bg-purple-50 disabled:opacity-50 flex items-center gap-2 transition-all shadow-sm font-medium"
                                                    >
                                                        {isAnalyzing === asm.assignment_id ? (
                                                            <>
                                                                <div className="w-3 h-3 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                                                                กำลังวิเคราะห์...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <MdTrendingUp />
                                                                {analyses.find(a => a.assignment_id === asm.assignment_id) ? 'วิเคราะห์ใหม่' : 'เริ่มการวิเคราะห์'}
                                                            </>
                                                        )}
                                                    </button> */}
                                                </div>

                                                <div className="flex-1 bg-white rounded-xl shadow-sm border border-purple-100 p-5 relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full -mr-12 -mt-12 opacity-50 pointer-events-none"></div>

                                                    {(() => {
                                                        const analysis = analyses.find(a => a.assignment_id === asm.assignment_id);
                                                        if (!analysis) return (
                                                            <div className="h-full min-h-[200px] flex flex-col items-center justify-center text-center p-4">
                                                                <div className="bg-purple-50 p-4 rounded-full mb-3">
                                                                    <FaLightbulb className="text-purple-300" size={24} />
                                                                </div>
                                                                <p className="text-slate-500 text-sm mb-4 max-w-[250px]">ใช้ AI ช่วยวิเคราะห์จุดแข็งและจุดอ่อนของผู้เรียนในงานชิ้นนี้</p>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleAnalyze(asm.assignment_id); }}
                                                                    disabled={isAnalyzing === asm.assignment_id}
                                                                    className="text-sm bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700 shadow-md shadow-purple-200 transition-all font-medium"
                                                                >
                                                                    {isAnalyzing === asm.assignment_id ? 'กำลังประมวลผล...' : 'เริ่มวิเคราะห์ตอนนี้'}
                                                                </button>
                                                            </div>
                                                        );

                                                        const topPerformers = (analysis.top_performers as unknown as StudentInsight[]) || [];
                                                        const helpStudents = (analysis.students_needing_help as unknown as StudentInsight[]) || [];

                                                        return (
                                                            <div className="space-y-5 relative z-10">
                                                                {/* Distribution Bar */}
                                                                <div>
                                                                    <div className="flex justify-between text-xs mb-2 font-medium">
                                                                        <span className="text-green-600">กลุ่มคะแนนดีเยี่ยม ({topPerformers.length})</span>
                                                                        <span className="text-red-500">กลุ่มที่ควรเสริม ({helpStudents.length})</span>
                                                                    </div>
                                                                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                                                                        <div className="h-full bg-green-400" style={{ width: `${(topPerformers.length / Math.max(classStudents.length, 1)) * 100}%` }}></div>
                                                                        <div className="h-full bg-slate-100 flex-1"></div>
                                                                        <div className="h-full bg-red-400" style={{ width: `${(helpStudents.length / Math.max(classStudents.length, 1)) * 100}%` }}></div>
                                                                    </div>
                                                                </div>

                                                                {/* Insights */}
                                                                <div className="grid grid-cols-1 gap-3">
                                                                    <div className="bg-green-50/80 p-4 rounded-xl border border-green-100">
                                                                        <p className="text-xs font-bold text-green-700 uppercase mb-2 flex items-center gap-2">
                                                                            <FaCheckCircle /> จุดเด่นภาพรวม
                                                                        </p>
                                                                        <p className="text-sm text-slate-700 leading-relaxed">{analysis.overall_strengths}</p>
                                                                    </div>
                                                                    <div className="bg-red-50/80 p-4 rounded-xl border border-red-100">
                                                                        <p className="text-xs font-bold text-red-700 uppercase mb-2 flex items-center gap-2">
                                                                            <FaExclamationTriangle /> จุดที่ควรพัฒนา
                                                                        </p>
                                                                        <p className="text-sm text-slate-700 leading-relaxed">{analysis.overall_weaknesses}</p>
                                                                    </div>
                                                                </div>

                                                                {/* Lists */}
                                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                                                    <div>
                                                                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-1.5">Top Performers</p>
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {topPerformers.length > 0 ? topPerformers.map((p, i) => (
                                                                                <span key={i} className="text-[10px] bg-green-50 text-green-700 border border-green-100 px-2 py-0.5 rounded-full">{p.studentName}</span>
                                                                            )) : <span className="text-xs text-slate-400">-</span>}
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[10px] text-slate-400 uppercase font-bold mb-1.5">Needs Help</p>
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {helpStudents.length > 0 ? helpStudents.map((p, i) => (
                                                                                <span key={i} className="text-[10px] bg-red-50 text-red-700 border border-red-100 px-2 py-0.5 rounded-full">{p.studentName}</span>
                                                                            )) : <span className="text-xs text-slate-400">-</span>}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Assignment Pagination */}
                {assignmentProgress.length > assignmentsPerPage && (
                    <div className="flex justify-center items-center gap-4 mt-8 pt-6 border-t border-slate-100">
                        <button
                            onClick={() => setAssignmentPage(prev => Math.max(prev - 1, 1))}
                            disabled={assignmentPage === 1}
                            className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600"
                        >
                            <FaChevronLeft />
                        </button>
                        <span className="text-sm font-medium text-slate-600 bg-slate-50 px-4 py-1.5 rounded-lg border border-slate-100">
                            หน้า {assignmentPage} / {totalAssignmentPages}
                        </span>
                        <button
                            onClick={() => setAssignmentPage(prev => Math.min(prev + 1, totalAssignmentPages))}
                            disabled={assignmentPage === totalAssignmentPages}
                            className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600"
                        >
                            <FaChevronRight />
                        </button>
                    </div>
                )}
            </div>

            {/* Students List */}
            <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
                            <FaUserGraduate className="text-green-600" size={20} />
                        </div>
                        รายชื่อผู้เรียนในห้อง
                    </h2>
                    <span className="text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">{classStudents.length} คน</span>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50/80">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">ชื่อ-นามสกุล</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider hidden sm:table-cell">อีเมล</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    สรุปผลงาน (AI Analysis)
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-100">
                            {classStudents.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-10 text-center text-slate-400">
                                        ยังไม่มีผู้เรียนในห้องเรียนนี้
                                    </td>
                                </tr>
                            ) : (
                                currentStudents.map((std) => (
                                    <tr key={std.user_id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                                    {std.name.charAt(0)}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-bold text-slate-900">{std.name} {std.lastname}</div>
                                                    <div className="text-xs text-slate-500 sm:hidden">{std.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 hidden sm:table-cell">
                                            {std.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap align-middle">
                                            {(() => {
                                                const stat = studentAIStats[std.user_id];
                                                if (!stat || stat.analyzed_count === 0) return <span className="text-xs text-slate-400 italic">ยังไม่มีข้อมูลวิเคราะห์</span>;

                                                const topPercent = (stat.top / stat.analyzed_count) * 100;
                                                const helpPercent = (stat.help / stat.analyzed_count) * 100;

                                                return (
                                                    <div className="w-full max-w-[200px]">
                                                        <div className="flex justify-between text-[10px] mb-1.5 font-medium text-slate-500">
                                                            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"></div>ดีเยี่ยม: {stat.top}</span>
                                                            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div>ปรับปรุง: {stat.help}</span>
                                                        </div>
                                                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                                                            <div className="h-full bg-green-500" style={{ width: `${topPercent}%` }} title={`ทำได้ดีเยี่ยม: ${stat.top} งาน`}></div>
                                                            <div className="h-full bg-slate-200 flex-1"></div>
                                                            <div className="h-full bg-red-500" style={{ width: `${helpPercent}%` }} title={`ควรฝึกเพิ่มเติม: ${stat.help} งาน`}></div>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Student Pagination */}
                {classStudents.length > studentsPerPage && (
                    <div className="flex justify-center items-center gap-4 mt-6 pt-6 border-t border-slate-100">
                        <button
                            onClick={() => setStudentPage(prev => Math.max(prev - 1, 1))}
                            disabled={studentPage === 1}
                            className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600"
                        >
                            <FaChevronLeft />
                        </button>
                        <span className="text-sm font-medium text-slate-600 bg-slate-50 px-4 py-1.5 rounded-lg border border-slate-100">
                            หน้า {studentPage} / {totalStudentPages}
                        </span>
                        <button
                            onClick={() => setStudentPage(prev => Math.min(prev + 1, totalStudentPages))}
                            disabled={studentPage === totalStudentPages}
                            className="p-2.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-slate-600"
                        >
                            <FaChevronRight />
                        </button>
                    </div>
                )}
            </div>

            <ConfirmModal
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={handleConfirmAnalyze}
                title="ยืนยันการวิเคราะห์"
                description="การวิเคราะห์ผลลัพธ์ด้วย AI อาจใช้เวลาสักครู่ คุณต้องการดำเนินการต่อหรือไม่?"
                confirmText="เริ่มวิเคราะห์"
            />
        </div>
    );
}