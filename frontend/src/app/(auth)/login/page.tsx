"use client";

import React, { useState } from 'react';
import { useRouter } from "next/navigation";
import { MdEmail } from 'react-icons/md';
import { TbLockPassword } from 'react-icons/tb';
import { FaUserGraduate, FaChalkboardTeacher, FaUserShield } from 'react-icons/fa';
import { useAuth } from '@/app/context/AuthContext';
import { toast } from 'react-toastify';
import Link from 'next/link';

const Login: React.FC = () => {

  const router = useRouter();
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const { login } = useAuth();
  const [activeTab, setActiveTab] = useState<'student' | 'teacher' | 'admin'>('student');

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!identifier) return toast.error(activeTab === 'student' ? 'กรุณากรอกรหัสนักศึกษา' : 'กรุณากรอกอีเมล');
    if (!password) return toast.error('กรุณากรอกรหัสผ่าน');

    try {
      const data = await login({ std_id: identifier, password });
      toast.success("เข้าสู่ระบบสำเร็จ");
      setTimeout(() => {
        if (data.role === "TEACHER") {
          router.push('/teacher/classrooms');
        } else if (data.role === "STUDENT") {
          router.push('/student/classrooms');
        } else if (data.role === "ADMIN") {
          router.push('/admin');
        } else {
          router.push('/');
        }
      }, 1000);

    } catch (err: unknown) {
      const error = err as { response: { data: { message: string } } };
      toast.error(error.response?.data?.message || 'เข้าสู่ระบบไม่สําเร็จ');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-blue-700 flex items-center justify-center p-4">
      <div className="flex flex-col md:flex-row items-center justify-center gap-8 w-full max-w-6xl">
        <div className="hidden md:block flex-1 text-center md:text-left text-white">
          <h1 className='text-5xl font-bold mb-5'>CodeMentor AI</h1>
          <p className='text-lg max-w-md text-gray-200'>ระบบที่ช่วยให้ผู้สอนติดตามความคืบหน้าของงานในวิชาการเขียนโปรแกรม และให้ Feedback ที่เหมาะสมต่อการพัฒนาทักษะการเขียนโปรแกรม</p>
        </div>
        <div className="flex-1 w-full max-w-lg bg-white shadow-2xl rounded-lg p-6 sm:p-10">
          <div className="text-center mb-4">
            <h1 className="text-3xl sm:text-4xl font-bold text-primary mb-2">
              ยินดีต้อนรับ
            </h1>
            <p>กรอกข้อมูลเพื่อเข้าสู่ระบบ</p>
          </div>

          {/* Tabs for Student/Teacher Selection */}
          <div className="flex mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              className={`flex-1 py-2 text-center rounded-md font-semibold transition-all duration-200 ${activeTab === 'student'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-indigo-600'
                }`}
              onClick={() => { setActiveTab('student'); setIdentifier(''); setPassword(''); }}
            >
              <span className="flex items-center justify-center gap-2"><FaUserGraduate /> นักศึกษา</span>
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-center rounded-md font-semibold transition-all duration-200 ${activeTab === 'teacher'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-indigo-600'
                }`}
              onClick={() => { setActiveTab('teacher'); setIdentifier(''); setPassword(''); }}
            >
              <span className="flex items-center justify-center gap-2"><FaChalkboardTeacher /> อาจารย์</span>
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-center rounded-md font-semibold transition-all duration-200 ${activeTab === 'admin'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-indigo-600'
                }`}
              onClick={() => { setActiveTab('admin'); setIdentifier(''); setPassword(''); }}
            >
              <span className="flex items-center justify-center gap-2"><FaUserShield /> ผู้ดูแลระบบ</span>
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-base font-semibold text-gray-700 flex gap-2 items-center">
                <MdEmail /> {activeTab === 'student' ? 'เลขประจำตัวนักเรียนนักศึกษา' : 'อีเมล'}
              </label>
              <div>
                <input
                  type={activeTab === 'student' ? 'text' : 'email'}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-base rounded-lg block w-full pl-3 py-3.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 outline-none"
                  placeholder={activeTab === 'student' ? '68219010001' : (activeTab === 'teacher' ? 'teacher@example.com' : 'admin@example.com')}
                  value={identifier}
                  onChange={e => setIdentifier(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="flex gap-2 items-center text-base font-semibold text-gray-700">
                <TbLockPassword /> รหัสผ่าน
              </label>
              <div>
                <input
                  type="password"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-base rounded-lg block w-full pl-3 py-3.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 outline-none"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              className="cursor-pointer w-full py-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <i className="fas fa-sign-in-alt mr-2"></i>เข้าสู่ระบบ
            </button>
            {/* <div className="text-center">
              <Link href="/register" className="text-blue-600 hover:text-blue-800 hover:underline">สำหรับผู้ดูแลระบบ</Link>
            </div> */}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
