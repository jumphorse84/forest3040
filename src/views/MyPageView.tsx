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

const MyPageView = ({ user, forests, attendance, onBack, onShowToast, onLogout, onNavigateToAdmin }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editPhone, setEditPhone] = useState(user.phone || '');
  const [editBio, setEditBio] = useState(user.bio || '');

  const forestName = forests?.find((f: any) => f.forest_id === user.forest_id)?.name || '소속 없음';
  
  const userActivities = attendance
    .filter((a: any) => a.uid === user.uid)
    .sort((a: any, b: any) => b.date?.seconds - a.date?.seconds)
    .slice(0, 3);

  const handleSaveProfile = async () => {
    try {
      const userRef = doc(firestoreDb, 'users', user.uid);
      await updateDoc(userRef, {
        phone: editPhone,
        bio: editBio
      });
      onShowToast('프로필이 수정되었습니다.');
      setIsEditing(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  return (
    <div className="absolute inset-0 bg-surface z-[60] flex flex-col min-h-screen overflow-y-auto pb-40">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl shadow-sm dark:shadow-none">
        <div className="flex justify-between items-center px-6 py-4 w-full max-w-md mx-auto">
          <button onClick={onBack} className="text-stone-500 hover:opacity-80 transition">
            <Menu size={24} />
          </button>
          <h1 className="font-headline font-bold tracking-tight text-xl text-emerald-700 dark:text-emerald-400">마이페이지</h1>
          <button className="text-stone-500 hover:opacity-80 transition">
            <Bell size={24} />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 pt-24 space-y-8 w-full">
        {/* User Profile Header */}
        <section className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg border-4 border-white bg-primary-container flex items-center justify-center text-3xl font-bold text-on-primary-container">
              {user.photoURL || user.profile_image ? (
                <img alt="사용자 프로필" className="w-full h-full object-cover" src={user.photoURL || user.profile_image} referrerPolicy="no-referrer" />
              ) : (
                <span>{user.name.charAt(0)}</span>
              )}
            </div>
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`absolute bottom-0 right-0 p-2 rounded-full text-on-primary shadow-md border-2 border-white flex items-center justify-center transition-colors ${isEditing ? 'bg-emerald-600' : 'bg-primary'}`}
            >
              <FileEdit size={14} />
            </button>
          </div>
          <div className="flex-1">
            <p className="text-primary font-headline font-extrabold text-2xl tracking-tight">{user.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-primary-container text-on-primary-container px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">{forestName}</span>
            </div>
            {isEditing ? (
              <input 
                value={editBio}
                onChange={e => setEditBio(e.target.value)}
                placeholder="자기소개를 입력하세요."
                className="w-full mt-2 text-sm bg-surface-container-low border-b border-primary focus:outline-none py-1"
              />
            ) : (
              <p className="text-on-surface-variant text-sm mt-1 font-medium italic">
                {user.bio || "함께 믿음으로 성장합니다."}
              </p>
            )}
          </div>
        </section>

        {/* Edit Mode Fields */}
        {isEditing && (
          <section className="bg-surface-container-lowest p-6 rounded-[2.5rem] shadow-sm space-y-4 border border-primary/10">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-outline uppercase tracking-widest px-1">연락처</label>
              <input 
                type="tel"
                value={editPhone}
                onChange={e => setEditPhone(e.target.value)}
                placeholder="010-0000-0000"
                className="w-full p-4 bg-surface-container-low rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <button 
              onClick={handleSaveProfile}
              className="w-full py-4 bg-primary text-on-primary rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
            >
              저장하기
            </button>
          </section>
        )}

        {/* Stats Widget */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container-lowest p-6 rounded-2xl flex flex-col items-center text-center shadow-[0px_20px_40px_rgba(46,47,45,0.06)]">
            <div className="bg-secondary-container p-3 rounded-full mb-3">
              <Award className="text-on-secondary-container" size={24} />
            </div>
            <p className="text-xs font-bold text-outline uppercase tracking-widest mb-1">나의 배지</p>
            <p className="text-2xl font-headline font-extrabold text-on-surface">{user.badges?.length || 0}</p>
          </div>
          <div className="bg-surface-container-lowest p-6 rounded-2xl flex flex-col items-center text-center shadow-[0px_20px_40px_rgba(46,47,45,0.06)]">
            <div className="bg-primary-container p-3 rounded-full mb-3">
              <CheckCircle2 className="text-on-primary-container" size={24} />
            </div>
            <p className="text-xs font-bold text-outline uppercase tracking-widest mb-1">올해 출석률</p>
            <p className="text-2xl font-headline font-extrabold text-on-surface">{user.attendance_rate || 0}%</p>
          </div>
        </section>

        {/* Activity Timeline */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-headline font-extrabold tracking-tight">나의 활동 기록</h2>
            <span onClick={() => onShowToast('활동 기록 전체보기로 이동합니다.')} className="text-primary text-sm font-bold cursor-pointer">모두 보기</span>
          </div>
          <div className="relative space-y-8 before:content-[''] before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-surface-container-high">
            {userActivities.length > 0 ? (
              userActivities.map((activity: any, idx: number) => (
                <div key={activity.id || idx} className="relative pl-10">
                  <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-surface ${
                    activity.type === '주일예배' ? 'bg-primary' : 
                    activity.type === '프로그램신청' ? 'bg-secondary' : 'bg-tertiary'
                  }`}>
                    {activity.type === '주일예배' && <Calendar className="text-white" size={14} />}
                    {activity.type === '프로그램신청' && <Heart className="text-white" size={14} />}
                    {activity.type !== '주일예배' && activity.type !== '프로그램신청' && <BookOpen className="text-white" size={14} />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-outline uppercase tracking-widest mb-1">
                      {activity.date?.toDate ? activity.date.toDate().toLocaleString() : 
                       (activity.date?.seconds ? new Date(activity.date.seconds * 1000).toLocaleString() : '날짜 정보 없음')}
                    </p>
                    <h4 className="font-bold text-on-surface">{activity.type}</h4>
                    <p className="text-on-surface-variant text-sm mt-1">
                      {activity.program_title || activity.status || '활동 완료'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-on-surface-variant text-sm">
                활동 기록이 없습니다.
              </div>
            )}
          </div>
        </section>

        {/* Settings & Actions */}
        <section className="space-y-3 pt-4">
          {(user.role === 'admin' || user.email === 'jumphorse@nate.com' || user.email === 'seokgwan.ms01@gmail.com' || user.uid === 'sfViap2UZ2alO1kzinMETlcLCxv1') && (
            <button onClick={onNavigateToAdmin} className="w-full flex items-center justify-between p-5 bg-primary/5 border border-primary/20 rounded-2xl hover:bg-primary/10 transition-colors">
              <div className="flex items-center gap-4">
                <Lock className="text-primary" size={24} />
                <span className="font-bold text-primary">관리자 권한 설정</span>
              </div>
              <ChevronRight className="text-primary" size={24} />
            </button>
          )}
          <button onClick={() => onShowToast('계정 설정 페이지로 이동합니다.')} className="w-full flex items-center justify-between p-5 bg-surface-container-low rounded-2xl hover:bg-surface-container-high transition-colors">
            <div className="flex items-center gap-4">
              <Settings className="text-on-surface-variant" size={24} />
              <span className="font-bold text-on-surface">계정 설정</span>
            </div>
            <ChevronRight className="text-outline" size={24} />
          </button>
          <button onClick={onLogout} className="w-full flex items-center justify-between p-5 bg-surface-container-low rounded-2xl hover:bg-error-container/10 transition-colors group">
            <div className="flex items-center gap-4">
              <LogOut className="text-error" size={24} />
              <span className="font-bold text-error">로그아웃</span>
            </div>
          </button>
        </section>
      </main>
    </div>
  );
};

export default MyPageView;
