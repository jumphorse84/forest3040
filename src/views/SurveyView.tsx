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
import { MenuButton, ScheduleItem, MemberRow, OperationType, handleFirestoreError } from '../App';
import { VISIT_CATEGORIES } from '../components/PastoralCardModal';

const SurveyView = ({ user, surveys, onBack, onShowToast, onVote }: any) => {
  const [selectedSurvey, setSelectedSurvey] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newSurvey, setNewSurvey] = useState({
    title: '',
    description: '',
    options: ['', ''],
    deadline: ''
  });

  const handleAddSurvey = async () => {
    if (!newSurvey.title || newSurvey.options.some(opt => !opt) || !newSurvey.deadline) {
      onShowToast('모든 필드를 입력해주세요.');
      return;
    }

    try {
      await addDoc(collection(firestoreDb, 'surveys'), {
        ...newSurvey,
        status: 'active',
        responses: {},
        deadline: Timestamp.fromDate(new Date(newSurvey.deadline)),
        createdAt: Timestamp.now()
      });
      onShowToast('설문조사가 추가되었습니다.');
      setIsAdding(false);
      setNewSurvey({ title: '', description: '', options: ['', ''], deadline: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'surveys');
    }
  };

  if (isAdding) {
    return (
      <div className="absolute inset-0 bg-surface z-[70] flex flex-col min-h-screen overflow-y-auto pb-24">
        <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface-container-highest">
          <div className="flex items-center justify-between px-2 py-3">
            <div className="flex items-center">
              <button onClick={() => setIsAdding(false)} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
                <ChevronLeft size={24} />
              </button>
              <h1 className="text-lg font-bold tracking-tight text-on-surface ml-2">설문 추가</h1>
            </div>
            <button 
              onClick={handleAddSurvey}
              className="px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-bold mr-2"
            >
              저장
            </button>
          </div>
        </header>
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-on-surface mb-1">제목</label>
              <input 
                type="text" 
                value={newSurvey.title}
                onChange={(e) => setNewSurvey({...newSurvey, title: e.target.value})}
                className="w-full bg-surface-container-low border border-surface-container-high rounded-xl px-4 py-3 text-on-surface outline-none focus:border-primary"
                placeholder="설문 제목을 입력하세요"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-on-surface mb-1">설명</label>
              <textarea 
                value={newSurvey.description}
                onChange={(e) => setNewSurvey({...newSurvey, description: e.target.value})}
                className="w-full bg-surface-container-low border border-surface-container-high rounded-xl px-4 py-3 text-on-surface outline-none focus:border-primary min-h-[100px]"
                placeholder="설문에 대한 설명을 입력하세요"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-on-surface mb-2">선택지</label>
              <div className="space-y-2">
                {newSurvey.options.map((opt, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input 
                      type="text" 
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...newSurvey.options];
                        newOpts[idx] = e.target.value;
                        setNewSurvey({...newSurvey, options: newOpts});
                      }}
                      className="flex-1 bg-surface-container-low border border-surface-container-high rounded-xl px-4 py-3 text-on-surface outline-none focus:border-primary"
                      placeholder={`옵션 ${idx + 1}`}
                    />
                    {newSurvey.options.length > 2 && (
                      <button 
                        onClick={() => {
                          const newOpts = newSurvey.options.filter((_, i) => i !== idx);
                          setNewSurvey({...newSurvey, options: newOpts});
                        }}
                        className="p-3 text-error"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>
                ))}
                <button 
                  onClick={() => setNewSurvey({...newSurvey, options: [...newSurvey.options, '']})}
                  className="w-full py-3 border border-dashed border-outline rounded-xl text-sm text-on-surface-variant flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  <span>선택지 추가</span>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-on-surface mb-1">마감 기한</label>
              <input 
                type="datetime-local" 
                value={newSurvey.deadline}
                onChange={(e) => setNewSurvey({...newSurvey, deadline: e.target.value})}
                className="w-full bg-surface-container-low border border-surface-container-high rounded-xl px-4 py-3 text-on-surface outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedSurvey) {
    const userResponse = selectedSurvey.responses?.[user?.uid];
    return (
      <div className="absolute inset-0 bg-surface z-[70] flex flex-col min-h-screen overflow-y-auto pb-24">
        <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface-container-highest">
          <div className="flex items-center px-2 py-3">
            <button onClick={() => setSelectedSurvey(null)} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-lg font-bold tracking-tight text-on-surface ml-2">설문 참여</h1>
          </div>
        </header>
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-on-surface leading-tight">{selectedSurvey.title}</h2>
            <p className="text-on-surface-variant">{selectedSurvey.description}</p>
          </div>

          <div className="space-y-3">
            {selectedSurvey.options.map((option: string, index: number) => {
              const isSelected = userResponse === index;
              const totalVotes = Object.keys(selectedSurvey.responses || {}).length;
              const optionVotes = Object.values(selectedSurvey.responses || {}).filter(v => v === index).length;
              const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;

              return (
                <button
                  key={index}
                  onClick={async () => {
                    const success = await onVote(selectedSurvey.id, index);
                    if (success) setSelectedSurvey(null);
                  }}
                  disabled={userResponse !== undefined}
                  className={`w-full p-4 rounded-2xl border transition-all text-left relative overflow-hidden ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-surface-container-high bg-surface-container-lowest hover:border-primary/50'
                  }`}
                >
                  {userResponse !== undefined && (
                    <div 
                      className="absolute inset-y-0 left-0 bg-primary/10 transition-all duration-1000" 
                      style={{ width: `${percentage}%` }}
                    />
                  )}
                  <div className="relative z-10 flex justify-between items-center">
                    <span className={`font-bold ${isSelected ? 'text-primary' : 'text-on-surface'}`}>{option}</span>
                    {userResponse !== undefined && (
                      <span className="text-xs font-bold text-primary">{percentage}%</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {userResponse !== undefined && (
            <div className="bg-surface-container-low p-4 rounded-2xl text-center">
              <p className="text-sm text-on-surface-variant">이미 설문에 참여하셨습니다.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-surface z-[60] flex flex-col min-h-screen overflow-y-auto pb-24">
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface-container-highest">
        <div className="flex items-center justify-between px-2 py-3">
          <div className="flex items-center">
            <button onClick={onBack} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-lg font-bold tracking-tight text-on-surface ml-2">설문조사</h1>
          </div>
          {(user?.role === 'admin' || user?.email === 'jumphorse@nate.com' || user?.email === 'seokgwan.ms01@gmail.com' || user?.uid === 'sfViap2UZ2alO1kzinMETlcLCxv1') && (
            <button 
              onClick={() => setIsAdding(true)}
              className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors mr-1"
            >
              <Plus size={24} />
            </button>
          )}
        </div>
      </header>
      <div className="p-6 space-y-6">
        <div className="bg-tertiary-container/30 rounded-2xl p-5 border border-tertiary-container/50">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList size={20} className="text-tertiary" />
            <h2 className="font-bold text-tertiary">진행 중인 설문</h2>
          </div>
          <p className="text-sm text-on-surface-variant">공동체의 의견을 들려주세요. 여러분의 참여가 큰 힘이 됩니다.</p>
        </div>

        <div className="space-y-4">
          {surveys.length > 0 ? (
            surveys.map((survey: any) => {
              const isClosed = survey.status === 'closed';
              const userResponded = survey.responses?.[user?.uid] !== undefined;
              
              return (
                <div 
                  key={survey.id} 
                  className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container-low shadow-sm group cursor-pointer hover:border-primary transition-colors" 
                  onClick={() => setSelectedSurvey(survey)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      isClosed ? 'bg-surface-container-high text-on-surface-variant' : 'bg-primary/10 text-primary'
                    }`}>
                      {isClosed ? '마감됨' : (userResponded ? '참여완료' : '진행중')}
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      {survey.deadline?.toDate ? `~ ${survey.deadline.toDate().toLocaleDateString()}까지` : 
                       (survey.deadline?.seconds ? `~ ${new Date(survey.deadline.seconds * 1000).toLocaleDateString()}까지` : '기한 정보 없음')}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-on-surface mb-1 group-hover:text-primary transition-colors">{survey.title}</h3>
                  <p className="text-sm text-on-surface-variant mb-4">{survey.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-primary font-bold">{userResponded ? '결과 보기' : '참여하기'}</span>
                    <ChevronRight size={16} className="text-primary" />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 text-on-surface-variant text-sm">
              진행 중인 설문이 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SurveyView;
