"use client";

import { deleteAssignment, getAssignmentByClassId } from "@/app/services/assignment";
import { getClassroomById, editClassroom } from "@/app/services/classroom";
import { getMe } from "@/app/services/user";
import { Assignment } from "@/app/types/assignment";
import { Classroom } from "@/app/types/classroom";
import { Me } from "@/app/types/me";
import { ThaiDate } from "@/app/utils/date";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FaArrowLeft, FaBook, FaCalendarAlt, FaChevronRight, FaClipboardList, FaEdit, FaUsers } from "react-icons/fa";
import { IoMegaphone, IoTimeOutline, IoTrashBin } from "react-icons/io5";
import { FaPlus } from "react-icons/fa";
import DeleteModal from "@/app/components/modal/Delete";
import { toast } from "react-toastify";

export default function Page() {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { classroom_id } = useParams<{ classroom_id: string }>()
  const [assignment, setAssignment] = useState<Assignment[]>([])
  // const [enrollment, setEnrollment] = useState<Enrollment>()
  const [classroom, setClassroom] = useState<Classroom>()
  const [me, setMe] = useState<Me>()
  const [isAddingAnnounce, setIsAddingAnnounce] = useState(false);
  const [announceText, setAnnounceText] = useState("");
  const [selectedAnnounceIndex, setSelectedAnnounceIndex] = useState<number | null>(null);
  const [deleteType, setDeleteType] = useState<'announce' | null>(null);


  const fetchAssignment = async () => {
    try {
      const assignment = await getAssignmentByClassId(classroom_id);
      setAssignment(assignment);
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

  const fetchClassroom = async () => {
    try {
      const classroom = await getClassroomById(classroom_id);
      setClassroom(classroom);
    } catch (err) {
      console.error(err);
    }
  }

  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, item: Assignment) => {
    e.preventDefault();
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect();
    setSelectedAssignment(item);
    setMenuPosition({
      top: rect.bottom + 8,
      left: rect.right
    });
  };

  const handleConfirmDelete = async () => {
    setIsLoading(true);
    try {
      if (deleteType === 'announce') {
        if (selectedAnnounceIndex === null || !classroom) return;
        const newAnnounce = classroom.announce.filter((_, i) => i !== selectedAnnounceIndex);
        await editClassroom(classroom_id, {
          class_name: classroom.class_name,
          description: classroom.description,
          class_color: classroom.class_color,
          announce: newAnnounce
        });
        await fetchClassroom();
        setSelectedAnnounceIndex(null);
      } else {
        if (!selectedAssignment) return;
        await deleteAssignment(selectedAssignment.assignment_id);
        await fetchAssignment();
        setSelectedAssignment(null);
      }
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("เกิดข้อผิดพลาดในการลบ");
    } finally {
      setIsLoading(false);
    }
  };

  const openDeleteModal = (item: Assignment) => {
    setSelectedAssignment(item);
    setDeleteType(null);
    setIsDeleteModalOpen(true);
  };

  const openDeleteAnnounceModal = (index: number) => {
    setSelectedAnnounceIndex(index);
    setDeleteType('announce');
    setIsDeleteModalOpen(true);
  };

  const handleAddAnnounce = async () => {
    if (!classroom || !announceText.trim()) return;
    try {
      await editClassroom(classroom_id, {
        class_name: classroom.class_name,
        description: classroom.description,
        class_color: classroom.class_color,
        announce: [announceText, ...(classroom.announce || [])]
      });
      setAnnounceText("");
      setIsAddingAnnounce(false);
      fetchClassroom();
    } catch (error) {
      console.error(error);
      toast.error("ไม่สามารถเพิ่มประกาศได้");
    }
  }

  useEffect(() => {
    if (!classroom_id) return;
    fetchAssignment();
    fetchMe();
    fetchClassroom();
  }, [classroom_id])

  return (
    <div className="">
      <div className="mx-auto px-4 sm:px-6 pt-6">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors cursor-pointer font-medium"
        >
          <FaArrowLeft size={14} />
          ย้อนกลับ
        </button>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-800">
              {classroom?.class_name || "กำลังโหลด..."}
            </h1>
            <p className="text-slate-500">
              ยินดีต้อนรับ, <span className="font-semibold text-slate-700">{me?.name} {me?.lastname}</span>
            </p>
          </div>
          <div className="flex gap-4">
            <Link href={`${pathname}/students`} className="cursor-pointer flex items-center gap-2 bg-white hover:bg-gray-100 px-4 py-1.5 rounded-md font-medium shadow-sm transition-all">
              <FaUsers /> รายชื่อนักเรียน
            </Link>
            <Link href={`${pathname}/create`} className="cursor-pointer flex items-center gap-2 bg-primary hover:bg-secondary border border-gray-200 text-white px-4 py-1.5 rounded-md font-medium shadow-sm transition-all">
              <FaPlus /> สร้างงาน
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                    <FaClipboardList className="text-xl" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800">งานของชั้นเรียน</h2>
                </div>
                <span className="text-xs font-semibold bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">
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
                  assignment.map((work) => (
                    <Link
                      href={`${pathname}/a/${work.assignment_id}`}
                      key={work.assignment_id}
                      className="block group hover:bg-slate-50 transition-colors duration-200"
                    >
                      <div className="p-5 flex items-center gap-4">
                        <div className="hidden sm:flex flex-col items-center justify-center bg-slate-100 w-14 h-14 rounded-xl flex-shrink-0 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                          <IoTimeOutline className="text-2xl" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-gray-800 group-hover:text-indigo-600 truncate transition-colors">
                            {work.title}
                          </h3>
                          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                            <div className="flex items-center gap-1.5">
                              <span>{classroom?.teacher?.name} {classroom?.teacher?.lastname}</span>
                            </div>
                            <span className="text-gray-300">|</span>
                            <div className="flex items-center gap-1">
                              <FaCalendarAlt className="text-gray-400 text-xs" />
                              <span>{ThaiDate(work.create_at)}</span>
                            </div>
                          </div>
                        </div>
                        {/* <div className="text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all">
                          <FaChevronRight />
                        </div> */}
                        <div className="flex justify-end mt-auto pt-2 relative">
                          <button
                            type="button"
                            onClick={(ev) => handleOpenMenu(ev, work)}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors z-20"
                          >
                            <span className="text-xl leading-none">⋮</span>
                          </button>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </div>
          <div className="lg:col-span-4 space-y-6">
            <div className=" rounded-2xl p-6 shadow-sm relative overflow-hidden bg-white">
              <div className="flex justify-between items-center mb-6 relative z-10">
                <div className="flex items-center gap-2">
                  <IoMegaphone className="text-yellow-400 text-xl animate-pulse" />
                  <h2 className="font-bold text-gray-600 text-lg tracking-wide">ประกาศของชั้นเรียน</h2>
                </div>
                <button
                  onClick={() => setIsAddingAnnounce(!isAddingAnnounce)}
                  className="text-gray-400 hover:text-primary transition-colors"
                >
                  <FaPlus />
                </button>
              </div>

              {isAddingAnnounce && (
                <div className="mb-4 relative z-10 bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <textarea
                    value={announceText}
                    onChange={(e) => setAnnounceText(e.target.value)}
                    className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm resize-none"
                    placeholder="เขียนประกาศ..."
                    rows={3}
                  />
                  <div className="flex justify-end gap-2 mt-2">
                    <button
                      onClick={() => setIsAddingAnnounce(false)}
                      className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-200 rounded-md transition-colors"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={handleAddAnnounce}
                      className="px-3 py-1.5 text-xs bg-primary text-white rounded-md hover:bg-secondary transition-colors"
                    >
                      โพสต์
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-4 relative z-10">
                {classroom?.announce.length === 0 ? (
                  <div className="text-slate-400 text-sm italic border border-slate-700 rounded-lg p-4 text-center">
                    ไม่มีประกาศในขณะนี้
                  </div>
                ) : (
                  classroom?.announce.map((announce, index) => (
                    <div key={index} className=" border border-slate-200 p-4 rounded-xl relative group">
                      <p className="text-sm leading-relaxed  font-light pr-6">
                        {announce}
                      </p>
                      <button
                        onClick={() => openDeleteAnnounceModal(index)}
                        className="absolute top-5 right-3 text-red-500 "
                      >
                        <IoTrashBin />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={deleteType === 'announce' ? "ยืนยันการลบประกาศ" : "ยืนยันการลบงาน"}
        description={
          deleteType === 'announce' 
            ? "คุณต้องการลบประกาศนี้ใช่หรือไม่?"
            : (selectedAssignment ? `คุณต้องการลบงาน "${selectedAssignment.title}" ใช่หรือไม่?` : undefined)
        }
        isLoading={isLoading}
      />

      {menuPosition && (
        <>
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setMenuPosition(null)}
          />
          <div
            className="fixed z-50 bg-white shadow-xl border border-gray-100 rounded-lg p-2 flex flex-col w-36 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
            style={{
              top: menuPosition.top,
              left: menuPosition.left,
              transform: "translateX(-100%)"
            }}
          >
            <Link
              href={`${pathname}/edit/${selectedAssignment?.assignment_id}`}
              className="cursor-pointer px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 hover:text-blue-600 rounded-md transition-colors flex items-center gap-2"
            >
              <FaEdit /> แก้ไข
            </Link>
            <button
              onClick={() => {
                setMenuPosition(null);
                if (selectedAssignment) openDeleteModal(selectedAssignment);
              }}
              className="cursor-pointer px-3 py-2 text-sm text-left text-red-600 hover:bg-red-50 rounded-md transition-colors flex items-center gap-2"
            >
              <IoTrashBin /> ลบ
            </button>
          </div>
        </>
      )}
    </div>

  );
}