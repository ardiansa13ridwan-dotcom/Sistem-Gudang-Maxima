import React, { useState, useEffect, useCallback } from 'react';
// Correct component import casing to match PascalCase filenames
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import MasterInventory from './components/MasterInventory';
import MasterSupplier from './components/MasterSupplier';
import Inbound from './components/Inbound';
import Outbound from './components/Outbound';
import Alerts from './components/Alerts';
import Reports from './components/Reports';
import MasterUser from './components/MasterUser';
import SystemMaintenance from './components/SystemMaintenance';
import { View, InventoryItem, Transaction, UserAccount, Room, Supplier } from './types';
import { MOCK_USERS } from './constants';
import { Menu, ShieldCheck, User, Lock, Cpu } from 'lucide-react';
import { getSupabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [currentView, setCurrentView] = useState<View>('DASHBOARD');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isSyncing, setIsSyncing] = useState(false);
  const [dbStatus, setDbStatus] = useState<'DISCONNECTED' | 'CONNECTED' | 'ERROR'>('DISCONNECTED');
  const [loginData, setLoginData] = useState({ username: '', password: '' });
  
  const STORAGE_KEYS = {
    ITEMS: 'maxima_logistik_items_v5',
    USERS: 'maxima_logistik_users_v5',
    SUPPLIERS: 'maxima_logistik_suppliers_v5',
    TRANSACTIONS: 'maxima_logistik_transactions_v5',
    SESSION: 'maxima_current_session'
  };

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const loadInitialData = useCallback(() => {
    const localItems = localStorage.getItem(STORAGE_KEYS.ITEMS);
    const localUsers = localStorage.getItem(STORAGE_KEYS.USERS);
    const localSuppliers = localStorage.getItem(STORAGE_KEYS.SUPPLIERS);
    const localTrans = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    const savedSession = localStorage.getItem(STORAGE_KEYS.SESSION);

    if (localItems) setItems(JSON.parse(localItems));
    const parsedUsers = localUsers ? JSON.parse(localUsers) : [];
    setUsers(parsedUsers.length > 0 ? parsedUsers : MOCK_USERS);
    if (localSuppliers) setSuppliers(JSON.parse(localSuppliers));
    if (localTrans) setTransactions(JSON.parse(localTrans));

    if (savedSession) {
      setCurrentUser(JSON.parse(savedSession));
      setIsAuthenticated(true);
    }
  }, []);

  const fetchCloudData = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    try {
      const [ { data: cItems }, { data: cUsers }, { data: cSuppliers }, { data: cTrans } ] = await Promise.all([
        supabase.from('items').select('*'),
        supabase.from('users').select('*'),
        supabase.from('suppliers').select('*'),
        supabase.from('transactions').select('*').order('date', { ascending: false }).limit(100)
      ]);
      if (cItems) setItems(cItems);
      if (cUsers) setUsers(cUsers.length > 0 ? cUsers : MOCK_USERS);
      if (cSuppliers) setSuppliers(cSuppliers);
      if (cTrans) setTransactions(cTrans);
      setDbStatus('CONNECTED');
    } catch (e) { setDbStatus('ERROR'); }
  };

  useEffect(() => {
    loadInitialData();
    fetchCloudData();
  }, [loadInitialData]);

  const handleUpsertItem = (item: InventoryItem) => {
    const newItems = items.find(i => i.id === item.id) ? items.map(i => i.id === item.id ? item : i) : [...items, item];
    setItems(newItems);
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(newItems));
  };

  const handleTransactions = (newTrans: Transaction[]) => {
    setTransactions([...newTrans, ...transactions]);
    // Logika update stok barang bisa ditambahkan di sini
  };

  const renderView = () => {
    switch (currentView) {
      case 'DASHBOARD': return <Dashboard items={items} transactions={transactions} onNavigate={setCurrentView} />;
      case 'MASTER': return <MasterInventory items={items} onAddItem={handleUpsertItem} onDeleteItem={() => {}} onUpdateItem={handleUpsertItem} />;
      case 'INBOUND': return <Inbound items={items} suppliers={suppliers} onTransaction={(t) => handleTransactions([t])} />;
      case 'OUTBOUND': return <Outbound items={items} onProcessBulk={handleTransactions} currentUserName={currentUser?.fullName || ''} />;
      case 'ALERTS': return <Alerts items={items} />;
      case 'REPORTS': return <Reports items={items} transactions={transactions} onUpdateItem={handleUpsertItem} />;
      case 'USERS': return <MasterUser users={users} onAddUser={() => {}} onDeleteUser={() => {}} onUpdateUser={() => {}} />;
      case 'SYSTEM': return <SystemMaintenance items={items} transactions={transactions} users={users} suppliers={suppliers} onRestore={fetchCloudData} onReset={() => {}} onSyncNow={fetchCloudData} />;
      default: return <Dashboard items={items} transactions={transactions} onNavigate={setCurrentView} />;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white">
        <div className="w-full max-w-sm space-y-8 bg-white/5 p-10 rounded-[2.5rem] border border-white/10">
          <div className="text-center">
            <h1 className="text-3xl font-black tracking-tighter uppercase mb-2">MAXIMA LAB</h1>
            <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest">Sistem Gudang</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); setIsAuthenticated(true); setCurrentUser(MOCK_USERS[0]); }} className="space-y-6">
            <input className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="Username" value={loginData.username} onChange={e => setLoginData({...loginData, username: e.target.value})} />
            <input type="password" className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500" placeholder="PIN" value={loginData.password} onChange={e => setLoginData({...loginData, password: e.target.value})} />
            <button className="w-full py-4 bg-blue-600 rounded-2xl font-black uppercase tracking-widest text-xs">Masuk</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#f8fafc] h-screen overflow-hidden">
      <Sidebar currentView={currentView} onViewChange={setCurrentView} onLogout={() => setIsAuthenticated(false)} currentUserFullName={currentUser?.fullName || ''} currentUserRole={currentUser?.role || 'STAFF'} currentUserRoom={currentUser?.room || Room.GUDANG} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className={`flex-1 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'pl-64' : 'pl-0'}`}>
        <header className="bg-white border-b px-8 py-4 flex justify-between items-center">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 bg-slate-100 rounded-lg"><Menu className="w-5 h-5" /></button>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${dbStatus === 'CONNECTED' ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-[10px] font-black uppercase">{dbStatus}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-8">{renderView()}</main>
      </div>
    </div>
  );
};

export default App;