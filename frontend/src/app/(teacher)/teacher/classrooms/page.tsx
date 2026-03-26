"use client";

import { useEffect, useState } from "react";
import { FaEdit, FaPlus } from "react-icons/fa";
import MyModal from "@/app/components/Modal";
import { createClassroom, editClassroom, getMyClassroom, deleteClassroom } from "@/app/services/classroom";
import { getMe } from "@/app/services/user";
import { Classroom } from "@/app/types/classroom";
import Link from "next/link";
import { IoTrashBin } from "react-icons/io5";
import { LoadingPage } from "@/app/components/utils/LoadingPage";
import { toast } from "react-toastify";
import DeleteModal from "@/app/components/modal/Delete";

interface Me {
  user_id: string;
  name: string;
  lastname: string;
}

export default function Page() {

  const [pageLoading, setPageLoading] = useState(true);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [selectedClass, setSelectedClass] = useState<Classroom | null>(null);
  const [isCreateClassModalOpen, setIsCreateClassModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [classroom, setClassroom] = useState<Classroom[]>([]);
  const [me, setMe] = useState<Me | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState({
    class_name: "",
    description: "",
    class_color: "#000000",
  });

  const [editFormData, setEditFormData] = useState({
    class_id: "",
    class_name: "",
    description: "",
    class_color: "#000000",
  });


  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>, item: Classroom) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    setSelectedClass(item);

    setMenuPosition({
      top: rect.bottom + 8,
      left: rect.right
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();


    if (!formData.class_name) return toast.error("กรุณากรอกชื่อห้องเรียน");
    if (!formData.description) return toast.error("กรุณากรอกรายละเอียดห้องเรียน");
    if (!formData.class_color) return toast.error("กรุณากรอกสี");

    if (!me?.user_id) return toast.error("ไม่พบข้อมูลผู้สอน กรุณารีโหลดหน้าเว็บ");

    setIsLoading(true);
    try {

      const payload = {
        ...formData,
        teacher_id: me.user_id
      };

      await createClassroom(payload);
      await fetchClassroom();
      toast.success("สร้างห้องเรียนสำเร็จ");

      setIsCreateClassModalOpen(false);
      setFormData({
        class_name: "",
        description: "",
        class_color: "#000000",
      });
    } catch (err) {
      console.error(err);
      toast.error("เกิดข้อผิดพลาดในการสร้างห้องเรียน");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const fetchClassroom = async () => {
    try {
      const res = await getMyClassroom();
      setClassroom(res);
    } catch (err) { console.error(err); }
  };

  const fetchMe = async () => {
    try {
      const res = await getMe();
      setMe(res);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    const init = async () => {
      setPageLoading(true);
      await Promise.all([fetchClassroom(), fetchMe()]);
      setPageLoading(false);
    };

    init();
  }, []);

  const openEditModal = (item: Classroom) => {
    setEditFormData({
      class_id: item.class_id,
      class_name: item.class_name,
      description: item.description || "",
      class_color: item.class_color,
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (item: Classroom) => {
    setSelectedClass(item);
    setIsDeleteModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await editClassroom(editFormData.class_id, editFormData);
      await fetchClassroom();
      toast.success("แก้ไขชั้นเรียนสำเร็จ");
      setIsEditModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("เกิดข้อผิดพลาดในการแก้ไขชั้นเรียน");
    } finally {
      setIsLoading(false);
    }
  };
  const handleDelete = async () => {
    if (!selectedClass) return;
    setIsLoading(true);
    try {
      await deleteClassroom(selectedClass.class_id);
      await fetchClassroom();
      toast.success("ลบชั้นเรียนสำเร็จ");
      setIsDeleteModalOpen(false);
      setSelectedClass(null);
    } catch (err) {
      console.error(err);
      toast.error("เกิดข้อผิดพลาดในการลบชั้นเรียน");
    } finally {
      setIsLoading(false);
    }
  };

  if (pageLoading) {
    return <LoadingPage />;
  }

  return (
    <>
      <div className="py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">ชั้นเรียนของคุณ</h1>
            <p className="mt-1 text-sm text-gray-500">จัดการชั้นเรียนทั้งหมดของคุณ</p>
          </div>
          <button
            onClick={() => setIsCreateClassModalOpen(true)}
            className="bg-primary hover:bg-secondary text-white py-2 px-4 rounded flex gap-2 items-center cursor-pointer transition-colors"
          >
            <FaPlus /> <span>สร้างชั้นเรียน</span>
          </button>
        </div>
      </div>
      <div className="h-px bg-gray-200 w-full mb-8" />
      {classroom.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-300 shadow-sm">
          <div className="bg-gray-50 p-4 rounded-full mb-4">
            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-gray-700">ไม่พบชั้นเรียนของคุณ</h3>
          <p className="text-gray-500 mt-1">เริ่มสร้างชั้นเรียนใหม่เพื่อจัดการการเรียนการสอน</p>

        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {classroom.map((e) => (
            <Link key={e.class_id} href={`/teacher/classrooms/${e.class_id}`} className="group block h-full">
              <div className="bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col relative">
                <div className="h-32 p-6 relative flex flex-col justify-between" style={{ backgroundColor: e.class_color }}>
                  <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                  <h1 className="text-xl font-bold text-white z-10 line-clamp-2 leading-tight">
                    {e.class_name}
                  </h1>
                </div>
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h2 className="text-gray-600 text-sm line-clamp-3 mb-4 leading-relaxed">
                      {e.description || "ไม่มีคำอธิบายรายวิชา"}
                    </h2>
                  </div>
                  <div className="flex justify-end mt-auto pt-2 relative">
                    <button
                      type="button"
                      onClick={(ev) => handleOpenMenu(ev, e)}
                      className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors z-20"
                    >
                      <span className="text-xl leading-none">⋮</span>
                    </button>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      <MyModal isOpen={isCreateClassModalOpen} onClose={() => setIsCreateClassModalOpen(false)}>
        <form onSubmit={handleSubmit}>
          <h1 className="mb-5 text-2xl font-bold">สร้างชั้นเรียนใหม่</h1>
          <div className="mb-5">
            <label className="block mb-2">ชื่อชั้นเรียน</label>
            <input name="class_name" value={formData.class_name} onChange={handleChange} type="text" className="border border-gray-300 rounded-md p-2 w-full" placeholder="กรอกชื่อชั้นเรียน" />
          </div>
          <div className="mb-5">
            <label className="block mb-2">รายละเอียด</label>
            <input name="description" value={formData.description} onChange={handleChange} type="text" className="border border-gray-300 rounded-md p-2 w-full" placeholder="กรอกรายละเอียดชั้นเรียน" />
          </div>
          <div className="mb-5">
            <label className="block mb-2">เลือกสี</label>
            <input name="class_color" type="color" value={formData.class_color} className="w-full h-10 p-1 border border-gray-300 rounded-md cursor-pointer" onChange={handleChange} />
          </div>
          <button type="submit" disabled={isLoading} className={`bg-primary hover:bg-secondary text-white py-2 px-4 rounded w-full cursor-pointer transition-colors ${isLoading ? 'opacity-70' : ''}`}>
            {isLoading ? "กำลังบันทึก..." : "ยืนยัน"}
          </button>
        </form>
      </MyModal>
      <MyModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <form onSubmit={handleEditSubmit}>
          <h1 className="mb-5 text-2xl font-bold">แก้ไขชั้นเรียน</h1>

          <div className="mb-5">
            <label className="block mb-2">ชื่อชั้นเรียน</label>
            <input
              name="class_name"
              value={editFormData.class_name}
              onChange={(e) =>
                setEditFormData({ ...editFormData, class_name: e.target.value })
              }
              type="text"
              className="border border-gray-300 rounded-md p-2 w-full"
            />
          </div>

          <div className="mb-5">
            <label className="block mb-2">รายละเอียด</label>
            <input
              name="description"
              value={editFormData.description}
              onChange={(e) =>
                setEditFormData({ ...editFormData, description: e.target.value })
              }
              type="text"
              className="border border-gray-300 rounded-md p-2 w-full"
            />
          </div>

          <div className="mb-5">
            <label className="block mb-2">เลือกสี</label>
            <input
              type="color"
              value={editFormData.class_color}
              onChange={(e) =>
                setEditFormData({ ...editFormData, class_color: e.target.value })
              }
              className="w-full h-10 border rounded-md cursor-pointer"
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className={`bg-primary hover:bg-secondary text-white py-2 px-4 rounded w-full ${isLoading ? "opacity-70" : ""}`}
          >
            {isLoading ? "กำลังบันทึก..." : "บันทึกการแก้ไข"}
          </button>
        </form>
      </MyModal>

      <DeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="ยืนยันการลบชั้นเรียน"
        description={`คุณต้องการลบชั้นเรียน ${selectedClass?.class_name} ใช่หรือไม่?`}
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
            <button
              onClick={() => {
                setMenuPosition(null);
                if (selectedClass) openEditModal(selectedClass);
              }}
              className="cursor-pointer px-3 py-2 text-sm text-left text-gray-700 hover:bg-gray-100 hover:text-blue-600 rounded-md transition-colors flex items-center gap-2"
            >
              <FaEdit /> แก้ไข
            </button>
            <button
              onClick={() => {
                setMenuPosition(null);
                if (selectedClass) openDeleteModal(selectedClass);
              }}
              className="cursor-pointer px-3 py-2 text-sm text-left text-red-600 hover:bg-red-50 rounded-md transition-colors flex items-center gap-2"
            >
              <IoTrashBin /> ลบ
            </button>
          </div>
        </>
      )}
    </>
  );
}