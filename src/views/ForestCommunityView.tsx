import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, type PanInfo } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  X, ChevronLeft, ChevronRight, Volume2, VolumeX, Pause, Loader2,
  Plus, Send, Type, Check, Image as ImageIcon, Upload, CornerDownRight,
  Megaphone, PenTool, Smile, Trash2, BookOpen,
} from 'lucide-react';

import { toJpeg } from 'html-to-image';

import {
  collection, 
  addDoc, 
  setDoc, 
  doc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  serverTimestamp,
  Timestamp,
  updateDoc,
  arrayUnion,
  arrayRemove,
  deleteDoc
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';

// Helper to upload base64 to Storage
async function uploadImage(base64: string, path: string): Promise<string> {
  const res = await fetch(base64);
  const blob = await res.blob();
  const storageRef = ref(storage, path);
  const uploadTask = await uploadBytesResumable(storageRef, blob);
  return await getDownloadURL(uploadTask.ref);
}


function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }


function getEmojiSvgUrl(emoji: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="80">${emoji}</text></svg>`;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

function getCurrentWeekInfo() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const weekNum = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 7));
  return { weekNum, forest: FORESTS[weekNum % FORESTS.length] };
}

function formatTimestamp(ts: string) {
  const diff = Date.now() - new Date(ts).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '방금 전';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

const DEFAULT_DUR = 5000;
const GRADIENTS = [
  'linear-gradient(135deg,#10b981,#059669)',
  'linear-gradient(135deg,#f59e0b,#d97706)',
  'linear-gradient(135deg,#ef4444,#b91c1c)',
  'linear-gradient(135deg,#ec4899,#be185d)',
  'linear-gradient(135deg,#8b5cf6,#6d28d9)',
  'linear-gradient(135deg,#3b82f6,#1d4ed8)',
  'linear-gradient(135deg,#374151,#111827)',
];
const ANIMALS = ['🦊','🐻','🐰','🦌','🦉','🐱','🐿️','🦔'];

interface Story { id:string; forestId?:string; timestamp?:string; type:'image'|'video'|'text'; src?:string; duration?:number; textContent?:string; bgGradient?:string; reactions?:Record<string, string[]>; userId?:string; }
interface ChatMsg { id:string; senderName:string; avatar:string; text:string; timestamp:string; isMe?:boolean; imageUrl?:string; replyTo?:{senderName:string;text:string}; userId?:string; }
interface ColumnData { title:string; content:string; authorName:string; authorRealName:string; authorRole:string; authorAvatar:string; timestamp:string; claps:number; userId?:string; }
interface UserProfile { username:string; realName:string; avatar:string; }
interface Forest { id:string; name:string; emoji:string; count:number; image:string; }

const FORESTS: Forest[] = [
  { id:'bebe', name:'베베숲', emoji:'👶', count:1, image:'https://i.postimg.cc/T1nHzgcx/Kakao_Talk_20251027_142153350_03.png' },
  { id:'power', name:'숲퍼파워', emoji:'💪', count:0, image:'https://i.postimg.cc/jjjmDWRM/Chat_GPT_Image_2025%EB%85%84_10%EC%9B%94_27%EC%9D%BC_%EC%98%A4%ED%9B%84_02_20_08.png' },
  { id:'mance', name:'숲퍼맨', emoji:'🦸', count:0, image:'https://i.postimg.cc/50hRKnLG/Kakao_Talk_20251027_142153350.png' },
  { id:'bts', name:'B.T.S', emoji:'🌟', count:0, image:'https://i.postimg.cc/76GRNpGg/Kakao_Talk_20251026_193523088.png' },
  { id:'sky', name:'하늘숲', emoji:'☁️', count:0, image:'https://i.postimg.cc/Y95sDbQ0/Kakao_Talk_20251027_142153350_01.png' },
  { id:'bamboo', name:'대나무숲', emoji:'🎋', count:0, image:'https://i.postimg.cc/SRctBCGm/%EB%8C%80%EB%82%98%EB%AC%B4%EC%88%B2.png' },
  { id:'warm', name:'따숲', emoji:'☕', count:0, image:'https://i.postimg.cc/ZKkGwKLB/Chat_GPT_Image_2025%EB%85%84_10%EC%9B%94_27%EC%9D%BC_%EC%98%A4%ED%9B%84_02_15_51.png' },
  { id:'green', name:'푸른숲', emoji:'🌲', count:0, image:'https://i.postimg.cc/0j7HTDCx/Kakao_Talk_20251027_142153350_02.png' },
  { id:'quiet', name:'고요숲', emoji:'🤫', count:0, image:'https://i.postimg.cc/QCcn21qh/%EA%B3%A0%EC%9A%94%EC%88%B2.jpg' },
  { id:'supreme', name:'숲프림', emoji:'👑', count:0, image:'https://i.postimg.cc/QCcn21qr/Kakao_Talk_20251027_142153350_04.png' },
  { id:'cherry', name:'숲타트', emoji:'🌸', count:0, image:'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400&h=400&fit=crop' },
];

const INIT_STORIES: Record<string, Story[]> = {
  bebe:[{id:'bebe-s1',type:'image',src:FORESTS[0].image}],
  bamboo:[{id:'bam-s1',type:'image',src:FORESTS[5].image}],
};

const INIT_CHATS: Record<string, ChatMsg[]> = {
  bebe:[{id:'msg-1',senderName:'시스템',avatar:getEmojiSvgUrl('🦉'),text:'베베숲에 오신 것을 환영합니다!',timestamp:new Date(Date.now()-7200000).toISOString()}],
};

// ──────────────────────────────────────────────────
// PROFILE SETUP
// ──────────────────────────────────────────────────
function ProfileSetup({ onComplete }: { onComplete:(p:UserProfile)=>void }) {
  const [username, setUsername] = useState('');
  const [realName, setRealName] = useState('');
  const [animal, setAnimal] = useState(ANIMALS[0]);
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <motion.div initial={{scale:0.9,y:20}} animate={{scale:1,y:0}} transition={{type:'spring',damping:25}}
        className="bg-white w-full max-w-sm rounded-[2rem] p-8 shadow-xl border border-slate-100 flex flex-col items-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mb-4">🌲</div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">숲에 오신 것을 환영해요</h1>
        <p className="text-sm text-slate-500 mb-8 text-center">닉네임과 동물을 선택해 주세요!</p>
        <div className="w-full space-y-6">
          <div className="flex flex-wrap justify-center gap-3">
            {ANIMALS.map(a=>(
              <button key={a} onClick={()=>setAnimal(a)}
                className={cn('w-12 h-12 rounded-full border-2 flex items-center justify-center text-2xl transition-all',
                  animal===a?'border-emerald-500 scale-110 shadow-md bg-emerald-50':'border-slate-200 opacity-60 hover:opacity-100')}>
                {a}
              </button>
            ))}
          </div>
          <div className="space-y-3">
            <input type="text" value={realName} onChange={e=>setRealName(e.target.value)} placeholder="실명 (예: 이홍규)"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-bold"/>
            <input type="text" value={username} onChange={e=>setUsername(e.target.value)} placeholder="닉네임 (예: 숲속다람쥐)"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50 font-bold" maxLength={10}/>
          </div>
          <button onClick={()=>{if(username.trim()&&realName.trim()) onComplete({username:username.trim(),realName:realName.trim(),avatar:getEmojiSvgUrl(animal)});}}
            disabled={!username.trim()||!realName.trim()}
            className="w-full bg-emerald-500 text-white font-bold py-4 rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-colors shadow-sm">
            시작하기
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────
// STORY THUMBNAIL
// ──────────────────────────────────────────────────
function StoryThumb({stories,username,viewed,onClick}:{stories:Story[];username:string;viewed:Set<number>;onClick:()=>void}) {
  const n=stories.length, gap=n>1?12:0, seg=(360-gap*n)/n;
  const allViewed=viewed.size===n;
  const last=stories[n-1]||stories[0];
  if(!last) return null;
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-2 group">
      <div className="relative w-[72px] h-[72px]">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
          {stories.map((_,i)=>{
            const s=-90+i*(seg+gap), e=s+seg;
            const sr=(s*Math.PI)/180, er=(e*Math.PI)/180, r=46;
            const x1=50+r*Math.cos(sr),y1=50+r*Math.sin(sr);
            const x2=50+r*Math.cos(er),y2=50+r*Math.sin(er);
            return <path key={i} d={`M ${x1} ${y1} A ${r} ${r} 0 ${seg>180?1:0} 1 ${x2} ${y2}`}
              fill="none" strokeWidth="5" strokeLinecap="round"
              className={viewed.has(i)||allViewed?'stroke-slate-200':'stroke-emerald-500'}/>;
          })}
        </svg>
        <div className="absolute inset-[5px] rounded-full bg-white p-[2px]">
          <div className="w-full h-full rounded-full overflow-hidden bg-slate-100">
            {last.type==='text'
              ? <div className="w-full h-full flex items-center justify-center p-1" style={{background:last.bgGradient||GRADIENTS[0]}}>
                  <span className="text-white text-[9px] font-bold text-center break-words line-clamp-3">{last.textContent}</span>
                </div>
              : <img src={last.src} alt={username} className="w-full h-full object-cover"/>}
          </div>
        </div>
      </div>
      <span className="text-xs text-slate-700 font-medium truncate max-w-[80px]">{username}</span>
    </button>
  );
}

// ──────────────────────────────────────────────────
// STORY VIEWER MODAL (simple)
// ──────────────────────────────────────────────────
function StoryViewerModal({stories,username,avatar,initialIndex,onClose,onStoryChange,onReact,uid,onDeleteStory}:
  {stories:Story[];username:string;avatar:string;initialIndex:number;onClose:()=>void;onStoryChange:(i:number)=>void;onReact?:(storyId:string,emoji:string)=>void;uid?:string;onDeleteStory?:(id:string)=>void}) {
  const [idx,setIdx]=useState(initialIndex);
  const [progress,setProgress]=useState(0);
  const [ready,setReady]=useState(false);
  const story=stories[idx];
  const dur=story?.duration||DEFAULT_DUR;

  useEffect(()=>{setProgress(0);setReady(false);},[idx]);
  
  useEffect(()=>{
    if(!ready||story?.type==='video') return;
    const start=Date.now();
    const t=setInterval(()=>{
      const p=Math.min(((Date.now()-start)/dur)*100,100);
      setProgress(p);
      if(p>=100){idx<stories.length-1?goNext():onClose();}
    },50);
    return()=>clearInterval(t);
  },[ready,idx]);

  const goNext=()=>{if(idx<stories.length-1){const n=idx+1;setIdx(n);onStoryChange(n);}else onClose();};
  const goPrev=()=>{if(idx>0){const n=idx-1;setIdx(n);onStoryChange(n);}};

  if(!story) return null;
  return (
    <motion.div className="fixed inset-0 z-[100] bg-black flex items-center justify-center"
      initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
      <div className="relative w-full h-full max-w-lg flex flex-col">
        <div className="absolute top-0 left-0 right-0 z-10 pt-2 pb-4 bg-gradient-to-b from-black/60 to-transparent">
          <div className="flex gap-1 px-2">
            {stories.map((_,i)=>(
              <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
                <motion.div className="h-full bg-white rounded-full"
                  animate={{width:i<idx?'100%':i===idx?`${progress}%`:'0%'}}
                  transition={{duration:0.1,ease:'linear'}}/>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between px-4 mt-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full overflow-hidden bg-white/20 flex items-center justify-center">
                <img src={avatar} alt={username} className="w-6 h-6 object-contain"/>
              </div>
              <span className="text-white text-sm font-medium">{username}</span>
            </div>
            {story.userId === uid && onDeleteStory && (
                <button onClick={(e) => { e.stopPropagation(); if(window.confirm('스토리를 삭제하시겠습니까?')) { onDeleteStory(story.id); onClose(); } }} 
                  className="p-2 text-white/70 hover:bg-red-500/80 hover:text-white bg-black/20 rounded-full transition-colors mr-2">
                  <Trash2 size={16}/>
                </button>
              )}
              <button onClick={onClose} className="p-2 text-white hover:bg-white/20 rounded-full bg-black/20"><X size={18}/></button>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center" onClick={(e)=>{
          const r=e.currentTarget.getBoundingClientRect();
          e.clientX-r.left<r.width/2?goPrev():goNext();
        }}>
          {story.type==='text'
            ? <div className="w-full h-full flex items-center justify-center p-8" style={{background:story.bgGradient||GRADIENTS[0]}}>
                <p className="text-white text-3xl font-bold text-center">{story.textContent}</p>
                <img src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==" onLoad={()=>setReady(true)} className="hidden" alt=""/>
              </div>
            : <img src={story.src} alt="" className="w-full h-full object-contain" onLoad={()=>setReady(true)}/>}
        </div>
        <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-6 z-30 pointer-events-none">
          {['❤️','🙏','👏'].map(emoji => {
            const reacts = story.reactions?.[emoji] || [];
            const count = reacts.length;
            const hasReacted = uid && reacts.includes(uid);
            return (
              <button key={emoji} onClick={(e)=>{e.stopPropagation();onReact?.(story.id,emoji);}}
                className={cn('pointer-events-auto flex flex-col items-center justify-center w-[52px] h-[70px] rounded-full bg-black/40 backdrop-blur-md transition-transform active:scale-95 border border-white/10',
                  hasReacted?'bg-emerald-500/80 shadow-[0_0_15px_rgba(16,185,129,0.5)] border-emerald-400 text-white':'text-white/90')}
                style={{ WebkitTapHighlightColor:'transparent' }}>
                <span className="text-[28px] mb-1 leading-none drop-shadow-md">{emoji}</span>
                {count>0&&<span className="text-white text-[11px] font-bold">{count}</span>}
              </button>
            )
          })}
        </div>
      </div>
    </motion.div>
  );
}

function StoryViewer({stories,username,avatar,onReact,uid,onDeleteStory}: {stories:Story[];username:string;avatar:string;onReact?:(storyId:string,emoji:string)=>void;uid?:string;key?:string;onDeleteStory?:(id:string)=>void}) {

  const [open,setOpen]=useState(false);
  const [viewed,setViewed]=useState<Set<number>>(()=>new Set());
  const first=useMemo(()=>{for(let i=0;i<stories.length;i++)if(!viewed.has(i))return i;return 0;},[stories,viewed]);
  return (
    <>
      <StoryThumb stories={stories} username={username} viewed={viewed} onClick={()=>setOpen(true)}/>
      <AnimatePresence>
        {open&&<StoryViewerModal stories={stories} username={username} avatar={avatar}
          initialIndex={first} onClose={()=>setOpen(false)}
          onStoryChange={i=>setViewed(prev=>new Set([...prev,i]))}
          onReact={onReact} uid={uid} onDeleteStory={onDeleteStory}/>}
      </AnimatePresence>
    </>
  );
}

// ──────────────────────────────────────────────────
// FOREST CAROUSEL
// ──────────────────────────────────────────────────
function ForestCarousel({items,onItemClick,dutyForestId}:{items:{id:string;name:string;src:string;emoji:string}[];onItemClick:(id:string)=>void;dutyForestId?:string}) {
  const [cur,setCur]=useState(Math.floor(items.length/2));
  const handleDrag=(_:any,info:PanInfo)=>{
    if(info.offset.x<-40||info.velocity.x<-400) setCur(p=>Math.min(items.length-1,p+1));
    else if(info.offset.x>40||info.velocity.x>400) setCur(p=>Math.max(0,p-1));
  };
  return (
    <motion.div className="relative w-full h-[280px] flex flex-col items-center justify-center touch-none cursor-grab active:cursor-grabbing"
      drag="x" dragConstraints={{left:0,right:0}} dragElastic={0.1} onDragEnd={handleDrag}>
      <div className="relative w-full h-40 flex items-center justify-center pointer-events-none mt-2">
        {items.map((item,i)=>{
          const off=i-cur, abs=Math.abs(off), active=off===0;
          const isDuty = item.id === dutyForestId;
          return (
            <motion.div key={item.id} className="absolute flex flex-col items-center pointer-events-auto cursor-pointer"
              animate={{x:off*85,scale:active?1.3:Math.max(0.6,1-abs*0.15),opacity:active?1:Math.max(0,0.8-abs*0.25),zIndex:20-abs}}
              transition={{type:'spring',stiffness:350,damping:30}}
              onClick={()=>active?onItemClick(item.id):setCur(i)}>
              <div className="relative">
                <div className={cn('w-[80px] h-[80px] rounded-full overflow-hidden transition-all',
                  active?'border-[3px] border-emerald-500 ring-4 ring-emerald-500/20 shadow-[0_8px_20px_rgba(16,185,129,0.3)]':'border-2 border-white shadow-sm',
                  isDuty&&!active?'ring-2 ring-amber-400':''
                )}>
                  <img src={item.src} alt={item.name} className="w-full h-full object-cover bg-slate-100" draggable={false}/>
                </div>
                {isDuty && (
                  <div className="absolute -top-3 -right-2 bg-amber-400 text-[14px] leading-none p-1.5 rounded-full shadow-md border-2 border-white transform rotate-12 z-50 animate-bounce">
                    👑
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="mt-16 h-16 flex flex-col items-center justify-center pointer-events-none z-10">
        <AnimatePresence mode="wait">
          <motion.div key={items[cur]?.id} initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-10}} transition={{duration:0.2}} className="flex flex-col items-center">
            <span className="font-bold text-emerald-700 text-[15px] bg-white/90 px-4 py-1.5 rounded-full shadow-sm border border-emerald-100">{items[cur]?.name}</span>
            <p className="text-[11px] font-medium text-slate-400 mt-2 bg-slate-100/80 px-3 py-1 rounded-full">터치해서 입장하기</p>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────
// WEEKLY COLUMN CARD
// ──────────────────────────────────────────────────
function WeeklyColumnCard({weekInfo,columnData,onClick,isEmpty,onWrite}:{weekInfo:{weekNum:number;forest:Forest};columnData?:ColumnData;onClick?:()=>void;isEmpty?:boolean;onWrite?:()=>void}) {
  const f=weekInfo.forest;
  if(isEmpty) {
    return (
      <div className="w-full bg-slate-50 rounded-[2rem] overflow-hidden flex relative border-2 border-dashed border-slate-200 h-40 group cursor-pointer hover:bg-emerald-50 transition-colors" onClick={onWrite}>
        <div className="relative z-10 p-5 flex flex-col justify-center items-center w-full h-full text-center">
          <div className="w-14 h-14 mb-3 bg-white rounded-full flex items-center justify-center border-2 border-slate-200 shadow-sm group-hover:border-emerald-300 group-hover:text-emerald-500 transition-all text-slate-400">
            <Plus size={28} className="group-hover:scale-110 transition-transform"/>
          </div>
          <p className="text-[13px] font-bold text-slate-400 group-hover:text-emerald-600 transition-colors leading-relaxed">이번 주 <strong className="text-emerald-600">'{f.name}'</strong> 담당자가<br/>터치해서 작성해 주세요</p>
        </div>
      </div>
    );
  }
  return (
    <div onClick={onClick} className="w-full bg-[#F3E8DA] rounded-[2rem] overflow-hidden flex relative shadow-sm border border-[#E6E2D6]/50 cursor-pointer hover:shadow-md transition-shadow h-40">
      <div className="absolute right-0 top-0 bottom-0 w-[55%]">
        <img src={f.image} alt={f.name} className="w-full h-full object-cover"/>
        <div className="absolute inset-0 bg-gradient-to-r from-[#F3E8DA] via-[#F3E8DA]/90 to-transparent"/>
      </div>
      <div className="relative z-10 p-5 flex flex-col justify-between w-[85%] h-full">
        <div>
          <div className="bg-[#8C5E45] text-white text-[10px] font-bold px-3 py-1.5 rounded-full w-fit mb-2 shadow-sm">{f.name} 이야기</div>
          <h3 className="text-[15px] font-bold text-[#5A3F2C] leading-snug break-keep line-clamp-2 pr-2">
            {columnData?columnData.title:`${f.name}에서 이번 주 칼럼 담당자를 정하고 있어요!`}
          </h3>
        </div>
        {columnData
          ? <div className="flex items-center gap-2 mt-auto">
              <div className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-white p-0.5 shrink-0 shadow-sm">
                <img src={columnData.authorAvatar} className="w-full h-full object-contain" alt="author"/>
              </div>
              <div>
                <span className="text-[12px] font-bold text-[#5A3F2C]">{columnData.authorName}</span>
                <span className="block text-[10px] text-[#8C5E45]/80">{columnData.authorRole}</span>
              </div>
            </div>
          : <div className="mt-auto text-[11px] text-[#8C5E45]/60 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin"/> 담당자 대기 중...</div>}
      </div>
    </div>
  );
}

function StoryUploadModal({isOpen,onClose,onUpload}:{isOpen:boolean;onClose:()=>void;onUpload:(d:any)=>void}) {
  const [mode,setMode]=useState<'text'|'image'>('text');
  const [text,setText]=useState('');
  const [grad,setGrad]=useState(GRADIENTS[0]);
  const [imgSrc,setImgSrc]=useState<string|null>(null);
  
  const [overlays, setOverlays] = useState<{id:string; type:'text'|'emoji'; content:string}[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(()=>{
    if(isOpen){
      setText('');setImgSrc(null);setMode('text');setOverlays([]);setIsCapturing(false);setShowEmojiPicker(false);
    }
  },[isOpen]);

  const handleFile=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const f=e.target.files?.[0];
    if(f){const r=new FileReader();r.onloadend=()=>setImgSrc(r.result as string);r.readAsDataURL(f);}
  };

  const handleCaptureAndUpload = async () => {
    if (mode === 'text' && text.trim()) {
      onUpload({type:'text',textContent:text,bgGradient:grad});
    } else if (mode === 'image' && imgSrc) {
      if (overlays.length > 0 && canvasRef.current) {
        try {
          setIsCapturing(true);
          const dataUrl = await toJpeg(canvasRef.current, { quality: 0.8, pixelRatio: 2 });
          onUpload({type:'image', src:dataUrl, textContent: text});
        } catch (e) {
          console.error("Capture failed:", e);
          onUpload({type:'image', src:imgSrc, textContent: text});
        } finally {
          setIsCapturing(false);
        }
      } else {
        onUpload({type:'image', src:imgSrc, textContent: text});
      }
    }
  };

  if(!isOpen) return null;
  return (
    <motion.div initial={{y:'100%'}} animate={{y:0}} exit={{y:'100%'}} transition={{type:'spring',damping:25,stiffness:200}}
      className="fixed inset-0 z-[200] flex flex-col overflow-hidden" style={{background:mode==='text'?grad:'#0f172a'}}>
      <div className="flex items-center justify-between p-4 z-20 shrink-0">
        <button onClick={onClose} className="p-2 bg-black/20 rounded-full text-white"><X size={24}/></button>
        <button onClick={handleCaptureAndUpload}
          disabled={isCapturing || (mode==='text'?!text.trim():!imgSrc)}
          className="flex items-center gap-2 bg-white text-slate-900 px-4 py-2 rounded-full font-bold text-sm disabled:opacity-50 transition-all">
          {isCapturing ? <Loader2 className="w-4 h-4 animate-spin"/> : '공유하기'} <ChevronRight size={16}/>
        </button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center p-6 overflow-hidden">
        {mode==='text'
          ? <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="오늘 숲에서 든 생각은?"
              className="w-full bg-transparent text-white text-center text-3xl font-bold placeholder:text-white/50 outline-none resize-none h-[300px]" autoFocus/>
          : imgSrc
            ? <div className="flex flex-col items-center w-full h-full justify-center">
                <div className="relative w-full max-w-sm aspect-[3/4]">
                  <div ref={canvasRef} className="absolute inset-0 rounded-2xl overflow-hidden bg-black flex items-center justify-center shadow-2xl ring-1 ring-white/10">
                    <img src={imgSrc} className="absolute inset-0 w-full h-full object-cover pointer-events-none"/>
                    {overlays.map((o) => (
                      <motion.div key={o.id} drag dragMomentum={false} 
                        className="absolute inline-block max-w-[90%] touch-none cursor-move whitespace-pre-wrap break-words text-center" 
                        style={{zIndex:50}}>
                        {o.type === 'text' ? (
                          <span className="text-white text-[28px] font-bold font-sans drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] px-2 py-1 leading-[1.2]">
                            {o.content}
                          </span>
                        ) : (
                          <span className="text-[64px] drop-shadow-xl">{o.content}</span>
                        )}
                      </motion.div>
                    ))}
                  </div>
                  <button onClick={()=>{setImgSrc(null);setOverlays([])}} className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 rounded-full text-white z-50 backdrop-blur-md transition-colors"><X size={18}/></button>
                </div>
                {/* Tools */}
                <div className="flex flex-col items-center gap-3 mt-6 z-20 shrink-0">
                  <div className="flex items-center gap-3">
                    <button onClick={()=>{
                        const txt = window.prompt("텍스트를 입력하세요:");
                        if(txt && txt.trim()) setOverlays(p=>[...p, {id:Date.now().toString(), type:'text', content:txt.trim()}]);
                      }}
                      className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-full text-[13px] font-bold shadow-sm backdrop-blur-md border border-white/20 transition-colors">
                      <Type size={16}/> 글자 추가
                    </button>
                    <button onClick={()=>setShowEmojiPicker(!showEmojiPicker)}
                      className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2.5 rounded-full text-[13px] font-bold shadow-sm backdrop-blur-md border border-white/20 transition-colors">
                      <Smile size={16} className="text-white"/> <span className="text-white">이모지</span>
                    </button>
                  </div>
                  <AnimatePresence>
                    {showEmojiPicker && (
                      <motion.div initial={{opacity:0, y:-10}} animate={{opacity:1, y:0}} exit={{opacity:0, y:-10}}
                        className="flex flex-wrap justify-center gap-2 max-w-sm bg-black/40 p-3.5 rounded-2xl backdrop-blur-md border border-white/10 mt-1">
                        {['❤️','😍','😂','😭','🔥','👏','✨','🙏','🌲','🦊','🍀','🎉'].map(emoji => (
                          <button key={emoji} onClick={()=>{
                            setOverlays(p=>[...p, {id:Date.now().toString(), type:'emoji', content:emoji}]);
                            setShowEmojiPicker(false);
                          }} className="text-3xl hover:scale-125 transition-transform active:scale-90 p-1">{emoji}</button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            : <label
                className="flex flex-col items-center justify-center w-full max-w-sm aspect-[3/4] rounded-2xl border-2 border-dashed border-white/30 hover:border-white/60 bg-white/5 cursor-pointer text-white">
                <Upload className="w-8 h-8 text-white mb-4"/>
                <span className="text-white font-bold">사진을 선택하세요</span>
                <input type="file" onChange={handleFile} accept="image/*" className="hidden"/>
              </label>}
      </div>
      {!imgSrc && (
        <div className="p-6 pb-10 flex flex-col items-center gap-6 shrink-0">
          {mode==='text'&&(
            <div className="flex items-center gap-2 bg-black/20 p-2.5 rounded-full">
              {GRADIENTS.map((g,i)=>(
                <button key={i} onClick={()=>setGrad(g)} className="w-8 h-8 rounded-full border-2 flex items-center justify-center transition-colors"
                  style={{background:g,borderColor:grad===g?'white':'transparent'}}>
                  {grad===g&&<Check size={14} className="text-white"/>}
                </button>
              ))}
            </div>
          )}
          <div className="flex bg-black/40 rounded-full p-1 backdrop-blur-sm">
            {(['text','image'] as const).map(m=>(
              <button key={m} onClick={()=>setMode(m)}
                className={cn('flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold transition-all',
                  mode===m?'bg-white text-slate-900 shadow-sm':'text-white/70 hover:text-white')}>
                {m==='text'?<Type size={16}/>:<ImageIcon size={16}/>}
                {m==='text'?'텍스트 쓰기':'사진 올리기'}
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ──────────────────────────────────────────────────
// COLUMN WRITE MODAL
// ──────────────────────────────────────────────────
function ColumnWriteModal({isOpen,onClose,onSave,profile,initialData}:{isOpen:boolean;onClose:()=>void;onSave:(d:ColumnData)=>void;profile:UserProfile;initialData?:ColumnData|null}) {
  const [title,setTitle]=useState(initialData?.title||'');
  const [content,setContent]=useState(initialData?.content||'');
  const [authorName,setAuthorName]=useState(initialData?.authorName||profile.username);
  const [authorRole,setAuthorRole]=useState(initialData?.authorRole||'커뮤니티 멤버');
  if(!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-4">
      <motion.div initial={{opacity:0,scale:0.95,y:20}} animate={{opacity:1,scale:1,y:0}}
        className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative">
        <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-slate-100 rounded-full"><X size={16} className="text-slate-500"/></button>
        <h2 className="text-xl font-bold text-emerald-700 flex items-center gap-2 mb-4"><PenTool size={20}/> {initialData ? '칼럼 수정하기' : '칼럼 작성하기'}</h2>
        <div className="space-y-3">
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="칼럼 제목"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"/>
          <textarea value={content} onChange={e=>setContent(e.target.value)} placeholder="칼럼 내용..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm resize-none h-28 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"/>
          <div className="flex gap-3">
            <input value={authorName} onChange={e=>setAuthorName(e.target.value)} placeholder="닉네임"
              className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none"/>
            <input value={initialData?.authorRealName||profile.realName} disabled className="flex-1 min-w-0 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl px-4 py-3 text-sm"/>
          </div>
          <input value={authorRole} onChange={e=>setAuthorRole(e.target.value)} placeholder="소속/역할"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none"/>
        </div>
        <button onClick={()=>{
          if(title.trim()&&content.trim()){
            onSave({
              title,content,authorName,authorRole,
              authorRealName:initialData?.authorRealName||profile.realName,
              authorAvatar:initialData?.authorAvatar||profile.avatar,
              timestamp:initialData?.timestamp||new Date().toISOString(),
              claps:initialData?.claps||0,
              userId:initialData?.userId
            });
            onClose();
          }
        }}
          disabled={!title.trim()||!content.trim()}
          className="w-full mt-5 bg-emerald-500 text-white font-bold py-3.5 rounded-xl hover:bg-emerald-600 disabled:opacity-50">게시하기</button>
      </motion.div>
    </div>
  );
}

// ──────────────────────────────────────────────────
// FOREST ROOM (Chat)
// ──────────────────────────────────────────────────
function ForestRoom({forest,onBack,messages,onSendMessage,onAddStory,isWeeklyTurn,currentColumnData,onWriteColumn,profile,forestStories,onReactStory,uid,isAdmin,onDeleteChat,onDeleteColumn}:
  {forest:Forest;onBack:()=>void;messages:ChatMsg[];onSendMessage:(t:string,img?:string,reply?:any)=>void;
   onAddStory:(d:any)=>void;isWeeklyTurn:boolean;currentColumnData?:ColumnData;onWriteColumn:(d:ColumnData)=>void;profile:UserProfile;forestStories?:Story[];onReactStory?:(id:string,emoji:string)=>void;uid?:string;isAdmin?:boolean;onDeleteChat?:(id:string)=>void;onDeleteColumn?:(weekNum:number)=>void}) {
  const [text,setText]=useState('');
  const [isUploading,setIsUploading]=useState(false);
  const [isWritingColumn,setIsWritingColumn]=useState(false);
  const [replyTo,setReplyTo]=useState<ChatMsg|null>(null);
  const [imgPreview,setImgPreview]=useState<string|null>(null);
  const bottomRef=useRef<HTMLDivElement>(null);
  const fileRef=useRef<HTMLInputElement>(null);

  useEffect(()=>bottomRef.current?.scrollIntoView({behavior:'smooth'}),[messages]);

  const handleImgChange=(e:React.ChangeEvent<HTMLInputElement>)=>{
    const f=e.target.files?.[0];
    if(f){const r=new FileReader();r.onloadend=()=>setImgPreview(r.result as string);r.readAsDataURL(f);}
  };

  const handleSubmit=(e:React.FormEvent)=>{
    e.preventDefault();
    if(!text.trim()&&!imgPreview) return;
    onSendMessage(text,imgPreview||undefined,replyTo?{senderName:replyTo.senderName,text:replyTo.text}:undefined);
    setText('');setImgPreview(null);setReplyTo(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 max-w-2xl mx-auto overflow-hidden relative" style={{height:'100%'}}>
      <div className="flex items-center justify-between p-4 bg-white/80 backdrop-blur-md border-b border-slate-200 shrink-0">
        <div className="flex items-center">
          <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-slate-100"><ChevronLeft size={24} className="text-slate-700"/></button>
          <span className="text-2xl ml-2">{forest.emoji}</span>
          <h2 className="text-lg font-bold text-slate-800 ml-2">{forest.name}</h2>
        </div>
        <button onClick={()=>setIsUploading(true)}
          className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-full text-sm font-bold hover:bg-emerald-100">
          <Plus size={16}/> 스토리
        </button>
      </div>
      {isWeeklyTurn&&(
        <div className="bg-emerald-100/80 text-emerald-800 px-4 py-3 flex items-center justify-between shrink-0 border-b border-emerald-200">
          <span className="text-[12px] font-bold">🎉 이번 주 칼럼 담당 숲이에요!</span>
          {(!currentColumnData || currentColumnData.userId === uid || isAdmin) && (
            <button onClick={()=>setIsWritingColumn(true)}
              className="bg-emerald-600 text-white text-[11px] font-bold px-3 py-1.5 rounded-full hover:bg-emerald-700">
              {currentColumnData?'수정하기':'작성하기'}
            </button>
          )}
        </div>
      )}
      <div className="absolute top-[84px] left-1/2 -translate-x-1/2 z-0 w-[90%] max-w-sm pointer-events-none">
        <div className={cn('bg-white/95 backdrop-blur-md text-emerald-700 px-4 py-2 text-[12px] flex items-center justify-center gap-2 rounded-full shadow-md border border-emerald-100 pointer-events-auto',isWeeklyTurn&&'mt-12')}>
          <Megaphone size={14} className="text-emerald-600 shrink-0"/>
          <span className="truncate"><span className="font-bold">{forest.name} 숲지기:</span> 따뜻한 대화를 나눠주세요! 🌲</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 pt-20 space-y-4">
        {messages.map(msg=>(
          <div key={msg.id} className={cn('flex w-full group',msg.isMe?'justify-end':'justify-start')}>
            <div className={cn('flex gap-2 max-w-[85%] items-end',msg.isMe?'flex-row-reverse':'flex-row')}>
              {!msg.isMe&&<div className="w-8 h-8 rounded-full bg-white border border-slate-200 p-0.5 shrink-0 mb-4 overflow-hidden">
                <img src={msg.avatar} alt="avatar" className="w-full h-full object-contain"/>
              </div>}
              <div className={cn('flex flex-col',msg.isMe?'items-end':'items-start')}>
                {!msg.isMe&&<span className="text-xs text-slate-500 font-medium mb-1 ml-1">{msg.senderName}</span>}
                <div className={cn('px-4 py-2.5 rounded-2xl shadow-sm',msg.isMe?'bg-emerald-500 text-white rounded-tr-sm':'bg-white text-slate-800 rounded-tl-sm border border-slate-200')}>
                  {msg.replyTo&&(
                    <div className={cn('text-[11px] p-1.5 rounded mb-1 border-l-2 flex items-start gap-1',msg.isMe?'bg-black/10 border-white/50 text-white':'bg-slate-50 border-slate-300 text-slate-600')}>
                      <CornerDownRight size={12} className="shrink-0 mt-0.5 opacity-70"/>
                      <span className="truncate"><span className="font-bold">{msg.replyTo.senderName}</span>: {msg.replyTo.text}</span>
                    </div>
                  )}
                  {msg.imageUrl&&<img src={msg.imageUrl} alt="img" className="max-w-full rounded-lg my-1 max-h-[200px] object-cover"/>}
                  {msg.text&&<span className="text-[14px] whitespace-pre-wrap break-words">{msg.text}</span>}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 mx-1">{new Date(msg.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</span>
              </div>
              <div className={cn('flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 mb-4',msg.isMe?'mr-1':'ml-1')}>
                <button onClick={()=>setReplyTo(msg)}
                  className="p-1.5 text-slate-400 hover:text-emerald-500 bg-white rounded-full shadow-sm border border-slate-200 transition-colors">
                  <CornerDownRight size={14}/>
                </button>
                {msg.isMe && onDeleteChat && (
                  <button onClick={() => { if(window.confirm('메시지를 삭제하시겠습니까?')) onDeleteChat(msg.id); }}
                    className="p-1.5 text-slate-400 hover:text-red-500 bg-white rounded-full shadow-sm border border-slate-200 transition-colors">
                    <Trash2 size={14}/>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef}/>
      </div>
      <div className="bg-white border-t border-slate-200 shrink-0">
        <AnimatePresence>
          {replyTo&&(
            <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}
              className="flex items-center justify-between px-4 py-2 bg-slate-50 border-b border-slate-200 text-[13px] text-slate-600">
              <div className="flex items-center gap-2 truncate">
                <CornerDownRight size={16} className="text-emerald-500 shrink-0"/>
                <span className="truncate"><span className="font-bold">{replyTo.senderName}</span>님에게 답장 중</span>
              </div>
              <button onClick={()=>setReplyTo(null)} className="p-1 hover:bg-slate-200 rounded-full shrink-0"><X size={14}/></button>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {imgPreview&&(
            <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}
              className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-start gap-3">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-slate-200">
                <img src={imgPreview} alt="preview" className="w-full h-full object-cover"/>
                <button onClick={()=>setImgPreview(null)} className="absolute top-1 right-1 p-0.5 bg-black/50 text-white rounded-full"><X size={12}/></button>
              </div>
              <span className="text-xs text-slate-500 mt-1">이 사진을 전송합니다.</span>
            </motion.div>
          )}
        </AnimatePresence>
        <form onSubmit={handleSubmit} className="p-3 pb-5">
          <div className="flex gap-2 items-center bg-slate-50 rounded-full p-1.5 border border-slate-200 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
            <button type="button" onClick={()=>fileRef.current?.click()} className="p-2 text-slate-400 hover:text-emerald-500 rounded-full shrink-0"><ImageIcon size={20}/></button>
            <input type="file" accept="image/*" ref={fileRef} onChange={handleImgChange} className="hidden"/>
            <input type="text" value={text} onChange={e=>setText(e.target.value)} placeholder={`${forest.name}에 이야기 남기기...`}
              className="flex-1 bg-transparent px-2 py-2 text-[14px] text-slate-800 placeholder:text-slate-400 focus:outline-none min-w-0"/>
            <button type="submit" disabled={!text.trim()&&!imgPreview}
              className="p-2.5 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 disabled:opacity-50 disabled:bg-slate-300 transition-colors shadow-sm shrink-0"><Send size={16}/></button>
          </div>
        </form>
      </div>
      <AnimatePresence>
        {isUploading&&<StoryUploadModal isOpen={isUploading} onClose={()=>setIsUploading(false)} onUpload={d=>{onAddStory(d);setIsUploading(false);}}/>}
      </AnimatePresence>
      <AnimatePresence>
        <ColumnWriteModal isOpen={isWritingColumn} onClose={()=>setIsWritingColumn(false)} onSave={onWriteColumn} profile={profile} initialData={currentColumnData} />
      </AnimatePresence>
    </div>
  );
}

// ──────────────────────────────────────────────────
// COLUMN ARCHIVE MODAL (다시 읽기)
// ──────────────────────────────────────────────────
function ColumnArchiveModal({ isOpen, onClose, columns, onSelectColumn }: { isOpen: boolean; onClose: () => void; columns: (ColumnData & { weekNum: number })[]; onSelectColumn: (col: ColumnData & { weekNum: number }) => void }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[250] bg-white flex flex-col animate-in slide-in-from-bottom-10 fade-in duration-300">
      <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-gray-100 p-4 pb-3 flex items-center z-10 shrink-0 shadow-sm">
        <button onClick={onClose} className="p-2 -ml-2 text-gray-800 mr-2 rounded-full hover:bg-slate-100"><ChevronLeft size={24}/></button>
        <h1 className="text-lg font-extrabold text-slate-800 mx-auto flex items-center gap-2"><BookOpen className="text-[#8C5E45]" size={20}/> 숲 이야기 보관소</h1>
        <div className="w-8"/>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 pb-safe">
        {columns.length === 0 ? (
          <div className="text-center py-20 text-slate-400 text-sm">아직 작성된 칼럼이 없습니다.</div>
        ) : (
          columns.map(col => {
            const f = FORESTS.find(x => x.name === col.authorRole.split(' ')[0]) || FORESTS[0]; // fallback
            return (
              <div key={col.weekNum} onClick={() => onSelectColumn(col)} className="bg-white p-4 rounded-3xl shadow-sm border border-slate-100 flex gap-4 items-center cursor-pointer hover:shadow-md transition-all active:scale-[0.98]">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/60 shadow-inner">
                  <img src={f.image} alt={f.name} className="w-full h-full object-cover"/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-white bg-[#8C5E45] px-2 py-0.5 rounded-md leading-none">{col.weekNum}주차</span>
                    <span className="text-[11px] font-medium text-slate-500 truncate">{col.authorRole}</span>
                  </div>
                  <h3 className="text-[15px] font-bold text-slate-800 truncate mb-1 pr-2">{col.title}</h3>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <div className="w-4 h-4 rounded-full overflow-hidden bg-slate-200">
                      <img src={col.authorAvatar} alt="author" className="w-full h-full object-cover"/>
                    </div>
                    <span>{col.authorName}</span>
                    <span className="mx-1 opacity-50">·</span>
                    <span className="flex items-center gap-0.5">❤️ {col.claps || 0}</span>
                  </div>
                </div>
                <ChevronRight size={18} className="text-slate-300 shrink-0"/>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────
// COLUMN DETAIL MODAL (좋아요 + 실명 댓글)
// ──────────────────────────────────────────────────
interface ColumnComment { id: string; uid: string; authorName: string; authorAvatar: string; text: string; timestamp: any; }

function ColumnDetailModal({ weekNum, columnData, user, userData, profile, onClose, onEdit, onDelete }:
  { weekNum: number; columnData: ColumnData; user: any; userData: any; profile: UserProfile | null; onClose: () => void; onEdit?: () => void; onDelete?: () => void; }) {

  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [likeBounce, setLikeBounce] = useState(false);
  const [comments, setComments] = useState<ColumnComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const commentEndRef = useRef<HTMLDivElement>(null);
  const uid = user?.uid || 'anon';
  const role = userData?.role || '';

  const canManage = columnData.userId === uid || role === 'admin';

  // Listen to likes
  useEffect(() => {
    const likesCol = collection(db, 'weekly_columns', `week-${weekNum}`, 'likes');
    const unsub = onSnapshot(likesCol, (snap) => {
      setLikeCount(snap.size);
      setLiked(snap.docs.some(d => d.id === uid));
    });
    return () => unsub();
  }, [weekNum, uid]);

  // Listen to comments
  useEffect(() => {
    const commentsCol = collection(db, 'weekly_columns', `week-${weekNum}`, 'comments');
    const q = query(commentsCol, orderBy('timestamp', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setComments(snap.docs.map(d => ({ id: d.id, ...d.data() } as ColumnComment)));
    });
    return () => unsub();
  }, [weekNum]);

  useEffect(() => {
    commentEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  const handleLike = async () => {
    const likeRef = doc(db, 'weekly_columns', `week-${weekNum}`, 'likes', uid);
    if (liked) {
      await deleteDoc(likeRef);
    } else {
      await setDoc(likeRef, { uid, likedAt: serverTimestamp() });
      setLikeBounce(true);
      setTimeout(() => setLikeBounce(false), 400);
    }
  };

  const handleSendComment = async () => {
    if (!commentText.trim() || isSending) return;
    setIsSending(true);
    try {
      await addDoc(collection(db, 'weekly_columns', `week-${weekNum}`, 'comments'), {
        uid,
        authorName: userData?.name || profile?.realName || '익명',
        authorAvatar: userData?.profile_image || profile?.avatar || '',
        text: commentText.trim(),
        timestamp: serverTimestamp(),
      });
      setCommentText('');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-end"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
        className="relative w-full bg-white rounded-t-[2rem] flex flex-col"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1">
          {/* Header */}
          <div className="px-6 pt-3 pb-5 border-b border-slate-100">
            <div className="flex justify-between items-center mb-3">
              <span className="bg-[#8C5E45] text-white text-[10px] font-bold px-3 py-1 rounded-full">이번 주 숲 이야기</span>
              {canManage && (
                <div className="flex gap-3">
                  {onEdit && <button onClick={onEdit} className="text-[12px] font-bold text-slate-400 hover:text-emerald-600 transition-colors">수정</button>}
                  {onDelete && <button onClick={onDelete} className="text-[12px] font-bold text-slate-400 hover:text-rose-500 transition-colors">삭제</button>}
                </div>
              )}
            </div>
            <h2 className="text-[22px] font-extrabold text-slate-800 leading-snug break-keep mt-2 mb-4">{columnData.title}</h2>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-100 bg-slate-50 shrink-0">
                <img src={columnData.authorAvatar} alt="author" className="w-full h-full object-contain" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{columnData.authorName}</p>
                <p className="text-[11px] text-slate-400">{columnData.authorRole}</p>
              </div>
              <span className="ml-auto text-[11px] text-slate-400">
                {typeof columnData.timestamp === 'object' && (columnData.timestamp as any)?.toDate 
                  ? formatTimestamp((columnData.timestamp as any).toDate().toISOString()) 
                  : String(columnData.timestamp || '')}
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-6">
            <p className="text-[15px] text-slate-700 leading-[1.9] whitespace-pre-wrap break-keep">
              {columnData.content}
            </p>
          </div>

          {/* Like Bar */}
          <div className="px-6 py-4 border-t border-slate-100 flex items-center gap-4">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all active:scale-95 ${
                liked
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-200'
                  : 'bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-400'
              } ${likeBounce ? 'scale-125' : 'scale-100'}`}
              style={{ transition: 'transform 0.2s, background 0.2s' }}
            >
              <span className="text-base">{liked ? '❤️' : '🤍'}</span>
              <span>{likeCount}</span>
            </button>
            <span className="text-[12px] text-slate-400">댓글 {comments.length}개</span>
          </div>

          {/* Comments */}
          <div className="px-6 pb-4 space-y-4 border-t border-slate-50">
            {comments.length === 0 ? (
              <p className="text-center text-[13px] text-slate-400 py-6">첫 번째 댓글을 남겨보세요 💬</p>
            ) : (
              comments.map(c => (
                <div key={c.id} className="flex gap-3 pt-4">
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                    {c.authorAvatar
                      ? <img src={c.authorAvatar} alt={c.authorName} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-sm font-bold text-slate-400">{c.authorName?.[0]}</div>
                    }
                  </div>
                  <div className="flex-1 bg-slate-50 rounded-2xl rounded-tl-sm px-4 py-3">
                    <p className="text-[12px] font-bold text-slate-700 mb-1">{c.authorName}</p>
                    <p className="text-[14px] text-slate-600 leading-relaxed">{c.text}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={commentEndRef} />
          </div>
        </div>

        {/* Fixed comment input */}
        <div className="shrink-0 px-4 py-3 border-t border-slate-100 bg-white flex items-center gap-3 pb-safe">
          <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
            {userData?.profile_image
              ? <img src={userData.profile_image} className="w-full h-full object-cover" alt="me" />
              : <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">{userData?.name?.[0] || '나'}</div>
            }
          </div>
          <input
            className="flex-1 bg-slate-50 text-[14px] text-slate-700 rounded-full px-4 py-2.5 outline-none border border-slate-200 focus:border-[#8C5E45]/50 transition-colors"
            placeholder="따뜻한 댓글을 남겨주세요..."
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendComment()}
          />
          <button
            onClick={handleSendComment}
            disabled={!commentText.trim() || isSending}
            className="w-9 h-9 bg-[#0F6045] text-white rounded-full flex items-center justify-center disabled:opacity-40 active:scale-90 transition-all shrink-0"
          >
            <Send size={16} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ──────────────────────────────────────────────────
// MAIN VIEW
// ──────────────────────────────────────────────────
const ForestCommunityView = ({ onBack, user, userData, onShowToast }: { onBack?: () => void; user?: any; userData?: any; onShowToast?: (m: string) => void }) => {

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeForestId, setActiveForestId] = useState<string | null>(null);
  const [forestStories, setForestStories] = useState<Record<string, Story[]>>({});
  const [allChats, setAllChats] = useState<Record<string, ChatMsg[]>>({});
  const [weeklyColumns, setWeeklyColumns] = useState<Record<number, ColumnData>>({});
  const [selectedColumnData, setSelectedColumnData] = useState<(ColumnData & { weekNum?: number }) | null>(null);
  const [isWritingColumnMain, setIsWritingColumnMain] = useState(false);
  const [editingColumn, setEditingColumn] = useState<(ColumnData & {weekNum?: number})|null>(null);
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);

  const activeForest = FORESTS.find(f => f.id === activeForestId);
  const weekInfo = useMemo(() => getCurrentWeekInfo(), []);

  // Initialize profile from userData
  useEffect(() => {
    if (userData) {
      setProfile({
        username: userData.name || '익명',
        realName: userData.name || '',
        avatar: userData.profile_image || getEmojiSvgUrl('🦊')
      });
    }
  }, [userData]);

  // Real-time Chats Listener
  useEffect(() => {
    if (!activeForestId) return;
    const q = query(
      collection(db, 'forest_chats'),
      where('forestId', '==', activeForestId),
      orderBy('timestamp', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const msgs = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        timestamp: d.data().timestamp?.toDate()?.toISOString() || new Date().toISOString(),
        isMe: d.data().userId === user?.uid
      })) as ChatMsg[];
      setAllChats(prev => ({ ...prev, [activeForestId]: msgs }));
    }, (err) => {
      console.error("Chats listener error:", err);
      if (err.message.includes('index')) {
        const fallbackQ = query(collection(db, 'forest_chats'), where('forestId', '==', activeForestId));
        onSnapshot(fallbackQ, (s) => {
          const msgs = s.docs.map(d => ({
            id: d.id,
            ...d.data(),
            timestamp: d.data().timestamp?.toDate()?.toISOString() || new Date().toISOString(),
            isMe: d.data().userId === user?.uid
          })) as ChatMsg[];
          msgs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          setAllChats(prev => ({ ...prev, [activeForestId]: msgs }));
        });
      }
    });
    return () => unsub();
  }, [activeForestId, user]);

  // Real-time Stories Listener (Last 24 hours)
  useEffect(() => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const q = query(
      collection(db, 'forest_stories'), 
      where('timestamp', '>=', yesterday),
      orderBy('timestamp', 'desc')
    );
    const unsub = onSnapshot(q, (snap) => {
      const storiesMap: Record<string, Story[]> = {};
      snap.docs.forEach(d => {
        const data = d.data();
        if (!storiesMap[data.forestId]) storiesMap[data.forestId] = [];
        storiesMap[data.forestId].push({ id: d.id, ...data } as Story);
      });
      setForestStories(storiesMap);
    }, (err) => {
      console.error("Stories listener error:", err);
      // Fallback: if index is missing, try without orderBy first
      if (err.message.includes('index')) {
        const fallbackQ = query(collection(db, 'forest_stories'), where('timestamp', '>=', yesterday));
        onSnapshot(fallbackQ, (s) => {
           const map: Record<string, Story[]> = {};
           
           const sortedDocs = s.docs.map(d => ({ id: d.id, ...d.data() } as any))
             .sort((a: any, b: any) => new Date(b.timestamp?.toDate ? b.timestamp.toDate() : b.timestamp || '').getTime() - new Date(a.timestamp?.toDate ? a.timestamp.toDate() : a.timestamp || '').getTime());
             
           sortedDocs.forEach((data: any) => {
             if (!map[data.forestId]) map[data.forestId] = [];
             map[data.forestId].push(data);
           });
           setForestStories(map);
        });
      }
    });
    return () => unsub();
  }, []);


  // Real-time Weekly Columns Listener
  useEffect(() => {
    const q = collection(db, 'weekly_columns');
    const unsub = onSnapshot(q, (snap) => {
      const cols: Record<number, ColumnData> = {};
      snap.docs.forEach(d => {
        const data = d.data();
        cols[data.weekNum] = data as ColumnData;
      });
      setWeeklyColumns(cols);
    });
    return () => unsub();
  }, []);

  const handleSend = useCallback(async (text: string, imageUrl?: string, replyTo?: any) => {
    if (!activeForestId || !profile || !user) return;
    try {
      let finalImageUrl = imageUrl;
      if (imageUrl && imageUrl.startsWith('data:')) {
        onShowToast?.("사진 속성에 따라 수 초가 걸릴 수 있습니다..");
        finalImageUrl = await uploadImage(imageUrl, `forest_chats/${activeForestId}/${Date.now()}`);
      }
      // Always use the real name from userData (Firestore) first, fallback to profile.username
      const senderName = userData?.name || profile.username || '익명';
      const avatar = userData?.profile_image || profile.avatar;

      const payload: any = {
        forestId: activeForestId,
        userId: user.uid || 'unknown',
        senderName,
        avatar,
        text,
        timestamp: serverTimestamp()
      };
      if (finalImageUrl) payload.imageUrl = finalImageUrl;
      if (replyTo) payload.replyTo = replyTo;

      await addDoc(collection(db, 'forest_chats'), payload);
    } catch (err) {
      console.error("Send message failed:", err);
      onShowToast?.("메시지 전송에 실패했습니다.");
    }
  }, [activeForestId, profile, user, userData, onShowToast]);

  const handleAddStory = useCallback(async (data: any) => {
    if (!activeForestId) return;
    try {
      let finalSrc = data.src;
      if (data.type === 'image' && data.src && data.src.startsWith('data:')) {
        onShowToast?.("이미지 업로드 중...");
        finalSrc = await uploadImage(data.src, `forest_stories/${activeForestId}/${Date.now()}`);
      }

      const payload: any = {
        forestId: activeForestId,
        userId: user?.uid || 'unknown',
        ...data,
        timestamp: serverTimestamp()
      };
      if (finalSrc) payload.src = finalSrc;
      
      // Clean any undefined values
      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

      await addDoc(collection(db, 'forest_stories'), payload);
      onShowToast?.("스토리가 등록되었습니다.");
    } catch (err) {
      console.error("Add story failed:", err);
      onShowToast?.("스토리 등록에 실패했습니다.");
    }
  }, [activeForestId, onShowToast]);



  const handleDeleteChat = useCallback(async (msgId: string) => {
    try { await deleteDoc(doc(db, 'forest_chats', msgId)); } catch(e) { console.error(e); }
  }, []);
  const handleDeleteStory = useCallback(async (storyId: string) => {
    try { await deleteDoc(doc(db, 'forest_stories', storyId)); } catch(e) { console.error(e); }
  }, []);

  const handleWriteColumn = useCallback(async (data: ColumnData, optWeekNum?: number) => {
    const targetWeekNum = optWeekNum ?? weekInfo.weekNum;
    try {
      await setDoc(doc(db, 'weekly_columns', `week-${targetWeekNum}`), {
        ...data,
        weekNum: targetWeekNum,
        userId: data.userId || user?.uid, // Save the author UID permanently
        timestamp: data.timestamp || serverTimestamp()
      });
      console.log('Column saved', targetWeekNum);
    } catch (err) {
      console.error("Write column failed:", err);
    }
  }, [weekInfo.weekNum, user]);

  const handleReactStory = useCallback(async (storyId: string, emoji: string) => {
    if (!user || !activeForestId) return;
    try {
      const docRef = doc(db, 'forest_stories', storyId);
      const story = forestStories[activeForestId]?.find(s => s.id === storyId);
      if (!story) return;
      const reacts = story.reactions?.[emoji] || [];
      const hasReacted = reacts.includes(user.uid);
      
      const updateData: any = {};
      updateData[`reactions.${emoji}`] = hasReacted ? arrayRemove(user.uid) : arrayUnion(user.uid);
      await updateDoc(docRef, updateData);
    } catch (e) {
      console.error("React story failed:", e);
    }
  }, [user, activeForestId, forestStories]);

  const orbitForests = useMemo(() => FORESTS.map(f => ({ id: f.id, name: f.name, src: f.image, emoji: f.emoji })), []);

  if (!profile) return <ProfileSetup onComplete={setProfile} />;

  if (activeForest) {
    return (
      <div className="absolute inset-0 z-50 bg-white">
        <ForestRoom
          forest={activeForest} onBack={() => setActiveForestId(null)}
          messages={allChats[activeForest.id] || []} onSendMessage={handleSend}
          onAddStory={handleAddStory} isWeeklyTurn={activeForest.id === weekInfo.forest.id}
          currentColumnData={weeklyColumns[weekInfo.weekNum]}
          onWriteColumn={handleWriteColumn}
          profile={profile}
          forestStories={forestStories[activeForest.id] || []}
          onReactStory={handleReactStory}
          uid={user?.uid}
          isAdmin={userData?.role === 'admin'}
          onDeleteChat={handleDeleteChat}
          onDeleteColumn={async (weekNum) => {
            if (window.confirm('정말로 이 칼럼을 삭제하시겠습니까?')) {
              await deleteDoc(doc(db, 'weekly_columns', `week-${weekNum}`));
            }
          }}
        />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-50 bg-slate-50 overflow-y-auto">
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-gray-200 p-4 flex items-center z-10">
        {onBack && (
          <button onClick={onBack} className="p-2 -ml-2 text-gray-600 mr-2"><ChevronLeft size={24}/></button>
        )}
        <h1 className="text-lg font-bold text-emerald-700 mx-auto">🌲 숲 모임</h1>
        {onBack && <div className="w-8"/>}
      </div>

      <div className="px-4 py-6 space-y-5 max-w-md mx-auto pb-20">
        {/* 실시간 스토리 */}
        <div className="bg-white/80 rounded-[2rem] p-5 shadow-sm border border-slate-200">
          <h3 className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">실시간 숲 스토리</h3>
          <div className="flex gap-4 overflow-x-auto pb-2" style={{scrollbarWidth:'none'}}>
            {FORESTS.filter(f => forestStories[f.id]?.length > 0).length === 0
              ? <div className="text-xs text-slate-400 flex items-center h-[72px]">아직 공유된 스토리가 없습니다.</div>
              : FORESTS.filter(f => forestStories[f.id]?.length > 0).map(f => (
                  <StoryViewer key={f.id} stories={forestStories[f.id]} username={f.name} avatar={f.image} onReact={handleReactStory} uid={user?.uid} onDeleteStory={handleDeleteStory}/>
                ))}
          </div>
        </div>

        {/* 캐러셀 */}
        <div className="bg-white/80 rounded-[2rem] p-6 shadow-sm border border-slate-200 overflow-hidden">
          <div className="flex items-center justify-center gap-2 mb-2">
            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">원하는 숲을 선택하세요</h3>
          </div>
          <ForestCarousel items={orbitForests} onItemClick={setActiveForestId} dutyForestId={weekInfo.forest.id}/>
          <p className="mt-2 text-[12px] text-slate-400 text-center">좌우로 스와이프해서 숲을 둘러보세요</p>
        </div>

        {/* 숲 이야기 다시 읽기 (스크롤 리스트) */}
        {(() => {
          const allCols = Object.entries(weeklyColumns)
            .map(([w, c]) => ({ ...c, weekNum: Number(w) }))
            .sort((a, b) => b.weekNum - a.weekNum);
          
          return (
            <div className="-mx-4 px-4 pb-4 overflow-hidden">
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-sm font-bold text-slate-700">숲 이야기 모아보기 📖</h3>
                <button 
                  onClick={() => setIsArchiveModalOpen(true)}
                  className="text-[12px] font-bold text-slate-400 hover:text-emerald-600 transition-colors flex items-center"
                >
                  전체보기 <ChevronRight size={14}/>
                </button>
              </div>
              
              <div className="flex gap-4 overflow-x-auto pb-4 pt-1 px-1 -mx-1 snap-x" style={{scrollbarWidth:'none'}}>
                {!weeklyColumns[weekInfo.weekNum] && (
                  <div className="snap-start shrink-0 w-[260px]">
                    <WeeklyColumnCard isEmpty weekInfo={weekInfo} onWrite={() => setIsWritingColumnMain(true)} />
                  </div>
                )}
                {allCols.length === 0 && weeklyColumns[weekInfo.weekNum] ? null : (
                  allCols.map(col => {
                    // find forest matching the authorRole or default
                    const fallbackForestName = col.authorRole.split(' ')[0];
                    const f = FORESTS.find(x => x.name === fallbackForestName) || FORESTS[0];
                    
                    return (
                      <div key={col.weekNum} className="snap-start shrink-0 w-[260px]">
                        <WeeklyColumnCard
                          weekInfo={{ weekNum: col.weekNum, forest: f }}
                          columnData={col}
                          onClick={() => setSelectedColumnData(col)}
                        />
                      </div>
                    );
                  })
                )}
                {/* 패딩용 투명 요소 */}
                <div className="shrink-0 w-2" />
              </div>
            </div>
          );
        })()}

        {/* Column Archive Modal */}
        <ColumnArchiveModal 
          isOpen={isArchiveModalOpen}
          onClose={() => setIsArchiveModalOpen(false)}
          columns={Object.entries(weeklyColumns).map(([w, c]) => ({ ...c, weekNum: Number(w) })).sort((a,b) => b.weekNum - a.weekNum)}
          onSelectColumn={(col) => setSelectedColumnData(col)}
        />

        {/* Column Write Modal from main screen */}
        <AnimatePresence>
          {isWritingColumnMain && profile && (
            <ColumnWriteModal
              isOpen={isWritingColumnMain}
              onClose={() => { setIsWritingColumnMain(false); setEditingColumn(null); }}
              onSave={(data) => {
                handleWriteColumn(data, editingColumn ? editingColumn.weekNum : undefined);
                setIsWritingColumnMain(false);
                setEditingColumn(null);
                setSelectedColumnData(null); // Close the detail modal if it was open
              }}
              profile={profile}
              initialData={editingColumn}
            />
          )}
        </AnimatePresence>

        {/* Column Detail Modal — Full Featured */}
        <AnimatePresence>
          {selectedColumnData && (
            <ColumnDetailModal
              weekNum={selectedColumnData.weekNum ?? weekInfo.weekNum}
              columnData={selectedColumnData}
              user={user}
              userData={userData}
              profile={profile}
              onClose={() => setSelectedColumnData(null)}
              onEdit={() => {
                setEditingColumn(selectedColumnData);
                setIsWritingColumnMain(true);
              }}
              onDelete={async () => {
                if (window.confirm('정말로 이 칼럼을 삭제하시겠습니까?\n삭제된 내용은 복구할 수 없습니다.')) {
                  try {
                    await deleteDoc(doc(db, 'weekly_columns', `week-${selectedColumnData.weekNum ?? weekInfo.weekNum}`));
                    setSelectedColumnData(null); // Close modal
                  } catch (e) {
                    console.error(e);
                    alert("삭제 실패했습니다.");
                  }
                }
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};


export default ForestCommunityView;
