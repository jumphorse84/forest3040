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

const ProgramView = ({ user, programs, onNavigateToDetail, onNavigateToAdd, onShowToast }: { user: any, programs: any[], onNavigateToDetail: (id: string) => void, onNavigateToAdd: () => void, onShowToast: (msg: string) => void }) => {
  const [activeTab, setActiveTab] = useState('전체');
  const categories = ['전체', '사역', '교육/훈련', '봉사', '선교', '동아리'];

  const filteredPrograms = activeTab === '전체' 
    ? programs 
    : programs.filter(p => p.type === activeTab || p.category === activeTab);

  return (
    <div className="flex flex-col h-full relative">
      {/* Category Tabs */}
      <div className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-surface-container-highest flex overflow-x-auto px-4 py-3 gap-2 no-scrollbar">
        {categories.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === tab 
                ? 'bg-primary text-on-primary shadow-sm shadow-primary/20 scale-105' 
                : 'font-medium text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Program List */}
        <div className="p-5 space-y-6">
          
          {filteredPrograms.length === 0 && (
            <div className="text-center py-10 text-on-surface-variant text-sm">
              해당 카테고리의 프로그램이 없습니다.
            </div>
          )}

          {filteredPrograms.map(program => (
            <article key={program.id} className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-sm border border-surface-container-low group cursor-pointer hover:shadow-md transition-all duration-300">
              <div className="relative h-48 overflow-hidden bg-surface-container-low">
                <img src={program.image} alt={program.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm ${
                    program.status === '모집중' ? 'bg-primary text-on-primary' : 
                    program.status === '마감임박' ? 'bg-error text-on-error' : 
                    'bg-secondary text-on-secondary'
                  }`}>{program.status}</span>
                  {program.dDay && (
                    <span className="bg-surface/90 backdrop-blur-sm text-on-surface text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">{program.dDay}</span>
                  )}
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); onShowToast('관심 프로그램으로 등록되었습니다.'); }}
                  className="absolute top-4 right-4 w-8 h-8 bg-surface/90 backdrop-blur-sm rounded-full flex items-center justify-center text-on-surface-variant hover:text-error transition-colors shadow-sm"
                >
                  <Heart size={18} />
                </button>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-tertiary">{program.type || program.category}</span>
                  <span className="w-1 h-1 rounded-full bg-surface-container-highest"></span>
                  <span className="text-xs font-medium text-on-surface-variant">{program.host}</span>
                </div>
                <h3 className="text-lg font-bold text-on-surface mb-2 tracking-tight group-hover:text-primary transition-colors">{program.title}</h3>
                
                <div className="space-y-1.5 mb-5">
                  <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <Calendar size={16} className="text-outline" />
                    <span>{program.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <MapPin size={16} className="text-outline" />
                    <span>{program.location}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button onClick={() => onNavigateToDetail(program.id)} className="flex-1 bg-surface-container-low text-on-surface py-2.5 rounded-xl text-sm font-bold hover:bg-surface-container transition-colors">상세보기</button>
                  <button onClick={(e) => { e.stopPropagation(); onShowToast('신청 페이지로 이동합니다.'); }} className="flex-1 bg-primary text-on-primary py-2.5 rounded-xl text-sm font-bold hover:bg-primary-dim transition-colors shadow-sm shadow-primary/20">신청하기</button>
                </div>
              </div>
            </article>
          ))}

        </div>

        {/* Recommendation Section */}
        <div className="mt-4 mb-8 px-5">
          <div className="bg-secondary-container/50 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-secondary/20 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="text-secondary" size={20} />
                <span className="text-xs font-bold text-secondary uppercase tracking-wider">Pick for you</span>
              </div>
              <h3 className="text-lg font-bold text-on-surface mb-1">나에게 맞는 프로그램을 찾아보세요!</h3>
              <p className="text-sm text-on-surface-variant mb-4">관심사를 설정하면 맞춤 프로그램을 추천해 드립니다.</p>
              
              <div className="flex flex-wrap gap-2">
                <span className="bg-surface text-on-surface text-xs font-medium px-3 py-1.5 rounded-lg border border-surface-container-highest shadow-sm">#찬양</span>
                <span className="bg-surface text-on-surface text-xs font-medium px-3 py-1.5 rounded-lg border border-surface-container-highest shadow-sm">#미디어</span>
                <span className="bg-surface text-on-surface text-xs font-medium px-3 py-1.5 rounded-lg border border-surface-container-highest shadow-sm">#어린이</span>
                <button className="bg-surface-container-high text-on-surface text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-surface-container-highest transition-colors">+</button>
              </div>
            </div>
          </div>
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

export default ProgramView;
