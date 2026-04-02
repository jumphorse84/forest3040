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

const ProgramAddView = ({ onBack, onShowToast }: { onBack: () => void, onShowToast: (msg: string) => void }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '사역',
    host: '',
    date: '',
    location: '',
    image: 'https://picsum.photos/seed/program/800/400',
    status: '모집중',
    dDay: ''
  });
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const categories = ['사역', '교육/훈련', '봉사', '선교', '동아리'];
  const statuses = ['모집중', '마감임박', '모집완료'];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      onShowToast('이미지 크기는 5MB 이하여야 합니다.');
      return;
    }

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `programs/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        () => {},
        (error) => {
          console.error('Upload error:', error);
          onShowToast('이미지 업로드 중 오류가 발생했습니다.');
          setIsUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setFormData({ ...formData, image: downloadURL });
          setIsUploading(false);
          onShowToast('이미지가 성공적으로 업로드되었습니다.');
        }
      );
    } catch (error) {
      console.error(error);
      setIsUploading(false);
      onShowToast('이미지 업로드에 실패했습니다.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.host || !formData.date) {
      onShowToast('필수 정보를 모두 입력해주세요.');
      return;
    }

    try {
      await addDoc(collection(firestoreDb, 'programs'), {
        ...formData,
        createdAt: Timestamp.now()
      });
      onShowToast('프로그램이 성공적으로 추가되었습니다.');
      onBack();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'programs');
    }
  };

  return (
    <div className="absolute inset-0 bg-surface z-[60] flex flex-col min-h-screen overflow-y-auto pb-24">
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface-container-highest">
        <div className="flex items-center px-2 py-3">
          <button onClick={onBack} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-bold tracking-tight text-on-surface ml-2">프로그램 추가</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="bg-surface-container-lowest p-5 rounded-3xl border border-surface-container-low shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">카테고리</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData({...formData, type: cat})}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      formData.type === cat 
                        ? 'bg-primary text-on-primary shadow-sm' 
                        : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">프로그램 명</label>
              <input 
                type="text" 
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="예: 2026 여름 단기선교 (태국)"
                className="w-full bg-surface-container-high text-on-surface p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">주관 / 호스트</label>
              <input 
                type="text" 
                value={formData.host}
                onChange={(e) => setFormData({...formData, host: e.target.value})}
                placeholder="예: 청년부 주관"
                className="w-full bg-surface-container-high text-on-surface p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              />
            </div>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-3xl border border-surface-container-low shadow-sm space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">일정</label>
                <input 
                  type="text" 
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  placeholder="예: 7.25(목) - 8.1(목)"
                  className="w-full bg-surface-container-high text-on-surface p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">D-Day</label>
                <input 
                  type="text" 
                  value={formData.dDay}
                  onChange={(e) => setFormData({...formData, dDay: e.target.value})}
                  placeholder="예: D-15"
                  className="w-full bg-surface-container-high text-on-surface p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">장소</label>
              <input 
                type="text" 
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="예: 태국 치앙마이 일대"
                className="w-full bg-surface-container-high text-on-surface p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              />
            </div>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-3xl border border-surface-container-low shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">대표 이미지</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-48 bg-surface-container-high rounded-2xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center cursor-pointer hover:bg-surface-container-highest transition-colors relative overflow-hidden group"
              >
                {formData.image && formData.image !== 'https://picsum.photos/seed/program/800/400' ? (
                  <>
                    <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white">
                      <Camera size={32} className="mb-2" />
                      <span className="text-sm font-bold">이미지 변경</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-on-surface-variant">
                    {isUploading ? (
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Camera size={32} className="mb-2 text-outline" />
                        <span className="text-sm font-bold">터치하여 이미지 업로드</span>
                        <span className="text-xs font-medium mt-1">권장 비율 가로형 (16:9)</span>
                      </>
                    )}
                  </div>
                )}
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImageUpload} 
                  accept="image/*" 
                  className="hidden" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">모집 상태</label>
              <div className="flex gap-2">
                {statuses.map(status => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFormData({...formData, status: status})}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${
                      formData.status === status 
                        ? 'bg-primary text-on-primary shadow-sm' 
                        : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">상세 설명</label>
              <textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="프로그램에 대한 상세 내용을 입력하세요."
                className="w-full bg-surface-container-high text-on-surface p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium min-h-[120px] resize-none"
              />
            </div>
          </div>
        </div>

        <button 
          type="submit"
          disabled={isUploading}
          className={`w-full py-4 rounded-2xl font-bold shadow-lg transition-all ${
            isUploading 
              ? 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed' 
              : 'bg-primary text-on-primary shadow-primary/30 active:scale-95'
          }`}
        >
          {isUploading ? '이미지 업로드 중...' : '프로그램 등록하기'}
        </button>
      </form>
    </div>
  );
};

const ProgramDetailView = ({ user, programId, programs, onBack, onShowToast }: { user: any, programId: string | null, programs: any[], onBack: () => void, onShowToast: (msg: string) => void }) => {
  const program = programs.find((p: any) => p.id === programId);

  if (!program) return null;

  const handleApply = async () => {
    try {
      const attendanceRef = collection(firestoreDb, 'attendance');
      await addDoc(attendanceRef, {
        uid: user.uid,
        user_name: user.name,
        date: Timestamp.now(),
        type: '프로그램신청',
        program_id: programId,
        program_title: program.title,
        status: '신청완료'
      });
      onShowToast('신청이 완료되었습니다.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'attendance');
    }
  };

  return (
    <div className="flex flex-col bg-surface min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface-container-highest">
        <div className="flex items-center px-2 py-3">
          <button onClick={onBack} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-bold tracking-tight text-on-surface ml-2">프로그램 상세</h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1">
        {/* Hero Image */}
        <div className="relative h-64 w-full bg-surface-container-low">
          <img src={program.image} alt={program.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          <div className="absolute top-4 left-4 flex gap-2">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm ${
              program.status === '모집중' ? 'bg-primary text-on-primary' : 
              program.status === '마감임박' ? 'bg-error text-on-error' : 
              'bg-secondary text-on-secondary'
            }`}>{program.status}</span>
            {program.dDay && (
              <span className="bg-surface/90 backdrop-blur-sm text-on-surface text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">{program.dDay}</span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 -mt-6 relative bg-surface rounded-t-3xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-bold text-tertiary">{program.type}</span>
            <span className="w-1 h-1 rounded-full bg-surface-container-highest"></span>
            <span className="text-sm font-medium text-on-surface-variant">{program.host}</span>
          </div>
          
          <h2 className="text-2xl font-bold text-on-surface mb-6 tracking-tight leading-tight">{program.title}</h2>
          
          <div className="space-y-4 mb-8 bg-surface-container-lowest p-5 rounded-2xl border border-surface-container-low">
            <div className="flex items-start gap-3">
              <Calendar size={20} className="text-primary mt-0.5" />
              <div>
                <p className="text-sm font-bold text-on-surface">일정</p>
                <p className="text-sm text-on-surface-variant mt-0.5">{program.date}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={20} className="text-primary mt-0.5" />
              <div>
                <p className="text-sm font-bold text-on-surface">장소</p>
                <p className="text-sm text-on-surface-variant mt-0.5">{program.location}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-bold text-on-surface mb-3">프로그램 소개</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                {program.desc}
              </p>
            </section>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-surface/90 backdrop-blur-md border-t border-surface-container-highest p-4 flex gap-3 z-50">
        <button onClick={() => onShowToast('관심 프로그램으로 등록되었습니다.')} className="w-14 h-14 rounded-2xl bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-error transition-colors shadow-sm">
          <Heart size={24} />
        </button>
        <button onClick={handleApply} className="flex-1 bg-primary text-on-primary rounded-2xl text-base font-bold hover:bg-primary-dim transition-colors shadow-md shadow-primary/20">
          신청하기
        </button>
      </div>
    </div>
  );
};

// ==========================================
// 5. Worship View (온라인 주보)
// ==========================================

export default ProgramAddView;
