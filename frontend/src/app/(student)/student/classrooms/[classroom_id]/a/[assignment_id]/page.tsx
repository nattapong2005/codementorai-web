"use client";

import { useAuth } from "@/app/context/AuthContext";
import { getAssignmentById } from "@/app/services/assignment";
import { getClassroomById } from "@/app/services/classroom";
import { getSubmissionByAssignmentId, postSubmission } from "@/app/services/submission";
import { Assignment } from "@/app/types/assignment";
import { Classroom } from "@/app/types/classroom";
import { Submission } from "@/app/types/submission";
import { ThaiDate } from "@/app/utils/date";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { PiChalkboardTeacherFill } from "react-icons/pi";
import {
    FaCheckCircle,
    FaClipboardList,
    FaCode,
    FaHistory,
    FaClock,
    FaCalendarTimes,
    FaFileUpload,
    FaTrash
} from "react-icons/fa";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { FaCircleCheck, FaFileCode } from "react-icons/fa6";
import { IoMdAlert } from "react-icons/io";
import { LoadingPage } from "@/app/components/utils/LoadingPage";
import { toast } from "react-toastify";
import { formatFeedback } from "@/app/utils/feedback";
import ConfirmModal from "@/app/components/modal/Confirm";


interface CodeQualityItem {
    dimension: string;
    description: string;
    isAppropriate: boolean;
}

interface AIFeedbackData {
    score?: number;
    feedback: string;
    mistake_tags?: string[];
    foundSyntaxError?: boolean;
    codeQuality?: CodeQualityItem[];
    logicError?: string;
    correctedCode?: string;
    explanation?: string;
}

const parseAiFeedback = (feedbackRaw: unknown): AIFeedbackData | null => {
    if (!feedbackRaw) return null;
    if (typeof feedbackRaw === 'object') return feedbackRaw as AIFeedbackData;
    try {
        return JSON.parse(feedbackRaw as string) as AIFeedbackData;
    } catch {
        return { feedback: String(feedbackRaw) };
    }
};

export default function Page() {
    const { assignment_id, classroom_id } = useParams<{ assignment_id: string; classroom_id: string }>();
    const { user } = useAuth();

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [code, setCode] = useState<string>("");
    const [fileName, setFileName] = useState<string>("");
    const [assignment, setAssignment] = useState<Assignment>();
    const [classroom, setClassroom] = useState<Classroom>();
    const [submission, setSubmission] = useState<Submission | null>(null);

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string>("");
    const [successMsg, setSuccessMsg] = useState<string>("");

    const fetchData = useCallback(async () => {
        if (!assignment_id || !user?.user_id) return;

        setIsLoading(true);
        try {
            const [assignRes, classRes, subRes] = await Promise.all([
                getAssignmentById(assignment_id),
                getClassroomById(classroom_id),
                getSubmissionByAssignmentId(assignment_id)
            ]);

            setAssignment(assignRes);
            setClassroom(classRes);

            if (Array.isArray(subRes)) {
                const mySub = subRes.find((s: Submission) => s.student_id === user.user_id);
                setSubmission(mySub || null);
            }

        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [assignment_id, classroom_id, user?.user_id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);


    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        setError("");
        try {
            const file = e.target.files?.[0];
            if (!file) return;

            if (!file.name.endsWith(".py")) {
                setError("กรุณาอัพโหลดไฟล์ .py เท่านั้น");
                return;
            }
            toast.success("อัพโหลดไฟล์ " + file.name + " เรียบร้อย");
            setFileName(file.name);
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                setCode(text);
            };
            reader.readAsText(file);
        } catch (err) {
            setError("ไม่สามารถอัพโหลดไฟล์ได้");
        }
    };

    const handleRemoveFile = () => {
        setFileName("");
        setCode("");
        // toast.info("ลบไฟล์เรียบร้อยแล้ว");
    };

    const handleUpload = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError("");
        setSuccessMsg("");

        if (!code) return setError("กรุณาอัพโหลดไฟล์ก่อนส่ง");
        if (!user?.user_id) return setError("ไม่พบข้อมูลผู้ใช้");

        setShowConfirmModal(true);
    };

    const submitAssignment = async () => {
        setIsSubmitting(true);
        try {
            const payload = {
                assignment_id: assignment_id,
                code: code,
                student_id: user?.user_id,
                status: "PENDING"
            };

            await postSubmission(payload);
            setSuccessMsg("ส่งงานเรียบร้อยแล้ว!");
            await fetchData();
            setShowConfirmModal(false);

        } catch (err) {
            console.error(err);
            setError("เกิดข้อผิดพลาดในการส่งงาน");
            setShowConfirmModal(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isGraded = submission?.status === "DONE" || submission?.status === "ตรวจแล้ว";
    const aiData = submission ? parseAiFeedback(submission.ai_feedback) : null;
    const isOverdue = assignment?.due_date ? new Date(assignment.due_date) < new Date() : false;

    const renderAiContent = (data: AIFeedbackData) => {
        return (
            <div className="space-y-5 animate-in fade-in duration-300">
                <div className="bg-gradient-to-r from-purple-50 to-white p-5 rounded-lg border border-purple-100 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                        <h4 className="font-bold text-purple-700 flex items-center gap-2 text-lg">
                            คำแนะนำจาก Codementor AI
                        </h4>
                        {data.foundSyntaxError && (
                            <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-1 rounded border border-red-200">
                                Syntax Error
                            </span>
                        )}
                    </div>

                    <p className="text-gray-700 text-sm leading-relaxed mb-3">
                        {data.feedback}
                    </p>
                    {data.mistake_tags && data.mistake_tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                            {data.mistake_tags.map((tag, i) => (
                                <span key={i} className="px-2 py-1 bg-red-50 text-red-600 text-xs rounded border border-red-100 font-medium">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
                {data.logicError && (
                    <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded-r-lg">
                        <h5 className="font-bold text-amber-800 text-sm mb-1 flex items-center gap-2">
                            ข้อผิดพลาดทางตรรกะ (Logic Error)
                        </h5>
                        <p className="text-amber-900 text-sm">{data.logicError}</p>
                    </div>
                )}

                {data.codeQuality && data.codeQuality.length > 0 && (
                    <div>
                        <h5 className="text-gray-600 text-xs font-bold uppercase tracking-wider mb-2">คุณภาพของโค้ด</h5>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {data.codeQuality.map((item, index) => (
                                <div
                                    key={index}
                                    className={`p-3 rounded-lg border flex items-start gap-3 text-sm transition-colors
                                        ${item.isAppropriate ? 'bg-green-50/50 border-green-200' : 'bg-orange-50/50 border-orange-200'}`}
                                >
                                    <div className={`mt-0.5 text-lg ${item.isAppropriate ? 'text-green-600' : 'text-gray-400'}`}>
                                        {item.isAppropriate ? <FaCircleCheck /> : <IoMdAlert />}
                                    </div>
                                    <div>
                                        <span className={`block font-bold ${item.isAppropriate ? 'text-green-800' : 'text-orange-800'}`}>
                                            {item.dimension}
                                        </span>
                                        <span className="text-gray-600 text-xs leading-tight block mt-1">
                                            {item.description}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {(data.correctedCode || data.explanation) && (
                    <div className="border border-green-200 rounded-lg overflow-hidden mt-4">
                        <div className="bg-green-50 px-4 py-2 border-b border-green-100 flex justify-between items-center">
                            <h5 className="font-bold text-green-800 text-sm">💡 แนวทางที่ถูกต้อง</h5>
                        </div>
                        <div className="p-4 bg-white">
                            {data.explanation && (
                                <div className="text-sm text-gray-700 mb-4 whitespace-pre-line">
                                    {data.explanation}
                                </div>
                            )}
                            <p>ตัวอย่างโค้ดที่ถูกต้อง</p>
                            {data.correctedCode && (
                                <div className="rounded-md overflow-hidden border border-gray-200 shadow-inner text-sm">
                                    <SyntaxHighlighter
                                        language="python"
                                        style={vscDarkPlus}
                                        customStyle={{ margin: 0, padding: '1rem' }}
                                        wrapLongLines={true}
                                    >
                                        {data.correctedCode}
                                    </SyntaxHighlighter>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    if (isLoading && !assignment) {
        return <LoadingPage />;
    }

    return (
        <div className=" bg-gray-50 min-h-screen">
            <div className=" mx-auto px-4 sm:px-6 lg:px-8">

                <div className="mb-5 bg-white p-5 rounded-lg shadow border border-gray-200  ">
                    <div className="flex justify-between">
                        <div>
                            <h1 className="text-lg sm:text-2xl font-bold text-gray-900">{assignment?.title}</h1>
                            <div className="flex flex-wrap items-center gap-x-4 text-sm text-gray-500 mt-2">
                                <span className="flex items-center gap-1"><PiChalkboardTeacherFill /> ผู้สอน: {classroom?.teacher?.name}</span>
                                <span className="flex items-center gap-1"><FaClock /> ครบกำหนด: {ThaiDate(assignment?.due_date)}</span>
                            </div>
                        </div>
                        <div>
                            <span className="inline-block px-4 py-1 text-sm sm:text-base font-semibold rounded-lg bg-primary text-white">
                                {formatFeedback(assignment?.feedback_level)}
                            </span>
                        </div>

                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-8 space-y-8">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex items-center gap-3">
                                <div className="bg-blue-100 text-blue-600 p-2 rounded-lg"><FaClipboardList /></div>
                                <h3 className="font-bold text-gray-800">รายละเอียดโจทย์</h3>
                                {submission?.score !== null && submission?.score !== undefined ? (
                                    <span className="ml-auto flex items-center gap-1 text-blue-600 bg-blue-50 px-3 py-2 rounded-md text-xs font-bold">
                                        {submission.score}/{assignment?.score} คะแนน
                                    </span>
                                ) : (
                                    <span className="ml-auto flex items-center gap-1 text-blue-600 bg-blue-50 px-3 py-2 rounded-md text-xs font-bold">
                                        {assignment?.score} คะแนน
                                    </span>
                                )}
                            </div>
                            <div className="p-6">
                                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                                    {assignment?.description || "ไม่มีรายละเอียด"}
                                </p>
                            </div>
                        </div>
                        {isGraded && submission && (
                            <div className="bg-white rounded-xl shadow-sm border border-green-200 overflow-hidden animate-in fade-in duration-500">
                                <div className="p-4 bg-green-50 border-b border-green-100 flex items-center justify-between text-green-800">
                                    <div className="flex items-center gap-2 font-bold text-lg">
                                        <FaCheckCircle className="text-xl" /> ผลการตรวจงาน
                                    </div>
                                </div>

                                <div className="p-6 space-y-6">
                                    {aiData ? renderAiContent(aiData) : (
                                        <div className="text-gray-400 italic text-center p-4">ไม่พบข้อมูลจาก AI</div>
                                    )}
                                    {submission.teacher_feedback && (
                                        <div className="bg-gray-50 p-5 rounded-lg border border-gray-200 mt-4">
                                            <div className="text-md font-bold text-gray-700 mb-2 flex items-center gap-2">
                                                <PiChalkboardTeacherFill className="text-lg" /> ข้อเสนอแนะจากอาจารย์
                                            </div>
                                            <p className="text-gray-700 leading-relaxed text-sm">{submission.teacher_feedback}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {submission && submission.code && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="p-3 bg-gray-800 border-b border-gray-700 flex items-center justify-between text-gray-300">
                                    <div className="flex items-center gap-2 font-mono text-sm">
                                        <FaCode /> โค้ดของผู้เรียน
                                    </div>
                                    <span className="text-[10px] font-bold bg-gray-700 px-2 py-0.5 rounded">PYTHON</span>
                                </div>
                                <SyntaxHighlighter
                                    language="python"
                                    style={vscDarkPlus}
                                    showLineNumbers
                                    customStyle={{ margin: 0, padding: '1.5rem', fontSize: '14px', lineHeight: '1.6' }}
                                >
                                    {submission.code}
                                </SyntaxHighlighter>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-4 space-y-6 lg:sticky top-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">สถานะการส่งงาน</h2>
                            {submission ? (
                                <div className="space-y-4">
                                    <div className={`p-4 rounded-lg border flex items-center gap-3
                                        ${isGraded
                                            ? 'bg-green-50 border-green-200 text-green-800'
                                            : 'bg-yellow-50 border-yellow-200 text-yellow-800'
                                        }`}>
                                        {isGraded ? <FaCheckCircle className="text-2xl" /> : <FaHistory className="text-2xl" />}
                                        <div>
                                            <p className="font-bold">{isGraded ? 'ตรวจแล้ว' : 'รอตรวจสอบ'}</p>
                                            <p className="text-xs opacity-80">
                                                {isGraded ? 'คุณได้รับคะแนนแล้ว' : 'อาจารย์กำลังดำเนินการ'}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-sm text-gray-500 flex gap-2 items-center px-1">
                                        <span>วันที่ส่ง</span>
                                        <span className="font-medium">{ThaiDate(submission.submitted_at)}</span>
                                    </div>
                                </div>
                            ) : isOverdue ? (
                                <div className="text-center py-6">
                                    <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <FaCalendarTimes className="text-3xl text-red-500" />
                                    </div>
                                    <h3 className="text-red-700 font-bold mb-1">หมดเวลาส่งงาน</h3>
                                    <p className="text-xs text-gray-500">เลยกำหนดส่งแล้ว ไม่สามารถส่งงานได้</p>
                                </div>
                            ) : (
                                <form onSubmit={handleUpload} className="space-y-4 animate-in slide-in-from-bottom-2">
                                    {error && (
                                        <div className="text-red-600 bg-red-50 px-3 py-2 rounded-lg text-xs border border-red-100 text-center">
                                            {error}
                                        </div>
                                    )}

                                    {fileName ? (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-between gap-3 text-blue-700 text-sm">
                                            <div className="flex items-center gap-3 truncate">
                                                <FaFileCode className="shrink-0" />
                                                <span className="truncate font-medium">{fileName}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={handleRemoveFile}
                                                className="text-red-500 hover:text-red-700 shrink-0"
                                                aria-label="Remove file"
                                            >
                                                <FaTrash />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className={`group flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-all
                                            ${isSubmitting
                                                ? 'bg-gray-100 border-gray-300 cursor-not-allowed'
                                                : 'bg-slate-50 border-gray-300 hover:bg-blue-50 hover:border-blue-400 hover:shadow-sm'
                                            }
                                        `}>
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-400 group-hover:text-blue-500 transition-colors">
                                                <FaFileUpload className="text-2xl mb-2" />
                                                <p className="text-sm font-medium">คลิกเพื่ออัปโหลด (.py)</p>
                                            </div>
                                            <input
                                                type="file"
                                                onChange={handleFileUpload}
                                                accept=".py"
                                                className="hidden"
                                                disabled={isSubmitting}
                                            />
                                        </label>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={isSubmitting || !code}
                                        className={`w-full font-bold rounded-lg px-5 py-3 text-center transition-all shadow-sm flex justify-center items-center gap-2
                                            ${isSubmitting || !code
                                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md active:scale-95'
                                            }
                                        `}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                กำลังส่ง...
                                            </>
                                        ) : "ยืนยันการส่งงาน"}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <ConfirmModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={submitAssignment}
                title="ยืนยันการส่งงาน"
                description={`คุณต้องการส่งงาน "${fileName || 'โค้ด'}" ใช่หรือไม่ เมื่อส่งแล้วจะไม่สามารถแก้ไขได้อีก`}
                confirmText="ยืนยันส่งงาน"
                isLoading={isSubmitting}
            />
        </div>
    );
}