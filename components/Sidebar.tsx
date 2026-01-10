import React from 'react';
import { View, Room } from '../types';
import { LogOut, MapPin, X, LayoutDashboard, Package, ArrowDownCircle, ArrowUpCircle, AlertTriangle, FileText, Database } from 'lucide-react';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  onLogout: () => void;
  currentUserFullName: string;
  currentUserRole: string;
  currentUserRoom: Room;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, onLogout, currentUserFullName, currentUserRoom, isOpen, onClose }) => {
  const menu = [
    { id: 'DASHBOARD', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'MASTER', label: 'Barang', icon: <Package className="w-4 h-4" /> },
    { id: 'INBOUND', label: 'Masuk', icon: <ArrowDownCircle className="w-4 h-4" /> },
    { id: 'OUTBOUND', label: 'Keluar', icon: <ArrowUpCircle className="w-4 h-4" /> },
    { id: 'ALERTS', label: 'Peringatan', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'REPORTS', label: 'Laporan', icon: <FileText className="w-4 h-4" /> },
    { id: 'SYSTEM', label: 'Sistem', icon: <Database className="w-4 h-4" /> },
  ];

  return (
    <div className={`fixed inset-y-0 left-0 w-64 bg-slate-900 text-white z-50 transition-transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="p-8 border-b border-white/5 flex justify-between items-center">
        <h1 className="font-black text-blue-400">MAXIMA LAB</h1>
        <button onClick={onClose} className="lg:hidden"><X /></button>
      </div>
      <div className="p-4 space-y-1">
        {menu.map(m => (
          <button key={m.id} onClick={() => onViewChange(m.id as View)} className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${currentView === m.id ? 'bg-blue-600' : 'text-slate-400 hover:bg-white/5'}`}>
            {m.icon} {m.label}
          </button>
        ))}
      </div>
      <div className="absolute bottom-0 w-full p-8 border-t border-white/5 bg-slate-950">
        <p className="text-[10px] font-black uppercase text-blue-400 truncate">{currentUserFullName}</p>
        <p className="text-[8px] text-slate-500 uppercase mt-1">{currentUserRoom}</p>
        <button onClick={onLogout} className="w-full mt-6 py-3 bg-white/5 rounded-xl text-[8px] font-black uppercase tracking-widest">Logout</button>
      </div>
    </div>
  );
};
export default Sidebar;