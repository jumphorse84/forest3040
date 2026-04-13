import React, { useState } from 'react';
import {
  ChevronRight, ChevronLeft, Heart, MessageSquare, AlertTriangle,
  PieChart, TrendingUp, Bell, ChevronDown, ChevronUp, Users, CheckCircle2
} from 'lucide-react';
import { collection, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db as firestoreDb } from '../firebase';
import { VISIT_CATEGORIES } from '../components/PastoralCardModal';

// ───────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────
function getWeekStart(offsetWeeks = 0) {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1) + offsetWeeks * 7);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toWeekStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ───────────────────────────────────────────────
// Component
// ───────────────────────────────────────────────
const PastoralStatsDashboardView = ({
  user, users, forests, attendance, pastoralRecords, weeklySettlements, onBack, onShowToast
}: any) => {
  const isAdminOrPastor = user?.role === 'admin' || user?.role === 'pastor';
  const myForestId = user?.forest_id;

  // ── Week navigation ──
  const [weekOffset, setWeekOffset] = useState(0); // 0 = this week, -1 = last week ...
  const weekStart = getWeekStart(weekOffset);
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 7);
  const weekStr = toWeekStr(weekStart);
  const weekLabel = `${weekStart.getMonth() + 1}/${weekStart.getDate()} ~ ${weekEnd.getMonth() + 1}/${weekEnd.getDate() - 1}`;
  const isCurrentWeek = weekOffset === 0;

  // ── Tabs ──
  const [selectedTab, setSelectedTab] = useState<'overview' | 'attendance' | 'category' | 'trend'>('overview');

  // ── Accordion ──
  const [expandedForestId, setExpandedForestId] = useState<string | null>(null);

  // ── Sending notification state ──
  const [sendingForestId, setSendingForestId] = useState<string | null>(null);

  // ───────────────────────────────
  // Data helpers
  // ───────────────────────────────
  const membersOnly = users.filter((u: any) => u.role !== 'admin' && u.role !== 'pastor');

  /** Get attendance status for a range */
  const getAttendanceStatus = (forestId: string | null) => {
    const list = forestId ? membersOnly.filter((u: any) => u.forest_id === forestId) : membersOnly;

    const threeWeeksAgo = new Date(weekStart);
    threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 14);

    const thisWeekAbsentees = list.filter((u: any) => {
      const attended = attendance.some((a: any) => {
        if (!a.date?.seconds) return false;
        const d = new Date(a.date.seconds * 1000);
        return d >= weekStart && d < weekEnd && a.type !== '결석' && a.uid === u.uid;
      });
      return !attended;
    }).map((u: any) => {
      const absentRec = attendance.find((a: any) => {
        if (!a.date?.seconds) return false;
        const d = new Date(a.date.seconds * 1000);
        return d >= weekStart && d < weekEnd && a.type === '결석' && a.uid === u.uid;
      });
      return { ...u, absentReason: absentRec?.reason || '' };
    });

    const thisWeekAttendees = list.filter((u: any) =>
      attendance.some((a: any) => {
        if (!a.date?.seconds) return false;
        const d = new Date(a.date.seconds * 1000);
        return d >= weekStart && d < weekEnd && a.type !== '결석' && a.uid === u.uid;
      })
    );

    const longTermAbsentees = list.filter((u: any) => {
      const hasAny = attendance.some((a: any) => {
        if (!a.date?.seconds) return false;
        const d = new Date(a.date.seconds * 1000);
        return d >= threeWeeksAgo && d < weekEnd && a.type !== '결석' && a.uid === u.uid;
      });
      return !hasAny;
    });

    const total = list.length;
    const attendedCount = thisWeekAttendees.length;
    const rate = total > 0 ? Math.round((attendedCount / total) * 100) : 0;

    return { thisWeekAbsentees, thisWeekAttendees, longTermAbsentees, total, attendedCount, rate };
  };

  const scopeStatus = isAdminOrPastor ? getAttendanceStatus(null) : getAttendanceStatus(myForestId);
  const { thisWeekAbsentees: currentWeekAbsentees, longTermAbsentees: visibleAbsentees } = scopeStatus;

  // Pastoral records scoped to selected week
  const thisWeekRecords = pastoralRecords.filter((r: any) =>
    r.createdAt?.seconds && new Date(r.createdAt.seconds * 1000) >= weekStart && new Date(r.createdAt.seconds * 1000) < weekEnd
  );

  const getForestStats = (fid: string) => {
    const fRecords = thisWeekRecords.filter((r: any) => r.forest_id === fid);
    const fStatus = getAttendanceStatus(fid);
    return {
      visitCount: fRecords.filter((r: any) => r.type !== 'prayer').length,
      prayerCount: fRecords.filter((r: any) => r.type === 'prayer').length,
      isSubmitted: weeklySettlements.some((s: any) => s.forest_id === fid && s.week === weekStr),
      ...fStatus,
    };
  };

  // Category stats
  const scopeRecords = isAdminOrPastor
    ? pastoralRecords.filter((r: any) => r.type !== 'prayer')
    : pastoralRecords.filter((r: any) => r.type !== 'prayer' && r.forest_id === myForestId);
  const categoryCounts = VISIT_CATEGORIES.map((cat: any) => ({
    ...cat, count: scopeRecords.filter((r: any) => r.category === cat.id).length
  })).sort((a: any, b: any) => b.count - a.count);
  const totalCatCount = categoryCounts.reduce((s: number, c: any) => s + c.count, 0);

  // Trend
  const weeklyTrend = Array.from({ length: 6 }, (_, i) => {
    const wStart = getWeekStart(-(5 - i));
    const wEnd = new Date(wStart); wEnd.setDate(wEnd.getDate() + 7);
    const label = `${wStart.getMonth() + 1}/${wStart.getDate()}`;
    const count = scopeRecords.filter((r: any) =>
      r.createdAt?.seconds && new Date(r.createdAt.seconds * 1000) >= wStart && new Date(r.createdAt.seconds * 1000) < wEnd
    ).length;

    // attendance rate for that week
    const total = (isAdminOrPastor ? membersOnly : membersOnly.filter((u: any) => u.forest_id === myForestId)).length;
    const attended = attendance.filter((a: any) => {
      if (!a.date?.seconds || a.type === '결석') return false;
      const d = new Date(a.date.seconds * 1000);
      return d >= wStart && d < wEnd;
    }).length;
    const rate = total > 0 ? Math.round((attended / total) * 100) : 0;

    return { label, count, rate };
  });
  const maxTrend = Math.max(...weeklyTrend.map(w => w.count), 1);

  // ───────────────────────────────
  // Actions
  // ───────────────────────────────
  const handleSubmitSettlement = async (targetForestId: string) => {
    try {
      await addDoc(collection(firestoreDb, 'weekly_settlements'), {
        forest_id: targetForestId, week: weekStr, status: 'submitted',
        submittedAt: Timestamp.now(), submittedBy: user.uid
      });
      onShowToast('주간 결산이 제출되었습니다.');
    } catch (e) { console.error(e); onShowToast('결산 제출 중 오류가 발생했습니다.'); }
  };

  const handleCancelSettlement = async (targetForestId: string) => {
    try {
      if (!window.confirm('제출된 결산을 취소하고 다시 수정하시겠습니까?')) return;
      const settlement = weeklySettlements.find((s: any) => s.forest_id === targetForestId && s.week === weekStr);
      if (settlement?.id) {
        await deleteDoc(doc(firestoreDb, 'weekly_settlements', settlement.id));
        onShowToast('결산 제출이 취소되었습니다.');
      }
    } catch (e) { console.error(e); onShowToast('결산 취소 중 오류가 발생했습니다.'); }
  };

  const handleSendReminder = async (forest: any) => {
    if (!window.confirm(`${forest.name} 리더에게 결산 미제출 알림을 보내시겠습니까?`)) return;
    setSendingForestId(forest.forest_id);
    try {
      await addDoc(collection(firestoreDb, 'notifications'), {
        uid: forest.leader_uid,
        type: 'settlement_reminder',
        title: '⚠️ 주간 결산 미제출 알림',
        message: `${weekLabel} 주간 결산이 아직 제출되지 않았습니다. 빠른 제출을 부탁드립니다.`,
        createdAt: Timestamp.now(),
        isRead: false,
        from: user.uid,
        forest_id: forest.forest_id,
      });
      onShowToast(`${forest.name} 리더에게 알림을 발송했습니다.`);
    } catch (e) { console.error(e); onShowToast('알림 발송 중 오류가 발생했습니다.'); }
    setSendingForestId(null);
  };

  // ───────────────────────────────
  // Render helpers
  // ───────────────────────────────
  const AttendanceRingSmall = ({ rate, size = 44 }: { rate: number; size?: number }) => {
    const r = 16; const circ = 2 * Math.PI * r;
    const filled = circ * (rate / 100);
    const color = rate >= 80 ? '#22c55e' : rate >= 60 ? '#f59e0b' : '#ef4444';
    return (
      <svg width={size} height={size} viewBox="0 0 44 44">
        <circle cx="22" cy="22" r={r} fill="none" stroke="#e5e7eb" strokeWidth="5" />
        <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={`${filled} ${circ - filled}`}
          strokeLinecap="round" transform="rotate(-90 22 22)" />
        <text x="22" y="22" textAnchor="middle" dominantBaseline="central"
          fontSize="8" fontWeight="bold" fill={color}>{rate}%</text>
      </svg>
    );
  };

  // ───────────────────────────────
  // JSX
  // ───────────────────────────────
  return (
    <div className="absolute inset-0 bg-surface z-[60] flex flex-col min-h-screen overflow-y-auto pb-24">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-surface/90 backdrop-blur-md border-b border-surface-container-highest">
        <div className="flex items-center px-2 py-3">
          <button onClick={onBack} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <div className="flex flex-col ml-2 flex-1">
            <h1 className="text-lg font-bold tracking-tight text-on-surface">목양 결산 통계</h1>
          </div>
          {/* Week navigation */}
          <div className="flex items-center gap-1 bg-surface-container rounded-xl px-2 py-1">
            <button onClick={() => setWeekOffset(w => w - 1)} className="p-1 rounded-lg hover:bg-surface-container-low transition-colors">
              <ChevronLeft size={14} />
            </button>
            <span className="text-[11px] font-bold text-primary min-w-[90px] text-center">{weekLabel}</span>
            <button
              onClick={() => setWeekOffset(w => Math.min(w + 1, 0))}
              disabled={isCurrentWeek}
              className="p-1 rounded-lg hover:bg-surface-container-low transition-colors disabled:opacity-30"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pb-3">
          {([['overview', '현황'], ['attendance', '출결'], ['category', '분야별'], ['trend', '추세']] as const).map(([tab, label]) => (
            <button key={tab} onClick={() => setSelectedTab(tab)}
              className={`flex-1 py-1.5 text-[11px] font-bold rounded-xl transition-all ${selectedTab === tab ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-on-surface-variant'}`}>
              {label}
            </button>
          ))}
        </div>
      </header>

      <div className="p-4 space-y-5">

        {/* ═══════════════════════════════════
            TAB: OVERVIEW
        ═══════════════════════════════════ */}
        {selectedTab === 'overview' && (
          <>
            {/* Summary chips */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-surface-container-lowest rounded-2xl p-3 flex flex-col items-center border border-surface-container-low shadow-sm">
                <Users size={18} className="text-primary mb-1" />
                <span className="text-xl font-black text-on-surface">{scopeStatus.attendedCount}</span>
                <span className="text-[10px] text-on-surface-variant font-medium">출석</span>
              </div>
              <div className="bg-surface-container-lowest rounded-2xl p-3 flex flex-col items-center border border-rose-100 shadow-sm">
                <AlertTriangle size={18} className="text-rose-500 mb-1" />
                <span className="text-xl font-black text-rose-600">{currentWeekAbsentees.length}</span>
                <span className="text-[10px] text-on-surface-variant font-medium">결석</span>
              </div>
              <div className="bg-surface-container-lowest rounded-2xl p-3 flex flex-col items-center border border-surface-container-low shadow-sm">
                <AttendanceRingSmall rate={scopeStatus.rate} />
                <span className="text-[10px] text-on-surface-variant font-medium mt-1">출석률</span>
              </div>
            </div>

            {/* This week absentees w/ reasons */}
            {currentWeekAbsentees.length > 0 && (
              <section className="bg-surface-container-lowest border border-surface-container-low p-4 rounded-2xl shadow-sm space-y-3">
                <h2 className="text-sm font-bold text-on-surface flex items-center gap-2">
                  <span className="text-base">📭</span> 이번 주 결석자 사유 현황
                  <span className="ml-auto text-xs text-on-surface-variant font-normal">{currentWeekAbsentees.length}명</span>
                </h2>
                <div className="flex flex-col gap-2">
                  {currentWeekAbsentees.map((u: any) => (
                    <div key={u.uid} className="flex items-center justify-between p-2.5 bg-rose-50/50 rounded-xl border border-rose-100">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-on-surface">{u.name}</span>
                        {isAdminOrPastor && <span className="text-[10px] text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded">{forests.find((f: any) => f.forest_id === u.forest_id)?.name || '?'}</span>}
                      </div>
                      {u.absentReason
                        ? <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg border border-rose-100">{u.absentReason}</span>
                        : <span className="text-[10px] text-on-surface-variant opacity-60 italic">사유 미입력</span>
                      }
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Long-term absentees */}
            {visibleAbsentees.length > 0 && (
              <section className="bg-error/10 border border-error/20 p-4 rounded-2xl shadow-sm space-y-3">
                <h2 className="text-sm text-error font-bold flex items-center gap-2">
                  <AlertTriangle size={16} /> 🚨 장기결석 집중 케어 명단
                </h2>
                <p className="text-xs text-error/80 font-medium">연속 3주 이상 결석한 인원입니다. 신속한 심방이 필요합니다.</p>
                <div className="flex flex-wrap gap-2">
                  {visibleAbsentees.map((u: any) => (
                    <span key={u.uid} className="bg-white text-error px-3 py-1.5 rounded-full text-xs font-bold border border-error/20 shadow-sm">
                      {u.name}{isAdminOrPastor ? ` (${forests.find((f: any) => f.forest_id === u.forest_id)?.name || '?'})` : ''}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Admin: All-forest dashboard */}
            {isAdminOrPastor && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-on-surface">전체 숲 결산 대시보드</h2>
                  <span className="text-[10px] text-on-surface-variant">
                    {forests.filter((f: any) => getForestStats(f.forest_id).isSubmitted).length}/{forests.length} 제출 완료
                  </span>
                </div>
                <div className="space-y-2">
                  {forests.map((f: any) => {
                    const stats = getForestStats(f.forest_id);
                    const isExpanded = expandedForestId === f.forest_id;
                    const fAbsentees = currentWeekAbsentees.filter((u: any) => u.forest_id === f.forest_id);
                    const fRecords = thisWeekRecords.filter((r: any) => r.forest_id === f.forest_id);

                    return (
                      <div key={f.forest_id} className={`rounded-2xl border shadow-sm transition-all overflow-hidden ${stats.isSubmitted ? 'bg-surface-container-lowest border-surface-container-low' : 'bg-orange-50/60 border-orange-200'}`}>
                        {/* Row */}
                        <div onClick={() => setExpandedForestId(isExpanded ? null : f.forest_id)}
                          className="p-3.5 flex items-center gap-3 cursor-pointer">
                          <AttendanceRingSmall rate={stats.rate} size={40} />
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-on-surface flex items-center gap-1.5 flex-wrap text-sm">
                              {f.name}
                              {stats.isSubmitted
                                ? <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold">제출완료</span>
                                : <span className="text-[9px] bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full animate-pulse font-bold">미제출⚠️</span>
                              }
                            </span>
                            <span className="text-[10px] text-on-surface-variant">심방 {stats.visitCount}건 · 결석 {fAbsentees.length}명</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Reminder bell - only show for unsubmitted */}
                            {!stats.isSubmitted && isAdminOrPastor && f.leader_uid && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleSendReminder(f); }}
                                disabled={sendingForestId === f.forest_id}
                                className="p-1.5 rounded-full bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors"
                                title="결산 미제출 알림 보내기"
                              >
                                <Bell size={13} />
                              </button>
                            )}
                            {isExpanded ? <ChevronUp size={16} className="text-outline" /> : <ChevronDown size={16} className="text-outline" />}
                          </div>
                        </div>

                        {/* Expanded detail */}
                        {isExpanded && (
                          <div className="border-t border-surface-container-low p-4 bg-surface/50 space-y-4">
                            {/* Absentees */}
                            <div>
                              <p className="text-[11px] font-bold text-on-surface-variant mb-2">📭 결석 현황</p>
                              {fAbsentees.length > 0 ? (
                                <ul className="space-y-1">
                                  {fAbsentees.map((u: any) => (
                                    <li key={u.uid} className="flex items-center justify-between text-xs bg-white/60 p-2 rounded-lg">
                                      <span className="font-medium text-on-surface">{u.name}</span>
                                      {u.absentReason
                                        ? <span className="text-rose-600 font-bold">{u.absentReason}</span>
                                        : <span className="text-on-surface-variant opacity-60">미입력</span>
                                      }
                                    </li>
                                  ))}
                                </ul>
                              ) : <p className="text-xs text-emerald-600 font-medium py-1">🎉 전원 출석!</p>}
                            </div>
                            {/* Pastoral records */}
                            <div>
                              <p className="text-[11px] font-bold text-on-surface-variant mb-2">📝 신규 심방 기록 ({fRecords.length}건)</p>
                              {fRecords.length > 0 ? (
                                <ul className="space-y-1.5">
                                  {fRecords.slice(0, 5).map((r: any) => (
                                    <li key={r.id} className="text-[10px] bg-white/60 p-2 rounded-lg">
                                      <span className="font-bold">{r.type === 'prayer' ? '🙏' : '📝'} {users.find((u: any) => u.uid === r.target_uid)?.name}</span>
                                      <span className="text-on-surface-variant ml-1 line-clamp-1">{r.notes}</span>
                                    </li>
                                  ))}
                                  {fRecords.length > 5 && <li className="text-[10px] text-center text-on-surface-variant">+ 외 {fRecords.length - 5}건</li>}
                                </ul>
                              ) : <p className="text-xs text-on-surface-variant italic py-1">작성된 심방 카드가 없습니다.</p>}
                            </div>
                            {/* Settlement remind button inside expanded */}
                            {!stats.isSubmitted && (
                              <button
                                onClick={() => handleSendReminder(f)}
                                disabled={sendingForestId === f.forest_id}
                                className="w-full flex items-center justify-center gap-2 py-2 bg-orange-100 text-orange-700 rounded-xl text-xs font-bold hover:bg-orange-200 transition-colors"
                              >
                                <Bell size={13} /> {sendingForestId === f.forest_id ? '발송 중...' : '결산 미제출 알림 발송'}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Leader/admin with forest: My forest stats + submit */}
            {myForestId && (
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-on-surface">우리 숲 목양 현황</h2>
                  {getForestStats(myForestId).isSubmitted ? (
                    <button onClick={() => handleCancelSettlement(myForestId)}
                      className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-full text-[10px] font-bold border border-emerald-100 shadow-sm active:scale-95 transition-transform hover:bg-emerald-100 flex items-center gap-1">
                      <CheckCircle2 size={12} /> 결산 제출됨 (취소)
                    </button>
                  ) : (
                    <button onClick={() => handleSubmitSettlement(myForestId)}
                      className="bg-primary text-on-primary px-3 py-1.5 rounded-full text-[10px] font-bold shadow-sm active:scale-95 transition-transform">
                      이번 주 결산 제출
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-surface-container-low flex flex-col items-center gap-1">
                    <MessageSquare size={18} className="text-blue-500" />
                    <span className="text-xl font-black text-on-surface">{getForestStats(myForestId).visitCount}</span>
                    <span className="text-[10px] text-on-surface-variant">심방</span>
                  </div>
                  <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-surface-container-low flex flex-col items-center gap-1">
                    <Heart size={18} className="text-rose-500" />
                    <span className="text-xl font-black text-on-surface">{getForestStats(myForestId).prayerCount}</span>
                    <span className="text-[10px] text-on-surface-variant">기도</span>
                  </div>
                  <div className="bg-surface-container-lowest p-4 rounded-2xl shadow-sm border border-surface-container-low flex flex-col items-center gap-1">
                    <AttendanceRingSmall rate={getForestStats(myForestId).rate} size={40} />
                    <span className="text-[10px] text-on-surface-variant">출석률</span>
                  </div>
                </div>
              </section>
            )}
          </>
        )}

        {/* ═══════════════════════════════════
            TAB: ATTENDANCE (결석/출석 상세)
        ═══════════════════════════════════ */}
        {selectedTab === 'attendance' && (
          <section className="space-y-4">
            <h2 className="text-base font-bold text-on-surface">주간 출결 현황</h2>

            {/* Per-forest attendance bars */}
            <div className="space-y-3">
              {forests.map((f: any) => {
                const fs = getForestStats(f.forest_id);
                const total = membersOnly.filter((u: any) => u.forest_id === f.forest_id).length;
                const fAbsentees = currentWeekAbsentees.filter((u: any) => u.forest_id === f.forest_id);
                return (
                  <div key={f.forest_id} className="bg-surface-container-lowest p-4 rounded-2xl border border-surface-container-low shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-on-surface">{f.name}</span>
                      <span className="text-xs font-bold text-on-surface-variant">{fs.attendedCount}/{total}명 · <span className={fs.rate >= 80 ? 'text-emerald-600' : fs.rate >= 60 ? 'text-amber-600' : 'text-rose-600'}>{fs.rate}%</span></span>
                    </div>
                    <div className="w-full bg-surface-container rounded-full h-2.5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${fs.rate >= 80 ? 'bg-emerald-500' : fs.rate >= 60 ? 'bg-amber-400' : 'bg-rose-500'}`}
                        style={{ width: `${fs.rate}%` }}
                      />
                    </div>
                    {fAbsentees.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {fAbsentees.map((u: any) => (
                          <span key={u.uid} className="text-[10px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full border border-rose-100 font-medium">
                            {u.name}{u.absentReason ? ` (${u.absentReason})` : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Long-term absentees */}
            {visibleAbsentees.length > 0 && (
              <div className="bg-error/10 border border-error/20 p-4 rounded-2xl space-y-2">
                <h3 className="text-sm font-bold text-error flex items-center gap-2"><AlertTriangle size={14} /> 장기결석자 ({visibleAbsentees.length}명)</h3>
                <div className="flex flex-wrap gap-2">
                  {visibleAbsentees.map((u: any) => (
                    <span key={u.uid} className="bg-white text-error px-2.5 py-1 rounded-full text-xs font-bold border border-error/20">
                      {u.name}{isAdminOrPastor ? ` (${forests.find((f: any) => f.forest_id === u.forest_id)?.name || '?'})` : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ═══════════════════════════════════
            TAB: CATEGORY
        ═══════════════════════════════════ */}
        {selectedTab === 'category' && (
          <section className="space-y-4">
            <h2 className="text-base font-bold text-on-surface">상담 분야별 현황</h2>
            <p className="text-xs text-on-surface-variant">전체 심방 {totalCatCount}건의 분야별 분류</p>
            <div className="space-y-3">
              {categoryCounts.map((cat: any) => {
                const pct = totalCatCount > 0 ? Math.round((cat.count / totalCatCount) * 100) : 0;
                return (
                  <div key={cat.id} className="bg-surface-container-lowest p-4 rounded-2xl border border-surface-container-low shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2"><span className="text-lg">{cat.icon}</span><span className="font-bold text-on-surface text-sm">{cat.label}</span></div>
                      <div className="flex items-center gap-2"><span className="text-xs text-on-surface-variant">{cat.count}건</span><span className="text-xs font-black text-primary">{pct}%</span></div>
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

        {/* ═══════════════════════════════════
            TAB: TREND
        ═══════════════════════════════════ */}
        {selectedTab === 'trend' && (
          <section className="space-y-4">
            <h2 className="text-base font-bold text-on-surface">주간 심방 & 출석 추세</h2>
            <p className="text-xs text-on-surface-variant">최근 6주 변화</p>

            {/* Bar chart - visitation */}
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container-low shadow-sm">
              <p className="text-xs font-bold text-on-surface-variant mb-3">📝 심방 건수</p>
              <div className="flex items-end gap-2 h-28">
                {weeklyTrend.map((week, i) => {
                  const heightPct = (week.count / maxTrend) * 100;
                  const isLatest = i === weeklyTrend.length - 1;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[9px] font-bold text-on-surface-variant">{week.count > 0 ? week.count : ''}</span>
                      <div className="w-full flex items-end justify-center" style={{ height: '72px' }}>
                        <div className={`w-full rounded-t-lg transition-all duration-700 ${isLatest ? 'bg-primary' : 'bg-primary/30'}`}
                          style={{ height: `${Math.max(heightPct, week.count > 0 ? 8 : 0)}%` }} />
                      </div>
                      <span className="text-[9px] text-on-surface-variant font-medium">{week.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Line chart - attendance rate */}
            <div className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container-low shadow-sm">
              <p className="text-xs font-bold text-on-surface-variant mb-3">📊 주차별 출석률</p>
              <div className="flex items-end gap-2 h-28">
                {weeklyTrend.map((week, i) => {
                  const isLatest = i === weeklyTrend.length - 1;
                  const color = week.rate >= 80 ? 'bg-emerald-500' : week.rate >= 60 ? 'bg-amber-400' : 'bg-rose-500';
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[9px] font-bold text-on-surface-variant">{week.rate}%</span>
                      <div className="w-full flex items-end justify-center" style={{ height: '72px' }}>
                        <div className={`w-full rounded-t-lg transition-all duration-700 ${color} ${isLatest ? '' : 'opacity-50'}`}
                          style={{ height: `${Math.max(week.rate, 4)}%` }} />
                      </div>
                      <span className="text-[9px] text-on-surface-variant font-medium">{week.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Commentary */}
            {(() => {
              const last = weeklyTrend[weeklyTrend.length - 2]?.count || 0;
              const cur = weeklyTrend[weeklyTrend.length - 1]?.count || 0;
              const diff = cur - last;
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

export default PastoralStatsDashboardView;
