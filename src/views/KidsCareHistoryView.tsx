import React, { useMemo } from 'react';
import { ChevronLeft, ChevronRight, History, Calendar, MapPin, Users } from 'lucide-react';

const KidsCareHistoryView = ({ kidsCares = [], onBack, onNavigateToDetail }: any) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // 과거 프로그램만 필터링 및 내림차순 정렬
  const pastCares = useMemo(() => {
    return kidsCares
      .filter((c: any) => c.date < todayStr)
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [kidsCares, todayStr]);

  // 연월(YYYY년 M월) 그룹핑
  const groupedCares = useMemo(() => {
    const groups: Record<string, any[]> = {};
    pastCares.forEach((care: any) => {
      if (!care.date) return;
      const dateObj = new Date(care.date);
      const yearMonth = `${dateObj.getFullYear()}년 ${dateObj.getMonth() + 1}월`;
      if (!groups[yearMonth]) groups[yearMonth] = [];
      groups[yearMonth].push(care);
    });
    return groups;
  }, [pastCares]);

  return (
    <div className="absolute inset-0 bg-surface z-[60] flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface-container-highest">
        <div className="flex items-center px-4 py-4">
          <button onClick={onBack} className="p-2 -ml-2 mr-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors active:scale-95">
            <ChevronLeft size={24} />
          </button>
          <div className="flex items-center gap-2">
            <History size={20} className="text-primary" />
            <h1 className="text-lg font-bold tracking-tight text-on-surface font-headline">지난 돌봄 다시보기</h1>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-5 py-6 pb-24 space-y-8">
        {pastCares.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center opacity-60 mt-20">
            <div className="w-20 h-20 bg-surface-container-high rounded-full flex items-center justify-center mb-5">
              <History size={40} className="text-outline" />
            </div>
            <p className="text-on-surface-variant font-bold text-lg">기록된 지난 돌봄이 없습니다.</p>
          </div>
        ) : (
          Object.keys(groupedCares).map(monthLabel => (
            <div key={monthLabel} className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-primary" />
                <h2 className="text-lg font-extrabold text-on-surface font-headline">{monthLabel}</h2>
                <div className="h-px bg-surface-container flex-1 ml-4 mt-1"></div>
              </div>
              <div className="grid gap-4">
                {groupedCares[monthLabel].map(care => {
                  const totalRegistrations = Object.values(care.registrations || {}).reduce((sum: any, count: any) => sum + count, 0);
                  
                  return (
                    <div 
                      key={care.id} 
                      onClick={() => onNavigateToDetail(care.id)}
                      className="bg-white rounded-2xl p-5 shadow-[0_5px_15px_rgba(0,0,0,0.03)] border border-surface-container-highest cursor-pointer active:scale-95 transition-transform flex items-center justify-between group"
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-bold px-2 py-[2px] rounded-full bg-surface-container text-on-surface-variant border border-surface-container-highest shadow-sm">
                            {care.date}
                          </span>
                        </div>
                        <h3 className="text-base font-extrabold text-on-surface font-headline truncate tracking-tight">{care.title || `${care.date} 키즈돌봄`}</h3>
                        <div className="flex items-center gap-3 mt-2 text-xs text-on-surface-variant font-medium">
                          <span className="flex items-center gap-1.5"><MapPin size={12}/> {care.location}</span>
                          <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                          <span className="flex items-center gap-1.5"><Users size={12}/> 참여 {totalRegistrations as number}명</span>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-surface-container-lowest border border-surface-container group-hover:bg-primary/10 group-hover:border-primary/20 flex items-center justify-center shrink-0 transition-colors shadow-sm">
                        <ChevronRight size={20} className="text-outline group-hover:text-primary transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default KidsCareHistoryView;
