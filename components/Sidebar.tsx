
import React from 'react';
import { NAVIGATION_ITEMS } from '../constants';
import { View, Room } from '../types';
import { LogOut, MapPin, X, FileSpreadsheet } from 'lucide-react';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  onLogout: () => void;
  currentUserFullName: string;
  currentUserRole: 'ADMIN' | 'STAFF';
  currentUserRoom: Room;
  isOpen: boolean;
  onClose: () => void;
  spreadsheetLink?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onViewChange, 
  onLogout, 
  currentUserFullName, 
  currentUserRole,
  currentUserRoom,
  isOpen,
  onClose,
  spreadsheetLink
}) => {
  // Filter menu berdasarkan hak akses
  // STAFF GUDANG = Semua Menu
  // ADMIN RUANGAN = Dashboard, Outbound, System
  const allowedViews = currentUserRole === 'STAFF' 
    ? NAVIGATION_ITEMS.map(item => item.id)
    : ['DASHBOARD', 'OUTBOUND', 'SYSTEM'];

  const filteredMenu = NAVIGATION_ITEMS.filter(item => allowedViews.includes(item.id));

  return (
    <div className={`
      fixed inset-y-0 left-0 w-64 bg-slate-900 flex flex-col text-white z-50 transition-transform duration-300 ease-in-out lg:translate-x-0
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      {/* Header Utama */}
      <div className="p-8 border-b border-slate-800/50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black tracking-tighter text-blue-400">MAXIMA LAB</h1>
            <p className="text-[9px] text-slate-500 uppercase font-black tracking-[0.2em] mt-1">Warehouse System</p>
          </div>
          <button onClick={onClose} className="lg:hidden p-1 text-slate-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Menu Navigasi - Ikon Disederhanakan */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1.5 custom-scrollbar">
        {filteredMenu.map((item) => (
          <button
            key={item.id}
            onClick={() => onViewChange(item.id as View)}
            className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-2xl transition-all font-bold text-xs uppercase tracking-widest ${
              currentView === item.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
            }`}
          >
            {item.label}
          </button>
        ))}

        {spreadsheetLink && currentUserRole === 'STAFF' && (
          <button 
            onClick={() => window.open(spreadsheetLink, '_blank')}
            className="w-full flex items-center gap-3 px-5 py-3.5 text-emerald-400 hover:bg-emerald-400/10 rounded-2xl mt-4 font-bold text-xs uppercase tracking-widest border border-emerald-400/20"
          >
            <FileSpreadsheet className="w-4 h-4" /> Tabel Database
          </button>
        )}
      </div>

      {/* Footer & Nama Pengembang */}
      <div className="p-8 border-t border-slate-800/50 bg-slate-950/30">
        <div className="mb-6 space-y-1">
          <p className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Operator:</p>
          <p className="text-blue-400 font-black truncate uppercase text-xs">{currentUserFullName}</p>
          <p className="text-slate-500 flex items-center gap-1 text-[9px] font-bold italic truncate">
            <MapPin className="w-3 h-3" /> {currentUserRoom}
          </p>
          <p className="text-[8px] font-black text-slate-500 uppercase">{currentUserRole === 'STAFF' ? 'Staff Gudang' : 'Admin Ruangan'}</p>
        </div>

        <button 
          onClick={onLogout}
          className="w-full py-3 bg-slate-800/50 hover:bg-rose-900/20 hover:text-rose-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all mb-6 border border-slate-700/50"
        >
          LOGOUT SYSTEM
        </button>

        <div className="pt-4 border-t border-slate-800/50">
          <p className="text-[8px] text-slate-600 font-black uppercase tracking-widest mb-1">Pengembang:</p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">AR Develop Team</p>
          <p className="text-[8px] text-slate-700 font-medium italic mt-0.5">Verified System v4.1</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
