import React, { useState, useEffect, useRef } from 'react';
import {
  Menu, Bell, User, Flame, QrCode, Users, ClipboardList, Wallet, FileText,
  MapPin, ChevronRight, ChevronLeft, Home, LayoutGrid, BookOpen, Calendar, Baby,
  MessageCircle, ArrowLeft, CheckCircle2, XCircle, FileEdit, X, Search, Phone, Lock, UserCircle, Settings, Award, Clock, Heart, MessageSquare, Send, LogOut, Sparkles, TreePine, HeartHandshake, GraduationCap, History, Plus, Play,
  SlidersHorizontal, Camera, Bookmark, MoreHorizontal, Music, Megaphone, Trash2, MoreVertical, PieChart, AlertTriangle, TrendingUp
} from 'lucide-react';
import { collection, doc, setDoc, addDoc, getDoc, onSnapshot, query, where, orderBy, getDocFromServer, Timestamp, updateDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db as firestoreDb, auth, storage } from '../firebase';
export const VISIT_CATEGORIES = [
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
  const [activeTab, setActiveTab] = useState('summary');

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
        target_uid: targetUser.uid || '', 
        author_uid: currentUser?.uid || '',
        forest_id: targetUser.forest_id || '', 
        type: logType || 'meetup',
        category: logCategory || 'spiritual', 
        content: newLog,
        is_sensitive: isSensitive || false,
        date: new Date().toISOString().split('T')[0],
        createdAt: Timestamp.now()
      });
      setNewLog(''); setIsSensitive(false);
      onShowToast('심방 기록이 추가되었습니다.');
      setActiveTab('history');
    } catch (err: any) { console.error(err); onShowToast('저장 실패: ' + err.message); }
  };

  const handleAddPrayer = async () => {
    if (!newPrayer) return;
    try {
      await addDoc(collection(firestoreDb, 'pastoral_records'), {
        target_uid: targetUser.uid || '', 
        author_uid: currentUser?.uid || '',
        forest_id: targetUser.forest_id || '', 
        type: 'prayer',
        content: newPrayer, 
        is_sensitive: false, 
        status: 'active',
        createdAt: Timestamp.now()
      });
      setNewPrayer('');
      onShowToast('기도제목이 추가되었습니다.');
      setActiveTab('summary');
    } catch (err: any) { console.error(err); onShowToast('저장 실패: ' + err.message); }
  };

  const togglePrayerStatus = async (id: string, currentStatus: string) => {
    try {
      await updateDoc(doc(firestoreDb, 'pastoral_records', id), {
        status: currentStatus === 'active' ? 'resolved' : 'active'
      });
    } catch (err: any) { console.error(err); onShowToast('수정 실패: ' + err.message); }
  };

  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const targetAttendance = attendance.filter((a: any) =>
    a.uid === targetUser.uid && a.date?.seconds && new Date(a.date.seconds * 1000) > fourWeeksAgo
  );
  // Do not count '결석' type as attended
  const missedWeeks = 4 - targetAttendance.filter((a: any) => a.type !== '결석').length;

  const handleMissingWeekClick = async (week: any) => {
    if (!isPastorOrAdmin) return;
    const reason = window.prompt(`${week.label} 주 결석 사유를 입력해주세요.\n(빈칸으로 두시면 사유가 삭제됩니다.)`, week.absentReason);
    if (reason === null) return; // Cancelled
    
    try {
      if (week.absentId) {
        if (reason.trim() === '') {
          // Delete reason completely
          await deleteDoc(doc(firestoreDb, 'attendance', week.absentId));
          onShowToast('결석 사유가 삭제되었습니다.');
        } else {
          // Update
          await updateDoc(doc(firestoreDb, 'attendance', week.absentId), {
            reason: reason
          });
          onShowToast('결석 사유가 수정되었습니다.');
        }
      } else {
        if (reason.trim() === '') return;
        // Create new
        await addDoc(collection(firestoreDb, 'attendance'), {
          uid: targetUser.uid,
          date: Timestamp.fromDate(week.dateObj),
          type: '결석',
          reason: reason,
          recorded_by: currentUser?.uid || ''
        });
        onShowToast('결석 사유가 등록되었습니다.');
      }
    } catch (e) {
      console.error(e);
      onShowToast('저장 중 오류가 발생했습니다.');
    }
  };

  const getLast4WeeksData = () => {
    const weeks = [];
    const now = new Date();
    const lastSunday = new Date(now);
    lastSunday.setDate(now.getDate() - now.getDay());
    lastSunday.setHours(0, 0, 0, 0);

    for (let i = 3; i >= 0; i--) {
      const targetSunday = new Date(lastSunday);
      targetSunday.setDate(lastSunday.getDate() - (i * 7));
      
      const nextSunday = new Date(targetSunday);
      nextSunday.setDate(targetSunday.getDate() + 7);

      const attendedRecord = targetAttendance.find((a: any) => {
        const aDate = new Date(a.date.seconds * 1000);
        return aDate >= targetSunday && aDate < nextSunday && a.type !== '결석';
      });

      const absentRecord = targetAttendance.find((a: any) => {
        const aDate = new Date(a.date.seconds * 1000);
        return aDate >= targetSunday && aDate < nextSunday && a.type === '결석';
      });

      weeks.push({
        label: `${targetSunday.getMonth() + 1}/${targetSunday.getDate()}`,
        attended: !!attendedRecord,
        absentId: absentRecord?.id || null,
        absentReason: absentRecord?.reason || '',
        dateObj: targetSunday
      });
    }
    return weeks;
  };

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

        {/* Tab Navigation */}
        <div className="flex px-6 border-b border-surface-container">
          {[
            { id: 'summary', label: '요약', icon: <PieChart size={16} /> },
            { id: 'history', label: '전체기록', icon: <History size={16} /> },
            { id: 'write', label: '기록하기', icon: <FileEdit size={16} /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-bold transition-all relative ${
                activeTab === tab.id ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary animate-in fade-in slide-in-from-bottom-1 duration-300" />
              )}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto w-full">
        <div className="p-6 space-y-6 pb-32">
          {/* Summary Tab */}
          {activeTab === 'summary' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
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
                </div>
              </div>

              <section className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-surface-container-low space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-on-surface flex items-center gap-2">
                    <Calendar size={18} className="text-primary" /> 최근 4주 출석
                  </h3>
                  {missedWeeks >= 3 ? (
                    <div className="bg-error/10 text-error px-2 py-1 rounded-md flex items-center gap-1 font-bold text-[10px] shadow-sm">
                      <span className="animate-pulse">🚨</span> 장기 결석 주의
                    </div>
                  ) : missedWeeks === 0 ? (
                    <div className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md font-bold text-[10px] shadow-sm">
                      개근 멤버
                    </div>
                  ) : null}
                </div>
                
                <div className="grid grid-cols-4 gap-2 sm:gap-3 bg-surface-container-lowest p-1">
                  {getLast4WeeksData().map((week, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => !week.attended && isPastorOrAdmin ? handleMissingWeekClick(week) : undefined}
                      className={`relative flex flex-col items-center p-2 sm:p-3 rounded-2xl transition-all border ${
                        week.attended 
                          ? 'bg-emerald-50/50 border-emerald-100' 
                          : 'bg-rose-50/80 border-rose-200 cursor-pointer hover:bg-rose-100/80 hover:scale-105 active:scale-95'
                      }`}
                    >
                      <span className={`text-[10px] sm:text-xs font-bold mb-2 ${week.attended ? 'text-emerald-700' : 'text-rose-600'}`}>{week.label}</span>
                      <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all ${
                        week.attended 
                          ? 'bg-emerald-100 text-emerald-600 shadow-sm scale-105' 
                          : 'bg-rose-100 shadow-sm animate-pulse shadow-rose-200/50 ring-2 ring-rose-200'
                      }`}>
                        {week.attended ? <TreePine size={20} className="sm:w-6 sm:h-6" /> : <span className="text-[10px] sm:text-xs font-extrabold tracking-widest text-rose-600">결석</span>}
                      </div>
                      {!week.attended && week.absentReason && (
                        <div className="absolute -bottom-1 w-[120%] text-[9px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full shadow-sm border border-rose-200 truncate text-center leading-tight">
                          {week.absentReason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-surface-container-low space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-on-surface flex items-center gap-2">
                    <Heart size={18} className="text-rose-500" /> 현재 기도제목
                  </h3>
                  <button onClick={() => setActiveTab('write')} className="text-xs text-primary font-bold hover:underline">+ 추가하기</button>
                </div>
                <div className="space-y-2">
                  {prayerRequests.filter(p => p.status === 'active').map((p: any) => (
                    <div key={p.id} className="flex items-start gap-3 p-3 bg-surface-container-lowest border border-surface-container-low rounded-xl">
                      <button onClick={() => togglePrayerStatus(p.id, p.status)} className="mt-0.5 w-5 h-5 rounded flex items-center justify-center shrink-0 border border-outline-variant text-transparent hover:border-primary transition-colors">
                        <CheckCircle2 size={14} />
                      </button>
                      <div className="flex-1 text-sm text-on-surface">{p.content}</div>
                    </div>
                  ))}
                  {prayerRequests.filter(p => p.status === 'active').length === 0 && (
                    <p className="text-xs text-on-surface-variant text-center py-4 italic">활성 기도제목이 없습니다.</p>
                  )}
                </div>
              </section>
            </div>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <section className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <h3 className="font-bold text-on-surface">종합 목양 히스토리</h3>
                  <span className="text-xs text-on-surface-variant font-bold">총 {targetRecords.length}건</span>
                </div>
                <div className="space-y-4">
                  {targetRecords.map((log: any) => {
                    const isPrayer = log.type === 'prayer';
                    const catInfo = getCategoryInfo(log.category);
                    return (
                      <div key={log.id} className="relative pl-6 border-l-2 border-surface-container-low pb-4 last:pb-0">
                        <div className="absolute left-[-9px] top-0 w-4 h-4 rounded-full bg-surface-container-lowest border-2 border-primary flex items-center justify-center">
                          <div className={`w-1.5 h-1.5 rounded-full ${isPrayer ? 'bg-rose-400' : 'bg-primary'}`} />
                        </div>
                        <div className={`bg-surface-container-lowest border p-4 rounded-xl shadow-sm ${log.is_sensitive ? 'border-red-200 bg-red-50/30' : 'border-surface-container-low'}`}>
                          <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {isPrayer ? (
                                <span className="text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 uppercase">🙏 기도제목</span>
                              ) : (
                                <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase">
                                  {log.type === 'meetup' ? '📍 대면' : log.type === 'call' ? '📞 전화' : '💬 기타'}
                                </span>
                              )}
                              {!isPrayer && log.category && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${catInfo.color}`}>
                                  {catInfo.icon} {catInfo.label}
                                </span>
                              )}
                              {log.is_sensitive && isPastorOrAdmin && (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
                                  <Lock size={8} /> 민감
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-on-surface-variant font-medium">
                              {log.date || (log.createdAt?.toDate ? log.createdAt.toDate().toLocaleDateString() : '')}
                            </span>
                          </div>
                          <p className={`text-sm leading-relaxed ${log.status === 'resolved' ? 'line-through opacity-60' : 'text-on-surface'}`}>
                            {log.content}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  {targetRecords.length === 0 && <p className="text-xs text-on-surface-variant text-center py-10 italic">기록된 히스토리가 없습니다.</p>}
                </div>
              </section>
            </div>
          )}

          {/* Write Tab */}
          {activeTab === 'write' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <section className="bg-surface-container-lowest p-6 rounded-2xl shadow-sm border border-surface-container-low space-y-6">
                <div className="space-y-4">
                  <label className="text-sm font-bold text-on-surface flex items-center gap-2">
                    <Heart size={16} className="text-rose-500" /> 신규 기도제목 추가
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={newPrayer} 
                      onChange={e => setNewPrayer(e.target.value)} 
                      onKeyDown={e => e.key === 'Enter' && handleAddPrayer()} 
                      placeholder="기도 내용을 입력하세요..." 
                      className="flex-1 bg-surface-container p-4 rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary shadow-inner" 
                    />
                    <button onClick={handleAddPrayer} className="bg-rose-500 text-white px-5 rounded-xl font-bold active:scale-95 transition-all shadow-lg shadow-rose-500/20">
                      <Plus size={20}/>
                    </button>
                  </div>
                </div>

                <div className="h-px bg-surface-container-high" />

                <div className="space-y-4">
                  <label className="text-sm font-bold text-on-surface flex items-center gap-2">
                    <MessageSquare size={16} className="text-blue-500" /> 신규 심방/상담 기록
                  </label>
                  <div className="space-y-4 bg-surface-container p-5 rounded-2xl shadow-inner">
                    <div>
                      <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-2">연락 방법</p>
                      <div className="flex gap-2 flex-wrap">
                        {(['meetup', 'call', 'other'] as const).map(t => (
                          <button key={t} onClick={() => setLogType(t)} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm ${logType === t ? 'bg-primary text-on-primary' : 'bg-white text-on-surface-variant hover:bg-white/80'}`}>
                            {t === 'meetup' ? '📍 대면' : t === 'call' ? '📞 전화/카톡' : '💬 기타'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-outline uppercase tracking-wider mb-2">상담 분야</p>
                      <div className="grid grid-cols-3 gap-2">
                        {VISIT_CATEGORIES.map(cat => (
                          <button key={cat.id} onClick={() => setLogCategory(cat.id)}
                            className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl text-[11px] font-bold border transition-all shadow-sm ${logCategory === cat.id ? 'bg-white border-primary text-primary' : 'bg-white border-transparent text-on-surface-variant'}`}>
                            <span className="text-lg">{cat.icon}</span>
                            <span className="truncate">{cat.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold text-outline uppercase tracking-wider">상세 내용</p>
                      <textarea value={newLog} onChange={e => setNewLog(e.target.value)} placeholder="심방 내용을 구체적으로 기록해주세요..." className="w-full bg-white p-4 rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary min-h-[120px] shadow-sm resize-none" />
                    </div>
                    {isPastorOrAdmin && (
                      <button onClick={() => setIsSensitive(!isSensitive)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${isSensitive ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-outline-variant text-on-surface-variant'}`}>
                        <div className="flex items-center gap-3 text-xs font-bold">
                          <div className={`p-1.5 rounded-lg ${isSensitive ? 'bg-red-200 text-red-700' : 'bg-surface-container text-outline'}`}>
                            <Lock size={14} />
                          </div>
                          <span>목사님/관리자 전용 민감 기록으로 설정</span>
                        </div>
                        <div className={`w-10 h-5 rounded-full transition-colors relative ${isSensitive ? 'bg-red-500' : 'bg-surface-container-high'}`}>
                          <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isSensitive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </div>
                      </button>
                    )}
                    <button onClick={handleAddLog} className="w-full bg-primary text-on-primary py-4 rounded-xl font-bold text-sm active:scale-95 transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2">
                      <Plus size={18} /> 기록 저장하기
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default PastoralCardModal;
