/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Search, 
  FileText, 
  Activity, 
  Scale, 
  Bell, 
  User,
  Shield,
  ArrowRight,
  Menu,
  LogOut,
  LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { InactionDB } from './components/InactionDB';
import { MisconductDB } from './components/MisconductDB';
import { auth, signInWithGoogle, logout, db } from './firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, orderBy, onSnapshot, limit } from 'firebase/firestore';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type ViewState = 'portal' | 'inaction_db' | 'misconduct_db' | 'analysis' | 'manifesto' | 'check' | 'report';

const NavItem = ({ icon: Icon, label, sublabel, onClick, active }: { icon: any, label: string, sublabel: string, onClick?: () => void, active?: boolean }) => (
  <button 
    onClick={onClick}
    className={cn(
      "flex flex-col items-center gap-1 group px-4 py-2 rounded-lg transition-all",
      active ? "bg-gray-100" : "hover:bg-gray-50"
    )}
  >
    <Icon size={20} className={cn("transition-colors", active ? "text-black" : "text-gray-600 group-hover:text-black")} />
    <span className="text-[11px] font-bold tracking-wider text-gray-800">{label}</span>
    <span className="text-[9px] font-medium tracking-widest text-gray-400 uppercase">{sublabel}</span>
  </button>
);

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('portal');
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentInaction, setRecentInaction] = useState<any[]>([]);
  const [recentMisconduct, setRecentMisconduct] = useState<any[]>([]);

  useEffect(() => {
    // Fetch recent inaction records
    const qI = query(collection(db, 'inaction_records'), orderBy('createdAt', 'desc'), limit(3));
    const unsubI = onSnapshot(qI, (snapshot) => {
      setRecentInaction(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Fetch recent misconduct records
    const qM = query(collection(db, 'misconduct_records'), orderBy('createdAt', 'desc'), limit(3));
    const unsubM = onSnapshot(qM, (snapshot) => {
      setRecentMisconduct(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Ensure user profile exists in Firestore
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userRef);
        if (!userDoc.exists()) {
          await setDoc(userRef, {
            displayName: firebaseUser.displayName || 'Anonymous',
            email: firebaseUser.email || '',
            role: 'user'
          });
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Remove the loading screen to avoid "entrance" feeling
  // if (loading) { ... }

  // Remove the login wall check
  // if (!user) { ... }

  return (
    <div className="min-h-screen bg-white text-[#0a1a2f] font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-white border-b border-gray-100 z-50 px-8 flex items-center justify-between">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => setCurrentView('portal')}>
          <div className="w-12 h-12 bg-[#0a1a2f] rounded-xl flex items-center justify-center text-white shadow-lg">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter leading-none">PROJECT MANA</h1>
            <p className="text-[10px] font-bold tracking-[0.2em] text-gray-400 mt-1 uppercase">Portal Site V4.0</p>
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-2">
          <NavItem 
            icon={Database} 
            label="不作為DB" 
            sublabel="INACTION" 
            onClick={() => setCurrentView('inaction_db')}
            active={currentView === 'inaction_db'}
          />
          <NavItem 
            icon={Database} 
            label="不祥事DB" 
            sublabel="MISCONDUCT" 
            onClick={() => setCurrentView('misconduct_db')}
            active={currentView === 'misconduct_db'}
          />
          <NavItem icon={Search} label="考察サイト" sublabel="ANALYSIS" />
          <NavItem icon={FileText} label="マニフェスト" sublabel="MANIFESTO" />
          <NavItem icon={Activity} label="診断" sublabel="CHECK" />
          <NavItem icon={Scale} label="告発" sublabel="REPORT" />
        </nav>

        <div className="flex items-center gap-4">
          {!user ? (
            <button 
              onClick={signInWithGoogle}
              className="flex items-center gap-2 bg-[#0a1a2f] text-white px-5 py-2.5 rounded-xl text-xs font-bold tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-blue-900/20"
            >
              <LogIn size={16} />
              SIGN IN
            </button>
          ) : (
            <>
              <button className="p-2 text-gray-400 hover:text-black transition-colors relative">
                <Bell size={20} />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
              <div className="flex items-center gap-3 pl-4 border-l border-gray-100">
                <div className="text-right hidden sm:block">
                  <p className="text-[11px] font-bold leading-none mb-1">{user.displayName}</p>
                  <p className="text-[9px] font-medium text-gray-400 uppercase tracking-widest">Authorized User</p>
                </div>
                <button 
                  onClick={logout}
                  className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-red-50 hover:text-red-600 transition-all"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            </>
          )}
          <button className="lg:hidden p-2">
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="min-h-[calc(100vh-80px)]"
          >
            {currentView === 'portal' && (
              <div className="max-w-7xl mx-auto px-8 py-12">
                {/* Dashboard Header */}
                <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div>
                    <h2 className="text-5xl font-black tracking-tighter mb-4">PORTAL DASHBOARD</h2>
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-black tracking-[0.2em] text-gray-400 uppercase">System Active</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        <span className="text-[10px] font-black tracking-[0.2em] text-gray-400 uppercase">Encrypted</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-gray-50 px-6 py-4 rounded-2xl border border-gray-100">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Records</p>
                      <p className="text-2xl font-black tabular-nums">1,284</p>
                    </div>
                    <div className="bg-gray-50 px-6 py-4 rounded-2xl border border-gray-100">
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Active Alerts</p>
                      <p className="text-2xl font-black tabular-nums text-red-500">12</p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  {/* Inaction DB Card */}
                  <motion.div 
                    whileHover={{ y: -8 }}
                    className="group bg-white border border-gray-100 rounded-[40px] p-10 shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:shadow-blue-900/5 transition-all cursor-pointer relative overflow-hidden"
                    onClick={() => setCurrentView('inaction_db')}
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                      <Database size={160} />
                    </div>
                    <div className="relative z-10">
                      <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-[#0a1a2f] mb-8 group-hover:scale-110 transition-transform">
                        <Database size={32} />
                      </div>
                      <h3 className="text-3xl font-black tracking-tight mb-4">不作為データベース</h3>
                      <p className="text-gray-500 font-medium mb-6 leading-relaxed max-w-sm">
                        組織内で行われなかった必要な措置、放置された警告、そしてその結果生じた事象の全記録。
                      </p>
                      
                      {/* Recent Activity Mini-List */}
                      <div className="space-y-3 mb-8">
                        {recentInaction.map((rec) => (
                          <div key={rec.id} className="flex items-center gap-3 text-[11px] font-medium text-gray-400 border-l-2 border-blue-100 pl-3">
                            <span className="text-blue-500 font-bold">NEW</span>
                            <span className="truncate">{rec.title}</span>
                          </div>
                        ))}
                        {recentInaction.length === 0 && <p className="text-[10px] text-gray-300 italic">No recent activity</p>}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-black tracking-[0.2em] text-blue-500 uppercase">Inaction Records</span>
                          <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                          <span className="text-[10px] font-black tracking-[0.2em] text-gray-400 uppercase">842 Entries</span>
                        </div>
                        <div className="w-12 h-12 rounded-full border border-gray-100 flex items-center justify-center group-hover:bg-[#0a1a2f] group-hover:text-white transition-all">
                          <ArrowRight size={20} />
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Misconduct DB Card */}
                  <motion.div 
                    whileHover={{ y: -8 }}
                    className="group bg-white border border-gray-100 rounded-[40px] p-10 shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:shadow-red-900/5 transition-all cursor-pointer relative overflow-hidden"
                    onClick={() => setCurrentView('misconduct_db')}
                  >
                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
                      <Scale size={160} />
                    </div>
                    <div className="relative z-10">
                      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-900 mb-8 group-hover:scale-110 transition-transform">
                        <Scale size={32} />
                      </div>
                      <h3 className="text-3xl font-black tracking-tight mb-4">不祥事データベース</h3>
                      <p className="text-gray-500 font-medium mb-6 leading-relaxed max-w-sm">
                        不正行為、倫理違反、隠蔽工作など、組織の信頼を揺るがす重大な事案の調査報告。
                      </p>

                      {/* Recent Activity Mini-List */}
                      <div className="space-y-3 mb-8">
                        {recentMisconduct.map((rec) => (
                          <div key={rec.id} className="flex items-center gap-3 text-[11px] font-medium text-gray-400 border-l-2 border-red-100 pl-3">
                            <span className="text-red-500 font-bold">ALERT</span>
                            <span className="truncate">{rec.title}</span>
                          </div>
                        ))}
                        {recentMisconduct.length === 0 && <p className="text-[10px] text-gray-300 italic">No recent activity</p>}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-black tracking-[0.2em] text-red-500 uppercase">Misconduct Cases</span>
                          <span className="w-1 h-1 bg-gray-200 rounded-full"></span>
                          <span className="text-[10px] font-black tracking-[0.2em] text-gray-400 uppercase">442 Cases</span>
                        </div>
                        <div className="w-12 h-12 rounded-full border border-gray-100 flex items-center justify-center group-hover:bg-red-950 group-hover:text-white transition-all">
                          <ArrowRight size={20} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Quick Links / Footer Info */}
                <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { icon: Search, label: "Analysis", sub: "考察サイト" },
                    { icon: FileText, label: "Manifesto", sub: "マニフェスト" },
                    { icon: Activity, label: "Check", sub: "診断" },
                    { icon: Scale, label: "Report", sub: "告発" },
                  ].map((item, i) => (
                    <button key={i} className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-3xl border border-transparent hover:border-gray-200 hover:bg-white transition-all group">
                      <item.icon size={20} className="text-gray-400 group-hover:text-black mb-2 transition-colors" />
                      <span className="text-[10px] font-black tracking-widest uppercase mb-1">{item.label}</span>
                      <span className="text-[9px] font-medium text-gray-400">{item.sub}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {currentView === 'inaction_db' && (
              <InactionDB onBack={() => setCurrentView('portal')} />
            )}

            {currentView === 'misconduct_db' && (
              <MisconductDB onBack={() => setCurrentView('portal')} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
