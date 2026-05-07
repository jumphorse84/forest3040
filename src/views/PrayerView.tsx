import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Plus, X, Heart, CheckCircle2, Lock, Globe, Users,
  ChevronDown, Trash2, Edit2, Sparkles, HandMetal
} from 'lucide-react';
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  onSnapshot, orderBy, query, arrayUnion, arrayRemove, Timestamp
} from 'firebase/firestore';
import { db as firestoreDb } from '../firebase';

const CATEGORIES = ['전체', '개인기도', '가족', '건강', '진로/직장', '공동체', '기타'];
const CATEGORY_COLORS: Record<string, string> = {
  '개인기도': 'bg-violet-100 text-violet-700',
  '가족':    'bg-pink-100 text-pink-700',
  '건강':    'bg-red-100 text-red-700',
  '진로/직장':'bg-blue-100 text-blue-700',
  '공동체':  'bg-emerald-100 text-emerald-700',
  '기타':    'bg-gray-100 text-gray-600',
};

const VISIBILITY_OPTIONS = [
  { value: 'public', label: '전체 공개', icon: <Globe size={14} />, desc: '모든 멤버가 볼 수 있어요' },
  { value: 'forest', label: '우리 숲만', icon: <Users size={14} />, desc: '같은 숲 멤버만 볼 수 있어요' },
];

interface Prayer {
  id?: string;
  title: string;
  content: string;
  category: string;
  visibility: string;
  forest_id: string;
  author_uid: string;
  author_name: string;
  author_image?: string;
  is_answered: boolean;
  prayed_by: string[];
  created_at: any;
}

const empty = (user: any): Prayer => ({
  title: '', content: '', category: '개인기도', visibility: 'public',
  forest_id: user?.forest_id || user?.forest || '',
  author_uid: user?.uid || '', author_name: user?.name || '',
  author_image: user?.photoURL || '',
  is_answered: false, prayed_by: [], created_at: null,
});

const timeAgo = (ts: any): string => {
  if (!ts) return '';
  const d = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return '방금 전';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  return `${Math.floor(diff / 86400)}일 전`;
};

interface Props { user: any; onBack: () => void; onShowToast: (m: string) => void; }

export default function PrayerView({ user, onBack, onShowToast }: Props) {
  const [prayers, setPrayers] = useState<Prayer[]>([]);
  const [selectedCat, setSelectedCat] = useState('전체');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Prayer>(empty(user));
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showVisibilityPicker, setShowVisibilityPicker] = useState(false);

  const myForestId = user?.forest_id || user?.forest || '';

  useEffect(() => {
    const q = query(collection(firestoreDb, 'prayer_requests'), orderBy('created_at', 'desc'));
    const unsub = onSnapshot(q, snap => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Prayer));
      // filter: public → all see it; forest → only same forest
      const visible = all.filter(p =>
        p.visibility === 'public' || p.forest_id === myForestId || p.author_uid === user?.uid
      );
      setPrayers(visible);
    });
    return () => unsub();
  }, [myForestId, user?.uid]);

  const filtered = selectedCat === '전체' ? prayers : prayers.filter(p => p.category === selectedCat);

  const openAdd = () => { setForm(empty(user)); setEditId(null); setShowForm(true); };
  const openEdit = (p: Prayer) => { setForm({ ...p }); setEditId(p.id!); setShowForm(true); };

  const handleSave = async () => {
    if (!form.title.trim()) { onShowToast('제목을 입력해주세요.'); return; }
    setSaving(true);
    try {
      if (editId) {
        await updateDoc(doc(firestoreDb, 'prayer_requests', editId), {
          title: form.title, content: form.content,
          category: form.category, visibility: form.visibility,
        });
        onShowToast('기도제목이 수정되었습니다.');
      } else {
        await addDoc(collection(firestoreDb, 'prayer_requests'), {
          ...form, created_at: Timestamp.now(),
        });
        onShowToast('기도제목이 등록되었습니다. 🙏');
      }
      setShowForm(false);
    } catch { onShowToast('저장에 실패했습니다.'); }
    finally { setSaving(false); }
  };

  const togglePrayed = async (p: Prayer) => {
    if (!user?.uid) return;
    const ref = doc(firestoreDb, 'prayer_requests', p.id!);
    const hasPrayed = p.prayed_by?.includes(user.uid);
    try {
      await updateDoc(ref, {
        prayed_by: hasPrayed ? arrayRemove(user.uid) : arrayUnion(user.uid),
      });
    } catch { onShowToast('오류가 발생했습니다.'); }
  };

  const toggleAnswered = async (p: Prayer) => {
    if (p.author_uid !== user?.uid && user?.role !== 'admin') return;
    try {
      await updateDoc(doc(firestoreDb, 'prayer_requests', p.id!), { is_answered: !p.is_answered });
      onShowToast(p.is_answered ? '기도제목으로 변경되었습니다.' : '🎉 응답 감사드립니다!');
    } catch { onShowToast('오류가 발생했습니다.'); }
  };

  const handleDelete = async (p: Prayer) => {
    if (!window.confirm('이 기도제목을 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(firestoreDb, 'prayer_requests', p.id!));
      onShowToast('삭제되었습니다.');
    } catch { onShowToast('삭제에 실패했습니다.'); }
  };

  const answeredCount = prayers.filter(p => p.is_answered).length;

  return (
    <div className="min-h-screen bg-[#f7f6f3] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-gray-100 px-4 py-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 active:scale-95 transition-all">
            <ArrowLeft size={22} className="text-gray-700" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xl">🙏</span>
              <h1 className="font-headline font-bold text-lg text-gray-900">기도제목 나눔</h1>
            </div>
            <p className="text-xs text-gray-400 ml-8">함께 기도해요 · 응답 {answeredCount}건</p>
          </div>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setSelectedCat(cat)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 border ${
              selectedCat === cat
                ? 'bg-[#0F6045] text-white border-[#0F6045] shadow-md shadow-emerald-900/10'
                : 'bg-white text-gray-600 border-gray-200'
            }`}>{cat}</button>
        ))}
      </div>

      {/* List */}
      <div className="flex-1 px-4 py-2 space-y-3 pb-28">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-5xl mb-4">🙏</div>
            <p className="font-bold text-gray-600">등록된 기도제목이 없습니다</p>
            <p className="text-xs text-gray-400 mt-1">+ 버튼으로 기도제목을 나눠보세요</p>
          </div>
        ) : filtered.map(p => {
          const hasPrayed = p.prayed_by?.includes(user?.uid);
          const isExpanded = expandedId === p.id;
          const isOwner = p.author_uid === user?.uid;
          const isAdmin = user?.role === 'admin';

          return (
            <div key={p.id}
              className={`bg-white rounded-3xl shadow-sm border overflow-hidden transition-all ${
                p.is_answered ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-100'
              }`}>
              <div className="p-4">
                {/* Top row */}
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
                    {p.author_image
                      ? <img src={p.author_image} alt="" className="w-full h-full object-cover" />
                      : p.author_name?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-gray-700">{p.author_name}</span>
                      <span className="text-[10px] text-gray-400">{timeAgo(p.created_at)}</span>
                      {p.visibility === 'forest' && (
                        <span className="flex items-center gap-0.5 text-[10px] text-blue-500 font-bold">
                          <Lock size={10} /> 우리숲
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[p.category] || 'bg-gray-100 text-gray-600'}`}>
                        {p.category}
                      </span>
                      {p.is_answered && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 flex items-center gap-0.5">
                          <Sparkles size={9} /> 응답됨
                        </span>
                      )}
                    </div>
                  </div>
                  {(isOwner || isAdmin) && (
                    <div className="flex gap-1">
                      {isOwner && <button onClick={() => openEdit(p)} className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400"><Edit2 size={14} /></button>}
                      <button onClick={() => handleDelete(p)} className="p-1.5 rounded-full hover:bg-red-50 text-gray-400 hover:text-red-400"><Trash2 size={14} /></button>
                    </div>
                  )}
                </div>

                {/* Title */}
                <h3 className="font-bold text-gray-900 mb-1 leading-snug">{p.title}</h3>

                {/* Content (expandable) */}
                {p.content ? (
                  <div>
                    <p className={`text-sm text-gray-600 leading-relaxed ${!isExpanded ? 'line-clamp-2' : ''}`}>
                      {p.content}
                    </p>
                    {p.content.length > 80 && (
                      <button onClick={() => setExpandedId(isExpanded ? null : p.id!)}
                        className="text-xs text-gray-400 font-bold mt-1 flex items-center gap-0.5">
                        {isExpanded ? '접기' : '더보기'}
                        <ChevronDown size={12} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    )}
                  </div>
                ) : null}

                {/* Actions */}
                <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                  {/* 기도했어요 */}
                  <button onClick={() => togglePrayed(p)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ${
                      hasPrayed
                        ? 'bg-violet-100 text-violet-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-violet-50 hover:text-violet-600'
                    }`}>
                    🙏 기도했어요
                    {(p.prayed_by?.length || 0) > 0 && (
                      <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${hasPrayed ? 'bg-violet-200 text-violet-800' : 'bg-gray-200 text-gray-600'}`}>
                        {p.prayed_by?.length}
                      </span>
                    )}
                  </button>

                  {/* 응답됨 (본인 or admin) */}
                  {(isOwner || isAdmin) && (
                    <button onClick={() => toggleAnswered(p)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all active:scale-95 ml-auto ${
                        p.is_answered
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-gray-100 text-gray-500 hover:bg-emerald-50 hover:text-emerald-600'
                      }`}>
                      <CheckCircle2 size={12} />
                      {p.is_answered ? '응답됨' : '응답 표시'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FAB */}
      <button onClick={openAdd}
        className="fixed bottom-24 right-4 w-14 h-14 bg-[#0F6045] text-white rounded-full shadow-xl shadow-emerald-900/25 flex items-center justify-center active:scale-95 transition-all hover:bg-[#1a7858] z-40">
        <Plus size={24} />
      </button>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-6 pt-5 pb-4 border-b border-gray-100 flex items-center justify-between rounded-t-[2.5rem]">
              <h2 className="font-headline font-bold text-lg">
                {editId ? '기도제목 수정' : '기도제목 나누기 🙏'}
              </h2>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-full bg-gray-100"><X size={18} /></button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">카테고리</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.slice(1).map(cat => (
                    <button key={cat} type="button" onClick={() => setForm(p => ({ ...p, category: cat }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all active:scale-95 ${
                        form.category === cat ? 'bg-[#0F6045] text-white border-[#0F6045]' : 'bg-white text-gray-600 border-gray-200'
                      }`}>{cat}</button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">제목 *</label>
                <input type="text" value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="기도제목을 한 줄로 요약해주세요"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6045]/30 focus:border-[#0F6045]" />
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">상세 내용 (선택)</label>
                <textarea value={form.content}
                  onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                  placeholder="함께 나누고 싶은 내용을 자유롭게 써주세요..."
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6045]/30 focus:border-[#0F6045] resize-none" />
              </div>

              {/* Visibility */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">공개 범위</label>
                <div className="space-y-2">
                  {VISIBILITY_OPTIONS.map(opt => (
                    <button key={opt.value} type="button" onClick={() => setForm(p => ({ ...p, visibility: opt.value }))}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl border transition-all ${
                        form.visibility === opt.value
                          ? 'bg-[#0F6045]/5 border-[#0F6045] text-[#0F6045]'
                          : 'bg-white border-gray-200 text-gray-600'
                      }`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${form.visibility === opt.value ? 'bg-[#0F6045] text-white' : 'bg-gray-100'}`}>
                        {opt.icon}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-bold">{opt.label}</p>
                        <p className="text-xs opacity-60">{opt.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleSave} disabled={saving}
                className="w-full py-4 bg-[#0F6045] hover:bg-[#1a7858] text-white font-bold rounded-2xl shadow-lg shadow-emerald-900/15 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {saving
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />저장 중...</>
                  : editId ? '수정 완료' : '기도제목 나누기 🙏'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
