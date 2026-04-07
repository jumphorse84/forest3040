import React, { useState } from 'react';
import { ChevronLeft, Home, BookOpen, User, Flame, X, Baby, MapPin, Clock, Users, TreePine, Megaphone, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function KidsCareDetailView({ kidsCareId, kidsCares, user, onBack, onShowToast }: any) {
  const [isApplying, setIsApplying] = useState(false);
  const [kidsCount, setKidsCount] = useState(1);
  const [showApplyModal, setShowApplyModal] = useState(false);

  const careData = kidsCares.find((c: any) => c.id === kidsCareId);

  if (!careData) {
    return (
      <div className="flex flex-col items-center justify-center p-6 text-center pt-24">
        <p className="text-on-surface-variant">돌봄 정보를 찾을 수 없습니다.</p>
        <button onClick={onBack} className="mt-4 text-primary font-bold">뒤로가기</button>
      </div>
    );
  }

  const registrations = careData.registrations || {};
  const myApplyCount = registrations[user?.uid] || 0;
  const hasApplied = myApplyCount > 0;
  
  const totalKidsCount = Object.values(registrations).reduce((acc: any, val: any) => acc + val, 0) as number;

  const handleApply = async () => {
    if (!user) return;
    try {
      setIsApplying(true);
      const careRef = doc(db, 'kids_cares', kidsCareId);
      await updateDoc(careRef, {
        [`registrations.${user.uid}`]: kidsCount
      });
      onShowToast(`총 ${kidsCount}명의 아이 사전 신청이 완료되었습니다.`);
      setShowApplyModal(false);
    } catch (error) {
      console.error("Error applying to kids care:", error);
      onShowToast('신청 처리 중 오류가 발생했습니다.');
    } finally {
      setIsApplying(false);
    }
  };

  const handleCancelApply = async () => {
    if (!user) return;
    if (window.confirm("사전 신청을 취소하시겠습니까?")) {
      try {
        setIsApplying(true);
        const careRef = doc(db, 'kids_cares', kidsCareId);
        // Setting count to 0 or we can use deleteField() from firestore. For simplicity, just set to 0.
        // Or we could replace the whole registrations object without the key.
        const newRegistrations = { ...registrations };
        delete newRegistrations[user.uid];
        await updateDoc(careRef, {
          registrations: newRegistrations
        });
        onShowToast('사전 신청이 취소되었습니다.');
      } catch (error) {
        onShowToast('취소 처리 중 오류가 발생했습니다.');
      } finally {
        setIsApplying(false);
      }
    }
  };

  return (
    <div className="bg-surface font-body selection:bg-primary/20 min-h-screen pb-32">
      <nav className="sticky top-0 w-full z-50 bg-[#FAF9F6]/80 backdrop-blur-xl flex justify-between items-center px-6 py-4 max-w-md mx-auto left-0 right-0">
        <div className="flex items-center gap-3 active:scale-95 duration-200 cursor-pointer" onClick={onBack}>
          <ChevronLeft className="text-primary-dim w-6 h-6" />
          <span className="font-headline font-bold text-lg tracking-tight text-primary-dim">돌봄 상세 안내</span>
        </div>
      </nav>

      <main className="max-w-md mx-auto px-6 py-6 space-y-8">
        
        {/* Header Hero */}
        <section className="bg-gradient-to-br from-[#ffefeb] to-[#ffc4b1] rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 opacity-20">
            <Baby size={120} className="text-[#8b4932]" />
          </div>
          <div className="relative z-10">
            <span className="inline-block bg-white/40 backdrop-blur-sm px-3 py-1 rounded-full text-[11px] font-bold text-[#8b4932] mb-3">
              {careData.date} ({careData.status})
            </span>
            <h1 className="text-2xl font-extrabold text-on-surface font-headline leading-tight">이번 주 키즈돌봄<br/>사전 신청</h1>
            <p className="text-on-surface-variant font-medium mt-2 text-sm">믿고 맡길 수 있는 안전한 시간</p>
          </div>
        </section>

        {/* Info Box */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-surface-container-low space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-[#8b4932]/10 rounded-full flex items-center justify-center shrink-0">
              <Clock size={20} className="text-[#8b4932]" />
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1 font-headline">시간</p>
              <p className="text-[15px] font-semibold text-on-surface font-headline break-keep">{careData.time}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-[#8b4932]/10 rounded-full flex items-center justify-center shrink-0">
              <MapPin size={20} className="text-[#8b4932]" />
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1 font-headline">장소</p>
              <p className="text-[15px] font-semibold text-on-surface font-headline break-keep">{careData.location}</p>
            </div>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-[#8b4932]/10 rounded-full flex items-center justify-center shrink-0">
              <Users size={20} className="text-[#8b4932]" />
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1 font-headline">대상</p>
              <p className="text-[15px] font-semibold text-on-surface font-headline break-keep">{careData.target}</p>
            </div>
          </div>
          
          <div className="pt-4 border-t border-surface-container-low">
             <div className="bg-[#fcf8f5] rounded-xl p-4 border border-[#f5ece6]">
               <div className="flex gap-2 items-center mb-2">
                 <Megaphone size={16} className="text-[#8b4932]" />
                 <span className="text-sm font-bold text-[#613b1c]">이번 주 돌봄 프로그램</span>
               </div>
               <p className="text-[14px] text-on-surface leading-relaxed whitespace-pre-wrap">{careData.content}</p>
             </div>
          </div>

          <div className="flex justify-between items-center bg-surface-container-lowest p-4 rounded-xl border border-surface-container-low">
            <span className="text-sm font-bold text-on-surface-variant font-headline">현재 사전 신청 완료</span>
            <span className="text-lg font-extrabold text-primary"><span className="text-2xl">{totalKidsCount}</span>명</span>
          </div>
        </section>

        {/* Action Bottom */}
        <section>
          {hasApplied ? (
            <div className="space-y-3">
              <div className="bg-primary/10 border border-primary/20 rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <p className="text-primary font-bold font-headline flex items-center gap-2"><CheckCircle2 size={18}/> 신청 완료</p>
                  <p className="text-sm text-primary-dim mt-1">{myApplyCount}명의 아이가 신청되어 있습니다.</p>
                </div>
              </div>
              <button onClick={handleCancelApply} disabled={isSubmitting} className="w-full py-4 bg-surface-container-low text-on-surface rounded-2xl font-bold active:scale-95 transition-all text-sm">
                신청 취소하기
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowApplyModal(true)} 
              className="w-full py-4 bg-primary text-on-primary rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-95 transition-all flex justify-center items-center gap-2 text-lg font-headline"
            >
              사전 신청하기
            </button>
          )}
        </section>

        {/* Apply Modal */}
        {showApplyModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-surface-container-lowest w-full max-w-sm rounded-[2rem] p-6 shadow-2xl animate-in zoom-in-95 duration-300 space-y-6 relative">
              <button onClick={() => setShowApplyModal(false)} className="absolute top-4 right-4 p-2 bg-surface-container-low rounded-full"><X size={16}/></button>
              
              <div className="text-center space-y-2 pt-2">
                <div className="w-16 h-16 bg-[#ffefeb] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Baby size={32} className="text-[#8b4932]"/>
                </div>
                <h3 className="text-xl font-bold text-on-surface font-headline">몇 명의 아이가 참석하나요?</h3>
                <p className="text-sm text-on-surface-variant">원활한 돌봄 준비를 위해 입력해주세요.</p>
              </div>

              <div className="flex items-center justify-center gap-6 py-4">
                <button onClick={() => setKidsCount(Math.max(1, kidsCount - 1))} className="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center shadow-sm active:scale-90 transition-transform">
                  <ChevronDown size={24} className="text-on-surface-variant"/>
                </button>
                <span className="text-4xl font-extrabold text-primary font-headline min-w-[3rem] text-center">{kidsCount}</span>
                <button onClick={() => setKidsCount(kidsCount + 1)} className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shadow-sm active:scale-90 transition-transform">
                  <ChevronUp size={24} className="text-primary"/>
                </button>
              </div>

              <button 
                onClick={handleApply} disabled={isSubmitting}
                className="w-full py-4 bg-primary text-on-primary rounded-xl font-bold shadow-md shadow-primary/20 active:scale-95 transition-all text-lg flex justify-center items-center gap-2"
              >
                {isSubmitting ? '처리 중...' : `${kidsCount}명 신청하기`}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
