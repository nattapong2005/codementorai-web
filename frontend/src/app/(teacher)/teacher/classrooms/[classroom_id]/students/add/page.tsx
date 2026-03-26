"use client";

import { useState, ChangeEvent, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createUser, getStudent, getUserByClassId, getUserNotEnrolled } from '@/app/services/user';
import { createEnrollment } from '@/app/services/enrollment';
import { User } from '@/app/types/user';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import { IoSearchOutline } from "react-icons/io5";
import { gradeLevel } from '@/app/utils/gradeLevel';

export default function Page() {

    const [name, setName] = useState('');
    const [lastname, setLastname] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [level, setLevel] = useState('');
    const [std_id, setStdId] = useState('');

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [activeTab, setActiveTab] = useState<'select' | 'manual' | 'import'>('select');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // State for 'select' tab
    const [availableStudents, setAvailableStudents] = useState<User[]>([]);
    const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
    const [searchTerm, setSearchTerm] = useState("");
    const [isLoadingStudents, setIsLoadingStudents] = useState(false);

    const router = useRouter();
    const params = useParams();
    const classroom_id = params.classroom_id as string;

    useEffect(() => {
        if (activeTab === 'select') {
            fetchStudentsData();
        }
    }, [activeTab]);

    const fetchStudentsData = async () => {
        setIsLoadingStudents(true);
        try {
            // getUserNotEnrolled ดึงข้อมูลนักเรียนที่ยังไม่ได้ลงทะเบียนในวิชานี้มาให้อยู่แล้ว
            // ไม่จำเป็นต้องดึงทั้งหมดแล้วมา filter เองที่หน้าบ้าน
            const available = await getUserNotEnrolled(classroom_id);
            setAvailableStudents(available);
        } catch (err) {
            console.error("Error fetching students:", err);
            toast.error("เกิดข้อผิดพลาดในการดึงข้อมูลนักเรียน");
        } finally {
            setIsLoadingStudents(false);
        }
    };

    const handleSelectStudent = (studentId: string) => {
        const newSelected = new Set(selectedStudentIds);
        if (newSelected.has(studentId)) {
            newSelected.delete(studentId);
        } else {
            newSelected.add(studentId);
        }
        setSelectedStudentIds(newSelected);
    };

    const handleSelectAll = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const allIds = filteredStudents.map(s => s.user_id);
            setSelectedStudentIds(new Set(allIds));
        } else {
            setSelectedStudentIds(new Set());
        }
    };

    const handleAddSelectedStudents = async () => {
        if (selectedStudentIds.size === 0) {
            toast.info("กรุณาเลือกนักเรียนอย่างน้อย 1 คน");
            return;
        }

        setIsSubmitting(true);
        let successCount = 0;
        let failCount = 0;

        for (const studentId of Array.from(selectedStudentIds)) {
            try {
                await createEnrollment(classroom_id, studentId);
                successCount++;
            } catch (error) {
                console.error(`Failed to add student ${studentId}:`, error);
                failCount++;
            }
        }

        setIsSubmitting(false);

        if (successCount > 0) {
            toast.success(`เพิ่มนักเรียนสำเร็จ ${successCount} คน`);
            if (failCount > 0) {
                toast.error(`ไม่สามารถเพิ่มได้ ${failCount} คน`);
            }
            router.push(`/teacher/classrooms/${classroom_id}/students`);
        } else if (failCount > 0) {
            toast.error("เกิดข้อผิดพลาดในการเพิ่มนักเรียนทั้งหมด");
        }
    };

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        if (!name || !lastname || !email || !password || !level || !std_id) {
            toast.info('กรุณากรอกข้อมูลให้ครบถ้วน');
            setIsSubmitting(false);
            return;
        }

        const newStudent = { name, lastname, email, password, level, role: 'STUDENT', std_id, classroom_id };

        try {
            await createUser(newStudent);
            toast.success('เพิ่มผู้เรียนสำเร็จแล้ว');
            router.push(`/teacher/classrooms/${classroom_id}/students`);
        } catch (err: any) {
            setError(err.response?.data?.message || 'เกิดข้อผิดพลาดในการเพิ่มผู้เรียน');
            console.error(err);
            setIsSubmitting(false);
        }
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
            setError(null);
        }
    };

    const handleClearFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleFileImport = async () => {
        if (!selectedFile) {
            setError('กรุณาเลือกไฟล์ Excel เพื่อนำเข้า');
            return;
        }
        setIsSubmitting(true);
        setError(null);

        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const arrayBuffer = e.target?.result;
                if (!arrayBuffer) throw new Error("ไม่สามารถอ่านข้อมูลไฟล์ได้");

                const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet);

                if (rawData.length === 0) throw new Error("ไม่พบข้อมูลในไฟล์ Excel");

                let successCount = 0;

                for (const row of rawData) {
                    const rawStdId = row['รหัสประจำตัว'] || row['std_id'] || '';
                    const rawName = row['ชื่อ-สกุล'] || row['name'] || '';
                    const rawLevel = row['ระดับชั้น'] || row['level'] || '';
                    const rawEmail = row['อีเมล'] || row['email'] || `${rawStdId}@gmail.com`;

                    let firstName = '';
                    let lastName = '';
                    if (rawName && typeof rawName === 'string' && rawName.includes(' ')) {
                        const parts = rawName.trim().split(/\s+/);
                        firstName = parts[0];
                        lastName = parts.slice(1).join(' ');
                    } else {
                        firstName = String(rawName || '');
                        lastName = String(row['lastname'] || '');
                    }

                    let mapLevel = '';
                    const cleanLevel = String(rawLevel).trim();
                    if (cleanLevel === 'ปวช.1') mapLevel = 'VOC_1';
                    else if (cleanLevel === 'ปวช.2') mapLevel = 'VOC_2';
                    else if (cleanLevel === 'ปวช.3') mapLevel = 'VOC_3';
                    else if (cleanLevel === 'ปวส.1') mapLevel = 'VHC_1';
                    else if (cleanLevel === 'ปวส.2') mapLevel = 'VHC_2';
                    else mapLevel = cleanLevel;

                    const payload = {
                        std_id: String(rawStdId),
                        classroom_id: classroom_id,
                        name: firstName,
                        lastname: lastName,
                        email: String(rawEmail),
                        password: "123456",
                        level: mapLevel,
                        role: "STUDENT"
                    };

                    try {
                        // console.log(payload)
                        await createUser(payload);
                        successCount++;
                    } catch (err: unknown) {
                        const error = err as { response: { data: { message: string } } };
                        toast.error(error.response?.data?.message || 'เกิดข้อผิดพลาดในการเพิ่มผู้เรียน');
                        // console.error(`Error creating student ${payload.std_id}:`, err);
                        // failCount++;
                    }
                }

                if (successCount > 0) {
                    toast.success(`เพิ่มผู้เรียนสำเร็จ ${successCount} รายการ`);
                    router.push(`/teacher/classrooms/${classroom_id}/students`);
                }

                // if (failCount > 0) {
                //     toast.error(`เกิดข้อผิดพลาด ${failCount}`);
                // } else if (successCount > 0) {
                //     setTimeout(() => {
                //         router.push(`/teacher/classrooms/${classroom_id}/students`);
                //     }, 1500);
                // }

            } catch (err: unknown) {
                const error = err as Error;
                setError(`เกิดข้อผิดพลาด: ${error.message}`);
                console.error("Excel Import Error:", err);
            } finally {
                setIsSubmitting(false);
            }
        };

        reader.onerror = (err) => {
            console.error(err);
            setError("เกิดข้อผิดพลาดในการอ่านไฟล์");
            setIsSubmitting(false);
        }

        reader.readAsArrayBuffer(selectedFile);
    };

    const filteredStudents = availableStudents.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.lastname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.std_id.includes(searchTerm) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getAvatarColor = (name: string) => {
        const colors = ['bg-blue-100 text-blue-600', 'bg-green-100 text-green-600', 'bg-purple-100 text-purple-600', 'bg-orange-100 text-orange-600', 'bg-pink-100 text-pink-600'];
        const index = name.length % colors.length;
        return colors[index];
    };

    return (
        <div className="container mx-auto">
            <div className="mb-6 px-4">
                <button onClick={() => router.back()} className="text-blue-600 hover:text-blue-800 hover:underline flex items-center transition-colors duration-200">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg>
                    ย้อนกลับ
                </button>
            </div>
            <div className="mx-auto bg-white p-8 rounded-xl shadow-lg max-w-5xl">
                <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">เพิ่มผู้เรียนในห้องเรียน</h1>

                <div className="mb-8 border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8 justify-center" aria-label="Tabs">
                        <button
                            onClick={() => setActiveTab('select')}
                            className={`${activeTab === 'select' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors duration-200 flex items-center gap-2`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                            เลือกจากรายชื่อ
                        </button>
                        <button
                            onClick={() => setActiveTab('manual')}
                            className={`${activeTab === 'manual' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors duration-200 flex items-center gap-2`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path></svg>
                            เพิ่มรายคน
                        </button>
                        <button
                            onClick={() => setActiveTab('import')}
                            className={`${activeTab === 'import' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-lg transition-colors duration-200 flex items-center gap-2`}
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                            นำเข้าจากไฟล์ Excel
                        </button>
                    </nav>
                </div>

                <div className="p-2">
                    {error && (
                        <div className="bg-red-50 border border-red-300 text-red-800 px-4 py-3 rounded-lg relative mb-6" role="alert">
                            <span className="block sm:inline font-medium">{error}</span>
                        </div>
                    )}

                    {activeTab === 'select' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="relative mb-6">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <IoSearchOutline className="text-gray-400 text-xl" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="ค้นหาด้วย ชื่อ, นามสกุล หรือ รหัสผู้เรียน..."
                                    className="block w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>

                            {isLoadingStudents ? (
                                <div className="flex justify-center py-10">
                                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600"></div>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
                                        <div className="max-h-[500px] overflow-y-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead className="bg-gray-50 sticky top-0 z-10">
                                                    <tr>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">
                                                            <input
                                                                type="checkbox"
                                                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                                                                onChange={handleSelectAll}
                                                                checked={filteredStudents.length > 0 && selectedStudentIds.size === filteredStudents.length}
                                                            />
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            ชื่อ-นามสกุล
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            รหัสประจำตัว
                                                        </th>
                                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                            ระดับชั้น
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="bg-white divide-y divide-gray-200">
                                                    {filteredStudents.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                                                                ไม่พบนักเรียนที่สามารถเพิ่มได้
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        filteredStudents.map((student) => (
                                                            <tr
                                                                key={student.user_id}
                                                                className={`hover:bg-blue-50 cursor-pointer transition-colors ${selectedStudentIds.has(student.user_id) ? 'bg-blue-50' : ''}`}
                                                                onClick={() => handleSelectStudent(student.user_id)}
                                                            >
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 pointer-events-none"
                                                                        checked={selectedStudentIds.has(student.user_id)}
                                                                        readOnly
                                                                    />
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap">
                                                                    <div className="flex items-center">
                                                                        <div className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${getAvatarColor(student.name)}`}>
                                                                            {student.name.charAt(0)}
                                                                        </div>
                                                                        <div className="text-sm font-medium text-gray-900">
                                                                            {student.name} {student.lastname}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                                    {student.std_id}
                                                                </td>
                                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                                    {gradeLevel(student.level)}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="text-sm text-gray-600">
                                            เลือกแล้ว <span className="font-bold text-blue-600">{selectedStudentIds.size}</span> คน
                                        </div>
                                        <button
                                            onClick={handleAddSelectedStudents}
                                            disabled={selectedStudentIds.size === 0 || isSubmitting}
                                            className="inline-flex justify-center py-2 px-6 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        >
                                            {isSubmitting ? 'กำลังบันทึก...' : 'เพิ่มนักเรียนที่เลือก'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'manual' && (
                        <form onSubmit={handleManualSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 animate-in fade-in duration-300">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">ชื่อจริง</label>
                                <input placeholder='กรอกชื่อจริง' type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-base" />
                            </div>
                            <div>
                                <label htmlFor="lastname" className="block text-sm font-medium text-gray-700 mb-1">นามสกุล</label>
                                <input placeholder='กรอกนามสกุล' type="text" id="lastname" value={lastname} onChange={(e) => setLastname(e.target.value)} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-base" />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="std_id" className="block text-sm font-medium text-gray-700 mb-1">รหัสผู้เรียน</label>
                                <input placeholder='กรอกรหัสผู้เรียน' type="text" id="std_id" value={std_id} onChange={(e) => setStdId(e.target.value)} maxLength={13} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-base" />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
                                <input placeholder='กรอกอีเมล' type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-base" />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่าน</label>
                                <input placeholder='กรอกรหัสผ่าน' type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-base" />
                            </div>
                            <div className="md:col-span-2">
                                <label htmlFor="level" className="block text-sm font-medium text-gray-700 mb-1">ระดับชั้น</label>
                                <select id="level" value={level} onChange={(e) => setLevel(e.target.value)} className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-base">
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
                                    {isSubmitting ? 'กำลังบันทึก...' : 'บันทึกผู้เรียน'}
                                </button>
                            </div>
                        </form>
                    )}

                    {activeTab === 'import' && (
                        <div className="space-y-6 animate-in fade-in duration-300">
                            <div className="flex justify-end">
                                <a
                                    href="/excel_template/template.xlsx"
                                    download="template.xlsx"
                                    className="cursor-pointer text-green-600 hover:text-green-800 hover:bg-green-50 flex items-center transition-colors duration-200 bg-white px-4 py-2 rounded-lg border border-green-200 font-medium text-sm"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                    ดาวน์โหลด Template
                                </a>
                            </div>
                            <div
                                className="mt-2 flex justify-center px-6 pt-10 pb-12 border-2 border-gray-300 border-dashed rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <div className="space-y-3 text-center">
                                    <svg className="mx-auto h-16 w-16 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    <div className="flex text-lg text-gray-600">
                                        <span className="relative cursor-pointer font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                                            <span className="px-1">อัปโหลดไฟล์ที่นี้</span>
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500">รองรับไฟล์ XLSX และ CSV</p>
                                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept=".xlsx, .csv" ref={fileInputRef} />
                                </div>
                            </div>
                            {selectedFile && (
                                <div className="text-base text-gray-700 bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-center justify-between">
                                    <p>ไฟล์ที่เลือก: <span className="font-semibold text-blue-800">{selectedFile.name}</span></p>
                                    <button onClick={handleClearFile} className="text-red-500 hover:text-red-700 text-sm font-medium">ล้าง</button>
                                </div>
                            )}
                            <div className="flex justify-end pt-4">
                                <button onClick={handleFileImport} disabled={isSubmitting || !selectedFile} className="inline-flex justify-center py-3 px-8 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200">
                                    {isSubmitting ? 'กำลังนำเข้าข้อมูล...' : 'ยืนยันการนำเข้าข้อมูล'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
