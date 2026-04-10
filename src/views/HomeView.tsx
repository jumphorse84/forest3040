import { TicketModal } from '../components/TicketModal';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Menu, Bell, User, Flame, QrCode, Users, ClipboardList, Wallet, FileText,
  MapPin, ChevronRight, ChevronLeft, Home, LayoutGrid, BookOpen, Calendar, Baby,
  MessageCircle, ArrowLeft, CheckCircle2, XCircle, FileEdit, X, Search, Phone, Lock, UserCircle, Settings, Award, Clock, Heart, MessageSquare, Send, LogOut, Sparkles, TreePine, HeartHandshake, GraduationCap, History, Plus, Play,
  SlidersHorizontal, Camera, Bookmark, MoreHorizontal, Music, Megaphone, Trash2, MoreVertical, PieChart, AlertTriangle, TrendingUp, Quote
} from 'lucide-react';

const BIBLE_VERSES = [
  "항상 기뻐하라 쉬지 말고 기도하라 범사에 감사하라 (살전 5:16-18)",
  "여호와를 기뻐하라 그가 네 마음의 소원을 네게 이루어 주시리로다 (시 37:4)",
  "두려워하지 말라 내가 너와 함께 함이라 놀라지 말라 나는 네 하나님이 됨이라 (사 41:10)",
  "수고하고 무거운 짐 진 자들아 다 내게로 오라 내가 너희를 쉬게 하리라 (마 11:28)",
  "내가 네게 명령한 것이 아니냐 강하고 담대하라 두려워하지 말며 놀라지 말라 (수 1:9)",
  "나의 영혼아 잠잠히 하나님만 바라라 무릇 나의 소망이 그로부터 나오는도다 (시 62:5)"
];
import { collection, doc, setDoc, addDoc, getDoc, onSnapshot, query, where, orderBy, getDocFromServer, Timestamp, updateDoc, deleteDoc, arrayUnion, arrayRemove, limit } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db as firestoreDb, auth, storage } from '../firebase';
import { VISIT_CATEGORIES, MenuButton, ScheduleItem, MemberRow, OperationType, handleFirestoreError } from '../App';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { FamilyNewsEditorModal } from '../components/FamilyNewsEditorModal';

const HomeView = ({ user, schedules, surveys, attendance, kidsCares = [], users = [], forests = [], onNavigateToMyForestBoard, onNavigate, onNavigateToKidsDetail }: any) => {

  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const [familyNews, setFamilyNews] = useState<any[]>([]);
  const [isFamilyNewsModalOpen, setIsFamilyNewsModalOpen] = useState(false);
  const [editingFamilyNews, setEditingFamilyNews] = useState<any>(null);

  const handleToggleLike = async (newsId: string, currentLikes: string[] = []) => {
    if (!user?.uid) return;
    const docRef = doc(firestoreDb, 'family_news', newsId);
    const hasLiked = currentLikes.includes(user.uid);
    try {
      await updateDoc(docRef, {
        likes: hasLiked ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const handleDeleteNews = async (newsId: string) => {
    if (window.confirm("정말 이 소식을 삭제하시겠습니까?")) {
      try {
        await deleteDoc(doc(firestoreDb, 'family_news', newsId));
      } catch (error) {
        console.error("Error deleting news:", error);
      }
    }
  };

  useEffect(() => {
    const q = query(collection(firestoreDb, 'family_news'), orderBy('created_at', 'desc'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const news = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter((n: any) => n.is_active === true)
        .slice(0, 5);
      setFamilyNews(news);
    }, (error) => {
      console.error("Error fetching family news:", error);
    });
    return () => unsubscribe();
  }, []);

  
  const ticketUser = user ? {
    avatarSrc: user.photoURL || user.profileImageUrl || user.picture || '',
    avatarFallback: user.name?.substring(0, 1) || '👤',
    name: user.name || '알 수 없음',
    affiliation: user.forest || '소속 없음',
    title: user.role === 'admin' ? '운영진' : user.role === 'leader' ? '마을장' : '멤버',
    birthdate: user.birthdate || user.birthDate || '미상',
    qrData: user.uid ? `${user.uid}_${Date.now()}` : 'GUEST_QR'
  } : null;

  const today = new Date().toISOString().split('T')[0];
  const hasCheckedInToday = attendance?.some((a: any) => 
    a.uid === user.uid && 
    a.date?.toDate && 
    a.date.toDate().toISOString().split('T')[0] === today
  );

  const activeSurveys = surveys?.filter((s: any) => s.status === 'active') || [];

  const { width, height } = useWindowSize();
  const isMyBirthday = users?.find((u: any) => u.uid === user?.uid)?.birthdate?.substring(5) === today.substring(5);
  const calculateDDay = (targetDateStr: string) => {
    if (!targetDateStr) return '';
    const now = new Date();
    now.setHours(0,0,0,0);
    const target = new Date(targetDateStr);
    target.setHours(0,0,0,0);
    const diff = target.getTime() - now.getTime();
    const dDay = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (dDay === 0) return 'D-Day';
    if (dDay > 0) return `D-${dDay}`;
    return `D+${Math.abs(dDay)}`;
  };

  const upcomingCareForMyForest = kidsCares?.find((c: any) => {
    if (!c.date || !user?.forest_id || c.assigned_forest_id !== user.forest_id) return false;
    const careDate = new Date(c.date);
    const now = new Date();
    now.setHours(0,0,0,0);
    const diffTime = careDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 7; // within 7 days
  });

  const todaysVerse = useMemo(() => {
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    return BIBLE_VERSES[dayOfYear % BIBLE_VERSES.length];
  }, []);

  // Team fruit: sum of all registrations across all kids_care events assigned to user's forest
  const teamFruitCount = useMemo(() => {
    if (!user?.forest_id || !kidsCares) return 0;
    return kidsCares
      .filter((c: any) => c.assigned_forest_id === user.forest_id)
      .reduce((sum: number, c: any) => {
        const regs = Object.values(c.registrations || {}) as number[];
        return sum + regs.reduce((s: number, v: number) => s + v, 0);
      }, 0);
  }, [kidsCares, user?.forest_id]);

  // Personal stamp: count of distinct Sundays user attended this month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthLabel = `${currentMonth + 1}월`;
  const stampCount = useMemo(() => {
    if (!attendance || !user?.uid) return 0;
    const sundays = new Set<string>();
    attendance
      .filter((a: any) => a.uid === user.uid)
      .forEach((a: any) => {
        const d = new Date(a.date || a.timestamp?.toDate?.() || '');
        if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
          sundays.add(a.date || d.toISOString().split('T')[0]);
        }
      });
    return sundays.size;
  }, [attendance, user?.uid, currentMonth, currentYear]);

  const STAMP_TARGET = 10;

  const getDynamicGreeting = () => {
    const now = new Date();
    const actDay = now.getDay();
    const hours = now.getHours();
    
    if (actDay === 0) return '복된 주일입니다 💒 예배를 통해 큰 기쁨 누리시길 기도해요!';
    if (actDay === 1 && hours < 12) return '월요병 조심! 새로운 한 주, 말씀으로 넉넉히 이겨내요 💪';
    if (actDay === 5 && hours >= 12) return '한 주간 수고 많으셨습니다! 은혜로운 주말을 기대해요 🌿';
    
    if (hours >= 6 && hours < 12) return '상쾌한 아침입니다, 오늘도 주님과 동행하는 하루 되세요 ☀️';
    if (hours >= 12 && hours < 18) return '나른한 오후, 따뜻한 말씀 한 구절로 쉬어가세요 ☕';
    if (hours >= 18 || hours < 6) return '오늘 하루도 정말 수고 많으셨습니다. 평안한 밤 되세요 🌙';
    
    return '오늘 하루도 주님 안에서 평안하세요 🌿';
  };

  return (
    <>
      {isMyBirthday && <Confetti width={width} height={height} recycle={false} numberOfPieces={500} gravity={0.15} style={{ zIndex: 9999, position: 'fixed', top: 0, left: 0 }} />}
      {/* Greeting Card - Spiritual & Community Dashboard */}
      <section className="relative overflow-hidden squircle p-8 bg-gradient-to-br from-[#0F6045] to-[#1a7858] text-white shadow-[0_15px_40px_rgba(15,96,69,0.2)] group">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
        <div className="relative z-10 flex flex-col h-full justify-between">
          
          <div className="mb-6">
            <h2 className="text-[22px] font-extrabold font-headline mb-1 tracking-tight">
              {user.name} <span className="opacity-80 text-lg font-medium">님,</span>
            </h2>
            <p className="text-[13px] font-medium opacity-90 leading-tight">
              {getDynamicGreeting()}
            </p>
          </div>
          
          {/* Bible Verse Area - elegant, no box, no quotes */}
          <div className="mb-8 border-l-2 border-white/30 pl-4">
            <p className="text-[14px] font-medium leading-relaxed text-white/90 break-keep">
              {todaysVerse}
            </p>
          </div>

          {/* Gamification / Community Tags Side by Side */}
          <div className="grid grid-cols-2 gap-3 mt-auto">
            <div className="flex flex-col gap-1 bg-white/10 backdrop-blur-md p-3 rounded-2xl active:scale-[0.98] transition-transform cursor-pointer border border-white/5">
              <span className="text-[11px] font-bold text-white/60">우리 숨 누적 열매 ⭐</span>
              <span className="text-[15px] font-extrabold text-white">{teamFruitCount}개</span>
            </div>
            <div className="flex flex-col gap-1 bg-white/10 backdrop-blur-md p-3 rounded-2xl active:scale-[0.98] transition-transform cursor-pointer border border-white/5">
              <span className="text-[11px] font-bold text-white/60">{monthLabel} 출석 스탬프 🗺️</span>
              <span className="text-[15px] font-extrabold text-[#d1fae5]">{stampCount} / {STAMP_TARGET} 획득</span>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 opacity-[0.06] pointer-events-none">
          <BookOpen className="w-full h-full text-white" />
        </div>
      </section>

      {/* Kids Care Duty Notification */}
      {upcomingCareForMyForest && (
        <section className="bg-primary/10 border border-primary/20 p-5 rounded-2xl flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center shrink-0">
            <Baby size={20} className="text-on-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="font-bold text-primary font-headline">이번 주 우리 숲 봉사 안내</h3>
              <span className="text-xs font-bold text-primary px-2 py-0.5 bg-primary/20 rounded-full">
                {calculateDDay(upcomingCareForMyForest.date)}
              </span>
            </div>
            <p className="text-sm font-medium text-on-surface">이번 주 주일({upcomingCareForMyForest.date})은 소속하신 숲이 키즈돌봄 당번입니다. 잊지 말고 꼭 참석해주세요!</p>
            <div className="mt-3 flex gap-2">
              <button 
                onClick={() => onNavigateToKidsDetail ? onNavigateToKidsDetail(upcomingCareForMyForest.id) : onNavigate('kids')} 
                className="text-xs font-bold bg-primary text-on-primary px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
              >
                상세 보기
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Quick Menu Grid */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h2 className="font-headline text-xl font-bold tracking-tight text-on-surface">간편 메뉴</h2>
          <span className="text-xs font-bold text-primary-dim uppercase tracking-widest cursor-pointer">전체보기</span>
        </div>
        <div className="grid grid-cols-5 gap-3">
          <MenuButton icon={<QrCode className="w-6 h-6 text-primary-dim group-hover:scale-110 transition-transform" />} label="출석체크" hoverBg="hover:bg-primary-container" onClick={() => setIsTicketModalOpen(true)} />
          <MenuButton icon={<Users className="w-6 h-6 text-secondary group-hover:scale-110 transition-transform" />} label="숲 모임" hoverBg="hover:bg-secondary-container" onClick={onNavigateToMyForestBoard} />
          <MenuButton icon={<ClipboardList className="w-6 h-6 text-tertiary group-hover:scale-110 transition-transform" />} label="설문조사" hoverBg="hover:bg-tertiary-container" onClick={() => onNavigate('survey')} />
          <MenuButton icon={<Wallet className="w-6 h-6 text-emerald-800 group-hover:scale-110 transition-transform" />} label="회비납부" hoverBg="hover:bg-emerald-100" onClick={() => onNavigate('finance')} />
          <MenuButton icon={<FileText className="w-6 h-6 text-blue-800 group-hover:scale-110 transition-transform" />} label="회의록" hoverBg="hover:bg-blue-100" onClick={() => onNavigate('minutes')} />
        </div>
      </section>

      {/* Active Surveys Section */}
      {activeSurveys.length > 0 && (
        <section className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h2 className="font-headline text-xl font-bold tracking-tight text-on-surface">진행 중인 설문</h2>
            <span onClick={() => onNavigate('survey')} className="text-xs font-bold text-primary cursor-pointer">더보기</span>
          </div>
          <div className="space-y-3">
            {activeSurveys.map((survey: any) => (
              <div 
                key={survey.id} 
                onClick={() => onNavigate('survey')}
                className="bg-tertiary-container/20 border border-tertiary-container/30 p-5 rounded-3xl flex items-center justify-between group cursor-pointer hover:bg-tertiary-container/30 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-tertiary text-on-tertiary p-2.5 rounded-2xl">
                    <ClipboardList size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface">{survey.title}</h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">{survey.deadline?.toDate ? `마감: ${survey.deadline.toDate().toLocaleDateString()}` : '진행 중'}</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-tertiary group-hover:translate-x-1 transition-transform" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Schedule Section */}
    <section className="space-y-6">
      <div className="flex justify-between items-center px-2">
        <h2 className="font-headline text-xl font-bold tracking-tight text-on-surface">다가오는 일정</h2>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-primary"></div>
          <div className="w-2 h-2 rounded-full bg-surface-container-highest"></div>
        </div>
      </div>
      <div className="space-y-4">
        {(() => {
          const todayStr = today; // "YYYY-MM-DD"
          const currentYearStr = new Date().getFullYear().toString();
          
          // 1. Process Birthdays
          const upcomingBirthdays = users
            ? users.filter((u: any) => u.birthdate && u.birthdate.length >= 5)
                .map((u: any) => {
                  const mm_dd = u.birthdate.substring(5); // e.g. "05-12"
                  let bdayFullDate = `${currentYearStr}-${mm_dd}`;
                  if (bdayFullDate < todayStr) {
                    // If it already passed this year, we COULD show next year's, 
                    // but usually upcoming schedule only shows near future. We'll skip or use next year
                    bdayFullDate = `${parseInt(currentYearStr) + 1}-${mm_dd}`; 
                  }
                  
                  const f = forests?.find((f: any) => f.id === u.forest_id || f.id === u.forest);
                  const forestName = f ? f.name : '소속없음';

                  return {
                    id: `bday-${u.uid}`,
                    title: `🎉 ${u.name}님의 생일`,
                    fullDate: bdayFullDate,
                    time: '하루 종일 🎂',
                    location: `${forestName} 숲`,
                    active: true,
                    isBirthday: true
                  };
                })
                .filter((bday: any) => bday.fullDate >= todayStr) // just in case
            : [];

          // 2. Combine and sort
          const validSchedules = schedules
            .filter((s: any) => s.active !== false && (s.fullDate && s.fullDate >= todayStr))
            .concat(upcomingBirthdays)
            .sort((a: any, b: any) => (a.fullDate || '').localeCompare(b.fullDate || ''))
            .slice(0, 5);

          if (validSchedules.length === 0) {
            return <div className="text-sm text-center py-6 text-on-surface-variant">예정된 일정이 없습니다.</div>;
          }

          return validSchedules.map((schedule: any) => {
            const parts = schedule.fullDate ? schedule.fullDate.split('-') : [];
            const month = parts.length >= 2 ? parseInt(parts[1]) + '월' : '';
            const day = parts.length >= 3 ? parseInt(parts[2]) + '' : '';
            return (
              <ScheduleItem
                key={schedule.id}
                month={month}
                day={day}
                dDay={schedule.d_day && schedule.d_day !== 'D-?' && !schedule.d_day.includes('?') ? schedule.d_day : calculateDDay(schedule.fullDate)}
                time={schedule.time}
                title={schedule.title}
                location={schedule.location}
                dDayClass={schedule.isBirthday ? "bg-pink-100 text-pink-600 border border-pink-200" : (schedule.active ? "bg-error-container/20 text-on-error-container" : "bg-surface-container-high text-on-surface-variant")}
                active={schedule.active}
              />
            );
          });
        })()}
      </div>
    </section>

    {/* Family News Highlight (Carousel) */}
    <section className="space-y-4 pt-2">
      <div className="flex justify-between items-center px-4">
        <h2 className="font-headline text-xl font-bold tracking-tight text-on-surface">우리 숲 가족 소식</h2>
        {(user?.role === 'admin' || user?.role === 'leader' || user?.role === 'pastor') && (
          <button 
            onClick={() => {
              setEditingFamilyNews(null);
              setIsFamilyNewsModalOpen(true);
            }}
            className="text-xs font-bold bg-primary-container text-on-primary-container px-3 py-1.5 rounded-full flex items-center gap-1 active:scale-95 transition-transform"
          >
            <Plus size={14} /> 소식 등록
          </button>
        )}
      </div>

      <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide px-4 pb-4 gap-4">
        {familyNews.length > 0 ? (
          familyNews.map((news: any) => {
            const getBadge = (cat: string) => {
              switch(cat) {
                case 'new_member': return { label: '🎉 새가족', color: 'bg-emerald-500 text-white' };
                case 'pregnancy': return { label: '👼 생명의 축복', color: 'bg-pink-500 text-white' };
                case 'childbirth': return { label: '🍼 출산 축하', color: 'bg-blue-500 text-white' };
                case 'wedding': return { label: '💍 결혼 축하', color: 'bg-purple-500 text-white' };
                default: return { label: '📬 특별한 소식', color: 'bg-surface-container-highest text-on-surface-variant' };
              }
            };
            const badge = getBadge(news.category);
            
            return (
              <div key={news.id} className="min-w-[85vw] sm:min-w-[300px] snap-center bg-surface-container-lowest rounded-3xl overflow-hidden shadow-sm border border-surface-container-low flex flex-col relative group">
                <div className="absolute top-4 left-4 z-10 flex gap-2">
                  <span className={`${badge.color} text-[10px] font-bold px-3 py-1.5 rounded-full shadow-md backdrop-blur-md bg-opacity-90`}>
                    {badge.label}
                  </span>
                </div>
                {(user?.role === 'admin' || user?.role === 'leader' || user?.role === 'pastor' || user?.uid === news.author_uid) && (
                  <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <button onClick={() => { setEditingFamilyNews(news); setIsFamilyNewsModalOpen(true); }} className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors">
                      <FileEdit size={14} />
                    </button>
                    <button onClick={() => handleDeleteNews(news.id)} className="w-8 h-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-error transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
                <div className="aspect-[4/3] w-full bg-surface-container-high relative overflow-hidden">
                  {news.imageUrl ? (
                    <img src={news.imageUrl} alt={news.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center opacity-30">
                      <Heart size={48} className="text-on-surface" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-white font-headline text-lg font-bold leading-tight drop-shadow-md">{news.title}</h3>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <p className="text-sm text-on-surface leading-relaxed line-clamp-3 mb-4 whitespace-pre-wrap">{news.content}</p>
                  <div className="mt-auto flex justify-between items-center text-xs font-bold text-on-surface-variant pt-4 border-t border-surface-container">
                    <span>{news.forest_name ? `[${news.forest_name}] ` : ''}{news.author_name} • {news.created_at?.toDate ? news.created_at.toDate().toLocaleDateString() : ''}</span>
                    <button 
                      onClick={() => handleToggleLike(news.id, news.likes || [])}
                      className={`flex items-center gap-1.5 transition-colors ${news.likes?.includes(user?.uid) ? 'text-pink-500' : 'text-on-surface-variant hover:text-pink-500'}`}
                    >
                      <Heart size={16} className={news.likes?.includes(user?.uid) ? 'fill-pink-500 text-pink-500' : ''} />
                      {news.likes?.length > 0 && <span className="text-sm">{news.likes.length}</span>}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="min-w-[85vw] sm:min-w-[300px] snap-center bg-surface-container-lowest p-8 rounded-3xl border border-surface-container border-dashed flex flex-col items-center justify-center text-center gap-3">
            <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center">
              <Baby size={32} className="text-outline" />
            </div>
            <div>
              <p className="font-bold text-on-surface">아직 등록된 소식이 없습니다</p>
              <p className="text-xs text-on-surface-variant mt-1">곧 따뜻한 소식으로 채워질 예정이에요!</p>
            </div>
          </div>
        )}
      </div>
    </section>

      <TicketModal 
        isOpen={isTicketModalOpen} 
        onClose={() => setIsTicketModalOpen(false)} 
        user={ticketUser} 
      />
      
      {/* Admin Modals */}
      {(user?.role === 'admin' || user?.role === 'leader' || user?.role === 'pastor') && (
        <FamilyNewsEditorModal
          isOpen={isFamilyNewsModalOpen}
          onClose={() => {
            setIsFamilyNewsModalOpen(false);
            setEditingFamilyNews(null);
          }}
          user={user}
          forests={forests}
          onShowToast={(msg: string) => alert(msg)}
          editItem={editingFamilyNews}
        />
      )}
    </>
  );
};

export default HomeView;
