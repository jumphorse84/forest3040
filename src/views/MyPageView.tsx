import React, { useState } from 'react';
import {
  ChevronLeft, ChevronRight, LogOut, Lock,
  Moon, Sun, Monitor, Shield, FileText, Info,
  Check, Trash2, Mail, CheckCircle2, Plus, X, Edit2
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db as firestoreDb } from '../firebase';
import { OperationType, handleFirestoreError, FOREST_GROUPS } from '../App';

// ── Theme helpers ──────────────────────────────────────────────────────
const THEME_KEY = 'forest_theme';
function applyTheme(theme: string) {
  const root = document.documentElement;
  if (theme === 'dark') root.classList.add('dark');
  else if (theme === 'light') root.classList.remove('dark');
  else {
    window.matchMedia('(prefers-color-scheme: dark)').matches
      ? root.classList.add('dark')
      : root.classList.remove('dark');
  }
}

const THEME_OPTIONS = [
  { id: 'system', label: '시스템 설정', icon: Monitor },
  { id: 'light', label: '라이트 모드', icon: Sun },
  { id: 'dark', label: '다크 모드', icon: Moon },
];

type Tab = 'basic' | 'faith' | 'settings';

// ── Field helpers ─────────────────────────────────────────────────
const FieldLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11px] font-extrabold text-outline uppercase tracking-widest mb-2 px-1">{children}</p>
);

const FieldInput = (props: any) => (
  <input
    {...props}
    className="w-full bg-surface-container-lowest border border-surface-container-low rounded-2xl px-4 py-3.5 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
  />
);

const MyPageView = ({ user, forests, attendance, onBack, onShowToast, onLogout, onNavigateToAdmin }: any) => {
  const [activeTab, setActiveTab] = useState<Tab>('basic');

  // ── Basic Info ──────────────────────────────────────────────────────
  const [editName, setEditName] = useState(user.name || '');
  const [editPhone, setEditPhone] = useState(user.phone || '');
  const [editBio, setEditBio] = useState(user.bio || '');
  const [isSavingBasic, setIsSavingBasic] = useState(false);

  // ── Faith Info ──────────────────────────────────────────────────────
  const [editGender, setEditGender] = useState(user.gender || '');
  const [editHasKids, setEditHasKids] = useState<boolean | null>(
    user.has_kids !== undefined ? user.has_kids : null
  );
  const [editKidsInfo, setEditKidsInfo] = useState(user.kids_info || '');
  const [editChildren, setEditChildren] = useState<any[]>(user.children || []);
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [childForm, setChildForm] = useState({ id: '', name: '', birthYear: '', gender: 'male', notes: '' });
  
  const [editForestId, setEditForestId] = useState(user.forest_id || '');
  const [isSavingFaith, setIsSavingFaith] = useState(false);

  // ── App Settings ────────────────────────────────────────────────────
  const [theme, setTheme] = useState<string>(() => localStorage.getItem(THEME_KEY) || 'system');
  const [subSettings, setSubSettings] = useState<'terms' | 'privacy' | 'withdraw' | null>(null);

  const availableForests = forests?.length > 0 ? forests : FOREST_GROUPS;

  const forestName = availableForests.find((f: any) =>
    f.forest_id === user.forest_id || f.id === user.forest_id
  )?.name || '소속 없음';

  // ── Save handlers ────────────────────────────────────────────────────
  const handleSaveBasic = async () => {
    if (!editName.trim()) { onShowToast('이름을 입력해 주세요.'); return; }
    setIsSavingBasic(true);
    try {
      await updateDoc(doc(firestoreDb, 'users', user.uid), {
        name: editName.trim(),
        phone: editPhone,
        bio: editBio,
      });
      onShowToast('기본 정보가 저장되었습니다.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setIsSavingBasic(false);
    }
  };

  const handleSaveFaith = async () => {
    setIsSavingFaith(true);
    try {
      await updateDoc(doc(firestoreDb, 'users', user.uid), {
        gender: editGender,
        has_kids: editHasKids,
        kids_info: editHasKids ? editKidsInfo : '',
        children: editHasKids ? editChildren : [],
        forest_id: editForestId,
      });
      onShowToast('신앙 정보가 저장되었습니다.');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setIsSavingFaith(false);
    }
  };

  const handleTheme = (id: string) => {
    setTheme(id);
    localStorage.setItem(THEME_KEY, id);
    applyTheme(id);
  };

  // ── Tab definitions ───────────────────────────────────────────────
  const TABS: { id: Tab; label: string }[] = [
    { id: 'basic', label: '기본 정보' },
    { id: 'faith', label: '신앙 정보' },
    { id: 'settings', label: '앱 설정' },
  ];

  // ── Terms / Privacy / Withdraw sub-pages ──────────────────────────
  const TERMS = `서비스 이용약관\n\n제1조 (목적)\n본 약관은 Forest 앱이 제공하는 서비스의 이용 조건 및 절차, 이용자와 앱의 권리·의무·책임 사항을 규정합니다.\n\n제2조 (서비스의 제공)\n앱은 교회 공동체 내 소통, 일정 관리, 소그룹 활동 지원 등의 서비스를 제공합니다.\n\n제3조 (개인정보 보호)\n앱은 관계 법령이 정하는 바에 따라 이용자의 개인정보를 보호합니다.`;
  const PRIVACY = `개인정보 처리방침\n\n1. 수집 항목\n이름, 이메일, 프로필 사진(Google 연동), 소속, 연락처(선택), 출석·활동 내역\n\n2. 수집·이용 목적\n회원 식별 및 관리, 소그룹 활동 지원, 출석 통계\n\n3. 보유 기간\n회원 탈퇴 또는 관리자 삭제 시 즉시 파기\n\n4. 보안\nFirebase(Google Cloud) 인프라 및 Firestore 보안 규칙 적용\n\n5. 문의\njumphorse@nate.com`;

  if (subSettings) {
    return (
      <div className="absolute inset-0 bg-surface z-[60] flex flex-col min-h-screen overflow-y-auto">
        <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-surface-container-low px-4 py-3 flex items-center gap-3 max-w-md mx-auto w-full">
          <button onClick={() => setSubSettings(null)} className="p-2 rounded-full hover:bg-surface-container-low transition-colors">
            <ChevronLeft size={22} className="text-on-surface-variant" />
          </button>
          <h1 className="font-headline font-bold text-base text-on-surface">
            {subSettings === 'terms' ? '서비스 이용약관' : subSettings === 'privacy' ? '개인정보 처리방침' : '회원 탈퇴'}
          </h1>
        </header>
        <main className="max-w-md mx-auto w-full px-6 py-6">
          {subSettings === 'withdraw' ? (
            <div className="space-y-5">
              <div className="bg-error/5 border border-error/20 rounded-3xl p-6 space-y-3">
                <p className="font-bold text-error text-sm">탈퇴 전 꼭 확인해주세요</p>
                <ul className="text-sm text-on-surface-variant space-y-2 list-disc list-inside leading-relaxed">
                  <li>모든 활동 기록 및 데이터가 삭제됩니다.</li>
                  <li>탈퇴 후 동일 계정으로 재가입해도 이전 데이터는 복구되지 않습니다.</li>
                  <li>탈퇴는 관리자에게 직접 요청해야 처리됩니다.</li>
                </ul>
              </div>
              <div className="bg-surface-container-lowest rounded-3xl p-6 space-y-3">
                <p className="font-bold text-on-surface text-sm">탈퇴 요청 방법</p>
                <p className="text-sm text-on-surface-variant leading-relaxed">아래 이메일로 탈퇴 의사를 전달해 주시면 관리자가 확인 후 24시간 이내 처리합니다.</p>
                <a href="mailto:jumphorse@nate.com?subject=회원탈퇴 요청" className="flex items-center gap-3 bg-primary/10 text-primary font-bold px-5 py-3.5 rounded-2xl active:scale-95 transition-all">
                  <Mail size={18} />
                  탈퇴 요청 이메일 보내기
                </a>
              </div>
            </div>
          ) : (
            <pre className="text-sm text-on-surface-variant leading-relaxed whitespace-pre-wrap font-body">
              {subSettings === 'terms' ? TERMS : PRIVACY}
            </pre>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-surface z-[60] flex flex-col min-h-screen overflow-y-auto pb-16">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-surface-container-low px-4 py-3 flex items-center gap-3 max-w-md mx-auto w-full">
        <button onClick={onBack} className="p-2 rounded-full hover:bg-surface-container-low transition-colors">
          <ChevronLeft size={22} className="text-on-surface-variant" />
        </button>
        <h1 className="font-headline font-bold text-lg text-on-surface flex-1">마이페이지</h1>
      </header>

      {/* Child Add/Edit Overlay */}
      {isAddingChild && (
        <div className="absolute inset-0 z-[70] bg-surface flex flex-col min-h-screen overflow-y-auto">
          <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-surface-container-low px-4 py-3 flex items-center gap-3 max-w-md mx-auto w-full">
            <button onClick={() => { setIsAddingChild(false); setChildForm({ id: '', name: '', birthYear: '', gender: 'male', notes: '' }); }} className="p-2 rounded-full hover:bg-surface-container-low transition-colors">
              <ChevronLeft size={22} className="text-on-surface-variant" />
            </button>
            <h1 className="font-headline font-bold text-base text-on-surface flex-1">{childForm.id ? '자녀 정보 수정' : '자녀 추가'}</h1>
          </header>
          <main className="max-w-md mx-auto w-full px-5 py-6 space-y-6">
            <div>
              <FieldLabel>이름 (또는 태명)</FieldLabel>
              <FieldInput type="text" value={childForm.name} onChange={(e: any) => setChildForm({...childForm, name: e.target.value})} placeholder="예: 이봄" />
            </div>
            <div>
              <FieldLabel>출생 연도</FieldLabel>
              <FieldInput type="number" value={childForm.birthYear} onChange={(e: any) => setChildForm({...childForm, birthYear: e.target.value})} placeholder="예: 2018" />
            </div>
            <div>
              <FieldLabel>성별</FieldLabel>
              <div className="grid grid-cols-2 gap-3">
                {[{ val: 'male', label: '남아 👦' }, { val: 'female', label: '여아 👧' }].map(g => (
                  <button key={g.val} onClick={() => setChildForm({...childForm, gender: g.val})} className={`py-3.5 rounded-2xl font-bold text-sm transition-all border ${childForm.gender === g.val ? 'bg-primary/10 border-primary text-primary' : 'bg-surface-container-lowest border-surface-container-low text-on-surface-variant'}`}>
                    {g.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <FieldLabel>특이사항 (선택)</FieldLabel>
              <textarea value={childForm.notes} onChange={(e: any) => setChildForm({...childForm, notes: e.target.value})} placeholder="알레르기, 주의사항 등" rows={3} className="w-full bg-surface-container-lowest border border-surface-container-low rounded-2xl px-4 py-3.5 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none" />
            </div>
            <button 
              onClick={() => {
                if (!childForm.name || !childForm.birthYear) { onShowToast('이름과 출생 연도를 입력해주세요.'); return; }
                if (childForm.id) {
                  setEditChildren(editChildren.map(c => c.id === childForm.id ? childForm : c));
                } else {
                  setEditChildren([...editChildren, { ...childForm, id: Date.now().toString() }]);
                }
                setIsAddingChild(false);
                setChildForm({ id: '', name: '', birthYear: '', gender: 'male', notes: '' });
              }} 
              className="w-full py-4 bg-primary text-on-primary rounded-2xl font-bold active:scale-95 transition-all"
            >
              저장하기
            </button>
          </main>
        </div>
      )}

      <main className="max-w-md mx-auto w-full px-5 pt-6 space-y-6">

        {/* Profile Card */}
        <section className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/15 rounded-3xl p-6 flex items-center gap-5">
          <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg bg-primary-container flex items-center justify-center text-2xl font-bold text-on-primary-container shrink-0">
            {user.photoURL || user.profile_image
              ? <img alt="프로필" className="w-full h-full object-cover" src={user.photoURL || user.profile_image} referrerPolicy="no-referrer" />
              : <span>{user.name?.charAt(0)}</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xl font-extrabold text-primary font-headline tracking-tight truncate">{user.name}</p>
            <span className="inline-block bg-primary/15 text-primary px-3 py-0.5 rounded-full text-[11px] font-bold mt-1">{forestName}</span>
            {user.bio && <p className="text-[12px] text-on-surface-variant italic mt-1.5 truncate">{user.bio}</p>}
          </div>
        </section>

        {/* Tab Bar */}
        <div className="flex bg-surface-container-low rounded-2xl p-1 gap-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-white text-primary shadow-sm'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab: 기본 정보 ──────────────────────────────────── */}
        {activeTab === 'basic' && (
          <section className="space-y-5">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-surface-container-low space-y-5">

              <div>
                <FieldLabel>이름 (실명)</FieldLabel>
                <FieldInput
                  type="text"
                  value={editName}
                  onChange={(e: any) => setEditName(e.target.value)}
                  placeholder="실명을 입력하세요"
                />
              </div>

              <div>
                <FieldLabel>이메일</FieldLabel>
                <div className="w-full bg-surface-container rounded-2xl px-4 py-3.5 text-sm text-on-surface-variant border border-surface-container-low flex items-center justify-between">
                  <span>{user.email || '이메일 없음'}</span>
                  <span className="text-[10px] text-outline bg-surface-container-high px-2 py-0.5 rounded-full">수정 불가</span>
                </div>
              </div>

              <div>
                <FieldLabel>전화번호</FieldLabel>
                <FieldInput
                  type="tel"
                  value={editPhone}
                  onChange={(e: any) => setEditPhone(e.target.value)}
                  placeholder="010-0000-0000"
                />
              </div>

              <div>
                <FieldLabel>상태 메시지</FieldLabel>
                <textarea
                  value={editBio}
                  onChange={e => setEditBio(e.target.value)}
                  placeholder="간단한 한 마디를 남겨보세요."
                  rows={2}
                  className="w-full bg-surface-container-lowest border border-surface-container-low rounded-2xl px-4 py-3.5 text-sm text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                />
              </div>
            </div>

            <button
              onClick={handleSaveBasic}
              disabled={isSavingBasic}
              className="w-full py-4 bg-primary text-on-primary rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={18} />
              {isSavingBasic ? '저장 중...' : '기본 정보 저장'}
            </button>
          </section>
        )}

        {/* ── Tab: 신앙 정보 ──────────────────────────────────── */}
        {activeTab === 'faith' && (
          <section className="space-y-5">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-surface-container-low space-y-5">

              {/* 성별 */}
              <div>
                <FieldLabel>성별</FieldLabel>
                <div className="grid grid-cols-2 gap-3">
                  {[{ val: 'male', label: '남성' }, { val: 'female', label: '여성' }].map(g => (
                    <button
                      key={g.val}
                      onClick={() => setEditGender(g.val)}
                      className={`py-3.5 rounded-2xl font-bold text-sm transition-all border ${
                        editGender === g.val
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-surface-container-lowest border-surface-container-low text-on-surface-variant'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 소속 숲 */}
              <div>
                <FieldLabel>소속 숲</FieldLabel>
                <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                  {availableForests.map((f: any) => (
                    <button
                      key={f.forest_id}
                      onClick={() => setEditForestId(f.forest_id)}
                      className={`py-2.5 px-1 rounded-xl font-bold text-xs transition-all border ${
                        editForestId === f.forest_id
                          ? 'bg-primary text-on-primary border-primary shadow-sm'
                          : 'bg-surface-container-lowest border-surface-container-low text-on-surface-variant hover:bg-surface-container'
                      }`}
                    >
                      {f.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 자녀 유무 */}
              <div>
                <FieldLabel>자녀 유무</FieldLabel>
                <div className="grid grid-cols-2 gap-3">
                  {[{ val: true, label: '있음 👶' }, { val: false, label: '없음' }].map(k => (
                    <button
                      key={String(k.val)}
                      onClick={() => { setEditHasKids(k.val); if (!k.val) setEditKidsInfo(''); }}
                      className={`py-3.5 rounded-2xl font-bold text-sm transition-all border ${
                        editHasKids === k.val
                          ? 'bg-primary/10 border-primary text-primary'
                          : 'bg-surface-container-lowest border-surface-container-low text-on-surface-variant'
                      }`}
                    >
                      {k.label}
                    </button>
                  ))}
                </div>
                {editHasKids && (
                  <div className="mt-4 space-y-3">
                    {editChildren.map(child => (
                      <div key={child.id} className="relative bg-surface-container-low border border-surface-container-high rounded-2xl p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${child.gender === 'male' ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                            {child.gender === 'male' ? '👦' : '👧'}
                          </div>
                          <div>
                            <p className="font-bold text-on-surface text-sm">{child.name} <span className="text-xs text-on-surface-variant font-medium ml-1">({child.birthYear}년생)</span></p>
                            {child.notes && <p className="text-xs text-on-surface-variant mt-0.5 max-w-[150px] truncate">{child.notes}</p>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => { setChildForm(child); setIsAddingChild(true); }} className="p-2 text-on-surface-variant hover:bg-surface-container-highest rounded-full transition-colors"><Edit2 size={16} /></button>
                          <button onClick={() => setEditChildren(editChildren.filter(c => c.id !== child.id))} className="p-2 text-error/70 hover:bg-error/10 rounded-full transition-colors"><Trash2 size={16} /></button>
                        </div>
                      </div>
                    ))}
                    
                    <button onClick={() => setIsAddingChild(true)} className="w-full py-4 border-2 border-dashed border-primary/30 text-primary font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-primary/5 transition-colors">
                      <Plus size={18} /> 자녀 추가
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleSaveFaith}
              disabled={isSavingFaith}
              className="w-full py-4 bg-primary text-on-primary rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <CheckCircle2 size={18} />
              {isSavingFaith ? '저장 중...' : '신앙 정보 저장'}
            </button>
          </section>
        )}

        {/* ── Tab: 앱 설정 ─────────────────────────────────────── */}
        {activeTab === 'settings' && (
          <section className="space-y-5">

            {/* 관리자 */}
            {(user.role === 'admin' || user.email === 'jumphorse@nate.com' || user.email === 'seokgwan.ms01@gmail.com') && (
              <div>
                <p className="text-[11px] font-extrabold text-outline uppercase tracking-widest mb-2 px-1">관리자</p>
                <button onClick={onNavigateToAdmin} className="w-full flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-2xl active:scale-95 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Lock size={18} className="text-primary" />
                    </div>
                    <span className="font-bold text-primary text-sm">관리자 권한 설정</span>
                  </div>
                  <ChevronRight size={18} className="text-primary/50" />
                </button>
              </div>
            )}

            {/* 화면 테마 */}
            <div>
              <p className="text-[11px] font-extrabold text-outline uppercase tracking-widest mb-2 px-1">화면 테마</p>
              <div className="bg-white rounded-2xl overflow-hidden border border-surface-container-low divide-y divide-surface-container-low">
                {THEME_OPTIONS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => handleTheme(id)}
                    className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-surface-container-lowest transition-colors active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center">
                        <Icon size={16} className="text-on-surface-variant" />
                      </div>
                      <span className="text-sm font-bold text-on-surface">{label}</span>
                    </div>
                    {theme === id && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow">
                        <Check size={13} className="text-on-primary" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* 앱 정보 */}
            <div>
              <p className="text-[11px] font-extrabold text-outline uppercase tracking-widest mb-2 px-1">앱 정보</p>
              <div className="bg-white rounded-2xl overflow-hidden border border-surface-container-low divide-y divide-surface-container-low">
                {[
                  { icon: FileText, label: '서비스 이용약관', action: () => setSubSettings('terms') },
                  { icon: Shield, label: '개인정보 처리방침', action: () => setSubSettings('privacy') },
                ].map(row => (
                  <button key={row.label} onClick={row.action} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-surface-container-lowest transition-colors active:scale-[0.98]">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center">
                        <row.icon size={16} className="text-on-surface-variant" />
                      </div>
                      <span className="text-sm font-bold text-on-surface">{row.label}</span>
                    </div>
                    <ChevronRight size={16} className="text-outline" />
                  </button>
                ))}
                <div className="flex items-center justify-between px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center">
                      <Info size={16} className="text-on-surface-variant" />
                    </div>
                    <span className="text-sm font-bold text-on-surface">앱 버전</span>
                  </div>
                  <span className="text-xs font-bold text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">v1.0.5</span>
                </div>
              </div>
            </div>

            {/* 계정 관리 */}
            <div>
              <p className="text-[11px] font-extrabold text-outline uppercase tracking-widest mb-2 px-1">계정 관리</p>
              <div className="space-y-2">
                <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-4 bg-error/5 border border-error/15 rounded-2xl active:scale-95 transition-all">
                  <div className="w-9 h-9 rounded-xl bg-error/10 flex items-center justify-center">
                    <LogOut size={16} className="text-error" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-bold text-error">로그아웃</p>
                    <p className="text-xs text-on-surface-variant">{user.email}</p>
                  </div>
                </button>
                <button onClick={() => setSubSettings('withdraw')} className="w-full flex items-center gap-3 px-4 py-4 bg-surface-container-lowest border border-surface-container-low rounded-2xl active:scale-95 transition-all">
                  <div className="w-9 h-9 rounded-xl bg-surface-container-high flex items-center justify-center">
                    <Trash2 size={16} className="text-on-surface-variant" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-bold text-on-surface">회원 탈퇴</p>
                    <p className="text-xs text-on-surface-variant">탈퇴 절차 및 주의사항 안내</p>
                  </div>
                  <ChevronRight size={16} className="text-outline" />
                </button>
              </div>
            </div>

          </section>
        )}
      </main>
    </div>
  );
};

export default MyPageView;
