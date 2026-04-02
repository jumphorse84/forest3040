import React, { useState, useEffect } from 'react';
import {
  ChevronLeft, BookOpen, Users, Music, Megaphone, Play,
  ChevronRight, Calendar, MoreVertical, Edit, Trash2, X, Save
} from 'lucide-react';
import { collection, doc, addDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db as firestoreDb } from '../firebase';
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

  useEffect(() => {
    if (worship) setEditForm({ ...worship });
  }, [worshipId]);

  useEffect(() => {
    if (worshipId && worship) {
      const updateViewCount = async () => {
        try {
          await updateDoc(doc(firestoreDb, 'worships', worshipId), {
            view_count: (worship.view_count || 0) + 1
          });
        } catch (err) {
          console.error('Failed to update view count:', err);
        }
      };
      updateViewCount();
    }
  }, [worshipId]);

  if (!worship) return null;

  const canEdit = user?.role === 'admin' || user?.role === 'leader';

  const formatDate = (date: any) => {
    if (!date) return '';
    const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}년 ${month}월 ${day}일`;
  };

  const handleRegister = async () => {
    if (!user) {
      onShowToast?.('로그인이 필요합니다.');
      return;
    }
    try {
      await addDoc(collection(firestoreDb, 'attendance'), {
        uid: user.uid,
        user_name: user.name,
        date: Timestamp.now(),
        type: '예배등록',
        worship_id: worshipId,
        worship_title: worship.title,
        status: '등록완료'
      });
      onShowToast?.('예배 등록이 완료되었습니다.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'attendance');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('이 예배 정보를 삭제하시겠습니까?')) {
      try {
        await deleteDoc(doc(firestoreDb, 'worships', worshipId as string));
        onShowToast?.('예배 정보가 삭제되었습니다.');
        onBack();
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, 'worships');
      }
    }
  };

  const handleUpdate = async () => {
    if (!editForm?.title) {
      onShowToast?.('제목을 입력해주세요.');
      return;
    }
    try {
      await updateDoc(doc(firestoreDb, 'worships', worshipId as string), {
        ...editForm,
        updatedAt: Timestamp.now()
      });
      setIsEditing(false);
      onShowToast?.('예배 정보가 수정되었습니다.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'worships');
    }
  };

  // ---- Edit Mode ----
  if (isEditing && editForm) {
    return (
      <div className="absolute inset-0 bg-surface z-[60] flex flex-col min-h-screen overflow-y-auto pb-24">
        <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface-container-highest">
          <div className="flex justify-between items-center px-4 py-3">
            <div className="flex items-center">
              <button onClick={() => setIsEditing(false)} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors mr-2">
                <X size={24} />
              </button>
              <h1 className="text-lg font-bold tracking-tight text-on-surface">예배 수정</h1>
            </div>
            <button onClick={handleUpdate} className="flex items-center gap-1.5 bg-primary text-on-primary px-4 py-2 rounded-xl text-sm font-bold shadow-sm">
              <Save size={16} /> 저장
            </button>
          </div>
        </header>

        <div className="p-6 space-y-5">
          <div className="bg-surface-container-lowest p-5 rounded-3xl border border-surface-container-low shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">예배 제목</label>
              <input
                type="text"
                value={editForm.title || ''}
                onChange={e => setEditForm({ ...editForm, title: e.target.value })}
                className="w-full bg-surface-container-high text-on-surface p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">설교자</label>
              <input
                type="text"
                value={editForm.speaker || ''}
                onChange={e => setEditForm({ ...editForm, speaker: e.target.value })}
                className="w-full bg-surface-container-high text-on-surface p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">본문 말씀</label>
              <input
                type="text"
                value={editForm.scripture || ''}
                onChange={e => setEditForm({ ...editForm, scripture: e.target.value })}
                className="w-full bg-surface-container-high text-on-surface p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">말씀 내용</label>
              <textarea
                value={editForm.scripture_content || ''}
                onChange={e => setEditForm({ ...editForm, scripture_content: e.target.value })}
                rows={5}
                className="w-full bg-surface-container-high text-on-surface p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 font-medium resize-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">YouTube URL</label>
              <input
                type="text"
                value={editForm.youtube_url || ''}
                onChange={e => setEditForm({ ...editForm, youtube_url: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
                className="w-full bg-surface-container-high text-on-surface p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 font-medium"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- Detail View ----
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
                  <div className="absolute right-4 top-full mt-1 w-32 bg-surface rounded-2xl shadow-lg border border-surface-container-highest overflow-hidden z-50">
                    <button
                      onClick={() => { setShowOptions(false); setIsEditing(true); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-on-surface hover:bg-surface-container-lowest transition-colors"
                    >
                      <Edit size={16} /> 수정하기
                    </button>
                    <button
                      onClick={() => { setShowOptions(false); handleDelete(); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-error hover:bg-error-container/30 transition-colors border-t border-surface-container-highest"
                    >
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
        <img
          src={worship.image || 'https://picsum.photos/seed/worship/800/400'}
          alt={worship.title}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
        <div className="absolute bottom-4 left-4 right-4">
          <span className="text-xs font-bold bg-primary text-on-primary px-3 py-1 rounded-full shadow-sm uppercase tracking-wider">예배</span>
        </div>
      </div>

      {/* Content Body */}
      <div className="p-6 -mt-6 relative bg-surface rounded-t-3xl flex-1">

        {/* Title block */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-bold text-tertiary">주보</span>
          <span className="w-1 h-1 rounded-full bg-surface-container-highest" />
          {worship.speaker && <span className="text-sm font-medium text-on-surface-variant">{worship.speaker} 목사</span>}
        </div>
        <h2 className="text-2xl font-bold text-on-surface mb-5 tracking-tight leading-tight">{worship.title}</h2>

        {/* Date Info Card */}
        <div className="bg-surface-container-lowest border border-surface-container-low rounded-2xl p-5 mb-6 shadow-sm">
          <div className="flex items-start gap-3">
            <Calendar size={20} className="text-primary mt-0.5" />
            <div>
              <p className="text-sm font-bold text-on-surface">예배 날짜</p>
              <p className="text-sm text-on-surface-variant mt-0.5">{formatDate(worship.date)}</p>
            </div>
          </div>
        </div>

        {/* YouTube Video */}
        {embedUrl && (
          <div className="mb-6">
            <h3 className="text-base font-bold text-on-surface mb-3 flex items-center gap-2">
              <span className="bg-error/10 text-error p-1.5 rounded-lg"><Play size={16} fill="currentColor" /></span>
              예배 영상
            </h3>
            <div className="rounded-2xl overflow-hidden shadow-sm aspect-video w-full bg-surface-container-low">
              <iframe
                className="w-full h-full"
                src={embedUrl}
                title="예배 영상"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
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
              {worship.scripture && (
                <p className="text-lg font-bold text-primary">{worship.scripture}</p>
              )}
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
                <a
                  key={idx}
                  href={p.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-surface-container-lowest border border-surface-container-low rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all group"
                >
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

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-surface/90 backdrop-blur-md border-t border-surface-container-highest p-4 z-40">
        <button
          onClick={handleRegister}
          className="w-full py-4 bg-primary text-on-primary rounded-2xl text-base font-bold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transform transition-all duration-200 active:scale-95"
        >
          예배 등록하기
        </button>
      </div>
    </div>
  );
};

export default WorshipDetailView;
