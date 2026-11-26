import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  maxWidthClass?: string;
  maxHeightClass?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  bodyClassName?: string;
}

export const ModalShell: React.FC<ModalShellProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  badge,
  maxWidthClass = 'max-w-[640px] w-full',
  maxHeightClass = 'max-h-[90vh]',
  children,
  footer,
  bodyClassName = '',
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-[2px] select-none"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`${maxWidthClass} ${maxHeightClass} bg-white rounded-xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col text-slate-800`}
      >
        <div className="px-5 py-3.5 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {icon && (
              <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200/70 text-[#0066FF] flex items-center justify-center shrink-0">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-900 truncate">
                  {title}
                </h2>
                {badge}
              </div>
              {subtitle && (
                <p className="text-[11px] text-slate-500 truncate mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className={`flex-1 overflow-y-auto ${bodyClassName}`}>{children}</div>

        {footer && (
          <div className="px-5 py-3 border-t border-slate-200/80 bg-slate-50/70 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
