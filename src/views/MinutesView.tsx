import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Search, FileText, ChevronRight, Plus, X, Heart, MessageCircle, MoreHorizontal, MessageSquare, Send, Bell } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc, addDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';

// ──────────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────────
interface MeetingMinute {
  id: string;
  title: string;
  content: string;
  category: string;
  dateStr: string; // YYYY-MM-DD
  authorName: string;
  authorUid: string;
  timestamp: any;
  likeCount?: number;
  commentCount?: number;
}

interface MeetingAgenda {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorUid: string;
  timestamp: any;
  likeCount?: number;
}

interface Comment {
  id: string;
  uid: string;
  authorName: string;
  authorAvatar: string;
  text: string;
  timestamp: any;
  replyTo?: string; // parent comment id
}

// ──────────────────────────────────────────────────
// MINUTES VIEW
// ──────────────────────────────────────────────────
export default function MinutesView({ user, userData, onBack, onShowToast }: any) {
  const [activeTab, setActiveTab] = useState<'minutes' | 'agendas'>('minutes');

  const [minutes, setMinutes] = useState<MeetingMinute[]>([]);
  const [agendas, setAgendas] = useState<MeetingAgenda[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const [isWritingMinute, setIsWritingMinute] = useState(false);
  const [isWritingAgenda, setIsWritingAgenda] = useState(false);

  const [selectedMinute, setSelectedMinute] = useState<MeetingMinute | null>(null);

  const isAdminOrLeader = userData?.role === 'admin' || userData?.role === 'leader';

  const filteredMinutes = minutes.filter(m => 
    m.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAgendas = agendas.filter(a => 
    a.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    a.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    // Listen to minutes
    const qMinutes = query(collection(db, 'meeting_minutes'), orderBy('timestamp', 'desc'));
    const unsubMinutes = onSnapshot(qMinutes, (snap) => {
      setMinutes(snap.docs.map(d => ({ id: d.id, ...d.data() } as MeetingMinute)));
    });

    // Listen to agendas
    const qAgendas = query(collection(db, 'meeting_agendas'), orderBy('timestamp', 'desc'));
    const unsubAgendas = onSnapshot(qAgendas, (snap) => {
      setAgendas(snap.docs.map(d => ({ id: d.id, ...d.data() } as MeetingAgenda)));
    });

    return () => {
      unsubMinutes();
      unsubAgendas();
    };
  }, []);

  const handleCreateMinute = async (data: any) => {
    try {
      await addDoc(collection(db, 'meeting_minutes'), {
        ...data,
        authorName: userData?.name || user?.name || '운영진',
        authorUid: user?.uid,
        timestamp: serverTimestamp(),
      });
      onShowToast('회의록이 등록되었습니다.');
      setIsWritingMinute(false);
    } catch (e) {
      console.error(e);
      onShowToast('오류가 발생했습니다.');
    }
  };

  const handleCreateAgenda = async (data: any) => {
    try {
      await addDoc(collection(db, 'meeting_agendas'), {
        ...data,
        authorName: userData?.name || user?.name || '회원',
        authorUid: user?.uid,
        timestamp: serverTimestamp(),
        likeCount: 0
      });
      onShowToast('안건이 제안되었습니다.');
      setIsWritingAgenda(false);
    } catch (e) {
      console.error(e);
      onShowToast('오류가 발생했습니다.');
    }
  };

  const handleLikeAgenda = async (agendaId: string) => {
    if (!user) return;
    const uid = user.uid;
    try {
      const agendaRef = doc(db, 'meeting_agendas', agendaId);
      const likeRef = doc(db, 'meeting_agendas', agendaId, 'likes', uid);
      
      // We'll use a transaction or a simple check-and-set to toggle
      // To keep it simple in this mock-like env, we'll try to fetch once or use a state.
      // But since this is a list, we'll just try to create/delete and the real-time listener will update the counts if we denormalize or if we fetch.
      // Actually, let's just use a subcollection and let the UI handle the "isLiked" state if possible.
      // However, for a list of cards, we'd need to listen to all likes subcollections... which is not ideal.
      // Let's use an array of UIDs in the agenda document for likes instead for simplicity in this specific app scale.
      
      const agenda = agendas.find(a => a.id === agendaId);
      if (!agenda) return;

      const likes = (agenda as any).likes || [];
      const isLiked = likes.includes(uid);

      if (isLiked) {
        await updateDoc(agendaRef, {
          likes: likes.filter((id: string) => id !== uid),
          likeCount: Math.max(0, (agenda.likeCount || 1) - 1)
        });
      } else {
        await updateDoc(agendaRef, {
          likes: [...likes, uid],
          likeCount: (agenda.likeCount || 0) + 1
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="absolute inset-0 bg-surface z-[60] flex flex-col min-h-screen overflow-hidden">
      {/* HEADER */}
      <header className="shrink-0 bg-surface/80 backdrop-blur-md border-b border-surface-container-highest">
        <div className="flex items-center justify-between px-2 py-3">
          <div className="flex items-center">
            <button onClick={onBack} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-lg font-bold tracking-tight text-on-surface ml-2">회의록 & 안건</h1>
          </div>
        </div>
        
        {/* SEARCH BAR */}
        <div className="px-4 mb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder={activeTab === 'minutes' ? "회의록 검색..." : "안건 검색..."}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-100 border-none rounded-xl py-2 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* TABS */}
        <div className="flex px-4 gap-4 mt-2 mb-[-1px]">
          <button
            onClick={() => setActiveTab('minutes')}
            className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'minutes' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'}`}
          >
            회의록 보기
          </button>
          <button
            onClick={() => setActiveTab('agendas')}
            className={`pb-3 px-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'agendas' ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant'}`}
          >
            안건 제안하기
          </button>
        </div>
      </header>

      {/* BODY */}
      <div className="flex-1 overflow-y-auto bg-surface-container-lowest relative pb-24">
        {activeTab === 'minutes' && (
          <div className="p-4 space-y-3">
            {filteredMinutes.length === 0 ? (
              <div className="text-center py-10 text-on-surface-variant text-sm">
                {searchTerm ? "검색 결과가 없습니다." : "등록된 회의록이 없습니다."}
              </div>
            ) : filteredMinutes.map(min => (
              <div key={min.id} onClick={() => setSelectedMinute(min)}
                className="bg-white p-4 rounded-2xl flex flex-col gap-2 border border-surface-container-low hover:bg-surface-container-low transition-colors cursor-pointer shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-md">{min.category || '회의'}</span>
                  <span className="text-[11px] text-on-surface-variant">{min.dateStr}</span>
                </div>
                <h3 className="text-[15px] font-bold text-on-surface">{min.title}</h3>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1 text-on-surface-variant text-[11px] font-medium"><FileText size={12} /> {min.authorName}</div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400">
                     <span className="flex items-center gap-1"><Heart size={10} className="fill-slate-400"/> {min.likeCount || 0}</span>
                     <span className="flex items-center gap-1"><MessageCircle size={10} className="fill-slate-400"/> {min.commentCount || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'agendas' && (
          <div className="p-4 space-y-4">
            <div className="bg-blue-50 text-blue-800 p-4 rounded-xl text-sm leading-relaxed border border-blue-100">
              💡 <b>다음 회의 안건 제안</b><br />
              함께 의논하고 싶은 주제나 아이디어가 있다면 자유롭게 제안해 주세요. 공감을 많이 받은 안건은 실제 회의에서 다뤄질 확률이 높습니다!
            </div>
            {filteredAgendas.length === 0 ? (
              <div className="text-center py-10 text-on-surface-variant text-sm">
                {searchTerm ? "검색 결과가 없습니다." : "첫 번째 안건을 제안해 보세요!"}
              </div>
            ) : filteredAgendas.map(agenda => {
              const userUID = user?.uid || 'anon';
              const isLiked = (agenda as any).likes?.includes(userUID);
              
              return (
                <div key={agenda.id} className="bg-white p-4 rounded-2xl border border-surface-container-low shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-bold text-on-surface flex-1">{agenda.title}</h3>
                  </div>
                  <p className="text-[13px] text-on-surface-variant whitespace-pre-wrap leading-relaxed">{agenda.content}</p>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                    <span className="text-[11px] text-slate-400">{agenda.authorName} • {agenda.timestamp?.toDate ? agenda.timestamp.toDate().toLocaleDateString() : ''}</span>
                    <button 
                      onClick={() => handleLikeAgenda(agenda.id)}
                      className={`flex items-center gap-1 text-[12px] font-bold px-2.5 py-1 rounded-full transition-colors ${isLiked ? 'text-pink-600 bg-pink-50' : 'text-slate-500 bg-slate-100 hover:bg-slate-200'}`}>
                      <Heart size={12} className={isLiked ? 'fill-pink-500 text-pink-500' : ''} />
                      {agenda.likeCount || 0} 공감
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FLOATING ACTION BUTTON */}
      {((activeTab === 'minutes' && isAdminOrLeader) || activeTab === 'agendas') && (
        <button
          onClick={() => activeTab === 'minutes' ? setIsWritingMinute(true) : setIsWritingAgenda(true)}
          className="absolute bottom-6 right-6 w-14 h-14 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-lg hover:bg-primary-dim transition-transform active:scale-95 z-20"
        >
          <Plus size={28} />
        </button>
      )}

      {/* MODALS */}
      <AnimatePresence>
        {isWritingMinute && <MinutesWriteModal onClose={() => setIsWritingMinute(false)} onSave={handleCreateMinute} />}
        {isWritingAgenda && <AgendaWriteModal onClose={() => setIsWritingAgenda(false)} onSave={handleCreateAgenda} />}
        {selectedMinute && <MinutesDetailModal minute={selectedMinute} user={user} userData={userData} onClose={() => setSelectedMinute(null)} />}
      </AnimatePresence>
    </div>
  );
}

// ──────────────────────────────────────────────────
// MINUTES WRITE MODAL
// ──────────────────────────────────────────────────
function MinutesWriteModal({ onClose, onSave }: { onClose: () => void, onSave: (d: any) => void }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('정기회의');
  const [dateStr, setDateStr] = useState(new Date().toISOString().split('T')[0]);
  const [content, setContent] = useState('');

  return (
    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] bg-white flex flex-col">
      <header className="flex justify-between items-center p-4 border-b border-slate-100">
        <button onClick={onClose} className="p-2"><X size={24} /></button>
        <h2 className="text-lg font-bold">회의록 작성</h2>
        <button onClick={() => onSave({ title, category, dateStr, content })} disabled={!title || !content}
          className="px-4 py-1.5 bg-primary text-white text-sm font-bold rounded-full disabled:opacity-50">
          등록
        </button>
      </header>
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-500 mb-1 block">구분</label>
          <input type="text" value={category} onChange={e => setCategory(e.target.value)} placeholder="예: 임원회, 기획팀" className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 outline-none focus:border-primary text-sm" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 mb-1 block">회의 일자</label>
          <input type="date" value={dateStr} onChange={e => setDateStr(e.target.value)} className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 outline-none focus:border-primary text-sm" />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-500 mb-1 block">제목</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="회의록 제목 입력" className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 outline-none focus:border-primary text-sm font-bold" />
        </div>
        <div className="flex-1 flex flex-col pt-2">
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="회의 내용을 기록하세요..." className="w-full flex-1 min-h-[300px] bg-slate-50 p-4 rounded-xl border border-slate-200 outline-none focus:border-primary text-sm resize-none" />
        </div>
      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────
// AGENDA WRITE MODAL
// ──────────────────────────────────────────────────
function AgendaWriteModal({ onClose, onSave }: { onClose: () => void, onSave: (d: any) => void }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  return (
    <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] bg-white flex flex-col">
      <header className="flex justify-between items-center p-4 border-b border-slate-100">
        <button onClick={onClose} className="p-2"><X size={24} /></button>
        <h2 className="text-lg font-bold">새 안건 제안</h2>
        <button onClick={() => onSave({ title, content })} disabled={!title || !content}
          className="px-4 py-1.5 bg-primary text-white text-sm font-bold rounded-full disabled:opacity-50">
          제안
        </button>
      </header>
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-500 mb-1 block">안건 요약 (제목)</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="예: 여름 수련회 장소 추천건" className="w-full bg-slate-50 p-3 rounded-xl border border-slate-200 outline-none focus:border-primary text-sm font-bold" />
        </div>
        <div className="flex-1 flex flex-col pt-2">
          <label className="text-xs font-bold text-slate-500 mb-1 block">안건 상세 내용</label>
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="어떤 안건인지, 왜 필요한지 자유롭게 적어주세요." className="w-full flex-1 min-h-[200px] bg-slate-50 p-4 rounded-xl border border-slate-200 outline-none focus:border-primary text-sm resize-none" />
        </div>
      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────
// MINUTES DETAIL MODAL (With Nested Comments)
// ──────────────────────────────────────────────────
function MinutesDetailModal({ minute, user, userData, onClose }: any) {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeBounce, setLikeBounce] = useState(false);

  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [replyToId, setReplyToId] = useState<string | null>(null);

  const uid = user?.uid || 'anon';

  useEffect(() => {
    // Likes
    const unsubLikes = onSnapshot(collection(db, 'meeting_minutes', minute.id, 'likes'), (snap) => {
      setLikeCount(snap.size);
      setLiked(snap.docs.some(d => d.id === uid));
    });
    // Comments
    const qComments = query(collection(db, 'meeting_minutes', minute.id, 'comments'), orderBy('timestamp', 'asc'));
    const unsubComments = onSnapshot(qComments, (snap) => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() } as Comment)));
    });

    return () => { unsubLikes(); unsubComments(); };
  }, [minute.id, uid]);

  const handleLike = async () => {
    const likeRef = doc(db, 'meeting_minutes', minute.id, 'likes', uid);
    const minuteRef = doc(db, 'meeting_minutes', minute.id);
    if (liked) {
      await deleteDoc(likeRef);
      await updateDoc(minuteRef, { likeCount: increment(-1) });
    }
    else {
      await setDoc(likeRef, { uid, timestamp: serverTimestamp() });
      await updateDoc(minuteRef, { likeCount: increment(1) });
      setLikeBounce(true); setTimeout(() => setLikeBounce(false), 400);
    }
  };

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const minuteRef = doc(db, 'meeting_minutes', minute.id);
      await addDoc(collection(db, 'meeting_minutes', minute.id, 'comments'), {
        uid,
        authorName: userData?.name || user?.name || '익명',
        authorAvatar: user?.photoURL || user?.profileImageUrl || '',
        text: commentText.trim(),
        replyTo: replyToId || null,
        timestamp: serverTimestamp()
      });
      await updateDoc(minuteRef, { commentCount: increment(1) });
      setCommentText('');
      setReplyToId(null);
    } catch (e) { console.error(e); }
  };

  // Build comment tree
  const rootComments = comments.filter(c => !c.replyTo);
  const getReplies = (parentId: string) => comments.filter(c => c.replyTo === parentId);

  return (
    <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[100] bg-surface flex flex-col">
      <header className="flex justify-between items-center p-3 border-b border-surface-container-highest">
        <button onClick={onClose} className="p-2 text-on-surface-variant"><ChevronLeft size={24} /></button>
        <span className="font-bold text-sm">회의록 상세</span>
        <div className="w-10"></div>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-8 border-b border-surface-container-highest bg-white">
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-primary/10 text-primary text-[11px] font-bold px-2 py-1 rounded-md">{minute.category}</span>
            <span className="text-[12px] text-on-surface-variant">{minute.dateStr}</span>
          </div>
          <h1 className="text-xl font-extrabold text-on-surface leading-snug break-keep mb-6">{minute.title}</h1>

          <div className="text-[14.5px] leading-[1.8] text-slate-800 whitespace-pre-wrap">
            {minute.content}
          </div>

          <div className="flex justify-end mt-8 text-[12px] text-slate-400">
            작성자: {minute.authorName}
          </div>
        </div>

        {/* LIKES & COMMENTS */}
        <div className="bg-slate-50 min-h-full pb-32">
          <div className="px-6 py-4 flex items-center justify-between border-b border-slate-200 bg-white">
            <button onClick={handleLike} className={`flex items-center gap-2 px-4 py-1.5 rounded-full border transition-all ${liked ? 'bg-pink-50 border-pink-200 text-pink-600' : 'bg-white border-slate-200 text-slate-600'}`}>
              <Heart size={16} className={`${liked ? 'fill-pink-500 text-pink-500' : ''} ${likeBounce ? 'animate-bounce' : ''}`} />
              <span className="text-sm font-bold">공감 {likeCount}</span>
            </button>
            <span className="text-[12px] text-slate-500 font-bold">댓글 {comments.length}개</span>
          </div>

          <div className="p-6 space-y-5">
            {rootComments.length === 0 ? (
              <div className="text-center text-slate-400 text-sm py-4">첫 번째로 의견을 남겨보세요!</div>
            ) : rootComments.map(rc => (
              <div key={rc.id} className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-slate-200 shrink-0 overflow-hidden text-center leading-8 font-bold text-slate-500 text-xs">
                    {rc.authorAvatar ? <img src={rc.authorAvatar} className="w-full h-full object-cover" /> : rc.authorName[0]}
                  </div>
                  <div className="flex-1">
                    <div className="bg-white p-3 rounded-2xl rounded-tl-sm shadow-sm border border-slate-100">
                      <span className="font-bold text-[12px] text-slate-700">{rc.authorName}</span>
                      <p className="text-[13px] text-slate-800 mt-1 leading-relaxed">{rc.text}</p>
                    </div>
                    <div className="flex items-center gap-4 mt-2 px-2">
                      <span className="text-[10px] text-slate-400">
                        {rc.timestamp?.toDate ? rc.timestamp.toDate().toLocaleDateString() : ''}
                      </span>
                      {(userData?.role === 'admin' || userData?.role === 'leader') && (
                        <button onClick={() => setReplyToId(rc.id)} className="text-[11px] font-bold text-primary">답글 달기</button>
                      )}
                    </div>
                  </div>
                </div>
                {/* REPLIES */}
                {getReplies(rc.id).length > 0 && (
                  <div className="pl-11 space-y-3 pt-2">
                    {getReplies(rc.id).map(reply => (
                      <div key={reply.id} className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/20 shrink-0 overflow-hidden text-center leading-6 font-bold text-primary text-[10px]">
                          {reply.authorAvatar ? <img src={reply.authorAvatar} className="w-full h-full object-cover" /> : reply.authorName[0]}
                        </div>
                        <div className="flex-1 bg-primary/5 p-3 rounded-2xl rounded-tl-sm border border-primary/10">
                          <span className="font-bold text-[11px] text-primary">{reply.authorName} (작성자)</span>
                          <p className="text-[13px] text-slate-800 mt-1 leading-relaxed">{reply.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* COMMENT INPUT */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white border-t border-slate-200 p-3 pb-safe z-20">
        {replyToId && (
          <div className="flex items-center justify-between bg-primary/5 px-4 py-2 rounded-t-xl mb-[-4px] border border-primary/10 border-b-0">
            <span className="text-[11px] font-bold text-primary flex items-center gap-1"><ChevronRight size={14} /> 대댓글 작성 중...</span>
            <button onClick={() => setReplyToId(null)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
          </div>
        )}
        <form onSubmit={handleSendComment} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full p-1.5 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/20 transition-all z-10 relative">
          <input
            type="text" value={commentText} onChange={e => setCommentText(e.target.value)}
            placeholder={replyToId ? "답글을 입력하세요..." : "회의 내용에 대한 의견을 남겨주세요..."}
            className="flex-1 bg-transparent px-4 py-2 text-sm outline-none"
          />
          <button type="submit" disabled={!commentText.trim()} className="bg-primary text-white p-2.5 rounded-full disabled:opacity-50">
            <Send size={16} className="-ml-0.5 mt-0.5" />
          </button>
        </form>
      </div>
    </motion.div>
  );
}
