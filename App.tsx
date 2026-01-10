/**
 * MAXIMA WAREHOUSE SYSTEM - V5.0.6 (ULTIMATE VERCEL FIX)
 * Build Signature: 20240320-VERCEL-DEPLOY-READY
 * Status: IMPORTMAP REMOVED PERMANENTLY.
 */
import React, { useState, useEffect, useCallback } from 'react';
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

  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth > 1024);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  useEffect(() => {
    loadInitialData();
    fetchCloudData();
    const interval = setInterval(fetchCloudData, 120000);
    return () => clearInterval(interval);
  }, [loadInitialData]);

  const fetchCloudData = async () => {
    const supabase = getSupabase();
    if (!supabase) { setDbStatus('DISCONNECTED'); return; }
    
    setIsSyncing(true);
    try {
      const [
        { data: cItems }, 
        { data: cUsers }, 
        { data: cSuppliers }, 
        { data: cTrans }
      ] = await Promise.all([
        supabase.from('items').select('*'),
        supabase.from('users').select('*'),
        supabase.from('suppliers').select('*'),
        supabase.from('transactions').select('*').order('date', { ascending: false }).limit(200)
      ]);

      if (cItems) { setItems(cItems); localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(cItems)); }
      if (cUsers) { setUsers(cUsers.length > 0 ? cUsers : MOCK_USERS); localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(cUsers)); }
      if (cSuppliers) { setSuppliers(cSuppliers); localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(cSuppliers)); }
      if (cTrans) { setTransactions(cTrans); localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(cTrans)); }
      
      setDbStatus('CONNECTED');
    } catch (e: any) { 
      setDbStatus('ERROR');
    } finally { 
      setIsSyncing(false); 
    }
  };

  const syncToCloud = async (table: string, data: any, isDelete = false) => {
    const supabase = getSupabase();
    if (!supabase) return;
    
    setIsSyncing(true);
    try {
      if (isDelete) {
        await supabase.from(table).delete().eq('id', data.id);
      } else {
        const payload = Array.isArray(data) ? data : [data];
        const dbPayload = payload.map(item => {
          const entry: any = {};
          Object.keys(item).forEach(key => { entry[key.toLowerCase()] = item[key]; });
          return entry;
        });
        await supabase.from(table).upsert(dbPayload);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleUpsertItem = async (item: InventoryItem, isDelete = false) => {
    const newItems = isDelete ? items.filter(i => i.id !== item.id) : 
      (items.find(i => i.id === item.id) ? items.map(i => i.id === item.id ? item : i) : [...items, item]);
    setItems(newItems);
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(newItems));
    await syncToCloud('items', item, isDelete);
  };

  const handleUpsertSupplier = async (supplier: Supplier, isDelete = false) => {
    const newSuppliers = isDelete ? suppliers.filter(s => s.id !== supplier.id) : 
      (suppliers.find(s => s.id === supplier.id) ? suppliers.map(s => s.id === supplier.id ? supplier : s) : [...suppliers, supplier]);
    setSuppliers(newSuppliers);
    localStorage.setItem(STORAGE_KEYS.SUPPLIERS, JSON.stringify(newSuppliers));
    await syncToCloud('suppliers', supplier, isDelete);
  };

  const handleUpsertUser = async (user: UserAccount, isDelete = false) => {
    const newUsers = isDelete ? users.filter(u => u.id !== user.id) : 
      (users.find(u => u.id === user.id) ? users.map(u => u.id === user.id ? user : u) : [...users, user]);
    setUsers(newUsers);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(newUsers));
    await syncToCloud('users', user, isDelete);
  };

  const handleTransactions = async (newTransactions: Transaction[]) => {
    const updatedTransList = [...newTransactions, ...transactions];
    const updatedItems = [...items];
    
    newTransactions.forEach(t => {
      const idx = updatedItems.findIndex(i => i.id === t.itemId);
      if (idx !== -1) {
        const change = t.type === 'IN' ? t.quantity : -t.quantity;
        updatedItems[idx] = { ...updatedItems[idx], stock: Math.max(0, updatedItems[idx].stock + change), lastUpdated: t.date };
      }
    });

    setItems(updatedItems);
    setTransactions(updatedTransList);
    localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(updatedItems));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updatedTransList));

    const affectedItemIds = newTransactions.map(t => t.itemId);
    const affectedItems = updatedItems.filter(i => affectedItemIds.includes(i.id));
    
    await Promise.all([
      syncToCloud('items', affectedItems),
      syncToCloud('transactions', newTransactions)
    ]);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const u = loginData.username.toLowerCase().trim();
    const p = loginData.password.trim();
    const foundUser = users.find(user => user.username.toLowerCase() === u && user.password === p);
    
    if (foundUser) { 
      setCurrentUser(foundUser); 
      setIsAuthenticated(true); 
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(foundUser));
      setLoginData({ username: '', password: '' }); 
    } else { 
      alert('Username atau PIN salah!'); 
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  };

  const navigateTo = (view: View) => {
    setCurrentView(view);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const renderView = () => {
    switch (currentView) {
      case 'DASHBOARD': return <Dashboard items={items} transactions={transactions} onNavigate={navigateTo} />;
      case 'MASTER': return <MasterInventory items={items} onAddItem={handleUpsertItem} onDeleteItem={(id) => handleUpsertItem({id} as any, true)} onUpdateItem={handleUpsertItem} />;
      case 'SUPPLIERS': return <MasterSupplier suppliers={suppliers} onAddSupplier={handleUpsertSupplier} onDeleteSupplier={(id) => handleUpsertSupplier({id} as any, true)} onUpdateSupplier={handleUpsertSupplier} />;
      case 'INBOUND': return <Inbound items={items} suppliers={suppliers} onTransaction={(t) => handleTransactions([t])} />;
      case 'OUTBOUND': return <Outbound items={items} onProcessBulk={handleTransactions} currentUserName={currentUser?.fullName || 'Unknown'} />;
      case 'ALERTS': return <Alerts items={items} />;
      case 'REPORTS': return <Reports items={items} transactions={transactions} onUpdateItem={handleUpsertItem} />;
      case 'USERS': return <MasterUser users={users} onAddUser={handleUpsertUser} onDeleteUser={(id) => handleUpsertUser({id} as any, true)} onUpdateUser={handleUpsertUser} />;
      case 'SYSTEM': return <SystemMaintenance items={items} transactions={transactions} users={users} suppliers={suppliers} onRestore={fetchCloudData} onReset={() => { if(confirm("Hapus data lokal?")) { localStorage.clear(); window.location.reload(); } }} onSyncNow={fetchCloudData} />;
      default: return <Dashboard items={items} transactions={transactions} onNavigate={navigateTo} />;
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-[#020617] via-[#1e3a8a] to-[#020617] flex flex-col items-center justify-center p-6 text-white font-sans overflow-hidden relative">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>

        <div className="w-full max-w-[420px] animate-in fade-in zoom-in duration-700 relative z-10">
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-b from-blue-500 to-blue-700 rounded-[2.5rem] mb-6 shadow-2xl shadow-blue-500/40 border border-white/20">
              <ShieldCheck className="w-12 h-12" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter uppercase mb-2 bg-gradient-to-b from-white to-blue-200 bg-clip-text text-transparent">MAXIMA LAB</h1>
            <p className="text-blue-300/60 text-[11px] font-black uppercase tracking-[0.4em]">Sistem Gudang Terpadu</p>
          </div>

          <div className="bg-white/5 backdrop-blur-3xl p-10 rounded-[3.5rem] border border-white/10 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)]">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-blue-200 uppercase tracking-widest ml-1 flex items-center gap-2">
                   <User className="w-3.5 h-3.5 text-blue-400" /> Nama Pengguna
                 </label>
                 <input 
                   required 
                   className="w-full px-6 py-4.5 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/10 transition-all text-sm font-medium placeholder:text-slate-500 text-white" 
                   placeholder="Username" 
                   value={loginData.username} 
                   onChange={e => setLoginData({ ...loginData, username: e.target.value })} 
                 />
              </div>
              <div className="space-y-2">
                 <label className="text-[10px] font-black text-blue-200 uppercase tracking-widest ml-1 flex items-center gap-2">
                   <Lock className="w-3.5 h-3.5 text-blue-400" /> PIN Keamanan
                 </label>
                 <input 
                   required 
                   type="password" 
                   className="w-full px-6 py-4.5 bg-white/5 border border-white/10 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white/10 transition-all text-sm font-bold tracking-widest placeholder:text-slate-500 text-white" 
                   placeholder="••••" 
                   value={loginData.password} 
                   onChange={e => setLoginData({ ...loginData, password: e.target.value })} 
                 />
              </div>
              <div className="space-y-4 pt-2">
                <button type="submit" className="w-full py-5 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-600/30 active:scale-95 transition-all flex items-center justify-center gap-2">
                  Masuk Sistem
                </button>
                <div className="flex flex-col items-center justify-center pt-2 gap-1 opacity-60">
                  <span className="text-[8px] font-black uppercase tracking-widest text-blue-300">Developed by</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white flex items-center gap-1.5">
                    <Cpu className="w-3 h-3 text-blue-400" /> AR Develop Team
                  </span>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-[#f8fafc] font-sans relative overflow-hidden h-screen">
      <Sidebar 
        currentView={currentView} 
        onViewChange={navigateTo} 
        onLogout={handleLogout} 
        currentUserFullName={currentUser?.fullName || 'User'} 
        currentUserRole={currentUser?.role || 'STAFF'} 
        currentUserRoom={currentUser?.room || Room.GUDANG} 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      
      {isSidebarOpen && window.innerWidth < 1024 && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity" onClick={() => setIsSidebarOpen(false)}></div>
      )}

      <div className={`flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ease-in-out ${isSidebarOpen && window.innerWidth >= 1024 ? 'pl-64' : 'pl-0'}`}>
        <header className="bg-white/80 backdrop-blur-md px-6 py-4 flex justify-between items-center border-b border-slate-200 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
              className="p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all active:scale-90"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>
            <div className="flex flex-col">
              <span className="font-black text-[11px] text-blue-600 tracking-tighter uppercase leading-none">MAXIMA GUDANG</span>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{currentView.replace('_', ' ')}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl border border-slate-200">
               <div className={`w-2 h-2 rounded-full ${dbStatus === 'CONNECTED' ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`}></div>
               <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{dbStatus}</span>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-12 bg-[#f8fafc] custom-scrollbar">
          <div className="max-w-6xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
            {renderView()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;