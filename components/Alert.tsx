import React from 'react';
import { InventoryItem } from '../types';
import { AlertTriangle, Clock, Share2 } from 'lucide-react';

interface AlertsProps {
  items: InventoryItem[];
}

const Alerts: React.FC<AlertsProps> = ({ items }) => {
  const lowStock = items.filter(item => item.stock <= item.minStock);
  const expired = items.filter(item => new Date(item.expiryDate) < new Date());

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-black uppercase">Peringatan Stok</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-3xl border">
          <h3 className="font-bold text-amber-600 mb-4 flex items-center gap-2"><AlertTriangle /> Stok Rendah</h3>
          {lowStock.map(i => <div key={i.id} className="py-2 border-b text-sm font-bold">{i.name} (Sisa: {i.stock})</div>)}
          {lowStock.length === 0 && <p className="text-slate-300 text-sm italic">Tidak ada stok rendah</p>}
        </div>
        <div className="bg-white p-6 rounded-3xl border">
          <h3 className="font-bold text-rose-600 mb-4 flex items-center gap-2"><Clock /> Kedaluwarsa</h3>
          {expired.map(i => <div key={i.id} className="py-2 border-b text-sm font-bold">{i.name} (Tgl: {i.expiryDate})</div>)}
          {expired.length === 0 && <p className="text-slate-300 text-sm italic">Semua barang aman</p>}
        </div>
      </div>
    </div>
  );
};

export default Alerts;