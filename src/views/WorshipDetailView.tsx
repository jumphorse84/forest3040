import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft, BookOpen, Users, Music, Megaphone, Play,
  ChevronRight, Calendar, MoreVertical, Edit, Trash2, X, Save, Plus, Camera, Search
} from 'lucide-react';
import { collection, doc, addDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db as firestoreDb, storage } from '../firebase';
import { OperationType, handleFirestoreError } from '../App';

const WorshipDetailView = ({
  user,
  worshipId,
  worships,
  onBack,
  onShowToast
}: {
  user?: any;
  worshipId: string | null;
  worships: any[];
  onBack: () => void;
  onShowToast?: (msg: string) => void;
}) => {
  const worship = worships.find(w => w.id === worshipId);
  const [showOptions, setShowOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (worship) setEditForm({ ...worship });
  }, [worshipId]);

  useEffect(() => {
    if (worshipId && worship) {
      updateDoc(doc(firestoreDb, 'worships', worshipId), {
        view_count: (worship.view_count || 0) + 1
      }).catch(err => console.error('view count error:', err));
    }
  }, [worshipId]);

  if (!worship) return null;

  const canEdit = user?.role === 'admin' || user?.role === 'leader';

  const formatDate = (date: any) => {
    if (!date) return '';
    const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return `${d.getFullYear()}년 ${String(d.getMonth() + 1).padStart(2, '0')}월 ${String(d.getDate()).padStart(2, '0')}일`;
  };

  const handleRegister = async () => {
    if (!user) { onShowToast?.('로그인이 필요합니다.'); return; }
    try {
      await addDoc(collection(firestoreDb, 'attendance'), {
        uid: user.uid, user_name: user.name, date: Timestamp.now(),
        type: '예배등록', worship_id: worshipId, worship_title: worship.title, status: '등록완료'
      });
      onShowToast?.('예배 등록이 완료되었습니다.');
    } catch (err) { handleFirestoreError(err, OperationType.WRITE, 'attendance'); }
  };

  const handleDelete = async () => {
    if (!window.confirm('이 예배 정보를 삭제하시겠습니까?\n삭제 후 복구할 수 없습니다.')) return;
    try {
      await deleteDoc(doc(firestoreDb, 'worships', worshipId as string));
      onShowToast?.('예배 정보가 삭제되었습니다.');
      onBack();
    } catch (err) { handleFirestoreError(err, OperationType.DELETE, 'worships'); }
  };

  const handleUpdate = async () => {
    if (!editForm?.title) { onShowToast?.('제목을 입력해주세요.'); return; }
    try {
      const updateData: any = {
        title: editForm.title,
        date: editForm.date?.seconds ? editForm.date : (editForm.date ? Timestamp.fromDate(new Date(editForm.date)) : editForm.date),
        image: editForm.image || '',
        youtube_url: editForm.youtube_url || '',
        scripture: editForm.scripture || '',
        scripture_content: editForm.scripture_content || '',
        participants: editForm.participants || [],
        praise: editForm.praise || [],
        announcements: editForm.announcements || [],
        updatedAt: Timestamp.now()
      };
      await updateDoc(doc(firestoreDb, 'worships', worshipId as string), updateData);
      setIsEditing(false);
      onShowToast?.('예배 정보가 수정되었습니다.');
    } catch (err) { handleFirestoreError(err, OperationType.WRITE, 'worships'); }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { onShowToast?.('5MB 이하 이미지만 업로드 가능합니다.'); return; }
    setIsUploading(true);
    const storageRef = ref(storage, `worship_images/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);
    uploadTask.on('state_changed', () => {},
      () => { setIsUploading(false); onShowToast?.('업로드 오류가 발생했습니다.'); },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        setEditForm((prev: any) => ({ ...prev, image: url }));
        setIsUploading(false);
        onShowToast?.('이미지가 업로드되었습니다.');
      });
  };

  // helper for date input value
  const getDateInputVal = (date: any) => {
    if (!date) return '';
    const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return d.toISOString().split('T')[0];
  };

  // ---- EDIT MODE ----
  if (isEditing && editForm) {
    return (
      <div className="absolute inset-0 bg-surface z-[60] flex flex-col min-h-screen overflow-y-auto pb-28">
        <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface-container-highest">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center">
              <button onClick={() => setIsEditing(false)} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors mr-2">
                <X size={24} />
              </button>
              <h1 className="text-lg font-bold tracking-tight text-on-surface">예배 수정</h1>
            </div>
            <button onClick={handleUpdate} disabled={isUploading}
              className="flex items-center gap-1.5 bg-primary text-on-primary px-4 py-2 rounded-xl text-sm font-bold shadow-sm active:scale-95 transition-transform disabled:opacity-50">
              <Save size={16} /> 저장
            </button>
          </div>
        </header>

        <div className="p-5 space-y-5">

          {/* 기본 정보 */}
          <div className="bg-surface-container-lowest border border-surface-container-low rounded-3xl p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-outline uppercase tracking-wider">기본 정보</h2>

            {/* 이미지 */}
            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">대표 이미지</label>
              <div onClick={() => fileInputRef.current?.click()}
                className="w-full h-40 bg-surface-container-high rounded-2xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group">
                {editForm.image ? (
                  <>
                    <img src={editForm.image} alt="Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
                      <Camera size={28} className="mb-1" /><span className="text-sm font-bold">이미지 변경</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center text-on-surface-variant">
                    {isUploading
                      ? <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                      : <><Camera size={28} className="mb-2 text-outline" /><span className="text-sm font-bold">이미지 업로드</span></>
                    }
                  </div>
                )}
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
              </div>
            </div>

            {/* 날짜 */}
            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">예배 날짜</label>
              <input type="date" value={getDateInputVal(editForm.date)}
                onChange={e => setEditForm({ ...editForm, date: e.target.value })}
                className="w-full bg-surface-container-high text-on-surface p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 font-medium" />
            </div>

            {/* 제목 */}
            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">설교 제목</label>
              <input type="text" value={editForm.title || ''}
                onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                className="w-full bg-surface-container-high text-on-surface p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 font-medium" />
            </div>
          </div>

          {/* YouTube */}
          <div className="bg-surface-container-lowest border border-surface-container-low rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-error/10 text-error p-1.5 rounded-lg"><Play size={16} fill="currentColor" /></span>
                <h2 className="text-sm font-bold text-on-surface">예배 영상 (YouTube)</h2>
              </div>
              <a href="https://m.youtube.com/results?search_query=찬양+예배" target="_blank" rel="noopener noreferrer"
                className="text-xs font-bold text-error bg-error/10 px-3 py-1.5 rounded-lg flex items-center gap-1">
                <Search size={13} /> 검색
              </a>
            </div>
            <input type="text" value={editForm.youtube_url || ''}
              onChange={e => setEditForm({ ...editForm, youtube_url: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full bg-surface-container-high text-on-surface p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 font-medium text-sm" />
          </div>

          {/* 본문 말씀 */}
          <div className="bg-surface-container-lowest border border-surface-container-low rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <span className="bg-primary/10 text-primary p-1.5 rounded-lg"><BookOpen size={16} /></span>
              <h2 className="text-sm font-bold text-on-surface">본문 말씀</h2>
            </div>
            <input type="text" value={editForm.scripture || ''}
              onChange={e => setEditForm({ ...editForm, scripture: e.target.value })}
              placeholder="예: 요한복음 15:1-8"
              className="w-full bg-surface-container-high text-on-surface p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 font-bold" />
            <textarea value={editForm.scripture_content || ''}
              onChange={e => setEditForm({ ...editForm, scripture_content: e.target.value })}
              rows={5} placeholder="말씀 본문 내용..."
              className="w-full bg-surface-container-high text-on-surface p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 font-medium text-sm resize-none" />
          </div>

          {/* 예배 임사자 */}
          <div className="bg-surface-container-lowest border border-surface-container-low rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <span className="bg-tertiary/10 text-tertiary p-1.5 rounded-lg"><Users size={16} /></span>
              <h2 className="text-sm font-bold text-on-surface">예배 임사자</h2>
            </div>
            <div className="space-y-3">
              {(editForm.participants || []).map((p: any, idx: number) => (
                <div key={idx} className="flex items-center gap-2">
                  <input type="text" value={p.role}
                    onChange={e => { const newP = [...editForm.participants]; newP[idx] = { ...newP[idx], role: e.target.value }; setEditForm({ ...editForm, participants: newP }); }}
                    placeholder="역할"
                    className="w-24 bg-surface-container-high text-on-surface px-3 py-3 rounded-xl outline-none text-sm font-bold" />
                  <input type="text" value={p.name}
                    onChange={e => { const newP = [...editForm.participants]; newP[idx] = { ...newP[idx], name: e.target.value }; setEditForm({ ...editForm, participants: newP }); }}
                    placeholder="이름"
                    className="flex-1 bg-surface-container-high text-on-surface px-3 py-3 rounded-xl outline-none text-sm" />
                  <button onClick={() => { const newP = editForm.participants.filter((_: any, i: number) => i !== idx); setEditForm({ ...editForm, participants: newP }); }}
                    className="p-2 text-error/50 hover:text-error transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              <button onClick={() => setEditForm({ ...editForm, participants: [...(editForm.participants || []), { role: '', name: '' }] })}
                className="w-full py-3 flex items-center justify-center gap-2 text-primary font-bold text-sm bg-primary/5 rounded-2xl border border-primary/20">
                <Plus size={16} /> 임사자 추가
              </button>
            </div>
          </div>

          {/* 찬양 */}
          <div className="bg-surface-container-lowest border border-surface-container-low rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <span className="bg-secondary/10 text-secondary p-1.5 rounded-lg"><Music size={16} /></span>
              <h2 className="text-sm font-bold text-on-surface">경배와 찬양</h2>
            </div>
            <div className="space-y-3">
              {(editForm.praise || []).map((p: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3 bg-surface-container-high p-3 rounded-2xl">
                  <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center text-error shrink-0">
                    <Play size={16} fill="currentColor" />
                  </div>
                  <div className="flex-1 space-y-1 min-w-0">
                    <input type="text" value={p.title}
                      onChange={e => { const newP = [...editForm.praise]; newP[idx] = { ...newP[idx], title: e.target.value }; setEditForm({ ...editForm, praise: newP }); }}
                      placeholder="곡 제목" className="w-full bg-transparent font-bold text-on-surface outline-none text-sm" />
                    <input type="text" value={p.link}
                      onChange={e => { const newP = [...editForm.praise]; newP[idx] = { ...newP[idx], link: e.target.value }; setEditForm({ ...editForm, praise: newP }); }}
                      placeholder="YouTube 링크" className="w-full bg-transparent text-on-surface-variant outline-none text-xs" />
                  </div>
                  <button onClick={() => { const newP = editForm.praise.filter((_: any, i: number) => i !== idx); setEditForm({ ...editForm, praise: newP }); }}
                    className="p-1.5 text-error/50 hover:text-error shrink-0">
                    <X size={16} />
                  </button>
                </div>
              ))}
              <button onClick={() => setEditForm({ ...editForm, praise: [...(editForm.praise || []), { title: '', link: '' }] })}
                className="w-full py-3 flex items-center justify-center gap-2 text-primary font-bold text-sm bg-primary/5 rounded-2xl border border-primary/20">
                <Plus size={16} /> 찬양 추가
              </button>
            </div>
          </div>

          {/* 광고 */}
          <div className="bg-surface-container-lowest border border-surface-container-low rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2">
              <span className="bg-error/10 text-error p-1.5 rounded-lg"><Megaphone size={16} /></span>
              <h2 className="text-sm font-bold text-on-surface">광고</h2>
            </div>
            <div className="space-y-3">
              {(editForm.announcements || []).map((a: any, idx: number) => (
                <div key={idx} className="bg-surface-container-high p-4 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2">
                    <input type="text" value={a.title}
                      onChange={e => { const newA = [...editForm.announcements]; newA[idx] = { ...newA[idx], title: e.target.value }; setEditForm({ ...editForm, announcements: newA }); }}
                      placeholder="광고 제목" className="flex-1 bg-transparent font-bold text-on-surface outline-none text-sm" />
                    <button onClick={() => { const newA = editForm.announcements.filter((_: any, i: number) => i !== idx); setEditForm({ ...editForm, announcements: newA }); }}
                      className="p-1.5 text-error/50 hover:text-error shrink-0">
                      <X size={16} />
                    </button>
                  </div>
                  <input type="text" value={a.content}
                    onChange={e => { const newA = [...editForm.announcements]; newA[idx] = { ...newA[idx], content: e.target.value }; setEditForm({ ...editForm, announcements: newA }); }}
                    placeholder="광고 내용" className="w-full bg-transparent text-on-surface-variant text-sm outline-none" />
                </div>
              ))}
              <button onClick={() => setEditForm({ ...editForm, announcements: [...(editForm.announcements || []), { title: '', content: '' }] })}
                className="w-full py-3 flex items-center justify-center gap-2 text-primary font-bold text-sm bg-primary/5 rounded-2xl border border-primary/20">
                <Plus size={16} /> 광고 추가
              </button>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-surface/90 backdrop-blur-md border-t border-surface-container-highest p-4 z-40">
          <button onClick={handleUpdate} disabled={isUploading}
            className="w-full py-4 bg-primary text-on-primary rounded-2xl text-base font-bold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transform transition-all duration-200 active:scale-95 disabled:opacity-50">
            {isUploading ? '이미지 업로드 중...' : '수정사항 저장하기'}
          </button>
        </div>
      </div>
    );
  }

  // ---- DETAIL VIEW ----
  const embedUrl = (() => {
    if (!worship.youtube_url) return null;
    const match = worship.youtube_url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (match?.[1]) return `https://www.youtube.com/embed/${match[1]}?rel=0`;
    return worship.youtube_url;
  })();

  return (
    <div className="flex flex-col bg-surface min-h-screen pb-28 absolute inset-0 z-50">

      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface-container-highest">
        <div className="flex items-center justify-between px-2 py-3">
          <div className="flex items-center">
            <button onClick={onBack} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-lg font-bold tracking-tight text-on-surface ml-2">예배 상세</h1>
          </div>
          {canEdit && (
            <div className="relative">
              <button onClick={() => setShowOptions(!showOptions)} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors mr-2">
                <MoreVertical size={20} />
              </button>
              {showOptions && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowOptions(false)} />
                  <div className="absolute right-4 top-full mt-1 w-32 bg-surface rounded-2xl shadow-xl border border-surface-container-highest overflow-hidden z-50">
                    <button onClick={() => { setShowOptions(false); setIsEditing(true); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-on-surface hover:bg-surface-container-lowest transition-colors">
                      <Edit size={16} /> 수정하기
                    </button>
                    <button onClick={() => { setShowOptions(false); handleDelete(); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-error hover:bg-error-container/30 transition-colors border-t border-surface-container-highest">
                      <Trash2 size={16} /> 삭제하기
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Hero Image */}
      <div className="relative h-64 w-full bg-surface-container-low shrink-0">
        <img src={worship.image || 'https://picsum.photos/seed/worship/800/400'} alt={worship.title}
          className="w-full h-full object-cover" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute bottom-4 left-4">
          <span className="text-xs font-bold bg-primary text-on-primary px-3 py-1 rounded-full shadow-sm uppercase tracking-wider">예배</span>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-6 -mt-6 relative bg-surface rounded-t-3xl flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-bold text-tertiary">주보</span>
          <span className="w-1 h-1 rounded-full bg-surface-container-highest" />
          {worship.speaker && <span className="text-sm font-medium text-on-surface-variant">{worship.speaker} 목사</span>}
        </div>
        <h2 className="text-2xl font-bold text-on-surface mb-5 tracking-tight leading-tight">{worship.title}</h2>

        {/* Date */}
        <div className="bg-surface-container-lowest border border-surface-container-low rounded-2xl p-5 mb-6 shadow-sm">
          <div className="flex items-start gap-3">
            <Calendar size={20} className="text-primary mt-0.5" />
            <div>
              <p className="text-sm font-bold text-on-surface">예배 날짜</p>
              <p className="text-sm text-on-surface-variant mt-0.5">{formatDate(worship.date)}</p>
            </div>
          </div>
        </div>

        {/* YouTube */}
        {embedUrl && (
          <div className="mb-6">
            <h3 className="text-base font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="bg-error/10 text-error p-1.5 rounded-lg"><Play size={16} fill="currentColor" /></span>
              예배 영상
            </h3>
            <div className="rounded-2xl overflow-hidden shadow-sm aspect-video w-full bg-surface-container-low">
              <iframe className="w-full h-full" src={embedUrl} title="예배 영상" frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
            </div>
          </div>
        )}

        {/* Scripture */}
        {(worship.scripture || worship.scripture_content) && (
          <div className="mb-6">
            <h3 className="text-base font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="bg-primary/10 text-primary p-1.5 rounded-lg"><BookOpen size={16} /></span>
              본문 말씀
            </h3>
            <div className="bg-surface-container-lowest border border-surface-container-low rounded-2xl p-5 shadow-sm space-y-3">
              {worship.scripture && <p className="text-lg font-bold text-primary">{worship.scripture}</p>}
              {worship.scripture_content && (
                <p className="text-on-surface-variant text-[15px] leading-relaxed whitespace-pre-wrap text-justify">
                  {worship.scripture_content}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Participants */}
        {worship.participants && worship.participants.length > 0 && (
          <div className="mb-6">
            <h3 className="text-base font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="bg-tertiary/10 text-tertiary p-1.5 rounded-lg"><Users size={16} /></span>
              예배 임사자
            </h3>
            <div className="bg-surface-container-lowest border border-surface-container-low rounded-2xl p-5 shadow-sm space-y-3">
              {worship.participants.map((p: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between py-1.5 border-b border-surface-container-low last:border-0 last:pb-0">
                  <span className="text-sm font-bold text-on-surface-variant">{p.role}</span>
                  <span className="text-sm font-bold text-on-surface">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Praise */}
        {worship.praise && worship.praise.length > 0 && (
          <div className="mb-6">
            <h3 className="text-base font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="bg-secondary/10 text-secondary p-1.5 rounded-lg"><Music size={16} /></span>
              경배와 찬양
            </h3>
            <div className="space-y-3">
              {worship.praise.map((p: any, idx: number) => (
                <a key={idx} href={p.link} target="_blank" rel="noopener noreferrer"
                  className="bg-surface-container-lowest border border-surface-container-low rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all group">
                  <div className="w-11 h-11 rounded-xl bg-error/10 flex items-center justify-center text-error group-hover:scale-110 transition-transform shrink-0">
                    <Play size={22} fill="currentColor" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-on-surface text-sm">{p.title}</h4>
                    <p className="text-xs text-on-surface-variant truncate mt-0.5">{p.link}</p>
                  </div>
                  <ChevronRight size={18} className="text-on-surface-variant shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Announcements */}
        {worship.announcements && worship.announcements.length > 0 && (
          <div className="mb-4">
            <h3 className="text-base font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="bg-error/10 text-error p-1.5 rounded-lg"><Megaphone size={16} /></span>
              광고
            </h3>
            <div className="bg-surface-container-lowest border border-surface-container-low rounded-2xl p-5 shadow-sm space-y-4">
              {worship.announcements.map((a: any, idx: number) => (
                <div key={idx} className="space-y-1 border-b border-surface-container-low last:border-0 pb-4 last:pb-0">
                  <h4 className="font-bold text-on-surface">{a.title}</h4>
                  <p className="text-on-surface-variant text-sm leading-relaxed">{a.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-surface/90 backdrop-blur-md border-t border-surface-container-highest p-4 z-40">
        <button onClick={handleRegister}
          className="w-full py-4 bg-primary text-on-primary rounded-2xl text-base font-bold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transform transition-all duration-200 active:scale-95">
          예배 등록하기
        </button>
      </div>
    </div>
  );
};

export default WorshipDetailView;
