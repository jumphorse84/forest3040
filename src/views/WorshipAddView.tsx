import React, { useState } from 'react';
import {
  ChevronLeft, BookOpen, Users, Music, Megaphone, Play,
  Plus, Trash2, Camera, Save, Search, X
} from 'lucide-react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db as firestoreDb, storage } from '../firebase';
import { OperationType, handleFirestoreError } from '../App';

const WorshipAddView = ({ onBack, onShowToast }: { onBack: () => void; onShowToast: (msg: string) => void }) => {
  const [formData, setFormData] = useState<any>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    image: '',
    youtube_url: '',
    scripture: '',
    scripture_content: '',
    participants: [
      { role: '사회', name: '' },
      { role: '기도', name: '' },
      { role: '성경봉독', name: '' },
      { role: '봉헌기도', name: '' },
    ],
    praise: [],
    announcements: [],
    status: 'published',
  });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { onShowToast('이미지 크기는 5MB 이하여야 합니다.'); return; }
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const storageRef = ref(storage, `worship_images/${Date.now()}.${fileExt}`);
      const uploadTask = uploadBytesResumable(storageRef, file);
      uploadTask.on('state_changed', () => {}, (err) => { onShowToast('업로드 오류가 발생했습니다.'); setIsUploading(false); console.error(err); },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          setFormData((prev: any) => ({ ...prev, image: url }));
          setIsUploading(false);
          onShowToast('이미지가 업로드되었습니다.');
        });
    } catch (err) { console.error(err); setIsUploading(false); onShowToast('업로드에 실패했습니다.'); }
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.date) { onShowToast('제목과 날짜를 입력해주세요.'); return; }
    try {
      await addDoc(collection(firestoreDb, 'worships'), {
        ...formData,
        image: formData.image || 'https://picsum.photos/seed/worship/800/1200',
        date: Timestamp.fromDate(new Date(formData.date)),
        view_count: 0,
        createdAt: Timestamp.now(),
      });
      onShowToast('예배 정보가 등록되었습니다.');
      onBack();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'worships');
    }
  };

  const updateParticipant = (idx: number, key: string, val: string) => {
    const newP = [...formData.participants];
    newP[idx] = { ...newP[idx], [key]: val };
    setFormData({ ...formData, participants: newP });
  };
  const updatePraise = (idx: number, key: string, val: string) => {
    const newP = [...formData.praise];
    newP[idx] = { ...newP[idx], [key]: val };
    setFormData({ ...formData, praise: newP });
  };
  const updateAnnouncement = (idx: number, key: string, val: string) => {
    const newA = [...formData.announcements];
    newA[idx] = { ...newA[idx], [key]: val };
    setFormData({ ...formData, announcements: newA });
  };

  return (
    <div className="absolute inset-0 bg-surface z-[60] flex flex-col min-h-screen overflow-y-auto pb-28">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface-container-highest">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center">
            <button onClick={onBack} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors mr-2">
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-lg font-bold tracking-tight text-on-surface">예배 등록</h1>
          </div>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-1.5 bg-primary text-on-primary px-4 py-2 rounded-xl text-sm font-bold shadow-sm active:scale-95 transition-transform"
          >
            <Save size={16} /> 등록하기
          </button>
        </div>
      </header>

      <div className="p-5 space-y-5">

        {/* 기본 정보 */}
        <div className="bg-surface-container-lowest border border-surface-container-low rounded-3xl p-5 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-outline uppercase tracking-wider">기본 정보</h2>

          {/* 대표 이미지 */}
          <div>
            <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">대표 이미지</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-40 bg-surface-container-high rounded-2xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group"
            >
              {formData.image ? (
                <>
                  <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
                    <Camera size={28} className="mb-1" /><span className="text-sm font-bold">이미지 변경</span>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center text-on-surface-variant">
                  {isUploading
                    ? <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    : <><Camera size={28} className="mb-2 text-outline" /><span className="text-sm font-bold">이미지 업로드</span><span className="text-xs mt-1">권장 비율 가로형 (16:9)</span></>
                  }
                </div>
              )}
              <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
            </div>
          </div>

          {/* 날짜 */}
          <div>
            <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">예배 날짜</label>
            <input
              type="date"
              value={formData.date}
              onChange={e => setFormData({ ...formData, date: e.target.value })}
              className="w-full bg-surface-container-high text-on-surface p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 font-medium"
            />
          </div>

          {/* 제목 */}
          <div>
            <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">설교 제목</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              placeholder="예: 나는 포도나무요 너희는 가지라"
              className="w-full bg-surface-container-high text-on-surface p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 font-medium"
            />
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
              <Search size={13} /> 유튜브 검색
            </a>
          </div>
          <input
            type="text"
            value={formData.youtube_url || ''}
            onChange={e => setFormData({ ...formData, youtube_url: e.target.value })}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full bg-surface-container-high text-on-surface p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 font-medium text-sm"
          />
        </div>

        {/* 본문 말씀 */}
        <div className="bg-surface-container-lowest border border-surface-container-low rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <span className="bg-primary/10 text-primary p-1.5 rounded-lg"><BookOpen size={16} /></span>
            <h2 className="text-sm font-bold text-on-surface">본문 말씀</h2>
          </div>
          <input
            type="text"
            value={formData.scripture}
            onChange={e => setFormData({ ...formData, scripture: e.target.value })}
            placeholder="예: 요한복음 15:1-8"
            className="w-full bg-surface-container-high text-on-surface p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 font-bold"
          />
          <textarea
            value={formData.scripture_content}
            onChange={e => setFormData({ ...formData, scripture_content: e.target.value })}
            placeholder="말씀 본문 내용을 입력하세요..."
            rows={5}
            className="w-full bg-surface-container-high text-on-surface p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 font-medium text-sm resize-none"
          />
        </div>

        {/* 예배 임사자 */}
        <div className="bg-surface-container-lowest border border-surface-container-low rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <span className="bg-tertiary/10 text-tertiary p-1.5 rounded-lg"><Users size={16} /></span>
            <h2 className="text-sm font-bold text-on-surface">예배 임사자</h2>
          </div>
          <div className="space-y-3">
            {formData.participants.map((p: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text" value={p.role}
                  onChange={e => updateParticipant(idx, 'role', e.target.value)}
                  placeholder="역할"
                  className="w-24 bg-surface-container-high text-on-surface px-3 py-3 rounded-xl outline-none text-sm font-bold"
                />
                <input
                  type="text" value={p.name}
                  onChange={e => updateParticipant(idx, 'name', e.target.value)}
                  placeholder="이름"
                  className="flex-1 bg-surface-container-high text-on-surface px-3 py-3 rounded-xl outline-none text-sm font-medium"
                />
                <button onClick={() => setFormData({ ...formData, participants: formData.participants.filter((_: any, i: number) => i !== idx) })}
                  className="p-2 text-error/50 hover:text-error transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            <button
              onClick={() => setFormData({ ...formData, participants: [...formData.participants, { role: '', name: '' }] })}
              className="w-full py-3 flex items-center justify-center gap-2 text-primary font-bold text-sm bg-primary/5 rounded-2xl border border-primary/20 hover:bg-primary/10 transition-colors"
            >
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
            {formData.praise.map((p: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3 bg-surface-container-high p-3 rounded-2xl">
                <div className="w-10 h-10 rounded-xl bg-error/10 flex items-center justify-center text-error shrink-0">
                  <Play size={18} fill="currentColor" />
                </div>
                <div className="flex-1 space-y-1 min-w-0">
                  <input type="text" value={p.title} onChange={e => updatePraise(idx, 'title', e.target.value)}
                    placeholder="곡 제목" className="w-full bg-transparent font-bold text-on-surface outline-none text-sm" />
                  <input type="text" value={p.link} onChange={e => updatePraise(idx, 'link', e.target.value)}
                    placeholder="YouTube 링크" className="w-full bg-transparent text-on-surface-variant outline-none text-xs" />
                </div>
                <button onClick={() => setFormData({ ...formData, praise: formData.praise.filter((_: any, i: number) => i !== idx) })}
                  className="p-1.5 text-error/50 hover:text-error transition-colors shrink-0">
                  <X size={16} />
                </button>
              </div>
            ))}
            <button
              onClick={() => setFormData({ ...formData, praise: [...formData.praise, { title: '', link: '' }] })}
              className="w-full py-3 flex items-center justify-center gap-2 text-primary font-bold text-sm bg-primary/5 rounded-2xl border border-primary/20 hover:bg-primary/10 transition-colors"
            >
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
            {formData.announcements.map((a: any, idx: number) => (
              <div key={idx} className="bg-surface-container-high p-4 rounded-2xl space-y-2">
                <div className="flex items-center gap-2">
                  <input type="text" value={a.title} onChange={e => updateAnnouncement(idx, 'title', e.target.value)}
                    placeholder="광고 제목" className="flex-1 bg-transparent font-bold text-on-surface outline-none text-sm" />
                  <button onClick={() => setFormData({ ...formData, announcements: formData.announcements.filter((_: any, i: number) => i !== idx) })}
                    className="p-1.5 text-error/50 hover:text-error transition-colors shrink-0">
                    <X size={16} />
                  </button>
                </div>
                <input type="text" value={a.content} onChange={e => updateAnnouncement(idx, 'content', e.target.value)}
                  placeholder="광고 내용" className="w-full bg-transparent text-on-surface-variant text-sm outline-none" />
              </div>
            ))}
            <button
              onClick={() => setFormData({ ...formData, announcements: [...formData.announcements, { title: '', content: '' }] })}
              className="w-full py-3 flex items-center justify-center gap-2 text-primary font-bold text-sm bg-primary/5 rounded-2xl border border-primary/20 hover:bg-primary/10 transition-colors"
            >
              <Plus size={16} /> 광고 추가
            </button>
          </div>
        </div>

      </div>

      {/* Fixed Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-surface/90 backdrop-blur-md border-t border-surface-container-highest p-4 z-40">
        <button
          onClick={handleSubmit}
          className="w-full py-4 bg-primary text-on-primary rounded-2xl text-base font-bold shadow-lg shadow-primary/20 hover:-translate-y-0.5 transform transition-all duration-200 active:scale-95"
        >
          예배 등록하기
        </button>
      </div>
    </div>
  );
};

export default WorshipAddView;
