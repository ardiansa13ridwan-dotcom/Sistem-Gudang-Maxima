
import React, { useState, useEffect } from 'react';
import { InventoryItem, Transaction } from '../types';
import { analyzeProcurementNeeds } from '../services/geminiService';
import { 
  FileText, Sparkles, MessageSquare, 
  RefreshCw, Users, ArrowDownCircle, ArrowUpCircle, 
  Database, FileDown, BrainCircuit, PencilLine
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReportsProps {
  items: InventoryItem[];
  transactions: Transaction[];
  onUpdateItem?: (item: InventoryItem) => void;
}

type ReportTab = 'STOCK' | 'INBOUND' | 'OUTBOUND';

const Reports: React.FC<ReportsProps> = ({ items, transactions, onUpdateItem }) => {
  const [activeTab, setActiveTab] = useState<ReportTab>('STOCK');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAiEnabled, setIsAiEnabled] = useState(true);

  const getAISuggestions = async () => {
    if (!isAiEnabled) return;
    setIsLoading(true);
    try {
      const data = await analyzeProcurementNeeds(items);
      setSuggestions(data.suggestions || []);
    } catch (error) {
      console.error("AI Analysis failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAiEnabled) getAISuggestions();
  }, [isAiEnabled]);

  const handleManualQtyChange = (itemId: string, val: string) => {
    if (!onUpdateItem) return;
    const item = items.find(i => i.id === itemId);
    if (item) {
      onUpdateItem({ ...item, manualOrderQty: parseInt(val) || 0 });
    }
  };

  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      const today = new Date().toLocaleDateString('id-ID', { 
        day: 'numeric', month: 'long', year: 'numeric' 
      });

      // Kop Surat
      doc.setFontSize(20);
      doc.setTextColor(30, 64, 175);
      doc.setFont('helvetica', 'bold');
      doc.text('MAXIMA LABORATORIUM KLINIK', 105, 20, { align: 'center' });
      
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.setFont('helvetica', 'normal');
      doc.text('Logistik & Medical Supplies | Dokumen Laporan Resmi', 105, 27, { align: 'center' });
      
      doc.setLineWidth(0.5);
      doc.setDrawColor(30, 64, 175);
      doc.line(20, 32, 190, 32);

      const titles = {
        STOCK: 'LAPORAN STATUS PERSEDIAAN & ESTIMASI ORDER',
        INBOUND: 'LAPORAN RIWAYAT BARANG MASUK',
        OUTBOUND: 'LAPORAN RIWAYAT BARANG KELUAR'
      };
      
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.setFont('helvetica', 'bold');
      doc.text(titles[activeTab], 105, 45, { align: 'center' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Tanggal Cetak: ${today}`, 20, 55);
      doc.text(`Metode Estimasi: ${isAiEnabled ? 'Analisis AI (Gemini)' : 'Input Manual Admin'}`, 140, 55);

      let tableData = [];
      let headers = [];

      if (activeTab === 'STOCK') {
        headers = [['No', 'Nama Barang', 'LOT/Batch', 'Stok', 'Min', 'Estimasi Order', 'Satuan']];
        tableData = items.map((item, idx) => {
          const aiSuggestion = suggestions.find(s => s.itemName === item.name);
          const estimasi = isAiEnabled 
            ? (aiSuggestion ? aiSuggestion.recommendedQty : 0)
            : (item.manualOrderQty || 0);

          return [
            idx + 1,
            item.name.toUpperCase(),
            item.lotNumber,
            item.stock,
            item.minStock,
            estimasi,
            item.unit
          ];
        });
      } else if (activeTab === 'INBOUND') {
        headers = [['Tanggal', 'Nama Barang', 'No. LOT', 'Qty', 'Satuan', 'Supplier']];
        tableData = transactions
          .filter(t => t.type === 'IN')
          .map(t => [t.date, t.itemName, t.lotNumber, t.quantity, t.unit, t.supplier || '-']);
      } else {
        headers = [['Tanggal', 'Nama Barang', 'No. LOT', 'Qty', 'Tujuan', 'Pemohon']];
        tableData = transactions
          .filter(t => t.type === 'OUT')
          .map(t => [t.date, t.itemName, t.lotNumber, t.quantity, t.destination, t.requester]);
      }

      autoTable(doc, {
        startY: 65,
        head: headers,
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold', halign: 'center' },
        styles: { fontSize: 9, cellPadding: 3, valign: 'middle' },
        columnStyles: { 
          0: { cellWidth: 10, halign: 'center' },
          3: { halign: 'center', fontStyle: 'bold' },
          4: { halign: 'center' },
          5: { halign: 'center', fontStyle: 'bold', textColor: [30, 64, 175] }
        }
      });

      const finalY = (doc as any).lastAutoTable?.finalY || 150;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Dibuat Oleh,', 40, finalY + 25, { align: 'center' });
      doc.text('Admin Gudang Maxima', 40, finalY + 30, { align: 'center' });
      doc.text('( ........................... )', 40, finalY + 55, { align: 'center' });

      doc.text('Diketahui Oleh,', 150, finalY + 25, { align: 'center' });
      doc.text('Kepala Cabang / BM', 150, finalY + 30, { align: 'center' });
      doc.text('( ........................... )', 150, finalY + 55, { align: 'center' });

      doc.save(`Laporan_${activeTab}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error(error);
      alert("Gagal membuat PDF.");
    }
  };

  const handleBroadcastWA = (target: string) => {
    let message = `📊 *LAPORAN GUDANG MAXIMA*\n_Tanggal: ${new Date().toLocaleDateString('id-ID')}_\n\n`;
    if (activeTab === 'STOCK') {
      message += `*ESTIMASI ORDER BARANG:*\n`;
      items.filter(i => (isAiEnabled ? suggestions.some(s => s.itemName === i.name) : (i.manualOrderQty || 0) > 0)).forEach((i, idx) => {
        const est = isAiEnabled ? suggestions.find(s => s.itemName === i.name)?.recommendedQty : i.manualOrderQty;
        message += `${idx + 1}. ${i.name} -> Estimasi: *${est} ${i.unit}*\n`;
      });
    }
    window.open(`https://wa.me/6282187577072?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Pusat Laporan</h2>
          <p className="text-slate-500">Rekapitulasi stok & estimasi order</p>
        </div>
        <div className="flex gap-2">
          <button onClick={generatePDF} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
            <FileDown className="w-4 h-4" /> Unduh PDF
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
          {[
            { id: 'STOCK', label: 'Stok Terkini', icon: <Database className="w-4 h-4" /> },
            { id: 'INBOUND', label: 'Barang Masuk', icon: <ArrowDownCircle className="w-4 h-4" /> },
            { id: 'OUTBOUND', label: 'Barang Keluar', icon: <ArrowUpCircle className="w-4 h-4" /> }
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as ReportTab)} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'STOCK' && (
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border shadow-sm">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Metode Estimasi:</span>
            <div className="flex p-0.5 bg-slate-100 rounded-lg">
              <button onClick={() => setIsAiEnabled(true)} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-black uppercase transition-all ${isAiEnabled ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}>
                <BrainCircuit className="w-3 h-3" /> AI Gemini
              </button>
              <button onClick={() => setIsAiEnabled(false)} className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-[10px] font-black uppercase transition-all ${!isAiEnabled ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400'}`}>
                <PencilLine className="w-3 h-3" /> Manual
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden">
        {activeTab === 'STOCK' && (
          <>
            <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-800">Laporan Stok & Order</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                  {isAiEnabled ? 'Analisis Rekomendasi AI' : 'Input Manual Oleh Admin'}
                </p>
              </div>
              {isAiEnabled && (
                <button onClick={getAISuggestions} className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold hover:bg-blue-100">
                  {isLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />} Refresh AI
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b">
                    <th className="px-8 py-5">Nama Barang</th>
                    <th className="px-6 py-5 text-center">Stok</th>
                    <th className="px-6 py-5 text-center">Min</th>
                    <th className="px-6 py-5 text-center bg-blue-50/30">Estimasi Order</th>
                    <th className="px-8 py-5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => {
                    const aiSuggestion = suggestions.find(s => s.itemName === item.name);
                    const isLow = item.stock <= item.minStock;
                    return (
                      <tr key={item.id} className={`group text-sm hover:bg-slate-50 transition-colors ${isLow ? 'bg-rose-50/20' : ''}`}>
                        <td className="px-8 py-4">
                          <div className="font-bold text-slate-700">{item.name}</div>
                          <div className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">LOT: {item.lotNumber}</div>
                        </td>
                        <td className="px-6 py-4 text-center font-bold">{item.stock}</td>
                        <td className="px-6 py-4 text-center text-slate-400 font-bold">{item.minStock}</td>
                        <td className="px-6 py-4 text-center bg-blue-50/10">
                          {isAiEnabled ? (
                            <span className={`font-black ${aiSuggestion ? 'text-blue-600' : 'text-slate-300'}`}>
                              {isLoading ? '...' : (aiSuggestion ? `+${aiSuggestion.recommendedQty}` : '0')}
                            </span>
                          ) : (
                            <input 
                              type="number" 
                              className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-center font-black text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none"
                              value={item.manualOrderQty || 0}
                              onChange={(e) => handleManualQtyChange(item.id, e.target.value)}
                            />
                          )}
                        </td>
                        <td className="px-8 py-4 text-right">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isLow ? 'bg-rose-100 text-rose-700' : 'bg-green-100 text-green-700'}`}>
                            {isLow ? 'Kritis' : 'Aman'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
        
        {activeTab !== 'STOCK' && (
           <div className="p-20 text-center text-slate-300">
             <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
             <p className="text-sm font-bold uppercase tracking-widest">Riwayat transaksi tersedia di menu audit</p>
           </div>
        )}
      </div>

      <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h3 className="text-xl font-bold mb-1">Siap untuk Pengadaan?</h3>
          <p className="text-slate-400 text-sm">Download laporan untuk diajukan ke bagian pembelian atau bagikan ke tim.</p>
        </div>
        <div className="flex gap-3 relative z-10">
           <button onClick={() => handleBroadcastWA('admin')} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-bold text-xs uppercase tracking-widest transition-all">
             <MessageSquare className="w-4 h-4 inline mr-2" /> Broadcast WA
           </button>
           <button onClick={generatePDF} className="px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 active:scale-95 transition-all">
             Cetak Laporan
           </button>
        </div>
      </div>
    </div>
  );
};

export default Reports;
