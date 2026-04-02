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

const MembersView = ({ user, users, forests, onOpenBoard, onShowToast, onMemberClick, onNavigateToStats }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMembersTab, setActiveMembersTab] = useState('all'); // all, ministry, forest
  const [expandedForests, setExpandedForests] = useState<Record<string, boolean>>({});

  const searchResults = searchQuery
    ? users.filter((u: any) => {
        const forest = forests.find((f: any) => f.forest_id === u.forest_id);
        const forestName = forest?.name || '';
        return u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
               forestName.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : [];

  const getForestEmoji = (forestId: string) => {
    switch(forestId) {
      case 'bebe': return '👶';
      case 'superpower': return '💪';
      case 'supermance': return '🏃';
      case 'bts': return '🌟';
      case 'haneul': return '☁️';
      case 'bamboo': return '🎋';
      case 'tta': return '☕';
      case 'pureun': return '🌲';
      case 'goyo': return '🤫';
      case 'supreme': return '🧢';
      case 'start': return '🚀';
      default: return '🌳';
    }
  };

  const toggleForest = (forestId: string) => {
    setExpandedForests(prev => ({...prev, [forestId]: !prev[forestId]}));
  };

  const ministries = ['예배팀', '새가족팀', '기획팀', '선교봉사팀', '관리팀'];

  return (
    <div className="space-y-6 pb-24">
      {/* Header Section */}
      <div className="flex items-start justify-between px-2">
        <div className="flex flex-col gap-2">
          <h2 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight">삼성/사성이</h2>
          <p className="text-sm font-medium text-on-surface-variant">FOREST 3040의 모든 가족들을 만나보세요.</p>
        </div>
        {(user?.role === 'admin' || user?.role === 'leader') && (
          <button onClick={() => onNavigateToStats?.()} className="p-3 bg-primary/10 text-primary rounded-xl active:scale-95 transition-transform flex flex-col items-center justify-center gap-1 shadow-sm shrink-0">
            <PieChart size={20} />
            <span className="text-[10px] font-bold">목양 통계</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex bg-surface-container-lowest p-1.5 rounded-[1.25rem] shadow-sm">
        {[
          { id: 'all', label: '전체' },
          { id: 'ministry', label: '사역' },
          { id: 'forest', label: '숲그룹' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveMembersTab(tab.id)}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
              activeMembersTab === tab.id 
                ? 'bg-white shadow-sm text-primary' 
                : 'text-on-surface-variant hover:text-on-surface hover:bg-white/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
          <Search className="text-outline group-focus-within:text-primary transition-colors" size={20} />
        </div>
        <input
          type="text"
          placeholder="이름으로 검색하세요..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-14 pr-5 py-4 bg-surface-container-lowest squircle shadow-[0_4px_20px_rgba(0,0,0,0.03)] border-none focus:ring-2 focus:ring-primary/30 transition-all font-body text-on-surface placeholder:text-outline-variant outline-none"
        />
      </div>

      {searchQuery ? (
        <div className="bg-surface-container-lowest p-3 squircle shadow-sm">
          {searchResults.length > 0 ? (
            <div className="space-y-1">
              {searchResults.map((member: any) => (
                <MemberRow key={member.uid} member={member} forests={forests} onClick={() => onMemberClick?.(member)} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 opacity-70">
              <UserCircle size={40} className="text-outline mb-3" />
              <p className="text-on-surface-variant text-sm font-medium">검색 결과가 없습니다.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {activeMembersTab === 'all' && (
            <div className="bg-surface-container-lowest p-3 squircle shadow-sm space-y-1">
              {users.map((member: any) => (
                <MemberRow key={member.uid} member={member} forests={forests} onClick={() => onMemberClick?.(member)} />
              ))}
            </div>
          )}

          {activeMembersTab === 'ministry' && (
            <div className="space-y-6">
              {ministries.map(ministry => {
                const teamMembers = users.filter((u: any) => u.ministry === ministry);
                if (teamMembers.length === 0) return null;
                return (
                  <div key={ministry} className="bg-surface-container-lowest p-5 squircle shadow-sm">
                    <h3 className="font-bold text-on-surface text-lg tracking-tight mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary"></span> {ministry}
                    </h3>
                    <div className="space-y-1">
                      {teamMembers.map((member: any) => (
                        <MemberRow key={member.uid} member={member} forests={forests} onClick={() => onMemberClick?.(member)} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeMembersTab === 'forest' && (
            <div className="space-y-4">
              {forests.map((forest: any) => {
                const forestMembers = users.filter((u: any) => u.forest_id === forest.forest_id);
                const leader = users.find((u: any) => u.forest_id === forest.forest_id && u.role === 'leader');
                const leaderName = leader ? leader.name : '공석';
                const isExpanded = expandedForests[forest.forest_id];

                return (
                  <div key={forest.forest_id} className="bg-surface-container-lowest p-5 squircle shadow-sm relative overflow-hidden transition-all duration-300 border border-transparent hover:border-surface-container-low">
                    <div 
                      className="flex justify-between items-center cursor-pointer select-none"
                      onClick={() => toggleForest(forest.forest_id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-3xl bg-surface-container p-3 rounded-2xl shadow-inner border border-surface-container-high/50">
                          {getForestEmoji(forest.forest_id)}
                        </div>
                        <div className="flex flex-col">
                          <h3 className="font-extrabold text-on-surface text-lg">{forest.name}</h3>
                          <div className="flex items-center gap-2 text-xs text-on-surface-variant font-bold mt-0.5">
                            <span>{forestMembers.length}명</span>
                            <span className="w-1 h-1 bg-outline-variant rounded-full"></span>
                            <span className="flex items-center gap-0.5">👑 {leaderName}</span>
                          </div>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center transition-transform duration-300">
                        <ChevronRight size={20} className={`text-on-surface-variant transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    </div>
                    
                    <div className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'}`}>
                      <div className="overflow-hidden space-y-1">
                        <div className="pt-2 border-t border-surface-container-low space-y-1 gap-1 flex flex-col">
                          {forestMembers.map((member: any) => (
                            <MemberRow key={member.uid} member={member} forests={forests} onClick={() => onMemberClick?.(member)} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ForestBoardView = ({ user, forestId, forests, users, forestPosts, onBack }: any) => {
  const forest = forests.find((f: any) => f.forest_id === forestId);
  const forestMembers = users.filter((u: any) => u.forest_id === forestId);
  const [posts, setPosts] = useState(forestPosts.filter((p: any) => p.forest_id === forestId));
  const [newPost, setNewPost] = useState('');

  useEffect(() => {
    setPosts(forestPosts.filter((p: any) => p.forest_id === forestId));
  }, [forestPosts, forestId]);

  const handleSend = async () => {
    if (!newPost.trim()) return;
    
    try {
      const newPostObj = {
        forest_id: forestId,
        author_uid: user.uid,
        author_name: user.name,
        content: newPost,
        date: Timestamp.now(),
        comments: 0
      };
      
      await addDoc(collection(firestoreDb, 'forest_posts'), newPostObj);
      setNewPost('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'forest_posts');
    }
  };

  return (
    <div className="absolute inset-0 bg-surface z-[60] flex flex-col min-h-screen">
      <div className="bg-surface-container-lowest/80 backdrop-blur-xl px-4 py-4 flex items-center shadow-sm sticky top-0 z-10">
        <button onClick={onBack} className="p-2 mr-2 text-on-surface hover:bg-surface-container rounded-full transition">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-lg font-headline font-bold text-on-surface">{forest?.name} 전용 게시판 🤫</h2>
      </div>

      {/* Forest Members Quick View */}
      <div className="bg-surface-container-lowest border-b border-surface-container px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-outline uppercase tracking-widest">우리 숲 멤버</h3>
          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {forestMembers.length}명
          </span>
        </div>
        <div className="flex -space-x-2 overflow-hidden">
          {forestMembers.map((member: any) => (
            <div key={member.uid} className="w-8 h-8 rounded-full border-2 border-surface-container-lowest bg-primary-container text-on-primary-container flex items-center justify-center text-[10px] font-bold overflow-hidden shadow-sm">
              {member.profile_image ? (
                <img src={member.profile_image} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span>{member.name.charAt(0)}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto pb-24">
        {posts.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={28} className="text-outline" />
            </div>
            <p className="text-on-surface-variant text-sm font-body">아직 작성된 글이 없습니다.<br/>우리 숲의 첫 번째 이야기를 남겨보세요!</p>
          </div>
        )}
        
        {posts.map(post => (
          <div key={post.id} className="bg-surface-container-lowest p-5 squircle shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center font-bold text-sm">
                  {post.author_name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface flex items-center gap-1">
                    {post.author_name} {post.author_uid === forest?.leader_uid ? '👑' : ''}
                  </p>
                  <p className="text-[11px] text-on-surface-variant">
                    {post.date?.toDate ? post.date.toDate().toLocaleString() : 
                     (post.date?.seconds ? new Date(post.date.seconds * 1000).toLocaleString() : String(post.date || ''))}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm text-on-surface whitespace-pre-line leading-relaxed font-body">{post.content}</p>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-surface-container-lowest/90 backdrop-blur-lg border-t border-surface-container p-3 pb-safe z-50 flex items-end gap-2">
        <textarea
          placeholder="우리 숲 멤버들과 이야기를 나누세요."
          value={newPost}
          onChange={e => setNewPost(e.target.value)}
          className="flex-1 bg-surface-container-low rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none max-h-24 font-body"
          rows={1}
        />
        <button onClick={handleSend} className="bg-primary text-on-primary p-3 rounded-full hover:bg-primary-dim flex-shrink-0 transition mb-0.5">
          <Send size={18} className="-ml-0.5 mt-0.5" />
        </button>
      </div>
    </div>
  );
};

const AdminDashboardView = ({ onBack, onNavigateToUsers, onNavigateToBoards, onNavigateToSurveys, onNavigateToFinance, onShowToast }: any) => {
  const adminMenus = [
    { id: 'users', label: '회원 권한 관리', icon: <Users size={24} />, onClick: onNavigateToUsers, desc: '사용자별 메뉴 접근 권한을 설정합니다.' },
    { id: 'boards', label: '게시판 관리', icon: <MessageSquare size={24} />, onClick: onNavigateToBoards, desc: '숲별 게시판의 게시글을 관리합니다.' },
    { id: 'surveys', label: '설문조사 관리', icon: <ClipboardList size={24} />, onClick: onNavigateToSurveys, desc: '진행 중인 설문조사를 관리합니다.' },
    { id: 'finance', label: '회비/재정 관리', icon: <Wallet size={24} />, onClick: onNavigateToFinance, desc: '공동체 재정 및 회비 납부 현황을 관리합니다.' },
  ];

  return (
    <div className="absolute inset-0 bg-surface z-[60] flex flex-col min-h-screen overflow-y-auto pb-24">
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface-container-highest">
        <div className="flex items-center px-2 py-3">
          <button onClick={onBack} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-bold tracking-tight text-on-surface ml-2">관리자 대시보드</h1>
        </div>
      </header>
      
      <div className="p-6 space-y-6">
        <div className="bg-primary-container/30 p-6 rounded-3xl border border-primary-container/50">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-primary text-on-primary p-2 rounded-xl">
              <Settings size={20} />
            </div>
            <h2 className="text-xl font-headline font-extrabold text-on-surface">Admin Dashboard</h2>
          </div>
          <p className="text-sm text-on-surface-variant">공동체 운영에 필요한 모든 도구가 여기에 있습니다.</p>
        </div>

        <div className="grid gap-4">
          {adminMenus.map(menu => (
            <button 
              key={menu.id}
              onClick={menu.onClick}
              className="flex items-center gap-4 p-5 bg-surface-container-lowest rounded-3xl border border-surface-container-low shadow-sm hover:border-primary transition-all text-left group active:scale-95"
            >
              <div className="bg-surface-container-high text-primary p-3 rounded-2xl group-hover:bg-primary group-hover:text-on-primary transition-colors">
                {menu.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-on-surface">{menu.label}</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">{menu.desc}</p>
              </div>
              <ChevronRight size={20} className="text-outline group-hover:text-primary" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const AdminBoardManagementView = ({ forestPosts, onBack, onShowToast }: any) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDeletePost = async (postId: string) => {
    try {
      await updateDoc(doc(firestoreDb, 'forest_posts', postId), { deleted: true });
      onShowToast('게시글이 삭제되었습니다.');
      setConfirmDeleteId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `forest_posts/${postId}`);
    }
  };

  // Filter out deleted posts if any (though we might want to see them as admin)
  const activePosts = forestPosts.filter((p: any) => !p.deleted);

  return (
    <div className="absolute inset-0 bg-surface z-[60] flex flex-col min-h-screen overflow-y-auto pb-24">
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface-container-highest">
        <div className="flex items-center px-2 py-3">
          <button onClick={onBack} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-bold tracking-tight text-on-surface ml-2">게시판 관리</h1>
        </div>
      </header>

      <div className="p-6 space-y-4">
        {activePosts.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare size={48} className="mx-auto text-outline mb-4 opacity-20" />
            <p className="text-on-surface-variant">관리할 게시글이 없습니다.</p>
          </div>
        ) : (
          activePosts.map((post: any) => (
            <div key={post.id} className="bg-surface-container-lowest p-5 rounded-3xl border border-surface-container-low shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-surface-container-high rounded-full flex items-center justify-center text-xs font-bold">
                    {post.author_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">{post.author_name}</p>
                    <p className="text-[10px] text-on-surface-variant">
                      {post.date?.toDate ? post.date.toDate().toLocaleString() : 
                       (post.date?.seconds ? new Date(post.date.seconds * 1000).toLocaleString() : String(post.date || ''))}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setConfirmDeleteId(post.id)}
                  className="p-2 text-error hover:bg-error/10 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="text-sm text-on-surface leading-relaxed line-clamp-3">{post.content}</p>
              <div className="pt-2 flex items-center gap-2">
                <span className="text-[10px] bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full font-bold">
                  Forest ID: {post.forest_id}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Custom Confirmation Dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="bg-surface p-6 rounded-[2.5rem] shadow-2xl max-w-xs w-full text-center space-y-6">
            <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto">
              <XCircle size={32} />
            </div>
            <div>
              <h3 className="text-xl font-headline font-extrabold text-on-surface">게시글 삭제</h3>
              <p className="text-sm text-on-surface-variant mt-2">정말로 이 게시글을 삭제하시겠습니까?<br/>삭제된 글은 복구할 수 없습니다.</p>
            </div>
            <div className="flex flex-col gap-2">
              <button 
                onClick={() => handleDeletePost(confirmDeleteId)}
                className="w-full py-4 bg-error text-white rounded-2xl font-bold active:scale-95 transition-transform"
              >
                삭제하기
              </button>
              <button 
                onClick={() => setConfirmDeleteId(null)}
                className="w-full py-4 bg-surface-container-high text-on-surface rounded-2xl font-bold active:scale-95 transition-transform"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminSurveyManagementView = ({ surveys, onBack, onShowToast }: any) => {
  const handleDeleteSurvey = async (surveyId: string) => {
    try {
      await deleteDoc(doc(firestoreDb, 'surveys', surveyId));
      onShowToast('설문이 삭제되었습니다.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `surveys/${surveyId}`);
    }
  };

  const handleToggleStatus = async (surveyId: string, currentStatus: string) => {
    try {
      await updateDoc(doc(firestoreDb, 'surveys', surveyId), {
        status: currentStatus === 'active' ? 'closed' : 'active'
      });
      onShowToast(`설문이 ${currentStatus === 'active' ? '마감' : '시작'}되었습니다.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `surveys/${surveyId}`);
    }
  };

  return (
    <div className="absolute inset-0 bg-surface z-[60] flex flex-col min-h-screen overflow-y-auto pb-24">
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface-container-highest">
        <div className="flex items-center px-2 py-3">
          <button onClick={onBack} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-bold tracking-tight text-on-surface ml-2">설문조사 관리</h1>
        </div>
      </header>

      <div className="p-6 space-y-4">
        {surveys.length === 0 ? (
          <div className="text-center py-20">
            <ClipboardList size={48} className="mx-auto text-outline mb-4 opacity-20" />
            <p className="text-on-surface-variant">관리할 설문이 없습니다.</p>
          </div>
        ) : (
          surveys.map((survey: any) => (
            <div key={survey.id} className="bg-surface-container-lowest p-5 rounded-3xl border border-surface-container-low shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-bold text-on-surface">{survey.title}</h3>
                  <p className="text-xs text-on-surface-variant mt-1">{survey.description}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    onClick={() => handleToggleStatus(survey.id, survey.status)}
                    className={`p-2 rounded-full transition-colors ${survey.status === 'active' ? 'text-primary hover:bg-primary/10' : 'text-outline hover:bg-surface-container'}`}
                    title={survey.status === 'active' ? '마감하기' : '시작하기'}
                  >
                    {survey.status === 'active' ? <CheckCircle2 size={18} /> : <Play size={18} />}
                  </button>
                  <button 
                    onClick={() => handleDeleteSurvey(survey.id)}
                    className="p-2 text-error hover:bg-error/10 rounded-full transition-colors"
                    title="삭제하기"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              
              <div className="pt-2 border-t border-surface-container flex items-center justify-between text-[10px] font-bold">
                <span className={`px-2 py-0.5 rounded-full ${survey.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                  {survey.status === 'active' ? '진행중' : '마감됨'}
                </span>
                <span className="text-on-surface-variant">
                  참여 인원: {Object.keys(survey.responses || {}).length}명
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const AdminFinanceManagementView = ({ users, fees, onBack, onShowToast }: any) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const handleToggleFeeStatus = async (user: any) => {
    const existingFee = fees.find((f: any) => f.uid === user.uid && f.year === selectedYear && f.month === selectedMonth);
    
    try {
      if (existingFee) {
        await updateDoc(doc(firestoreDb, 'fees', existingFee.id), {
          status: existingFee.status === 'paid' ? 'unpaid' : 'paid',
          paid_at: existingFee.status === 'paid' ? null : Timestamp.now()
        });
      } else {
        await addDoc(collection(firestoreDb, 'fees'), {
          uid: user.uid,
          user_name: user.name,
          year: selectedYear,
          month: selectedMonth,
          amount: 10000, // Default fee amount
          status: 'paid',
          paid_at: Timestamp.now()
        });
      }
      onShowToast(`${user.name}님의 회비 상태가 업데이트되었습니다.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'fees');
    }
  };

  return (
    <div className="absolute inset-0 bg-surface z-[60] flex flex-col min-h-screen overflow-y-auto pb-24">
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface-container-highest">
        <div className="flex items-center px-2 py-3">
          <button onClick={onBack} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-bold tracking-tight text-on-surface ml-2">회비 관리</h1>
        </div>
      </header>

      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4 bg-surface-container-lowest p-4 rounded-2xl border border-surface-container-low shadow-sm">
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-outline uppercase mb-1">연도</label>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full bg-transparent font-bold text-on-surface outline-none"
            >
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}년</option>)}
            </select>
          </div>
          <div className="w-px h-8 bg-surface-container-high"></div>
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-outline uppercase mb-1">월</label>
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full bg-transparent font-bold text-on-surface outline-none"
            >
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{m}월</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-bold text-on-surface px-2">회원별 납부 현황</h3>
          {users.map((u: any) => {
            const fee = fees.find((f: any) => f.uid === u.uid && f.year === selectedYear && f.month === selectedMonth);
            const isPaid = fee?.status === 'paid';
            
            return (
              <div key={u.uid} className="bg-surface-container-lowest p-4 rounded-2xl flex items-center justify-between border border-surface-container-low shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-surface-container-high rounded-full flex items-center justify-center text-sm font-bold overflow-hidden">
                    {u.profile_image ? <img src={u.profile_image} alt={u.name} className="w-full h-full object-cover" /> : u.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-on-surface text-sm">{u.name}</p>
                    <p className="text-[10px] text-on-surface-variant">{u.forest_id || '소속 없음'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleToggleFeeStatus(u)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isPaid 
                      ? 'bg-emerald-500 text-white shadow-sm' 
                      : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                  }`}
                >
                  {isPaid ? '납부완료' : '미납'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MembersView;
