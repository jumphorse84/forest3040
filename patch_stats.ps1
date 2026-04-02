$file = "src\App.tsx"
$lines = [System.IO.File]::ReadAllLines($file, [System.Text.Encoding]::UTF8)

$startLine = 4425  # 0-indexed = line 4426 in editor
$before = $lines[0..($startLine-1)]
$after  = $lines[$($lines.Length-1)..$($lines.Length-1)]  # just grab last line as anchor; we replace to EOF

# Find the last line (always last line of file)
$endLine = $lines.Length - 1
$after = @()  # PastoralStatsDashboardView goes to the end of the file

$newContent = @"
const PastoralStatsDashboardView = ({ user, users, forests, attendance, pastoralRecords, weeklySettlements, onBack, onShowToast }: any) => {
  const isAdminOrPastor = user?.role === 'admin' || user?.role === 'pastor';
  const isAdmin = user?.role === 'admin';
  const myForestId = user?.forest_id;
  const [selectedTab, setSelectedTab] = React.useState<'overview' | 'category' | 'trend'>('overview');

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
  weekStart.setHours(0,0,0,0);
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const weekStr = `${weekStart.getFullYear()}-${String(weekStart.getMonth()+1).padStart(2,'0')}-${String(weekStart.getDate()).padStart(2,'0')}`;

  const handleSubmitSettlement = async (targetForestId: string) => {
    try {
      await addDoc(collection(firestoreDb, 'weekly_settlements'), {
        forest_id: targetForestId, week: weekStr, status: 'submitted',
        submittedAt: Timestamp.now(), submittedBy: user.uid
      });
      onShowToast('주간 결산이 제출되었습니다.');
    } catch (e) { console.error(e); onShowToast('결산 제출 중 오류가 발생했습니다.'); }
  };

  const getAbsentees = (forestId: string | null) => {
    const list = users.filter((u: any) => forestId ? u.forest_id === forestId : true);
    return list.filter((u: any) => {
      const uAtt = attendance.filter((a: any) => a.uid === u.uid && a.date?.seconds && new Date(a.date.seconds * 1000) > fourWeeksAgo);
      return uAtt.length === 0 && u.role !== 'admin' && u.role !== 'pastor';
    });
  };

  const thisWeekRecords = pastoralRecords.filter((r: any) => r.createdAt?.seconds && new Date(r.createdAt.seconds * 1000) >= weekStart);
  const getForestStats = (fid: string) => {
    const fRecords = thisWeekRecords.filter((r: any) => r.forest_id === fid);
    return {
      visitCount: fRecords.filter((r: any) => r.type !== 'prayer').length,
      prayerCount: fRecords.filter((r: any) => r.type === 'prayer').length,
      isSubmitted: weeklySettlements.some((s: any) => s.forest_id === fid && s.week === weekStr)
    };
  };

  const scopeRecords = isAdminOrPastor
    ? pastoralRecords.filter((r: any) => r.type !== 'prayer')
    : pastoralRecords.filter((r: any) => r.type !== 'prayer' && r.forest_id === myForestId);

  const categoryCounts = VISIT_CATEGORIES.map(cat => ({
    ...cat, count: scopeRecords.filter((r: any) => r.category === cat.id).length
  })).sort((a, b) => b.count - a.count);
  const totalCatCount = categoryCounts.reduce((s, c) => s + c.count, 0);

  const weeklyTrend = Array.from({ length: 6 }, (_, i) => {
    const wStart = new Date();
    wStart.setDate(wStart.getDate() - wStart.getDay() + (wStart.getDay() === 0 ? -6 : 1) - i * 7);
    wStart.setHours(0,0,0,0);
    const wEnd = new Date(wStart); wEnd.setDate(wEnd.getDate() + 7);
    const label = `${wStart.getMonth()+1}/${wStart.getDate()}`;
    const wRecords = scopeRecords.filter((r: any) =>
      r.createdAt?.seconds && new Date(r.createdAt.seconds * 1000) >= wStart && new Date(r.createdAt.seconds * 1000) < wEnd
    );
    return { label, count: wRecords.length };
  }).reverse();
  const maxTrend = Math.max(...weeklyTrend.map(w => w.count), 1);

  const myForestAbsentees = getAbsentees(isAdminOrPastor ? null : myForestId);
  const allAbsentees = isAdminOrPastor ? getAbsentees(null) : [];

  return (
    <div className="absolute inset-0 bg-surface z-[60] flex flex-col min-h-screen overflow-y-auto pb-24">
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface-container-highest">
        <div className="flex items-center px-2 py-3">
          <button onClick={onBack} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div className="flex flex-col ml-2">
            <h1 className="text-lg font-bold tracking-tight text-on-surface">목양 결산 통계</h1>
            <span className="text-[10px] text-primary font-bold">{weekStr} 주간</span>
          </div>
        </div>
        <div className="flex gap-1 px-4 pb-3">
          {([['overview', '현황'], ['category', '분야별'], ['trend', '추세']] as const).map(([tab, label]) => (
            <button key={tab} onClick={() => setSelectedTab(tab)}
              className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${selectedTab === tab ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-on-surface-variant'}`}>
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Alerts */}
        {(myForestAbsentees.length > 0 || allAbsentees.length > 0) && (
          <section className="bg-error/10 border border-error/20 p-5 rounded-2xl shadow-sm space-y-3">
            <h2 className="text-error font-bold flex items-center gap-2">
              <AlertTriangle size={18} /> 🚨 장기 결석 집중 케어 명단
            </h2>
            <p className="text-xs text-error/80 font-medium">최근 4주간 단 한 번도 출석하지 않은 인원입니다.</p>
            <div className="flex flex-wrap gap-2 pt-2">
              {(isAdminOrPastor ? allAbsentees : myForestAbsentees).map((u: any) => (
                <span key={u.uid} className="bg-white text-error px-3 py-1.5 rounded-full text-xs font-bold border border-error/20 shadow-sm">
                  {u.name}{isAdminOrPastor ? ` (${forests.find((f:any)=>f.forest_id===u.forest_id)?.name||'?'})` : ''}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* OVERVIEW */}
        {selectedTab === 'overview' && (
          <>
            {isAdminOrPastor && (
              <section className="space-y-4">
                <h2 className="text-xl font-bold text-on-surface tracking-tight bg-gradient-to-r from-primary to-primary-dim text-transparent bg-clip-text">전체 숲 결산 대시보드</h2>
                <div className="space-y-3">
                  {forests.map((f: any) => {
                    const stats = getForestStats(f.forest_id);
                    return (
                      <div key={f.forest_id} className={`p-4 rounded-2xl border flex items-center justify-between shadow-sm transition-all ${stats.isSubmitted ? 'bg-surface-container-lowest border-surface-container-low' : 'bg-orange-50/50 border-orange-200'}`}>
                        <div className="flex flex-col">
                          <span className="font-bold text-on-surface flex items-center gap-2">
                            {f.name}
                            {!stats.isSubmitted && <span className="bg-orange-100 text-orange-600 text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap animate-pulse">결산 미제출 ⚠️</span>}
                          </span>
                          <span className="text-xs text-on-surface-variant font-medium mt-1">이번 주 심방: {stats.visitCount}건 | 기도제목: {stats.prayerCount}건</span>
                        </div>
                        <ChevronRight size={18} className="text-outline" />
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
            {!isAdminOrPastor && myForestId && (
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-on-surface tracking-tight">우리 숲 목양 현황</h2>
                  {getForestStats(myForestId).isSubmitted ? (
                    <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-[10px] font-bold border border-emerald-100">결산 제출됨 ✔️</span>
                  ) : (
                    <button onClick={() => handleSubmitSettlement(myForestId)} className="bg-primary text-on-primary px-3 py-1.5 rounded-full text-[10px] font-bold shadow-sm active:scale-95 transition-transform">
                      이번 주 결산 제출
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-surface-container-low flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center"><MessageSquare size={20} /></div>
                    <span className="text-xs font-bold text-on-surface-variant">이번 주 심방</span>
                    <span className="text-2xl font-black text-on-surface">{getForestStats(myForestId).visitCount}건</span>
                  </div>
                  <div className="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-surface-container-low flex flex-col items-center justify-center gap-2">
                    <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center"><Heart size={20} /></div>
                    <span className="text-xs font-bold text-on-surface-variant">신규 기도제목</span>
                    <span className="text-2xl font-black text-on-surface">{getForestStats(myForestId).prayerCount}건</span>
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        {/* CATEGORY */}
        {selectedTab === 'category' && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-on-surface tracking-tight">상담 분야별 현황</h2>
            <p className="text-xs text-on-surface-variant">전체 심방 {totalCatCount}건의 분야별 분류</p>
            <div className="space-y-3">
              {categoryCounts.map(cat => {
                const pct = totalCatCount > 0 ? Math.round((cat.count / totalCatCount) * 100) : 0;
                return (
                  <div key={cat.id} className="bg-surface-container-lowest p-4 rounded-2xl border border-surface-container-low shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{cat.icon}</span>
                        <span className="font-bold text-on-surface text-sm">{cat.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-on-surface-variant font-medium">{cat.count}건</span>
                        <span className="text-xs font-black text-primary">{pct}%</span>
                      </div>
                    </div>
                    <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
            {totalCatCount === 0 && (
              <div className="text-center py-12 text-on-surface-variant">
                <PieChart size={48} className="mx-auto mb-4 opacity-20" />
                <p className="text-sm font-medium">아직 심방 기록이 없습니다.</p>
              </div>
            )}
          </section>
        )}

        {/* TREND */}
        {selectedTab === 'trend' && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-on-surface tracking-tight">주간 심방 추세</h2>
            <p className="text-xs text-on-surface-variant">최근 6주 심방 활동 변화</p>
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container-low shadow-sm">
              <div className="flex items-end gap-2 h-32">
                {weeklyTrend.map((week, i) => {
                  const heightPct = maxTrend > 0 ? (week.count / maxTrend) * 100 : 0;
                  const isLatest = i === weeklyTrend.length - 1;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[9px] font-bold text-on-surface-variant">{week.count > 0 ? week.count : ''}</span>
                      <div className="w-full flex items-end justify-center" style={{ height: '80px' }}>
                        <div className={`w-full rounded-t-lg transition-all duration-700 ${isLatest ? 'bg-primary' : 'bg-primary/30'}`}
                          style={{ height: `${Math.max(heightPct, week.count > 0 ? 8 : 0)}%` }} />
                      </div>
                      <span className="text-[9px] text-on-surface-variant font-medium">{week.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {weeklyTrend.length >= 2 && (() => {
              const lastWeek = weeklyTrend[weeklyTrend.length - 2].count;
              const thisWeek = weeklyTrend[weeklyTrend.length - 1].count;
              const diff = thisWeek - lastWeek;
              return (
                <div className={`p-4 rounded-2xl border ${diff >= 0 ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-orange-50 border-orange-100 text-orange-700'}`}>
                  <p className="font-bold text-sm">
                    {diff > 0 ? `📈 이번 주 심방이 지난주보다 ${diff}건 증가했습니다!`
                     : diff < 0 ? `📉 이번 주 심방이 지난주보다 ${Math.abs(diff)}건 감소했습니다.`
                     : `➡️ 이번 주 심방이 지난주와 동일합니다.`}
                  </p>
                  <p className="text-xs mt-1 opacity-80">꾸준한 목양 활동이 공동체를 세웁니다.</p>
                </div>
              );
            })()}
          </section>
        )}
      </div>
    </div>
  );
};
"@

$combined = $before + $newContent.Split("`n")
[System.IO.File]::WriteAllLines($file, $combined, [System.Text.Encoding]::UTF8)
Write-Host "Done. Total lines: $($combined.Length)"
