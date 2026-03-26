"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { User } from "@/app/types/user";
import { getUserByClassId, deleteUser } from "@/app/services/user";
import { FaEye, FaEdit } from "react-icons/fa";
import { IoTrash, IoSearchOutline } from "react-icons/io5";
import { LoadingPage } from "@/app/components/utils/LoadingPage";
import { HiUserAdd, HiOutlineMail, HiOutlineBadgeCheck } from "react-icons/hi";
import BackButton from "@/app/components/utils/BackButton";
import DeleteModal from "@/app/components/modal/Delete";
import MyModal from "@/app/components/Modal";
import { formatRole } from './../../../../../utils/role';
import { gradeLevel } from "@/app/utils/gradeLevel";

interface EnrollmentResponse {
    enrollment_id: string;
    joined_at: string;
    class_id: string;
    student_id: string;
    student: User;
}

export default function Page() {

    const { classroom_id } = useParams<{ classroom_id: string }>();
    const pathname = usePathname()
    const router = useRouter()

    const [students, setStudents] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    // [2] เพิ่ม state สำหรับ Loading ของ Modal
    const [isDeleting, setIsDeleting] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<User | null>(null);

    // State for viewing student details
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [viewStudent, setViewStudent] = useState<User | null>(null);

    const fetchStudents = async () => {
        if (!classroom_id) return;
        try {
            setLoading(true);
            const data: EnrollmentResponse[] = await getUserByClassId(classroom_id);
            const studentList = data.map((item) => item.student);
            setStudents(studentList);
        } catch (error) {
            console.error("Error fetching students:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, [classroom_id]);

    const openModal = (student: User) => {
        setSelectedStudent(student);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedStudent(null);
        setIsModalOpen(false);
    };

    // [3] ปรับปรุงฟังก์ชันลบ ให้รองรับ Loading state
    const handleDelete = async () => {
        if (selectedStudent) {
            setIsDeleting(true); // เริ่ม Loading
            try {
                await deleteUser(selectedStudent.user_id);
                await fetchStudents(); // รอให้โหลดข้อมูลใหม่เสร็จ
                closeModal();
            } catch (error) {
                console.error("Error deleting student:", error);
            } finally {
                setIsDeleting(false); // จบ Loading
            }
        }
    };

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.lastname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getAvatarColor = (name: string) => {
        const colors = ['bg-blue-100 text-blue-600', 'bg-green-100 text-green-600', 'bg-purple-100 text-purple-600', 'bg-orange-100 text-orange-600', 'bg-pink-100 text-pink-600'];
        const index = name.length % colors.length;
        return colors[index];
    };

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Pagination logic
    const indexOfLastStudent = currentPage * itemsPerPage;
    const indexOfFirstStudent = indexOfLastStudent - itemsPerPage;
    const currentStudents = filteredStudents.slice(indexOfFirstStudent, indexOfLastStudent);

    const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

    if (loading) {
        return (
            <LoadingPage />
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 ">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">รายชื่อผู้เรียน</h1>
                    <p className="text-gray-500 mt-1 text-sm">จัดการข้อมูลผู้เรียนในรายวิชานี้ ({students.length} คน)</p>
                </div>
                <div className="flex flex-row gap-3 w-full md:w-auto">
                    <Link
                        href={`${pathname}/add`}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 flex-1 md:flex-none md:w-auto whitespace-nowrap"
                    >
                        <HiUserAdd className="text-xl" />
                        <span>เพิ่มผู้เรียน</span>
                    </Link>
                    <BackButton className="flex-1 md:flex-none border-gray-200 text-gray-700 hover:bg-gray-100 hover:text-gray-900 rounded-lg py-2 px-4 whitespace-nowrap" />
                </div>
            </div>
            <div className="relative mb-6 group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IoSearchOutline className="text-gray-400 text-xl group-focus-within:text-blue-500 transition-colors" />
                </div>
                <input
                    type="text"
                    placeholder="ค้นหาด้วย ชื่อ, นามสกุล หรือ รหัสผู้เรียน..."
                    className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {filteredStudents.length === 0 ? (
                    <div className="text-center py-16 px-4">
                        <div className="mx-auto h-12 w-12 text-gray-300 mb-3">
                            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">ไม่พบข้อมูลผู้เรียน</h3>
                        <p className="text-gray-500 mt-1">ลองค้นหาด้วยคำค้นอื่น หรือเพิ่มผู้เรียนใหม่</p>
                    </div>
                ) : (
                    <>
                        {/* Mobile Card View */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:hidden gap-4 p-4">
                            {currentStudents.map((student) => (
                                <div key={student.user_id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col justify-between">
                                    <div className="flex items-center space-x-4 mb-3">
                                        <div className={`flex-shrink-0 h-12 w-12 rounded-full flex items-center justify-center text-lg font-bold ${getAvatarColor(student.name)}`}>
                                            {student.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="text-md font-semibold text-gray-900">{student.name} {student.lastname}</h3>
                                            <p className="text-sm text-gray-500 break-all">{student.email}</p>
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <span className="inline-block px-2 py-1 text-xs font-semibold rounded-md bg-gray-100 text-gray-700 font-mono border border-gray-200">
                                            {student.std_id}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
                                        <button
                                            onClick={() => {
                                                setViewStudent(student);
                                                setIsDetailModalOpen(true);
                                            }}
                                            className="flex items-center justify-center gap-1 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-all text-sm font-medium"
                                            title="ดูรายละเอียด"
                                        >
                                            <FaEye size={16} /> <span>ดู</span>
                                        </button>
                                        <Link
                                            href={`/teacher/students/${student.user_id}/edit`}
                                            className="flex items-center justify-center gap-1 py-2 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg transition-all text-sm font-medium"
                                            title="แก้ไขข้อมูล"
                                        >
                                            <FaEdit size={16} /> <span>แก้</span>
                                        </Link>
                                        <button
                                            onClick={() => openModal(student)}
                                            className="flex items-center justify-center gap-1 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-all text-sm font-medium"
                                            title="ลบผู้เรียน"
                                        >
                                            <IoTrash size={16} /> <span>ลบ</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50/50">
                                    <tr>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            ชื่อ-นามสกุล
                                        </th>
                                        <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            รหัสประจำตัว
                                        </th>
                                        <th scope="col" className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            จัดการ
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentStudents.map((student) => (
                                        <tr key={student.user_id} className="hover:bg-gray-50 transition-colors duration-150">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center text-sm font-bold ${getAvatarColor(student.name)}`}>
                                                        {student.name.charAt(0)}
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-semibold text-gray-900">
                                                            {student.name} {student.lastname}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {student.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-md bg-gray-100 text-gray-700 font-mono border border-gray-200">
                                                    {student.std_id}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setViewStudent(student);
                                                            setIsDetailModalOpen(true);
                                                        }}
                                                        className="p-2 bg-blue-500 text-white hover:text-blue-400 hover:bg-blue-600 rounded-lg transition-all cursor-pointer"
                                                        title="ดูรายละเอียด"
                                                    >
                                                        <FaEye size={18} />
                                                    </button>
                                                    <Link
                                                        href={`/teacher/students/${student.user_id}/edit`}
                                                        className="p-2 bg-amber-500 text-white hover:text-amber-400 hover:bg-amber-600 rounded-lg transition-all cursor-pointer"
                                                        title="แก้ไขข้อมูล"
                                                    >
                                                        <FaEdit size={18} />
                                                    </Link>
                                                    <button
                                                        onClick={() => openModal(student)}
                                                        className="p-2 bg-red-500 text-white hover:text-red-400 hover:bg-red-600 rounded-lg transition-all cursor-pointer"
                                                        title="ลบผู้เรียน"
                                                    >
                                                        <IoTrash size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {filteredStudents.length > itemsPerPage && (
                <div className="flex justify-between items-center bg-white px-4 py-3 border border-gray-200 shadow-sm rounded-lg mb-6">
                    <div className="flex-1 flex justify-between sm:hidden">
                        <button
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                            className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            ก่อนหน้า
                        </button>
                        <button
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === Math.ceil(filteredStudents.length / itemsPerPage)}
                            className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${currentPage === Math.ceil(filteredStudents.length / itemsPerPage) ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            ถัดไป
                        </button>
                    </div>
                    <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                        <div>
                            <p className="text-sm text-gray-700">
                                แสดง <span className="font-medium">{indexOfFirstStudent + 1}</span> ถึง <span className="font-medium">{Math.min(indexOfLastStudent, filteredStudents.length)}</span> จาก <span className="font-medium">{filteredStudents.length}</span> รายการ
                            </p>
                        </div>
                        <div>
                            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                                <button
                                    onClick={() => paginate(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <span className="sr-only">Previous</span>
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                                {Array.from({ length: Math.ceil(filteredStudents.length / itemsPerPage) }, (_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => paginate(i + 1)}
                                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${currentPage === i + 1
                                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    onClick={() => paginate(currentPage + 1)}
                                    disabled={currentPage === Math.ceil(filteredStudents.length / itemsPerPage)}
                                    className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 ${currentPage === Math.ceil(filteredStudents.length / itemsPerPage) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    <span className="sr-only">Next</span>
                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </nav>
                        </div>
                    </div>
                </div>
            )}
            <DeleteModal
                isOpen={isModalOpen}
                onClose={closeModal}
                onConfirm={handleDelete}
                title="ยืนยันการลบข้อมูล"
                description={selectedStudent ? `คุณแน่ใจหรือไม่ว่าต้องการลบผู้เรียน ${selectedStudent.name} ${selectedStudent.lastname}?` : undefined}
                isLoading={isDeleting}
            />

            {/* Modal แสดงรายละเอียดผู้เรียน */}
            <MyModal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)}>
                {viewStudent && (
                    <div className="p-1">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-gray-900">รายละเอียดผู้เรียน</h2>
                        </div>

                        <div className="bg-white shadow rounded-xl p-6 mb-6 flex items-center gap-5 border border-blue-100">
                            <div className={`h-24 w-24 rounded-2xl shadow-sm flex items-center justify-center text-4xl font-bold transition-transform hover:scale-105 duration-300 ${getAvatarColor(viewStudent.name)}`}>
                                {viewStudent.name.charAt(0)}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-2xl font-bold text-gray-900">
                                        {viewStudent.name} {viewStudent.lastname}
                                    </h3>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        {gradeLevel(viewStudent.level)}
                                    </span>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                        รหัสประจำตัว: {viewStudent.std_id}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl border border-gray-100 bg-white hover:border-blue-200 transition-colors shadow-sm">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                        <HiOutlineMail className="text-xl" />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">อีเมล</span>
                                </div>
                                <p className="text-gray-900 font-medium break-all">{viewStudent.email}</p>
                            </div>

                            <div className="p-4 rounded-xl border border-gray-100 bg-white hover:border-blue-200 transition-colors shadow-sm">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-purple-50 rounded-lg text-purple-600">
                                        <HiOutlineBadgeCheck className="text-xl" />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">บทบาท</span>
                                </div>
                                <p className="text-gray-900 font-medium capitalize">{formatRole(viewStudent.role)}</p>
                            </div>

                            {/* <div className="p-4 rounded-xl border border-gray-100 bg-white hover:border-blue-200 transition-colors shadow-sm md:col-span-2">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-amber-50 rounded-lg text-amber-600">
                                        <HiOutlineIdentification className="text-xl" />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">รหัสผู้ใช้งาน</span>
                                </div>
                                <p className="text-gray-900 font-mono text-sm bg-gray-50 p-2 rounded border border-gray-100 select-all">{viewStudent.user_id}</p>
                            </div> */}
                        </div>

                        {/* <div className="flex justify-end mt-8">
                            <button
                                onClick={() => setIsDetailModalOpen(false)}
                                className="cursor-pointer px-4 px-2.5 bg-gray-900 text-white hover:bg-gray-700 rounded-lg font-medium transition-all shadow-md hover:shadow-lg active:scale-95"
                            >
                                ปิด
                            </button>
                        </div> */}
                    </div>
                )}
            </MyModal>
        </div>
    );
}