import React from 'react';
import { InventoryItem } from '../types';

const MasterInventory = ({ items }: any) => {
  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-black uppercase">Master Barang</h2>
      <div className="bg-white border rounded-3xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b">
            <tr className="text-[10px] font-black uppercase text-slate-400">
              <th className="p-6">Nama</th>
              <th className="p-6 text-center">Stok</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i: any) => (
              <tr key={i.id} className="border-b">
                <td className="p-6 font-bold">{i.name}</td>
                <td className="p-6 text-center font-bold">{i.stock}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default MasterInventory;