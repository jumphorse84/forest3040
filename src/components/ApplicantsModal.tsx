import React from 'react';
import { X, Users } from 'lucide-react';
import { MemberRow } from '../App';

interface ApplicantsModalProps {
  isOpen: boolean;
  onClose: () => void;
  programTitle: string;
  applicants: any[];
  users: any[];
}

const ApplicantsModal = ({ isOpen, onClose, programTitle, applicants, users }: ApplicantsModalProps) => {
  if (!isOpen) return null;

  // Find user data for each applicant
  const applicantUsers = applicants.map(app => {
    const userData = users.find(u => u.uid === app.uid);
    return userData ? { ...userData, ...app } : app;
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center px-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="fixed inset-0" 
        onClick={onClose}
      />
      <div className="bg-surface w-full max-w-md rounded-t-[2.5rem] flex flex-col max-h-[85vh] shadow-2xl animate-in slide-in-from-bottom duration-300 z-10 overflow-hidden">
        {/* Handle bar for visual cue */}
        <div className="w-12 h-1.5 bg-surface-container-highest rounded-full mx-auto mt-4 mb-2 opacity-50"></div>
        
        <header className="px-6 py-4 border-b border-surface-container-highest flex items-center justify-between bg-surface/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-xl text-primary">
              <Users size={20} />
            </div>
            <div>
              <h2 className="text-lg font-headline font-extrabold text-on-surface">신청자 명단</h2>
              <p className="text-[12px] text-on-surface-variant font-medium line-clamp-1">{programTitle}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-surface-container-high text-on-surface-variant rounded-full hover:bg-surface-container-highest transition-colors"
          >
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
          {applicantUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center opacity-60">
              <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mb-4">
                <Users size={32} className="text-outline-variant" />
              </div>
              <p className="text-sm font-bold text-on-surface-variant">아직 신청자가 없습니다.</p>
              <p className="text-xs text-on-surface-variant mt-1">첫 번째 신청자가 되어보세요! 🌿</p>
            </div>
          ) : (
            <div className="space-y-1">
              {applicantUsers.map((member: any) => (
                <div key={member.id || member.uid} className="bg-surface-container-lowest/50 rounded-2xl">
                  <MemberRow 
                    member={member} 
                    forests={[]} // Not strictly needed for the name display but could be added
                    onClick={() => {}} // Could link to profile later
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-6 bg-surface-container-lowest border-t border-surface-container">
          <button 
            onClick={onClose}
            className="w-full py-4 bg-primary text-on-primary rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApplicantsModal;
