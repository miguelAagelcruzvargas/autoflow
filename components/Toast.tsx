import React from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { ToastMsg } from '../types';

interface ToastProps {
  message: string;
  type: ToastMsg['type'];
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => (
  <div 
    className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-xl border cursor-pointer animate-[slideIn_0.3s_ease-out] backdrop-blur-md ${
    type === 'success' ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200' : 
    type === 'error' ? 'bg-red-950/80 border-red-800 text-red-200' : 
    'bg-slate-800/80 border-slate-700 text-white'
  }`} 
    onClick={onClose}
  >
    {type === 'success' ? <CheckCircle size={18}/> : type === 'error' ? <AlertTriangle size={18}/> : <CheckCircle size={18}/>}
    <span className="text-sm font-medium">{message}</span>
    <style>{`
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
    `}</style>
  </div>
);
