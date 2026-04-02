import React, { useState, useRef } from 'react';
import {
  ChevronLeft, Calendar, MapPin, Heart, MoreVertical, Trash2, Edit, Camera, Save, X
} from 'lucide-react';
import { collection, doc, addDoc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db as firestoreDb, storage } from '../firebase';
import { OperationType, handleFirestoreError } from '../App';

const ProgramDetailView = ({ user, programId, programs, onBack, onShowToast }: { user: any, programId: string | null, programs: any[], onBack: () => void, onShowToast: (msg: string) => void }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const program = programs.find((p: any) => p.id === programId);
  
  const [editForm, setEditForm] = useState(program ? { ...program } : null);

  const categories = ['사역', '교육/훈련', '봉사', '선교', '동아리'];
  const statuses = ['모집중', '마감임박', '모집완료'];

  if (!program || !editForm) return null;

  const canEdit = user?.role === 'admin' || user?.role === 'leader';

  const handleApply = async () => {
    try {
      const attendanceRef = collection(firestoreDb, 'attendance');
      await addDoc(attendanceRef, {
        uid: user.uid,
        user_name: user.name,
        date: Timestamp.now(),
        type: '프로그램신청',
        program_id: programId,
        program_title: program.title,
        status: '신청완료'
      });
      onShowToast('신청이 완료되었습니다.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'attendance');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('정말 이 프로그램을 삭제하시겠습니까?')) {
      try {
        await deleteDoc(doc(firestoreDb, 'programs', programId as string));
        onShowToast('프로그램이 삭제되었습니다.');
        onBack();
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, 'programs');
      }
    }
  };

  const handleUpdate = async () => {
    if (!editForm.title || !editForm.host || !editForm.date) {
      onShowToast('필수 정보를 모두 입력해주세요.');
      return;
    }
    try {
      await updateDoc(doc(firestoreDb, 'programs', programId as string), {
        title: editForm.title,
        description: editForm.description || editForm.desc || '',
        type: editForm.type,
        host: editForm.host,
        date: editForm.date,
        location: editForm.location,
        image: editForm.image,
        status: editForm.status,
        dDay: editForm.dDay || '',
        updatedAt: Timestamp.now()
      });
      setIsEditing(false);
      onShowToast('성공적으로 수정되었습니다.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'programs');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      onShowToast('이미지 크기는 5MB 이하여야 합니다.');
      return;
    }

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `programs/${Date.now()}_${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        'state_changed',
        () => {},
        (error) => {
          console.error('Upload error:', error);
          onShowToast('이미지 업로드 중 오류가 발생했습니다.');
          setIsUploading(false);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setEditForm({ ...editForm, image: downloadURL });
          setIsUploading(false);
          onShowToast('이미지가 성공적으로 업로드되었습니다.');
        }
      );
    } catch (error) {
      console.error(error);
      setIsUploading(false);
      onShowToast('이미지 업로드에 실패했습니다.');
    }
  };

  if (isEditing) {
    return (
      <div className="absolute inset-0 bg-surface z-[60] flex flex-col min-h-screen overflow-y-auto pb-24">
        <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface-container-highest">
          <div className="flex justify-between items-center px-4 py-3">
            <div className="flex items-center">
              <button onClick={() => setIsEditing(false)} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors mr-2">
                <X size={24} />
              </button>
              <h1 className="text-lg font-bold tracking-tight text-on-surface">프로그램 수정</h1>
            </div>
            <button onClick={handleUpdate} disabled={isUploading} className="flex items-center gap-1 bg-primary text-on-primary px-4 py-2 rounded-xl text-sm font-bold shadow-sm">
              <Save size={16} /> 저장
            </button>
          </div>
        </header>

        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="bg-surface-container-lowest p-5 rounded-3xl border border-surface-container-low shadow-sm space-y-4">
              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">대표 이미지</label>
                <div onClick={() => fileInputRef.current?.click()} className="w-full h-40 bg-surface-container-high rounded-2xl border-2 border-dashed border-outline-variant flex flex-col items-center justify-center cursor-pointer relative overflow-hidden group">
                  {editForm.image ? (
                    <>
                      <img src={editForm.image} alt="Preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity">
                        <Camera size={32} className="mb-2" />
                        <span className="text-sm font-bold">이미지 변경</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-on-surface-variant">
                      <Camera size={24} className="mb-1" />
                      <span className="text-sm font-semibold">이미지 업로드</span>
                    </div>
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">카테고리</label>
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button key={cat} type="button" onClick={() => setEditForm({...editForm, type: cat})} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${editForm.type === cat ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'}`}>{cat}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">프로그램 명</label>
                <input type="text" value={editForm.title} onChange={(e) => setEditForm({...editForm, title: e.target.value})} className="w-full bg-surface-container-high text-on-surface p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
              </div>

              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">주관 / 호스트</label>
                <input type="text" value={editForm.host} onChange={(e) => setEditForm({...editForm, host: e.target.value})} className="w-full bg-surface-container-high text-on-surface p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">일정</label>
                  <input type="text" value={editForm.date} onChange={(e) => setEditForm({...editForm, date: e.target.value})} className="w-full bg-surface-container-high text-on-surface p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">D-Day</label>
                  <input type="text" value={editForm.dDay || ''} onChange={(e) => setEditForm({...editForm, dDay: e.target.value})} placeholder="예: D-5" className="w-full bg-surface-container-high text-on-surface p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">장소</label>
                <input type="text" value={editForm.location} onChange={(e) => setEditForm({...editForm, location: e.target.value})} className="w-full bg-surface-container-high text-on-surface p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium" />
              </div>

              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">상태 설정</label>
                <div className="flex gap-2">
                  {statuses.map(stat => (
                    <button key={stat} type="button" onClick={() => setEditForm({...editForm, status: stat})} className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${editForm.status === stat ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-high text-on-surface-variant'}`}>{stat}</button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">상세 설명</label>
                <textarea value={editForm.description || editForm.desc || ''} onChange={(e) => setEditForm({...editForm, description: e.target.value, desc: e.target.value})} className="w-full bg-surface-container-high text-on-surface p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium min-h-[120px] resize-none" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-surface min-h-screen pb-24 absolute inset-0 z-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface-container-highest">
        <div className="flex items-center justify-between px-2 py-3">
          <div className="flex items-center">
            <button onClick={onBack} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-lg font-bold tracking-tight text-on-surface ml-2">프로그램 상세</h1>
          </div>
          {canEdit && (
            <div className="relative">
              <button onClick={() => setShowOptions(!showOptions)} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors mr-2">
                <MoreVertical size={20} />
              </button>
              {showOptions && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowOptions(false)} />
                  <div className="absolute right-4 top-full mt-1 w-32 bg-surface rounded-2xl shadow-lg border border-surface-container-highest overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                    <button onClick={() => { setShowOptions(false); setIsEditing(true); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-on-surface hover:bg-surface-container-lowest transition-colors">
                      <Edit size={16} /> 수정하기
                    </button>
                    <button onClick={() => { setShowOptions(false); handleDelete(); }} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-error hover:bg-error-container/30 transition-colors border-t border-surface-container-highest">
                      <Trash2 size={16} /> 삭제하기
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1">
        {/* Hero Image */}
        <div className="relative h-64 w-full bg-surface-container-low">
          <img src={program.image} alt={program.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          <div className="absolute top-4 left-4 flex gap-2">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm ${
              program.status === '모집중' ? 'bg-primary text-on-primary' : 
              program.status === '마감임박' ? 'bg-error text-on-error' : 
              'bg-secondary text-on-secondary'
            }`}>{program.status}</span>
            {program.dDay && (
              <span className="bg-surface/90 backdrop-blur-sm text-on-surface text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">{program.dDay}</span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 -mt-6 relative bg-surface rounded-t-3xl border-t border-surface-container-low shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-bold text-tertiary">{program.type}</span>
            <span className="w-1 h-1 rounded-full bg-surface-container-highest"></span>
            <span className="text-sm font-medium text-on-surface-variant">{program.host}</span>
          </div>
          
          <h2 className="text-2xl font-bold text-on-surface mb-6 tracking-tight leading-tight">{program.title}</h2>
          
          <div className="space-y-4 mb-8 bg-surface-container-lowest p-5 rounded-2xl border border-surface-container-low shadow-sm">
            <div className="flex items-start gap-3">
              <Calendar size={20} className="text-primary mt-0.5" />
              <div>
                <p className="text-sm font-bold text-on-surface">일정</p>
                <p className="text-sm text-on-surface-variant mt-0.5">{program.date}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={20} className="text-primary mt-0.5" />
              <div>
                <p className="text-sm font-bold text-on-surface">장소</p>
                <p className="text-sm text-on-surface-variant mt-0.5">{program.location}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-bold text-on-surface mb-3 flex items-center gap-2">
                <span className="bg-primary/10 text-primary p-1.5 rounded-lg"><Calendar size={18} /></span>
                프로그램 소개
              </h3>
              <p className="text-on-surface-variant text-[15px] leading-relaxed whitespace-pre-line bg-surface-container-lowest p-5 rounded-2xl border border-surface-container-low text-justify break-words">
                {program.desc || program.description || '상세 정보가 없습니다.'}
              </p>
            </section>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-surface/90 backdrop-blur-md border-t border-surface-container-highest p-4 flex gap-3 z-40">
        <button onClick={() => onShowToast('관심 프로그램으로 등록되었습니다.')} className="w-14 h-14 rounded-2xl bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-error transition-colors shadow-sm border border-surface-container-low">
          <Heart size={24} />
        </button>
        <button onClick={handleApply} className="flex-1 bg-primary text-on-primary rounded-2xl text-base font-bold hover:bg-primary-dim transition-colors shadow-md shadow-primary/20 hover:-translate-y-0.5 transform duration-200">
          신청하기
        </button>
      </div>
    </div>
  );
};

export default ProgramDetailView;
