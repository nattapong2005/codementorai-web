"use client";

import { getMyEnrollment } from "@/app/services/enrollment";
import { getMe } from "@/app/services/user";
import { Enrollment } from "@/app/types/enrollment";
import { User } from "@/app/types/user";
import Link from "next/link";
import { useEffect, useState } from "react";
import { LoadingPage } from "@/app/components/utils/LoadingPage";

export default function Page() {

  const [enrollment, setEnrollment] = useState<Enrollment[]>([]);
  const [me, setMe] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEnrollment = async () => {
    try {
      const myEnrollment = await getMyEnrollment();
      setEnrollment(myEnrollment);
    } catch (err) {
      console.error(err)
    }
  }
  const fetchMe = async () => {
    try {
      const me = await getMe();
      setMe(me);
    } catch (err) {
      console.log(err)
    }
  }
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await Promise.all([fetchEnrollment(), fetchMe()]);
      setIsLoading(false);
    }
    init();
  }, [])

  if (isLoading) return <LoadingPage />;

  return (
    <div className="">
      <div className=" mx-auto">
        <div className="py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">ชั้นเรียนของคุณ</h1>
              <p className="mt-1 text-sm text-gray-500">จัดการและเข้าถึงบทเรียนทั้งหมดได้ที่นี่</p>
            </div>
            <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-200 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                {me?.name?.[0] || "U"}
              </div>
              <span className="text-gray-700 font-medium text-sm">
                ยินดีต้อนรับ, {me?.name} {me?.lastname}
              </span>
            </div>
          </div>
        </div>
        <div className="h-px bg-gray-200 w-full mb-8" />
        
        {enrollment.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            {/* <div className="text-6xl mb-4">🏫</div> */}
            <h3 className="text-xl font-semibold text-gray-800">ไม่พบชั้นเรียน</h3>
            <p className="text-gray-500 mt-2">คุณยังไม่ได้ลงทะเบียนในชั้นเรียนใดๆ ในขณะนี้</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {enrollment.map((e) => (
              <Link key={e.enrollment_id} href={`/student/classrooms/${e.classroom.class_id}`} className="group">
                <div className="bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                  <div style={{ backgroundColor: e.classroom.class_color }} className="h-32 p-6 relative flex flex-col justify-between">
                    <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white opacity-10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>

                    <h1 className="text-xl font-bold text-white z-10 line-clamp-2 leading-tight">
                      {e.classroom.class_name}
                    </h1>
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h2 className="text-gray-600 text-sm line-clamp-3 mb-4 leading-relaxed">
                        {e.classroom.description || "ไม่มีคำอธิบายรายวิชา"}
                      </h2>
                    </div>
                    <hr className="text-gray-200" />
                    <h2 className="text-gray-700 font-medium mt-2 text-sm">
                      {e.classroom.teacher.name} {e.classroom.teacher.lastname}
                    </h2>
                  </div>

                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}