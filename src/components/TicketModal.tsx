import React, { useState } from 'react';
import { X, QrCode, MapPin, BadgeCheck, CalendarHeart } from 'lucide-react';

// --- Utility ---
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

// --- Avatar Components ---
const Avatar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("relative flex shrink-0 overflow-hidden rounded-full", className)} {...props} />
))
Avatar.displayName = "Avatar"

const AvatarImage = React.forwardRef<HTMLImageElement, React.ImgHTMLAttributes<HTMLImageElement>>(({ className, src, alt, ...props }, ref) => {
  const [hasError, setHasError] = useState(false);
  if (hasError || !src) return null;
  return (
    <img ref={ref} src={src} alt={alt} onError={() => setHasError(true)} className={cn("aspect-square h-full w-full object-cover", className)} {...props} />
  )
})
AvatarImage.displayName = "AvatarImage"

const AvatarFallback = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex h-full w-full items-center justify-center rounded-full bg-slate-100 font-medium text-slate-600", className)} {...props} />
))
AvatarFallback.displayName = "AvatarFallback"

// --- Animated Wave Element ---
const Wave = ({ className }: { className?: string }) => (
  <svg width="129" height="1387" viewBox="0 0 129 1387" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M11.2131 11L106.283 106.07M106.283 106.07L117.279 117.066M106.283 106.07L22.2962 190.003M106.283 106.07L116.688 95.6708M11.2962 200.997L22.2962 190.003M22.2962 190.003L11.2529 178.96M22.2962 190.003L106.323 274.03M106.323 274.03L117.319 285.026M106.323 274.03L22.4537 357.846M106.323 274.03L116.728 263.631M11.3361 368.957L22.4537 357.846M22.4537 357.846L11.5493 346.901M22.4537 357.846L106.44 442.149M106.44 442.149L117.416 453.166M106.44 442.149L22.2962 525.925M106.44 442.149L116.865 431.769M11.2756 536.897L22.2962 525.925M22.2962 525.925L11.2737 514.861M22.2962 525.925L106.165 610.109M106.165 610.109L117.14 621.126M106.165 610.109L11 704.857M106.165 610.109L116.59 599.729M11.2131 683L106.283 778.07M106.283 778.07L117.279 789.066M106.283 778.07L22.2962 862.003M106.283 778.07L116.688 767.671M11.2962 872.997L22.2962 862.003M22.2962 862.003L11.2529 850.96M22.2962 862.003L106.323 946.03M106.323 946.03L117.319 957.026M106.323 946.03L22.4537 1029.85M106.323 946.03L116.728 935.631M11.3361 1040.96L22.4537 1029.85M22.4537 1029.85L11.5493 1018.9M22.4537 1029.85L106.44 1114.15M106.44 1114.15L117.416 1125.17M106.44 1114.15L22.2962 1197.92M106.44 1114.15L116.865 1103.77M11.2756 1208.9L22.2962 1197.92M22.2962 1197.92L11.2737 1186.86M22.2962 1197.92L106.165 1282.11M106.165 1282.11L117.14 1293.13M106.165 1282.11L11 1376.86M106.165 1282.11L116.59 1271.73" stroke="currentColor" strokeWidth="38" />
  </svg>
)

// --- Types ---
export interface UserProfile {
  avatarSrc: string;
  avatarFallback: string;
  name: string;
  affiliation: string;
  title: string;
  birthdate: string;
  qrData: string;
}

export interface TicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile | null;
}

// --- Main Modal Component ---
export const TicketModal: React.FC<TicketModalProps> = ({ isOpen, onClose, user }) => {
  if (!isOpen || !user) return null;

  const topTicketMask = {
    WebkitMaskImage: 'radial-gradient(circle at 0% 100%, transparent 16px, black 17px), radial-gradient(circle at 100% 100%, transparent 16px, black 17px)',
    WebkitMaskSize: '51% 100%', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'left bottom, right bottom',
    maskImage: 'radial-gradient(circle at 0% 100%, transparent 16px, black 17px), radial-gradient(circle at 100% 100%, transparent 16px, black 17px)',
    maskSize: '51% 100%', maskRepeat: 'no-repeat', maskPosition: 'left bottom, right bottom',
  };

  const bottomTicketMask = {
    WebkitMaskImage: 'radial-gradient(circle at 0% 0%, transparent 16px, black 17px), radial-gradient(circle at 100% 0%, transparent 16px, black 17px)',
    WebkitMaskSize: '51% 100%', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'left top, right top',
    maskImage: 'radial-gradient(circle at 0% 0%, transparent 16px, black 17px), radial-gradient(circle at 100% 0%, transparent 16px, black 17px)',
    maskSize: '51% 100%', maskRepeat: 'no-repeat', maskPosition: 'left top, right top',
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes waves { 0% { transform: translateY(-170px); } 100% { transform: translateY(0); } }
        .animate-waves { animation: waves 5s linear infinite; }
      `}} />

      {/* 닫기 버튼 */}
      <button onClick={onClose} className="absolute top-6 right-6 md:top-10 md:right-10 rounded-full bg-white/20 backdrop-blur-md p-3 text-white hover:bg-white/30 transition-colors shadow-lg z-50">
        <X className="h-6 w-6" />
      </button>

      {/* 스마트 티켓 본체 */}
      <div className="relative w-[340px] drop-shadow-2xl flex flex-col animate-in slide-in-from-bottom-24 zoom-in-95 fade-in duration-500 ease-out">
        
        {/* [상단] 프로필 영역 */}
        <div style={topTicketMask} className="bg-[#10B981] rounded-t-[28px] pt-7 px-8 pb-8 relative overflow-hidden text-white shadow-inner">
          <div className="absolute top-0 left-0 right-0 h-[6px] bg-[#059669] z-20" />
          <div className="absolute inset-0 z-0 opacity-10 pointer-events-none overflow-hidden">
            <div className="absolute -top-[106px] sm:-left-2 -left-6 text-black animate-waves mix-blend-overlay"><Wave /></div>
            <div className="absolute -top-[106px] sm:-right-2 -right-6 text-black animate-waves mix-blend-overlay"><Wave /></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-6">
              <div className="bg-[#047857] text-white text-[10px] font-bold px-3 py-1.5 rounded-sm tracking-widest shadow-sm">MOBILE TICKET</div>
              <div className="text-white font-extrabold tracking-wider text-xs flex items-center gap-1.5 drop-shadow-md">
                <BadgeCheck className="w-4 h-4" /> WORSHIP PASS
              </div>
            </div>

            <div className="flex items-center gap-5">
              <Avatar className="h-[72px] w-[72px] shadow-md border-[3px] border-[#047857]/20 ring-4 ring-[#34D399]/30">
                <AvatarImage src={user.avatarSrc} />
                <AvatarFallback className="bg-[#064E3B] text-white">{user.avatarFallback}</AvatarFallback>
              </Avatar>
              <div>
                <h2 className="text-[32px] font-extrabold text-white tracking-tight leading-none drop-shadow-sm">{user.name}</h2>
                <p className="text-emerald-50 font-medium mt-2 text-sm drop-shadow-sm opacity-90">{user.title}</p>
              </div>
            </div>

            <div className="flex justify-between mt-8 bg-[#047857] rounded-[18px] p-5 border border-[#065F46] shadow-inner">
              <div className="flex flex-col gap-1.5">
                <p className="text-[11px] text-emerald-100/70 font-bold uppercase tracking-wider flex items-center gap-1.5"><MapPin className="h-[14px] w-[14px]" /> 소속숲</p>
                <p className="text-[15px] font-bold text-white tracking-wide">{user.affiliation}</p>
              </div>
              <div className="flex flex-col gap-1.5 pl-4">
                <p className="text-[11px] text-emerald-100/70 font-bold uppercase tracking-wider flex items-center gap-1.5"><CalendarHeart className="h-[14px] w-[14px]" /> 생년월일</p>
                <p className="text-[15px] font-bold text-white tracking-wide">{user.birthdate}</p>
              </div>
            </div>
          </div>
        </div>

        {/* [하단] QR 코드 영역 */}
        <div style={bottomTicketMask} className="bg-white rounded-b-[28px] pt-8 pb-10 px-8 flex flex-col items-center relative">
          <div className="absolute top-0 left-6 right-6 border-t-[3px] border-dashed border-slate-200" />
          <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-transform hover:scale-105 duration-300 relative z-10">
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${user.qrData}`} alt="고유 QR코드" className="w-[140px] h-[140px] mix-blend-multiply" />
          </div>
          <p className="mt-4 font-mono font-bold text-slate-300 tracking-[0.25em] text-[10px] uppercase">{user.qrData.replace(/_/g, '')}</p>
          <div className="mt-6 w-full">
            <p className="text-[13px] font-bold text-[#047857] bg-[#ECFDF5] py-3.5 rounded-full flex justify-center items-center gap-2 border border-[#A7F3D0] shadow-sm">
              <QrCode className="w-[18px] h-[18px]" /> 입장 시 스캐너에 보여주세요
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
