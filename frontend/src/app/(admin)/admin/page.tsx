"use client";

import { useEffect, useState } from "react";
import { FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";
import MyModal from "@/app/components/Modal";
import { createUser, deleteUser, getUser, updateUser } from "@/app/services/user";
import { User } from "@/app/types/user";
import { LoadingPage } from "@/app/components/utils/LoadingPage";
import DeleteModal from "@/app/components/modal/Delete";

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"create" | "edit">("create");
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [isLoadingAction, setIsLoadingAction] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const usersPerPage = 10;

    // Calculate Pagination
    const indexOfLastUser = currentPage * usersPerPage;
    const indexOfFirstUser = indexOfLastUser - usersPerPage;
    const currentUsers = users.slice(indexOfFirstUser, indexOfLastUser);


    // Form State
    const [formData, setFormData] = useState({
        std_id: "",
        name: "",
        lastname: "",
        email: "",
        password: "",
        level: "VOC_1",
        role: "STUDENT",
    });

    const fetchUsers = async () => {
        try {
            const data = await getUser();
            setUsers(data);
        } catch (error) {
            console.error(error);
            toast.error("ไม่สามารถดึงข้อมูลผู้ใช้งานได้");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleOpenCreateModal = () => {
        setModalMode("create");
        setFormData({
            std_id: "",
            name: "",
            lastname: "",
            email: "",
            password: "",
            level: "VOC_1",
            role: "STUDENT",
        });
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (user: User) => {
        setModalMode("edit");
        setSelectedUser(user);
        setFormData({
            std_id: user.std_id,
            name: user.name,
            lastname: user.lastname,
            email: user.email,
            password: "", // Don't show password
            level: user.level,
            role: user.role,
        });
        setIsModalOpen(true);
    };

    const handleOpenDeleteModal = (user: User) => {
        setSelectedUser(user);
        setIsDeleteModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoadingAction(true);

        try {
            if (modalMode === "create") {
                await createUser(formData);
                toast.success("สร้างผู้ใช้งานสำเร็จ");
            } else {
                if (!selectedUser) return;
                // Only include password if it's not empty
                const payload = { ...formData };
                if (!payload.password) delete (payload as any).password;

                await updateUser(selectedUser.user_id, payload);
                toast.success("แก้ไขข้อมูลสำเร็จ");
            }
            setIsModalOpen(false);
            fetchUsers();
        } catch (error) {
            console.error(error);
            toast.error(modalMode === "create" ? "สร้างผู้ใช้งานไม่สำเร็จ" : "แก้ไขข้อมูลไม่สำเร็จ");
        } finally {
            setIsLoadingAction(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedUser) return;
        setIsLoadingAction(true);
        try {
            await deleteUser(selectedUser.user_id);
            toast.success("ลบผู้ใช้งานสำเร็จ");
            setIsDeleteModalOpen(false);
            fetchUsers();
        } catch (error) {
            console.error(error);
            toast.error("ลบผู้ใช้งานไม่สำเร็จ");
        } finally {
            setIsLoadingAction(false);
        }
    };

    if (loading) return <LoadingPage />;

    return (
        <div className="container mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">จัดการผู้ใช้งาน</h1>
                <button
                    onClick={handleOpenCreateModal}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
                >
                    <FaPlus /> เพิ่มผู้ใช้งาน
                </button>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">รหัสนักศึกษา/User ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อ-นามสกุล</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ระดับชั้น</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">บทบาท</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">จัดการ</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {currentUsers.map((user) => (
                            <tr key={user.user_id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.std_id}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.name} {user.lastname}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.level}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'ADMIN' ? 'bg-red-100 text-red-800' :
                                        user.role === 'TEACHER' ? 'bg-blue-100 text-blue-800' :
                                            'bg-green-100 text-green-800'
                                        }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <button
                                        onClick={() => handleOpenEditModal(user)}
                                        className="text-indigo-600 hover:text-indigo-900"
                                    >
                                        <FaEdit className="inline" />
                                    </button>
                                    <button
                                        onClick={() => handleOpenDeleteModal(user)}
                                        className="text-red-600 hover:text-red-900"
                                    >
                                        <FaTrash className="inline" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex justify-between items-center mt-4">
                <span className="text-sm text-gray-700">
                    แสดง {indexOfFirstUser + 1} ถึง {Math.min(indexOfLastUser, users.length)} จากทั้งหมด {users.length} รายการ
                </span>
                <div className="flex gap-2">
                    <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        ก่อนหน้า
                    </button>
                    <button
                        onClick={() => setCurrentPage(prev => (indexOfLastUser < users.length ? prev + 1 : prev))}
                        disabled={indexOfLastUser >= users.length}
                        className="px-3 py-1 border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        ถัดไป
                    </button>
                </div>
            </div>

            {/* Create/Edit Modal */}
            <MyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
                <h2 className="text-xl font-bold mb-4">{modalMode === "create" ? "เพิ่มผู้ใช้งาน" : "แก้ไขข้อมูลผู้ใช้งาน"}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">รหัสนักศึกษา / User ID</label>
                            <input
                                type="text"
                                required
                                value={formData.std_id}
                                onChange={(e) => setFormData({ ...formData, std_id: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">ชื่อ</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">นามสกุล</label>
                            <input
                                type="text"
                                required
                                value={formData.lastname}
                                onChange={(e) => setFormData({ ...formData, lastname: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">ระดับชั้น</label>
                            <select
                                value={formData.level}
                                onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            >
                                <option value="VOC_1">ปวช. 1</option>
                                <option value="VOC_2">ปวช. 2</option>
                                <option value="VOC_3">ปวช. 3</option>
                                <option value="VHC_1">ปวส. 1</option>
                                <option value="VHC_2">ปวส. 2</option>
                                <option value="OTHER">อื่นๆ</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">บทบาท</label>
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            >
                                <option value="STUDENT">นักเรียน (STUDENT)</option>
                                <option value="TEACHER">อาจารย์ (TEACHER)</option>
                                <option value="ADMIN">แอดมิน (ADMIN)</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">รหัสผ่าน {modalMode === 'edit' && '(เว้นว่างหากไม่ต้องการเปลี่ยน)'}</label>
                        <input
                            type="password"
                            required={modalMode === "create"}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                            minLength={6}
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition"
                            disabled={isLoadingAction}
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 transition flex items-center gap-2"
                            disabled={isLoadingAction}
                        >
                            {isLoadingAction ? "กำลังบันทึก..." : (modalMode === "create" ? "เพิ่มผู้ใช้งาน" : "บันทึกการแก้ไข")}
                        </button>
                    </div>
                </form>
            </MyModal>

            <DeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={handleDelete}
                title="ยืนยันการลบผู้ใช้งาน"
                description={`คุณต้องการลบผู้ใช้งาน ${selectedUser?.name} ${selectedUser?.lastname} ใช่หรือไม่?`}
                isLoading={isLoadingAction}
            />
        </div>
    );
}
