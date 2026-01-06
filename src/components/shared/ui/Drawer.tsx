
import React from 'react';
import { OwnerIcon } from '../OwnerIcons';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({ isOpen, onClose, title, children }) => {
  return (
    <>
      {/* Backdrop */}
      {isOpen && <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40" onClick={onClose} />}
      
      {/* Drawer */}
      <div className={`fixed top-0 right-0 bottom-0 w-80 bg-white shadow-2xl z-50 transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'} border-l border-gray-200`}>
        <div className="h-full flex flex-col">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-lg text-gyn-blue-dark">{title}</h3>
            <button type="button" onClick={onClose}><OwnerIcon name="X" className="w-5 h-5 text-gray-500 hover:text-black" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};
