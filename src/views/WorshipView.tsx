import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Menu, Bell, User, Flame, QrCode, Users, ClipboardList, Wallet, FileText,
  MapPin, ChevronRight, ChevronLeft, Home, LayoutGrid, BookOpen, Calendar, Baby,
  MessageCircle, ArrowLeft, CheckCircle2, XCircle, FileEdit, X, Search, Phone, Lock, UserCircle, Settings, Award, Clock, Heart, MessageSquare, Send, LogOut, Sparkles, TreePine, HeartHandshake, GraduationCap, History, Plus, Play,
  SlidersHorizontal, Camera, Bookmark, MoreHorizontal, Music, Megaphone, Trash2, MoreVertical, PieChart, AlertTriangle, TrendingUp, Edit
} from 'lucide-react';
import { collection, doc, setDoc, addDoc, getDoc, onSnapshot, query, where, orderBy, getDocFromServer, Timestamp, updateDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db as firestoreDb, auth, storage } from '../firebase';
import { MenuButton, ScheduleItem, MemberRow, OperationType, handleFirestoreError } from '../App';
import { VISIT_CATEGORIES } from '../components/PastoralCardModal';

const WorshipView = ({ user, worships, onNavigateToDetail, onNavigateToAdd, onShowToast }: { user: any, worships: any[], onNavigateToDetail: (id: string, isEdit?: boolean) => void, onNavigateToAdd: () => void, onShowToast: (msg: string) => void }) => {
  const [activeOptionsId, setActiveOptionsId] = useState<string | null>(null);
  const sortedWorships = [...worships].sort((a, b) => {
    const dateA = a.date?.seconds ? a.date.seconds : new Date(a.date).getTime() / 1000;
    const dateB = b.date?.seconds ? b.date.seconds : new Date(b.date).getTime() / 1000;
    return dateB - dateA;
  });

  const featuredWorship = sortedWorships[0];
  const previousWorships = sortedWorships.slice(1);

  const canEdit = user?.role === 'admin' || user?.role === 'leader';

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`'${title}' 예배 정보를 삭제하시겠습니까?\n삭제 후 복구할 수 없습니다.`)) return;
    try {
      await deleteDoc(doc(firestoreDb, 'worships', id));
      onShowToast('예배 정보가 삭제되었습니다.');
      setActiveOptionsId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'worships');
    }
  };

  const formatDate = (date: any) => {
    if (!date) return '';
    const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  };

  return (
    <div className="flex flex-col h-full bg-surface-container-lowest pb-32" onClick={() => setActiveOptionsId(null)}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-surface/80 backdrop-blur-md sticky top-0 z-40">
        <h1 className="text-2xl font-bold text-on-surface tracking-tight">예배</h1>
        <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
          <MoreVertical size={24} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-5 space-y-6 pt-2">
        {/* Featured Worship Card */}
        {featuredWorship && (
          <article 
            onClick={() => onNavigateToDetail(featuredWorship.id)}
            className="relative h-[420px] rounded-[32px] overflow-hidden shadow-xl shadow-primary/10 group cursor-pointer"
          >
            <img 
              src={featuredWorship.image || "https://picsum.photos/seed/worship/800/1200"} 
              alt={featuredWorship.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            
            <div className="absolute top-6 right-6">
              {canEdit && (
                <div className="relative">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setActiveOptionsId(activeOptionsId === featuredWorship.id ? null : featuredWorship.id); }}
                    className="w-10 h-10 bg-black/30 backdrop-blur-md text-white rounded-full flex items-center justify-center hover:bg-black/50 transition-colors"
                  >
                    <MoreVertical size={24} />
                  </button>
                  {activeOptionsId === featuredWorship.id && (
                    <div className="absolute right-0 top-12 w-32 bg-surface rounded-2xl shadow-xl border border-surface-container-highest overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onNavigateToDetail(featuredWorship.id, true); setActiveOptionsId(null); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-on-surface hover:bg-surface-container-lowest transition-colors"
                      >
                        <Edit size={16} /> 수정하기
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(featuredWorship.id, featuredWorship.title); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-error hover:bg-error-container/30 transition-colors border-t border-surface-container-highest"
                      >
                        <Trash2 size={16} /> 삭제하기
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="absolute bottom-10 left-8 right-8 space-y-3">
              <span className="inline-block bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/20">
                {formatDate(featuredWorship.date)} 예배
              </span>
              <h2 className="text-3xl font-bold text-white leading-tight">
                {featuredWorship.title}
              </h2>
              <div className="space-y-1">
                <p className="text-white/90 font-bold text-sm">{featuredWorship.scripture}</p>
                <p className="text-white/70 text-xs line-clamp-2 leading-relaxed">
                  {featuredWorship.scripture_content}
                </p>
              </div>
            </div>
          </article>
        )}



        {/* Previous Worship List */}
        <div className="space-y-4 pb-10">
          {previousWorships.map(worship => (
            <div 
              key={worship.id}
              onClick={() => onNavigateToDetail(worship.id)}
              className="bg-white rounded-3xl p-4 flex items-center gap-4 border border-surface-container-highest shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 bg-surface-container-low">
                <img 
                  src={worship.image || "https://picsum.photos/seed/church/200/200"} 
                  alt={worship.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-on-surface-variant mb-0.5">{formatDate(worship.date)}</p>
                <h3 className="text-base font-bold text-on-surface truncate">{worship.title}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-on-surface-variant font-medium">
                  <div className="flex items-center gap-1">
                    <User size={12} />
                    <span>{worship.view_count || 0}</span>
                  </div>
                  <span>•</span>
                  <span>{worship.scripture}</span>
                </div>
              </div>
              
              {canEdit && (
                <div className="relative">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setActiveOptionsId(activeOptionsId === worship.id ? null : worship.id); }}
                    className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors"
                  >
                    <MoreVertical size={20} />
                  </button>
                  {activeOptionsId === worship.id && (
                    <div className="absolute right-0 top-10 w-32 bg-surface rounded-2xl shadow-xl border border-surface-container-highest overflow-hidden z-[55] animate-in fade-in zoom-in-95 duration-200">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onNavigateToDetail(worship.id, true); setActiveOptionsId(null); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-on-surface hover:bg-surface-container-lowest transition-colors"
                      >
                        <Edit size={16} /> 수정하기
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(worship.id, worship.title); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-error hover:bg-error-container/30 transition-colors border-t border-surface-container-highest"
                      >
                        <Trash2 size={16} /> 삭제하기
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Floating Action Button for Admins */}
      {user?.role === 'admin' && (
        <button 
          onClick={onNavigateToAdd}
          className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg shadow-primary/30 flex items-center justify-center active:scale-90 transition-transform z-50"
        >
          <Plus size={28} />
        </button>
      )}
    </div>
  );
};

export default WorshipView;
