'use client'
import BackButton from '@/app/components/utils/BackButton';
import { postAssignment } from '@/app/services/assignment';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { FaLocationArrow } from 'react-icons/fa';
import { toast } from 'react-toastify';

export default function Page() {

    const router = useRouter()
    const { classroom_id } = useParams<{ classroom_id: string }>();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [score, setScore] = useState("");
    const [feedback, setFeedback] = useState("");
    const [dueDate, setDueDate] = useState("");

    const createAssignment = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!title || !description || !score || !feedback || !dueDate) return toast.error("กรุณากรอกข้อมูลให้ครบถ้วน");

        const payload = {
            class_id: classroom_id,
            title,
            description,
            score: Number(score),
            feedback_level: feedback,
            due_date: dueDate,
        };
        try {
            await postAssignment(payload);
            toast.success("สร้างงานสำเร็จ!");
            setTimeout(() => {
                router.back();
            }, 1000);

        } catch (err) {
            console.error(err);
            toast.error("เกิดข้อผิดพลาดในการสร้างงาน");
        }
    };

    return (
        <section className=" mx-auto ">
            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">

                        มอบหมายงานใหม่
                    </h1>
                    <p className='text-gray-500 mt-2 ml-1'>สร้างแบบฝึกหัดหรือการบ้านให้ผู้เรียนในคลาสเรียนของคุณ</p>
                </div>
                <BackButton/>
                {/* <button
                    onClick={() => router.back()}
                    className='cursor-pointer group flex items-center gap-2 px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 hover:text-primary hover:border-primary/30 transition-all shadow-sm font-medium'
                >
                    <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" size={14} />
                    ย้อนกลับ
                </button> */}
            </div>

            <form
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                onSubmit={createAssignment}
            >
                <div className="p-8 space-y-8">
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-gray-800 border-l-4 border-primary pl-3">
                            รายละเอียดงาน
                        </h2>
                        <div className="grid gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    หัวข้องาน <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                    placeholder="เช่น แบบฝึกหัดบทที่ 1: Introduction to Python"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    โจทย์ / คำอธิบาย <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none min-h-[160px] resize-y"
                                    placeholder="อธิบายรายละเอียดของงาน สิ่งที่ต้องส่ง หรือเงื่อนไขต่างๆ อย่างละเอียด..."
                                />
                            </div>
                        </div>
                    </div>

                    <hr className="border-gray-100" />
                    <div className="space-y-6">
                        <h2 className="text-lg font-semibold text-gray-800 border-l-4 border-primary pl-3">
                            การประเมิน
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    คะแนนเต็ม <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        value={score}
                                        onChange={(e) => {
                                            const value = Number(e.target.value);
                                            if (value >= 0) setScore(e.target.value);
                                        }}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
                                        placeholder="0"
                                    />
                                    <span className="absolute right-4 top-3.5 text-gray-400 text-sm font-medium">คะแนน</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    รูปแบบการตรวจ AI <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none appearance-none cursor-pointer"
                                    >
                                        <option value="">-- เลือกรูปแบบ --</option>
                                        <option value="HINT">ใบ้จุดผิด (HINT)</option>
                                        <option value="CONCEPT">อธิบายหลักการ (CONCEPT)</option>
                                        <option value="ANSWER">เฉลยละเอียด (ANSWER)</option>
                                        <option value="NONE">ประเมินคะแนนเท่านั้น (NONE)</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-gray-500">
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    วันกำหนดส่ง <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    onClick={(e) => e.currentTarget.showPicker()}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 px-8 py-6 border-t border-gray-100 flex items-center justify-end gap-4">
                    <button
                        type="submit"
                        className="cursor-pointer flex items-center gap-2 px-8 py-2.5 bg-primary text-white rounded-lg shadow-lg shadow-primary/30 font-medium transition-all hover:bg-secondary hover:shadow-xl active:scale-95"
                    >
                        <FaLocationArrow />
                        สร้างงาน
                    </button>
                </div>
            </form>
        </section>
    );
}
