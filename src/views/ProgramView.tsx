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
import ApplicantsModal from '../components/ApplicantsModal';

const ProgramView = ({ user, programs, attendance = [], users = [], onNavigateToDetail, onNavigateToAdd, onShowToast }: { user: any, programs: any[], attendance: any[], users: any[], onNavigateToDetail: (id: string) => void, onNavigateToAdd: () => void, onShowToast: (msg: string) => void }) => {
  const [activeTab, setActiveTab] = useState('전체');
  const [isApplicantsModalOpen, setIsApplicantsModalOpen] = useState(false);
  const [selectedProgramForModal, setSelectedProgramForModal] = useState<any>(null);
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
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-5">
                <Sparkles size={36} className="text-primary/60" />
              </div>
              <h3 className="text-[17px] font-extrabold text-on-surface mb-2 font-headline">
                {activeTab === '전체' ? '아직 등록된 프로그램이 없어요' : `'${activeTab}' 프로그램이 없어요`}
              </h3>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                곧 다양한 프로그램이 업로드될 예정입니다.<br />
                조금만 기다려 주세요 🌿
              </p>
            </div>
          )}

          {filteredPrograms.map(program => {
            const programApplicants = attendance.filter((a: any) => a.program_id === program.id);
            const myApplication = programApplicants.find((a: any) => a.uid === user?.uid);
            const isApplied = !!myApplication;
            const isFull = !program.isUnlimited && programApplicants.length >= (program.maxParticipants || 0);

            const handleApplyToggle = async (e: React.MouseEvent) => {
              e.stopPropagation();
              if (isApplied) {
                if (window.confirm('신청을 취소하시겠습니까?')) {
                  try {
                    await deleteDoc(doc(firestoreDb, 'attendance', myApplication.id));
                    onShowToast('신청이 취소되었습니다.');
                  } catch (err) {
                    handleFirestoreError(err, OperationType.DELETE, 'attendance');
                  }
                }
                return;
              }

              if (isFull) {
                onShowToast('정원이 초과되어 신청할 수 없습니다.');
                return;
              }

              try {
                const attendanceRef = collection(firestoreDb, 'attendance');
                await addDoc(attendanceRef, {
                  uid: user.uid,
                  user_name: user.name,
                  date: Timestamp.now(),
                  type: '프로그램신청',
                  program_id: program.id,
                  program_title: program.title,
                  status: '신청완료'
                });
                onShowToast(`${program.title} 신청이 완료되었습니다.`);
              } catch (err) {
                handleFirestoreError(err, OperationType.WRITE, 'attendance');
              }
            };

            return (
              <article key={program.id} className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-sm border border-surface-container-low group cursor-pointer hover:shadow-md transition-all duration-300">
                <div className="relative h-48 overflow-hidden bg-surface-container-low" onClick={() => onNavigateToDetail(program.id)}>
                  <img src={program.image} alt={program.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    <div className="flex gap-2">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm ${
                        program.status === '모집중' ? 'bg-primary text-on-primary' : 
                        program.status === '마감임박' ? 'bg-error text-on-error' : 
                        'bg-secondary text-on-secondary'
                      }`}>{program.status}</span>
                      {program.dDay && (
                        <span className="bg-surface/90 backdrop-blur-sm text-on-surface text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">{program.dDay}</span>
                      )}
                    </div>
                    {/* Applicant Count Badge */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); setSelectedProgramForModal(program); setIsApplicantsModalOpen(true); }}
                      className="bg-secondary/90 backdrop-blur-sm text-on-secondary text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1.5 self-start hover:bg-secondary transition-colors"
                    >
                      <Users size={12} />
                      {programApplicants.length}명{program.isUnlimited ? '' : ` / ${program.maxParticipants}명`}
                    </button>
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onShowToast('관심 프로그램으로 등록되었습니다.'); }}
                    className="absolute top-4 right-4 w-8 h-8 bg-surface/90 backdrop-blur-sm rounded-full flex items-center justify-center text-on-surface-variant hover:text-error transition-colors shadow-sm"
                  >
                    <Heart size={18} />
                  </button>
                </div>
                <div className="p-5" onClick={() => onNavigateToDetail(program.id)}>
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
                    <button onClick={(e) => { e.stopPropagation(); onNavigateToDetail(program.id); }} className="flex-1 bg-surface-container-low text-on-surface py-2.5 rounded-xl text-sm font-bold hover:bg-surface-container transition-colors">상세보기</button>
                    <button 
                      onClick={handleApplyToggle}
                      disabled={isFull && !isApplied}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm ${
                        isApplied 
                          ? 'bg-surface-container-highest text-on-surface-variant' 
                          : isFull 
                            ? 'bg-surface-container-highest text-outline cursor-not-allowed shadow-none'
                            : 'bg-primary text-on-primary hover:bg-primary-dim shadow-primary/20'
                      }`}
                    >
                      {isApplied ? '신청완료' : isFull ? '정원 마감' : '신청하기'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}

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

      {selectedProgramForModal && (
        <ApplicantsModal 
          isOpen={isApplicantsModalOpen}
          onClose={() => { setIsApplicantsModalOpen(false); setSelectedProgramForModal(null); }}
          programTitle={selectedProgramForModal.title}
          applicants={attendance.filter((a: any) => a.program_id === selectedProgramForModal.id)}
          users={users}
        />
      )}
    </div>
  );
};

export default ProgramView;
