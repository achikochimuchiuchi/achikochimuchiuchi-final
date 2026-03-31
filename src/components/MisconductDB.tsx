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
  Gavel, 
  ShieldAlert, 
  FileWarning,
  ArrowLeft,
  MoreHorizontal,
  Users,
  Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MisconductRecord, MisconductType, Severity } from '../types';
import { auth, db, handleFirestoreError, OperationType, signInWithGoogle } from '../firebase';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TypeBadge = ({ type }: { type: MisconductType }) => {
  const config = {
    corruption: { label: '汚職・収賄', color: 'bg-red-100 text-red-700' },
    fraud: { label: '不正・偽装', color: 'bg-orange-100 text-orange-700' },
    'cover-up': { label: '隠蔽', color: 'bg-purple-100 text-purple-700' },
    harassment: { label: 'ハラスメント', color: 'bg-pink-100 text-pink-700' },
    other: { label: 'その他', color: 'bg-gray-100 text-gray-700' },
  }[type];

  return (
    <span className={cn("px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider", config.color)}>
      {config.label}
    </span>
  );
};

const StatusBadge = ({ status }: { status: MisconductRecord['status'] }) => {
  const config = {
    'under-investigation': { icon: Search, color: 'text-blue-500 bg-blue-50', label: '調査中' },
    'disciplinary-action': { icon: FileWarning, color: 'text-orange-500 bg-orange-50', label: '処分手続中' },
    'legal-action': { icon: Gavel, color: 'text-red-600 bg-red-50', label: '法的措置' },
    'closed': { icon: ShieldAlert, color: 'text-gray-500 bg-gray-50', label: '終結' },
  }[status];

  const Icon = config.icon;
  return (
    <span className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider", config.color)}>
      <Icon size={12} />
      {config.label}
    </span>
  );
};

export const MisconductDB = ({ onBack, isEmbedded }: { onBack: () => void, isEmbedded?: boolean }) => {
  const [records, setRecords] = useState<MisconductRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecord, setSelectedRecord] = useState<MisconductRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newRecord, setNewRecord] = useState({
    title: '',
    organization: '',
    description: '',
    type: 'corruption' as MisconductType,
    severity: 3 as Severity,
    involvedParties: [] as string[],
    date: new Date().toISOString().split('T')[0]
  });

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'misconduct_records'), {
        ...newRecord,
        status: 'under-investigation',
        authorUid: auth.currentUser?.uid,
        createdAt: serverTimestamp(),
      });
      setIsAdding(false);
      setNewRecord({
        title: '',
        organization: '',
        description: '',
        type: 'corruption',
        severity: 3,
        involvedParties: [],
        date: new Date().toISOString().split('T')[0]
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'misconduct_records');
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'misconduct_records'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedRecords = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MisconductRecord[];
      setRecords(fetchedRecords);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'misconduct_records');
    });

    return () => unsubscribe();
  }, []);

  const filteredRecords = useMemo(() => {
    return records.filter(r => 
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase())
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
            <h2 className="text-xl font-black tracking-tighter">不祥事DB</h2>
            <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Misconduct Records Database</p>
          </div>
        </div>

        <div className="flex-1 max-w-xl mx-12 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="不祥事案を検索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border-none rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-red-900 transition-all outline-none"
          />
        </div>

        <button 
          onClick={() => auth.currentUser ? setIsAdding(true) : signInWithGoogle()}
          className="bg-red-950 text-white px-6 py-3 rounded-xl flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-red-900/10"
        >
          <Plus size={18} />
          <span className="text-xs font-bold tracking-wider uppercase">Report Case</span>
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
                <h3 className="text-xl font-black tracking-tighter">REPORT MISCONDUCT CASE</h3>
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
                      className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-900 outline-none"
                      placeholder="例: 〇〇省における不正経理の疑い"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Organization / 所属・組織</label>
                    <input 
                      required
                      value={newRecord.organization}
                      onChange={e => setNewRecord({...newRecord, organization: e.target.value})}
                      className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-900 outline-none"
                      placeholder="例: 厚生労働省 〇〇局"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Type / 分類</label>
                      <select 
                        value={newRecord.type}
                        onChange={e => setNewRecord({...newRecord, type: e.target.value as MisconductType})}
                        className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-900 outline-none appearance-none"
                      >
                        <option value="corruption">汚職・収賄</option>
                        <option value="fraud">不正・偽装</option>
                        <option value="cover-up">隠蔽</option>
                        <option value="harassment">ハラスメント</option>
                        <option value="other">その他</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Date / 発生時期</label>
                      <input 
                        type="date"
                        required
                        value={newRecord.date}
                        onChange={e => setNewRecord({...newRecord, date: e.target.value})}
                        className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-900 outline-none"
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
                      className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-900 outline-none resize-none"
                      placeholder="事案の具体的な内容、証拠の有無などを記述してください..."
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Involved Parties / 関与者 (カンマ区切り)</label>
                    <input 
                      value={newRecord.involvedParties.join(', ')}
                      onChange={e => setNewRecord({...newRecord, involvedParties: e.target.value.split(',').map(t => t.trim())})}
                      className="w-full bg-gray-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-red-900 outline-none"
                      placeholder="氏名、役職など"
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
                    className="flex-1 bg-red-950 text-white py-4 rounded-xl text-xs font-bold tracking-widest uppercase hover:opacity-90 transition-opacity"
                  >
                    Submit Report
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
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-2">Total Incidents: {filteredRecords.length}</p>
                <h3 className="text-3xl font-black tracking-tighter">MISCONDUCT ARCHIVE</h3>
              </div>
              <div className="flex gap-2">
                <button className="p-2 border border-gray-200 rounded-lg text-gray-400 hover:text-black transition-colors">
                  <Filter size={18} />
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
                      "bg-white border border-gray-100 p-6 rounded-2xl cursor-pointer hover:shadow-xl hover:shadow-red-100/30 transition-all group relative overflow-hidden",
                      selectedRecord?.id === record.id && "ring-2 ring-red-950 border-transparent"
                    )}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <StatusBadge status={record.status} />
                        <TypeBadge type={record.type} />
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{record.date}</span>
                    </div>

                    <h4 className="text-lg font-bold tracking-tight mb-2 group-hover:text-red-900 transition-colors">{record.title}</h4>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 mb-4">
                      <Building2 size={14} />
                      {record.organization}
                    </div>
                    
                    <p className="text-sm text-gray-500 leading-relaxed line-clamp-2 mb-4">{record.description}</p>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase">
                        <Users size={14} />
                        {record.involvedParties.length} Parties Involved
                      </div>
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
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10">
                <div className="mb-10">
                  <div className="flex items-center gap-2 mb-4">
                    <TypeBadge type={selectedRecord.type} />
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.3em]">ID: {selectedRecord.id}</span>
                  </div>
                  <h3 className="text-3xl font-black tracking-tighter leading-tight mb-6">{selectedRecord.title}</h3>
                  
                  <div className="space-y-8">
                    <section>
                      <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Organization / 所属・組織</h5>
                      <div className="bg-gray-50 p-4 rounded-xl flex items-center gap-3">
                        <Building2 size={18} className="text-gray-400" />
                        <span className="text-sm font-bold">{selectedRecord.organization}</span>
                      </div>
                    </section>

                    <section>
                      <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Description / 事案概要</h5>
                      <p className="text-sm text-gray-600 leading-relaxed">{selectedRecord.description}</p>
                    </section>

                    <section>
                      <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Involved Parties / 関与者</h5>
                      <div className="space-y-2">
                        {selectedRecord.involvedParties.map(party => (
                          <div key={party} className="flex items-center gap-3 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
                            <Users size={14} className="text-gray-400" />
                            {party}
                          </div>
                        ))}
                      </div>
                    </section>

                    {selectedRecord.penalty && (
                      <section>
                        <h5 className="text-[10px] font-bold text-red-900 uppercase tracking-widest mb-3">Penalty / 処分・措置</h5>
                        <div className="bg-red-50 border border-red-100 p-4 rounded-xl">
                          <p className="text-sm font-bold text-red-900">{selectedRecord.penalty}</p>
                        </div>
                      </section>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-gray-50 bg-gray-50/50">
                <button className="w-full bg-red-950 text-white py-4 rounded-xl text-xs font-bold tracking-widest uppercase hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                  <AlertTriangle size={16} />
                  Submit Evidence Anonymously
                </button>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
