import React, { useState, useEffect } from 'react';
import {
  X, Bell, Moon, Sun, Monitor, Shield, FileText, Info,
  LogOut, ChevronRight, Trash2, Check, ChevronLeft, Mail,
  CheckCircle2, AlertCircle
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db as firestoreDb } from '../firebase';
import { requestAndSaveFcmToken, removeFcmToken } from '../hooks/useNotification';

const APP_VERSION = '1.0.5';

// ─── Theme helpers ─────────────────────────────────────────────────────
const THEME_KEY = 'forest_theme';

function applyTheme(theme: string) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else if (theme === 'light') {
    root.classList.remove('dark');
  } else {
    // system
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    prefersDark ? root.classList.add('dark') : root.classList.remove('dark');
  }
}

export function initTheme() {
  const saved = localStorage.getItem(THEME_KEY) || 'system';
  applyTheme(saved);
}

// ─── Sub-components ────────────────────────────────────────────────────
const ToggleSwitch = ({ enabled, onChange }: { enabled: boolean; onChange: () => void }) => (
  <button
    onClick={onChange}
    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none ${
      enabled ? 'bg-primary' : 'bg-surface-container-highest'
    }`}
  >
    <span
      className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
        enabled ? 'translate-x-6' : 'translate-x-1'
      }`}
    />
  </button>
);

const THEME_OPTIONS = [
  { id: 'system', label: '시스템 설정', icon: Monitor },
  { id: 'light', label: '라이트', icon: Sun },
  { id: 'dark', label: '다크', icon: Moon },
];

// ─── Content data ──────────────────────────────────────────────────────
const TERMS_CONTENT = `서비스 이용약관

제1조 (목적)
본 약관은 Forest 앱(이하 "앱")이 제공하는 서비스의 이용 조건 및 절차, 이용자와 앱의 권리, 의무, 책임 사항과 기타 필요한 사항을 규정함을 목적으로 합니다.

제2조 (이용약관의 효력 및 변경)
본 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.

제3조 (서비스의 제공)
앱은 교회 공동체 내 소통, 일정 관리, 소그룹 활동 지원 등의 서비스를 제공합니다.

제4조 (개인정보 보호)
앱은 관계 법령이 정하는 바에 따라 이용자의 개인정보를 보호합니다. 개인정보의 보호 및 사용에 대해서는 개인정보 처리방침을 적용합니다.

제5조 (이용자의 의무)
이용자는 다음 행위를 해서는 안 됩니다.
- 타인의 정보 도용
- 앱 운영을 방해하는 행위
- 공동체 윤리에 어긋나는 콘텐츠 게시`;

const PRIVACY_CONTENT = `개인정보 처리방침

1. 수집하는 개인정보 항목
- 이름, 이메일 주소, 프로필 사진 (Google 계정 연동)
- 소속 정보, 연락처 (선택 입력)
- 출석 기록, 활동 내역

2. 개인정보의 수집 및 이용 목적
- 서비스 회원 식별 및 관리
- 소그룹(숲) 활동 지원 및 커뮤니케이션
- 출석 및 활동 통계 제공

3. 개인정보의 보유 및 이용 기간
이용자가 회원 탈퇴를 요청하거나 관리자에 의해 삭제 처리된 경우 즉시 파기합니다.

4. 개인정보 보호 조치
Firebase(Google Cloud) 보안 인프라를 이용하며, Firestore 보안 규칙을 통해 인증된 사용자만 데이터에 접근할 수 있습니다.

5. 문의처
개인정보 관련 문의는 관리자(jumphorse@nate.com)에게 연락해 주세요.`;

// ─── Main Component ────────────────────────────────────────────────────
interface AccountSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  user: any;
}

export const AccountSettingsModal = ({ isOpen, onClose, onLogout, user }: AccountSettingsModalProps) => {
  const [notifAll, setNotifAll] = useState(true);
  const [notifCommunity, setNotifCommunity] = useState(true);
  const [notifSchedule, setNotifSchedule] = useState(true);
  const [theme, setTheme] = useState<string>('system');
  const [subPage, setSubPage] = useState<'terms' | 'privacy' | 'withdraw' | null>(null);
  const [saving, setSaving] = useState(false);
  const [notifPermission, setNotifPermission] = useState<string>('default');

  // Load persisted settings on open
  useEffect(() => {
    if (!isOpen || !user?.uid) return;
    const savedTheme = localStorage.getItem(THEME_KEY) || 'system';
    setTheme(savedTheme);
    setNotifAll(user.notif_all !== false);
    setNotifCommunity(user.notif_community !== false);
    setNotifSchedule(user.notif_schedule !== false);
    setSubPage(null);
    if ('Notification' in window) {
      setNotifPermission(Notification.permission);
    } else {
      setNotifPermission('unsupported');
    }
  }, [isOpen, user?.uid]);

  if (!isOpen) return null;

  // ── Notification toggle helpers ──────────────────────────────────────
  const saveNotifSetting = async (field: string, value: boolean) => {
    if (!user?.uid) return;
    setSaving(true);
    try {
      await updateDoc(doc(firestoreDb, 'users', user.uid), { [field]: value });
    } catch (e) {
      console.error('Failed to save notification setting', e);
    } finally {
      setSaving(false);
    }
  };

  const handleNotifAll = async () => {
    const next = !notifAll;
    setNotifAll(next);
    setSaving(true);
    try {
      if (next) {
        // Request permission + register FCM token
        const result = await requestAndSaveFcmToken(user.uid);
        setNotifPermission(result === 'granted' ? 'granted' : result === 'denied' ? 'denied' : 'unsupported');
        if (result !== 'granted') {
          // Revert if permission denied
          setNotifAll(false);
          await updateDoc(doc(firestoreDb, 'users', user.uid), { notif_all: false });
          setSaving(false);
          return;
        }
      } else {
        // Remove FCM token
        await removeFcmToken(user.uid);
      }
      await updateDoc(doc(firestoreDb, 'users', user.uid), { notif_all: next });
    } catch (e) {
      console.error('handleNotifAll error', e);
    } finally {
      setSaving(false);
    }
  };
  const handleNotifCommunity = () => {
    const next = !notifCommunity;
    setNotifCommunity(next);
    saveNotifSetting('notif_community', next);
  };
  const handleNotifSchedule = () => {
    const next = !notifSchedule;
    setNotifSchedule(next);
    saveNotifSetting('notif_schedule', next);
  };

  // ── Theme helpers ────────────────────────────────────────────────────
  const handleTheme = (id: string) => {
    setTheme(id);
    localStorage.setItem(THEME_KEY, id);
    applyTheme(id);
  };

  const handleLogout = () => {
    onClose();
    setTimeout(() => onLogout(), 300);
  };

  // ── UI helpers ───────────────────────────────────────────────────────
  const SectionTitle = ({ children }: { children: React.ReactNode }) => (
    <p className="text-[10px] font-extrabold text-outline uppercase tracking-[0.18em] px-2 pt-4 pb-2">
      {children}
    </p>
  );

  const SettingsRow = ({
    icon: Icon, label, sublabel, right, onClick, danger = false,
  }: {
    icon: any; label: string; sublabel?: string;
    right?: React.ReactNode; onClick?: () => void; danger?: boolean;
  }) => (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all active:scale-[0.98] ${
        danger
          ? 'bg-error/5 hover:bg-error/10 active:bg-error/15'
          : 'bg-surface-container-lowest hover:bg-surface-container-low'
      }`}
    >
      <div className="flex items-center gap-3.5">
        <div className={`p-2 rounded-xl ${danger ? 'bg-error/10' : 'bg-surface-container-high'}`}>
          <Icon size={18} className={danger ? 'text-error' : 'text-on-surface-variant'} />
        </div>
        <div className="text-left">
          <p className={`text-sm font-bold ${danger ? 'text-error' : 'text-on-surface'}`}>{label}</p>
          {sublabel && <p className="text-xs text-on-surface-variant mt-0.5">{sublabel}</p>}
        </div>
      </div>
      <div className="ml-auto pl-3">
        {right ?? (onClick ? <ChevronRight size={18} className={danger ? 'text-error/50' : 'text-outline'} /> : null)}
      </div>
    </button>
  );

  // ── Sub-page renderer ────────────────────────────────────────────────
  const renderSubPage = () => {
    if (subPage === 'terms' || subPage === 'privacy') {
      const title = subPage === 'terms' ? '서비스 이용약관' : '개인정보 처리방침';
      const content = subPage === 'terms' ? TERMS_CONTENT : PRIVACY_CONTENT;
      return (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center gap-3 px-5 pb-4 pt-1">
            <button onClick={() => setSubPage(null)} className="p-2 rounded-full hover:bg-surface-container-low transition-colors">
              <ChevronLeft size={20} className="text-on-surface-variant" />
            </button>
            <h3 className="font-headline font-bold text-lg text-on-surface">{title}</h3>
          </div>
          <div className="overflow-y-auto px-6 pb-10">
            <pre className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap font-body">
              {content}
            </pre>
          </div>
        </div>
      );
    }

    if (subPage === 'withdraw') {
      return (
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex items-center gap-3 px-5 pb-4 pt-1">
            <button onClick={() => setSubPage(null)} className="p-2 rounded-full hover:bg-surface-container-low transition-colors">
              <ChevronLeft size={20} className="text-on-surface-variant" />
            </button>
            <h3 className="font-headline font-bold text-lg text-error">회원 탈퇴</h3>
          </div>
          <div className="px-6 pb-10 space-y-6">
            <div className="bg-error/5 border border-error/20 rounded-3xl p-6 space-y-3">
              <p className="font-bold text-error text-sm">탈퇴 전 꼭 확인해주세요</p>
              <ul className="text-sm text-on-surface-variant space-y-2 list-disc list-inside leading-relaxed">
                <li>모든 활동 기록 및 데이터가 삭제됩니다.</li>
                <li>탈퇴 후 동일한 계정으로 재가입하여도 이전 데이터는 복구되지 않습니다.</li>
                <li>탈퇴는 관리자에게 직접 요청해야 처리됩니다.</li>
              </ul>
            </div>
            <div className="bg-surface-container-lowest rounded-3xl p-6 space-y-3">
              <p className="font-bold text-on-surface text-sm">탈퇴 요청 방법</p>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                아래 이메일로 탈퇴 의사를 전달해 주시면 관리자가 확인 후 24시간 이내에 처리해 드립니다.
              </p>
              <a
                href="mailto:jumphorse@nate.com?subject=회원탈퇴 요청"
                className="flex items-center gap-3 bg-primary/10 text-primary font-bold px-5 py-3.5 rounded-2xl active:scale-95 transition-all"
              >
                <Mail size={18} />
                jumphorse@nate.com 으로 탈퇴 요청
              </a>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  // ── Main settings list ───────────────────────────────────────────────
  const renderMain = () => (
    <div className="overflow-y-auto px-4 pb-10 space-y-1 flex-1">

      {/* 알림 설정 */}
      <SectionTitle>알림 설정</SectionTitle>
      <div className="bg-surface-container-lowest rounded-2xl overflow-hidden divide-y divide-surface-container">
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3.5">
            <div className="p-2 rounded-xl bg-surface-container-high">
              <Bell size={18} className="text-on-surface-variant" />
            </div>
            <div>
              <p className="text-sm font-bold text-on-surface">전체 알림</p>
              <p className="text-xs text-on-surface-variant mt-0.5">모든 앱 알림 허용</p>
            </div>
          </div>
          <ToggleSwitch enabled={notifAll} onChange={handleNotifAll} />
        </div>
        <div className={`flex items-center justify-between px-4 py-3.5 transition-opacity ${notifAll ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <div className="flex items-center gap-3.5">
            <div className="w-[34px]" />
            <p className="text-sm font-medium text-on-surface">커뮤니티 새 소식</p>
          </div>
          <ToggleSwitch enabled={notifCommunity} onChange={handleNotifCommunity} />
        </div>
        <div className={`flex items-center justify-between px-4 py-3.5 transition-opacity ${notifAll ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
          <div className="flex items-center gap-3.5">
            <div className="w-[34px]" />
            <p className="text-sm font-medium text-on-surface">일정 및 공지 알림</p>
          </div>
          <ToggleSwitch enabled={notifSchedule} onChange={handleNotifSchedule} />
        </div>
      </div>
      {saving && <p className="text-[10px] text-primary font-bold text-right px-2 animate-pulse">저장 중...</p>}

      {/* 화면 테마 */}
      <SectionTitle>화면 테마</SectionTitle>
      <div className="bg-surface-container-lowest rounded-2xl overflow-hidden divide-y divide-surface-container">
        {THEME_OPTIONS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => handleTheme(id)}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-surface-container-low transition-colors active:scale-[0.98]"
          >
            <div className="flex items-center gap-3.5">
              <div className="p-2 rounded-xl bg-surface-container-high">
                <Icon size={18} className="text-on-surface-variant" />
              </div>
              <p className="text-sm font-bold text-on-surface">{label}</p>
            </div>
            {theme === id && (
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-md">
                <Check size={14} className="text-on-primary" />
              </div>
            )}
          </button>
        ))}
      </div>

      {/* 앱 정보 */}
      <SectionTitle>앱 정보</SectionTitle>
      <div className="bg-surface-container-lowest rounded-2xl overflow-hidden divide-y divide-surface-container">
        <SettingsRow icon={FileText} label="서비스 이용약관" onClick={() => setSubPage('terms')} />
        <SettingsRow icon={Shield} label="개인정보 처리방침" onClick={() => setSubPage('privacy')} />
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3.5">
            <div className="p-2 rounded-xl bg-surface-container-high">
              <Info size={18} className="text-on-surface-variant" />
            </div>
            <p className="text-sm font-bold text-on-surface">앱 버전</p>
          </div>
          <span className="text-xs font-bold text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
            v{APP_VERSION}
          </span>
        </div>
      </div>

      {/* 계정 관리 */}
      <SectionTitle>계정 관리</SectionTitle>
      <div className="space-y-2">
        <SettingsRow
          icon={LogOut}
          label="로그아웃"
          sublabel={user?.email || ''}
          onClick={handleLogout}
          danger
        />
        <SettingsRow
          icon={Trash2}
          label="회원탈퇴"
          sublabel="탈퇴 절차 및 주의사항 안내"
          onClick={() => setSubPage('withdraw')}
          danger
        />
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-surface rounded-t-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-8 duration-300">

        {/* Handle Bar */}
        <div className="flex justify-center pt-4 pb-2 shrink-0">
          <div className="w-10 h-1.5 bg-surface-container-high rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-4 pt-1 shrink-0">
          <h2 className="text-xl font-headline font-bold text-on-surface">계정 설정</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-surface-container-low hover:bg-surface-container transition-colors"
          >
            <X size={20} className="text-on-surface-variant" />
          </button>
        </div>

        {/* Content — either main list or a sub-page */}
        {subPage ? renderSubPage() : renderMain()}
      </div>
    </div>
  );
};
