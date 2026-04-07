import { TicketModal } from '../components/TicketModal';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Menu, Bell, User, Flame, QrCode, Users, ClipboardList, Wallet, FileText,
  MapPin, ChevronRight, ChevronLeft, Home, LayoutGrid, BookOpen, Calendar, Baby,
  MessageCircle, ArrowLeft, CheckCircle2, XCircle, FileEdit, X, Search, Phone, Lock, UserCircle, Settings, Award, Clock, Heart, MessageSquare, Send, LogOut, Sparkles, TreePine, HeartHandshake, GraduationCap, History, Plus, Play,
  SlidersHorizontal, Camera, Bookmark, MoreHorizontal, Music, Megaphone, Trash2, MoreVertical, PieChart, AlertTriangle, TrendingUp
} from 'lucide-react';
import { collection, doc, setDoc, addDoc, getDoc, onSnapshot, query, where, orderBy, getDocFromServer, Timestamp, updateDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db as firestoreDb, auth, storage } from '../firebase';
import { VISIT_CATEGORIES, MenuButton, ScheduleItem, MemberRow, OperationType, handleFirestoreError } from '../App';

const HomeView = ({ user, schedules, surveys, attendance, kidsCares = [], onNavigateToMyForestBoard, onNavigate }: any) => {

  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  
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

  return (
    <>
      {/* Greeting Card */}
      <section className="relative overflow-hidden squircle p-8 bg-gradient-to-br from-emerald-300 to-emerald-400 text-on-primary-container shadow-sm group">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-white/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
        <div className="relative z-10">
          <p className="font-headline text-lg font-semibold opacity-90 mb-1">기쁨 가득한 한 주 되세요, {user.name} 님</p>
          <div className="flex items-end gap-2">
            <h1 className="font-headline text-4xl font-extrabold tracking-tight">{user.score}점</h1>
            <span className="mb-1 text-sm font-bold opacity-75">내 활동 점수</span>
          </div>
          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/30 backdrop-blur-md py-2 px-4 rounded-full w-fit">
              <Flame className="w-4 h-4" fill="currentColor" />
              <span className="text-xs font-bold uppercase tracking-wider">상위 5%</span>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-6 -right-6 w-32 h-32 opacity-20">
          <img 
            className="w-full h-full object-contain" 
            alt="상큼한 초록 잎사귀 수채화 텍스처" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTliXpNYHI2hYhXGRPTI8UzhskQgAgV_Ea6d0i8IK-htrFSr7OjZD_TFziS-_qPf-aTbB-yelF9F_gNOMm-Ho0lqKqubgQWL3FJwo6_0TW1Dv-g6t61ojCgHZYmcIoBIeMNwxfZGXluLM9SgEi4w9z3EYsc7ADBZ6F4oHAE42NiTNwdLMQMvzdHeIpy2p5RyqXuX13Pt1xvnBNVTp-6rW8-BotFzZreFB8Z2nkpswN4JDil48AEBjijjd2Mm3dST4gwP--BYVT1Q"
            referrerPolicy="no-referrer"
          />
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
              <button onClick={() => onNavigate('kids')} className="text-xs font-bold bg-primary text-on-primary px-3 py-1.5 rounded-lg active:scale-95 transition-transform">상세 보기</button>
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
        {schedules
          .filter((s: any) => s.active !== false)
          .sort((a: any, b: any) => (a.fullDate || '').localeCompare(b.fullDate || ''))
          .slice(0, 5)
          .map((schedule: any) => {
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
                dDayClass={schedule.active ? "bg-error-container/20 text-on-error-container" : "bg-surface-container-high text-on-surface-variant"}
                active={schedule.active}
              />
            );
          })}
      </div>
    </section>

    {/* Community Highlight */}
    <section className="bg-tertiary-container/30 squircle overflow-hidden p-6 relative">
      <div className="relative z-10 flex flex-col gap-4">
        <span className="bg-tertiary text-on-tertiary text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full w-fit">멤버 이야기</span>
        <h4 className="font-headline text-2xl font-extrabold text-on-tertiary-container leading-tight">매일의 신앙 산책 속에서 평안을 찾다.</h4>
        <div className="flex items-center gap-3 mt-2">
          <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden">
            <img 
              className="w-full h-full object-cover" 
              alt="웃고 있는 한국인 남성 멤버 프로필" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA8iYWtDYB66oP6sVlyf1a1oU9e0bn0UolNyAnjiC4cWxvHHehWeK9fvFgv0MrgPHoetw6Gq74dA4LgaTdZ7QUeKwew2-w93mRv3ZOtjGJtIjb7QSJr_UNQt6k_7HiZ_QT1aRRuKgH-LeRplKy5hLDK23z4FMjTWeDbDRAte4VGf1kwa4UX9Hv68vGl3z0NyddNszTU_BOBrLFbYvTI0w3ZTQRcNbXYhqOwWj2luL7zQmuxsm55pEMyZpNPRyllwo5gchEdny8YpA"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-on-tertiary-container">다윗 민</span>
            <span className="text-[10px] font-medium text-tertiary-dim uppercase">디자인 팀</span>
          </div>
        </div>
      </div>
      <div className="absolute top-0 right-0 w-1/2 h-full">
        <img 
          className="w-full h-full object-cover mix-blend-multiply opacity-20" 
          alt="가을 숲의 부드러운 배경" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDbWVS0jJsnx05Pemrlg8SarOQuUSDp0emLH_KtYNKtZrnmHdvbmGzAMCBJru2-poOs2AR8pdpCx8PHwGzRHJGODwnEjjZFj9bDlayCSSLjBPXxCOTCKMyDb7wPEoSprE1u36FcBS77CVhkXsjcS4qjlhP2plOsn7bhJ1nzX32Xo2Qq0klT6aLFyNc3gtMNKTgfMDWmhv-v7eOWeMxB1zLwwK6hGNcEo3pFocbyNAOUSZ1Vnrh6a25wv5ZAHYx6LICCr3RyHUTYEg"
          referrerPolicy="no-referrer"
        />
      </div>
    </section>

      <TicketModal 
        isOpen={isTicketModalOpen} 
        onClose={() => setIsTicketModalOpen(false)} 
        user={ticketUser} 
      />
    </>
  );
};

export default HomeView;
