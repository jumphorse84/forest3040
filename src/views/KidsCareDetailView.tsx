import React, { useState, useEffect } from 'react';
import { ChevronLeft, Baby, MapPin, Clock, Users, Megaphone, CheckCircle2, X, ChevronDown, ChevronUp, Phone, AlertTriangle, User } from 'lucide-react';
import { doc, updateDoc, collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';

const STATUS_STEPS = [
  { key: 'pending', label: '대기 중', icon: '⏳', color: 'bg-amber-400' },
  { key: 'checked_in', label: '입실 완료', icon: '✅', color: 'bg-blue-400' },
  { key: 'active', label: '활동 중', icon: '🎨', color: 'bg-purple-400' },
  { key: 'checked_out', label: '귀가 완료', icon: '🏠', color: 'bg-emerald-500' },
];

function getOverallStatus(children: any[]): string {
  if (!children || children.length === 0) return 'pending';
  if (children.every(c => c.status === 'checked_out')) return 'checked_out';
  if (children.some(c => c.status === 'active' || c.status === 'checked_in')) return 'active';
  return 'pending';
}

export default function KidsCareDetailView({ kidsCareId, kidsCares, user, onBack, onShowToast, onNavigateToApply }: any) {
  const [myApplication, setMyApplication] = useState<any>(null);
  const [loadingApp, setLoadingApp] = useState(true);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const careData = kidsCares.find((c: any) => c.id === kidsCareId);

  useEffect(() => {
    if (!user?.uid || !kidsCareId) { setLoadingApp(false); return; }
    const q = query(
      collection(db, 'kids_applications'),
      where('kids_care_id', '==', kidsCareId),
      where('parent_id', '==', user.uid)
    );
    const unsub = onSnapshot(q, snap => {
      if (!snap.empty) setMyApplication({ ...snap.docs[0].data(), id: snap.docs[0].id });
      else setMyApplication(null);
      setLoadingApp(false);
    });
    return () => unsub();
  }, [kidsCareId, user?.uid]);

  if (!careData) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center pt-24 min-h-screen">
        <Baby size={48} className="text-[#ffab91] mb-4" />
        <p className="text-on-surface-variant font-bold">돌봄 정보를 찾을 수 없습니다.</p>
        <button onClick={onBack} className="mt-4 text-[#0F6045] font-bold underline">뒤로가기</button>
      </div>
    );
  }

  const overallStatus = myApplication ? getOverallStatus(myApplication.children || []) : null;
  const statusIndex = overallStatus ? STATUS_STEPS.findIndex(s => s.key === overallStatus) : -1;

  return (
    <div className="bg-[#FAF9F6] min-h-screen pb-36 font-body">
      <nav className="sticky top-0 z-50 bg-[#FAF9F6]/90 backdrop-blur-xl px-6 py-4 max-w-md mx-auto flex items-center gap-3">
        <button onClick={onBack} className="active:scale-95 transition-transform p-1">
          <ChevronLeft className="text-[#0F6045] w-6 h-6" />
        </button>
        <span className="font-headline font-bold text-lg text-[#0F6045]">돌봄 상세 안내</span>
      </nav>

      <main className="max-w-md mx-auto px-5 space-y-5">
        {/* Hero */}
        <section className="bg-gradient-to-br from-[#FEE3D5] to-[#ffc4b1] rounded-3xl p-7 relative overflow-hidden">
          <div className="absolute -top-8 -right-8 opacity-10">
            <Baby size={130} className="text-[#8b4932]" />
          </div>
          <div className="relative z-10">
            <span className="inline-block bg-white/40 backdrop-blur-sm px-3 py-1 rounded-full text-[11px] font-bold text-[#8b4932] mb-3">{careData.date}</span>
            <h1 className="text-2xl font-extrabold text-[#613b1c] font-headline leading-tight break-keep">
              {careData.title || '이번 주 키즈돌봄 안내'}
            </h1>
            <p className="text-[#8b4932]/80 font-medium mt-1 text-sm">믿고 맡길 수 있는 안전한 돌봄</p>
          </div>
        </section>

        {/* Care Info */}
        <section className="bg-white rounded-3xl p-6 shadow-sm border border-[#f5ece6] space-y-4">
          {[
            { icon: <Clock size={18} className="text-[#e27351]"/>, label: '시간', value: careData.time },
            { icon: <MapPin size={18} className="text-[#e27351]"/>, label: '장소', value: careData.location },
            { icon: <Baby size={18} className="text-[#e27351]"/>, label: '대상', value: careData.target },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-4 bg-[#fff9f6] p-3.5 rounded-2xl">
              <div className="w-10 h-10 bg-[#FEE3D5] rounded-full flex items-center justify-center shrink-0">{item.icon}</div>
              <div>
                <p className="text-[10px] font-bold text-[#b58876] uppercase tracking-widest">{item.label}</p>
                <p className="text-[15px] font-extrabold text-[#613b1c] font-headline">{item.value}</p>
              </div>
            </div>
          ))}

          {careData.teacher_name && (
            <div className="flex items-center gap-4 bg-[#f0f8f4] p-3.5 rounded-2xl border border-[#c8e6c9]">
              <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center shrink-0">
                <User size={18} className="text-[#0F6045]" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-[#0F6045]/70 uppercase tracking-widest">담당 교사</p>
                <p className="text-[15px] font-extrabold text-[#0F6045] font-headline">{careData.teacher_name}</p>
                <p className="text-[11px] text-emerald-600 mt-0.5">오늘 하루 안전하게 돌보겠습니다 😊</p>
              </div>
            </div>
          )}

          {careData.content && (
            <div className="bg-[#fcf8f5] rounded-2xl p-4 border border-[#f5ece6]">
              <div className="flex gap-2 items-center mb-2">
                <Megaphone size={14} className="text-[#8b4932]" />
                <span className="text-xs font-bold text-[#613b1c] uppercase tracking-wider">이번 주 프로그램</span>
              </div>
              <p className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap">{careData.content}</p>
            </div>
          )}
        </section>

        {/* =========== MY APPLICATION STATUS =========== */}
        {loadingApp ? (
          <div className="text-center py-8 text-on-surface-variant text-sm">불러오는 중...</div>
        ) : myApplication ? (
          <>
            {/* Status Timeline */}
            <section className="bg-white rounded-3xl p-6 shadow-sm border border-[#f5ece6] space-y-5">
              <h3 className="font-extrabold text-[#0F6045] font-headline text-[16px]">🕐 실시간 돌봄 현황</h3>
              <div className="flex items-center justify-between">
                {STATUS_STEPS.map((step, i) => {
                  const active = i <= statusIndex;
                  const current = i === statusIndex;
                  return (
                    <React.Fragment key={step.key}>
                      <div className="flex flex-col items-center gap-1.5 flex-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${active ? step.color + ' shadow-lg scale-110' : 'bg-surface-container-low'} ${current ? 'ring-2 ring-offset-2 ring-' + step.color : ''}`}>
                          {step.icon}
                        </div>
                        <span className={`text-[10px] font-bold text-center leading-tight ${active ? 'text-on-surface' : 'text-on-surface-variant'}`}>{step.label}</span>
                      </div>
                      {i < STATUS_STEPS.length - 1 && (
                        <div className={`h-0.5 flex-1 mx-1 rounded transition-colors ${i < statusIndex ? 'bg-emerald-400' : 'bg-surface-container-high'}`} />
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </section>

            {/* Children Status Cards */}
            <section className="space-y-3">
              <h3 className="font-extrabold text-[#0F6045] font-headline text-[16px] px-1">👶 신청 아이 정보</h3>
              {myApplication.children?.map((child: any, i: number) => (
                <div key={i} className={`bg-white rounded-3xl p-5 border-2 shadow-sm ${child.allergies ? 'border-red-200' : 'border-[#f5ece6]'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{child.gender === 'female' ? '👧' : '👦'}</span>
                      <div>
                        <p className="font-extrabold text-on-surface font-headline">{child.name}</p>
                        <p className="text-xs text-on-surface-variant">{child.age}세</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {child.condition === 'caution' && <span className="text-xs font-bold bg-red-100 text-red-500 px-2 py-1 rounded-full">🤒 주의</span>}
                      {child.condition === 'normal' && <span className="text-xs font-bold bg-amber-100 text-amber-600 px-2 py-1 rounded-full">😐 보통</span>}
                      {child.condition === 'good' && <span className="text-xs font-bold bg-green-100 text-green-600 px-2 py-1 rounded-full">😃 좋음</span>}
                    </div>
                  </div>
                  {child.allergies && (
                    <div className="flex items-start gap-2 bg-red-50 rounded-xl p-3 border border-red-200">
                      <AlertTriangle size={14} className="text-red-500 mt-0.5 shrink-0" />
                      <p className="text-xs font-bold text-red-600">{child.allergies}</p>
                    </div>
                  )}
                </div>
              ))}
            </section>

            {/* Contact Info */}
            <section className="bg-white rounded-3xl p-5 shadow-sm border border-[#f5ece6]">
              <h3 className="font-extrabold text-[#0F6045] font-headline text-[14px] mb-3">📞 연락처 정보</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-on-surface-variant">비상 연락처</span>
                  <span className="font-bold text-on-surface">{myApplication.emergency_contact}</span>
                </div>
                {myApplication.pickup_person && (
                  <div className="flex justify-between">
                    <span className="text-on-surface-variant">픽업 예정</span>
                    <span className="font-bold text-on-surface">{myApplication.pickup_person}</span>
                  </div>
                )}
                {myApplication.special_notes && (
                  <div className="mt-2 bg-amber-50 rounded-xl p-3 border border-amber-200">
                    <p className="text-xs text-amber-700 font-medium">{myApplication.special_notes}</p>
                  </div>
                )}
              </div>
            </section>

            {/* Cancel */}
            {!showCancelConfirm ? (
              <button onClick={() => setShowCancelConfirm(true)}
                className="w-full py-4 bg-surface-container-low text-on-surface-variant rounded-2xl font-bold text-sm active:scale-95 transition-all">
                신청 취소하기
              </button>
            ) : (
              <div className="bg-red-50 rounded-2xl p-5 border border-red-200 text-center space-y-3">
                <p className="font-bold text-red-700">정말 신청을 취소하시겠습니까?</p>
                <div className="flex gap-2">
                  <button onClick={() => setShowCancelConfirm(false)} className="flex-1 py-3 bg-white border border-[#e0e0e0] rounded-xl font-bold text-sm">아니오</button>
                  <button disabled={isCancelling}
                    onClick={async () => {
                      setIsCancelling(true);
                      try {
                        await updateDoc(doc(db, 'kids_applications', myApplication.id), { cancelled: true });
                        onShowToast('신청이 취소되었습니다.');
                        setShowCancelConfirm(false);
                      } catch { onShowToast('취소 중 오류가 발생했습니다.'); }
                      finally { setIsCancelling(false); }
                    }}
                    className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold text-sm active:scale-95 transition-all">
                    {isCancelling ? '처리 중...' : '네, 취소합니다'}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* ======== NO APPLICATION YET ======== */
          <>
            <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-5 flex items-center justify-between">
              <div>
                <p className="font-extrabold text-[#0F6045] font-headline">사전 신청이 아직 없어요</p>
                <p className="text-sm text-emerald-700/80 mt-0.5">지금 신청하고 안심하고 예배드리세요</p>
              </div>
              <span className="text-3xl">✨</span>
            </div>
            <button onClick={onNavigateToApply}
              className="w-full py-5 bg-[#0F6045] text-white rounded-3xl font-extrabold text-lg shadow-xl shadow-[#0F6045]/25 active:scale-95 transition-all flex items-center justify-center gap-3">
              <Baby size={22} />
              사전 신청하기
            </button>
          </>
        )}
      </main>
    </div>
  );
}
