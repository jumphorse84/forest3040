import React from 'react';
import { X, Award, Info, Gift, TrendingUp, Sparkles, TreePine } from 'lucide-react';

interface FruitStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamFruitCount: number;
  forestName: string;
}

export const FruitStatusModal: React.FC<FruitStatusModalProps> = ({ isOpen, onClose, teamFruitCount, forestName }) => {
  if (!isOpen) return null;

  const steps = [
    { target: 50, reward: '마을 간식 지원', icon: <Sparkles className="text-yellow-500" size={18} /> },
    { target: 100, reward: '마을 식사 지원', icon: <Gift className="text-pink-500" size={18} /> },
    { target: 200, reward: '베스트 포레스트 시상', icon: <Award className="text-purple-500" size={18} /> },
  ];

  const currentStep = steps.find(s => teamFruitCount < s.target) || steps[steps.length - 1];
  const progress = Math.min((teamFruitCount / steps[steps.length - 1].target) * 100, 100);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-300">
        
        {/* Header with Background Pattern */}
        <div className="relative p-8 bg-gradient-to-br from-[#0F6045] to-[#1a7858] text-white">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors z-10">
            <X size={20} />
          </button>
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-3xl flex items-center justify-center mb-4 shadow-inner border border-white/10">
              <TreePine size={40} className="text-[#d1fae5]" />
            </div>
            <h2 className="text-xl font-black font-headline mb-1">{forestName} 숲</h2>
            <p className="text-sm font-medium text-white/70">누적된 사랑의 열매 현황</p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-8 space-y-8 bg-gray-50/50">
          
          {/* Main Counter */}
          <div className="text-center">
            <div className="inline-flex items-end gap-2 mb-2">
              <span className="text-5xl font-black text-[#0F6045] tracking-tight">{teamFruitCount}</span>
              <span className="text-xl font-bold text-gray-400 mb-1">개</span>
            </div>
            <p className="text-sm font-bold text-gray-500 flex items-center justify-center gap-1.5">
              <Sparkles size={14} className="text-emerald-500" />
              다음 목표까지 {currentStep.target - teamFruitCount > 0 ? currentStep.target - teamFruitCount : 0}개 남았습니다!
            </p>
          </div>

          {/* Progress Bar */}
          <div className="space-y-4">
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner p-1">
              <div 
                className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-1000 ease-out shadow-sm"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            
            <div className="grid grid-cols-3 gap-1">
              {steps.map((s, idx) => (
                <div key={idx} className="flex flex-col items-center text-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-2 shadow-sm border ${teamFruitCount >= s.target ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-white text-gray-300 border-gray-100'}`}>
                    {idx + 1}
                  </div>
                  <span className={`text-[10px] font-bold ${teamFruitCount >= s.target ? 'text-emerald-600' : 'text-gray-400'}`}>
                    {s.target}개
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Rules & Rewards Info */}
          <div className="space-y-4 pt-4 border-t border-gray-200/50">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                <Info size={18} className="text-blue-500" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-0.5">열매 적립 규칙</h4>
                <p className="text-xs text-gray-500 leading-relaxed">우리 아이들이 키즈돌봄 서비스에 참여할 때마다 담당 숲에 열매가 1개씩 적립됩니다.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                <Gift size={18} className="text-amber-500" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-1.5">누적 보상</h4>
                <div className="space-y-2">
                  {steps.map((s, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      {s.icon}
                      <span className={`text-xs font-medium ${teamFruitCount >= s.target ? 'text-emerald-700' : 'text-gray-500'}`}>
                        {s.target}개: {s.reward}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-6 bg-white flex justify-center">
          <button 
            onClick={onClose}
            className="w-full py-4 bg-[#0F6045] hover:bg-[#1a7858] text-white font-bold rounded-2xl shadow-lg shadow-emerald-900/10 active:scale-[0.98] transition-all"
          >
            확인했어요
          </button>
        </div>
      </div>
    </div>
  );
};
