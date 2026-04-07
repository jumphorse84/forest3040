import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, Phone, AlertTriangle, Search, CheckCircle2, Home, Baby, X } from 'lucide-react';
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

const STATUS_OPTIONS = [
  { key: 'pending', label: '대기중', short: '대기', color: 'bg-surface-container-high text-on-surface-variant' },
  { key: 'checked_in', label: '입실', short: '입실', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { key: 'active', label: '활동중', short: '활동', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { key: 'checked_out', label: '귀가', short: '귀가', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' }
];

export default function KidsCareAdminView({ kidsCareId, kidsCares, user, onBack, onShowToast }: any) {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  const careData = kidsCares.find((c: any) => c.id === kidsCareId);

  useEffect(() => {
    if (!kidsCareId) {
      setLoading(false);
      return;
    }
    
    const q = query(
      collection(db, 'kids_applications'),
      where('kids_care_id', '==', kidsCareId)
    );

    const unsub = onSnapshot(q, (snap) => {
      const apps = snap.docs.map(doc => ({ ...doc.data(), id: doc.id })).filter((app: any) => !app.cancelled);
      setApplications(apps);
      setLoading(false);
    }, (err) => {
      console.error(err);
      onShowToast('데이터를 불러오는데 실패했습니다.');
      setLoading(false);
    });

    return () => unsub();
  }, [kidsCareId]);

  // Flatten children for easy rendering
  const allChildren = useMemo(() => {
    const list: any[] = [];
    applications.forEach(app => {
      if (app.children && Array.isArray(app.children)) {
        app.children.forEach((child: any, index: number) => {
          list.push({
            ...child,
            appId: app.id,
            childIndex: index,
            parent_name: app.parent_name,
            emergency_contact: app.emergency_contact,
            pickup_person: app.pickup_person,
            special_notes: app.special_notes,
            allChildrenInApp: app.children // needed for updating
          });
        });
      }
    });
    return list;
  }, [applications]);

  const filteredChildren = useMemo(() => {
    return allChildren.filter(c => {
      const matchSearch = c.name.includes(searchQuery) || (c.parent_name && c.parent_name.includes(searchQuery));
      const matchStatus = filterStatus === 'all' || c.status === filterStatus;
      return matchSearch && matchStatus;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [allChildren, searchQuery, filterStatus]);

  const counts = useMemo(() => {
    const defaultCounts = { total: allChildren.length, pending: 0, checked_in: 0, active: 0, checked_out: 0 };
    allChildren.forEach(c => {
      if (c.status in defaultCounts) {
        (defaultCounts as any)[c.status]++;
      } else {
        defaultCounts.pending++;
      }
    });
    return defaultCounts;
  }, [allChildren]);

  const updateChildStatus = async (appId: string, childIndex: number, allChildrenInApp: any[], newStatus: string) => {
    try {
      const updatedChildren = [...allChildrenInApp];
      updatedChildren[childIndex] = {
        ...updatedChildren[childIndex],
        status: newStatus,
        // Optional timestamp tracking (omitted for now to keep it simple, but we could add check_in_time)
      };
      await updateDoc(doc(db, 'kids_applications', appId), {
        children: updatedChildren
      });
    } catch (e) {
      onShowToast('상태 업데이트 실패');
      console.error(e);
    }
  };

  if (!kidsCareId || !careData) {
    return (
      <div className="fixed inset-0 bg-[#FAF9F6] overflow-y-auto z-40 font-body flex flex-col items-center justify-center p-6 text-center">
        <Baby size={48} className="text-[#ffab91] mb-4" />
        <p className="text-on-surface-variant font-bold">돌봄 정보를 찾을 수 없습니다.</p>
        <button onClick={onBack} className="mt-4 text-[#0F6045] font-bold underline">뒤로가기</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-[#FAF9F6] overflow-y-auto z-40 font-body flex flex-col">
      <nav className="sticky top-0 z-50 bg-[#FAF9F6]/90 backdrop-blur-xl px-4 py-4 max-w-md mx-auto w-full flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="active:scale-95 transition-transform p-1">
            <ChevronLeft className="text-[#0F6045] w-6 h-6" />
          </button>
          <span className="font-headline font-bold text-lg text-[#0F6045]">명단 관리 (교사용)</span>
        </div>
        <div className="text-xs font-bold text-[#8b4932] bg-[#FEE3D5] px-2 py-1 rounded-md">
          {careData.date}
        </div>
      </nav>

      <main className="flex-1 max-w-md mx-auto w-full px-4 pt-4 pb-24 space-y-4">
        {/* Statistics Dashboard */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-[#f5ece6]">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-extrabold text-[#0F6045] font-headline text-sm">출결 현황</h3>
            <span className="text-xs font-bold bg-[#f1f1ee] px-2 py-1 rounded-full text-on-surface-variant">총 {counts.total}명</span>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: '대기', count: counts.pending, color: 'text-amber-600', bg: 'bg-amber-50' },
              { label: '입실', count: counts.checked_in, color: 'text-blue-600', bg: 'bg-blue-50' },
              { label: '활동', count: counts.active, color: 'text-purple-600', bg: 'bg-purple-50' },
              { label: '귀가', count: counts.checked_out, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            ].map(stat => (
              <div key={stat.label} className={`${stat.bg} rounded-xl p-2 flex flex-col items-center justify-center`}>
                <span className={`text-[10px] font-bold opacity-80 ${stat.color}`}>{stat.label}</span>
                <span className={`text-lg font-extrabold font-headline ${stat.color}`}>{stat.count}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Filter and Search */}
        <section className="space-y-2">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-container-high" />
            <input 
              type="text" 
              placeholder="아이 이름 또는 부모 이름 검색..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-[#e0e0e0] rounded-xl pl-9 pr-4 py-2.5 text-sm outline-none focus:border-[#0F6045]"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X size={14} className="text-on-surface-variant" />
              </button>
            )}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 hide-scrollbar">
            <button 
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${filterStatus === 'all' ? 'bg-[#0F6045] text-white' : 'bg-white text-on-surface border border-surface-container-low'}`}
            >
              전체 보기
            </button>
            {STATUS_OPTIONS.map(opt => (
              <button 
                key={opt.key}
                onClick={() => setFilterStatus(opt.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors border ${filterStatus === opt.key ? opt.color : 'bg-white text-on-surface border-surface-container-low'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </section>

        {/* Children List */}
        <section className="space-y-3">
          {loading ? (
             <div className="text-center py-10 text-on-surface-variant text-sm flex flex-col items-center">
               <div className="w-8 h-8 border-4 border-[#0F6045] border-t-transparent rounded-full animate-spin mb-3" />
               데이터를 불러오는 중입니다...
             </div>
          ) : filteredChildren.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-[#e0e0e0]">
              <Baby size={32} className="mx-auto text-surface-container-high mb-2" />
              <p className="text-on-surface-variant text-sm font-medium">표시할 아이가 없습니다.</p>
            </div>
          ) : (
            filteredChildren.map((child: any) => (
              <div key={`${child.appId}-${child.childIndex}`} className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${child.status === 'checked_out' ? 'border-emerald-400 opacity-70' : child.allergies || child.condition === 'caution' ? 'border-red-400' : 'border-[#0F6045]'}`}>
                
                {/* Header: Name and Indicators */}
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{child.gender === 'female' ? '👧' : '👦'}</span>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-[16px] text-on-surface font-headline">{child.name}</span>
                        <span className="text-[11px] font-medium text-on-surface-variant bg-surface-container-lowest px-1.5 py-0.5 rounded">{child.age}세</span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant font-medium mt-0.5">부모: {child.parent_name}</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {child.condition === 'caution' && <span className="bg-red-100 text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center">🤒 주의</span>}
                    {child.condition === 'normal' && <span className="bg-amber-100 text-amber-600 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center">😐 보통</span>}
                    {child.condition === 'good' && <span className="bg-emerald-100 text-emerald-600 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center">😃 좋음</span>}
                  </div>
                </div>

                {/* Important Notes */}
                {(child.allergies || child.special_notes) && (
                  <div className="bg-red-50/50 rounded-xl p-2.5 mb-3 border border-red-100">
                    {child.allergies && (
                      <div className="flex items-start gap-1.5 mb-1.5">
                        <AlertTriangle size={12} className="text-red-500 mt-0.5 shrink-0" />
                        <span className="text-[11px] font-bold text-red-600">알레르기/약: {child.allergies}</span>
                      </div>
                    )}
                    {child.special_notes && (
                      <div className="flex items-start gap-1.5">
                        <div className="w-3 flex justify-center mt-0.5 shrink-0"><span className="text-[9px]">💬</span></div>
                        <span className="text-[11px] text-red-800/80 leading-tight">{child.special_notes}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Contact Actions */}
                <div className="flex justify-between items-center mb-3 bg-[#f8f9fa] rounded-lg p-2 px-3">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-bold">비상연락처</span>
                    <span className="text-xs font-bold text-on-surface">{child.emergency_contact}</span>
                    {child.pickup_person && <span className="text-[10px] text-primary font-medium mt-0.5">픽업: {child.pickup_person}</span>}
                  </div>
                  <a href={`tel:${child.emergency_contact}`} onClick={(e) => e.stopPropagation()} className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center active:scale-90 transition-transform">
                    <Phone size={14} className="text-green-600" />
                  </a>
                </div>

                {/* Status Controls */}
                <div className="flex items-center gap-1.5 bg-surface-container-lowest p-1.5 rounded-xl border border-surface-container-low">
                  <span className="text-[10px] font-bold text-on-surface-variant pl-1 w-8 shrink-0">상태:</span>
                  <div className="flex-1 flex gap-1">
                    {STATUS_OPTIONS.map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => updateChildStatus(child.appId, child.childIndex, child.allChildrenInApp, opt.key)}
                        className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all ${
                          (child.status || 'pending') === opt.key 
                            ? `${opt.color} shadow-sm ring-1 ring-black/5` 
                            : 'bg-transparent text-on-surface-variant hover:bg-surface-container-low'
                        }`}
                      >
                        {opt.short}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
