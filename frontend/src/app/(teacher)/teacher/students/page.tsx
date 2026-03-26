"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getUser, deleteUser } from "@/app/services/user";
import { User } from "@/app/types/user";
import Modal from "@/app/components/Modal";

export default function Page() {
    const [students, setStudents] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<User | null>(null);

    const fetchStudents = async () => {
        try {
            const users = await getUser();
            const studentUsers = users.filter((user: User) => user.role === "STUDENT");
            setStudents(studentUsers);
        } catch (error) {
            console.error("Error fetching students:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    const openModal = (student: User) => {
        setSelectedStudent(student);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setSelectedStudent(null);
        setIsModalOpen(false);
    };

    const handleDelete = async () => {
        if (selectedStudent) {
            try {
                await deleteUser(selectedStudent.user_id);
                fetchStudents(); // Refresh the list
                closeModal();
            } catch (error) {
                console.error("Error deleting student:", error);
                // Optionally, show an error message to the user
            }
        }
    };

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.lastname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-gray-800">การจัดการผู้เรียน</h1>
                <Link href="/teacher/students/add" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                    <span>เพิ่มผู้เรียน</span>
                </Link>
            </div>

            <div className="relative mb-6">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                    <svg className="w-5 h-5 text-gray-400" viewBox="0 0 24 24" fill="none">
                        <path d="M21 21L15.803 15.803M15.803 15.803C17.2108 14.3952 18 12.4805 18 10.5C18 6.91015 15.0899 4 11.5 4C7.91015 4 5 6.91015 5 10.5C5 14.0899 7.91015 17 11.5 17C13.4805 17 15.3952 16.2108 16.803 14.803L15.803 15.803Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"></path>
                    </svg>
                </span>
                <input
                    type="text"
                    placeholder="ค้นหาผู้เรียนด้วยชื่อหรืออีเมล..."
                    className="w-full pl-10 pr-4 py-2 border rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {filteredStudents.length === 0 ? (
                <div className="text-center text-gray-500 mt-10">
                    <h2 className="text-2xl font-semibold">ไม่พบผู้เรียน</h2>
                    <p>ไม่พบผู้เรียนที่ตรงกับเงื่อนไขการค้นหาของคุณ</p>
                </div>
            ) : (
                <div className="overflow-x-auto bg-white shadow-md rounded-lg">
                    <table className="min-w-full leading-normal">
                        <thead>
                            <tr>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    รหัสผู้เรียน
                                </th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    ชื่อ-นามสกุล
                                </th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    อีเมล
                                </th>
                                <th className="px-5 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                    ดำเนินการ
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map((student) => (
                                <tr key={student.user_id}>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        <p className="text-gray-900 whitespace-no-wrap">{student.std_id}</p>
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        <p className="text-gray-900 whitespace-no-wrap">{student.name} {student.lastname}</p>
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
                                        <p className="text-gray-900 whitespace-no-wrap">{student.email}</p>
                                    </td>
                                    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm flex space-x-2">
                                        <Link href={`/teacher/students/${student.user_id}`} className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded text-xs">
                                            ดู
                                        </Link>
                                        <Link href={`/teacher/students/${student.user_id}/edit`} className="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-1 px-3 rounded text-xs">
                                            แก้ไข
                                        </Link>
                                        <button onClick={() => openModal(student)} className="bg-red-500 hover:bg-red-600 text-white font-bold py-1 px-3 rounded text-xs">
                                            ลบ
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            {isModalOpen && selectedStudent && (
                <Modal isOpen={isModalOpen} onClose={closeModal}>
                    <div className="p-6">
                        <h2 className="text-lg font-bold mb-4">ยืนยันการลบ</h2>
                        <p>คุณแน่ใจหรือไม่ว่าต้องการลบผู้เรียน <span className="font-semibold">{selectedStudent.name} {selectedStudent.lastname}</span>?</p>
                        <div className="flex justify-end mt-6 space-x-2">
                            <button onClick={closeModal} className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded">
                                ยกเลิก
                            </button>
                            <button onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded">
                                ลบ
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
}

