"use client";
import React from "react";
import BackButton from "./BackButton";

interface ErrorPageProps {
    errorMessage?: string;
}

const ErrorPage: React.FC<ErrorPageProps> = ({ errorMessage }) => {
    return (
        <div className="overflow-hidden h-screen flex flex-col justify-center items-center px-4">
            <div className="max-w-md w-full text-center">
                <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-50 mb-6">
                    <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h1 className="text-3xl font-bold text-gray-800 mb-3">
                    เกิดข้อผิดพลาด
                </h1>
                <p className="text-gray-500 mb-8 leading-relaxed">
                    {errorMessage || "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ"}
                </p>
                <div className="flex justify-center">
                    <BackButton />
                </div>
            </div>
        </div>
    );
};

export default ErrorPage;  