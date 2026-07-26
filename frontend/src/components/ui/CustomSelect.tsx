import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export interface CustomSelectOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  options: CustomSelectOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  variant?: 'pill' | 'default';
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  options,
  value,
  onChange,
  className = '',
  placeholder = 'Select option...',
  icon,
  variant = 'default'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const triggerStyles = variant === 'pill'
    ? 'bg-white px-3.5 py-1.5 rounded-full border border-[#E5E0D8] text-xs font-semibold text-[#2C2C2C] shadow-sm hover:border-[#D0C9BD] transition-all flex items-center gap-2 cursor-pointer select-none'
    : 'bg-white px-3.5 py-2 rounded-xl border border-[#E5E0D8] text-xs font-medium text-[#2C2C2C] shadow-sm hover:border-[#D0C9BD] transition-all flex items-center justify-between gap-2 cursor-pointer select-none';

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className={`${triggerStyles} ${className}`}
        role="button"
        tabIndex={0}
      >
        <div className="flex items-center gap-2 truncate">
          {icon}
          {selectedOption?.icon}
          <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-[#8C867E] transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 min-w-[200px] w-full max-h-60 overflow-y-auto rounded-xl border border-[#E5E0D8] bg-white p-1.5 shadow-xl z-50 animate-in fade-in slide-in-from-top-1 duration-150">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between px-3 py-2 text-xs rounded-lg cursor-pointer transition-colors ${
                  isSelected 
                    ? 'bg-[#F5F2ED] text-[#4B5320] font-semibold' 
                    : 'text-[#2C2C2C] hover:bg-[#F9F7F4] font-normal'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {opt.icon}
                  <span className="truncate">{opt.label}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#4B5320] shrink-0 ml-2" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
