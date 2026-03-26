import React from "react";
import { IoCloseSharp } from "react-icons/io5";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const SmallModal: React.FC<ModalProps> = ({ isOpen, onClose, children }) =>
  !isOpen ? null : (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="relative w-32 p-7 bg-white rounded-lg shadow-lg animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <IoCloseSharp />
        </button>

        {children}
      </div>
    </div>
  );


