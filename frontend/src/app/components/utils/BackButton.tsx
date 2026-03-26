"use client";
import { useRouter } from "next/navigation";
import React from "react";
import { FaArrowLeft } from "react-icons/fa";

interface BackButtonProps {
    className?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ className }) => {
    const router = useRouter();
    return (
        <button 
            onClick={() => router.back()} 
            className={`bg-white shadow border-gray-200 hover:bg-gray-500 hover:text-white text-gray-600 px-4 py-2 rounded flex gap-2 items-center justify-center cursor-pointer transition duration-300 ${className}`}
        >
            <FaArrowLeft /> <span>ย้อนกลับ</span>
        </button>
    );
};

export default BackButton;
