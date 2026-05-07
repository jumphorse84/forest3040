import React, { useEffect, useState } from 'react';
import {
  ChevronLeft, QrCode, Users, MessageSquare, ClipboardList, Wallet,
  Package, HandMetal, Baby, BarChart2, BookOpen, FileText,
  Heart, Settings, ChevronRight, TrendingUp, AlertCircle,
  Calendar, TreePine, Play
} from 'lucide-react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db as firestoreDb } from '../firebase';

interface AdminDashboardProps {
  onBack: () => void;
  onNavigate: (page: string) => void;
  onShowToast: (msg: string) => void;
  users: any[];
  forests: any[];
  fees: any[];
  surveys: any[];
  attendance: any[];
}

interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
  icon: React.ReactNode;
}

const KpiCard = ({ label, value, sub, color, icon }: KpiCardProps) => (
  <div className={`rounded-2xl p-4 flex flex-col gap-1 ${color}`}>
    <div className="flex items-center justify-between mb-1">
      <span className="text-[11px] font-bold opacity-70">{label}</span>
      <div className="opacity-60">{icon}</div>
    </div>
    <span className="text-2xl font-black">{value}</span>
    {sub && <span className="text-[10px] opacity-60 font-medium">{sub}</span>}
  </div>
);

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  desc: string;
  badge?: string | number;
  badgeColor?: string;
  onClick: () => void;
  color: string;
}

const MenuItem = ({ icon, label, desc, badge, badgeColor = 'bg-rose-500', onClick, color }: MenuItemProps) => (
  <button
    onClick={onClick}
    className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md active:scale-[0.98] transition-all text-left group w-full"
  >
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${color} group-hover:scale-110 transition-transform`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="font-bold text-gray-900 text-sm">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5 truncate">{desc}</p>
    </div>
    {badge !== undefined && badge !== 0 && (
      <span className={`${badgeColor} text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center`}>
        {badge}
      </span>
    )}
    <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
  </button>
);

export default function AdminDashboardView({
  onBack, onNavigate, onShowToast, users, forests, fees, surveys, attendance
}: AdminDashboardProps) {
  const [prayerCount, setPrayerCount] = useState(0);
  const [itemsCount, setItemsCount] = useState(0);

  // Live counts for new features
  useEffect(() => {
    const unsub1 = onSnapshot(query(collection(firestoreDb, 'prayer_requests')), s => setPrayerCount(s.size));
    const unsub2 = onSnapshot(query(collection(firestoreDb, 'forest_items')), s => setItemsCount(s.size));
    return () => { unsub1(); unsub2(); };
  }, []);

  // KPI calculations
  const thisMonth = new Date().getMonth() + 1;
  const thisYear = new Date().getFullYear();
  const totalMembers = users.length;

  const paidThisMonth = fees.filter(f => f.year === thisYear && f.month === thisMonth && f.status === 'paid').length;
  const feeRate = totalMembers > 0 ? Math.round((paidThisMonth / totalMembers) * 100) : 0;

  const thisMonthKST = new Date();
  const startOfMonth = new Date(thisMonthKST.getFullYear(), thisMonthKST.getMonth(), 1).getTime();
  const thisMonthAttendance = attendance.filter(a => {
    const d = a.date?.seconds ? a.date.seconds * 1000 : new Date(a.date).getTime();
    return d >= startOfMonth;
  });
  const uniqueAttendees = new Set(thisMonthAttendance.map((a: any) => a.uid)).size;
  const attendRate = totalMembers > 0 ? Math.round((uniqueAttendees / totalMembers) * 100) : 0;

  const activeSurveys = surveys.filter(s => s.status === 'active').length;
  const unpaidCount = totalMembers - paidThisMonth;

  return (
    <div className="absolute inset-0 bg-[#f7f6f3] z-[60] flex flex-col min-h-screen overflow-y-auto pb-24">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100">
        <div className="flex items-center gap-3 px-4 py-4">
          <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 active:scale-95 transition-all">
            <ChevronLeft size={22} className="text-gray-700" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#0F6045] rounded-xl flex items-center justify-center">
              <Settings size={16} className="text-white" />
            </div>
            <div>
              <h1 className="font-headline font-bold text-base text-gray-900 leading-tight">관리자 대시보드</h1>
              <p className="text-[10px] text-gray-400">Forest 3040 Admin</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* KPI Summary Cards */}
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">📊 이번 달 현황</h2>
          <div className="grid grid-cols-2 gap-3">
            <KpiCard
              label="전체 멤버"
              value={totalMembers}
              sub={`숲 ${forests.length}개`}
              color="bg-[#0F6045] text-white"
              icon={<Users size={16} className="text-white" />}
            />
            <KpiCard
              label="회비 납부율"
              value={`${feeRate}%`}
              sub={`미납 ${unpaidCount}명`}
              color={feeRate >= 80 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}
              icon={<Wallet size={16} />}
            />
            <KpiCard
              label="이번달 출석"
              value={`${attendRate}%`}
              sub={`${uniqueAttendees}명 참석`}
              color="bg-blue-100 text-blue-800"
              icon={<QrCode size={16} />}
            />
            <KpiCard
              label="진행중 설문"
              value={activeSurveys}
              sub={`전체 ${surveys.length}개`}
              color="bg-violet-100 text-violet-800"
              icon={<ClipboardList size={16} />}
            />
          </div>
        </section>

        {/* 현황 & 통계 */}
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">📈 현황 & 통계</h2>
          <div className="space-y-2">
            <MenuItem
              icon={<QrCode size={20} className="text-blue-600" />}
              label="QR 출석 스캐너"
              desc="교인 QR을 스캔하여 출석 기록"
              color="bg-blue-50"
              onClick={() => onNavigate('qr_scanner')}
            />
            <MenuItem
              icon={<BarChart2 size={20} className="text-indigo-600" />}
              label="목양 통계 대시보드"
              desc="심방·새신자·성장지표 분석"
              color="bg-indigo-50"
              onClick={() => onNavigate('pastoral_stats')}
            />
            <MenuItem
              icon={<Wallet size={20} className="text-emerald-600" />}
              label="회비 / 재정 관리"
              desc="납부 현황 조회 및 알림 발송"
              badge={unpaidCount > 0 ? unpaidCount : undefined}
              color="bg-emerald-50"
              onClick={() => onNavigate('admin_finance')}
            />
          </div>
        </section>

        {/* 회원 & 조직 */}
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">👥 회원 & 조직</h2>
          <div className="space-y-2">
            <MenuItem
              icon={<Users size={20} className="text-gray-600" />}
              label="회원 권한 관리"
              desc="역할·숲 배정 및 접근 권한 설정"
              color="bg-gray-100"
              onClick={() => onNavigate('admin_users')}
            />
          </div>
        </section>

        {/* 콘텐츠 관리 */}
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">📋 콘텐츠 관리</h2>
          <div className="space-y-2">
            <MenuItem
              icon={<ClipboardList size={20} className="text-violet-600" />}
              label="설문조사 관리"
              desc="진행중인 설문 시작·마감·삭제"
              badge={activeSurveys > 0 ? `${activeSurveys}개 진행중` : undefined}
              badgeColor="bg-violet-500"
              color="bg-violet-50"
              onClick={() => onNavigate('admin_surveys')}
            />
            <MenuItem
              icon={<Play size={20} className="text-orange-500" />}
              label="프로그램 관리"
              desc="교육·행사 프로그램 등록 및 관리"
              color="bg-orange-50"
              onClick={() => onNavigate('program_add')}
            />
            <MenuItem
              icon={<BookOpen size={20} className="text-teal-600" />}
              label="온라인 주보 등록"
              desc="예배·설교 정보 및 주보 관리"
              color="bg-teal-50"
              onClick={() => onNavigate('worship_add')}
            />
            <MenuItem
              icon={<FileText size={20} className="text-blue-600" />}
              label="회의록 관리"
              desc="공동체 회의 기록 열람 및 관리"
              color="bg-blue-50"
              onClick={() => onNavigate('minutes')}
            />
            <MenuItem
              icon={<Calendar size={20} className="text-rose-500" />}
              label="일정 관리"
              desc="공동체 일정 등록 및 관리"
              color="bg-rose-50"
              onClick={() => onNavigate('calendar')}
            />
          </div>
        </section>

        {/* 공동체 관리 */}
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">🌳 공동체 관리</h2>
          <div className="space-y-2">
            <MenuItem
              icon={<Baby size={20} className="text-pink-500" />}
              label="키즈 돌봄 관리"
              desc="당번 배정·신청 현황 관리"
              color="bg-pink-50"
              onClick={() => onNavigate('kids')}
            />
            <MenuItem
              icon={<Package size={20} className="text-amber-600" />}
              label="물품 대장 관리"
              desc={`등록 물품 ${itemsCount}개 · 상태 관리`}
              color="bg-amber-50"
              onClick={() => onNavigate('forest_items')}
            />
            <MenuItem
              icon={<HandMetal size={20} className="text-violet-500" />}
              label="기도제목 관리"
              desc={`전체 ${prayerCount}건 · 부적절 게시글 관리`}
              color="bg-violet-50"
              onClick={() => onNavigate('prayer')}
            />
          </div>
        </section>

        {/* 앱 설정 */}
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">⚙️ 앱 설정</h2>
          <div className="space-y-2">
            <MenuItem
              icon={<TrendingUp size={20} className="text-amber-600" />}
              label="열매 보상 안내 설정"
              desc="보상 텍스트 편집 · 숲별 열매 초기화"
              color="bg-amber-50"
              onClick={() => onNavigate('fruit_settings')}
            />
          </div>
        </section>

        {/* 버전 정보 */}
        <div className="text-center py-4">
          <p className="text-[10px] text-gray-300 font-medium">Forest 3040 Admin v2.0</p>
          <p className="text-[10px] text-gray-200">총 멤버 {totalMembers}명 · 숲 {forests.length}개</p>
        </div>
      </div>
    </div>
  );
}
