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
import { FOREST_GROUPS, VISIT_CATEGORIES, MenuButton, ScheduleItem, MemberRow, OperationType, handleFirestoreError } from '../App';

const AdminUserManagementView = ({ users, onBack, onShowToast }: any) => {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editProfile, setEditProfile] = useState<any>(null);

  const handleSelectUser = (u: any) => {
    setSelectedUser(u);
    setEditProfile({
      name: u.name || '',
      birthdate: u.birthdate || '',
      gender: u.gender || '',
      forest_id: u.forest_id || '',
      ministry: u.ministry || '',
      role: u.role || 'member',
      score: u.score || 0
    });
  };

  const handleSaveProfile = async () => {
    if (!selectedUser) return;
    try {
      const userRef = doc(firestoreDb, 'users', selectedUser.uid);
      await updateDoc(userRef, {
        name: editProfile.name,
        birthdate: editProfile.birthdate,
        gender: editProfile.gender,
        forest_id: editProfile.forest_id,
        ministry: editProfile.ministry,
        role: editProfile.role,
        score: Number(editProfile.score) || 0
      });
      onShowToast('프로필 정보가 수정되었습니다.');
      setSelectedUser({ ...selectedUser, ...editProfile, score: Number(editProfile.score) || 0 });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${selectedUser.uid}`);
    }
  };

  const handlePermissionToggle = async (userId: string, menu: string, currentValue: boolean) => {
    try {
      const userRef = doc(firestoreDb, 'users', userId);
      await updateDoc(userRef, {
        [`permissions.${menu}`]: !currentValue
      });
      onShowToast('권한이 변경되었습니다.');
      setSelectedUser({
        ...selectedUser,
        permissions: {
          ...selectedUser.permissions,
          [menu]: !currentValue
        }
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  if (selectedUser) {
    const permissions = selectedUser.permissions || {};
    const menuItems = [
      { id: 'survey', label: '설문조사 관리' },
      { id: 'finance', label: '회비 관리' },
      { id: 'schedule', label: '일정 관리' },
      { id: 'forest', label: '숲 관리' },
      { id: 'attendance', label: '출석 관리' },
    ];

    return (
      <div className="absolute inset-0 bg-surface z-[70] flex flex-col min-h-screen overflow-y-auto pb-24">
        <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface-container-highest">
          <div className="flex items-center px-2 py-3">
            <button onClick={() => setSelectedUser(null)} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-lg font-bold tracking-tight text-on-surface ml-2">회원 관리: {selectedUser.name}</h1>
          </div>
        </header>
        <div className="p-6 space-y-6">
          
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-low shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-outline uppercase tracking-widest mb-4">프로필 수정</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-on-surface-variant mb-1 block">이름</label>
                <input type="text" value={editProfile.name} onChange={e => setEditProfile({...editProfile, name: e.target.value})} className="w-full bg-surface-container p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-on-surface-variant mb-1 block">생년월일</label>
                  <input type="date" value={editProfile.birthdate} onChange={e => setEditProfile({...editProfile, birthdate: e.target.value})} className="w-full bg-surface-container p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant mb-1 block">성별</label>
                  <select value={editProfile.gender} onChange={e => setEditProfile({...editProfile, gender: e.target.value})} className="w-full bg-surface-container p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary">
                    <option value="">선택 안함</option>
                    <option value="male">남성</option>
                    <option value="female">여성</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-on-surface-variant mb-1 block">소속 사역팀</label>
                  <select value={editProfile.ministry || ''} onChange={e => setEditProfile({...editProfile, ministry: e.target.value})} className="w-full bg-surface-container p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary">
                    <option value="">사역팀 없음</option>
                    <option value="예배팀">예배팀</option>
                    <option value="새가족팀">새가족팀</option>
                    <option value="기획팀">기획팀</option>
                    <option value="선교봉사팀">선교봉사팀</option>
                    <option value="관리팀">관리팀</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="text-xs font-bold text-on-surface-variant mb-1 block">소속 숲</label>
                  <select value={editProfile.forest_id} onChange={e => setEditProfile({...editProfile, forest_id: e.target.value})} className="w-full bg-surface-container p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary">
                    <option value="">소속 없음</option>
                    {FOREST_GROUPS.map((f: any) => (
                      <option key={f.forest_id} value={f.forest_id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant mb-1 block">등급 (Role)</label>
                  <select value={editProfile.role} onChange={e => setEditProfile({...editProfile, role: e.target.value})} className="w-full bg-surface-container p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary">
                    <option value="member">일반 (member)</option>
                    <option value="leader">리더 (leader)</option>
                    <option value="pastor">목사님 (pastor)</option>
                    <option value="admin">관리자 (admin)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant mb-1 block">미션 점수</label>
                <input type="number" value={editProfile.score} onChange={e => setEditProfile({...editProfile, score: e.target.value})} className="w-full bg-surface-container p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <button onClick={handleSaveProfile} className="w-full mt-2 py-3 bg-primary text-on-primary rounded-xl font-bold shadow-sm active:scale-95 transition-all">
                프로필 정보 저장
              </button>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-low shadow-sm">
            <h3 className="text-sm font-bold text-outline uppercase tracking-widest mb-4">메뉴별 권한 설정</h3>
            <div className="space-y-4">
              {menuItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl">
                  <span className="font-bold text-on-surface">{item.label}</span>
                  <button 
                    onClick={() => handlePermissionToggle(selectedUser.uid, item.id, permissions[item.id])}
                    className={`w-12 h-6 rounded-full transition-colors relative ${permissions[item.id] ? 'bg-primary' : 'bg-surface-container-high'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${permissions[item.id] ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-on-surface-variant text-center px-4">
            권한을 부여받은 사용자는 해당 메뉴의 생성, 수정, 삭제 권한을 갖게 됩니다.<br/>관리자(admin)는 이미 모든 권한을 가지고 있습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-surface z-[60] flex flex-col min-h-screen overflow-y-auto pb-24">
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface-container-highest">
        <div className="flex items-center px-2 py-3">
          <button onClick={onBack} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-bold tracking-tight text-on-surface ml-2">사용자 계정 관리</h1>
        </div>
      </header>
      <div className="p-6 space-y-4">
        {users.map((u: any) => (
          <div 
            key={u.uid} 
            onClick={() => handleSelectUser(u)}
            className="bg-surface-container-lowest p-4 rounded-2xl border border-surface-container-low shadow-sm flex items-center justify-between hover:border-primary transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center font-bold">
                {u.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-on-surface">{u.name}</p>
                <p className="text-xs text-on-surface-variant">{u.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${u.role === 'admin' ? 'bg-error-container text-on-error-container' : u.role === 'leader' ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container text-on-surface-variant'}`}>
                {u.role || 'member'}
              </span>
              <ChevronRight size={20} className="text-outline" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminUserManagementView;
