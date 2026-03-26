"use client";

import { useEffect, useState } from "react";
import { IoClose, IoCheckmarkCircle, IoHelp } from "react-icons/io5"; // เปลี่ยนไอคอนให้สื่อความหมาย

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    description?: string;
    isLoading?: boolean;
    confirmText?: string;
    cancelText?: string;
}

export default function ConfirmModal({
    isOpen,
    onClose,
    onConfirm,
    title = "ยืนยันการทำรายการ",
    description = "คุณต้องการดำเนินการต่อหรือไม่?",
    isLoading = false,
    confirmText = "ยืนยัน",
    cancelText = "ยกเลิก",
}: ConfirmModalProps) {

    const [isVisible, setIsVisible] = useState(false);
    const [animate, setAnimate] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
            const timer = setTimeout(() => setAnimate(true), 10);
            return () => clearTimeout(timer);
        } else {
            setAnimate(false);
            const timer = setTimeout(() => setIsVisible(false), 300);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
            <div
                className={`fixed inset-0 bg-black/50 bg-opacity-50 transition-opacity duration-300 ease-out 
          ${animate ? "opacity-100" : "opacity-0"} 
        `}
                onClick={onClose}
            />
            <div
                className={`relative w-full max-w-md bg-white rounded-2xl p-6 shadow-2xl transform transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]
          ${animate
                        ? "scale-100 opacity-100 translate-y-0"
                        : "scale-90 opacity-0 translate-y-4"
                    }
        `}
            >
                <button
                    onClick={onClose}
                    disabled={isLoading}
                    className="cursor-pointer absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 hover:bg-gray-100 p-1 rounded-full"
                >
                    <IoClose size={24} />
                </button>
                <div className="flex flex-col items-center text-center sm:items-start sm:text-left sm:flex-row sm:gap-4">

                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 sm:mx-0">
                        <IoHelp className="h-6 w-6 text-blue-600" />
                        {/* หรือใช้ <IoCheckmarkCircle className="h-6 w-6 text-blue-600" /> ถ้าเป็นการยืนยันความสำเร็จ */}
                    </div>

                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                        <h3 className="text-lg font-semibold leading-6 text-gray-900">
                            {title}
                        </h3>
                        <div className="mt-2">
                            <p className="text-sm text-gray-500 leading-relaxed">
                                {description}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isLoading}
                        className="cursor-pointer inline-flex w-full justify-center items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 sm:w-auto sm:text-sm transition-colors"
                    >
                        {isLoading ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                กำลังดำเนินการ...
                            </>
                        ) : (
                            <>
                                <IoCheckmarkCircle className="text-lg" /> {confirmText}
                            </>
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="cursor-pointer inline-flex w-full justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 sm:w-auto sm:text-sm transition-colors"
                    >
                        {cancelText}
                    </button>
                </div>
            </div>
        </div>
    );
}