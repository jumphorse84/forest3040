import React from 'react';
import { Baby, MapPin, Clock, Users, ChevronRight, History, TreePine, Plus, Heart, Sparkles } from 'lucide-react';

const KidsView = ({ user, kidsCares = [], forests = [], schedules = [], onNavigateToAdd, onNavigateToDetail, onNavigateToAdmin, onNavigateToHistory, onShowToast }: any) => {
  const isAdminOrLeader = user?.role === 'admin' || user?.role === 'pastor' || user?.role === 'leader';
  
  const todayStr = new Date().toISOString().split('T')[0];
  const todayDate = new Date();
  todayDate.setHours(0,0,0,0);
  const nextWeekDate = new Date(todayDate);
  nextWeekDate.setDate(nextWeekDate.getDate() + 7);
  
  const upcomingHoliday = schedules.find((s: any) => {
    if (!s.fullDate || s.active === false) return false;
    const sDate = new Date(s.fullDate);
    sDate.setHours(0,0,0,0);
    const isHoliday = s.title?.includes('휴회') || s.title?.includes('휴무');
    return isHoliday && sDate >= todayDate && sDate <= nextWeekDate;
  });

  const sortedCares = [...kidsCares].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const upcomingCares = sortedCares.filter(c => c.date >= todayStr);
  const activeCare = upcomingCares.length > 0 && !upcomingHoliday ? upcomingCares[0] : null;
  
  // My Applications
  const myApplications = [...kidsCares]
    .filter(c => c.registrations && c.registrations[user?.uid] > 0)
    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());

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
        {/* Hero Section: Flat Illustration Style */}
        <section
          className="relative overflow-hidden rounded-3xl flex flex-row items-stretch min-h-[200px]"
          style={{ background: '#f2ede2' }}
        >
          {/* Subtle inner glow on left */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 25% 60%, rgba(160,200,150,0.18) 0%, transparent 65%)' }}
          />

          {/* Left: Text Content */}
          <div className="relative z-10 flex flex-col justify-center px-7 py-7 flex-1">
            {/* Badge */}
            <span
              className="inline-block self-start px-3 py-1 rounded-full text-[11px] font-bold tracking-widest mb-4"
              style={{
                fontFamily: "'GmarketSans', 'Noto Sans KR', sans-serif",
                fontWeight: 500,
                background: 'rgba(90,130,80,0.13)',
                color: '#4a7a50',
                letterSpacing: '0.06em',
              }}
            >
              FOREST3040 KIDS
            </span>

            {/* Main Title — Gmarket Sans rounded feel */}
            <h2
              className="leading-snug mb-2 break-keep"
              style={{
                fontFamily: "'GmarketSans', 'Noto Sans KR', sans-serif",
                fontSize: '22px',
                fontWeight: 700,
                color: '#2d3a28',
                letterSpacing: '-0.01em',
                lineHeight: 1.38,
              }}
            >
              우리 아이들을<br/>위한 따뜻한 숲
            </h2>

            {/* Subtitle */}
            <p
              style={{
                fontFamily: "'GmarketSans', 'Noto Sans KR', sans-serif",
                fontSize: '12px',
                fontWeight: 300,
                color: '#6b7e60',
                lineHeight: 1.65,
              }}
            >
              전문 교사와 함께하는<br/>안전하고 행복한 시간
            </p>
          </div>

          {/* Right: Illustration — edges faded with CSS mask */}
          <div className="relative flex items-end justify-end shrink-0 w-[185px] overflow-hidden">
            <img
              src="/kids_care_banner.png"
              alt="키즈돌봄 일러스트"
              className="h-[210px] w-auto object-cover object-bottom"
              style={{
                mixBlendMode: 'multiply',
                maskImage: 'linear-gradient(to right, transparent 0%, black 22%, black 88%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 8%, black 88%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 22%, black 88%, transparent 100%), linear-gradient(to bottom, transparent 0%, black 8%, black 88%, transparent 100%)',
                maskComposite: 'intersect',
                WebkitMaskComposite: 'source-in',
                filter: 'saturate(1.05)',
              }}
            />
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
        {upcomingHoliday ? (
          <section
            className="overflow-hidden rounded-[2rem] shadow-[0_8px_30px_rgba(46,47,45,0.05)] w-full relative"
            style={{ background: '#fdf8f5' }}
          >
            {/* Outline Glow */}
            <div className="absolute inset-0 pointer-events-none rounded-[2rem] border-2 border-white/50"></div>
            
            {/* Illustration area */}
            <div className="relative w-full flex justify-center items-center overflow-hidden pt-6" style={{ height: '170px' }}>
              <img
                src="/kids_care_holiday.png"
                alt="휴회 안내 일러스트"
                className="h-[200px] w-auto object-cover object-bottom"
                style={{
                  mixBlendMode: 'multiply',
                  maskImage: 'radial-gradient(circle at center, black 40%, rgba(0,0,0,0.5) 60%, transparent 90%)',
                  WebkitMaskImage: 'radial-gradient(circle at center, black 40%, rgba(0,0,0,0.5) 60%, transparent 90%)',
                  filter: 'saturate(1.1)',
                }}
              />
            </div>

            {/* Text area */}
            <div className="px-6 pb-10 pt-4 text-center relative z-10">
              <span className="inline-block mb-3 px-3 py-1 rounded-full text-[10px] font-bold text-[#e27351] bg-[#ffefeb] uppercase tracking-widest font-headline">
                {upcomingHoliday.fullDate}
              </span>
              <p
                className="font-bold text-[18px] break-keep leading-snug mb-2"
                style={{ fontFamily: "'GmarketSans','Noto Sans KR',sans-serif", color: '#8b4932' }}
              >
                오늘은 돌봄이<br/>쉬어가는 날이에요
              </p>
              <p
                className="mt-1 text-[13px]"
                style={{ fontFamily: "'GmarketSans','Noto Sans KR',sans-serif", fontWeight: 300, color: '#b58876', lineHeight: 1.6 }}
              >
                {upcomingHoliday.title}로 인해<br/>이번 주일은 키즈돌봄이 없습니다.<br/>가족과 함께 평안한 주일 보내세요 🌿
              </p>
            </div>
          </section>
        ) : activeCare ? (
          <section className="bg-gradient-to-b from-[#fff6f3] to-white rounded-[2rem] p-8 shadow-[0_15px_40px_rgba(139,73,50,0.08)] border-4 border-white cursor-pointer hover:-translate-y-1 transition-transform relative overflow-hidden group" onClick={() => onNavigateToDetail(activeCare.id)}>
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-[#ffefeb] rounded-full blur-2xl group-hover:scale-110 transition-transform duration-500"></div>
            <div className="absolute top-6 right-6 opacity-20 group-hover:opacity-100 transition-opacity duration-300">
               <Sparkles className="text-[#ffab91]" size={32} />
            </div>
            <div className="flex flex-col mb-8 relative z-10 pr-10">
              <span className="text-xs font-extrabold text-[#fda485] mb-2 font-headline uppercase tracking-wider">{activeCare.date}</span>
              <h3 className="text-2xl font-extrabold text-[#8b4932] font-headline leading-tight break-keep">{activeCare.title || '이번 주 키즈돌봄 안내'}</h3>
            </div>
            <div className="space-y-5 relative z-10">
              <div className="flex items-center gap-4 bg-white/60 p-3 rounded-2xl">
                <div className="w-12 h-12 bg-[#ffefeb] rounded-full flex items-center justify-center shrink-0 shadow-inner">
                  <MapPin size={22} className="text-[#e27351]" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-[#b58876] uppercase tracking-widest mb-0.5 font-headline">장소</p>
                  <p className="text-[15px] font-extrabold text-[#613b1c] font-headline">{activeCare.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/60 p-3 rounded-2xl">
                <div className="w-12 h-12 bg-[#ffefeb] rounded-full flex items-center justify-center shrink-0 shadow-inner">
                  <Clock size={22} className="text-[#e27351]" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-[#b58876] uppercase tracking-widest mb-0.5 font-headline">시간</p>
                  <p className="text-[15px] font-extrabold text-[#613b1c] font-headline">{activeCare.time}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 bg-white/60 p-3 rounded-2xl">
                <div className="w-12 h-12 bg-[#ffefeb] rounded-full flex items-center justify-center shrink-0 shadow-inner">
                  <Baby size={22} className="text-[#e27351]" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-[#b58876] uppercase tracking-widest mb-0.5 font-headline">대상</p>
                  <p className="text-[15px] font-extrabold text-[#613b1c] font-headline">{activeCare.target}</p>
                </div>
              </div>
            </div>
            <div className="mt-8 pt-6 border-t-2 border-dashed border-[#ffefeb] flex flex-col gap-4 relative z-10">
              <div className="flex items-center justify-between">
                {activeCare.assigned_forest_id && (
                  <div className="flex items-center gap-2">
                    <Heart size={16} className="text-[#ffab91] fill-[#ffab91]" />
                    <span className="text-[13px] font-extrabold text-[#8b4932] font-headline">
                      담당: {forests.find((f:any) => f.forest_id === activeCare.assigned_forest_id)?.name || activeCare.assigned_forest_id}
                    </span>
                  </div>
                )}
                <div className="bg-primary/10 px-4 py-2 rounded-full border border-primary/20 flex gap-2 items-center">
                  <span className="text-[13px] font-extrabold text-primary font-headline">
                    예약: {Object.values(activeCare.registrations || {}).reduce((a:any, b:any) => a + b, 0)}명
                  </span>
                </div>
              </div>
              {isAdminOrLeader && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onNavigateToAdmin(activeCare.id); }}
                  className="w-full py-3 bg-[#0F6045] text-white rounded-xl font-bold flex flex-row items-center justify-center gap-2 relative shadow-md shadow-[#0F6045]/20 active:scale-95 transition-transform"
                >
                  <Users size={18} />
                  <span>운영진 명단 관리</span>
                </button>
              )}
            </div>
          </section>
        ) : (
          <section
            className="overflow-hidden rounded-[2rem] shadow-[0_8px_30px_rgba(46,47,45,0.05)] w-full"
            style={{ background: '#fdfbf7' }}
          >
            {/* Illustration area (reduced size) */}
            <div className="relative w-full flex justify-center items-center overflow-hidden" style={{ height: '150px' }}>
              <img
                src="/kids_care_empty.png"
                alt="준비 중 일러스트"
                className="h-[180px] w-auto object-contain"
                style={{
                  mixBlendMode: 'multiply',
                  maskImage: 'radial-gradient(circle at center, black 25%, rgba(0,0,0,0.5) 50%, transparent 80%)',
                  WebkitMaskImage: 'radial-gradient(circle at center, black 25%, rgba(0,0,0,0.5) 50%, transparent 80%)',
                  filter: 'saturate(1.05)',
                }}
              />
            </div>

            {/* Text area (reduced padding) */}
            <div className="px-6 pb-6 pt-1 text-center">
              <p
                className="font-bold text-[15px] break-keep leading-relaxed"
                style={{ fontFamily: "'GmarketSans','Noto Sans KR',sans-serif", color: '#4a4a3a' }}
              >
                이번 주 돌봄 프로그램이<br/>아직 준비 중이에요
              </p>
              <p
                className="mt-1.5 text-[12px]"
                style={{ fontFamily: "'GmarketSans','Noto Sans KR',sans-serif", fontWeight: 300, color: '#8a8a72' }}
              >
                곧 일정이 등록될 예정이에요 🌿
              </p>

              {isAdminOrLeader && (
                <div className="group relative inline-block mt-4 w-full cursor-help">
                  <div className="bg-[#f0ede6]/50 border border-[#e8e4db] rounded-xl px-4 py-3 text-center flex justify-center items-center gap-2 hover:bg-[#eae6dd]/60 transition-colors">
                    <span className="text-base leading-none">🏕️</span>
                    <span
                      className="text-[12px] font-medium"
                      style={{ fontFamily: "'GmarketSans','Noto Sans KR',sans-serif", color: '#6a7a5a' }}
                    >
                      새 프로그램을 등록하려면?
                    </span>
                  </div>
                  
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-[220px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    <div className="bg-[#4a5a3a] text-white text-[11px] rounded-xl py-2.5 px-4 shadow-xl text-center break-keep leading-relaxed" style={{ fontFamily: "'GmarketSans','Noto Sans KR',sans-serif", fontWeight: 300 }}>
                      우측 하단의 <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#0F6045] text-white text-[9px] font-bold mx-0.5 align-middle">+</span> 버튼을 눌러 새 일정을 등록해 주세요!
                    </div>
                    {/* Tooltip Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-t-[#4a5a3a] border-t-8 border-x-transparent border-x-8 border-b-0 w-0 h-0"></div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* My Status: Registration History */}
        <section className="space-y-4 pt-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-bold text-on-surface font-headline">나의 신청 내역</h3>
            <button onClick={onNavigateToHistory} className="flex items-center gap-1 text-sm font-bold text-primary active:scale-95 transition-transform bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-full cursor-pointer">
              <History size={16} /> 지난 돌봄 모아보기
            </button>
          </div>
          
          {myApplications.length > 0 ? (
            <div className="space-y-3">
              {myApplications.map((app: any) => {
                const isPast = app.date < todayStr;
                return (
                <div key={app.id} onClick={() => onNavigateToDetail(app.id)} className={`bg-white rounded-xl p-4 shadow-[0_5px_15px_rgba(0,0,0,0.05)] border border-surface-container-low flex justify-between items-center cursor-pointer active:scale-95 transition-all relative overflow-hidden ${isPast ? 'opacity-80 grayscale-[30%]' : ''}`}>
                  <div className="z-10 flex-1 pr-4">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${isPast ? 'bg-surface-container text-on-surface-variant border-outline-variant' : 'bg-primary/10 text-primary border-primary/20'}`}>
                        {isPast ? '참여 완료' : '예약됨'}
                      </span>
                      <span className="text-[10px] font-bold text-outline font-headline">{app.date}</span>
                    </div>
                    <h4 className="font-bold text-on-surface font-headline text-[15px]">{app.title || `${app.date} 키즈돌봄`}</h4>
                    <p className="text-xs text-on-surface-variant mt-1.5 flex items-center gap-1.5">
                      <MapPin size={12}/> {app.location} <span className="text-outline-variant">|</span> <span className="font-bold">{app.registrations[user?.uid]}명 예약</span>
                    </p>
                  </div>
                  <ChevronRight size={20} className="text-outline shrink-0 z-10" />
                  {isPast && <div className="absolute inset-0 bg-white/10 backdrop-blur-[0.5px] pointer-events-none"></div>}
                </div>
              )})}
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
