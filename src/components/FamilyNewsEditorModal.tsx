import React, { useState, useEffect } from 'react';
import { X, Camera, Loader2, ImagePlus } from 'lucide-react';
import { collection, addDoc, Timestamp, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

const CATEGORIES = [
  { id: 'new_member', label: '🎉 새가족 환영', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'pregnancy', label: '👼 생명의 축복', color: 'bg-pink-100 text-pink-700' },
  { id: 'childbirth', label: '🍼 출산 축하', color: 'bg-blue-100 text-blue-700' },
  { id: 'wedding', label: '💍 결혼 축하', color: 'bg-purple-100 text-purple-700' },
  { id: 'etc', label: '📬 특별한 소식', color: 'bg-surface-container-highest text-on-surface' }
];

export const FamilyNewsEditorModal = ({ isOpen, onClose, user, onShowToast, editItem = null, forests = [] }: any) => {
  const [category, setCategory] = useState(CATEGORIES[0].id);
  const [forestId, setForestId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (editItem) {
        setCategory(editItem.category || CATEGORIES[0].id);
        setForestId(editItem.forest_id || '');
        setTitle(editItem.title || '');
        setContent(editItem.content || '');
        setImagePreview(editItem.imageUrl || null);
        setImageFile(null);
      } else {
        setCategory(CATEGORIES[0].id);
        setForestId('');
        setTitle('');
        setContent('');
        setImagePreview(null);
        setImageFile(null);
      }
      setIsSubmitting(false);
    }
  }, [isOpen, editItem]);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) {
      onShowToast('제목과 내용을 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    let imageUrl = editItem?.imageUrl || '';

    try {
      if (imageFile) {
        const storageRef = ref(storage, `family_news/${Date.now()}_${imageFile.name}`);
        const uploadTask = await uploadBytesResumable(storageRef, imageFile);
        imageUrl = await getDownloadURL(uploadTask.ref);
      }

      const selectedForest = forests.find((f: any) => f.id === forestId);
      const forestName = selectedForest ? selectedForest.name : '';

      if (editItem) {
        await updateDoc(doc(db, 'family_news', editItem.id), {
          category,
          forest_id: forestId,
          forest_name: forestName,
          title,
          content,
          imageUrl,
          updated_at: Timestamp.now()
        });
        onShowToast('가족 소식이 수정되었습니다.');
      } else {
        await addDoc(collection(db, 'family_news'), {
          category,
          forest_id: forestId,
          forest_name: forestName,
          title,
          content,
          imageUrl,
          author_uid: user.uid,
          author_name: user.name,
          created_at: Timestamp.now(),
          is_active: true,
          likes: []
        });
        onShowToast('가족 소식이 등록되었습니다.');
      }

      onClose();
    } catch (error) {
      console.error("Error adding family news:", error);
      onShowToast('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-surface w-full max-w-md rounded-3xl overflow-hidden flex flex-col max-h-[90vh] shadow-2xl animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-surface-container-highest bg-surface/80 backdrop-blur-md sticky top-0 z-10">
          <h2 className="text-lg font-bold font-headline text-on-surface">{editItem ? '가족 소식 수정' : '가족 소식 등록'}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container transition-colors">
            <X size={20} className="text-on-surface-variant" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* Status Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">소식 종류</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                    category === cat.id 
                      ? 'bg-primary text-on-primary border-primary shadow-md scale-105' 
                      : 'bg-surface-container-lowest text-on-surface-variant border-surface-container-highest hover:bg-surface-container-low'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Forest Selection */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">소속 숲 (선택)</label>
            <select
              value={forestId}
              onChange={(e) => setForestId(e.target.value)}
              className="w-full bg-surface-container-lowest p-4 rounded-xl text-sm font-medium text-on-surface outline-none border border-surface-container focus:border-primary focus:ring-1 focus:ring-primary transition-all appearance-none"
            >
              <option value="">소속을 선택해주세요 (생략 가능)</option>
              {forests.map((f: any) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          {/* Image Upload */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">가족 사진 (선택)</label>
            <label className={`w-full flex-col aspect-video rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer overflow-hidden transition-all group ${imagePreview ? 'border-primary bg-primary/5' : 'border-surface-container-highest hover:bg-surface-container-lowest'}`}>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              {imagePreview ? (
                <div className="relative w-full h-full">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white font-bold text-sm bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm">사진 변경</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 text-on-surface-variant group-hover:text-primary transition-colors">
                  <div className="w-12 h-12 bg-surface-container-highest rounded-full flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <ImagePlus size={24} />
                  </div>
                  <span className="text-sm font-medium">터치하여 사진 업로드</span>
                </div>
              )}
            </label>
          </div>

          {/* Texts */}
          <div className="space-y-4">
            <div className="space-y-2">
               <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">제목</label>
               <input 
                 value={title} 
                 onChange={e => setTitle(e.target.value)} 
                 placeholder="예: 우리 숲에 새가족이 왔어요!" 
                 className="w-full bg-surface-container-lowest p-4 rounded-xl text-sm font-medium text-on-surface outline-none border border-surface-container focus:border-primary focus:ring-1 focus:ring-primary transition-all"
               />
            </div>
            
            <div className="space-y-2">
               <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">내용</label>
               <textarea 
                 value={content} 
                 onChange={e => setContent(e.target.value)} 
                 placeholder="은혜로운 소식을 자세히 나눠주세요..." 
                 className="w-full min-h-[120px] bg-surface-container-lowest p-4 rounded-xl text-sm leading-relaxed text-on-surface outline-none border border-surface-container focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
               />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-5 border-t border-surface-container-highest bg-surface-container-lowest mt-auto">
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting || !title.trim() || !content.trim()}
            className={`w-full py-4 rounded-2xl font-bold flexitems-center justify-center tracking-wide transition-all shadow-sm flex items-center gap-2 ${
              isSubmitting || !title.trim() || !content.trim() 
                ? 'bg-surface-container-highest text-outline cursor-not-allowed' 
                : 'bg-primary text-on-primary hover:bg-primary/90 active:scale-95 shadow-lg shadow-primary/30'
            }`}
          >
            {isSubmitting ? (
              <><Loader2 size={18} className="animate-spin" /> {editItem ? '수정 중...' : '등록 중...'}</>
            ) : (editItem ? '소식 수정하기' : '소식 등록하기')}
          </button>
        </div>
      </div>
    </div>
  );
};
