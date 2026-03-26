'use client'

import BackButton from '@/app/components/utils/BackButton'
import { LoadingPage } from '@/app/components/utils/LoadingPage'
import { getAssignmentById, postAssignment, updateAssignment } from '@/app/services/assignment'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

export default function Page() {
    const router = useRouter()
    const { assignment_id } = useParams<{ assignment_id: string }>()
    //   const [assignment, setAssignment] = useState<Assignment | null>(null)
    const [loading, setLoading] = useState(true)
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [score, setScore] = useState('')
    const [feedback, setFeedback] = useState('')
    const [dueDate, setDueDate] = useState('')

    const fetchAssignment = async () => {
        try {
            const res = await getAssignmentById(assignment_id)
            setTitle(res.title)
            setDescription(res.description)     
            setScore(String(res.score))
            setFeedback(res.feedback_level)
            setDueDate(res.due_date?.slice(0, 10))
        } catch (err) {
            console.error(err)
            toast.error('ไม่พบข้อมูลงาน')
        } finally {
            setLoading(false)
        }
    }
    useEffect(() => {
        if (assignment_id) {
            fetchAssignment()
        }
    }, [assignment_id])

    const handleUpdateAssignment = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        if (!title || !description || !score || !feedback || !dueDate) {
            return toast.info('กรุณากรอกข้อมูลให้ครบถ้วน')
        }

        const payload = {
            title,
            description,
            score: Number(score),
            feedback_level: feedback,
            due_date: dueDate,
        }
        try {
            await updateAssignment(assignment_id, payload)
            toast.success('อัพเดทงานสําเร็จ')
        } catch (err) {
            console.error(err)
            toast.error('เกิดข้อผิดพลาด')
        }
    }
    if (loading) {
        return (
           <LoadingPage/>
        )
    }

    return (
        <section className="mx-auto">
            <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">แก้ไขงาน</h1>
                    <p className="text-gray-500 mt-1">แก้ไขรายละเอียด แบบฝึกหัด หรือการบ้านสำหรับผู้เรียน</p>
                </div>
                <BackButton/>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4">
                    <h2 className="text-lg font-semibold text-gray-800">ข้อมูลงาน</h2>
                </div>
                
                <form className="p-6 md:p-8 space-y-8" onSubmit={handleUpdateAssignment}>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                หัวข้องาน <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="เช่น การบวกเลข 2 หลัก, เรียงความเรื่อง..."
                                className="block w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-gray-800 placeholder:text-gray-400"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                โจทย์ / รายละเอียด <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={6}
                                placeholder="รายละเอียดของงาน คำสั่ง หรือโจทย์ที่ต้องการให้ผู้เรียนทำ..."
                                className="block w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-gray-800 placeholder:text-gray-400 resize-y min-h-[120px]"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    คะแนนเต็ม <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        value={score}
                                        onChange={(e) => setScore(e.target.value)}
                                        className="block w-full pl-4 pr-12 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-gray-800"
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm">คะแนน</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    รูปแบบการตรวจ <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={feedback}
                                        onChange={(e) => setFeedback(e.target.value)}
                                        className="block w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-gray-800 appearance-none cursor-pointer"
                                    >
                                        <option value="" disabled>-- เลือกรูปแบบ --</option>
                                        <option value="HINT">ใบ้จุดผิด (ไม่เฉลย)</option>
                                        <option value="CONCEPT">อธิบายหลักการ (เน้นทฤษฎี)</option>
                                        <option value="ANSWER">เฉลยและแก้ไขโค้ด (ละเอียด)</option>
                                        <option value="NONE">ตรวจด้วยตนเอง (ตรวจโค้ดเอง)</option>
                                    </select>
                                    <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    วันกำหนดส่ง <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onClick={(e) => e.currentTarget.showPicker()}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="block w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none text-gray-800 cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-3">
                        <button
                            type="submit"
                            className="cursor-pointer px-8 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-lg shadow-sm font-medium transition-all transform active:scale-[0.98]"
                        >
                            บันทึกการแก้ไข
                        </button>
                    </div>
                </form>
            </div>
        </section>
    )
}