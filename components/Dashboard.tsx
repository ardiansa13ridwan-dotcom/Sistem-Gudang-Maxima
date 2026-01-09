
import React, { useState } from 'react';
import { InventoryItem, Transaction } from '../types';
import { X, Copy, MessageCircle, ShieldCheck } from 'lucide-react';

interface DashboardProps {
  items: InventoryItem[];
  transactions: Transaction[];
  spreadsheetLink?: string;
  onNavigate: (view: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ items, transactions, onNavigate }) => {
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const savedAppUrl = localStorage.getItem('maxima_manual_app_url');
  const appUrl = savedAppUrl || window.location.origin + window.location.pathname;

  const lowStockItems = items.filter(item => item.stock <= item.minStock);
  const totalStockValue = items.reduce((acc, item) => acc + item.stock, 0);
  const recentTransactions = transactions.slice(0, 5);

  const handleCopy = () => {
    navigator.clipboard.writeText(appUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareViaWA = () => {
    const msg = `Halo Rekan Tim Gudang Maxima,\n\nSilakan buka link aplikasi sistem gudang kita di sini:\n${appUrl}\n\nPastikan buka pakai Chrome ya!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="space-y-10 pb-10">
      {/* Header Tanpa Ikon Berlebihan */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight uppercase">Dasboard GUDANG</h1>
          <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Laboratorium Maxima Palu</p>
        </div>
        
        <div className="flex gap-2 w-full lg:w-auto">
          <button 
            onClick={() => onNavigate('INBOUND')}
            className="flex-1 lg:px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest"
          >
            Barang Masuk
          </button>
          <button 
            onClick={() => onNavigate('OUTBOUND')}
            className="flex-1 lg:px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest"
          >
            Barang Keluar
          </button>
        </div>
      </div>

      {/* Statistik Utama - Bersih Tanpa Ikon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Stok" value={totalStockValue} />
        <StatCard label="Stok Kritis" value={lowStockItems.length} color={lowStockItems.length > 0 ? 'text-rose-600' : 'text-slate-900'} />
        <StatCard label="Transaksi" value={transactions.length} />
        <StatCard label="User Akun" value={JSON.parse(localStorage.getItem('maxima_v3_users') || '[]').length || 1} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl p-6 border border-slate-200">
            <h3 className="font-bold text-slate-800 uppercase tracking-widest text-[10px] mb-6">Aktivitas Terakhir</h3>
            <div className="space-y-3">
              {recentTransactions.map((t, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{t.itemName}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{t.date} • {t.type === 'IN' ? 'Masuk' : 'Keluar'}</p>
                  </div>
                  <p className={`font-bold text-sm ${t.type === 'IN' ? 'text-emerald-600' : 'text-blue-600'}`}>
                    {t.type === 'IN' ? '+' : '-'}{t.quantity}
                  </p>
                </div>
              ))}
              {recentTransactions.length === 0 && (
                <p className="py-10 text-center text-slate-300 font-bold text-[10px] uppercase">Belum ada transaksi</p>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-slate-900 rounded-3xl p-6 text-white">
            <h3 className="font-bold uppercase tracking-widest text-[9px] mb-6 text-slate-500 text-center">Menu Cepat</h3>
            <div className="space-y-2">
              <button onClick={() => onNavigate('MASTER')} className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors">Stok Opname</button>
              <button onClick={() => onNavigate('ALERTS')} className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors">Barang Expired</button>
              <button onClick={() => setShowShareModal(true)} className="w-full py-3 bg-blue-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-colors">Undang Tim (WA)</button>
            </div>
          </div>
        </div>
      </div>

      {/* SHARE MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] w-full max-w-sm p-8 relative">
            <button onClick={() => setShowShareModal(false)} className="absolute right-6 top-6 text-slate-400"><X /></button>
            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight text-center mb-6">Undang Tim Gudang</h3>
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Link Aplikasi:</p>
                <div className="flex gap-2">
                  <input readOnly className="flex-1 bg-white border border-slate-200 px-3 py-2 rounded text-[10px] font-mono text-slate-500 truncate" value={appUrl} />
                  <button onClick={handleCopy} className={`p-2 rounded border ${copied ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-slate-200 text-slate-600'}`}>
                    {copied ? <ShieldCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button onClick={shareViaWA} className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                <MessageCircle className="w-5 h-5" /> Kirim Ke WA
              </button>
              <p className="text-[9px] text-slate-400 font-medium text-center italic">Pastikan link sudah diset di menu Sistem jika ingin membagikan link permanen.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ label, value, color = 'text-slate-900' }: any) => (
  <div className="p-6 bg-white rounded-2xl border border-slate-200">
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <h4 className={`text-2xl font-black ${color}`}>{value}</h4>
  </div>
);

export default Dashboard;
