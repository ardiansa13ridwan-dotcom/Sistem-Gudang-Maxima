
import React, { useState } from 'react';
import { Room, InventoryItem, Transaction, UnitType } from '../types';
import { ShoppingCart, Send, User, MapPin, Plus, Trash2, PackageSearch, FileText, CheckCircle2 } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface OutboundProps {
  items: InventoryItem[];
  onProcessBulk: (transactions: Transaction[]) => void;
  currentUserName: string;
}

interface RequestItem {
  id: string;
  itemId: string;
  name: string;
  lotNumber: string;
  quantity: number;
  unit: UnitType;
}

const Outbound: React.FC<OutboundProps> = ({ items, onProcessBulk, currentUserName }) => {
  const [destination, setDestination] = useState(Room.PROSES);
  const [cart, setCart] = useState<RequestItem[]>([]);
  const [searchText, setSearchText] = useState('');
  const [quantityInput, setQuantityInput] = useState('');
  
  const selectedItem = items.find(i => i.name === searchText);

  const addToCart = () => {
    if (!selectedItem) { alert("Pilih barang dari daftar!"); return; }
    const qty = parseInt(quantityInput);
    if (!qty || qty <= 0) { alert("Masukkan jumlah!"); return; }
    if (selectedItem.stock < qty) { alert(`Stok kurang! Sisa: ${selectedItem.stock}`); return; }

    setCart(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      itemId: selectedItem.id,
      name: selectedItem.name,
      lotNumber: selectedItem.lotNumber,
      quantity: qty,
      unit: selectedItem.unit
    }]);
    setSearchText('');
    setQuantityInput('');
  };

  const handleProcess = () => {
    if (cart.length === 0) return;
    
    const newTransactions: Transaction[] = cart.map(req => ({
      id: Math.random().toString(36).substr(2, 9),
      itemId: req.itemId,
      itemName: req.name,
      lotNumber: req.lotNumber,
      type: 'OUT',
      quantity: req.quantity,
      unit: req.unit,
      date: new Date().toISOString().split('T')[0],
      destination: destination,
      requester: currentUserName
    }));

    onProcessBulk(newTransactions);

    // Notifikasi WA
    const details = cart.map(i => `- ${i.name}: ${i.quantity} ${i.unit}`).join('\n');
    const msg = `📦 *PERMINTAAN BARANG*\n📍 *Tujuan:* ${destination}\n👤 *Pemohon:* ${currentUserName}\n*Daftar:*\n${details}`;
    window.open(`https://wa.me/6282187577072?text=${encodeURIComponent(msg)}`, '_blank');

    setCart([]);
    alert("Berhasil dicatat ke Cloud!");
  };

  const generatePDF = () => {
    if (cart.length === 0) {
      alert("Daftar permintaan masih kosong!");
      return;
    }

    const doc = new jsPDF();
    const today = new Date().toLocaleDateString('id-ID', { 
      day: 'numeric', month: 'long', year: 'numeric' 
    });

    // 1. KOP SURAT PROFESIONAL
    doc.setFontSize(20);
    doc.setTextColor(30, 64, 175); // Blue-800
    doc.setFont('helvetica', 'bold');
    doc.text('MAXIMA LABORATORIUM KLINIK', 105, 20, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.setFont('helvetica', 'normal');
    doc.text('Gudang Logistik | Jl. Jl. S. parman No. 24 A-B , Palu', 105, 27, { align: 'center' });
    doc.text('Telp: (0451) 425 888 | Email: maximalab.palu@yahoo.com', 105, 32, { align: 'center' });
    
    // Garis Pemisah Kop
    doc.setDrawColor(30, 64, 175);
    doc.setLineWidth(0.8);
    doc.line(20, 36, 190, 36);
    doc.setLineWidth(0.2);
    doc.line(20, 37.5, 190, 37.5);

    // 2. JUDUL & IDENTITAS PERMINTAAN
    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    doc.text('SURAT PERMINTAAN BARANG (OUTBOUND)', 105, 50, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Info Kiri
    doc.text(`Tujuan Unit : ${destination}`, 20, 65);
    doc.text(`Tanggal     : ${today}`, 20, 71);
    
    // Info Kanan
    doc.text(`No. Dokumen : OUT-${Date.now().toString().slice(-6)}`, 140, 65);
    doc.text(`Operator     : ${currentUserName}`, 140, 71);

    // 3. TABEL BARANG
    autoTable(doc, {
      startY: 80,
      head: [['No', 'Nama Barang', 'No. LOT / Batch', 'Qty', 'Satuan']],
      body: cart.map((item, index) => [
        index + 1,
        item.name.toUpperCase(),
        item.lotNumber,
        item.quantity,
        item.unit
      ]),
      theme: 'striped',
      headStyles: { 
        fillColor: [30, 64, 175], 
        textColor: 255, 
        fontStyle: 'bold',
        halign: 'center'
      },
      styles: { 
        fontSize: 10, 
        cellPadding: 4,
        valign: 'middle'
      },
      columnStyles: { 
        0: { cellWidth: 15, halign: 'center' },
        3: { cellWidth: 20, halign: 'center', fontStyle: 'bold' },
        4: { cellWidth: 25, halign: 'center' }
      }
    });

    // 4. LEMBAR PENGESAHAN (TANDA TANGAN)
    const finalY = (doc as any).lastAutoTable.finalY + 25;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    
    // Kolom Tanda Tangan
    doc.text('Dibuat Oleh,', 40, finalY, { align: 'center' });
    doc.text('Admin Ruangan', 40, finalY + 5, { align: 'center' });
    
    doc.text('Diserahkan Oleh,', 150, finalY, { align: 'center' });
    doc.text('Kepala Gudang', 150, finalY + 5, { align: 'center' });
    
    // Tempat Tanda Tangan (Garis & Nama)
    doc.setFont('helvetica', 'normal');
    doc.text(`( ${currentUserName} )`, 40, finalY + 35, { align: 'center' });
    doc.line(20, finalY + 36, 60, finalY + 36);
    
    doc.text(`( ................................ )`, 150, finalY + 35, { align: 'center' });
    doc.line(130, finalY + 36, 170, finalY + 36);

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('Dokumen ini dicetak otomatis melalui Maxima Lab Warehouse System', 105, 285, { align: 'center' });

    doc.save(`Permintaan_${destination.replace(' ', '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Barang Keluar</h2>
          <p className="text-sm text-slate-500">Input pengeluaran ke unit</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 shadow-sm">
          <User className="w-4 h-4 text-blue-600" /> {currentUserName}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-3">
            <h3 className="font-bold text-sm flex items-center gap-2 uppercase tracking-widest text-slate-400 text-[10px]">
              <MapPin className="w-4 h-4 text-blue-600" /> Tujuan Unit
            </h3>
            <select className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={destination} onChange={e => setDestination(e.target.value as Room)}>
              {Object.values(Room).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          
          <div className="bg-white p-6 rounded-3xl border shadow-sm space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2 uppercase tracking-widest text-slate-400 text-[10px]">
              <PackageSearch className="w-4 h-4 text-blue-600" /> Cari Barang
            </h3>
            <input list="item-list" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Ketik nama barang..." value={searchText} onChange={e => setSearchText(e.target.value)} />
            <datalist id="item-list">{items.map(i => <option key={i.id} value={i.name}>Stok: {i.stock} {i.unit}</option>)}</datalist>
            
            <input type="number" className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="Jumlah" value={quantityInput} onChange={e => setQuantityInput(e.target.value)} />
            
            <button onClick={addToCart} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
              <Plus className="w-5 h-5" /> Masukkan Daftar
            </button>
          </div>
        </div>

        <div className="lg:col-span-8 bg-white rounded-3xl border shadow-sm flex flex-col min-h-[500px] overflow-hidden">
          <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-sm uppercase tracking-widest">Daftar Permintaan ({cart.length})</h3>
            </div>
            {cart.length > 0 && (
              <button onClick={() => setCart([])} className="text-[10px] font-black text-rose-500 uppercase tracking-widest hover:underline">Hapus Semua</button>
            )}
          </div>
          
          <div className="flex-1 p-6 space-y-3 overflow-y-auto max-h-[400px] custom-scrollbar">
            {cart.map(item => (
              <div key={item.id} className="flex justify-between items-center p-4 bg-white rounded-2xl border border-slate-100 hover:border-blue-200 transition-colors">
                <div>
                  <p className="text-sm font-bold text-slate-800">{item.name}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">LOT: {item.lotNumber} • {item.quantity} {item.unit}</p>
                </div>
                <button onClick={() => setCart(cart.filter(i => i.id !== item.id))} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {cart.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-300 py-20">
                <ShoppingCart className="w-12 h-12 mb-2 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">Daftar masih kosong</p>
              </div>
            )}
          </div>
          
          <div className="p-6 bg-slate-50 border-t flex gap-3">
            <button 
              onClick={handleProcess} 
              disabled={cart.length === 0} 
              className="flex-1 py-4 bg-slate-900 hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-30 transition-all active:scale-95"
            >
              <Send className="w-5 h-5" /> SIMPAN KE CLOUD
            </button>
            <button 
              onClick={generatePDF} 
              disabled={cart.length === 0}
              className="px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold disabled:opacity-30 transition-all active:scale-95 shadow-lg shadow-blue-600/20"
              title="Cetak Laporan PDF Resmi"
            >
              <FileText className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Outbound;
