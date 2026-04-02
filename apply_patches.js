const fs = require('fs');
const path = 'src/App.tsx';

let code = fs.readFileSync(path, 'utf8');
let changed = 0;

function replace(from, to) {
  if (code.includes(from)) {
    code = code.replace(from, to);
    changed++;
    console.log(`  ✓ patch ${changed} applied`);
  } else {
    console.error(`  ✗ PATCH FAILED: could not find target string (patch ${changed + 1})`);
    console.error('    First 80 chars:', JSON.stringify(from.substring(0, 80)));
  }
}

// ── PATCH 1: canSeePastoral includes pastor ───────────────────────────────────
replace(
  `const canSeePastoral = isAdminUser || userData?.role === 'leader';`,
  `const canSeePastoral = isAdminUser || userData?.role === 'pastor' || userData?.role === 'leader';`
);

// ── PATCH 2: pastoralQuery includes pastor ───────────────────────────────────
replace(
  `const pastoralQuery = isAdminUser \n        ? collection(firestoreDb, 'pastoral_records')`,
  `const pastoralQuery = (isAdminUser || userData?.role === 'pastor') \n        ? collection(firestoreDb, 'pastoral_records')`
);

// ── PATCH 3: settlementsQuery includes pastor ────────────────────────────────
replace(
  `const settlementsQuery = isAdminUser \n        ? collection(firestoreDb, 'weekly_settlements')`,
  `const settlementsQuery = (isAdminUser || userData?.role === 'pastor') \n        ? collection(firestoreDb, 'weekly_settlements')`
);

// ── PATCH 4: onMemberClick includes pastor ───────────────────────────────────
replace(
  `const canSeePastoral = currentUser?.role === 'admin' || (currentUser?.role === 'leader' && currentUser?.forest_id === u.forest_id);`,
  `const canSeePastoral = currentUser?.role === 'admin' || currentUser?.role === 'pastor' || (currentUser?.role === 'leader' && currentUser?.forest_id === u.forest_id);`
);

replace(
  `showToast('목양 카드는 숲지기와 관리자만 볼 수 있습니다.');`,
  `showToast('목양 카드는 숲지기, 목사님, 관리자만 볼 수 있습니다.');`
);

// ── PATCH 5: Role dropdown adds 목사님 ───────────────────────────────────────
replace(
  `                    <option value="leader">리더 (leader)</option>\r\n                    <option value="admin">관리자 (admin)</option>`,
  `                    <option value="leader">리더 (leader)</option>\r\n                    <option value="pastor">목사님 (pastor)</option>\r\n                    <option value="admin">관리자 (admin)</option>`
);

// ── PATCH 6: Replace entire PastoralCardModal ──────────────────────────────
const oldModal = /const PastoralCardModal = \(\{ targetUser, pastoralRecords[\s\S]*?\n\};\n\nconst PastoralStatsDashboardView/;

const newModal = `const VISIT_CATEGORIES = [
  { id: 'spiritual', label: '영적 돌봄', icon: '✝️', color: 'bg-purple-50 text-purple-600 border-purple-100' },
  { id: 'family', label: '가정/관계', icon: '🏠', color: 'bg-blue-50 text-blue-600 border-blue-100' },
  { id: 'job', label: '직장/진로', icon: '💼', color: 'bg-amber-50 text-amber-600 border-amber-100' },
  { id: 'finance', label: '재정', icon: '💰', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
  { id: 'health', label: '건강', icon: '🏥', color: 'bg-rose-50 text-rose-600 border-rose-100' },
  { id: 'other', label: '기타', icon: '📝', color: 'bg-surface-container text-on-surface-variant border-surface-container-high' },
];

const PastoralCardModal = ({ targetUser, pastoralRecords, onClose, currentUser, onShowToast, forests, attendance }: any) => {
  const [newLog, setNewLog] = useState('');
  const [logType, setLogType] = useState('meetup');
  const [logCategory, setLogCategory] = useState('spiritual');
  const [isSensitive, setIsSensitive] = useState(false);
  const [newPrayer, setNewPrayer] = useState('');

  const isPastorOrAdmin = currentUser?.role === 'admin' || currentUser?.role === 'pastor';

  const targetRecords = pastoralRecords
    .filter((r: any) => r.target_uid === targetUser.uid)
    .filter((r: any) => isPastorOrAdmin ? true : !r.is_sensitive)
    .sort((a: any, b: any) => b.createdAt?.seconds - a.createdAt?.seconds);

  const prayerRequests = targetRecords.filter((r: any) => r.type === 'prayer');
  const visitLogs = targetRecords.filter((r: any) => r.type !== 'prayer');
  const forestName = forests?.find((f: any) => f.forest_id === targetUser.forest_id)?.name || '소속 없음';
  const getCategoryInfo = (cat: string) => VISIT_CATEGORIES.find(c => c.id === cat) || VISIT_CATEGORIES[VISIT_CATEGORIES.length - 1];

  const handleAddLog = async () => {
    if (!newLog) return;
    try {
      await addDoc(collection(firestoreDb, 'pastoral_records'), {
        target_uid: targetUser.uid, author_uid: currentUser.uid,
        forest_id: targetUser.forest_id, type: logType,
        category: logCategory, content: newLog,
        is_sensitive: isSensitive,
        date: new Date().toISOString().split('T')[0],
        createdAt: Timestamp.now()
      });
      setNewLog(''); setIsSensitive(false);
      onShowToast('심방 기록이 추가되었습니다.');
    } catch (err) { console.error(err); onShowToast('오류가 발생했습니다.'); }
  };

  const handleAddPrayer = async () => {
    if (!newPrayer) return;
    try {
      await addDoc(collection(firestoreDb, 'pastoral_records'), {
        target_uid: targetUser.uid, author_uid: currentUser.uid,
        forest_id: targetUser.forest_id, type: 'prayer',
        content: newPrayer, is_sensitive: false, status: 'active',
        createdAt: Timestamp.now()
      });
      setNewPrayer('');
      onShowToast('기도제목이 추가되었습니다.');
    } catch (err) { console.error(err); }
  };

  const togglePrayerStatus = async (id: string, currentStatus: string) => {
    try {
      await updateDoc(doc(firestoreDb, 'pastoral_records', id), {
        status: currentStatus === 'active' ? 'resolved' : 'active'
      });
    } catch (err) { console.error(err); }
  };

  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const targetAttendance = attendance.filter((a: any) =>
    a.uid === targetUser.uid && a.date?.seconds && new Date(a.date.seconds * 1000) > fourWeeksAgo
  );
  const missedWeeks = 4 - targetAttendance.length;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-surface overflow-y-auto w-full max-w-md mx-auto shadow-2xl">
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface-container-highest">
        <div className="flex items-center justify-between px-2 py-3">
          <div className="flex items-center">
            <button onClick={onClose} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-lg font-bold tracking-tight text-on-surface ml-2">목양 카드</h1>
          </div>
          {!isPastorOrAdmin && (
            <span className="mr-3 text-[10px] bg-surface-container text-on-surface-variant px-2 py-1 rounded-full font-bold">민감기록 제외됨</span>
          )}
        </div>
      </header>
      <div className="p-6 space-y-6 pb-32">
        <div className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-surface-container-low flex items-center gap-5">
          <div className="w-16 h-16 shrink-0">
            {targetUser.profile_image ? (
              <img src={targetUser.profile_image} alt={targetUser.name} className="w-full h-full rounded-full object-cover shadow-inner" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full bg-surface-container-high rounded-full flex items-center justify-center font-bold text-2xl text-on-surface">
                {targetUser.name.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold text-on-surface">{targetUser.name}</h2>
            <p className="text-sm font-medium text-on-surface-variant mt-1">{forestName} · {targetUser.role === 'leader' ? '숲지기' : '멤버'}</p>
            {targetUser.ministry && <span className="bg-primary/10 text-primary px-2.5 py-0.5 rounded-full text-[10px] font-bold w-fit mt-2">{targetUser.ministry}</span>}
          </div>
        </div>
        <section className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-surface-container-low space-y-4">
          <h3 className="font-bold text-on-surface flex items-center gap-2">
            <Calendar size={18} className="text-primary" /> 최근 4주 출석
          </h3>
          <div className="flex items-center justify-between bg-surface-container p-4 rounded-xl">
            <div className="flex flex-col">
              <span className="text-2xl font-black text-on-surface">{targetAttendance.length}회 <span className="text-sm font-medium text-on-surface-variant line-through opacity-70">/ 4회</span></span>
              <span className="text-xs text-on-surface-variant font-bold mt-1">최근 한 달 기준</span>
            </div>
            {missedWeeks >= 3 ? (
              <div className="bg-error/10 text-error px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-bold text-xs shadow-sm">
                <span className="animate-pulse">🚨</span> 장기 결석 주의
              </div>
            ) : missedWeeks === 0 ? (
              <div className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-lg font-bold text-xs shadow-sm">개근 멤버</div>
            ) : null}
          </div>
        </section>
        <section className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-surface-container-low space-y-4">
          <h3 className="font-bold text-on-surface flex items-center gap-2">
            <Heart size={18} className="text-rose-500" /> 기도제목
          </h3>
          <div className="flex gap-2">
            <input type="text" value={newPrayer} onChange={e => setNewPrayer(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddPrayer()} placeholder="새 기도제목 입력..." className="flex-1 bg-surface-container p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary" />
            <button onClick={handleAddPrayer} className="bg-primary text-on-primary px-4 rounded-xl font-bold active:scale-95 transition-transform"><Plus size={20}/></button>
          </div>
          <div className="space-y-2 mt-2">
            {prayerRequests.map((p: any) => (
              <div key={p.id} className="flex items-start gap-3 p-3 bg-surface-container-lowest border border-surface-container-low rounded-xl">
                <button onClick={() => togglePrayerStatus(p.id, p.status)} className={\`mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 border transition-colors \${p.status === 'resolved' ? 'bg-primary border-primary text-white' : 'border-outline-variant text-transparent hover:border-primary'}\`}>
                  <CheckCircle2 size={14} />
                </button>
                <div className={\`flex-1 text-sm \${p.status === 'resolved' ? 'text-on-surface-variant line-through opacity-70' : 'text-on-surface'}\`}>{p.content}</div>
              </div>
            ))}
            {prayerRequests.length === 0 && <p className="text-xs text-on-surface-variant text-center py-4">등록된 기도제목이 없습니다.</p>}
          </div>
        </section>
        <section className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-surface-container-low space-y-4">
          <h3 className="font-bold text-on-surface flex items-center gap-2">
            <MessageSquare size={18} className="text-blue-500" /> 심방/상담 기록
          </h3>
          <div className="space-y-3 bg-surface-container p-4 rounded-xl">
            <div>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase mb-2">연락 방법</p>
              <div className="flex gap-2 flex-wrap">
                {(['meetup', 'call', 'other'] as const).map(t => (
                  <button key={t} onClick={() => setLogType(t)} className={\`px-3 py-1.5 rounded-lg text-xs font-bold transition-all \${logType === t ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:bg-white/50'}\`}>
                    {t === 'meetup' ? '📍 대면' : t === 'call' ? '📞 전화/카톡' : '💬 기타'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase mb-2">상담 분야</p>
              <div className="grid grid-cols-3 gap-2">
                {VISIT_CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => setLogCategory(cat.id)}
                    className={\`flex items-center gap-1.5 px-2 py-2 rounded-xl text-xs font-bold border transition-all \${logCategory === cat.id ? 'bg-white shadow-sm border-primary text-primary' : 'bg-white/50 border-transparent text-on-surface-variant'}\`}>
                    <span>{cat.icon}</span><span className="truncate">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <textarea value={newLog} onChange={e => setNewLog(e.target.value)} placeholder="심방 내용을 기록해주세요..." className="w-full bg-white p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary min-h-[80px] resize-none" />
            {isPastorOrAdmin && (
              <button onClick={() => setIsSensitive(!isSensitive)}
                className={\`w-full flex items-center justify-between p-3 rounded-xl border transition-all \${isSensitive ? 'bg-red-50 border-red-200 text-red-700' : 'bg-surface-container-lowest border-surface-container-low text-on-surface-variant'}\`}>
                <div className="flex items-center gap-2 text-xs font-bold">
                  <Lock size={14} /><span>목사님/관리자 전용 민감 기록</span>
                </div>
                <div className={\`w-10 h-5 rounded-full transition-colors relative \${isSensitive ? 'bg-red-500' : 'bg-surface-container-high'}\`}>
                  <div className={\`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform \${isSensitive ? 'translate-x-5' : 'translate-x-0.5'}\`} />
                </div>
              </button>
            )}
            <button onClick={handleAddLog} className="w-full bg-primary-container text-on-primary-container py-3 rounded-xl font-bold text-sm active:scale-95 transition-transform flex items-center justify-center gap-2">
              <FileEdit size={16} /> 기록 저장
            </button>
          </div>
          <div className="space-y-4 mt-6">
            {visitLogs.map((log: any) => {
              const catInfo = getCategoryInfo(log.category);
              return (
                <div key={log.id} className="relative pl-6 border-l-2 border-surface-container-low pb-4 last:pb-0">
                  <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-surface-container-lowest border-2 border-primary flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  </div>
                  <div className={\`bg-surface-container-lowest border p-4 rounded-xl shadow-sm \${log.is_sensitive ? 'border-red-200 bg-red-50/30' : 'border-surface-container-low'}\`}>
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase">
                          {log.type === 'meetup' ? '📍 대면' : log.type === 'call' ? '📞 전화' : '💬 기타'}
                        </span>
                        {log.category && (
                          <span className={\`text-[10px] font-bold px-2 py-0.5 rounded border \${catInfo.color}\`}>
                            {catInfo.icon} {catInfo.label}
                          </span>
                        )}
                        {log.is_sensitive && isPastorOrAdmin && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
                            <Lock size={8} /> 민감
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-on-surface-variant font-medium">{log.date}</span>
                    </div>
                    <p className="text-sm text-on-surface leading-relaxed">{log.content}</p>
                  </div>
                </div>
              );
            })}
            {visitLogs.length === 0 && <p className="text-xs text-on-surface-variant text-center py-4">아직 심방 기록이 없습니다.</p>}
          </div>
        </section>
      </div>
    </div>
  );
};

const PastoralStatsDashboardView`;

if (oldModal.test(code)) {
  code = code.replace(oldModal, newModal);
  changed++;
  console.log(`  ✓ PastoralCardModal replaced (patch ${changed})`);
} else {
  console.error('  ✗ Could not match PastoralCardModal pattern');
}

// ── PATCH 7: Replace PastoralStatsDashboardView ──────────────────────────────
const oldStats = /const PastoralStatsDashboardView = \(\{ user, users[\s\S]*$/;

const newStats = `const PastoralStatsDashboardView = ({ user, users, forests, attendance, pastoralRecords, weeklySettlements, onBack, onShowToast }: any) => {
  const isAdminOrPastor = user?.role === 'admin' || user?.role === 'pastor';
  const isAdmin = user?.role === 'admin';
  const myForestId = user?.forest_id;
  const [selectedTab, setSelectedTab] = useState<'overview'|'category'|'trend'>('overview');

  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
  weekStart.setHours(0,0,0,0);
  const fourWeeksAgo = new Date(); fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const weekStr = \`\${weekStart.getFullYear()}-\${String(weekStart.getMonth()+1).padStart(2,'0')}-\${String(weekStart.getDate()).padStart(2,'0')}\`;

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
  })).sort((a,b) => b.count - a.count);
  const totalCatCount = categoryCounts.reduce((s,c) => s + c.count, 0);

  const weeklyTrend = Array.from({ length: 6 }, (_, i) => {
    const wStart = new Date();
    wStart.setDate(wStart.getDate() - wStart.getDay() + (wStart.getDay()===0?-6:1) - i*7);
    wStart.setHours(0,0,0,0);
    const wEnd = new Date(wStart); wEnd.setDate(wEnd.getDate()+7);
    const label = \`\${wStart.getMonth()+1}/\${wStart.getDate()}\`;
    return { label, count: scopeRecords.filter((r: any) =>
      r.createdAt?.seconds && new Date(r.createdAt.seconds*1000) >= wStart && new Date(r.createdAt.seconds*1000) < wEnd
    ).length };
  }).reverse();
  const maxTrend = Math.max(...weeklyTrend.map(w=>w.count), 1);

  const visibleAbsentees = isAdminOrPastor ? getAbsentees(null) : getAbsentees(myForestId);

  return (
    <div className="absolute inset-0 bg-surface z-[60] flex flex-col min-h-screen overflow-y-auto pb-24">
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface-container-highest">
        <div className="flex items-center px-2 py-3">
          <button onClick={onBack} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors"><ChevronLeft size={24} /></button>
          <div className="flex flex-col ml-2">
            <h1 className="text-lg font-bold tracking-tight text-on-surface">목양 결산 통계</h1>
            <span className="text-[10px] text-primary font-bold">{weekStr} 주간</span>
          </div>
        </div>
        <div className="flex gap-1 px-4 pb-3">
          {([['overview','현황'],['category','분야별'],['trend','추세']] as const).map(([tab,label]) => (
            <button key={tab} onClick={() => setSelectedTab(tab)}
              className={\`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all \${selectedTab===tab?'bg-primary text-on-primary shadow-sm':'bg-surface-container text-on-surface-variant'}\`}>
              {label}
            </button>
          ))}
        </div>
      </header>
      <div className="p-6 space-y-6">
        {visibleAbsentees.length > 0 && (
          <section className="bg-error/10 border border-error/20 p-5 rounded-2xl shadow-sm space-y-3">
            <h2 className="text-error font-bold flex items-center gap-2"><AlertTriangle size={18} /> 🚨 장기 결석 집중 케어 명단</h2>
            <p className="text-xs text-error/80 font-medium">최근 4주간 단 한 번도 출석하지 않은 인원입니다. 신속한 심방을 요합니다.</p>
            <div className="flex flex-wrap gap-2 pt-2">
              {visibleAbsentees.map((u: any) => (
                <span key={u.uid} className="bg-white text-error px-3 py-1.5 rounded-full text-xs font-bold border border-error/20 shadow-sm">
                  {u.name}{isAdminOrPastor?\` (\${forests.find((f:any)=>f.forest_id===u.forest_id)?.name||'?'})\`:''}
                </span>
              ))}
            </div>
          </section>
        )}

        {selectedTab === 'overview' && (
          <>
            {isAdminOrPastor && (
              <section className="space-y-4">
                <h2 className="text-xl font-bold text-on-surface tracking-tight bg-gradient-to-r from-primary to-primary-dim text-transparent bg-clip-text">전체 숲 결산 대시보드</h2>
                <div className="space-y-3">
                  {forests.map((f: any) => {
                    const stats = getForestStats(f.forest_id);
                    return (
                      <div key={f.forest_id} className={\`p-4 rounded-2xl border flex items-center justify-between shadow-sm transition-all \${stats.isSubmitted?'bg-surface-container-lowest border-surface-container-low':'bg-orange-50/50 border-orange-200'}\`}>
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
                    <button onClick={() => handleSubmitSettlement(myForestId)} className="bg-primary text-on-primary px-3 py-1.5 rounded-full text-[10px] font-bold shadow-sm active:scale-95 transition-transform">이번 주 결산 제출</button>
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

        {selectedTab === 'category' && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-on-surface tracking-tight">상담 분야별 현황</h2>
            <p className="text-xs text-on-surface-variant">전체 심방 {totalCatCount}건의 분야별 분류</p>
            <div className="space-y-3">
              {categoryCounts.map(cat => {
                const pct = totalCatCount > 0 ? Math.round((cat.count/totalCatCount)*100) : 0;
                return (
                  <div key={cat.id} className="bg-surface-container-lowest p-4 rounded-2xl border border-surface-container-low shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2"><span className="text-xl">{cat.icon}</span><span className="font-bold text-on-surface text-sm">{cat.label}</span></div>
                      <div className="flex items-center gap-2"><span className="text-xs text-on-surface-variant font-medium">{cat.count}건</span><span className="text-xs font-black text-primary">{pct}%</span></div>
                    </div>
                    <div className="w-full bg-surface-container rounded-full h-2 overflow-hidden">
                      <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: \`\${pct}%\` }} />
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

        {selectedTab === 'trend' && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-on-surface tracking-tight">주간 심방 추세</h2>
            <p className="text-xs text-on-surface-variant">최근 6주 심방 활동 변화</p>
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container-low shadow-sm">
              <div className="flex items-end gap-2 h-32">
                {weeklyTrend.map((week, i) => {
                  const heightPct = (week.count/maxTrend)*100;
                  const isLatest = i === weeklyTrend.length-1;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[9px] font-bold text-on-surface-variant">{week.count>0?week.count:''}</span>
                      <div className="w-full flex items-end justify-center" style={{ height:'80px' }}>
                        <div className={\`w-full rounded-t-lg transition-all duration-700 \${isLatest?'bg-primary':'bg-primary/30'}\`}
                          style={{ height:\`\${Math.max(heightPct,week.count>0?8:0)}%\` }} />
                      </div>
                      <span className="text-[9px] text-on-surface-variant font-medium">{week.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            {(() => {
              const last = weeklyTrend[weeklyTrend.length-2]?.count||0;
              const cur = weeklyTrend[weeklyTrend.length-1]?.count||0;
              const diff = cur - last;
              return (
                <div className={\`p-4 rounded-2xl border \${diff>=0?'bg-emerald-50 border-emerald-100 text-emerald-700':'bg-orange-50 border-orange-100 text-orange-700'}\`}>
                  <p className="font-bold text-sm">
                    {diff>0?\`📈 이번 주 심방이 지난주보다 \${diff}건 증가했습니다!\`:diff<0?\`📉 이번 주 심방이 지난주보다 \${Math.abs(diff)}건 감소했습니다.\`:\`➡️ 이번 주 심방이 지난주와 동일합니다.\`}
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
};`;

if (oldStats.test(code)) {
  code = code.replace(oldStats, newStats);
  changed++;
  console.log(`  ✓ PastoralStatsDashboardView replaced (patch ${changed})`);
} else {
  console.error('  ✗ Could not match PastoralStatsDashboardView');
}

fs.writeFileSync(path, code, 'utf8');
console.log(`\nAll done. ${changed} patch(es) applied.`);
