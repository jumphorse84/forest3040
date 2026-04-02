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

const CalendarView = ({ user, schedules, onShowToast }: any) => {
    const [today] = useState(new Date());
  const [currentDate, setCurrentDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  
  const [isAdding, setIsAdding] = useState(false);
  const [newSchedule, setNewSchedule] = useState({ title: '', time: '', location: '', type: 'worship', d_day: 'D-?' });

  const [selectedScheduleForDetail, setSelectedScheduleForDetail] = useState<any>(null);
  const [isEditingDetail, setIsEditingDetail] = useState(false);
  const [editScheduleData, setEditScheduleData] = useState<any>(null);


  
  const handleUpdateSchedule = async () => {
    if (!editScheduleData.title || !editScheduleData.time || !editScheduleData.location) {
      onShowToast('모든 필드를 입력해주세요.');
      return;
    }
    try {
      const scheduleRef = doc(firestoreDb, 'schedules', selectedScheduleForDetail.id);
      
      await updateDoc(scheduleRef, {
        title: editScheduleData.title,
        time: editScheduleData.time,
        location: editScheduleData.location,
        type: editScheduleData.type
      });
      
      onShowToast('일정이 수정되었습니다.');
      setIsEditingDetail(false);
      setSelectedScheduleForDetail(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'schedules');
    }
  };

  const handleDeleteSchedule = async () => {
    if (window.confirm('정말 이 일정을 삭제하시겠습니까?')) {
      try {
        await deleteDoc(doc(firestoreDb, 'schedules', selectedScheduleForDetail.id));
        onShowToast('일정이 삭제되었습니다.');
        setSelectedScheduleForDetail(null);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, 'schedules');
      }
    }
  };

  const handleAddSchedule = async () => {
    if (!newSchedule.title || !newSchedule.time || !newSchedule.location) {
      onShowToast('모든 필드를 입력해주세요.');
      return;
    }
    try {
      const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
      await addDoc(collection(firestoreDb, 'schedules'), {
        ...newSchedule,
        fullDate: dateStr,
        createdAt: Timestamp.now()
      });
      onShowToast('일정이 추가되었습니다.');
      setIsAdding(false);
      setNewSchedule({ title: '', time: '', location: '', type: 'worship', d_day: 'D-?' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'schedules');
    }
  };


  const [selectedDate, setSelectedDate] = useState(new Date(today.getFullYear(), today.getMonth(), today.getDate()));

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));

  const isSameDate = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const getSchedulesForDate = (date: Date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return schedules.filter((s: any) => s.fullDate === dateStr);
  };

  const selectedSchedules = getSchedulesForDate(selectedDate);

  const calculateDDay = (targetDateStr: string) => {
    if (!targetDateStr) return '';
    const now = new Date();
    now.setHours(0,0,0,0);
    const target = new Date(targetDateStr);
    target.setHours(0,0,0,0);
    const diff = target.getTime() - now.getTime();
    const dDay = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (dDay === 0) return 'D-Day';
    if (dDay > 0) return `D-${dDay}`;
    return `D+${Math.abs(dDay)}`;
  };


  return (
    <div className="pb-32 bg-surface min-h-screen">
      <div className="p-5 space-y-6">
        {/* Calendar Card */}
        <div className="bg-surface-container-lowest rounded-3xl p-5 shadow-sm border border-surface-container-low">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={prevMonth} className="p-2 hover:bg-surface-container-low rounded-full transition-colors">
              <ChevronLeft size={20} className="text-on-surface-variant" />
            </button>
            <h2 className="text-lg font-bold text-on-surface font-headline">
              {year}년 {month + 1}월
            </h2>
            <button onClick={nextMonth} className="p-2 hover:bg-surface-container-low rounded-full transition-colors">
              <ChevronRight size={20} className="text-on-surface-variant" />
            </button>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 gap-1 mb-2 text-center">
            {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
              <div key={day} className={`text-xs font-bold ${i === 0 ? 'text-error' : 'text-on-surface-variant'}`}>
                {day}
              </div>
            ))}
          </div>

          {/* Dates Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, i) => {
              if (!date) return <div key={`empty-${i}`} className="h-10" />;
              
              const isSelected = isSameDate(date, selectedDate);
              const isToday = isSameDate(date, today);
              const hasEvents = getSchedulesForDate(date).length > 0;
              const isSunday = date.getDay() === 0;

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(date)}
                  className={`relative h-10 flex items-center justify-center rounded-full text-sm font-medium transition-colors
                    ${isSelected ? 'bg-primary text-on-primary font-bold shadow-md' : 'hover:bg-surface-container-low'}
                    ${!isSelected && isToday ? 'border border-primary text-primary font-bold' : ''}
                    ${!isSelected && !isToday && isSunday ? 'text-error' : ''}
                    ${!isSelected && !isToday && !isSunday ? 'text-on-surface' : ''}
                  `}
                >
                  {date.getDate()}
                  {hasEvents && !isSelected && (
                    <div className="absolute bottom-1 w-1 h-1 rounded-full bg-secondary"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Events */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-bold text-on-surface font-headline">
              {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 일정
            </h3>
          </div>

          {selectedSchedules.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl p-8 text-center border border-surface-container-low border-dashed">
              <p className="text-on-surface-variant text-sm font-medium">예정된 일정이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedSchedules.map((schedule: any) => (
                <div key={schedule.id} onClick={() => setSelectedScheduleForDetail(schedule)} className="bg-surface-container-lowest p-5 rounded-2xl flex items-start gap-4 shadow-sm border border-surface-container-low cursor-pointer hover:bg-surface-container-low transition-colors">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                    schedule.type === 'worship' ? 'bg-primary-container text-on-primary-container' :
                    schedule.type === 'education' ? 'bg-secondary-container text-on-secondary-container' :
                    'bg-tertiary-container text-on-tertiary-container'
                  }`}>
                    {schedule.type === 'worship' && <BookOpen size={20} />}
                    {schedule.type === 'education' && <GraduationCap size={20} />}
                    {schedule.type === 'volunteer' && <HeartHandshake size={20} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-primary-dim">{schedule.time}</span>
                      <span className="bg-surface-container-high text-on-surface-variant text-[10px] font-bold px-2 py-0.5 rounded-full">{schedule.d_day && schedule.d_day !== 'D-?' ? schedule.d_day : calculateDDay(schedule.fullDate)}</span>
                    </div>
                    <h4 className="font-bold text-on-surface mb-1">{schedule.title}</h4>
                    <p className="text-xs text-on-surface-variant flex items-center gap-1">
                      <MapPin size={12} /> {schedule.location}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Add Action */}
      {(user?.role === 'admin' || user?.role === 'leader' || user?.email === 'jumphorse@nate.com' || user?.email === 'seokgwan.ms01@gmail.com') && (
        <button 
          onClick={() => setIsAdding(true)}
          className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg shadow-primary/30 flex items-center justify-center active:scale-90 transition-transform z-50"
        >
          <Plus size={28} />
        </button>
      )}

      {isAdding && (
        <div className="fixed inset-0 bg-surface z-[100] flex flex-col">
          <header className="flex items-center justify-between p-4 border-b border-surface-container-highest bg-surface/80 backdrop-blur-md">
            <button onClick={() => setIsAdding(false)} className="p-2 text-on-surface-variant">
              <X size={24} />
            </button>
            <h2 className="text-lg font-bold font-headline">일정 추가</h2>
            <button onClick={handleAddSchedule} className="px-4 py-2 bg-primary text-on-primary rounded-xl font-bold text-sm shadow-sm">
              저장
            </button>
          </header>
          <div className="p-5 space-y-4 flex-1 overflow-y-auto">
            <div className="p-4 bg-primary/10 rounded-xl text-center border border-primary/20">
              <span className="font-bold text-primary">{selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일</span>
              <p className="text-xs text-primary-dim mt-1">해당 날짜에 새 일정을 추가합니다.</p>
            </div>
            
            <div className="space-y-3">
              <label className="block text-xs font-bold text-outline tracking-wider">일정 분류</label>
              <select
                value={newSchedule.type} onChange={(e) => setNewSchedule({...newSchedule, type: e.target.value})}
                className="w-full p-4 bg-surface-container-lowest border border-surface-container-low rounded-2xl font-bold outline-none"
              >
                <option value="worship">예배 / 모임</option>
                <option value="education">훈련 / 교육</option>
                <option value="volunteer">봉사 / 행사</option>
              </select>
            </div>
            
            <div className="space-y-3">
              <label className="block text-xs font-bold text-outline tracking-wider">일정 제목</label>
              <input 
                type="text" placeholder="(필수) 예: 금요영성집회" 
                value={newSchedule.title} onChange={(e) => setNewSchedule({...newSchedule, title: e.target.value})}
                className="w-full p-4 bg-surface-container-lowest border border-surface-container-low rounded-2xl font-bold outline-none"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-outline tracking-wider">시간</label>
              <input 
                type="text" placeholder="(필수) 예: 20:00 - 22:00" 
                value={newSchedule.time} onChange={(e) => setNewSchedule({...newSchedule, time: e.target.value})}
                className="w-full p-4 bg-surface-container-lowest border border-surface-container-low rounded-2xl font-bold outline-none"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-bold text-outline tracking-wider">장소</label>
              <input 
                type="text" placeholder="(필수) 예: 본당 2층" 
                value={newSchedule.location} onChange={(e) => setNewSchedule({...newSchedule, location: e.target.value})}
                className="w-full p-4 bg-surface-container-lowest border border-surface-container-low rounded-2xl font-bold outline-none"
              />
            </div>
          </div>
        </div>
      )}


      {/* Schedule Detail / Edit Modal */}
      {selectedScheduleForDetail && (
        <div className="fixed inset-0 bg-surface z-[100] flex flex-col">
          <header className="flex items-center justify-between p-4 border-b border-surface-container-highest bg-surface/80 backdrop-blur-md">
            <div className="flex items-center">
              <button 
                onClick={() => {
                  if (isEditingDetail) {
                    setIsEditingDetail(false);
                  } else {
                    setSelectedScheduleForDetail(null);
                  }
                }} 
                className="p-2 text-on-surface-variant"
              >
                <ChevronLeft size={24} />
              </button>
              <h2 className="text-lg font-bold font-headline ml-2">
                {isEditingDetail ? '일정 수정' : '일정 상세'}
              </h2>
            </div>
            {isEditingDetail && (
              <button onClick={handleUpdateSchedule} className="px-4 py-2 bg-primary text-on-primary rounded-xl font-bold text-sm shadow-sm">
                저장
              </button>
            )}
          </header>
          
          <div className="p-5 space-y-4 flex-1 overflow-y-auto">
            {!isEditingDetail ? (
              <>
                <div className="p-6 bg-surface-container-lowest border border-surface-container-low rounded-2xl shadow-sm text-center space-y-4">
                  <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
                    selectedScheduleForDetail.type === 'worship' ? 'bg-primary-container text-on-primary-container' :
                    selectedScheduleForDetail.type === 'education' ? 'bg-secondary-container text-on-secondary-container' :
                    'bg-tertiary-container text-on-tertiary-container'
                  }`}>
                    {selectedScheduleForDetail.type === 'worship' && <BookOpen size={32} />}
                    {selectedScheduleForDetail.type === 'education' && <GraduationCap size={32} />}
                    {selectedScheduleForDetail.type === 'volunteer' && <HeartHandshake size={32} />}
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold text-on-surface">{selectedScheduleForDetail.title}</h3>
                    <p className="text-sm font-medium text-primary mt-1">{selectedScheduleForDetail.fullDate} | {selectedScheduleForDetail.time}</p>
                  </div>
                  
                  <div className="flex items-center justify-center gap-2 text-on-surface-variant text-sm bg-surface-container-low py-2 px-4 rounded-xl inline-flex w-full mt-4">
                    <MapPin size={16} /> <span>{selectedScheduleForDetail.location}</span>
                  </div>
                </div>

                {/* Admin controls */}
                {(user?.role === 'admin' || user?.role === 'leader' || user?.email === 'jumphorse@nate.com' || user?.email === 'seokgwan.ms01@gmail.com') && (
                  <div className="flex gap-3 pt-6">
                    <button 
                      onClick={() => {
                        setEditScheduleData({ ...selectedScheduleForDetail });
                        setIsEditingDetail(true);
                      }}
                      className="flex-1 p-4 bg-surface-container-low text-on-surface font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-surface-container-high transition-colors"
                    >
                      <FileEdit size={18} /> 수정하기
                    </button>
                    <button 
                      onClick={handleDeleteSchedule}
                      className="flex-1 p-4 bg-error-container/30 text-error font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-error-container/50 transition-colors"
                    >
                      <Trash2 size={18} /> 삭제하기
                    </button>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Edit Mode Inputs */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-outline tracking-wider">일정 분류</label>
                  <select
                    value={editScheduleData.type} onChange={(e) => setEditScheduleData({...editScheduleData, type: e.target.value})}
                    className="w-full p-4 bg-surface-container-lowest border border-surface-container-low rounded-2xl font-bold outline-none"
                  >
                    <option value="worship">예배 / 모임</option>
                    <option value="education">훈련 / 교육</option>
                    <option value="volunteer">봉사 / 행사</option>
                  </select>
                </div>
                
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-outline tracking-wider">일정 제목</label>
                  <input 
                    type="text" placeholder="(필수) 예: 금요영성집회" 
                    value={editScheduleData.title} onChange={(e) => setEditScheduleData({...editScheduleData, title: e.target.value})}
                    className="w-full p-4 bg-surface-container-lowest border border-surface-container-low rounded-2xl font-bold outline-none"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-outline tracking-wider">시간</label>
                  <input 
                    type="text" placeholder="(필수) 예: 20:00 - 22:00" 
                    value={editScheduleData.time} onChange={(e) => setEditScheduleData({...editScheduleData, time: e.target.value})}
                    className="w-full p-4 bg-surface-container-lowest border border-surface-container-low rounded-2xl font-bold outline-none"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-bold text-outline tracking-wider">장소</label>
                  <input 
                    type="text" placeholder="(필수) 예: 본당 2층" 
                    value={editScheduleData.location} onChange={(e) => setEditScheduleData({...editScheduleData, location: e.target.value})}
                    className="w-full p-4 bg-surface-container-lowest border border-surface-container-low rounded-2xl font-bold outline-none"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      )}


      
    </div>
  );
};

export default CalendarView;