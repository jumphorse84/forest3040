import { TicketModal } from '../components/TicketModal';
import { FruitStatusModal } from '../components/FruitStatusModal';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  Menu, Bell, User, Flame, QrCode, Users, ClipboardList, Wallet, FileText,
  MapPin, ChevronRight, ChevronLeft, Home, LayoutGrid, BookOpen, Calendar, Baby,
  MessageCircle, ArrowLeft, CheckCircle2, XCircle, FileEdit, X, Search, Phone, Lock, UserCircle, Settings, Award, Clock, Heart, MessageSquare, Send, LogOut, Sparkles, TreePine, HeartHandshake, GraduationCap, History, Plus, Play,
  SlidersHorizontal, Camera, Bookmark, MoreHorizontal, Music, Megaphone, Trash2, MoreVertical, PieChart, AlertTriangle, TrendingUp, Quote, Package, HandMetal
} from 'lucide-react';

const BIBLE_VERSES = [
  "항상 기뻐하라 쉬지 말고 기도하라 범사에 감사하라 (살전 5:16-18)",
  "여호와를 기뻐하라 그가 네 마음의 소원을 네게 이루어 주시리로다 (시 37:4)",
  "두려워하지 말라 내가 너와 함께 함이라 놀라지 말라 나는 네 하나님이 됨이라 (사 41:10)",
  "수고하고 무거운 짐 진 자들아 다 내게로 오라 내가 너희를 쉬게 하리라 (마 11:28)",
  "내가 네게 명령한 것이 아니냐 강하고 담대하라 두려워하지 말며 놀라지 말라 (수 1:9)",
  "나의 영혼아 잠잠히 하나님만 바라라 무릇 나의 소망이 그로부터 나오는도다 (시 62:5)"
];
import { collection, doc, setDoc, addDoc, getDoc, onSnapshot, query, where, orderBy, getDocFromServer, Timestamp, updateDoc, deleteDoc, arrayUnion, arrayRemove, limit, increment } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db as firestoreDb, auth, storage } from '../firebase';
import { MenuButton, ScheduleItem, MemberRow, OperationType, handleFirestoreError } from '../App';
import { VISIT_CATEGORIES } from '../components/PastoralCardModal';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
import { FamilyNewsEditorModal } from '../components/FamilyNewsEditorModal';

const getLocalTodayStr = (date = new Date()) => {
  const formatter = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
};

const WeatherBackground = ({ weatherType, isDay }: { weatherType: string | null; isDay: boolean }) => {
  if (!weatherType) return <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>;

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
      {weatherType === 'clear' && isDay && (
        <>
          <div className="absolute -top-10 -right-10 w-[200px] h-[200px] bg-amber-300/30 rounded-full blur-[60px] animate-pulse-slow"></div>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={`sun-${i}`} className="absolute bg-amber-100/40 rounded-full blur-[1.5px]" 
                 style={{
                   width: `${Math.random() * 6 + 3}px`,
                   height: `${Math.random() * 6 + 3}px`,
                   left: `${Math.random() * 60 + 40}%`,
                   top: `${Math.random() * 80 + 20}%`,
                   animation: `float-up ${Math.random() * 5 + 5}s ease-in-out infinite`,
                   animationDelay: `${Math.random() * 5}s`
                 }}
            />
          ))}
        </>
      )}
      {weatherType === 'clear' && !isDay && (
        <>
          <div className="absolute -top-10 -left-10 w-[250px] h-[250px] bg-indigo-500/20 rounded-full blur-[80px] animate-pulse-slow"></div>
          {Array.from({ length: 15 }).map((_, i) => (
            <div key={`star-${i}`} className="absolute bg-white rounded-full blur-[1px]" 
                 style={{
                   width: `${Math.random() * 3 + 1}px`,
                   height: `${Math.random() * 3 + 1}px`,
                   left: `${Math.random() * 100}%`,
                   top: `${Math.random() * 80}%`,
                   animation: `star-twinkle ${Math.random() * 3 + 2}s ease-in-out infinite`,
                   animationDelay: `${Math.random() * 5}s`,
                   opacity: Math.random() * 0.5 + 0.3
                 }}
            />
          ))}
        </>
      )}
      {weatherType === 'cloudy' && (
        <>
          <div className="absolute -top-10 -left-10 w-[200px] h-[200px] bg-white/10 rounded-full blur-[60px] animate-pan-clouds"></div>
          <div className="absolute top-10 -right-10 w-[250px] h-[250px] bg-white/5 rounded-full blur-[70px] animate-pan-clouds" style={{ animationDelay: '2s' }}></div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={`cloud-${i}`} className={`absolute ${isDay ? 'bg-white/15' : 'bg-slate-800/40'} rounded-full blur-[15px]`} 
                 style={{
                   width: `${Math.random() * 120 + 80}px`,
                   height: `${Math.random() * 50 + 30}px`,
                   top: `${Math.random() * 50}%`,
                   right: '-150px',
                   animation: `cloud-drift ${Math.random() * 12 + 15}s linear infinite`,
                   animationDelay: `${Math.random() * 8}s`
                 }}
            />
          ))}
        </>
      )}
      {weatherType === 'rain' && (
        <>
          <div className="absolute inset-0 bg-slate-900/10 mix-blend-multiply"></div>
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={`rain-${i}`} className="absolute bg-blue-100/40 w-[1.5px] h-[25px] rounded-full" 
                 style={{
                   left: `${Math.random() * 100}%`,
                   top: `-${Math.random() * 30 + 30}px`,
                   animation: `rain-fall ${Math.random() * 0.4 + 0.6}s linear infinite`,
                   animationDelay: `${Math.random() * 2}s`
                 }}
            />
          ))}
        </>
      )}
      {weatherType === 'snow' && (
        <>
          <div className="absolute inset-0 bg-slate-100/5"></div>
          {Array.from({ length: 25 }).map((_, i) => (
            <div key={`snow-${i}`} className="absolute bg-white/80 rounded-full blur-[1px]" 
                 style={{
                   width: `${Math.random() * 4 + 2}px`,
                   height: `${Math.random() * 4 + 2}px`,
                   left: `${Math.random() * 100}%`,
                   top: `-10px`,
                   animation: `snow-fall ${Math.random() * 3 + 2}s linear infinite`,
                   animationDelay: `${Math.random() * 3}s`
                 }}
            />
          ))}
        </>
      )}
    </div>
  );
};

const HomeView = ({ user, schedules, surveys, attendance, fees = [], kidsCares = [], users = [], forests = [], onNavigateToMyForestBoard, onNavigate, onNavigateToKidsDetail }: any) => {

  const [weatherType, setWeatherType] = useState<string | null>(null);
  const [isDay, setIsDay] = useState<boolean>(() => {
    const hours = new Date().getHours();
    return hours >= 6 && hours < 18;
  });
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  // Quick Menu New Badge States
  const [latestTimes, setLatestTimes] = useState<Record<string, number>>({});
  const [lastViewed, setLastViewed] = useState<Record<string, number>>(() => {
    try { return JSON.parse(localStorage.getItem('forestQuickMenuViews') || '{}'); } catch { return {}; }
  });


  useEffect(() => {
    const unsubArr: any[] = [];
    if (user?.forest_id) {
      unsubArr.push(onSnapshot(query(collection(firestoreDb, 'forest_posts'), where('forest_id', '==', user.forest_id), orderBy('date', 'desc'), limit(1)), snap => {
        if (!snap.empty) {
          const d = snap.docs[0].data().date;
          const ts = d?.seconds ? d.seconds * 1000 : (typeof d === 'string' ? new Date(d).getTime() : 0);
          setLatestTimes(p => ({ ...p, my_forest: ts }));
        }
      }));
    }
    unsubArr.push(onSnapshot(query(collection(firestoreDb, 'minutes'), orderBy('date', 'desc'), limit(1)), snap => {
      if (!snap.empty) {
        const d = snap.docs[0].data().date;
        const ts = d?.seconds ? d.seconds * 1000 : (typeof d === 'string' ? new Date(d).getTime() : 0);
        setLatestTimes(p => ({ ...p, minutes: ts }));
      }
    }));
    unsubArr.push(onSnapshot(query(collection(firestoreDb, 'forest_items'), orderBy('created_at', 'desc'), limit(1)), snap => {
      if (!snap.empty) {
        const d = snap.docs[0].data().created_at;
        const ts = typeof d === 'string' ? new Date(d).getTime() : 0;
        setLatestTimes(p => ({ ...p, forest_items: ts }));
      }
    }));
    unsubArr.push(onSnapshot(query(collection(firestoreDb, 'prayer_requests'), orderBy('created_at', 'desc'), limit(1)), snap => {
      if (!snap.empty) {
        const d = snap.docs[0].data().created_at;
        const ts = d?.seconds ? d.seconds * 1000 : (typeof d === 'string' ? new Date(d).getTime() : 0);
        setLatestTimes(p => ({ ...p, prayer: ts }));
      }
    }));
    unsubArr.push(onSnapshot(query(collection(firestoreDb, 'worship_bulletins'), orderBy('date', 'desc'), limit(1)), snap => {
      if (!snap.empty) {
        const d = snap.docs[0].data().date;
        const ts = typeof d === 'string' ? new Date(d).getTime() : (d?.seconds ? d.seconds * 1000 : 0);
        setLatestTimes(p => ({ ...p, worship: ts }));
      }
    }));
    return () => unsubArr.forEach(u => u());
  }, [user?.forest_id]);

  useEffect(() => {
    if (surveys && surveys.length > 0) {
      const latest = Math.max(...surveys.map((s:any) => s.createdAt?.seconds ? s.createdAt.seconds * 1000 : 0));
      if (latest) setLatestTimes(p => ({ ...p, survey: latest }));
    }
  }, [surveys]);

  useEffect(() => {
    if (schedules && schedules.length > 0) {
      const latest = Math.max(...schedules.map((s:any) => s.created_at ? new Date(s.created_at).getTime() : 0));
      if (latest) setLatestTimes(p => ({ ...p, calendar: latest }));
    }
  }, [schedules]);

  const latestTimesRef = useRef<Record<string, number>>({});
  useEffect(() => {
    latestTimesRef.current = latestTimes;
  }, [latestTimes]);

  const handleMenuClick = useCallback((id: string, action: () => void) => {
    // 1. Read directly from localStorage to guarantee absolute latest state
    let currentViews: Record<string, number> = {};
    try {
      currentViews = JSON.parse(localStorage.getItem('forestQuickMenuViews') || '{}');
    } catch (e) {}

    // 2. Calculate new values synchronously
    const currentLatest = latestTimesRef.current[id] || 0;
    const timeToSet = Math.max(Date.now(), currentLatest);
    const next = { ...currentViews, [id]: timeToSet };

    // 3. Save to localStorage synchronously BEFORE any React state or unmounts happen
    localStorage.setItem('forestQuickMenuViews', JSON.stringify(next));

    // 4. Update React state (might be discarded if unmounting)
    setLastViewed(next);

    // 5. Navigate
    action();
  }, []);

  const hasNew = useCallback((id: string) => {
    return (latestTimes[id] || 0) > (lastViewed[id] || 0);
  }, [latestTimes, lastViewed]);

  const [isFruitModalOpen, setIsFruitModalOpen] = useState(false);
  const [familyNews, setFamilyNews] = useState<any[]>([]);
  const [isFamilyNewsModalOpen, setIsFamilyNewsModalOpen] = useState(false);
  const [editingFamilyNews, setEditingFamilyNews] = useState<any>(null);
  const todayStr = getLocalTodayStr();
  const fruitCacheKey = `daily_fruit_${user?.uid}_${todayStr}`;
  const fruitCountKey = `daily_fruit_count_${user?.forest_id || user?.forest}`;

  const [hasTodayFruit, setHasTodayFruit] = useState<boolean>(
    () => localStorage.getItem(fruitCacheKey) === 'true'
  );
  const [dailyFruitCount, setDailyFruitCount] = useState<number>(
    () => parseInt(localStorage.getItem(fruitCountKey) || '0', 10)
  );
  const [allDailyFruitsCount, setAllDailyFruitsCount] = useState<Record<string, number>>({});
  const [wateringAnim, setWateringAnim] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showAllMenus, setShowAllMenus] = useState(false);

  const [showDutyAlert, setShowDutyAlert] = useState(false);
  const [showFeeAlert, setShowFeeAlert] = useState(false);

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

  const forestName = forests?.find((f: any) =>
    f.forest_id === user?.forest_id ||
    f.id === user?.forest_id ||
    f.forest_id === user?.forest ||
    f.id === user?.forest
  )?.name || '소속 없음';

  const ticketUser = user ? {
    avatarSrc: user.photoURL || user.profileImageUrl || user.picture || '',
    avatarFallback: user.name?.substring(0, 1) || '👤',
    name: user.name || '알 수 없음',
    affiliation: forestName,
    title: user.role === 'admin' ? '운영진' : user.role === 'leader' ? '숲지기' : '멤버',
    birthdate: user.birthdate || user.birthDate || '미상',
    qrData: user.uid ? `${user.uid}_${Date.now()}` : 'GUEST_QR'
  } : null;

  const today = getLocalTodayStr();
  const hasCheckedInToday = attendance?.some((a: any) => 
    a.uid === user.uid && 
    a.date?.toDate && 
    getLocalTodayStr(a.date.toDate()) === today
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

  useEffect(() => {
    if (upcomingCareForMyForest && user?.uid) {
      const acknowledged = localStorage.getItem(`duty_alert_acknowledged_v2_${upcomingCareForMyForest.id}_${user.uid}`);
      if (!acknowledged) {
        const sessionShown = sessionStorage.getItem(`duty_alert_shown_${upcomingCareForMyForest.id}`);
        if (!sessionShown) {
          setShowDutyAlert(true);
          sessionStorage.setItem(`duty_alert_shown_${upcomingCareForMyForest.id}`, 'true');
        }
      }
    }
  }, [upcomingCareForMyForest, user]);

  useEffect(() => {
    if (!user?.uid) return;
    const todayDate = new Date();
    const lastDayOfMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 0);
    const isLastWeek = (lastDayOfMonth.getDate() - todayDate.getDate()) <= 7;
    
    // Check current month fee
    const currentMonthFee = fees?.find((f: any) => f.uid === user.uid && f.year === todayDate.getFullYear() && f.month === todayDate.getMonth() + 1);
    const isFeeUnpaid = !currentMonthFee || currentMonthFee.status !== 'paid';

    if (isLastWeek && isFeeUnpaid && user?.role !== 'admin' && user?.role !== 'pastor') { // Admins usually don't need automated fee warnings
      const sessionKey = `fee_alert_shown_${todayDate.getFullYear()}_${todayDate.getMonth()+1}`;
      const shownFee = sessionStorage.getItem(sessionKey);
      if (!shownFee) {
        setShowFeeAlert(true);
        sessionStorage.setItem(sessionKey, 'true');
      }
    }
  }, [fees, user]);

  const todaysVerse = useMemo(() => {
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    return BIBLE_VERSES[dayOfYear % BIBLE_VERSES.length];
  }, []);

  // Team fruit: sum of kids_care registrations + daily visit fruits
  const teamFruitCount = useMemo(() => {
    if (!user?.forest_id || !kidsCares) return 0;
    return kidsCares
      .filter((c: any) => c.assigned_forest_id === user.forest_id)
      .reduce((sum: number, c: any) => {
        const regs = Object.values(c.registrations || {}) as number[];
        return sum + regs.reduce((s: number, v: number) => s + v, 0);
      }, 0);
  }, [kidsCares, user?.forest_id]);

  // Total display count = kidsCare fruits + all-time daily fruits count
  const totalFruitCount = teamFruitCount + (allDailyFruitsCount[user?.forest_id || user?.forest] || 0);

  // [최적화] 내 숲의 daily_fruits만 구독 (오늘 물주기 여부 & 내 숲 카운트 확인)
  useEffect(() => {
    const myForestId = user?.forest_id || user?.forest;
    if (!myForestId || !user?.uid) return;
    const todayStr = getLocalTodayStr();
    const q = query(
      collection(firestoreDb, 'daily_fruits'),
      where('forest_id', '==', myForestId),
      where('date', '==', todayStr)  // 오늘 날짜만 필터링
    );
    const unsub = onSnapshot(q, (snap) => {
      const countMine = snap.size;
      const todayMine = snap.docs.some(d => d.data().uid === user?.uid);
      setDailyFruitCount(countMine); // 오늘 water 카운트만
      setHasTodayFruit(todayMine);
      localStorage.setItem(`daily_fruit_${user?.uid}_${todayStr}`, String(todayMine));
      localStorage.setItem(`daily_fruit_count_${myForestId}`, String(countMine));
    });
    return () => unsub();
  }, [user?.forest_id, user?.forest, user?.uid]);

  // [최적화] 랭킹용: forest_fruit_counts 집계 문서 구독 (최대 11건)
  useEffect(() => {
    const q = collection(firestoreDb, 'forest_fruit_counts');
    const unsub = onSnapshot(q, (snap) => {
      const counts: Record<string, number> = {};
      snap.docs.forEach(d => { counts[d.id] = d.data().count || 0; });
      setAllDailyFruitsCount(counts);
    });
    return () => unsub();
  }, []);

  const leaderboard = useMemo(() => {
    return (forests || []).map((f: any) => {
      const kcFruits = (kidsCares || [])
        .filter((c: any) => c.assigned_forest_id === f.id || c.assigned_forest_id === f.forest_id)
        .reduce((sum: number, c: any) => {
          const regs = Object.values(c.registrations || {}) as number[];
          return sum + regs.reduce((s, v) => s + v, 0);
        }, 0);
      const dFruits = allDailyFruitsCount[f.id] || allDailyFruitsCount[f.forest_id] || 0;
      return { forestName: f.name, count: kcFruits + dFruits, emoji: f.emoji };
    }).sort((a: any, b: any) => b.count - a.count);
  }, [forests, kidsCares, allDailyFruitsCount]);

  const handleWaterTree = async () => {
    const forestId = user?.forest_id || user?.forest;
    if (!user?.uid || !forestId || hasTodayFruit) return;
    const todayStr = getLocalTodayStr();

    // Optimistic UI — show animation immediately
    setHasTodayFruit(true);
    setWateringAnim(true);
    setShowConfetti(true);
    setTimeout(() => setWateringAnim(false), 2000);
    setTimeout(() => setShowConfetti(false), 3000);

    try {
      // 1) daily_fruits에 오늘 기록 추가
      await addDoc(collection(firestoreDb, 'daily_fruits'), {
        uid: user.uid,
        name: user.name || '',
        forest_id: forestId,
        date: todayStr,
        created_at: new Date().toISOString()
      });
      // 2) 집계 카운터 원자적 증가
      // setDoc with merge:true → 문서가 없으면 생성, 있으면 count만 증가 (기존 값 초기화 방지)
      const counterRef = doc(firestoreDb, 'forest_fruit_counts', forestId as string);
      await setDoc(counterRef, { count: increment(1) }, { merge: true });
    } catch (e) {
      console.error('Water tree error:', e);
      // Rollback on failure
      setHasTodayFruit(false);
      setWateringAnim(false);
    }
  };

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
          sundays.add(a.date || getLocalTodayStr(d));
        }
      });
    return sundays.size;
  }, [attendance, user?.uid, currentMonth, currentYear]);

  const STAMP_TARGET = 10;

  useEffect(() => {
    const cachedWeather = sessionStorage.getItem('weatherType');
    const cachedIsDay = sessionStorage.getItem('isDay');
    const cachedTime = sessionStorage.getItem('weatherTimestamp');
    const now = Date.now();

    // 30분 이내의 캐시만 사용
    if (cachedWeather && cachedIsDay && cachedTime && (now - Number(cachedTime) < 1800000)) {
      setWeatherType(cachedWeather);
      setIsDay(cachedIsDay === 'true');
      return;
    }

    // ── 공통 헬퍼 ────────────────────────────────────────────────
    // 실제 일출(6시) / 일몰(19시) 기준 낮·밤 판단 (KST 로컬 시간)
    const getIsDayByTime = () => {
      const h = new Date().getHours();
      return h >= 6 && h < 19;
    };

    // 캐시 저장 (ttlMs: 캐시 유효 시간 밀리초)
    const saveCache = (type: string, isDayVal: boolean, ttlMs = 0) => {
      sessionStorage.setItem('weatherType', type);
      sessionStorage.setItem('isDay', String(isDayVal));
      // ttlMs > 0이면 타임스탬프를 과거로 조작해 캐시 수명을 단축
      sessionStorage.setItem('weatherTimestamp', String(Date.now() - (1800000 - ttlMs)));
    };

    // ── geolocation 지원 여부 분기 ───────────────────────────────
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        // ① 위치 허용 → Open Meteo API 호출
        async (position) => {
          try {
            const { latitude, longitude } = position.coords;
            const res = await fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
            );
            const data = await res.json();

            if (data?.current_weather?.weathercode !== undefined) {
              const code = data.current_weather.weathercode;
              const isDayData = data.current_weather.is_day === 1; // 실제 일출/일몰 기준
              let type = 'clear';
              if (code === 2 || code === 3) type = 'cloudy';
              else if ([51, 53, 55, 61, 63, 65, 80, 81, 82, 95, 96, 99].includes(code)) type = 'rain';
              else if ([71, 73, 75, 77, 85, 86].includes(code)) type = 'snow';

              setWeatherType(type);
              setIsDay(isDayData);
              saveCache(type, isDayData); // 30분 캐시
            } else {
              // API 응답은 왔으나 weathercode 없음 → 시간 기반 fallback
              const isDayVal = getIsDayByTime();
              setWeatherType('clear');
              setIsDay(isDayVal);
              saveCache('clear', isDayVal, 900000); // 15분 캐시 (재시도 빠르게)
            }
          } catch (e) {
            // ② API 네트워크 오류 → fallback + 단축 캐시
            console.error('Weather fetch error', e);
            const isDayVal = getIsDayByTime();
            setWeatherType('clear');
            setIsDay(isDayVal);
            saveCache('clear', isDayVal, 900000); // 15분 캐시
          }
        },
        // ③ 위치 권한 거부 → clear + 캐시 저장
        () => {
          const isDayVal = getIsDayByTime();
          setWeatherType('clear');
          setIsDay(isDayVal);
          saveCache('clear', isDayVal); // 30분 캐시 (재요청 방지)
        },
        { timeout: 7000, maximumAge: 600000 }
      );
    } else {
      // ④ geolocation 미지원 환경 → clear + 캐시 저장
      const isDayVal = getIsDayByTime();
      setWeatherType('clear');
      setIsDay(isDayVal);
      saveCache('clear', isDayVal);
    }
  }, []);

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
      {(isMyBirthday || showConfetti) && <Confetti width={width} height={height} recycle={!showConfetti} numberOfPieces={showConfetti ? 300 : 500} gravity={0.15} style={{ zIndex: 9999, position: 'fixed', top: 0, left: 0 }} />}
      {/* Greeting Card - Spiritual & Community Dashboard */}
      <section className={`relative overflow-hidden squircle p-8 text-white shadow-[0_15px_40px_rgba(15,96,69,0.2)] group transition-colors duration-1000 ${
        !isDay ? (
          weatherType === 'cloudy' ? 'bg-gradient-to-br from-[#2a3035] to-[#141618]' :
          weatherType === 'rain' ? 'bg-gradient-to-br from-[#1a2128] to-[#0a1014]' :
          weatherType === 'snow' ? 'bg-gradient-to-br from-[#2e3b44] to-[#182329]' :
          'bg-gradient-to-br from-[#1b193f] to-[#0a0821]'
        ) : (
          weatherType === 'cloudy' ? 'bg-gradient-to-br from-[#4b5b56] to-[#2c3d36]' :
          weatherType === 'rain' ? 'bg-gradient-to-br from-[#2a3e4c] to-[#14232c]' :
          weatherType === 'snow' ? 'bg-gradient-to-br from-[#6b8c8f] to-[#456366]' :
          'bg-gradient-to-br from-[#0F6045] to-[#1a7858]'
        )
      }`}>
        <WeatherBackground weatherType={weatherType} isDay={isDay} />
        <div className="relative z-10 flex flex-col h-full justify-between">
          
          <div className="mb-6">
            <h2 className="text-[22px] font-extrabold font-headline mb-1 tracking-tight drop-shadow-sm">
              {user.name} <span className="opacity-80 text-lg font-medium">님,</span>
            </h2>
            <p className="text-[13px] font-medium opacity-90 leading-tight drop-shadow-sm">
              {getDynamicGreeting()}
            </p>
          </div>
          
          {/* Bible Verse Area - elegant, no box, no quotes */}
          <div className="mb-8 border-l-2 border-white/30 pl-4">
            <p className="text-[14px] font-medium leading-relaxed text-white/90 break-keep drop-shadow-sm">
              {todaysVerse}
            </p>
          </div>

          {/* Gamification - Full-width fruit card + daily watering button */}
          <div className="mt-auto flex items-stretch gap-3">
            {/* Fruit count - clickable to modal */}
            <div
              onClick={() => setIsFruitModalOpen(true)}
              className="flex-1 flex flex-col justify-center gap-0.5 bg-white/10 p-3 rounded-2xl active:scale-[0.98] transition-transform cursor-pointer border border-white/5 hover:bg-white/20 backdrop-blur-md"
            >
              <span className="text-[11px] font-bold text-white/60">우리 숲 누적 열매 🌳</span>
              <span className="text-[22px] font-extrabold text-white leading-tight">{totalFruitCount}<span className="text-[13px] font-bold ml-1 opacity-70">개</span></span>
            </div>

            {/* Daily watering button */}
            <button
              onClick={handleWaterTree}
              disabled={hasTodayFruit}
              className={`relative flex flex-col items-center justify-center gap-1 px-4 py-3 rounded-2xl border transition-all active:scale-95 backdrop-blur-md ${
                hasTodayFruit
                  ? 'bg-white/5 border-white/10 cursor-default opacity-70'
                  : 'bg-emerald-400/20 border-emerald-300/30 hover:bg-emerald-400/30 cursor-pointer shadow-lg shadow-emerald-900/20'
              }`}
            >
              {wateringAnim && (
                <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-2xl animate-bounce pointer-events-none">🍎</span>
              )}
              <span className="text-2xl">{hasTodayFruit ? '✅' : '💧'}</span>
              <span className="text-[10px] font-extrabold text-white/80 whitespace-nowrap">
                {hasTodayFruit ? '수확 완료' : '오늘 물주기'}
              </span>
            </button>
          </div>
        </div>
        <div className="absolute -bottom-10 -right-10 w-40 h-40 opacity-[0.06] pointer-events-none">
          <BookOpen className="w-full h-full text-white" />
        </div>
      </section>

      {/* Kids Care Duty Notification Removed from inline body - Now handled by Duty Alert Modal */}

      {/* Quick Menu */}
      <section className="space-y-3">
        <div className="flex justify-between items-center px-2">
          <h2 className="font-headline text-xl font-bold tracking-tight text-on-surface">간편 메뉴</h2>
          <button
            onClick={() => setShowAllMenus(true)}
            className="text-xs font-bold text-primary-dim uppercase tracking-widest cursor-pointer hover:opacity-70 transition-opacity"
          >
            전체보기
          </button>
        </div>

        {/* Horizontal scroll row */}
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-2 px-2">
          {[
            { id: 'qr', icon: <QrCode className="w-6 h-6 text-primary-dim" />, label: '출석체크', bg: 'hover:bg-primary-container', onClick: () => setIsTicketModalOpen(true) },
            { id: 'my_forest', icon: <Users className="w-6 h-6 text-secondary" />, label: '숲 모임', bg: 'hover:bg-secondary-container', onClick: onNavigateToMyForestBoard },
            { id: 'survey', icon: <ClipboardList className="w-6 h-6 text-tertiary" />, label: '설문조사', bg: 'hover:bg-tertiary-container', onClick: () => onNavigate('survey') },
            { id: 'finance', icon: <Wallet className="w-6 h-6 text-emerald-800" />, label: '회비납부', bg: 'hover:bg-emerald-100', onClick: () => onNavigate('finance') },
            { id: 'minutes', icon: <FileText className="w-6 h-6 text-blue-800" />, label: '회의록', bg: 'hover:bg-blue-100', onClick: () => onNavigate('minutes') },
            { id: 'forest_items', icon: <Package className="w-6 h-6 text-amber-700" />, label: '물품관리', bg: 'hover:bg-amber-50', onClick: () => onNavigate('forest_items') },
            { id: 'prayer', icon: <HandMetal className="w-6 h-6 text-violet-600" />, label: '기도제목', bg: 'hover:bg-violet-50', onClick: () => onNavigate('prayer') },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => handleMenuClick(item.id, item.onClick)}
              className={`flex-shrink-0 flex flex-col items-center gap-2 p-3 w-[72px] bg-white rounded-2xl shadow-sm border border-gray-100 active:scale-95 transition-all group ${item.bg}`}
            >
              <div className="relative w-11 h-11 rounded-xl bg-surface-container flex items-center justify-center group-hover:scale-110 transition-transform">
                {item.icon}
                {hasNew(item.id) && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full z-10 animate-pulse shadow-sm"></span>
                )}
              </div>
              <span className="text-[10px] font-bold text-on-surface-variant whitespace-nowrap">{item.label}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 전체보기 Modal */}
      {showAllMenus && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setShowAllMenus(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-t-[2.5rem] shadow-2xl animate-in slide-in-from-bottom duration-300 pb-8"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            <div className="px-6 pt-3 pb-5 flex items-center justify-between">
              <h3 className="font-headline font-bold text-lg text-on-surface">전체 메뉴</h3>
              <button onClick={() => setShowAllMenus(false)} className="p-2 rounded-full bg-gray-100 active:scale-95">
                <X size={18} className="text-gray-600" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4 px-6">
              {[
                { id: 'qr', icon: <QrCode className="w-6 h-6 text-primary-dim" />, label: '출석체크', bg: 'bg-primary-container/30', onClick: () => { setIsTicketModalOpen(true); setShowAllMenus(false); } },
                { id: 'my_forest', icon: <Users className="w-6 h-6 text-secondary" />, label: '숲 모임', bg: 'bg-secondary-container/30', onClick: () => { onNavigateToMyForestBoard(); setShowAllMenus(false); } },
                { id: 'survey', icon: <ClipboardList className="w-6 h-6 text-tertiary" />, label: '설문조사', bg: 'bg-tertiary-container/30', onClick: () => { onNavigate('survey'); setShowAllMenus(false); } },
                { id: 'finance', icon: <Wallet className="w-6 h-6 text-emerald-800" />, label: '회비납부', bg: 'bg-emerald-50', onClick: () => { onNavigate('finance'); setShowAllMenus(false); } },
                { id: 'minutes', icon: <FileText className="w-6 h-6 text-blue-800" />, label: '회의록', bg: 'bg-blue-50', onClick: () => { onNavigate('minutes'); setShowAllMenus(false); } },
                { id: 'forest_items', icon: <Package className="w-6 h-6 text-amber-700" />, label: '물품관리', bg: 'bg-amber-50', onClick: () => { onNavigate('forest_items'); setShowAllMenus(false); } },
                { id: 'prayer', icon: <HandMetal className="w-6 h-6 text-violet-600" />, label: '기도제목', bg: 'bg-violet-50', onClick: () => { onNavigate('prayer'); setShowAllMenus(false); } },
                { id: 'calendar', icon: <Calendar className="w-6 h-6 text-rose-600" />, label: '일정', bg: 'bg-rose-50', onClick: () => { onNavigate('calendar'); setShowAllMenus(false); } },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => handleMenuClick(item.id, item.onClick)}
                  className="flex flex-col items-center gap-2 active:scale-95 transition-all group"
                >
                  <div className={`relative w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform`}>
                    {item.icon}
                    {hasNew(item.id) && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full z-10 animate-pulse shadow-sm"></span>
                    )}
                  </div>
                  <span className="text-[11px] font-bold text-on-surface-variant text-center leading-tight">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

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
    <section className="space-y-3">
      <div className="flex justify-between items-center px-2">
        <h2 className="font-headline text-xl font-bold tracking-tight text-on-surface">다가오는 일정</h2>
        <span
          onClick={() => onNavigate('calendar')}
          className="text-xs font-bold text-primary cursor-pointer hover:opacity-70 transition-opacity"
        >더보기</span>
      </div>

      {/* 가로 스크롤 카드 */}
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-2 -mx-2 px-2 snap-x snap-mandatory">
        {(() => {
          const todayStr = today;
          const currentYearStr = new Date().getFullYear().toString();
          const DAY_KR = ['일', '월', '화', '수', '목', '금', '토'];

          // 1. 생일 목록 처리
          const upcomingBirthdays = users
            ? users.filter((u: any) => u.birthdate && u.birthdate.length >= 5)
                .map((u: any) => {
                  const mm_dd = u.birthdate.substring(5);
                  let bdayFullDate = `${currentYearStr}-${mm_dd}`;
                  if (bdayFullDate < todayStr) {
                    bdayFullDate = `${parseInt(currentYearStr) + 1}-${mm_dd}`;
                  }
                  const f = forests?.find((f: any) => f.id === u.forest_id || f.id === u.forest);
                  const forestName = f ? f.name : '소속없음';
                  return {
                    id: `bday-${u.uid}`,
                    title: `${u.name}님의 생일`,
                    fullDate: bdayFullDate,
                    time: '하루 종일 🎂',
                    location: `${forestName} 숲`,
                    active: true,
                    isBirthday: true
                  };
                })
                .filter((bday: any) => bday.fullDate >= todayStr)
            : [];

          // 2. 합치고 정렬 (최대 8개)
          const validSchedules = schedules
            .filter((s: any) => s.active !== false && s.fullDate && s.fullDate >= todayStr)
            .concat(upcomingBirthdays)
            .sort((a: any, b: any) => (a.fullDate || '').localeCompare(b.fullDate || ''))
            .slice(0, 8);

          if (validSchedules.length === 0) {
            return (
              <div className="w-full text-sm text-center py-6 text-on-surface-variant">
                예정된 일정이 없습니다.
              </div>
            );
          }

          return validSchedules.map((schedule: any) => {
            const parts = schedule.fullDate ? schedule.fullDate.split('-') : [];
            const monthNum = parts.length >= 2 ? parseInt(parts[1]) : 0;
            const dayNum  = parts.length >= 3 ? parseInt(parts[2]) : 0;
            const dateObj = schedule.fullDate ? new Date(schedule.fullDate + 'T00:00:00') : null;
            const dow     = dateObj ? DAY_KR[dateObj.getDay()] : '';
            const isSun   = dateObj?.getDay() === 0;
            const isSat   = dateObj?.getDay() === 6;
            const dDay    = schedule.d_day && schedule.d_day !== 'D-?' && !schedule.d_day.includes('?')
              ? schedule.d_day
              : calculateDDay(schedule.fullDate);
            const isToday = dDay === 'D-Day';

            // 카드 배경/텍스트 색상 결정
            const cardBg  = isToday        ? 'bg-[#0F6045] border-[#0F6045]'
                          : schedule.isBirthday ? 'bg-pink-50 border-pink-100'
                          : 'bg-white border-gray-100';
            const textMain = isToday ? 'text-white' : 'text-gray-900';
            const textSub  = isToday ? 'text-white/60' : 'text-gray-400';
            const dayColor = isToday ? 'text-white'
                           : isSun   ? 'text-rose-500'
                           : isSat   ? 'text-blue-500'
                           : 'text-gray-900';
            const dowColor = isToday ? 'text-white/60'
                           : isSun   ? 'text-rose-400'
                           : isSat   ? 'text-blue-400'
                           : 'text-gray-400';

            return (
              <div
                key={schedule.id}
                onClick={() => onNavigate('calendar')}
                className={`flex-shrink-0 snap-start w-[112px] rounded-2xl p-3 flex flex-col gap-1.5 cursor-pointer active:scale-[0.96] transition-all shadow-sm border ${cardBg}`}
              >
                {/* 상단: 월 + D-Day */}
                <div className="flex items-center justify-between">
                  <span className={`text-[10px] font-bold ${textSub}`}>{monthNum}월</span>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                    isToday ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-600'
                  }`}>{dDay}</span>
                </div>

                {/* 날짜 숫자 + 요일 */}
                <div className="flex items-end gap-1 leading-none">
                  <span className={`text-[28px] font-black leading-none ${dayColor}`}>{dayNum}</span>
                  <span className={`text-[11px] font-bold mb-0.5 ${dowColor}`}>{dow}</span>
                </div>

                {/* 뱃지 (생일 / 공휴일 등) */}
                {(schedule.isBirthday || schedule.category) && (
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full w-fit ${
                    schedule.isBirthday
                      ? 'bg-pink-200 text-pink-700'
                      : isToday
                      ? 'bg-white/20 text-white'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {schedule.isBirthday ? '🎂 생일' : schedule.category}
                  </span>
                )}

                {/* 제목 */}
                <p className={`text-[11px] font-semibold leading-snug line-clamp-2 mt-auto ${
                  isToday ? 'text-white' : 'text-gray-700'
                }`}>
                  {schedule.title.replace('🎉 ', '')}
                </p>
              </div>
            );
          });
        })()}
      </div>
    </section>

    {/* Family News Highlight (Carousel) */}
    <section id="family-news-section" className="space-y-4 pt-2">
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

      <FruitStatusModal 
        isOpen={isFruitModalOpen}
        onClose={() => setIsFruitModalOpen(false)}
        teamFruitCount={teamFruitCount}
        totalFruitCount={totalFruitCount}
        forestName={forestName === '소속 없음' ? '우리' : forestName}
        leaderboard={leaderboard}
        isAdmin={user?.role === 'admin'}
      />

      {/* Popups */}
      {showDutyAlert && upcomingCareForMyForest && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-surface w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-6 pb-0 flex justify-center mt-4">
              <div className="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center">
                <Baby size={32} className="text-primary" />
              </div>
            </div>
            <div className="p-6 text-center">
              <h3 className="text-xl font-bold font-headline text-on-surface mb-2">우리 숲 봉사주간 안내</h3>
              <p className="text-on-surface-variant text-sm font-medium leading-relaxed mb-1">
                이번 주 주일({upcomingCareForMyForest.date})은 <br/>소속하신 숲이 키즈돌봄 당번입니다.
              </p>
              <p className="text-primary font-bold text-sm">
                아이들을 섬기는 기쁨에 함께해주세요!
              </p>
            </div>
            <div className="p-6 pt-2 flex flex-col gap-2">
              <button 
                onClick={() => { setShowDutyAlert(false); if (onNavigateToKidsDetail) onNavigateToKidsDetail(upcomingCareForMyForest.id); else onNavigate('kids'); }}
                className="w-full py-4 rounded-2xl bg-primary text-on-primary font-bold active:scale-95 transition-all text-sm shadow-sm"
              >
                당번 일정 상세보기
              </button>
              <button 
                onClick={async () => {
                  setShowDutyAlert(false);
                  if (user?.uid) {
                    localStorage.setItem(`duty_alert_acknowledged_v2_${upcomingCareForMyForest.id}_${user.uid}`, 'true');
                    try {
                      const notifRef = doc(firestoreDb, 'notifications', `duty_${upcomingCareForMyForest.id}_${user.uid}`);
                      const notifSnap = await getDoc(notifRef);
                      if (!notifSnap.exists()) {
                        const forestName = upcomingCareForMyForest.forest_name || upcomingCareForMyForest.forest_id || '';
                        await setDoc(notifRef, {
                          title: '🧒 키즈돌봄 당번 안내',
                          body: `안녕하세요! 이번 주 주일(${upcomingCareForMyForest.date})은 우리 숲이 키즈돌봄 봉사 당번입니다. 예배 시간 중 소중한 아이들을 함께 섬겨주세요. 감사합니다 💚`,
                          category: 'kids_care',
                          createdAt: new Date().toISOString(),
                          target_uid: user.uid,
                          linkId: upcomingCareForMyForest.id
                        });
                      }
                    } catch (e) {
                      console.error("Error creating notification:", e);
                    }
                  }
                }}
                className="w-full py-4 rounded-2xl bg-surface-container-low text-on-surface font-bold active:scale-95 transition-all text-sm"
              >
                확인했습니다
              </button>
            </div>
          </div>
        </div>
      )}

      {showFeeAlert && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-6 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-surface w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="p-6 pb-0 flex justify-center mt-4">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center animate-pulse">
                <Wallet size={32} className="text-rose-500" />
              </div>
            </div>
            <div className="p-6 text-center">
              <h3 className="text-xl font-bold font-headline text-on-surface mb-2">회비 납부 안내</h3>
              <p className="text-on-surface-variant text-sm font-medium leading-relaxed mb-3">
                벌써 이번 달의 마지막 주간입니다.<br/>
                아직 <span className="font-bold text-rose-500">이번 달 회비</span>납부가 확인되지 않았어요.
              </p>
              <p className="text-xs text-on-surface-variant/80 break-keep">
                만약 납부하셨다면 관리자 확인 대기 중일 수 있습니다. 미납이시라면 원활한 청년부 운영을 위해 납부를 부탁드립니다 🙏
              </p>
            </div>
            <div className="p-6 pt-2 flex flex-col gap-2">
              <button 
                onClick={() => { setShowFeeAlert(false); onNavigate('finance'); }}
                className="w-full py-4 rounded-2xl bg-emerald-500 text-white font-bold active:scale-95 transition-all text-sm shadow-sm"
              >
                회비 납부하러 가기
              </button>
              <button 
                onClick={() => setShowFeeAlert(false)}
                className="w-full py-4 rounded-2xl bg-surface-container-low text-on-surface font-bold active:scale-95 transition-all text-sm"
              >
                나중에 하기
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HomeView;
