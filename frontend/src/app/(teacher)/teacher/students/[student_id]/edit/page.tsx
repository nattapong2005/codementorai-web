"use client";

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getUserById, updateUser } from '@/app/services/user';
import { User } from '@/app/types/user';
import { toast } from 'react-toastify';

export default function Page() {
    const [name, setName] = useState('');
    const [lastname, setLastname] = useState('');
    const [email, setEmail] = useState('');
    const [level, setLevel] = useState('');
    const [std_id, setStdId] = useState('');

    const [student, setStudent] = useState<User | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);

    const router = useRouter();
    const params = useParams();
    const student_id = params.student_id as string;

    useEffect(() => {
        if (student_id) {
            const fetchStudent = async () => {
                try {
                    const studentData = await getUserById(student_id);
                    setStudent(studentData);
                    setName(studentData.name);
                    setLastname(studentData.lastname);
                    setEmail(studentData.email);
                    setLevel(studentData.level || '');
                    setStdId(studentData.std_id || '');
                } catch (err) {
                    setError('เกิดข้อผิดพลาดในการดึงข้อมูลผู้เรียน');
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            };
            fetchStudent();
        }
    }, [student_id]);

    const handleUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const updatedData = {
            name,
            lastname,
            email,
            level,
            std_id,
        };

        try {
            await updateUser(student_id, updatedData);
            toast.success('แก้ไขข้อมูลผู้เรียนสำเร็จแล้ว');
            router.back();
        } catch (err) {
            setError('เกิดข้อผิดพลาดในการแก้ไขข้อมูลผู้เรียน');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center text-red-500 mt-10">
                <h2 className="text-2xl font-semibold">Error</h2>
                <p>{error}</p>
                <button onClick={() => router.back()} className="text-blue-500 hover:underline mt-4 inline-block">
                    &larr; ย้อนกลับ
                </button>
            </div>
        );
    }

    return (
        <div className="container mx-auto bg-gray-50">
            <div className="mb-6">
                <button onClick={() => router.back()} className="cursor-pointer text-blue-600 hover:text-blue-800 hover:underline flex items-center transition-colors duration-200">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                    กลับไปยังหน้าผู้เรียน
                </button>
            </div>
            <div className="mx-auto bg-white p-8 rounded-xl shadow-lg">
                <h1 className="text-4xl font-extrabold text-gray-800 mb-8 text-center">แก้ไขข้อมูลผู้เรียน</h1>

                <div className="p-6">
                    <form onSubmit={handleUpdateSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
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
                            <button type="submit" disabled={isSubmitting} className="cursor-pointer inline-flex justify-center py-3 px-8 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200">
                                {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
