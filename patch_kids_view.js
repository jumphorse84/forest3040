const fs = require('fs');

const file = 'c:/Users/admin/Desktop/웹앱/포레스트/forest3040main/src/views/KidsView.tsx';

let content = `import React from 'react';
import { Baby, MapPin, Clock, Users, ChevronRight, History, TreePine, Plus } from 'lucide-react';

const KidsView = ({ user, kidsCares = [], onNavigateToAdd, onNavigateToDetail, onShowToast }: any) => {
  // Get the most recent upcoming or ongoing care
  // We sort by date descending
  const recentCares = [...kidsCares].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  const activeCare = recentCares.length > 0 ? recentCares[0] : null;

  const isAdminOrLeader = user?.role === 'admin' || user?.role === 'pastor' || user?.role === 'leader';
  
  // My Applications
  const myApplications = recentCares.filter(c => c.registrations && c.registrations[user?.uid] > 0);

  const handleApplyClick = () => {
    if (activeCare) {
      onNavigateToDetail(activeCare.id);
    } else {
      onShowToast('현재 예정된 돌봄이 없습니다.');
    }
  };

  return (
    <div className="pb-32 relative min-h-screen">
      <div className="pt-6 px-6 space-y-8 max-w-2xl mx-auto">
        {/* Hero Section: Pastel Forest */}
        <section className="relative overflow-hidden rounded-xl h-64 flex flex-col justify-end p-8 bg-gradient-to-br from-[#ffefeb] to-[#ffc4b1]">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-[#fac097]/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-48 h-48 bg-[#006948]/5 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <span className="inline-block bg-white/40 backdrop-blur-md px-3 py-1 rounded-full text-[12px] font-bold text-[#8b4932] mb-3 tracking-wider font-headline">FOREST3040 KIDS</span>
            <h2 className="text-3xl font-extrabold text-on-surface leading-tight tracking-tight font-headline">우리 아이들을 위한<br/>따뜻한 숲</h2>
            <p className="text-on-surface-variant mt-2 text-sm">전문 교사와 함께하는 안전하고 행복한 시간</p>
          </div>
          <div className="absolute top-10 right-10 opacity-20">
            <TreePine size={96} className="text-on-surface" />
          </div>
        </section>

        {/* Primary Action: Application Button */}
        <section>
          <button onClick={handleApplyClick} className="w-full group bg-gradient-to-r from-primary to-primary-dim text-white h-18 py-5 px-8 rounded-xl shadow-lg flex items-center justify-between transition-transform active:scale-95 duration-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Baby size={24} className="text-white" />
              </div>
              <span className="text-lg font-bold font-headline">이번 주 돌봄 사전 신청하기</span>
            </div>
            <ChevronRight size={24} className="text-white group-hover:translate-x-1 transition-transform" />
          </button>
        </section>

        {/* Info Card: Weekly Care Guide */}
        {activeCare ? (
          <section className="bg-white rounded-xl p-8 shadow-[0_20px_40px_rgba(46,47,45,0.06)] cursor-pointer active:scale-[0.98] transition-transform" onClick={() => onNavigateToDetail(activeCare.id)}>
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-on-surface font-headline">이번 주 돌봄 안내 ({activeCare.date})</h3>
              <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold font-headline">{activeCare.status || '진행 중'}</span>
            </div>
            <div className="space-y-6">
              <div className="flex items-start gap-5">
                <div className="w-10 h-10 bg-[#8b4932]/10 rounded-full flex items-center justify-center shrink-0">
                  <MapPin size={20} className="text-[#8b4932]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1 font-headline">장소</p>
                  <p className="text-lg font-semibold text-on-surface font-headline">{activeCare.location}</p>
                </div>
              </div>
              <div className="flex items-start gap-5">
                <div className="w-10 h-10 bg-[#8b4932]/10 rounded-full flex items-center justify-center shrink-0">
                  <Clock size={20} className="text-[#8b4932]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1 font-headline">시간</p>
                  <p className="text-lg font-semibold text-on-surface font-headline">{activeCare.time}</p>
                </div>
              </div>
              <div className="flex items-start gap-5">
                <div className="w-10 h-10 bg-[#8b4932]/10 rounded-full flex items-center justify-center shrink-0">
                  <Users size={20} className="text-[#8b4932]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1 font-headline">대상</p>
                  <p className="text-lg font-semibold text-on-surface font-headline">{activeCare.target}</p>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-8 border-t border-surface-container-low flex items-center justify-between">
              {activeCare.assigned_forest_id && (
                <div className="text-sm font-bold text-[#8b4932] bg-[#ffefeb] px-3 py-1.5 rounded-lg border border-[#fac097]">
                  봉사 담당숲: {activeCare.assigned_forest_id}
                </div>
              )}
              <div className="text-sm font-bold text-primary">
                사전 신청: {Object.values(activeCare.registrations || {}).reduce((a:any, b:any) => a + b, 0)}명
              </div>
            </div>
          </section>
        ) : (
          <section className="bg-white rounded-xl p-8 shadow-[0_20px_40px_rgba(46,47,45,0.06)] text-center text-on-surface-variant">
            이번 주 돌봄 프로그램이 아직 등록되지 않았습니다.
          </section>
        )}

        {/* My Status: Registration History */}
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-bold text-on-surface font-headline">나의 신청 내역</h3>
          </div>
          
          {myApplications.length > 0 ? (
            <div className="space-y-3">
              {myApplications.map((app: any) => (
                <div key={app.id} onClick={() => onNavigateToDetail(app.id)} className="bg-white rounded-xl p-4 shadow-[0_5px_15px_rgba(0,0,0,0.05)] border border-surface-container-low flex justify-between items-center cursor-pointer active:scale-95 transition-transform">
                  <div>
                    <h4 className="font-bold text-on-surface font-headline">{app.date} 키즈돌봄</h4>
                    <p className="text-xs text-on-surface-variant mt-1">{app.location} | 신청인원: {app.registrations[user?.uid]}명</p>
                  </div>
                  <ChevronRight size={18} className="text-surface-container-high" />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-[#f1f1ee] rounded-xl p-10 flex flex-col items-center justify-center text-center border-2 border-dashed border-[#adadab]/20">
              <div className="w-16 h-16 bg-[#e3e3df] rounded-full flex items-center justify-center mb-4">
                <History size={32} className="text-[#767775]" />
              </div>
              <p className="text-on-surface-variant font-medium">최근 신청 내역이 없습니다</p>
              <p className="text-xs text-[#767775] mt-1">우리 아이를 위한 첫 신청을 시작해보세요!</p>
            </div>
          )}
        </section>

      </div>

      {isAdminOrLeader && (
        <button
          onClick={onNavigateToAdd}
          className="fixed bottom-32 right-6 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-[0_8px_20px_rgba(16,185,129,0.3)] hover:scale-105 active:scale-95 transition-all z-20"
        >
          <Plus size={28} />
        </button>
      )}
    </div>
  );
};

export default KidsView;
`;

fs.writeFileSync(file, content);
console.log('KidsView updated');
