"use client";

import { getAssignmentStatus } from "@/app/services/assignment";
import { logout } from "@/app/services/auth";
import { getClassroomById } from "@/app/services/classroom";
import { getMyEnrollment } from "@/app/services/enrollment";
import { getMe } from "@/app/services/user";
import { Assignment } from "@/app/types/assignment"; // Type เดิม
import { Classroom } from "@/app/types/classroom";
import { Enrollment } from "@/app/types/enrollment";
import { Me } from "@/app/types/me";
import { ThaiDate } from "@/app/utils/date";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaBook, FaCalendarAlt, FaChevronRight, FaClipboardList, FaUser, FaCheckCircle, FaClock } from "react-icons/fa"; // เพิ่ม icon
import { IoMegaphone, IoTimeOutline } from "react-icons/io5";

interface AssignmentWithStatus extends Assignment {
  submissions: {
    status: string;
    score: number;
    submitted_at: string;
  }[];
}

export default function Page() {

  const router = useRouter()

  const pathname = usePathname()
  const { classroom_id } = useParams<{ classroom_id: string }>()
  const [assignment, setAssignment] = useState<AssignmentWithStatus[]>([])
  const [enrollment, setEnrollment] = useState<Enrollment>()
  const [classroom, setClassroom] = useState<Classroom>()
  const [me, setMe] = useState<Me>()

  const fetchAssignment = async () => {
    try {
      const data = await getAssignmentStatus(classroom_id);
      setAssignment(data as AssignmentWithStatus[]);
    } catch (err) {
      console.error(err)
    }
  }

  const fetchMe = async () => {
    try {
      const me = await getMe();
      setMe(me);
    } catch (err) {
      console.log(err)
    }
  }

  const fetchEnrollment = async () => {
    try {
      const enrollment = await getMyEnrollment();
      if (enrollment && enrollment.length > 0) {
        setEnrollment(enrollment[0]);
      }
    } catch (err) {
      console.error(err);
    }
  }

  const fetchClassroom = async () => {
    try {
      const classroom = await getClassroomById(classroom_id);
      setClassroom(classroom);
    } catch (err) {
      console.error(err);
    }
  }



  useEffect(() => {
    if (classroom_id) {
      fetchAssignment();
      fetchEnrollment();
      fetchMe();
      fetchClassroom();
    }
  }, [classroom_id])

  return (
    <div className="">
      <div className="mx-auto px-4 sm:px-6 pt-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800">
              {classroom?.class_name || "ห้องเรียนของฉัน"}
            </h1>
            <p className="text-gray-500">
              ยินดีต้อนรับ, <span className="font-semibold text-black">{me?.name} {me?.lastname}</span>
            </p>
          </div>
          {/* <button onClick={handleLogout}  className="bg-white border border-gray-200 text-gray-600 hover:text-red-500 hover:border-red-200 px-6 py-2.5 rounded-lg font-medium shadow-sm transition-all text-sm">
            ออกจากระบบ
          </button> */}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="bg-white rounded shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                    <FaClipboardList className="text-xl" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">งานที่ได้รับมอบหมาย</h2>
                </div>
                <span className="text-xs font-semibold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-md">
                  {assignment.length} งาน
                </span>
              </div>
              <div className="divide-y divide-gray-50">
                {assignment.length === 0 ? (
                  <div className="text-center py-20">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
                      <FaBook className="text-gray-300 text-2xl" />
                    </div>
                    <p className="text-gray-400 font-medium">ไม่มีงานที่ได้รับมอบหมาย</p>
                  </div>
                ) : (
                  assignment.map((work) => {
                    const submission = work.submissions && work.submissions[0];
                    const isSubmitted = !!submission;

                    let statusLabel = "ยังไม่ได้ส่ง";
                    let statusClass = "bg-red-50 text-red-700 border-red-200";
                    let iconClass = "bg-slate-100 text-slate-400";
                    let StatusIcon = IoTimeOutline;
                    let showScore = false;

                    if (isSubmitted) {
                      if (submission.status === "PENDING") {
                        statusLabel = "รอตรวจ";
                        statusClass = "bg-yellow-50 text-yellow-700 border-yellow-200";
                        iconClass = "bg-yellow-100 text-yellow-600";
                        StatusIcon = FaClock;
                      } else if (submission.status === "DONE" || submission.status === "ตรวจแล้ว") {
                        statusLabel = "ตรวจแล้ว";
                        statusClass = "bg-green-50 text-green-700 border-green-200";
                        iconClass = "bg-green-100 text-green-600";
                        StatusIcon = FaCheckCircle;
                        showScore = true;
                      } else {
                        statusLabel = "ไม่พบสถานะ";
                        statusClass = "bg-blue-50 text-blue-700 border-blue-200";
                        iconClass = "bg-blue-100 text-blue-600";
                        StatusIcon = FaCheckCircle;
                      }
                    }
                    return (
                      <Link
                        href={`${pathname}/a/${work.assignment_id}`}
                        key={work.assignment_id}
                        className="block group hover:bg-slate-50 transition-colors duration-200"
                      >
                        <div className="p-5 flex items-center gap-4">
                          <div className={`hidden sm:flex flex-col items-center justify-center w-14 h-14 rounded-lg flex-shrink-0 transition-colors ${iconClass}`}>
                            <StatusIcon className="text-2xl" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <h3 className="text-lg font-bold text-gray-800 group-hover:text-indigo-600 truncate transition-colors">
                                {work.title}
                              </h3>

                              <div className={`px-2 py-1 rounded text-xs font-semibold border flex items-center gap-1 ${statusClass}`}>
                                {isSubmitted ? (
                                  <>
                                    {submission.status === "PENDING"}
                                    <span>{statusLabel}</span>
                                  </>
                                ) : (
                                  <>
                                    <span>{statusLabel}</span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                              <div className="flex items-center gap-1.5">
                                <span>{classroom?.teacher?.name || "อาจารย์"} {classroom?.teacher?.lastname || ""}</span>
                              </div>
                              <span className="text-gray-300">|</span>
                              <div className="flex items-center gap-1">
                                <FaCalendarAlt className="text-gray-500 text-xs" />
                                <span>{ThaiDate(work.create_at)}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all">
                            <FaChevronRight />
                          </div>
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </div>
          </div>
          <div className="lg:col-span-4 space-y-6">
            <div className=" rounded-lg p-6 shadow-sm relative overflow-hidden bg-white">
              <div className="flex items-center gap-2 mb-6 relative z-10">
                <IoMegaphone className="text-yellow-400 text-xl animate-pulse" />
                <h2 className="font-bold text-black text-lg tracking-wide">ประกาศของชั้นเรียน</h2>
              </div>
              <div className="space-y-4 relative z-10">
                {(!classroom?.announce || classroom.announce.length === 0) ? (
                  <div className="text-slate-400 text-sm italic border border-slate-700 rounded-lg p-4 text-center">
                    ไม่มีประกาศในขณะนี้
                  </div>
                ) : (
                  classroom.announce.map((announce, index) => (
                    <div key={index} className=" border border-slate-200 p-4 rounded-md">
                      <p className="text-sm text-gray-500 leading-relaxed font-light">
                        {announce}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}