import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = false,
}) => (
  <div
    onClick={onClick}
    className={`bg-white border border-[#E5E0D8] rounded-2xl p-5 shadow-xs transition-all ${
      hoverable ? 'hover:shadow-md hover:border-[#4B5320]/30 cursor-pointer' : ''
    } ${className}`}
  >
    {children}
  </div>
);

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-4 border-b border-[#E5E0D8] ${className}`}>{children}</div>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-4 ${className}`}>{children}</div>
);

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
  <div className={`p-4 border-t border-[#E5E0D8] ${className}`}>{children}</div>
);
