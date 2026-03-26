"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createUser } from '@/app/services/user';
import { toast } from 'react-toastify';

export default function Page() {
    const [name, setName] = useState('');
    const [lastname, setLastname] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [level, setLevel] = useState('');
    const [std_id, setStdId] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        if (password !== confirmPassword) {
            setError("รหัสผ่านไม่ตรงกัน");
            setIsSubmitting(false);
            return;
        }

        const newUser = {
            std_id,
            name,
            lastname,
            email,
            password,
            level,
            role: "STUDENT",
            classroom_id: "", // Optional, passing empty string as per current logic
        };

        try {
            await createUser(newUser);
            toast.success('เพิ่มผู้เรียนสำเร็จแล้ว');
            router.push('/teacher/students');
        } catch (err: unknown) {
            const error = err as { response: { data: { message: string } } };
            setError(error.response?.data?.message || 'เกิดข้อผิดพลาดในการเพิ่มผู้เรียน');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container mx-auto bg-gray-50 min-h-screen py-8">
            <div className="mb-6 px-4 flex justify-between items-center">
                <button onClick={() => router.back()} className="cursor-pointer text-blue-600 hover:text-blue-800 hover:underline flex items-center transition-colors duration-200">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                    กลับไปยังหน้าผู้เรียน
                </button>
                <a
                    href="/excel_template/template.xlsx"
                    download="template.xlsx"
                    className="cursor-pointer text-green-600 hover:text-green-800 hover:underline flex items-center transition-colors duration-200 bg-white px-4 py-2 rounded-lg shadow-sm border border-green-200 font-medium"
                >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                    ดาวน์โหลด Template
                </a>
            </div>
            <div className="mx-auto bg-white p-8 rounded-xl shadow-lg max-w-4xl">
                <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">เพิ่มผู้เรียนใหม่</h1>

                {error && (
                    <div className="mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
                        <p className="font-bold">เกิดข้อผิดพลาด</p>
                        <p>{error}</p>
                    </div>
                )}

                <div className="p-6">
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <div className="md:col-span-2">
                            <label htmlFor="std_id" className="block text-sm font-medium text-gray-700 mb-1">รหัสประจำตัวนักศึกษา</label>
                            <input placeholder='กรอกรหัสผู้เรียน' type="text" id="std_id" value={std_id} onChange={(e) => setStdId(e.target.value)} maxLength={13} required className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-base" />
                        </div>
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">ชื่อจริง</label>
                            <input placeholder='กรอกชื่อจริง' type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-base" />
                        </div>
                        <div>
                            <label htmlFor="lastname" className="block text-sm font-medium text-gray-700 mb-1">นามสกุล</label>
                            <input placeholder='กรอกนามสกุล' type="text" id="lastname" value={lastname} onChange={(e) => setLastname(e.target.value)} required className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-base" />
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
                            <input placeholder='กรอกอีเมล' type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-base" />
                        </div>
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
                            <input placeholder='กรอกรหัสผ่าน' type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-base" />
                        </div>
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">ยืนยันรหัสผ่าน</label>
                            <input placeholder='กรอกรหัสผ่านอีกครั้ง' type="password" id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-base" />
                        </div>
                        <div className="md:col-span-2">
                            <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">ระดับชั้น</label>
                            <select id="level" value={level} onChange={(e) => setLevel(e.target.value)} required className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-base">
                                <option value="">เลือกระดับชั้น</option>
                                <option value="VOC_1">ปวช.1</option>
                                <option value="VOC_2">ปวช.2</option>
                                <option value="VOC_3">ปวช.3</option>
                                <option value="VHC_1">ปวส.1</option>
                                <option value="VHC_2">ปวส.2</option>
                            </select>
                        </div>
                        <div className="md:col-span-2 flex justify-end mt-6">
                            <button type="submit" disabled={isSubmitting} className="cursor-pointer inline-flex justify-center py-3 px-8 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200">
                                {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
