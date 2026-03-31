/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  ChevronRight, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Archive,
  ArrowLeft,
  MoreHorizontal,
  ExternalLink,
  ShieldAlert,
  Calendar,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { InactionRecord, RecordStatus, Severity } from '../types';
import { auth, db, handleFirestoreError, OperationType, signInWithGoogle } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const StatusBadge = ({ status }: { status: RecordStatus }) => {
  const config = {
    investigating: { icon: Clock, color: 'text-blue-500 bg-blue-50', label: '調査中' },
    archived: { icon: Archive, color: 'text-gray-500 bg-gray-50', label: 'アーカイブ' },
    resolved: { icon: CheckCircle, color: 'text-green-500 bg-green-50', label: '解決済' },
    critical: { icon: ShieldAlert, color: 'text-red-500 bg-red-50', label: '重大懸念' },
  }[status];

  const Icon = config.icon;
  return (
    <span className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", config.color)}>
      <Icon size={12} />
      {config.label}
    </span>
  );
};

const SeverityIndicator = ({ level }: { level: Severity }) => {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <div 
          key={i} 
          className={cn(
            "w-1.5 h-3 rounded-sm",
            i <= level ? "bg-[#3d0a0a]" : "bg-gray-100"
          )} 
        />
      ))}
    </div>
  );
};

export const InactionDB = ({ onBack, isEmbedded }: { onBack: () => void, isEmbedded?: boolean }) => {
  const [records, setRecords] = useState<InactionRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<InactionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newRecord, setNewRecord] = useState({
    title: '',
    description: '',
    category: '行政不作為',
    severity: 3 as Severity,
    tags: [] as string[],
    location: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'inaction_records'), {
        ...newRecord,
        status: 'investigating',
        evidenceCount: 0,
        authorUid: auth.currentUser?.uid,
        createdAt: serverTimestamp(),
      });
      setIsAdding(false);
      setNewRecord({
        title: '',
        description: '',
        category: '行政不作為',
        severity: 3,
        tags: [],
        location: '',
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'inaction_records');
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'inaction_records'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRecords = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as InactionRecord[];
      setRecords(fetchedRecords);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'inaction_records');
    });

    return () => unsubscribe();
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter(r => 
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery, records]);

  return (
    <div className="min-h-screen bg-[#fcfcfc] flex flex-col">
      {/* DB Header */}
      {!isEmbedded && (
        <header className="h-20 bg-white border-b border-gray-100 px-8 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-6">
          <button 
            onClick={onBack}
            className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-400 hover:text-black"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="text-xl font-black tracking-tighter">不作為DB</h2>
            <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Inaction Records Database</p>
          </div>
        </div>

        <div className="flex-1 max-w-xl mx-12 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="記録を検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border-none rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-[#0a1a2f] transition-all outline-none"
          />
        </div>

        <button 
          onClick={() => auth.currentUser ? setIsAdding(true) : signInWithGoogle()}
          className="bg-[#0a1a2f] text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-blue-900/10"
        >
          <Plus size={18} />
          <span className="text-xs font-bold tracking-wider uppercase">New Entry</span>
        </button>
      </header>
    )}

      {/* Add Record Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl"
            >
              <div className="p-8 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-xl font-black tracking-tighter">NEW INACTION RECORD</h3>
                <button onClick={() => setIsAdding(false)} className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                  <ChevronRight size={20} className="rotate-90" />
                </button>
              </div>
              <form onSubmit={handleAddRecord} className="p-8 space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Title / 事案名</label>
                    <input 
                      required
                      value={newRecord.title}
                      onChange={e => setNewRecord({...newRecord, title: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-[#0a1a2f] outline-none"
                      placeholder="例: 〇〇市における道路補修の放置"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Date / 発生日</label>
                      <input 
                        type="date"
                        required
                        value={newRecord.date}
                        onChange={e => setNewRecord({...newRecord, date: e.target.value})}
                        className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-[#0a1a2f] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Severity / 重要度 (1-5)</label>
                      <input 
                        type="number"
                        min="1"
                        max="5"
                        required
                        value={newRecord.severity}
                        onChange={e => setNewRecord({...newRecord, severity: parseInt(e.target.value) as Severity})}
                        className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-[#0a1a2f] outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Description / 詳細内容</label>
                    <textarea 
                      required
                      rows={4}
                      value={newRecord.description}
                      onChange={e => setNewRecord({...newRecord, description: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-[#0a1a2f] outline-none resize-none"
                      placeholder="事案の具体的な内容を記述してください..."
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Tags / タグ (カンマ区切り)</label>
                    <input 
                      value={newRecord.tags.join(', ')}
                      onChange={e => setNewRecord({...newRecord, tags: e.target.value.split(',').map(t => t.trim())})}
                      className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-[#0a1a2f] outline-none"
                      placeholder="道路, 予算, 放置"
                    />
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="flex-1 py-4 rounded-xl text-xs font-bold tracking-widest uppercase border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-[#0a1a2f] text-white py-4 rounded-xl text-xs font-bold tracking-widest uppercase hover:opacity-90 transition-opacity"
                  >
                    Save Record
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex overflow-hidden">
        {/* Main List */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="max-w-5xl mx-auto">
            <div className="flex justify-between items-end mb-8">
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">Records Found: {filteredRecords.length}</p>
                <h3 className="text-3xl font-black tracking-tighter">ARCHIVE LIST</h3>
              </div>
              <div className="flex gap-2">
                <button className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:text-black transition-colors">
                  <Filter size={18} />
                </button>
                <button className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:text-black transition-colors">
                  <MoreHorizontal size={18} />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-40 gap-4">
                <div className="w-8 h-8 border-4 border-gray-100 border-t-[#0a1a2f] rounded-full animate-spin"></div>
                <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Loading Records...</p>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="text-center py-40">
                <AlertTriangle size={48} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 font-medium">該当する記録が見つかりませんでした。</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredRecords.map((record) => (
                  <motion.div
                    key={record.id}
                    layoutId={record.id}
                    onClick={() => setSelectedRecord(record)}
                    className={cn(
                      "bg-white border border-gray-100 p-6 rounded-2xl cursor-pointer hover:shadow-xl hover:shadow-gray-200/50 transition-all group relative overflow-hidden",
                      selectedRecord?.id === record.id && "ring-2 ring-[#0a1a2f] border-transparent"
                    )}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <StatusBadge status={record.status} />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{record.date}</span>
                      </div>
                      <SeverityIndicator level={record.severity} />
                    </div>

                    <h4 className="text-lg font-bold tracking-tight mb-2 group-hover:text-[#3d0a0a] transition-colors">{record.title}</h4>
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4">{record.description}</p>

                    <div className="flex flex-wrap gap-2">
                      {record.tags.map(tag => (
                        <span key={tag} className="text-[9px] font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded uppercase tracking-wider">#{tag}</span>
                      ))}
                    </div>

                    <div className="absolute right-6 bottom-6 opacity-0 group-hover:opacity-100 transition-opacity">
                      <ChevronRight size={20} className="text-gray-300" />
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Detail Panel */}
        <AnimatePresence>
          {selectedRecord && (
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-[500px] bg-white border-l border-gray-100 shadow-2xl z-40 flex flex-col"
            >
              <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                <StatusBadge status={selectedRecord.status} />
                <button 
                  onClick={() => setSelectedRecord(null)}
                  className="p-2 hover:bg-gray-50 rounded-full transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10">
                <div className="mb-10">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em] mb-4">Record ID: {selectedRecord.id}</p>
                  <h3 className="text-3xl font-black tracking-tighter leading-tight mb-6">{selectedRecord.title}</h3>
                  
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Category</p>
                      <p className="text-xs font-bold">{selectedRecord.category}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl">
                      <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">Location</p>
                      <p className="text-xs font-bold">{selectedRecord.location || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <section>
                      <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Description / 概要</h5>
                      <p className="text-sm text-gray-600 leading-relaxed">{selectedRecord.description}</p>
                    </section>

                    <section>
                      <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Severity / 重要度</h5>
                      <div className="flex items-center gap-4">
                        <SeverityIndicator level={selectedRecord.severity} />
                        <span className="text-xs font-bold text-[#3d0a0a]">Level {selectedRecord.severity}</span>
                      </div>
                    </section>

                    <section>
                      <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Evidence / 証拠資料 ({selectedRecord.evidenceCount})</h5>
                      <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center gap-3">
                        <Archive size={24} className="text-gray-300" />
                        <p className="text-[10px] font-bold text-gray-400 uppercase">Secure Archive Linked</p>
                        <button className="text-[10px] font-bold text-blue-500 hover:underline flex items-center gap-1">
                          VIEW REPOSITORY <ExternalLink size={10} />
                        </button>
                      </div>
                    </section>
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-gray-50 bg-gray-50/50">
                <button className="w-full bg-[#3d0a0a] text-white py-4 rounded-xl text-xs font-bold tracking-widest uppercase hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                  <AlertTriangle size={16} />
                  Request Legal Analysis
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
