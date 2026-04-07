import React, { useState } from 'react';
import { ChevronLeft, Home, BookOpen, User, Flame, X, Baby, MapPin, Clock, Users, TreePine, Megaphone, CheckCircle2 } from 'lucide-react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';

export default function KidsCareAddView({ onBack, onShowToast, forests }: any) {
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '오후 1:30 ~ 3:30',
    location: '비전센터 2층 (키즈룸)',
    target: '3세 ~ 미취학 아동',
    content: '',
    assigned_forest_id: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.date || !formData.content.trim() || !formData.assigned_forest_id) {
      onShowToast('날짜, 프로그램 내용, 담당숲을 모두 입력해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      await addDoc(collection(db, 'kids_cares'), {
        ...formData,
        status: '진행중', // or 모집중
        createdAt: Timestamp.now()
      });
      onShowToast('돌봄 컨텐츠가 등록되었습니다.');
      onBack();
    } catch (error) {
      console.error("Error adding kids care:", error);
      onShowToast('등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-surface font-body selection:bg-primary/20 min-h-screen pb-32">
      <nav className="sticky top-0 w-full z-50 bg-[#FAF9F6]/80 backdrop-blur-xl flex justify-between items-center px-6 py-4 max-w-md mx-auto left-0 right-0">
        <div className="flex items-center gap-3 active:scale-95 duration-200 cursor-pointer" onClick={onBack}>
          <ChevronLeft className="text-primary-dim w-6 h-6" />
          <span className="font-headline font-bold text-lg tracking-tight text-primary-dim">새 돌봄 컨텐츠 등록</span>
        </div>
      </nav>

      <main className="max-w-md mx-auto px-6 py-6 space-y-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-surface-container-low space-y-5">
          <div>
            <label className="block text-sm font-bold text-on-surface-variant font-headline mb-2">날짜</label>
            <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })}
              className="w-full bg-surface-container-lowest border border-surface-container-low rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors text-on-surface"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-on-surface-variant font-headline mb-2">시간</label>
            <input type="text" value={formData.time} onChange={e => setFormData({ ...formData, time: e.target.value })}
              className="w-full bg-surface-container-lowest border border-surface-container-low rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors text-on-surface"
              placeholder="예: 오후 1:30 ~ 3:30"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-on-surface-variant font-headline mb-2">장소</label>
            <input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })}
              className="w-full bg-surface-container-lowest border border-surface-container-low rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors text-on-surface"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-on-surface-variant font-headline mb-2">대상</label>
            <input type="text" value={formData.target} onChange={e => setFormData({ ...formData, target: e.target.value })}
              className="w-full bg-surface-container-lowest border border-surface-container-low rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors text-on-surface"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-on-surface-variant font-headline mb-2">이번 주 봉사 담당숲</label>
            <select value={formData.assigned_forest_id} onChange={e => setFormData({ ...formData, assigned_forest_id: e.target.value })}
              className="w-full bg-surface-container-lowest border border-surface-container-low rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors text-on-surface"
            >
              <option value="">담당 숲 선택</option>
              {forests.map((f: any) => (
                <option key={f.forest_id} value={f.forest_id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-on-surface-variant font-headline mb-2">돌봄 프로그램 내용</label>
            <textarea value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })}
              rows={4}
              className="w-full bg-surface-container-lowest border border-surface-container-low rounded-xl px-4 py-3 outline-none focus:border-primary transition-colors text-on-surface resize-none"
              placeholder="이번 주 진행할 아이들을 위한 말씀, 활동 내용 등을 적어주세요."
            />
          </div>
        </div>

        <button 
          onClick={handleSubmit} disabled={isSubmitting}
          className="w-full py-4 bg-primary text-on-primary rounded-2xl font-bold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 active:scale-95 transition-all disabled:opacity-70 flex justify-center items-center gap-2"
        >
          {isSubmitting ? '등록 중...' : '등록 완료'}
          {!isSubmitting && <CheckCircle2 size={20} />}
        </button>
      </main>
    </div>
  );
}
