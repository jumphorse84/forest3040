import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft, BookOpen, Users, Music, Megaphone, Play,
  ChevronRight, Calendar, MoreVertical, Edit, Trash2, X, Save, Plus, Camera, Search,
  Youtube, Loader2, ChevronDown, ChevronUp, ImagePlus
} from 'lucide-react';
import { doc, updateDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db as firestoreDb, storage } from '../firebase';
import { OperationType, handleFirestoreError } from '../App';
import { searchBible } from '../utils/bibleParser';

const WorshipDetailView = ({
  user,
  worshipId,
  worships,
  onBack,
  onShowToast,
  initialEditMode
}: {
  user?: any;
  worshipId: string | null;
  worships: any[];
  onBack: () => void;
  onShowToast?: (msg: string) => void;
  initialEditMode?: boolean;
}) => {
  const worship = worships.find(w => w.id === worshipId);
  const [showOptions, setShowOptions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null);

  // Edit modal states
  const [isYoutubeModalOpen, setIsYoutubeModalOpen] = useState(false);
  const [ytSearchQuery, setYtSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchError, setSearchError] = useState('');
  const [isBibleModalOpen, setIsBibleModalOpen] = useState(false);
  const [bibleQuery, setBibleQuery] = useState('');
  const [isBibleSearching, setIsBibleSearching] = useState(false);
  const [bibleResult, setBibleResult] = useState<any>(null);
  const [bibleVersion, setBibleVersion] = useState('개역개정');
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [activeMemberTarget, setActiveMemberTarget] = useState<any>(null);
  const [isWriteRolesOpen, setIsWriteRolesOpen] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);

  const MOCK_MEMBERS = [
    { id: 1, name: '이목사', role: '담임목사' },
    { id: 2, name: '박전도사', role: '전도사' },
    { id: 3, name: '강효순', role: '집사' },
    { id: 4, name: '김도우', role: '청년' },
    { id: 5, name: '송하규', role: '장로' },
    { id: 6, name: '김준연', role: '권사' },
    { id: 7, name: '최사랑', role: '성도' },
    { id: 8, name: '이믿음', role: '안수집사' },
  ];

  useEffect(() => {
    if (worship) {
      setEditForm({ ...worship });
      if (initialEditMode) setIsEditing(true);
    }
  }, [worshipId, initialEditMode]);

  useEffect(() => {
    if (worshipId && worship) {
      updateDoc(doc(firestoreDb, 'worships', worshipId), {
        view_count: (worship.view_count || 0) + 1
      }).catch(err => console.error('view count error:', err));
    }
  }, [worshipId]);

  if (!worship) return null;

  const canEdit = user?.role === 'admin' || user?.role === 'leader';

  const formatDate = (date: any) => {
    if (!date) return '';
    const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return `${d.getFullYear()}년 ${String(d.getMonth() + 1).padStart(2, '0')}월 ${String(d.getDate()).padStart(2, '0')}일`;
  };

  const getDateInputVal = (date: any) => {
    if (!date) return '';
    const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return d.toISOString().split('T')[0];
  };

  const handleDelete = async () => {
    if (!window.confirm('이 예배 정보를 삭제하시겠습니까?\n삭제 후 복구할 수 없습니다.')) return;
    try {
      await deleteDoc(doc(firestoreDb, 'worships', worshipId as string));
      onShowToast?.('예배 정보가 삭제되었습니다.');
      onBack();
    } catch (err) { handleFirestoreError(err, OperationType.DELETE, 'worships'); }
  };

  const handleUpdate = async () => {
    if (!editForm?.title) { onShowToast?.('제목을 입력해주세요.'); return; }
    try {
      const updateData: any = {
        title: editForm.title,
        subtitle: editForm.subtitle || '',
        preacher: editForm.preacher || '',
        date: editForm.date?.seconds ? editForm.date : (editForm.date ? Timestamp.fromDate(new Date(editForm.date)) : editForm.date),
        image: editForm.image || '',
        youtube_url: editForm.youtube_url || '',
        scripture: editForm.scripture || '',
        scripture_content: editForm.scripture_content || '',
        participants: editForm.participants || [],
        praise: editForm.praise || [],
        announcements: editForm.announcements || [],
        updatedAt: Timestamp.now()
      };
      await updateDoc(doc(firestoreDb, 'worships', worshipId as string), updateData);
      setIsEditing(false);
      onShowToast?.('예배 정보가 수정되었습니다.');
    } catch (err) { handleFirestoreError(err, OperationType.WRITE, 'worships'); }
  };

  const handleKakaoShare = () => {
    const kakao = (window as any).Kakao;
    if (!kakao || !kakao.isInitialized()) {
      onShowToast?.("카카오톡 공유 기능을 불러오지 못했습니다.");
      return;
    }

    let descriptionText = "";
    if (worship.participants && worship.participants.length > 0) {
      // Create role summary: e.g. "사회    박수형 부장"
      descriptionText += worship.participants.map((p: any) => `${p.role}\t${p.name}`).join('\n');
      descriptionText += "\n\n";
    }
    
    if (worship.scripture_content) {
      const shortScripture = worship.scripture_content.length > 30 ? worship.scripture_content.substring(0, 30) + "..." : worship.scripture_content;
      descriptionText += `[${worship.scripture || '본문'}]\n${shortScripture}`;
    }

    if (worship.subtitle) {
      if (descriptionText.length > 0) descriptionText += "\n";
      descriptionText += worship.subtitle;
    }

    if (!descriptionText) {
      descriptionText = worship.title || "주보 상세 정보 확인하기";
    }
    
    const shareTitle = `${formatDate(worship.date)} 예배`;

    let safeImageUrl = 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=800';
    if (worship.image && worship.image.startsWith('http')) {
      safeImageUrl = worship.image;
    }

    kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title: shareTitle,
        description: descriptionText,
        imageUrl: safeImageUrl,
        link: {
          mobileWebUrl: window.location.href,
          webUrl: window.location.href,
        },
      },
      buttons: [
        {
          title: '예배 확인하기',
          link: {
            mobileWebUrl: window.location.href,
            webUrl: window.location.href,
          },
        },
      ],
    });
  };

  const handleCoverImageUploadEdit = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsCompressing(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event: any) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        let width = img.width, height = img.height;
        if (width > MAX_WIDTH) { height = Math.round((height * MAX_WIDTH) / width); width = MAX_WIDTH; }
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d')?.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/jpeg', 0.8);
        setEditForm((prev: any) => ({ ...prev, image: compressed }));
        setIsCompressing(false);
        onShowToast?.('이미지가 변경되었습니다.');
      };
    };
    if (coverImageInputRef.current) coverImageInputRef.current.value = '';
  };

  const handleYoutubeSearch = async (e: any) => {
    e.preventDefault();
    if (!ytSearchQuery.trim()) return;
    setIsSearching(true); setSearchError('');
    try {
      const API_KEY = 'AIzaSyAeJO_vSdwg79kWbh06xoeG-ItDDDBjGlc';
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(ytSearchQuery)}&type=video&key=${API_KEY}`;
      const response = await fetch(url);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message || '검색 중 오류가 발생했습니다.');
      if (data.items) {
        setSearchResults(data.items.map((item: any) => {
          const d = document.createElement('textarea'); d.innerHTML = item.snippet.title; return {
            id: item.id.videoId, title: d.value, channel: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url
          };
        }));
      } else { setSearchResults([]); }
    } catch (error: any) { setSearchError(`API 오류: ${error.message}`); }
    finally { setIsSearching(false); }
  };

  const handleSelectVideo = (video: any) => {
    const newSong = { title: video.title, link: `https://www.youtube.com/watch?v=${video.id}`, thumbnail: video.thumbnail };
    setEditForm((prev: any) => ({ ...prev, praise: [...(prev.praise || []), newSong] }));
    setIsYoutubeModalOpen(false); setSearchResults([]); setYtSearchQuery('');
  };

  const handleBibleSearch = async (e: any) => {
    e.preventDefault();
    if (!bibleQuery.trim()) return;
    setIsBibleSearching(true); setBibleResult(null);

    const result = await searchBible(bibleQuery, bibleVersion);
    setBibleResult(result);

    setIsBibleSearching(false);
  };

  const handleSelectBible = () => {
    setEditForm((prev: any) => ({ ...prev, scripture: bibleResult.reference, scripture_content: bibleResult.text }));
    setIsBibleModalOpen(false);
  };

  const openMemberSearch = (target: any) => { setActiveMemberTarget(target); setMemberSearchQuery(''); setIsMemberModalOpen(true); };

  const handleSelectMember = (member: any) => {
    if (activeMemberTarget === 'preacher') {
      setEditForm((prev: any) => ({ ...prev, preacher: member.name }));
    } else if (typeof activeMemberTarget === 'number') {
      const newP = [...(editForm.participants || [])];
      newP[activeMemberTarget] = { ...newP[activeMemberTarget], name: member.name };
      setEditForm((prev: any) => ({ ...prev, participants: newP }));
    }
    setIsMemberModalOpen(false);
  };

  const hideScrollbarStyle = { msOverflowStyle: 'none', scrollbarWidth: 'none' } as React.CSSProperties;

  // ---- EDIT MODE ----
  if (isEditing && editForm) {
    return (
      <div className="absolute inset-0 bg-white z-[60] flex flex-col font-sans overflow-hidden min-h-screen pb-10">
        <style dangerouslySetInnerHTML={{__html: `::-webkit-scrollbar { display: none; }`}} />
        <div className="max-w-md mx-auto bg-gray-50 flex-1 overflow-y-auto pb-24 w-full" style={hideScrollbarStyle}>
          {/* Header */}
          <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 p-4 flex justify-between items-center z-10 w-full">
            <button onClick={() => setIsEditing(false)} className="p-2 -ml-2 text-gray-600 z-10">
              <X size={24} />
            </button>
            <h2 className="text-lg font-bold absolute left-1/2 -translate-x-1/2">예배 수정</h2>
            <div className="w-8"></div>
          </div>

          <div className="p-4 space-y-6">
            {/* 기본 정보 */}
            <section className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-bold text-gray-800 border-b pb-2">기본 정보</h3>
              <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <img src={editForm.image || 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=800'} alt="커버" className="w-16 h-16 rounded-lg object-cover border border-gray-200 shrink-0" referrerPolicy="no-referrer" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-800 mb-1">대표 커버 이미지</p>
                  <button onClick={() => coverImageInputRef.current?.click()} className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium hover:bg-gray-50 transition-colors">
                    {isCompressing ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
                    {isCompressing ? '처리 중...' : '이미지 변경'}
                  </button>
                  <input type="file" accept="image/*" className="hidden" ref={coverImageInputRef} onChange={handleCoverImageUploadEdit} />
                </div>
              </div>
              <input type="text" placeholder="예배 제목 (예: 이것이 싸우는 방식)" value={editForm.title || ''} onChange={e => setEditForm({...editForm, title: e.target.value})} className="w-full bg-gray-50 p-3 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" />
              <input type="text" placeholder="부제목 (예: 모세의 승리 전략)" value={editForm.subtitle || ''} onChange={e => setEditForm({...editForm, subtitle: e.target.value})} className="w-full bg-gray-50 p-3 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" />
              <div className="flex gap-2">
                <input type="date" value={getDateInputVal(editForm.date)} onChange={e => setEditForm({...editForm, date: e.target.value})} className="w-full bg-gray-50 p-3 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 text-gray-700" />
                <div className="relative w-full">
                  <input type="text" placeholder="설교자 직접입력/검색" value={editForm.preacher || ''} onChange={e => setEditForm({...editForm, preacher: e.target.value})} className="w-full bg-gray-50 p-3 pr-10 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" />
                  <button onClick={() => openMemberSearch('preacher')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-emerald-600 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors"><Search size={14} /></button>
                </div>
              </div>
            </section>

            {/* 본문 말씀 */}
            <section className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-bold text-gray-800 border-b pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2"><BookOpen size={18} className="text-emerald-600" /> 본문 말씀</div>
                <button onClick={() => { setBibleQuery(''); setBibleResult(null); setIsBibleModalOpen(true); }} className="text-xs bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full flex items-center gap-1 font-bold"><Search size={14} /> 말씀 찾기</button>
              </h3>
              <input type="text" placeholder="말씀 구절 (예: 출애굽기 17:8-9)" value={editForm.scripture || ''} onChange={e => setEditForm({...editForm, scripture: e.target.value})} className="w-full bg-gray-50 p-3 rounded-lg outline-none font-bold text-emerald-700" />
              <textarea placeholder="말씀 내용" value={editForm.scripture_content || ''} onChange={e => setEditForm({...editForm, scripture_content: e.target.value})} className="w-full bg-gray-50 p-3 rounded-lg outline-none min-h-[100px] resize-none leading-relaxed" />
            </section>

            {/* 예배 섬김이 */}
            <section className="bg-white p-5 rounded-2xl shadow-sm">
              <div className={`flex items-center justify-between cursor-pointer select-none ${isWriteRolesOpen ? 'border-b pb-4 mb-4' : ''}`} onClick={() => setIsWriteRolesOpen(!isWriteRolesOpen)}>
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <Users size={18} className="text-emerald-600" /> 예배 섬김이 입력
                  {!isWriteRolesOpen && <span className="text-xs font-normal text-gray-400 ml-2">(터치하여 펼치기)</span>}
                </h3>
                {isWriteRolesOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
              </div>
              {isWriteRolesOpen && (
                <div className="space-y-3">
                  {(editForm.participants || []).map((p: any, idx: number) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <span className="w-20 text-sm text-gray-600 font-medium truncate">{p.role || '역할'}</span>
                      <div className="flex-1 relative">
                        <input type="text" placeholder="이름 직접입력/검색" value={p.name || ''} onChange={e => { const newP = [...(editForm.participants || [])]; newP[idx] = {...newP[idx], name: e.target.value}; setEditForm({...editForm, participants: newP}); }} className="w-full bg-gray-50 p-2 pr-10 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" />
                        <button onClick={() => openMemberSearch(idx)} className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-emerald-600 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors"><Search size={14} /></button>
                      </div>
                    </div>
                  ))}
                  <button onClick={() => setEditForm({...editForm, participants: [...(editForm.participants || []), {role: '', name: ''}]})} className="w-full py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:bg-gray-50">+ 섬김이 추가</button>
                </div>
              )}
            </section>

            {/* 경배와 찬양 */}
            <section className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-bold text-gray-800 border-b pb-2 flex items-center justify-between">
                <div className="flex items-center gap-2"><Music size={18} className="text-emerald-600" /> 경배와찬양(콘티)</div>
                <button onClick={() => { setYtSearchQuery(''); setSearchResults([]); setIsYoutubeModalOpen(true); }} className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-full flex items-center gap-1 font-bold"><Youtube size={14} /> 유튜브 검색</button>
              </h3>
              <div className="space-y-3">
                {(editForm.praise || []).map((p: any, idx: number) => (
                  <div key={idx} className="flex gap-3 bg-gray-50 p-3 rounded-xl relative border border-gray-100">
                    {p.thumbnail && <img src={p.thumbnail} alt="thumb" className="w-20 h-14 object-cover rounded-md" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{p.title}</p>
                      <p className="text-xs text-gray-500 truncate">{p.link}</p>
                    </div>
                    <button onClick={() => setEditForm({...editForm, praise: (editForm.praise || []).filter((_: any, i: number) => i !== idx)})} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
                  </div>
                ))}
                {(!editForm.praise || editForm.praise.length === 0) && <p className="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-xl">추가된 찬양이 없습니다.</p>}
              </div>
            </section>

            {/* 광고 */}
            <section className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-bold text-gray-800 flex items-center gap-2"><Megaphone size={18} className="text-emerald-600" /> 광고</h3>
                <button onClick={() => setEditForm({...editForm, announcements: [...(editForm.announcements || []), {title: '', content: ''}]})} className="text-xs bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-1.5 rounded-full font-bold transition-colors">텍스트 추가</button>
              </div>
              {(editForm.announcements || []).map((ann: any, idx: number) => (
                <div key={idx} className="flex gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</div>
                  <div className="flex-1 space-y-2">
                    <input type="text" placeholder="광고 제목" value={ann.title || ''} onChange={e => { const newA = [...(editForm.announcements || [])]; newA[idx] = {...newA[idx], title: e.target.value}; setEditForm({...editForm, announcements: newA}); }} className="w-full bg-gray-50 p-2 rounded-lg outline-none text-sm font-bold" />
                    <input type="text" placeholder="상세 내용" value={ann.content || ''} onChange={e => { const newA = [...(editForm.announcements || [])]; newA[idx] = {...newA[idx], content: e.target.value}; setEditForm({...editForm, announcements: newA}); }} className="w-full bg-gray-50 p-2 rounded-lg outline-none text-sm" />
                  </div>
                  <button onClick={() => setEditForm({...editForm, announcements: (editForm.announcements||[]).filter((_:any,i:number)=>i!==idx)})} className="p-1 text-gray-400 hover:text-red-500 mt-1"><X size={16} /></button>
                </div>
              ))}
            </section>

            {/* 저장 버튼 */}
            <div className="pt-4 pb-8">
              <button onClick={handleUpdate} disabled={isUploading} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl shadow-md shadow-emerald-600/20 transition-all active:scale-[0.98] text-lg disabled:opacity-50">
                {isUploading ? '이미지 업로드 중...' : '수정사항 저장하기'}
              </button>
            </div>
          </div>
        </div>

        {/* 유튜브 검색 모달 */}
        {isYoutubeModalOpen && (
          <div className="absolute inset-0 bg-black/60 flex items-end justify-center z-50 overflow-hidden">
            <div className="bg-white w-full h-[85vh] rounded-t-3xl flex flex-col">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2"><Youtube className="text-red-500" size={20} /> 유튜브 영상 검색</h3>
                <button onClick={() => setIsYoutubeModalOpen(false)} className="p-1"><X size={20} /></button>
              </div>
              <div className="p-4 border-b bg-gray-50">
                <form onSubmit={handleYoutubeSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" value={ytSearchQuery} onChange={e => setYtSearchQuery(e.target.value)} placeholder="찬양 제목 검색..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-red-400" />
                  </div>
                  <button type="submit" className="px-5 bg-gray-900 text-white rounded-xl font-bold">검색</button>
                </form>
              </div>
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50" style={hideScrollbarStyle}>
                {isSearching ? <div className="text-center py-10 text-gray-500">검색 중...</div> :
                 searchError ? <div className="text-center py-10 text-red-500">{searchError}</div> :
                 searchResults.length > 0 ? (
                  <div className="space-y-3">
                    {searchResults.map((video, idx) => (
                      <div key={idx} onClick={() => handleSelectVideo(video)} className="bg-white border border-gray-200 p-3 rounded-xl flex gap-3 cursor-pointer hover:border-red-300">
                        <img src={video.thumbnail} alt="thumb" className="w-24 h-16 object-cover rounded-lg" />
                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                          <p className="font-bold text-sm text-gray-900 line-clamp-2">{video.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{video.channel}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                 ) : <div className="text-center py-10 text-gray-400">찬양 제목을 검색하고 선택하세요.</div>}
              </div>
            </div>
          </div>
        )}

        {/* 성경 검색 모달 */}
        {isBibleModalOpen && (
          <div className="absolute inset-0 bg-black/60 flex items-end justify-center z-50 overflow-hidden">
            <div className="bg-white w-full h-[85vh] rounded-t-3xl flex flex-col">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2"><BookOpen className="text-emerald-600" size={20} /> 성경 말씀 찾기</h3>
                <button onClick={() => setIsBibleModalOpen(false)} className="p-1"><X size={20} /></button>
              </div>
              <div className="p-4 border-b bg-gray-50">
                <form onSubmit={handleBibleSearch} className="flex gap-2 mb-3">
                  <select value={bibleVersion} onChange={e => setBibleVersion(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-2 py-2.5 text-sm font-medium text-gray-700 outline-none">
                    <option value="개역개정">개역개정</option><option value="새번역">새번역</option><option value="NIV">NIV</option>
                  </select>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" value={bibleQuery} onChange={e => setBibleQuery(e.target.value)} placeholder="예: 요 3:16" className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-emerald-500" />
                  </div>
                  <button type="submit" className="px-5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors">검색</button>
                </form>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs text-gray-500 font-medium">빠른 검색:</span>
                  {['요 3:16', '창 1:1', '빌 4:13', '출 17:8-9'].map(q => (
                    <button key={q} type="button" onClick={() => setBibleQuery(q)} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-md hover:bg-gray-300">{q}</button>
                  ))}
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50" style={hideScrollbarStyle}>
                {isBibleSearching ? <div className="text-center py-10 text-gray-500">말씀을 찾는 중...</div> :
                 bibleResult ? (
                  <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
                    <h4 className="font-bold text-lg text-emerald-700 mb-3">{bibleResult.reference}</h4>
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{bibleResult.text}</p>
                    <button onClick={handleSelectBible} className="mt-6 w-full py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-bold transition-colors">이 말씀 본문에 넣기</button>
                  </div>
                 ) : (
                  <div className="text-center py-10 text-gray-400">
                    <BookOpen size={40} className="mx-auto mb-3 opacity-20" />
                    <p>원하시는 성경 구절을 검색해보세요.</p>
                  </div>
                 )}
              </div>
            </div>
          </div>
        )}

        {/* 회원 검색 모달 */}
        {isMemberModalOpen && (
          <div className="absolute inset-0 bg-black/60 flex items-end justify-center z-50 overflow-hidden">
            <div className="bg-white w-full h-[70vh] rounded-t-3xl flex flex-col">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2"><Users className="text-emerald-600" size={20} /> 회원 검색</h3>
                <button onClick={() => setIsMemberModalOpen(false)} className="p-1"><X size={20} /></button>
              </div>
              <div className="p-4 border-b bg-gray-50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type="text" value={memberSearchQuery} onChange={e => setMemberSearchQuery(e.target.value)} placeholder="회원 이름 검색..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-emerald-500" />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50" style={hideScrollbarStyle}>
                <div className="space-y-2">
                  {MOCK_MEMBERS.filter(m => m.name.includes(memberSearchQuery)).map(member => (
                    <div key={member.id} onClick={() => handleSelectMember(member)} className="bg-white border border-gray-200 p-3 rounded-xl flex justify-between items-center cursor-pointer hover:border-emerald-400 hover:bg-emerald-50 transition-colors">
                      <span className="font-bold text-gray-900">{member.name}</span>
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full">{member.role}</span>
                    </div>
                  ))}
                  {MOCK_MEMBERS.filter(m => m.name.includes(memberSearchQuery)).length === 0 && <div className="text-center py-10 text-gray-400">검색된 회원이 없습니다.</div>}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ---- DETAIL VIEW ----
  const embedUrl = (() => {
    if (!worship.youtube_url) return null;
    const match = worship.youtube_url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (match?.[1]) return `https://www.youtube.com/embed/${match[1]}?rel=0`;
    return worship.youtube_url;
  })();

  return (
    <div className="absolute inset-0 bg-white z-50 flex flex-col font-sans overflow-hidden">
      <style dangerouslySetInnerHTML={{__html: `::-webkit-scrollbar { display: none; }`}} />
      <div className="max-w-md mx-auto w-full flex flex-col h-full overflow-y-auto bg-gray-50" style={hideScrollbarStyle}>

        {/* Header */}
        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 p-4 flex items-center justify-between z-10">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-600">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-bold absolute left-1/2 -translate-x-1/2">예배 상세</h1>
          {canEdit && (
            <div className="relative">
              <button onClick={() => setShowOptions(!showOptions)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                <MoreVertical size={20} />
              </button>
              {showOptions && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowOptions(false)} />
                  <div className="absolute right-0 top-full mt-1 w-32 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-50">
                    <button onClick={() => { setShowOptions(false); setIsEditing(true); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-800 hover:bg-gray-50 transition-colors">
                      <Edit size={16} /> 수정하기
                    </button>
                    <button onClick={() => { setShowOptions(false); handleDelete(); }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors border-t border-gray-100">
                      <Trash2 size={16} /> 삭제하기
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="p-4 space-y-6 pb-12">

          {/* 기본 정보 카드 */}
          <section className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800 border-b pb-2">기본 정보</h3>

            {/* 커버 이미지 */}
            <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
              <img
                src={worship.image || 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=800'}
                alt={worship.title}
                className="w-16 h-16 rounded-lg object-cover border border-gray-200 shrink-0"
                referrerPolicy="no-referrer"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 font-medium mb-0.5">대표 커버 이미지</p>
                <p className="text-sm font-bold text-gray-800 truncate">{worship.title}</p>
                {worship.subtitle && <p className="text-xs text-gray-500 truncate">{worship.subtitle}</p>}
              </div>
            </div>

            {/* 제목 */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-400 font-medium mb-1">예배 제목</p>
              <p className="font-bold text-gray-900">{worship.title}</p>
            </div>

            {/* 부제목 */}
            {worship.subtitle && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-400 font-medium mb-1">부제목</p>
                <p className="text-gray-700">{worship.subtitle}</p>
              </div>
            )}

            {/* 날짜 + 설교자 */}
            <div className="flex gap-2">
              <div className="flex-1 bg-gray-50 p-3 rounded-lg">
                <p className="text-xs text-gray-400 font-medium mb-1">예배 날짜</p>
                <p className="font-bold text-gray-800 text-sm">{formatDate(worship.date)}</p>
              </div>
              {worship.preacher && (
                <div className="flex-1 bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-400 font-medium mb-1">설교자</p>
                  <p className="font-bold text-gray-800 text-sm">{worship.preacher}</p>
                </div>
              )}
            </div>
          </section>

          {/* 본문 말씀 */}
          {(worship.scripture || worship.scripture_content) && (
            <section className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                <BookOpen size={18} className="text-emerald-600" /> 본문 말씀
              </h3>
              {worship.scripture && (
                <p className="font-bold text-emerald-700 text-base">{worship.scripture}</p>
              )}
              {worship.scripture_content && (
                <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap bg-gray-50 p-3 rounded-lg">
                  {worship.scripture_content}
                </p>
              )}
            </section>
          )}

          {/* 예배 섬김이 */}
          {worship.participants && worship.participants.length > 0 && (
            <section className="bg-white p-5 rounded-2xl shadow-sm">
              <h3 className="font-bold text-gray-800 border-b pb-3 mb-4 flex items-center gap-2">
                <Users size={18} className="text-emerald-600" /> 예배 섬김이 입력
              </h3>
              <div className="space-y-3">
                {worship.participants.map((p: any, idx: number) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <span className="w-20 text-sm text-gray-500 font-medium truncate">{p.role}</span>
                    <div className="flex-1 bg-gray-50 p-2 rounded-lg">
                      <p className="text-sm font-bold text-gray-900">{p.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 경배와 찬양 */}
          {worship.praise && worship.praise.length > 0 && (
            <section className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                <Music size={18} className="text-emerald-600" /> 경배와찬양(콘티)
              </h3>
              <div className="space-y-3">
                {worship.praise.map((p: any, idx: number) => (
                  <a key={idx} href={p.link} target="_blank" rel="noopener noreferrer"
                    className="flex gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100 hover:border-emerald-300 transition-colors">
                    {p.thumbnail
                      ? <img src={p.thumbnail} alt="thumb" className="w-20 h-14 object-cover rounded-md" />
                      : (
                        <div className="w-20 h-14 bg-red-50 rounded-md flex items-center justify-center shrink-0">
                          <Play size={20} className="text-red-500" fill="currentColor" />
                        </div>
                      )
                    }
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <p className="text-sm font-bold text-gray-900 truncate">{p.title}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{p.link}</p>
                    </div>
                    <ChevronRight size={16} className="text-gray-400 shrink-0 self-center" />
                  </a>
                ))}
              </div>
            </section>
          )}

          {/* 예배 영상 */}
          {embedUrl && (
            <section className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                <Play size={18} className="text-red-500" fill="currentColor" /> 실시간 예배 영상
              </h3>
              <div className="rounded-xl overflow-hidden aspect-video w-full bg-gray-100">
                <iframe className="w-full h-full" src={embedUrl} title="예배 영상" frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              </div>
            </section>
          )}

          {/* 광고 */}
          {worship.announcements && worship.announcements.length > 0 && (
            <section className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
              <h3 className="font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
                <Megaphone size={18} className="text-emerald-600" /> 광고
              </h3>
              <div className="space-y-4">
                {worship.announcements.map((a: any, idx: number) => (
                  <div key={idx} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</div>
                    <div className="flex-1">
                      <p className="font-bold text-gray-900 text-sm">{a.title}</p>
                      {a.content && <p className="text-gray-500 text-sm mt-1 leading-relaxed">{a.content}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 하단 카카오톡 공유 버튼 */}
          <div className="pt-2 pb-6">
            <button 
              onClick={handleKakaoShare}
              className="w-full bg-[#FEE500] hover:bg-[#E6CF00] text-[#191919] font-bold py-4 px-6 rounded-2xl shadow-sm transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3c-5.523 0-10 3.47-10 7.75 0 2.73 1.88 5.13 4.68 6.47-.15.48-.48 1.68-.55 1.95-.09.33.12.33.26.24.11-.08 1.73-1.15 2.45-1.65 1.01.29 2.07.44 3.16.44 5.523 0 10-3.47 10-7.75S17.523 3 12 3z" />
              </svg>
              카카오톡으로 앱 주보 공유하기
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default WorshipDetailView;

