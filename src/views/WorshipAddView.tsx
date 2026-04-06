import React, { useState, useRef } from 'react';
import { 
  Search, Youtube, ArrowLeft, Plus, Trash2, 
  BookOpen, Users, Music, Megaphone, ChevronDown, ChevronUp, X, Video, Lock,
  Sparkles, Loader2, ImagePlus
} from 'lucide-react';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db as firestoreDb } from '../firebase';
import { OperationType, handleFirestoreError } from '../App';

export default function WorshipAddView({ onBack, onShowToast }: { onBack: () => void; onShowToast: (msg: string) => void }) {
  
  const NATURE_COVERS = [
    'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&q=80&w=800', 
    'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=800', 
    'https://images.unsplash.com/photo-1490750967868-88cb44cb2e1b?auto=format&fit=crop&q=80&w=800', 
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=800', 
    'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&q=80&w=800', 
    'https://images.unsplash.com/photo-1507303038446-24ee2b545f06?auto=format&fit=crop&q=80&w=800', 
    'https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&q=80&w=800'  
  ];

  const getInitialFormState = () => ({
    title: '',
    subtitle: '',
    date: new Date().toISOString().split('T')[0],
    preacher: '',
    bgUrl: NATURE_COVERS[Math.floor(Math.random() * NATURE_COVERS.length)],
    bible: { reference: '', text: '' },
    roles: [
      { role: '찬양리더', name: '' },
      { role: '싱어', name: '' },
      { role: '메인건반', name: '' },
      { role: '세컨건반', name: '' },
      { role: '일렉기타', name: '' },
      { role: '베이스기타', name: '' },
      { role: '드럼', name: '' },
      { role: '대표기도', name: '' },
      { role: '광고자', name: '' }
    ],
    songs: [],
    liveVideo: null as any,
    liveVideoSummary: '',
    announcements: [
      { title: '', content: '' }
    ],
    announcementImages: [] as string[]
  });

  const [formData, setFormData] = useState(getInitialFormState());

  const fileInputRef = useRef<HTMLInputElement>(null);
  const coverImageInputRef = useRef<HTMLInputElement>(null); 

  const [isWriteRolesOpen, setIsWriteRolesOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchError, setSearchError] = useState('');
  const [youtubeTarget, setYoutubeTarget] = useState('song');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false); 

  const [isBibleModalOpen, setIsBibleModalOpen] = useState(false);
  const [bibleQuery, setBibleQuery] = useState('');
  const [isBibleSearching, setIsBibleSearching] = useState(false);
  const [bibleResult, setBibleResult] = useState<any>(null);
  const [bibleVersion, setBibleVersion] = useState('개역개정');

  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [activeMemberTarget, setActiveMemberTarget] = useState<any>(null);

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

  const openMemberSearch = (target: any) => {
    setActiveMemberTarget(target);
    setMemberSearchQuery('');
    setIsMemberModalOpen(true);
  };

  const handleSelectMember = (member: any) => {
    if (activeMemberTarget === 'preacher') {
      handleChange({ target: { value: member.name } }, 'preacher');
    } else if (typeof activeMemberTarget === 'number') {
      handleChange({ target: { value: member.name } }, 'roles', 'name', activeMemberTarget);
    }
    setIsMemberModalOpen(false);
  };

  const handleBibleSearch = async (e: any) => {
    e.preventDefault();
    if (!bibleQuery.trim()) return;
    
    setIsBibleSearching(true);
    setBibleResult(null);
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mockDb: any = {
      "출애굽기 17:8-9": "그 때에 아말렉이 와서 이스라엘과 르비딤에서 싸우니라\n모세가 여호수아에게 이르되 우리를 위하여 사람들을 택하여 나가서 아말렉과 싸우라 내일 내가 하나님의 지팡이를 손에 잡고 산 꼭대기에 서리라",
      "출 17:8-9": "그 때에 아말렉이 와서 이스라엘과 르비딤에서 싸우니라\n모세가 여호수아에게 이르되 우리를 위하여 사람들을 택하여 나가서 아말렉과 싸우라 내일 내가 하나님의 지팡이를 손에 잡고 산 꼭대기에 서리라",
      "요한복음 3:16": "하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 그를 믿는 자마다 멸망하지 않고 영생을 얻게 하려 하심이라",
      "요 3:16": "하나님이 세상을 이처럼 사랑하사 독생자를 주셨으니 이는 그를 믿는 자마다 멸망하지 않고 영생을 얻게 하려 하심이라",
      "창세기 1:1": "태초에 하나님이 천지를 창조하시니라",
      "창 1:1": "태초에 하나님이 천지를 창조하시니라",
      "빌립보서 4:13": "내게 능력 주시는 자 안에서 내가 모든 것을 할 수 있느니라",
      "빌 4:13": "내게 능력 주시는 자 안에서 내가 모든 것을 할 수 있느니라"
    };

    const query = bibleQuery.replace(/\s+/g, ' ').trim();
    let resultText = mockDb[query];

    if (resultText) {
      const fullReference = query.replace('출 ', '출애굽기 ').replace('요 ', '요한복음 ').replace('창 ', '창세기 ').replace('빌 ', '빌립보서 ');
      setBibleResult({ reference: `${fullReference} (${bibleVersion})`, text: resultText });
    } else {
      setBibleResult({ 
        reference: `${query} (${bibleVersion})`, 
        text: "현재 테스트 버전에는 이 말씀 데이터가 없습니다.\n(테스트 가능한 구절: 요 3:16, 창 1:1, 빌 4:13, 출 17:8-9)" 
      });
    }

    setIsBibleSearching(false);
  };

  const handleSelectBible = () => {
    setFormData(prev => ({
      ...prev,
      bible: { reference: bibleResult.reference, text: bibleResult.text }
    }));
    setIsBibleModalOpen(false);
  };

  const handleSearch = async (e: any) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchError('');
    
    try {
      const API_KEY = 'AIzaSyAeJO_vSdwg79kWbh06xoeG-ItDDDBjGlc';
      const maxResults = 10;
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=${maxResults}&q=${encodeURIComponent(searchQuery)}&type=video&key=${API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) throw new Error(data.error?.message || '검색 중 오류가 발생했습니다.');

      if (data.items) {
        const results = data.items.map((item: any) => {
          const decodeHtml = (html: string) => {
            const txt = document.createElement("textarea");
            txt.innerHTML = html;
            return txt.value;
          };
          return {
            id: item.id.videoId,
            title: decodeHtml(item.snippet.title),
            channel: item.snippet.channelTitle,
            thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url
          };
        });
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    } catch (error: any) {
      setSearchError(`API 호출 오류: ${error.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectVideo = async (video: any) => {
    if (youtubeTarget === 'liveVideo') {
      setFormData(prev => ({ ...prev, liveVideo: video, liveVideoSummary: '' }));
      setIsModalOpen(false);
      
      setIsSummarizing(true);
      await new Promise(resolve => setTimeout(resolve, 2500));
      const mockSummary = `[AI 자동 요약] 오늘 예배 영상 '${video.title}'의 핵심 내용입니다.\n\n1. 도입: 하나님의 은혜와 사랑에 대한 감사 찬양으로 예배가 시작되었습니다.\n2. 본문: 오늘 말씀을 통해 우리가 일상에서 어떻게 영적 전투를 이겨낼 수 있는지 구체적인 승리 전략을 나누었습니다.\n3. 결단: 각자의 자리에서 기도로 무장하고 믿음으로 나아가는 한 주가 되기를 결단하며 마무리되었습니다.\n`;
      
      setFormData(prev => ({ ...prev, liveVideoSummary: mockSummary }));
      setIsSummarizing(false);
    } else {
      setFormData(prev => ({ ...prev, songs: [...prev.songs, video] }));
      setIsModalOpen(false);
    }
  };

  const removeVideo = (index: number) => {
    setFormData(prev => ({ ...prev, songs: prev.songs.filter((_, i) => i !== index) }));
  };

  const removeLiveVideo = () => {
    setFormData(prev => ({ ...prev, liveVideo: null, liveVideoSummary: '' }));
  };

  const handleCoverImageUpload = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsCompressing(true);

    const compressImage = (file: File): Promise<string> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event: any) => {
          const img = new Image();
          img.src = event.target.result;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800;
            let width = img.width;
            let height = img.height;

            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            resolve(compressedDataUrl);
          };
        };
      });
    };

    try {
      const compressedImage = await compressImage(file);
      setFormData(prev => ({ ...prev, bgUrl: compressedImage }));
    } catch (error) {
      console.error("커버 이미지 압축 오류:", error);
    } finally {
      setIsCompressing(false);
      if (coverImageInputRef.current) coverImageInputRef.current.value = '';
    }
  };

  const handleImageUpload = async (e: any) => {
    const files = Array.from(e.target.files as FileList);
    if (!files.length) return;

    setIsCompressing(true);

    const compressImage = (file: File): Promise<string> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event: any) => {
          const img = new Image();
          img.src = event.target.result;
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 800; 
            let width = img.width;
            let height = img.height;

            if (width > MAX_WIDTH) {
              height = Math.round((height * MAX_WIDTH) / width);
              width = MAX_WIDTH;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx?.drawImage(img, 0, 0, width, height);
            
            const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
            resolve(compressedDataUrl);
          };
        };
      });
    };

    try {
      const compressedImages = await Promise.all(files.map(compressImage));
      setFormData(prev => ({
        ...prev,
        announcementImages: [...(prev.announcementImages || []), ...compressedImages]
      }));
    } catch (error) {
      console.error("이미지 압축 오류:", error);
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeAnnouncementImage = (indexToRemove: number) => {
    setFormData(prev => ({
      ...prev,
      announcementImages: prev.announcementImages.filter((_, index) => index !== indexToRemove)
    }));
  };


  const handleChange = (e: any, section: string, field?: string, index?: number) => {
    const { value } = e.target;
    setFormData((prev: any) => {
      const newData = { ...prev };
      if (index !== undefined && field) {
        newData[section][index][field] = value;
      } else if (field) {
        newData[section][field] = value;
      } else {
        newData[section] = value;
      }
      return newData;
    });
  };

  const addAnnouncement = () => {
    setFormData(prev => ({
      ...prev,
      announcements: [...prev.announcements, { title: '', content: '' }]
    }));
  };

  const handleSubmitFirebase = async () => {
    if (!formData.title) {
        onShowToast("예배 제목을 입력해주세요.");
        return;
    }
    
    try {
      await addDoc(collection(firestoreDb, 'worships'), {
        title: formData.title,
        subtitle: formData.subtitle || '',
        date: Timestamp.fromDate(new Date(formData.date || new Date().toISOString())),
        image: formData.bgUrl,
        youtube_url: formData.liveVideo ? `https://www.youtube.com/watch?v=${formData.liveVideo.id}` : '',
        liveVideoData: formData.liveVideo || null,
        liveVideoSummary: formData.liveVideoSummary || '',
        scripture: formData.bible?.reference || '',
        scripture_content: formData.bible?.text || '',
        preacher: formData.preacher || '',
        participants: formData.roles.map((r:any) => ({ role: r.role, name: r.name })) || [],
        praise: formData.songs.map((s:any) => ({ title: s.title, link: `https://www.youtube.com/watch?v=${s.id}`, thumbnail: s.thumbnail })) || [],
        announcements: formData.announcements || [],
        announcementImages: formData.announcementImages || [],
        status: 'published',
        view_count: 0,
        createdAt: Timestamp.now(),
      });
      onShowToast('새 예배 정보가 성공적으로 등록 및 반영되었습니다.');
      onBack();
    } catch (err: any) {
      handleFirestoreError(err, OperationType.WRITE, 'worships');
    }
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '날짜 미지정';
    const parts = dateString.split('-');
    if (parts.length === 3) {
      return `${parts[0]}년 ${parseInt(parts[1], 10)}월 ${parseInt(parts[2], 10)}일`;
    }
    return dateString;
  };

  const isAfterWorship = (dateString: string) => {
    if (!dateString) return false;
    const worshipDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    worshipDate.setHours(0, 0, 0, 0);
    return today >= worshipDate;
  };

  const hideScrollbarStyle = {
    msOverflowStyle: 'none', 
    scrollbarWidth: 'none', 
  } as React.CSSProperties;

  const isLiveActive = isAfterWorship(formData.date);

  return (
    <div className="absolute inset-0 bg-white z-[60] flex flex-col font-sans overflow-hidden min-h-screen pb-10">
      <style dangerouslySetInnerHTML={{__html: `
        ::-webkit-scrollbar { display: none; }
      `}} />
      <div className="max-w-md mx-auto bg-gray-50 flex-1 overflow-y-auto pb-24 w-full" style={hideScrollbarStyle}>
        
        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 p-4 flex justify-between items-center z-10 w-full">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-600 z-10">
            <ArrowLeft size={24} />
          </button>
          <h2 className="text-lg font-bold absolute left-1/2 -translate-x-1/2">예배 일정 등록</h2>
          <div className="w-8"></div>
        </div>

        <div className="p-4 space-y-6">
          <section className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800 border-b pb-2">기본 정보</h3>
            
            <div className="flex items-center gap-4 bg-gray-50 p-3 rounded-xl border border-gray-100">
              <img src={formData.bgUrl} alt="커버" className="w-16 h-16 rounded-lg object-cover border border-gray-200 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-800 mb-1">대표 커버 이미지</p>
                <button 
                  onClick={() => coverImageInputRef.current?.click()} 
                  className="text-xs bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium hover:bg-gray-50 transition-colors"
                >
                  {isCompressing ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />}
                  {isCompressing ? '처리 중...' : '이미지 변경'}
                </button>
                <input type="file" accept="image/*" className="hidden" ref={coverImageInputRef} onChange={handleCoverImageUpload} />
              </div>
            </div>

            <input type="text" placeholder="예배 제목 (예: 이것이 싸우는 방식)" value={formData.title} onChange={(e) => handleChange(e, 'title')} className="w-full bg-gray-50 p-3 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" />
            <input type="text" placeholder="부제목 (예: 모세의 승리 전략)" value={formData.subtitle} onChange={(e) => handleChange(e, 'subtitle')} className="w-full bg-gray-50 p-3 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" />
            <div className="flex gap-2">
              <input type="date" value={formData.date} onChange={(e) => handleChange(e, 'date')} className="w-full bg-gray-50 p-3 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20 text-gray-700" />
              <div className="relative w-full">
                <input type="text" placeholder="설교자 직접입력/검색" value={formData.preacher} onChange={(e) => handleChange(e, 'preacher')} className="w-full bg-gray-50 p-3 pr-10 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" />
                <button onClick={() => openMemberSearch('preacher')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-emerald-600 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors">
                  <Search size={14} />
                </button>
              </div>
            </div>
          </section>

          <section className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800 border-b pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2"><BookOpen size={18} className="text-emerald-600"/> 본문 말씀</div>
              <button onClick={() => { setBibleQuery(''); setBibleResult(null); setIsBibleModalOpen(true); }} className="text-xs bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full flex items-center gap-1 font-bold">
                <Search size={14} /> 말씀 찾기
              </button>
            </h3>
            <input type="text" placeholder="말씀 구절 (예: 출애굽기 17:8-9)" value={formData.bible.reference} onChange={(e) => handleChange(e, 'bible', 'reference')} className="w-full bg-gray-50 p-3 rounded-lg outline-none font-bold text-emerald-700" />
            <textarea placeholder="말씀 내용" value={formData.bible.text} onChange={(e) => handleChange(e, 'bible', 'text')} className="w-full bg-gray-50 p-3 rounded-lg outline-none min-h-[100px] resize-none leading-relaxed" />
          </section>

          <section className="bg-white p-5 rounded-2xl shadow-sm">
            <div 
              className={`flex items-center justify-between cursor-pointer select-none ${isWriteRolesOpen ? 'border-b pb-4 mb-4' : ''}`}
              onClick={() => setIsWriteRolesOpen(!isWriteRolesOpen)}
            >
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <Users size={18} className="text-emerald-600"/> 예배 섬김이 입력
                {!isWriteRolesOpen && <span className="text-xs font-normal text-gray-400 ml-2">(터치하여 펼치기)</span>}
              </h3>
              {isWriteRolesOpen ? <ChevronUp size={20} className="text-gray-400"/> : <ChevronDown size={20} className="text-gray-400"/>}
            </div>
            
            {isWriteRolesOpen && (
              <div className="space-y-3">
                {formData.roles.map((item, idx) => (
                  <div key={idx} className="flex gap-2 items-center">
                    <span className="w-20 text-sm text-gray-600 font-medium">{item.role}</span>
                    <div className="flex-1 relative">
                      <input type="text" placeholder="이름 직접입력/검색" value={item.name} onChange={(e) => handleChange(e, 'roles', 'name', idx)} className="w-full bg-gray-50 p-2 pr-10 rounded-lg outline-none focus:ring-2 focus:ring-emerald-500/20" />
                      <button onClick={() => openMemberSearch(idx)} className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 text-emerald-600 bg-emerald-100 hover:bg-emerald-200 rounded-md transition-colors">
                        <Search size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800 border-b pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2"><Music size={18} className="text-emerald-600"/> 경배와찬양(콘티)</div>
              <button onClick={() => { setYoutubeTarget('song'); setSearchQuery(''); setSearchResults([]); setIsModalOpen(true); }} className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-full flex items-center gap-1 font-bold">
                <Youtube size={14} /> 유튜브 검색
              </button>
            </h3>
            
            <div className="space-y-3">
              {formData.songs.map((song: any, idx: number) => (
                <div key={idx} className="flex gap-3 bg-gray-50 p-3 rounded-xl relative border border-gray-100">
                  <img src={song.thumbnail} alt="thumb" className="w-20 h-14 object-cover rounded-md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{song.title}</p>
                    <p className="text-xs text-gray-500 truncate">{song.channel}</p>
                  </div>
                  <button onClick={() => removeVideo(idx)} className="p-2 text-gray-400 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {formData.songs.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-xl">추가된 찬양이 없습니다.</p>
              )}
            </div>
          </section>

          <section className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800 border-b pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2"><Video size={18} className="text-emerald-600"/> 실시간 예배 영상</div>
              <button 
                onClick={() => { setYoutubeTarget('liveVideo'); setSearchQuery(''); setSearchResults([]); setIsModalOpen(true); }}
                disabled={!isLiveActive}
                className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1 font-bold transition-colors ${isLiveActive ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
              >
                {isLiveActive ? <Youtube size={14} /> : <Lock size={14} />}
                영상 추가
              </button>
            </h3>
            
            {!isLiveActive ? (
              <p className="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-xl">지정된 예배 날짜({formData.date ? formatDisplayDate(formData.date) : '미정'}) 이후에 영상을 추가할 수 있습니다.</p>
            ) : formData.liveVideo ? (
              <div className="space-y-4">
                <div className="flex gap-3 bg-gray-50 p-3 rounded-xl relative border border-gray-100">
                  <img src={formData.liveVideo.thumbnail} alt="thumb" className="w-24 h-16 object-cover rounded-md" />
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="text-sm font-bold text-gray-900 truncate">{formData.liveVideo.title}</p>
                    <p className="text-xs text-gray-500 truncate">{formData.liveVideo.channel}</p>
                  </div>
                  <button onClick={removeLiveVideo} className="p-2 text-gray-400 hover:text-red-500">
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="bg-[#f8f9ff] border border-indigo-100 p-4 rounded-xl relative">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={16} className="text-indigo-500" />
                    <span className="font-bold text-sm text-indigo-700">AI 영상 요약</span>
                    {isSummarizing && <Loader2 size={14} className="text-indigo-500 animate-spin" />}
                  </div>
                  {isSummarizing ? (
                    <div className="text-sm text-indigo-400 flex flex-col items-center py-6 gap-2">
                      <Loader2 size={24} className="animate-spin" />
                      <span>영상을 분석하고 요약하는 중입니다...</span>
                    </div>
                  ) : (
                    <textarea 
                      value={formData.liveVideoSummary} 
                      onChange={(e) => handleChange(e, 'liveVideoSummary')} 
                      placeholder="AI가 요약한 내용이 이곳에 표시됩니다. 자유롭게 수정할 수 있습니다."
                      className="w-full bg-white/50 border border-indigo-50 p-3 rounded-lg outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 text-sm leading-relaxed min-h-[120px] resize-none text-gray-700" 
                    />
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4 bg-gray-50 rounded-xl">유튜브에서 예배 녹화본을 검색하여 등록해주세요.</p>
            )}
          </section>

          <section className="bg-white p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-gray-800 flex items-center gap-2"><Megaphone size={18} className="text-emerald-600"/> 광고</h3>
              <div className="flex gap-2">
                <button onClick={() => fileInputRef.current?.click()} className="text-xs bg-gray-100 text-gray-600 hover:bg-gray-200 px-3 py-1.5 rounded-full flex items-center gap-1 font-bold transition-colors">
                  {isCompressing ? <Loader2 size={14} className="animate-spin" /> : <ImagePlus size={14} />} 
                  {isCompressing ? '압축 중...' : '이미지 첨부'}
                </button>
                <input type="file" multiple accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                
                <button onClick={addAnnouncement} className="text-xs bg-emerald-50 text-emerald-600 hover:bg-emerald-100 px-3 py-1.5 rounded-full font-bold transition-colors">텍스트 추가</button>
              </div>
            </div>

            {formData.announcementImages && formData.announcementImages.length > 0 && (
              <div className="flex overflow-x-auto gap-3 pb-2 snap-x snap-mandatory" style={hideScrollbarStyle}>
                {formData.announcementImages.map((imgSrc: string, idx: number) => (
                  <div key={idx} className="relative shrink-0 w-32 h-32 snap-start border border-gray-200 rounded-xl overflow-hidden bg-gray-50">
                    <img src={imgSrc} alt="광고 이미지" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => removeAnnouncementImage(idx)} 
                      className="absolute top-1 right-1 p-1.5 bg-black/50 hover:bg-red-500 text-white rounded-full transition-colors backdrop-blur-sm"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {formData.announcements.map((ann, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</div>
                <div className="flex-1 space-y-2">
                  <input type="text" placeholder="광고 제목" value={ann.title} onChange={(e) => handleChange(e, 'announcements', 'title', idx)} className="w-full bg-gray-50 p-2 rounded-lg outline-none text-sm font-bold" />
                  <input type="text" placeholder="상세 내용" value={ann.content} onChange={(e) => handleChange(e, 'announcements', 'content', idx)} className="w-full bg-gray-50 p-2 rounded-lg outline-none text-sm" />
                </div>
              </div>
            ))}
          </section>

          <div className="pt-4 pb-8">
            <button 
              onClick={handleSubmitFirebase} 
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl shadow-md shadow-emerald-600/20 transition-all active:scale-[0.98] text-lg"
            >
              예배 등록 저장하기
            </button>
          </div>
        </div>

      </div>

        {/* 모달 영역 외부 레이아웃 고정 */}
        {isModalOpen && (
          <div className="absolute inset-0 bg-black/60 flex items-end justify-center z-50 sm:rounded-3xl overflow-hidden">
            <div className="bg-white w-full h-[85vh] rounded-t-3xl flex flex-col">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2"><Youtube className="text-red-500" size={20}/> 유튜브 영상 검색</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1"><X size={20}/></button>
              </div>
              <div className="p-4 border-b bg-gray-50">
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="검색어를 입력하세요..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-red-400" />
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
                 ) : <div className="text-center py-10 text-gray-400">제목을 검색하고 선택하세요.</div>
                }
              </div>
            </div>
          </div>
        )}

        {isMemberModalOpen && (
          <div className="absolute inset-0 bg-black/60 flex items-end justify-center z-50 sm:rounded-3xl overflow-hidden">
            <div className="bg-white w-full h-[70vh] rounded-t-3xl flex flex-col">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2"><Users className="text-emerald-600" size={20}/> 회원 검색</h3>
                <button onClick={() => setIsMemberModalOpen(false)} className="p-1"><X size={20}/></button>
              </div>
              <div className="p-4 border-b bg-gray-50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input type="text" value={memberSearchQuery} onChange={(e) => setMemberSearchQuery(e.target.value)} placeholder="회원 이름 검색..." className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-emerald-500" />
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
                  {MOCK_MEMBERS.filter(m => m.name.includes(memberSearchQuery)).length === 0 && (
                     <div className="text-center py-10 text-gray-400">검색된 회원이 없습니다.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {isBibleModalOpen && (
          <div className="absolute inset-0 bg-black/60 flex items-end justify-center z-50 sm:rounded-3xl overflow-hidden">
            <div className="bg-white w-full h-[85vh] rounded-t-3xl flex flex-col">
              <div className="p-4 border-b flex justify-between items-center">
                <h3 className="font-bold flex items-center gap-2"><BookOpen className="text-emerald-600" size={20}/> 성경 말씀 찾기</h3>
                <button onClick={() => setIsBibleModalOpen(false)} className="p-1"><X size={20}/></button>
              </div>
              <div className="p-4 border-b bg-gray-50">
                <form onSubmit={handleBibleSearch} className="flex gap-2 mb-3">
                  <select 
                    value={bibleVersion} 
                    onChange={(e) => setBibleVersion(e.target.value)}
                    className="bg-white border border-gray-200 rounded-xl px-2 py-2.5 text-sm font-medium text-gray-700 outline-none focus:border-emerald-500"
                  >
                    <option value="개역개정">개역개정</option>
                    <option value="새번역">새번역</option>
                    <option value="NIV">NIV</option>
                  </select>
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input type="text" value={bibleQuery} onChange={(e) => setBibleQuery(e.target.value)} placeholder="예: 요 3:16" className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-emerald-500" />
                  </div>
                  <button type="submit" className="px-5 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors">검색</button>
                </form>
                <div className="flex gap-2 flex-wrap">
                  <span className="text-xs text-gray-500 font-medium">빠른 검색:</span>
                  {['요 3:16', '창 1:1', '빌 4:13', '출 17:8-9'].map(q => (
                    <button key={q} type="button" onClick={() => setBibleQuery(q)} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-md hover:bg-gray-300">
                      {q}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 bg-gray-50" style={hideScrollbarStyle}>
                {isBibleSearching ? (
                  <div className="text-center py-10 text-gray-500">말씀을 찾는 중...</div>
                ) : bibleResult ? (
                  <div className="bg-white border border-gray-200 p-5 rounded-2xl shadow-sm">
                    <h4 className="font-bold text-lg text-emerald-700 mb-3">{bibleResult.reference}</h4>
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">{bibleResult.text}</p>
                    <button onClick={handleSelectBible} className="mt-6 w-full py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-bold transition-colors">
                      이 말씀 본문에 넣기
                    </button>
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

    </div>
  );
}
