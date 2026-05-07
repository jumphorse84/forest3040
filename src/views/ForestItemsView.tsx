import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Plus, X, Camera, Package, Search,
  ChevronRight, Pencil, Trash2, AlertTriangle, CheckCircle2, XCircle,
  MapPin, User, FileText, Hash
} from 'lucide-react';
import {
  collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, orderBy, query
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db as firestoreDb, storage } from '../firebase';

const CATEGORIES = ['전체', '전자기기', '비품', '스포츠', '도서', '소모품', '기타'];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  good:   { label: '양호', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: <CheckCircle2 size={12} /> },
  repair: { label: '수리필요', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <AlertTriangle size={12} /> },
  lost:   { label: '분실', color: 'bg-red-100 text-red-700 border-red-200', icon: <XCircle size={12} /> },
};

const CATEGORY_COLORS: Record<string, string> = {
  '전자기기': 'bg-blue-100 text-blue-700',
  '비품':     'bg-purple-100 text-purple-700',
  '스포츠':   'bg-orange-100 text-orange-700',
  '도서':     'bg-teal-100 text-teal-700',
  '소모품':   'bg-pink-100 text-pink-700',
  '기타':     'bg-gray-100 text-gray-600',
};

interface ForestItem {
  id?: string;
  name: string;
  category: string;
  quantity: number;
  status: string;
  location: string;
  manager: string;
  note: string;
  imageUrl: string;
  created_at: string;
  created_by: string;
  created_by_name: string;
}

const emptyItem = (): ForestItem => ({
  name: '', category: '비품', quantity: 1, status: 'good',
  location: '', manager: '', note: '', imageUrl: '',
  created_at: '', created_by: '', created_by_name: '',
});

interface Props {
  user: any;
  onBack: () => void;
  onShowToast: (msg: string) => void;
}

export default function ForestItemsView({ user, onBack, onShowToast }: Props) {
  const [items, setItems] = useState<ForestItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ForestItem | null>(null);
  const [formData, setFormData] = useState<ForestItem>(emptyItem());
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [detailItem, setDetailItem] = useState<ForestItem | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canWrite = user?.role === 'admin' || user?.role === 'leader' || user?.role === 'pastor';

  useEffect(() => {
    const q = query(collection(firestoreDb, 'forest_items'), orderBy('created_at', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as ForestItem)));
    });
    return () => unsub();
  }, []);

  const filteredItems = items.filter(item => {
    const matchCat = selectedCategory === '전체' || item.category === selectedCategory;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q || item.name.toLowerCase().includes(q) || item.location.toLowerCase().includes(q) || item.manager.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  const openAdd = () => {
    setEditingItem(null);
    setFormData(emptyItem());
    setIsModalOpen(true);
  };

  const openEdit = (item: ForestItem) => {
    setEditingItem(item);
    setFormData({ ...item });
    setDetailItem(null);
    setIsModalOpen(true);
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const storageRef = ref(storage, `forest_items/${Date.now()}_${file.name}`);
      const task = uploadBytesResumable(storageRef, file);
      await new Promise<void>((resolve, reject) => task.on('state_changed', null, reject, resolve));
      const url = await getDownloadURL(task.snapshot.ref);
      setFormData(prev => ({ ...prev, imageUrl: url }));
    } catch {
      onShowToast('사진 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) { onShowToast('물품명을 입력해주세요.'); return; }
    setSaving(true);
    try {
      const data = {
        ...formData,
        quantity: Number(formData.quantity) || 1,
        created_at: editingItem?.created_at || new Date().toISOString(),
        created_by: editingItem?.created_by || user?.uid || '',
        created_by_name: editingItem?.created_by_name || user?.name || '',
        updated_at: new Date().toISOString(),
        updated_by: user?.uid || '',
      };
      if (editingItem?.id) {
        await updateDoc(doc(firestoreDb, 'forest_items', editingItem.id), data);
        onShowToast('물품이 수정되었습니다.');
      } else {
        await addDoc(collection(firestoreDb, 'forest_items'), data);
        onShowToast('물품이 등록되었습니다.');
      }
      setIsModalOpen(false);
    } catch {
      onShowToast('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: ForestItem) => {
    if (!window.confirm(`"${item.name}" 물품을 삭제하시겠습니까?`)) return;
    try {
      await deleteDoc(doc(firestoreDb, 'forest_items', item.id!));
      onShowToast('물품이 삭제되었습니다.');
      setDetailItem(null);
    } catch {
      onShowToast('삭제에 실패했습니다.');
    }
  };

  const statusInfo = (s: string) => STATUS_CONFIG[s] || STATUS_CONFIG.good;

  return (
    <div className="min-h-screen bg-[#f7f6f3] flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 py-4 flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 active:scale-95 transition-all">
          <ArrowLeft size={22} className="text-gray-700" />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <Package size={20} className="text-[#0F6045]" />
          <h1 className="font-headline font-bold text-lg text-gray-900">포레스트 물품대장</h1>
        </div>
        <span className="text-xs text-gray-400 font-medium bg-gray-100 px-2 py-1 rounded-full">{items.length}개</span>
      </div>

      {/* Search */}
      <div className="px-4 pt-4 pb-2">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="물품명, 위치, 담당자 검색..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-3 bg-white rounded-2xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6045]/30 focus:border-[#0F6045]"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-hide">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-all active:scale-95 border ${
              selectedCategory === cat
                ? 'bg-[#0F6045] text-white border-[#0F6045] shadow-md shadow-emerald-900/10'
                : 'bg-white text-gray-600 border-gray-200 hover:border-[#0F6045]/40'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Items List */}
      <div className="flex-1 px-4 py-2 space-y-3 pb-28">
        {filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <Package size={28} className="text-gray-400" />
            </div>
            <p className="font-bold text-gray-600">등록된 물품이 없습니다</p>
            <p className="text-xs text-gray-400 mt-1">
              {canWrite ? '+ 버튼을 눌러 물품을 등록해보세요' : '숲지기가 물품을 등록하면 여기에 표시됩니다'}
            </p>
          </div>
        ) : (
          filteredItems.map(item => {
            const st = statusInfo(item.status);
            return (
              <div
                key={item.id}
                onClick={() => setDetailItem(item)}
                className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex cursor-pointer active:scale-[0.98] transition-transform hover:shadow-md"
              >
                {/* Photo */}
                <div className="w-24 h-24 flex-shrink-0 bg-gray-100 relative overflow-hidden">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package size={28} className="text-gray-300" />
                    </div>
                  )}
                </div>
                {/* Info */}
                <div className="flex-1 p-3 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="font-bold text-gray-900 text-sm leading-tight truncate">{item.name}</h3>
                    <span className={`flex-shrink-0 flex items-center gap-0.5 text-[10px] font-bold px-2 py-0.5 rounded-full border ${st.color}`}>
                      {st.icon}<span className="ml-0.5">{st.label}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[item.category] || 'bg-gray-100 text-gray-600'}`}>
                      {item.category}
                    </span>
                    <span className="text-[11px] text-gray-500 font-medium">{item.quantity}개</span>
                  </div>
                  {item.location && (
                    <div className="flex items-center gap-1 mt-1.5">
                      <MapPin size={10} className="text-gray-400 flex-shrink-0" />
                      <span className="text-[11px] text-gray-500 truncate">{item.location}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center pr-3">
                  <ChevronRight size={16} className="text-gray-300" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FAB */}
      {canWrite && (
        <button
          onClick={openAdd}
          className="fixed bottom-24 right-4 w-14 h-14 bg-[#0F6045] text-white rounded-full shadow-xl shadow-emerald-900/25 flex items-center justify-center active:scale-95 transition-all hover:bg-[#1a7858] z-40"
        >
          <Plus size={24} />
        </button>
      )}

      {/* Detail Modal */}
      {detailItem && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm" onClick={() => setDetailItem(null)}>
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {detailItem.imageUrl && (
              <div className="w-full h-52 bg-gray-100 overflow-hidden rounded-t-[2.5rem]">
                <img src={detailItem.imageUrl} alt={detailItem.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[detailItem.category] || 'bg-gray-100 text-gray-600'}`}>{detailItem.category}</span>
                    <span className={`flex items-center gap-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusInfo(detailItem.status).color}`}>
                      {statusInfo(detailItem.status).icon}<span className="ml-0.5">{statusInfo(detailItem.status).label}</span>
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-gray-900 font-headline">{detailItem.name}</h2>
                </div>
                <button onClick={() => setDetailItem(null)} className="p-2 rounded-full bg-gray-100">
                  <X size={18} className="text-gray-600" />
                </button>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                  <Hash size={16} className="text-gray-400" />
                  <span className="text-sm text-gray-600">수량</span>
                  <span className="ml-auto font-bold text-gray-900">{detailItem.quantity}개</span>
                </div>
                {detailItem.location && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                    <MapPin size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-600">보관위치</span>
                    <span className="ml-auto font-bold text-gray-900 text-right max-w-[55%]">{detailItem.location}</span>
                  </div>
                )}
                {detailItem.manager && (
                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl">
                    <User size={16} className="text-gray-400" />
                    <span className="text-sm text-gray-600">담당자</span>
                    <span className="ml-auto font-bold text-gray-900">{detailItem.manager}</span>
                  </div>
                )}
                {detailItem.note && (
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-2xl">
                    <FileText size={16} className="text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600 mb-1">비고</p>
                      <p className="text-sm text-gray-900 leading-relaxed">{detailItem.note}</p>
                    </div>
                  </div>
                )}
              </div>

              {canWrite && (
                <div className="flex gap-3">
                  <button
                    onClick={() => handleDelete(detailItem)}
                    className="flex-1 py-3 bg-red-50 text-red-500 font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all border border-red-100"
                  >
                    <Trash2 size={16} /> 삭제
                  </button>
                  <button
                    onClick={() => openEdit(detailItem)}
                    className="flex-1 py-3 bg-[#0F6045] text-white font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md shadow-emerald-900/15"
                  >
                    <Pencil size={16} /> 수정
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] shadow-2xl animate-in slide-in-from-bottom duration-300 max-h-[92vh] overflow-y-auto">
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between rounded-t-[2.5rem]">
              <h2 className="font-headline font-bold text-lg text-gray-900">
                {editingItem ? '물품 수정' : '물품 등록'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full bg-gray-100 active:scale-95">
                <X size={18} className="text-gray-600" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Photo Upload */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">사진</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-40 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-[#0F6045]/40 hover:bg-emerald-50/30 transition-all overflow-hidden relative active:scale-[0.98]"
                >
                  {formData.imageUrl ? (
                    <img src={formData.imageUrl} alt="preview" className="w-full h-full object-cover rounded-2xl" />
                  ) : uploading ? (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-6 h-6 border-2 border-[#0F6045] border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs text-gray-500">업로드 중...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-10 h-10 bg-[#0F6045]/10 rounded-full flex items-center justify-center">
                        <Camera size={20} className="text-[#0F6045]" />
                      </div>
                      <span className="text-xs font-semibold text-gray-500">사진 촬영 / 갤러리에서 선택</span>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">물품명 *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  placeholder="예: 블루투스 스피커"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6045]/30 focus:border-[#0F6045]"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">카테고리</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.slice(1).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, category: cat }))}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all active:scale-95 ${
                        formData.category === cat
                          ? 'bg-[#0F6045] text-white border-[#0F6045]'
                          : 'bg-white text-gray-600 border-gray-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quantity & Status in row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">수량</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.quantity}
                    onChange={e => setFormData(p => ({ ...p, quantity: Number(e.target.value) }))}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6045]/30 focus:border-[#0F6045]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">상태</label>
                  <select
                    value={formData.status}
                    onChange={e => setFormData(p => ({ ...p, status: e.target.value }))}
                    className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6045]/30 focus:border-[#0F6045]"
                  >
                    <option value="good">✅ 양호</option>
                    <option value="repair">⚠️ 수리필요</option>
                    <option value="lost">❌ 분실</option>
                  </select>
                </div>
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">보관 위치</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={e => setFormData(p => ({ ...p, location: e.target.value }))}
                  placeholder="예: 교회 창고 2층"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6045]/30 focus:border-[#0F6045]"
                />
              </div>

              {/* Manager */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">담당자</label>
                <input
                  type="text"
                  value={formData.manager}
                  onChange={e => setFormData(p => ({ ...p, manager: e.target.value }))}
                  placeholder="예: 홍길동 집사"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6045]/30 focus:border-[#0F6045]"
                />
              </div>

              {/* Note */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">비고</label>
                <textarea
                  value={formData.note}
                  onChange={e => setFormData(p => ({ ...p, note: e.target.value }))}
                  placeholder="특이사항, 구매일, 관리방법 등..."
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6045]/30 focus:border-[#0F6045] resize-none"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving || uploading}
                className="w-full py-4 bg-[#0F6045] hover:bg-[#1a7858] text-white font-bold rounded-2xl shadow-lg shadow-emerald-900/15 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> 저장 중...</>
                ) : (
                  editingItem ? '수정 완료' : '등록 완료'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
