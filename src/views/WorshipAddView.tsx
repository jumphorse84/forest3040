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

const WorshipAddView = ({ onBack, onShowToast }: { onBack: () => void, onShowToast: (msg: string) => void }) => {
  const [formData, setFormData] = useState<any>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    image: 'https://picsum.photos/seed/worship/800/1200',
    youtube_url: '',
    scripture: '',
    scripture_content: '',
    participants: [
      { role: '사회', name: '' },
      { role: '기도', name: '' },
      { role: '성경봉독', name: '' },
      { role: '봉헌기도', name: '' }
    ],
    praise: [],
    announcements: [],
    status: 'published'
  });
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `worship_images/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const storageRef = ref(storage, fileName);
      
      const uploadTask = await uploadBytesResumable(storageRef, file);
      const downloadURL = await getDownloadURL(uploadTask.ref);
      
      setFormData({...formData, image: downloadURL});
      onShowToast('이미지가 성공적으로 업로드되었습니다.');
    } catch (err) {
      console.error('Upload Error:', err);
      onShowToast('이미지 업로드에 실패했습니다. (Storage 규칙 확인 요망)');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddParticipant = () => {
    setFormData({
      ...formData,
      participants: [...formData.participants, { role: '', name: '' }]
    });
  };

  const handleRemoveParticipant = (index: number) => {
    const newParticipants = [...formData.participants];
    newParticipants.splice(index, 1);
    setFormData({ ...formData, participants: newParticipants });
  };

  const handleAddPraise = () => {
    setFormData({
      ...formData,
      praise: [...formData.praise, { title: '', link: '' }]
    });
  };

  const handleRemovePraise = (index: number) => {
    const newPraise = [...formData.praise];
    newPraise.splice(index, 1);
    setFormData({ ...formData, praise: newPraise });
  };

  const handleAddAnnouncement = () => {
    setFormData({
      ...formData,
      announcements: [...formData.announcements, { title: '', content: '' }]
    });
  };

  const handleRemoveAnnouncement = (index: number) => {
    const newAnnouncements = [...formData.announcements];
    newAnnouncements.splice(index, 1);
    setFormData({ ...formData, announcements: newAnnouncements });
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.date) {
      onShowToast('제목과 날짜를 입력해주세요.');
      return;
    }

    try {
      await addDoc(collection(firestoreDb, 'worships'), {
        ...formData,
        date: Timestamp.fromDate(new Date(formData.date)),
        view_count: 0,
        createdAt: Timestamp.now()
      });
      onShowToast('예배 정보가 등록되었습니다.');
      onBack();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'worships');
    }
  };

  return (
    <div className="absolute inset-0 bg-surface z-[60] flex flex-col min-h-screen overflow-y-auto pb-32">
      {/* Background Hero */}
      <div className="relative h-80 shrink-0">
        <img 
          src={formData.image} 
          className="w-full h-full object-cover" 
          alt="Worship background" 
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/40"></div>
        
        <div className="absolute top-16 left-4 right-4 z-20 flex flex-col gap-2">
          <input 
            type="text" 
            value={formData.image}
            onChange={(e) => setFormData({...formData, image: e.target.value})}
            className="w-full bg-black/40 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs border border-white/20 outline-none placeholder:text-white/50"
            placeholder="대표 배경 이미지 URL 입력 (예: https://...)"
          />
          <div className="flex justify-end relative">
            <input 
              type="file" 
              accept="image/*" 
              id="worship-image-upload" 
              className="hidden" 
              onChange={handleImageUpload}
              disabled={isUploading}
            />
            <label 
              htmlFor="worship-image-upload" 
              className={`bg-white/20 backdrop-blur-md text-white border border-white/30 px-3 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer hover:bg-white/30 transition-colors flex items-center gap-1.5 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <Camera size={14} />
              {isUploading ? '업로드 중...' : '기기에서 사진 첨부'}
            </label>
          </div>
        </div>

        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <button onClick={onBack} className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
            <X size={24} />
          </button>
          <div className="flex gap-2">
            <button className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
              <Bookmark size={20} />
            </button>
            <button onClick={handleSubmit} className="px-5 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center gap-2 text-white font-bold text-sm border border-white/20">
              <Send size={18} />
              <span>배포</span>
            </button>
          </div>
        </div>

        <div className="absolute bottom-8 left-8 right-8 space-y-4">
          <input 
            type="text" 
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            placeholder="설교 제목"
            className="w-full bg-transparent text-white text-4xl font-bold placeholder:text-white/50 outline-none"
          />
          <div className="relative inline-block">
            <input 
              type="date" 
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-xl border border-white/20 outline-none text-sm font-bold"
            />
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none">
              <Camera size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-6 -mt-6 relative z-10 space-y-8">
        {/* Section Header */}
        <div className="flex items-center justify-between bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-surface-container-highest shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-on-surface">섹션 목록</span>
            <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">4개의 섹션</span>
          </div>
          <button className="text-xs font-bold text-primary bg-primary/5 px-3 py-1.5 rounded-lg">순서 편집</button>
        </div>

        {/* YouTube Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 border border-red-100">
                <Play size={20} />
              </div>
              <h3 className="font-bold text-on-surface">예배 영상 (YouTube)</h3>
            </div>
            <a 
              href="https://m.youtube.com/results?search_query=찬양+예배" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-1 active:scale-95 transition-transform"
            >
              <Search size={14} />
              유튜브 검색
            </a>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-surface-container-highest shadow-sm">
            <input 
              type="text" 
              value={formData.youtube_url || ''}
              onChange={(e) => setFormData({...formData, youtube_url: e.target.value})}
              placeholder="YouTube 동영상 링크를 붙여넣으세요"
              className="w-full text-sm font-medium text-on-surface placeholder:text-outline outline-none"
            />
          </div>
        </div>

        {/* Scripture Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 border border-green-100">
                <BookOpen size={20} />
              </div>
              <h3 className="font-bold text-on-surface">본문 말씀</h3>
            </div>
            <button className="text-on-surface-variant"><MoreHorizontal size={20} /></button>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-surface-container-highest shadow-sm space-y-4">
            <input 
              type="text" 
              value={formData.scripture}
              onChange={(e) => setFormData({...formData, scripture: e.target.value})}
              placeholder="예: 요한복음 15:1-8"
              className="w-full text-2xl font-bold text-primary placeholder:text-primary/20 outline-none"
            />
            <textarea 
              value={formData.scripture_content}
              onChange={(e) => setFormData({...formData, scripture_content: e.target.value})}
              placeholder="1. 나는 참 포도나무요..."
              className="w-full min-h-[100px] text-on-surface-variant leading-relaxed outline-none resize-none"
            />
          </div>
        </div>

        {/* Participants Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                <Users size={20} />
              </div>
              <h3 className="font-bold text-on-surface">예배 임사자</h3>
            </div>
            <button className="text-on-surface-variant"><MoreHorizontal size={20} /></button>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-surface-container-highest shadow-sm space-y-3">
            {formData.participants.map((p: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3 group">
                <div className="p-2 text-on-surface-variant/30"><Menu size={16} /></div>
                <input 
                  type="text" 
                  value={p.role}
                  onChange={(e) => {
                    const newP = [...formData.participants];
                    newP[idx].role = e.target.value;
                    setFormData({...formData, participants: newP});
                  }}
                  className="w-20 bg-surface-container-low px-3 py-2 rounded-xl text-sm font-bold outline-none"
                  placeholder="역할"
                />
                <input 
                  type="text" 
                  value={p.name}
                  onChange={(e) => {
                    const newP = [...formData.participants];
                    newP[idx].name = e.target.value;
                    setFormData({...formData, participants: newP});
                  }}
                  className="flex-1 bg-white border border-surface-container-highest px-3 py-2 rounded-xl text-sm outline-none"
                  placeholder="이름"
                />
                <button onClick={() => handleRemoveParticipant(idx)} className="p-2 text-error/40 hover:text-error transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            <button 
              onClick={handleAddParticipant}
              className="w-full py-3 flex items-center justify-center gap-2 text-primary font-bold text-sm border-t border-surface-container-low mt-2"
            >
              <Plus size={18} />
              <span>추가</span>
            </button>
          </div>
        </div>

        {/* Praise Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 border border-orange-100">
                <Music size={20} />
              </div>
              <h3 className="font-bold text-on-surface">경배와 찬양</h3>
            </div>
            <button className="text-on-surface-variant"><MoreHorizontal size={20} /></button>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-surface-container-highest shadow-sm space-y-3">
            {formData.praise.map((p: any, idx: number) => (
              <div key={idx} className="flex items-center gap-4 p-4 bg-surface-container-lowest rounded-2xl border border-surface-container-low relative group">
                <div className="w-12 h-12 rounded-xl bg-error/10 flex items-center justify-center text-error">
                  <Play size={24} fill="currentColor" />
                </div>
                <div className="flex-1 space-y-1">
                  <input 
                    type="text" 
                    value={p.title}
                    onChange={(e) => {
                      const newP = [...formData.praise];
                      newP[idx].title = e.target.value;
                      setFormData({...formData, praise: newP});
                    }}
                    placeholder="곡 제목"
                    className="w-full font-bold text-on-surface outline-none bg-transparent"
                  />
                  <input 
                    type="text" 
                    value={p.link}
                    onChange={(e) => {
                      const newP = [...formData.praise];
                      newP[idx].link = e.target.value;
                      setFormData({...formData, praise: newP});
                    }}
                    placeholder="YouTube 링크"
                    className="w-full text-xs text-on-surface-variant outline-none bg-transparent"
                  />
                </div>
                <button onClick={() => handleRemovePraise(idx)} className="p-2 text-error/40 hover:text-error transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            <button 
              onClick={handleAddPraise}
              className="w-full py-3 flex items-center justify-center gap-2 text-primary font-bold text-sm border-t border-surface-container-low mt-2"
            >
              <Plus size={18} />
              <span>추가</span>
            </button>
          </div>
        </div>

        {/* Announcements Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
                <Megaphone size={20} />
              </div>
              <h3 className="font-bold text-on-surface">광고</h3>
            </div>
            <button className="text-on-surface-variant"><MoreHorizontal size={20} /></button>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-surface-container-highest shadow-sm space-y-3">
            {formData.announcements.map((a: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3 group border-b border-surface-container-low last:border-0 pb-3 last:pb-0">
                <div className="p-2 text-on-surface-variant/30"><Menu size={16} /></div>
                <div className="flex-1 space-y-1">
                  <input 
                    type="text" 
                    value={a.title}
                    onChange={(e) => {
                      const newA = [...formData.announcements];
                      newA[idx].title = e.target.value;
                      setFormData({...formData, announcements: newA});
                    }}
                    placeholder="광고 제목"
                    className="w-full font-bold text-on-surface outline-none"
                  />
                  <input 
                    type="text" 
                    value={a.content}
                    onChange={(e) => {
                      const newA = [...formData.announcements];
                      newA[idx].content = e.target.value;
                      setFormData({...formData, announcements: newA});
                    }}
                    placeholder="광고 내용"
                    className="w-full text-sm text-on-surface-variant outline-none"
                  />
                </div>
                <button onClick={() => handleRemoveAnnouncement(idx)} className="p-2 text-error/40 hover:text-error transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            <button 
              onClick={handleAddAnnouncement}
              className="w-full py-3 flex items-center justify-center gap-2 text-primary font-bold text-sm border-t border-surface-container-low mt-2"
            >
              <Plus size={18} />
              <span>추가</span>
            </button>
          </div>
        </div>

        {/* Add Section Button */}
        <button className="flex items-center gap-4 px-2 py-4 text-on-surface-variant/50 hover:text-primary transition-colors group">
          <div className="w-10 h-10 rounded-full border-2 border-dashed border-current flex items-center justify-center group-hover:border-primary">
            <Plus size={24} />
          </div>
          <span className="font-bold text-lg">섹션 추가</span>
        </button>
      </div>
    </div>
  );
};

export default WorshipAddView;
