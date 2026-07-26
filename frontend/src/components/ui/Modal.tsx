import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | string;
  children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, subtitle, maxWidth = 'md', children }: ModalProps) {
  if (!isOpen) return null;

  const maxWidthClass = 
    maxWidth === 'sm' ? 'max-w-sm' :
    maxWidth === 'md' ? 'max-w-md' :
    maxWidth === 'lg' ? 'max-w-lg' :
    maxWidth === 'xl' ? 'max-w-xl' : 'max-w-md';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className={`relative bg-white w-full ${maxWidthClass} rounded-3xl p-6 shadow-2xl z-10 space-y-4 my-8 border border-[#E5E0D8]`}
        >
          <div className="flex items-start justify-between">
            <div>
              {title && <h3 className="font-serif text-xl font-bold text-[#2C2C2C]">{title}</h3>}
              {subtitle && <p className="text-xs text-[#8C867E] mt-0.5">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-[#F5F2ED] text-[#8C867E] hover:text-[#2C2C2C] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div>{children}</div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
