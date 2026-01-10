import React from 'react';
import { InventoryItem, Transaction } from '../types';

const Dashboard = ({ items, transactions, onNavigate }: any) => {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-black uppercase">Dashboard</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-6 bg-white border rounded-3xl">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total Barang</p>
          <p className="text-2xl font-black">{items.length}</p>
        </div>
        <div className="p-6 bg-white border rounded-3xl">
          <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Stok Kritis</p>
          <p className="text-2xl font-black text-red-600">{items.filter(i => i.stock <= i.minStock).length}</p>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;