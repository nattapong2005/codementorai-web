"use client";

import { useState, useEffect } from "react";
import { getMe, updateUser } from "@/app/services/user";
import { User } from "@/app/types/user";
import { toast } from "react-toastify";
import { FaUser, FaEnvelope, FaIdCard, FaGraduationCap, FaEdit, FaSave, FaTimes } from "react-icons/fa";
import { gradeLevel } from "@/app/utils/gradeLevel";
import { LoadingPage } from "@/app/components/utils/LoadingPage";
import { formatRole } from "@/app/utils/role";

export default function ProfilePage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form states
    const [name, setName] = useState("");
    const [lastname, setLastname] = useState("");
    const [email, setEmail] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");

    const fetchUser = async () => {
        try {
            const data = await getMe();
            setUser(data);
            setName(data.name);
            setLastname(data.lastname);
            setEmail(data.email);
        } catch (err) {
            console.error("Error fetching user:", err);
            toast.error("ไม่สามารถโหลดข้อมูลผู้ใช้ได้");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    const handleCancelEdit = () => {
        if (user) {
            setName(user.name);
            setLastname(user.lastname);
            setEmail(user.email);
        }
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
        setIsEditing(false);
    };

    const handleSave = async () => {
        if (!user) return;

        // Validation
        if (!name.trim() || !lastname.trim()) {
            toast.error("กรุณากรอกชื่อและนามสกุล");
            return;
        }

        if (!email.trim()) {
            toast.error("กรุณากรอกอีเมล");
            return;
        }

        // Password validation (only if changing password)
        if (newPassword || confirmNewPassword) {
            if (newPassword !== confirmNewPassword) {
                toast.error("รหัสผ่านใหม่ไม่ตรงกัน");
                return;
            }
            if (newPassword.length < 6) {
                toast.error("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
                return;
            }
        }

        setIsSaving(true);

        try {
            const payload: { name: string; lastname: string; email: string; password?: string } = {
                name: name.trim(),
                lastname: lastname.trim(),
                email: email.trim(),
            };

            if (newPassword) {
                payload.password = newPassword;
            }

            await updateUser(user.user_id, payload);
            toast.success("บันทึกข้อมูลสำเร็จ");
            setIsEditing(false);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
            fetchUser(); // Refresh data
        } catch (err) {
            console.error("Error updating user:", err);
            toast.error("ไม่สามารถบันทึกข้อมูลได้");
        } finally {
            setIsSaving(false);
        }
    };

    const getAvatarColor = (name: string) => {
        const colors = [
            'bg-blue-500',
            'bg-green-500',
            'bg-purple-500',
            'bg-orange-500',
            'bg-pink-500',
            'bg-teal-500',
            'bg-indigo-500'
        ];
        const index = name.length % colors.length;
        return colors[index];
    };

    if (loading) {
        return <LoadingPage />
    }

    if (!user) {
        return (
            <div className="text-center py-16">
                <h2 className="text-2xl font-semibold text-gray-700">ไม่พบข้อมูลผู้ใช้</h2>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">ข้อมูลส่วนตัว</h1>
            </div>

            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Header with Avatar */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-8 py-10">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        <div className={`w-28 h-28 rounded-full ${getAvatarColor(user.name)} flex items-center justify-center text-white text-4xl font-bold shadow-lg border-4 border-white/30`}>
                            {user.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-center md:text-left">
                            <h2 className="text-2xl font-bold text-white">{user.name} {user.lastname}</h2>
                        </div>
                        <div className="md:ml-auto">
                            {!isEditing ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-white text-blue-600 font-medium rounded-lg shadow hover:bg-blue-50 transition-all"
                                >
                                    <FaEdit /> แก้ไขข้อมูลส่วนตัว
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleCancelEdit}
                                        className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white font-medium rounded-lg hover:bg-white/30 transition-all"
                                    >
                                        <FaTimes /> ยกเลิก
                                    </button>
                                    <button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 font-medium rounded-lg shadow hover:bg-blue-50 transition-all disabled:opacity-50"
                                    >
                                        <FaSave /> {isSaving ? "กำลังบันทึก..." : "บันทึก"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Profile Details */}
                <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Name */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                                <FaUser className="text-blue-500" /> ชื่อ
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="ชื่อ"
                                />
                            ) : (
                                <p className="text-gray-900 text-lg font-medium bg-gray-50 px-4 py-3 rounded-lg">{user.name}</p>
                            )}
                        </div>

                        {/* Lastname */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                                <FaUser className="text-blue-500" /> นามสกุล
                            </label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    value={lastname}
                                    onChange={(e) => setLastname(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="นามสกุล"
                                />
                            ) : (
                                <p className="text-gray-900 text-lg font-medium bg-gray-50 px-4 py-3 rounded-lg">{user.lastname}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="space-y-2 md:col-span-2">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                                <FaEnvelope className="text-green-500" /> อีเมล
                            </label>
                            {isEditing ? (
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="อีเมล"
                                />
                            ) : (
                                <p className="text-gray-900 text-lg font-medium bg-gray-50 px-4 py-3 rounded-lg">{user.email}</p>
                            )}
                        </div>

                        {/* Student ID (Read-only) */}
                                       {/* Student ID (Read-only) */}
                                       <div className="space-y-2">
                                           <label className="flex items-center gap-2 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                                               <FaIdCard className="text-purple-500" /> รหัสผู้เรียน
                                           </label>
                                           <p className="text-gray-900 text-lg font-medium bg-gray-50 px-4 py-3 rounded-lg font-mono">{user.std_id}</p>
                                       </div>
               
                                       {/* Level (Read-only) */}
                                       <div className="space-y-2">
                                           <label className="flex items-center gap-2 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                                               <FaGraduationCap className="text-orange-500" /> ตำแหน่ง
                                           </label>
                                           <p className="text-gray-900 text-lg font-medium bg-gray-50 px-4 py-3 rounded-lg">{formatRole(user.role)}</p>
                                       </div>

                        {/* Level (Read-only) */}
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-600 uppercase tracking-wider">
                                <FaGraduationCap className="text-orange-500" /> ระดับชั้น
                            </label>
                            <p className="text-gray-900 text-lg font-medium bg-gray-50 px-4 py-3 rounded-lg">{gradeLevel(user.level)}</p>
                        </div>
                    </div>

                    {/* Password Change Section (only when editing) */}
                    {isEditing && (
                        <div className="mt-8 pt-8 border-t border-gray-200">
                            <h3 className="text-lg font-bold text-gray-800 mb-4">เปลี่ยนรหัสผ่าน</h3>
                            <p className="text-sm text-gray-500 mb-4">เว้นว่างไว้หากไม่ต้องการเปลี่ยนรหัสผ่าน</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-600">รหัสผ่านใหม่</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="รหัสผ่านใหม่"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-600">ยืนยันรหัสผ่านใหม่</label>
                                    <input
                                        type="password"
                                        value={confirmNewPassword}
                                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                        placeholder="ยืนยันรหัสผ่านใหม่"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
