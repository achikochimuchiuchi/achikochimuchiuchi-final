/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
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
  Menu
} from 'lucide-react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const NavItem = ({ icon: Icon, label, sublabel }: { icon: any, label: string, sublabel: string }) => (
  <button className="flex flex-col items-center gap-1 group px-4 py-2 hover:bg-gray-50 rounded-lg transition-all">
    <Icon size={20} className="text-gray-600 group-hover:text-black transition-colors" />
    <span className="text-[11px] font-bold tracking-wider text-gray-800">{label}</span>
    <span className="text-[9px] font-medium tracking-widest text-gray-400 uppercase">{sublabel}</span>
  </button>
);

export default function App() {
  return (
    <div className="min-h-screen bg-white text-[#0a1a2f] font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-20 bg-white border-b border-gray-100 z-50 px-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#0a1a2f] rounded-xl flex items-center justify-center text-white shadow-lg">
            <Shield size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tighter leading-none">PROJECT MANA</h1>
            <p className="text-[10px] font-bold tracking-[0.2em] text-gray-400 mt-1 uppercase">Portal Site V4.0</p>
          </div>
        </div>

        <nav className="hidden lg:flex items-center gap-2">
          <NavItem icon={Database} label="不作為DB" sublabel="INACTION" />
          <NavItem icon={Database} label="不祥事DB" sublabel="MISCONDUCT" />
          <NavItem icon={Search} label="考察サイト" sublabel="ANALYSIS" />
          <NavItem icon={FileText} label="マニフェスト" sublabel="MANIFESTO" />
          <NavItem icon={Activity} label="診断" sublabel="CHECK" />
          <NavItem icon={Scale} label="告発" sublabel="REPORT" />
        </nav>

        <div className="flex items-center gap-4">
          <button className="p-2 text-gray-400 hover:text-black transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors">
            <User size={20} />
          </button>
          <button className="lg:hidden p-2">
            <Menu size={24} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-40 px-8 lg:px-24 max-w-screen-2xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-16">
          {/* Hero Section */}
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-12">
              <span className="bg-[#0a1a2f] text-white text-[10px] font-bold px-4 py-1.5 rounded-full tracking-widest uppercase">
                Portal V4.0
              </span>
              <div className="h-[1px] w-12 bg-gray-300"></div>
              <span className="text-[10px] font-bold tracking-[0.3em] text-gray-400 uppercase">
                Project MANA
              </span>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <h2 className="text-[12vw] lg:text-[140px] font-black leading-[0.85] tracking-tighter mb-8 text-[#0a1a2f]">
                PROJECT<br />
                <span className="text-[#3d0a0a] italic">MANA</span>
              </h2>
            </motion.div>

            <div className="max-w-2xl">
              <p className="text-[11px] font-bold tracking-[0.2em] text-gray-400 mb-8 uppercase">
                Project MANA : MANAの思考を構造化した行政監視ポータル
              </p>
              
              <div className="flex gap-6">
                <div className="w-[3px] bg-[#3d0a0a] h-24 mt-2"></div>
                <p className="text-2xl lg:text-3xl font-medium leading-relaxed text-gray-600 tracking-tight">
                  行政の不祥事、不作為、そして法的精査。市民の知る権利を拡張し、透明な社会を構築するための統合ポータル。
                </p>
              </div>
            </div>
          </div>

          {/* Manifesto Card */}
          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:w-[450px] shrink-0"
          >
            <div className="bg-[#3d0a0a] text-white p-12 lg:p-16 relative overflow-hidden group min-h-[500px] flex flex-col justify-between">
              {/* Decorative background element */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
              
              <div>
                <p className="text-[10px] font-bold tracking-[0.2em] uppercase mb-6 opacity-60">
                  Foundation / 設立趣旨
                </p>
                <h3 className="text-5xl lg:text-6xl font-black tracking-tighter leading-tight mb-4">
                  OUR<br />MANIFESTO
                </h3>
                <p className="text-xs font-medium tracking-widest opacity-60 uppercase">
                  プロジェクト・マナ マニフェスト
                </p>
              </div>

              <button className="flex items-center justify-between w-full border-t border-white/20 pt-8 group/btn">
                <span className="text-lg font-bold tracking-tight border-b-2 border-white pb-1">
                  READ VISION / 理念を読む
                </span>
                <div className="w-12 h-12 rounded-full border border-white/30 flex items-center justify-center group-hover/btn:bg-white group-hover/btn:text-[#3d0a0a] transition-all">
                  <ArrowRight size={20} />
                </div>
              </button>
            </div>
          </motion.div>
        </div>

        {/* Footer / Stats Section */}
        <div className="mt-32 border-t border-gray-100 py-12 flex flex-col lg:flex-row justify-between items-center gap-8">
          <div className="flex gap-12">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Database Records</p>
              <p className="text-2xl font-black">12,482</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Active Analysis</p>
              <p className="text-2xl font-black">842</p>
            </div>
          </div>
          <p className="text-[10px] font-bold text-gray-400 tracking-[0.3em] uppercase">
            © 2026 Project MANA Foundation. All Rights Reserved.
          </p>
        </div>
      </main>
    </div>
  );
}
