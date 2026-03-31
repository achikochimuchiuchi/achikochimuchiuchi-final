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
import { doc, getDoc, setDoc } from 'firebase/firestore';

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

  useEffect(() => {
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
          {user && (
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
        {currentView === 'portal' && (
          <div className="flex flex-col">
            <InactionDB onBack={() => {}} isEmbedded />
            <div className="h-20 bg-gray-50 border-y border-gray-100 flex items-center justify-center">
              <p className="text-[10px] font-bold tracking-[0.5em] text-gray-400 uppercase">Integrated Database Feed</p>
            </div>
            <MisconductDB onBack={() => {}} isEmbedded />
          </div>
        )}

        {currentView === 'inaction_db' && (
          <InactionDB onBack={() => setCurrentView('portal')} />
        )}

        {currentView === 'misconduct_db' && (
          <MisconductDB onBack={() => setCurrentView('portal')} />
        )}
      </div>
    </div>
  );
}
