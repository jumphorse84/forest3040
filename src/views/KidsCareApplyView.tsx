import React, { useState } from 'react';
import { ChevronLeft, Plus, X, Baby, CheckCircle2, Heart, AlertTriangle } from 'lucide-react';
import { doc, updateDoc, addDoc, collection, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

interface SavedChild { name: string; age: number; gender: string; }
interface ChildConfig { condition: 'good' | 'normal' | 'caution'; hasAllergy: boolean; allergyText: string; }

export default function KidsCareApplyView({ kidsCareId, kidsCares, user, onBack, onShowToast }: any) {
  const careData = kidsCares.find((c: any) => c.id === kidsCareId);

  const [savedChildren, setSavedChildren] = useState<SavedChild[]>(user?.children || []);
  const [selectedNames, setSelectedNames] = useState<string[]>([]);
  const [childConfigs, setChildConfigs] = useState<{ [key: string]: ChildConfig }>({});

  const [addingNew, setAddingNew] = useState(false);
  const [newChild, setNewChild] = useState({ name: '', age: '', gender: 'female' });

  const [emergencyContact, setEmergencyContact] = useState(user?.phone || '');
  const [pickupPerson, setPickupPerson] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');

  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const conditionOptions = [
    { key: 'good', icon: '😃', label: '좋음', activeBg: 'bg-emerald-500', activeText: 'text-white', passiveBg: 'bg-emerald-50' },
    { key: 'normal', icon: '😐', label: '보통', activeBg: 'bg-amber-400', activeText: 'text-white', passiveBg: 'bg-amber-50' },
    { key: 'caution', icon: '🤒', label: '주의', activeBg: 'bg-red-400', activeText: 'text-white', passiveBg: 'bg-red-50' },
  ];

  const toggleChild = (name: string) => {
    if (selectedNames.includes(name)) {
      setSelectedNames(prev => prev.filter(n => n !== name));
    } else {
      setSelectedNames(prev => [...prev, name]);
      if (!childConfigs[name]) {
        setChildConfigs(prev => ({ ...prev, [name]: { condition: 'good', hasAllergy: false, allergyText: '' } }));
      }
    }
  };

  const updateConfig = (name: string, updates: Partial<ChildConfig>) => {
    setChildConfigs(prev => ({ ...prev, [name]: { ...prev[name], ...updates } }));
  };

  const handleAddNewChild = async () => {
    if (!newChild.name.trim() || !newChild.age) { onShowToast('이름과 나이를 입력해주세요.'); return; }
    const child: SavedChild = { name: newChild.name.trim(), age: parseInt(newChild.age), gender: newChild.gender };
    const updated = [...savedChildren, child];
    try {
      await updateDoc(doc(db, 'users', user.uid), { children: updated });
      setSavedChildren(updated);
      toggleChild(child.name);
      setNewChild({ name: '', age: '', gender: 'female' });
      setAddingNew(false);
    } catch (e) { onShowToast('자녀 정보 저장 중 오류가 발생했습니다.'); }
  };

  const handleSubmit = async () => {
    if (selectedNames.length === 0) { onShowToast('신청할 자녀를 선택해주세요.'); return; }
    if (!emergencyContact.trim()) { onShowToast('비상 연락처를 입력해주세요.'); return; }
    try {
      setIsSubmitting(true);
      const children = selectedNames.map(name => {
        const saved = savedChildren.find(c => c.name === name);
        const config = childConfigs[name] || { condition: 'good', hasAllergy: false, allergyText: '' };
        return { name, age: saved?.age || 0, gender: saved?.gender || '', condition: config.condition, allergies: config.hasAllergy ? config.allergyText : '', status: 'pending', check_in_time: null, check_out_time: null };
      });
      await addDoc(collection(db, 'kids_applications'), {
        kids_care_id: kidsCareId, worship_date: careData?.date,
        parent_id: user.uid, parent_name: user.name,
        children, emergency_contact: emergencyContact,
        pickup_person: pickupPerson, special_notes: specialNotes,
        createdAt: Timestamp.now(),
      });
      setShowSuccess(true);
      setTimeout(() => onBack(), 3500);
    } catch (e) { console.error(e); onShowToast('신청 중 오류가 발생했습니다.'); setIsSubmitting(false); }
  };

  if (showSuccess) {
    return (
      <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-white gap-4">
        <style>{`
          @keyframes confetti-fall { 0%{transform:translateY(-100px) rotate(0deg);opacity:1} 100%{transform:translateY(110vh) rotate(720deg);opacity:0} }
          .confetti-piece { position:fixed; width:10px; height:10px; animation:confetti-fall 3s ease-in forwards; }
        `}</style>
        {['🎈','🌟','🎊','🎉','💛','💚','🩷'].map((e, i) => (
          <div key={i} className="confetti-piece text-2xl" style={{ left: `${10 + i * 13}%`, animationDelay: `${i * 0.15}s`, animationDuration: `${2 + i * 0.3}s` }}>{e}</div>
        ))}
        <div className="text-center animate-in zoom-in duration-500 space-y-3 relative z-10">
          <div className="text-8xl">🎉</div>
          <h2 className="text-3xl font-extrabold text-[#0F6045] font-headline">신청 완료!</h2>
          <p className="text-on-surface-variant font-medium">주일에 뵙겠습니다 😊<br/>안전하게 돌봐드릴게요.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF9F6] min-h-screen pb-36 font-body">
      <nav className="sticky top-0 z-50 bg-[#FAF9F6]/90 backdrop-blur-xl px-6 py-4 max-w-md mx-auto flex items-center gap-3">
        <button onClick={onBack} className="active:scale-95 transition-transform p-1">
          <ChevronLeft className="text-[#0F6045] w-6 h-6" />
        </button>
        <span className="font-headline font-bold text-lg text-[#0F6045]">돌봄 사전 신청</span>
      </nav>

      <main className="max-w-md mx-auto px-5 space-y-5">
        {/* Care Banner */}
        {careData && (
          <section className="bg-gradient-to-r from-[#FEE3D5] to-[#ffd0bb] rounded-3xl p-5 flex items-center gap-4">
            <div className="w-14 h-14 bg-white/50 rounded-2xl flex items-center justify-center shrink-0">
              <Baby size={30} className="text-[#8b4932]" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-[#8b4932]/70 uppercase tracking-widest">{careData.date} · {careData.location}</p>
              <h2 className="text-[18px] font-extrabold text-[#613b1c] font-headline leading-tight">{careData.title || '이번 주 키즈돌봄'}</h2>
            </div>
          </section>
        )}

        {/* Step 1: Child Selection */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-[#f5ece6] space-y-4">
          <h3 className="font-extrabold text-[#0F6045] font-headline text-[16px] flex items-center gap-2">
            <span className="w-7 h-7 bg-[#0F6045] text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
            참여 자녀 선택
          </h3>

          {savedChildren.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {savedChildren.map(child => {
                const sel = selectedNames.includes(child.name);
                return (
                  <button key={child.name} onClick={() => toggleChild(child.name)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full border-2 transition-all active:scale-95 font-body ${sel ? 'bg-[#0F6045] border-[#0F6045] text-white shadow-md shadow-[#0F6045]/20' : 'bg-white border-[#e8d8d0] text-[#613b1c]'}`}
                  >
                    <span className="text-lg">{child.gender === 'female' ? '👧' : '👦'}</span>
                    <span className="font-bold text-sm">{child.name}</span>
                    <span className={`text-xs ${sel ? 'opacity-80' : 'opacity-60'}`}>{child.age}세</span>
                    {sel && <CheckCircle2 size={14} />}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-on-surface-variant text-center py-3 bg-surface-container-lowest rounded-2xl">아래에서 자녀를 추가해주세요.</p>
          )}

          {!addingNew ? (
            <button onClick={() => setAddingNew(true)}
              className="w-full py-3.5 border-2 border-dashed border-[#a5d6a7] rounded-2xl text-sm font-bold text-[#0F6045] flex items-center justify-center gap-2 hover:bg-green-50 transition-colors active:scale-95"
            >
              <Plus size={18} /> 새 자녀 추가
            </button>
          ) : (
            <div className="bg-[#f1fbf4] rounded-2xl p-4 border border-[#a5d6a7] space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-[#0F6045]">새 자녀 정보 입력</h4>
                <button onClick={() => setAddingNew(false)} className="p-1"><X size={16} className="text-on-surface-variant"/></button>
              </div>
              <input type="text" placeholder="이름" value={newChild.name} onChange={e => setNewChild({...newChild, name: e.target.value})}
                className="w-full bg-white border border-[#c8e6c9] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0F6045]" />
              <div className="flex gap-2">
                <input type="number" placeholder="나이" value={newChild.age} onChange={e => setNewChild({...newChild, age: e.target.value})}
                  className="flex-1 bg-white border border-[#c8e6c9] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[#0F6045]" />
                <div className="flex rounded-xl overflow-hidden border border-[#c8e6c9]">
                  {['female','male'].map(g => (
                    <button key={g} onClick={() => setNewChild({...newChild, gender: g})}
                      className={`px-5 py-2.5 text-sm font-bold transition-colors ${newChild.gender === g ? 'bg-[#0F6045] text-white' : 'bg-white text-on-surface-variant'}`}>
                      {g === 'female' ? '👧' : '👦'}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleAddNewChild} className="w-full py-3 bg-[#0F6045] text-white rounded-xl font-bold text-sm active:scale-95 transition-transform">
                추가하기
              </button>
            </div>
          )}
        </section>

        {/* Step 2: Per-child Health Info */}
        {selectedNames.length > 0 && (
          <section className="space-y-3">
            <h3 className="font-extrabold text-[#0F6045] font-headline text-[16px] flex items-center gap-2 px-1">
              <span className="w-7 h-7 bg-[#0F6045] text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
              건강 및 보호 정보
            </h3>
            {selectedNames.map(name => {
              const config = childConfigs[name] || { condition: 'good', hasAllergy: false, allergyText: '' };
              return (
                <div key={name} className="bg-white rounded-3xl p-5 border border-[#f5ece6] shadow-sm space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#FEE3D5] rounded-2xl flex items-center justify-center text-xl">
                      {savedChildren.find(c=>c.name===name)?.gender === 'female' ? '👧' : '👦'}
                    </div>
                    <span className="font-extrabold text-[#613b1c] font-headline text-[17px]">{name}</span>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-on-surface-variant mb-2 uppercase tracking-wider">오늘의 컨디션</p>
                    <div className="flex gap-2">
                      {conditionOptions.map(opt => (
                        <button key={opt.key} onClick={() => updateConfig(name, { condition: opt.key as any })}
                          className={`flex-1 py-3 rounded-2xl flex flex-col items-center gap-1 transition-all active:scale-95 ${config.condition === opt.key ? `${opt.activeBg} ${opt.activeText}` : `${opt.passiveBg} text-on-surface`}`}>
                          <span className="text-2xl">{opt.icon}</span>
                          <span className="text-[11px] font-bold">{opt.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <AlertTriangle size={13} className={config.hasAllergy ? 'text-red-500' : 'text-on-surface-variant'} />
                        <p className="text-xs font-bold text-on-surface-variant">알레르기 / 복용약</p>
                      </div>
                      <button onClick={() => updateConfig(name, { hasAllergy: !config.hasAllergy })}
                        className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${config.hasAllergy ? 'bg-red-400' : 'bg-surface-container-high'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm ${config.hasAllergy ? 'left-7' : 'left-1'}`} />
                      </button>
                    </div>
                    {config.hasAllergy && (
                      <input type="text" placeholder="예: 땅콩, 유제품, 특정 약물..."
                        value={config.allergyText} onChange={e => updateConfig(name, { allergyText: e.target.value })}
                        className="w-full bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-red-400 placeholder:text-red-300" />
                    )}
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* Step 3: Contact Info */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-[#f5ece6] space-y-4">
          <h3 className="font-extrabold text-[#0F6045] font-headline text-[16px] flex items-center gap-2">
            <span className="w-7 h-7 bg-[#0F6045] text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
            연락처 & 픽업 정보
          </h3>
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase tracking-wider">비상 연락처</label>
            <input type="tel" value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)} placeholder="010-0000-0000"
              className="w-full bg-surface-container-lowest border border-[#e0e0e0] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#0F6045]" />
          </div>
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase tracking-wider">픽업 예정자</label>
            <input type="text" value={pickupPerson} onChange={e => setPickupPerson(e.target.value)} placeholder="예: 아빠가 데려갈 예정"
              className="w-full bg-surface-container-lowest border border-[#e0e0e0] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#0F6045]" />
          </div>
          <div>
            <label className="block text-xs font-bold text-on-surface-variant mb-1.5 uppercase tracking-wider">기타 특이사항</label>
            <textarea value={specialNotes} onChange={e => setSpecialNotes(e.target.value)} rows={3}
              placeholder="예: 오늘 감기 기운이 있어요. 조용한 활동 부탁드려요."
              className="w-full bg-surface-container-lowest border border-[#e0e0e0] rounded-xl px-4 py-3 text-sm outline-none focus:border-[#0F6045] resize-none" />
          </div>
        </section>

        <button onClick={handleSubmit} disabled={isSubmitting || selectedNames.length === 0}
          className="w-full py-5 bg-[#0F6045] text-white rounded-3xl font-extrabold text-lg shadow-xl shadow-[#0F6045]/25 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3">
          <Heart size={22} fill="white" />
          {isSubmitting ? '신청 중...' : selectedNames.length > 0 ? `${selectedNames.join(', ')} 신청 완료` : '자녀를 선택해주세요'}
        </button>
      </main>
    </div>
  );
}
