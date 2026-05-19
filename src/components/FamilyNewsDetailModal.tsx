import React, { useState, useEffect, useRef } from 'react';
import { X, Heart, MessageCircle, Send, MoreVertical, Trash2, User } from 'lucide-react';
import { collection, query, orderBy, onSnapshot, addDoc, deleteDoc, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db as firestoreDb } from '../firebase';

interface FamilyNewsDetailModalProps {
  news: any;
  user: any;
  onClose: () => void;
  onToggleLike: (newsId: string, currentLikes: string[]) => void;
}

export const FamilyNewsDetailModal: React.FC<FamilyNewsDetailModalProps> = ({
  news,
  user,
  onClose,
  onToggleLike
}) => {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const hasLiked = news.likes?.includes(user?.uid);
  const likesCount = news.likes?.length || 0;

  useEffect(() => {
    if (!news?.id) return;
    
    const q = query(
      collection(firestoreDb, `family_news/${news.id}/comments`),
      orderBy('created_at', 'asc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(fetchedComments);
      setTimeout(() => {
        commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [news?.id]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user?.uid || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await addDoc(collection(firestoreDb, `family_news/${news.id}/comments`), {
        uid: user.uid,
        name: user.name || '이름 없음',
        profile_image: user.photoURL || user.profileImageUrl || user.picture || '',
        content: newComment.trim(),
        created_at: new Date().toISOString()
      });
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('댓글을 남기는 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('정말 이 댓글을 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(firestoreDb, `family_news/${news.id}/comments`, commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  const formatDate = (dateData: any) => {
    if (!dateData) return '';
    const date = dateData?.toDate ? dateData.toDate() : new Date(dateData);
    if (isNaN(date.getTime())) return '';
    return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}. ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const getCategoryLabel = (cat: string) => {
    switch(cat) {
      case 'new_member': return '🎉 새가족';
      case 'pregnancy': return '👼 생명의 축복';
      case 'childbirth': return '🍼 출산 축하';
      case 'wedding': return '💍 결혼 축하';
      default: return '📬 특별한 소식';
    }
  };

  // 모달 밖 스크롤 방지
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  if (!news) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md h-full bg-surface flex flex-col relative shadow-2xl">
        
        {/* Header (Sticky) */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-surface/90 backdrop-blur-md border-b border-outline-variant/30">
          <div className="flex items-center gap-2">
            <span className="font-bold text-on-surface">{getCategoryLabel(news.category)}</span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-variant/50 transition-colors"
          >
            <X className="w-6 h-6 text-on-surface-variant" />
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto pb-24">
          {/* Image */}
          {news.imageUrl && (
            <div className="w-full bg-surface-variant">
              <img 
                src={news.imageUrl} 
                alt="소식 이미지" 
                className="w-full h-auto max-h-[500px] object-contain"
              />
            </div>
          )}

          {/* Text Content */}
          <div className="p-5 space-y-4">
            <h2 className="text-xl font-bold text-on-surface whitespace-pre-wrap leading-tight">
              {news.title}
            </h2>
            
            <div className="flex items-center text-sm text-on-surface-variant">
              <span>{news.author_name}</span>
              <span className="mx-2">•</span>
              <span>{formatDate(news.created_at)}</span>
            </div>

            <div className="pt-2">
              <p className="text-[15px] leading-relaxed text-on-surface whitespace-pre-wrap break-words">
                {news.content}
              </p>
            </div>
            
            {/* Actions */}
            <div className="flex items-center gap-4 pt-6 pb-2 border-b border-outline-variant/20">
              <button 
                onClick={() => onToggleLike(news.id, news.likes || [])}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all active:scale-95 ${
                  hasLiked 
                    ? 'bg-pink-50 border-pink-200 text-pink-600' 
                    : 'bg-surface-variant/30 border-outline-variant/30 text-on-surface-variant hover:bg-surface-variant/50'
                }`}
              >
                <Heart className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} />
                <span className="font-bold">{likesCount}</span>
              </button>
              
              <div className="flex items-center gap-2 px-4 py-2 text-on-surface-variant">
                <MessageCircle className="w-5 h-5" />
                <span className="font-bold">{comments.length}</span>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div className="px-5 pb-6">
            <h3 className="font-bold text-on-surface mb-4">환영의 댓글 {comments.length}개</h3>
            
            {comments.length === 0 ? (
              <div className="text-center py-10 text-on-surface-variant/60 text-sm">
                첫 번째 환영 인사를 남겨주세요! 🎉
              </div>
            ) : (
              <div className="space-y-4">
                {comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3 group">
                    <div className="w-9 h-9 rounded-full bg-surface-variant flex items-center justify-center shrink-0 overflow-hidden">
                      {comment.profile_image ? (
                        <img src={comment.profile_image} alt="profile" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-on-surface-variant/50" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-[13px] font-bold text-on-surface">{comment.name}</span>
                          <span className="text-[11px] text-on-surface-variant">{formatDate(comment.created_at)}</span>
                        </div>
                        {comment.uid === user?.uid && (
                          <button 
                            onClick={() => handleDeleteComment(comment.id)}
                            className="p-1.5 text-on-surface-variant/40 hover:text-red-500 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-[14px] text-on-surface mt-0.5 whitespace-pre-wrap break-words leading-relaxed">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={commentsEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Comment Input Area (Fixed Bottom) */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-surface border-t border-outline-variant/30 safe-area-bottom">
          <form onSubmit={handleSubmitComment} className="flex items-end gap-2">
            <textarea
              value={newComment}
              onChange={(e) => {
                setNewComment(e.target.value);
                // 자동 높이 조절
                e.target.style.height = 'auto';
                e.target.style.height = `${Math.min(e.target.scrollHeight, 100)}px`;
              }}
              placeholder="환영의 한마디를 남겨주세요!"
              className="flex-1 bg-surface-variant/50 text-on-surface text-sm rounded-2xl px-4 py-3 min-h-[44px] max-h-[100px] resize-none focus:outline-none focus:ring-2 focus:ring-primary/50 placeholder-on-surface-variant/50"
              rows={1}
            />
            <button
              type="submit"
              disabled={!newComment.trim() || isSubmitting}
              className="shrink-0 w-[44px] h-[44px] rounded-full bg-primary text-on-primary flex items-center justify-center disabled:opacity-50 disabled:bg-surface-variant disabled:text-on-surface-variant transition-colors"
            >
              <Send className="w-5 h-5 ml-[-2px]" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
