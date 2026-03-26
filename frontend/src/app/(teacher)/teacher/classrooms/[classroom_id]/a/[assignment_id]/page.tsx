'use client';

import { IoCloseSharp } from 'react-icons/io5';
import { getAssignmentById } from '@/app/services/assignment';
import { deleteSubmission, getSubmissionByAssignmentId, updateSubmission } from '@/app/services/submission';
import { getUserById, getUserByClassId } from '@/app/services/user'; // [NEW] เรียกใช้ Service
import { Assignment } from '@/app/types/assignment';
import { Submission } from '@/app/types/submission';
import { User } from '@/app/types/user';
import { ThaiDate } from '@/app/utils/date';
import { formatFeedback } from '@/app/utils/feedback';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { FaCircleCheck, FaEllipsis, FaTrash, FaBolt, FaArrowLeft } from 'react-icons/fa6';
import { IoMdAlert } from 'react-icons/io';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { getClassPerformance } from '@/app/services/analyze';
import ConfirmModal from '@/app/components/modal/Confirm';
import DeleteModal from '@/app/components/modal/Delete';
import MyModal from '@/app/components/Modal';
import { toast } from 'react-toastify';


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
  type?: string;
  details?: string;
}

interface StudentInsight {
  studentName: string;
  reason: string;
}

interface PerformanceData {
  overallStrengths: string;
  overallWeaknesses: string;
  studentsNeedingHelp: StudentInsight[];
  topPerformers: StudentInsight[];
}

interface MyWideModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

interface EnrollmentResponse {
    enrollment_id: string;
    joined_at: string;
    class_id: string;
    student_id: string;
    student: User;
}


const MyWideModal: React.FC<MyWideModalProps> = ({ isOpen, onClose, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 bg-opacity-50" onClick={onClose}>
      <div className="relative w-full max-w-5xl p-10 bg-white rounded-lg shadow-lg animate-fade-in max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 cursor-pointer z-10">
          <IoCloseSharp size={20} />
        </button>
        {children}
      </div>
    </div>
  );
};

export default function Page() {
  const { assignment_id, classroom_id } = useParams<{ assignment_id: string; classroom_id: string }>();
  const router = useRouter();

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [students, setStudents] = useState<User[]>([]); // All students in class
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [usersCache, setUsersCache] = useState<Record<string, User>>({});

  const [activeTab, setActiveTab] = useState<'submitted' | 'missing'>('submitted');

  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [editScore, setEditScore] = useState<string | number>('');
  const [editFeedback, setEditFeedback] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(true);
  const [showAiComment, setShowAiComment] = useState<boolean>(true);

  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const currentSubmissionIdRef = useRef<string | null>(null);

  const [showPerformanceAnalysis, setShowPerformanceAnalysis] = useState<boolean>(false);
  const [showPerformanceModal, setShowPerformanceModal] = useState<boolean>(false);

  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [isPerformanceAnalyzed, setIsPerformanceAnalyzed] = useState<boolean>(false);
  const [isPerformanceLoading, setIsPerformanceLoading] = useState<boolean>(false);

  const [hasFetchedPerformance, setHasFetchedPerformance] = useState<boolean>(false);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [showErrorModal, setShowErrorModal] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [submissionToDelete, setSubmissionToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  const parseAiFeedback = (feedbackRaw: unknown): AIFeedbackData | null => {
    if (!feedbackRaw) return null;
    if (typeof feedbackRaw === 'object') {
      return feedbackRaw as AIFeedbackData;
    }
    try {
      return JSON.parse(feedbackRaw as string) as AIFeedbackData;
    } catch (e) {
      return { feedback: String(feedbackRaw) };
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toUpperCase() || '';
    if (s === 'DONE') {
      return { label: 'ตรวจแล้ว', className: 'bg-green-100 text-green-700 border-green-200' };
    }
    return { label: 'รอตรวจ', className: 'bg-yellow-100 text-yellow-700 border-yellow-200' };
  };

  const fetchData = useCallback(async () => {
    if (!assignment_id || !classroom_id) return;
    setLoading(true);
    try {
      const [assignmentData, submissionsData, studentsData] = await Promise.all([
        getAssignmentById(assignment_id),
        getSubmissionByAssignmentId(assignment_id),
        getUserByClassId(classroom_id)
      ]);

      setAssignment(assignmentData);
      setSubmissions(submissionsData);
      
      const studentList = (studentsData as EnrollmentResponse[]).map((item) => item.student);
      setStudents(studentList);

      // Pre-fill cache with students from class list to avoid extra fetches
      const initialCache: Record<string, User> = {};
      studentList.forEach(s => {
        initialCache[s.user_id] = s;
      });
      setUsersCache(prev => ({ ...prev, ...initialCache }));

      if (submissionsData.length > 0) {
        handleSelectSubmission(submissionsData[0]);
      }
    } catch (err) {
      // console.error(err);
    } finally {
      setLoading(false);
    }
  }, [assignment_id, classroom_id]);

  useEffect(() => {
    fetchData();
    const handleClickOutside = () => setShowDropdown(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [fetchData]);


  const fetchPerformanceData = useCallback(async () => {
    if (!assignment_id) return;

    setIsPerformanceLoading(true);
    try {
      const res = await getClassPerformance(assignment_id, false);
      if (res.analyzed) {
        setPerformanceData(res.data);
        setIsPerformanceAnalyzed(true);
      } else {
        setIsPerformanceAnalyzed(false);
        setPerformanceData(null);
      }
    } catch (error) {
      console.error("Failed to fetch performance data:", error);
    } finally {
      setIsPerformanceLoading(false);
      setHasFetchedPerformance(true);
    }
  }, [assignment_id]);

  useEffect(() => {
    setHasFetchedPerformance(false);
    setPerformanceData(null);
    setIsPerformanceAnalyzed(false);
  }, [assignment_id]);


  useEffect(() => {
    if (showPerformanceAnalysis || showPerformanceModal) {
      if (!performanceData && !isPerformanceLoading && !hasFetchedPerformance) {
        fetchPerformanceData();
      }
    }
  }, [
    showPerformanceAnalysis,
    showPerformanceModal,
    performanceData,
    isPerformanceLoading,
    hasFetchedPerformance,
    fetchPerformanceData
  ]);

  const handleStartAnalysis = async () => {
    if (!assignment_id) return;
    setIsPerformanceLoading(true);
    try {
      const res = await getClassPerformance(assignment_id, true);
      setPerformanceData(res.data);
      setIsPerformanceAnalyzed(true);
    } catch (error: unknown) {
      const err = error as { response: { data: { error: string } } };
      // console.error(error.response.data.error);
      setErrorMessage(err.response?.data?.error || 'เกิดข้อผิดพลาดในการวิเคราะห์');
      setShowErrorModal(true);
    } finally {
      setIsPerformanceLoading(false);
    }
  };

  const calculateStats = () => {
    if (submissions.length === 0) return { classAvg: 0, avgScore: 0 };
    const totalScore = submissions.reduce((sum, sub) => sum + (sub.score || 0), 0);
    const avgScore = totalScore / submissions.length;
    const fullScore = assignment?.score || 10;
    const classAvgPercent = (avgScore / fullScore) * 100;
    return {
      classAvg: classAvgPercent.toFixed(1),
      avgScore: avgScore.toFixed(1)
    };
  };

  const { classAvg, avgScore } = calculateStats();

  const submittedStudentIds = new Set(submissions.map(s => s.student_id));
  const missingStudents = students.filter(s => !submittedStudentIds.has(s.user_id));

  const handleSelectMissingStudent = (student: User) => {
    setSelectedUser(student);
    setSelectedSubmission(null);
    setShowDropdown(false);
    setEditScore('');
    setEditFeedback('');
    setShowPerformanceAnalysis(false);
  };

  const handleSelectSubmission = async (sub: Submission) => {
    setSelectedSubmission(sub);
    setShowDropdown(false);
    currentSubmissionIdRef.current = sub.submission_id;

    setEditScore(sub.score ?? '');
    setEditFeedback(sub.teacher_feedback || '');
    setShowPerformanceAnalysis(false);

    if (usersCache[sub.student_id]) {
      setSelectedUser(usersCache[sub.student_id]);
    } else {
      setSelectedUser(null);
      try {
        const user = await getUserById(sub.student_id);
        if (currentSubmissionIdRef.current === sub.submission_id) {
          setSelectedUser(user);
          setUsersCache(prev => ({ ...prev, [sub.student_id]: user }));
        }
      } catch (error) {
        console.error("Error fetching user details", error);
      }
    }
  };

  const handleSaveGrade = async () => {
    if (!selectedSubmission) return;

    setIsSaving(true);
    try {
      const payload = {
        score: Number(editScore),
        teacher_feedback: editFeedback,
        status: 'DONE'
      };

      await updateSubmission(selectedSubmission.submission_id, payload);

      const updatedSubmissions = submissions.map(s =>
        s.submission_id === selectedSubmission.submission_id
          ? { ...s, ...payload, status: 'DONE' }
          : s
      );

      setSubmissions(updatedSubmissions);
      setSelectedSubmission({ ...selectedSubmission, ...payload, status: 'DONE' });
      toast.success("บันทึกคะแนนเรียบร้อยแล้ว");

    } catch (error) {
      console.error("Failed to update grade", error);
      toast.error("เกิดข้อผิดพลาดในการบันทึกคะแนน");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSubmission = (submission_id: string) => {
    setSubmissionToDelete(submission_id);
    setShowDeleteModal(true);
  };

  const confirmDeleteSubmission = async () => {
    if (!submissionToDelete) return;
    setIsDeleting(true);
    try {
      await deleteSubmission(submissionToDelete);
      window.location.reload();
    } catch (err: unknown) {
      toast.error("เกิดข้อผิดพลาดในการลบงาน");
      console.log(err);
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const aiData = parseAiFeedback(selectedSubmission?.ai_feedback);

  const renderAiContent = (data: AIFeedbackData) => {
    return (
      <div className="space-y-5 animate-in fade-in duration-300">
        <div className="bg-gradient-to-r from-purple-50 to-white p-4 rounded-lg border border-purple-100 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-bold text-purple-700 flex items-center gap-2">
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
            <h5 className="text-gray-600 text-sm font-bold uppercase tracking-wider mb-2">คุณภาพของโค้ด</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.codeQuality.map((item, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border flex items-start gap-3 text-sm
                    ${item.isAppropriate ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}
                >
                  <div className={`mt-0.5 text-lg ${item.isAppropriate ? 'text-green-600' : 'text-gray-400'}`}>
                    {item.isAppropriate ? <FaCircleCheck /> : <IoMdAlert />}
                  </div>
                  <div>
                    <span className={`block font-bold ${item.isAppropriate ? 'text-green-800' : 'text-gray-700'}`}>
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
          <div className="border border-green-200 rounded-lg overflow-hidden">
            <div className="bg-green-50 px-4 py-2 border-b border-green-100 flex justify-between items-center">
              <h5 className="font-bold text-green-800 text-sm">แนวทางที่ถูกต้อง</h5>
            </div>

            <div className="p-4 bg-white">
              {data.explanation && (
                <div className="text-sm text-gray-700 mb-4 whitespace-pre-line">
                  {data.explanation}
                </div>
              )}
              <h5 className="text-gray-600 text-sm font-bold uppercase tracking-wider mb-2">ตัวอย่างโค้ดที่แนะนำ</h5>
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

  const renderPerformanceContent = () => {
    if (isPerformanceLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400 animate-pulse">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500 mb-4"></div>
          <p>กำลังวิเคราะห์ข้อมูลด้วย AI...</p>
        </div>
      );
    }
    if (!isPerformanceAnalyzed || !performanceData) {
      return (
        <div className="flex flex-col items-center justify-center h-80 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
          <div className="bg-blue-100 p-4 rounded-full mb-4">
            <FaBolt className="text-blue-600 text-3xl" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">ยังไม่มีผลการวิเคราะห์</h3>
          <p className="text-gray-500 max-w-md mb-6">
            ระบบจะใช้ AI อ่านโค้ดของผู้เรียนทุกคนเพื่อสรุปจุดแข็ง จุดอ่อน และแนะนำแนวทางการสอนเพิ่มเติม
          </p>
          <button
            onClick={() => setShowConfirmModal(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium shadow-md hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <FaBolt /> เริ่มวิเคราะห์
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white shadow border border-gray-200 rounded-lg p-5">
            <p className="text-sm text-blue-700 font-medium mb-2">คะแนนเฉลี่ยในชั้นเรียน</p>
            <div className="relative w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-600 h-4 rounded-full"
                // style={{ width: `${parseFloat(classAvg)}%` }}
                style={{ width: `${parseFloat(String(classAvg))}%` }}
              ></div>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-white">
                {classAvg}%
              </span>
            </div>
          </div>
          {/* <div className="bg-green-50 border border-green-200 rounded-lg p-5">
            <p className="text-sm text-green-700 font-medium">คะแนนเฉลี่ย (คะแนน)</p>
            <p className="text-3xl font-bold text-green-800 mt-1">{avgScore} <span className="text-sm text-green-600 font-normal">/ {assignment?.score}</span></p>
          </div> */}
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
          <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
            <FaCircleCheck /> จุดเด่นของผู้เรียนในภาพรวม
          </h4>
          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
            {performanceData.overallStrengths}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
          <h4 className="font-semibold text-amber-700 mb-3 flex items-center gap-2">
            <IoMdAlert className="text-lg" /> จุดที่ควรพัฒนาในภาพรวม
          </h4>
          <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
            {performanceData.overallWeaknesses}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-5">
            <h4 className="font-semibold text-red-700 mb-3">ผู้เรียนที่ควรฝึกเพิ่มเติม</h4>
            <div className="space-y-4">
              {performanceData.studentsNeedingHelp.map((student, index) => (
                <div key={index} className="bg-white p-3 rounded border border-red-100 shadow-sm">
                  <p className="font-bold text-gray-800 text-sm">{student.studentName}</p>
                  <p className="text-gray-600 text-xs mt-1 leading-relaxed">{student.reason}</p>
                </div>
              ))}
              {performanceData.studentsNeedingHelp.length === 0 && <p className="text-gray-500 text-sm italic">ไม่มีรายการ</p>}
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
            <h4 className="font-semibold text-blue-700 mb-3">ผู้เรียนที่ทำได้ดี</h4>
            <div className="space-y-4">
              {performanceData.topPerformers.map((student, index) => (
                <div key={index} className="bg-white p-3 rounded border border-blue-100 shadow-sm">
                  <p className="font-bold text-gray-800 text-sm">{student.studentName}</p>
                  <p className="text-gray-600 text-xs mt-1 leading-relaxed">{student.reason}</p>
                </div>
              ))}
              {performanceData.topPerformers.length === 0 && <p className="text-gray-500 text-sm italic">ไม่มีรายการ</p>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPerformanceAnalysis = (onBack: () => void) => {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-800">รายงานการวิเคราะห์ประสิทธิภาพ</h3>
          <button
            onClick={onBack}
            className="cursor-pointer px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
          >
            กลับสู่หน้าผู้เรียน
          </button>
        </div>
        {renderPerformanceContent()}
      </div>
    );
  };

  const renderPerformanceAnalysisForModal = () => {
    return (
      <div className="max-h-[80vh] overflow-y-auto pr-4 -mr-4 custom-scrollbar">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">รายงานการวิเคราะห์ประสิทธิภาพ</h3>
        {renderPerformanceContent()}
      </div>
    );
  };

  return (
    <>
      <div className="flex justify-end">
        <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors cursor-pointer font-medium"
      >
        <FaArrowLeft size={14} />
        ย้อนกลับ
      </button>
      </div>
      <section className="mb-5">
        <div className="bg-white w-full p-8 border border-gray-300 shadow-sm rounded-lg">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-800">{assignment?.title}</h1>
            <div className="flex items-center gap-4">
              <p className="bg-primary text-white px-5 py-1 rounded-md text-sm shadow-sm">
                {formatFeedback(assignment?.feedback_level)}
              </p>
              <button
                className='bg-blue-600 cursor-pointer hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm shadow-sm transition-colors flex items-center gap-2'
                onClick={() => setShowPerformanceAnalysis(true)}
              >
                <FaBolt />
                วิเคราะห์ประสิทธิภาพ
              </button>
            </div>
          </div>
          <div className='flex gap-4 text-sm text-gray-500 mt-2 border-b pb-4 mb-4'>
            <p>ครบกำหนด {ThaiDate(assignment?.due_date)}</p>
            <p>คะแนนเต็ม {assignment?.score}</p>
          </div>
          <p className="text-gray-600 leading-relaxed">
            {assignment?.description}
          </p>
        </div>
      </section>
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 h-fit">
          <div className="w-full bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
             <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('submitted')}
                  className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
                    activeTab === 'submitted' 
                      ? 'text-blue-600 border-blue-600 bg-blue-50/50' 
                      : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  ส่งแล้ว ({submissions.length})
                </button>
                <button
                  onClick={() => setActiveTab('missing')}
                  className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
                    activeTab === 'missing' 
                      ? 'text-red-600 border-red-600 bg-red-50/50' 
                      : 'text-gray-500 border-transparent hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  ยังไม่ส่ง ({missingStudents.length})
                </button>
            </div>

            <div className="p-4">
               {activeTab === 'submitted' ? (
                  <ul className="space-y-2 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                     {submissions.length > 0 ? (
                        submissions.map((sub) => {
                           const isSelected = selectedSubmission?.submission_id === sub.submission_id;
                           const statusBadge = getStatusBadge(sub.status);
                           const userDisplay = usersCache[sub.student_id] || (isSelected ? selectedUser : null);

                           return (
                              <li
                                 key={sub.submission_id}
                                 onClick={() => handleSelectSubmission(sub)}
                                 className={`cursor-pointer p-3 rounded-lg transition-all duration-200 border
                                 ${isSelected
                                    ? 'bg-blue-50 border-blue-300 shadow-sm'
                                    : 'bg-white hover:bg-gray-50 border-gray-100'
                                 }`}
                              >
                                 <div className="flex justify-between items-start mb-1">
                                    <span className="font-semibold text-gray-700 text-sm truncate">
                                       {userDisplay ? `${userDisplay.name} ${userDisplay.lastname}` : 'กำลังโหลด...'}
                                    </span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${statusBadge.className}`}>
                                       {statusBadge.label}
                                    </span>
                                 </div>
                                 <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                                    <span>{ThaiDate(sub.submitted_at)}</span>
                                    <span>
                                       {sub.score !== null && sub.score !== undefined
                                          ? <span className={sub.score >= (assignment?.score || 0) / 2 ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>{sub.score}</span>
                                          : '-'
                                       }
                                       / {assignment?.score}
                                    </span>
                                 </div>
                              </li>
                           );
                        })
                     ) : (
                        <div className="text-center py-10 text-gray-400 italic text-sm">
                           ไม่พบการส่งงาน
                        </div>
                     )}
                  </ul>
               ) : (
                  <ul className="space-y-2 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                     {missingStudents.length > 0 ? (
                        missingStudents.map((student) => (
                           <li 
                              key={student.user_id}
                              onClick={() => handleSelectMissingStudent(student)}
                              className={`cursor-pointer p-3 rounded-lg transition-all duration-200 border
                                ${selectedUser?.user_id === student.user_id && !selectedSubmission
                                   ? 'bg-red-50 border-red-200 shadow-sm'
                                   : 'bg-white hover:bg-gray-50 border-gray-100'
                                }`
                              }
                           >
                              <div className="flex justify-between items-start mb-1">
                                 <span className="font-semibold text-gray-700 text-sm truncate">
                                    {student.name} {student.lastname}
                                 </span>
                                 <span className="text-[10px] px-2 py-0.5 rounded border font-medium bg-red-100 text-red-700 border-red-200">
                                    ยังไม่ส่ง
                                 </span>
                              </div>
                              <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                                 <span>{student.email}</span>
                              </div>
                           </li>
                        ))
                     ) : (
                        <div className="text-center py-10 text-gray-400 italic text-sm">
                           ส่งงานครบทุกคนแล้ว
                        </div>
                     )}
                  </ul>
               )}
            </div>
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="w-full bg-white shadow-sm p-6 rounded-lg border border-gray-200">

            <div className='flex justify-between items-center mb-6 pb-4 border-b border-gray-100'>
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                {showPerformanceAnalysis
                  ? ''
                  : selectedUser
                    ? `โค้ดของ ${selectedUser.name} ${selectedUser.lastname}`
                    : submissions.length === 0 && !loading
                      ? 'ไม่พบการส่งงาน'
                      : 'เลือกผู้เรียนเพื่อตรวจงาน'
                }
              </h2>

              {!showPerformanceAnalysis && selectedSubmission && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.nativeEvent.stopImmediatePropagation();
                      setShowDropdown(!showDropdown);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <FaEllipsis className="text-sm" />
                  </button>
                  {showDropdown && (
                    <div
                      className="absolute right-0 top-8 w-40 bg-white border border-gray-200 shadow-lg rounded-lg z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          handleDeleteSubmission(selectedSubmission.submission_id);
                        }}
                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors"
                      >
                        <FaTrash className="text-xs" /> ลบงาน
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
            {showPerformanceAnalysis ? (
              renderPerformanceAnalysis(() => setShowPerformanceAnalysis(false))
            ) : (
              <>
                {loading && !selectedSubmission && (
                  <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                    กำลังโหลดข้อมูล...
                  </div>
                )}
                {!loading && !selectedSubmission && !showPerformanceAnalysis && (
                  selectedUser ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500 animate-in fade-in duration-300">
                      <div className="bg-red-100 p-4 rounded-full mb-4">
                        <IoMdAlert className="text-red-500 text-3xl" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-800">ยังไม่มีการส่งงาน</h3>
                      <p className="text-gray-400 mt-2 text-sm text-center max-w-xs">
                        ผู้เรียนคนนี้ยังไม่ได้ส่งงานในระบบ
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400 italic">
                      {submissions.length === 0 && missingStudents.length === 0
                        ? "ไม่พบข้อมูลผู้เรียน"
                        : "เลือกผู้เรียนเพื่อตรวจงาน"}
                    </div>
                  )
                )}
                {!loading && selectedSubmission && (
                  <div className='space-y-6'>
                    <div className='rounded-lg overflow-hidden border border-gray-700 shadow-md'>
                      <div className="bg-[#1e1e1e] text-gray-400 text-xs px-4 py-2 flex justify-between items-center border-b border-gray-700">
                        <span className="font-mono">code.py</span>
                        <span className="uppercase text-[10px] bg-gray-700 px-2 rounded">Python</span>
                      </div>
                      <SyntaxHighlighter
                        language="python"
                        style={vscDarkPlus}
                        showLineNumbers
                        customStyle={{ margin: 0, fontSize: '15px', lineHeight: '1.6', height: 'auto' }}
                      >
                        {selectedSubmission.code || "# ไม่พบโค้ด"}
                      </SyntaxHighlighter>
                    </div>

                    <div className='grid grid-cols-1 gap-5'>
                      <div className={`rounded-xl border transition-all duration-300 overflow-hidden ${showAiComment ? 'bg-white border-purple-200 ring-4 ring-purple-50' : 'bg-white border-gray-200'}`}>
                        <div
                          className='p-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100'
                          onClick={() => setShowAiComment(!showAiComment)}
                        >
                          <h3 className='font-bold text-gray-800 flex items-center gap-2'>
                            ผลการตรวจ
                            {aiData?.score !== undefined && (
                              <span className="ml-2 text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                คะแนนประเมิน: {aiData.score}
                              </span>
                            )}
                          </h3>
                          <button className="text-purple-600 text-xs font-medium bg-purple-50 px-3 py-1.5 rounded hover:bg-purple-100 transition-colors">
                            {showAiComment ? 'ซ่อน' : 'แสดง'}
                          </button>
                        </div>

                        {showAiComment && (
                          <div className="p-5 bg-white">
                            {aiData ? renderAiContent(aiData) : (
                              <p className="text-center text-gray-400 py-4 italic">ยังไม่มีข้อมูลการตรวจจาก AI</p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className='bg-white p-6 rounded-xl border border-gray-200 shadow-sm'>
                        <h3 className='font-bold text-gray-700 mb-3 flex items-center gap-2'>
                          ความคิดเห็นอาจารย์
                        </h3>
                        <textarea
                          className="w-full bg-gray-50 border border-gray-300 p-4 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder-gray-400"
                          rows={4}
                          placeholder="ให้คำแนะนำเพิ่มเติมแก่ผู้เรียน..."
                          value={editFeedback}
                          onChange={(e) => setEditFeedback(e.target.value)}
                        />

                        <div className="flex mt-6 justify-between items-center pt-4 border-t border-gray-100">
                          <div className="flex flex-col">
                            <span className="text-lg text-gray-400  font-semibold">สถานะการตรวจงาน</span>
                            <span className={`text-sm font-bold ${selectedSubmission.status === 'DONE' ? 'text-green-600' : 'text-yellow-600'}`}>
                              {getStatusBadge(selectedSubmission.status).label}
                            </span>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-lg border border-gray-200">
                              <span className="text-sm font-medium text-gray-600">คะแนน:</span>
                              <input
                                type="number"
                                placeholder="0"
                                className="bg-transparent w-16 text-right font-bold text-blue-600 text-lg outline-none"
                                value={editScore}
                                onChange={(e) => setEditScore(e.target.value)}
                                max={assignment?.score}
                                min={0}
                              />
                              <span className="text-gray-400 text-sm">/ {assignment?.score}</span>
                            </div>

                            <button
                              onClick={handleSaveGrade}
                              disabled={isSaving}
                              className={`cursor-pointer px-6 py-2.5 text-white font-medium rounded-lg shadow-sm flex items-center gap-2 transition-all
                                ${isSaving
                                  ? 'bg-blue-400 cursor-not-allowed'
                                  : 'bg-blue-600 hover:bg-blue-800 hover:shadow active:scale-95'}`}
                            >
                              {isSaving ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                  บันทึก...
                                </>
                              ) : 'อัพเดทผลการตรวจ'}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      <MyWideModal isOpen={showPerformanceModal} onClose={() => setShowPerformanceModal(false)}>
        {renderPerformanceAnalysisForModal()}
      </MyWideModal>

      <DeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={confirmDeleteSubmission}
        title="ยืนยันการลบงาน"
        description="คุณต้องการลบงานนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้"
        isLoading={isDeleting}
      />

      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={async () => {
          await handleStartAnalysis();
          setShowConfirmModal(false);
        }}
        title="ยืนยันการวิเคราะห์ประสิทธิภาพ"
        description="สามารถวิเคราะห์ได้แค่เพียงครั้งเดียวเท่านั้น"
        isLoading={isPerformanceLoading}
        confirmText="ยืนยัน"
      />

      <MyModal isOpen={showErrorModal} onClose={() => setShowErrorModal(false)}>
        <div className="flex flex-col items-center justify-center text-center">
          <IoMdAlert className="text-red-500 text-6xl mb-4" />
          <h3 className="text-xl font-bold text-gray-800 mb-2">เกิดข้อผิดพลาด</h3>
          <p className="text-gray-600 mb-6">{errorMessage}</p>
          <button
            onClick={() => setShowErrorModal(false)}
            className="cursor-pointer px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            ปิด
          </button>
        </div>
      </MyModal>
    </>
  );
}