import React from 'react';
import { X, Award, Info, Gift, TrendingUp, Sparkles, TreePine } from 'lucide-react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db as firestoreDb } from '../firebase';

interface FruitStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamFruitCount: number;
  totalFruitCount?: number;
  forestName: string;
  leaderboard?: { forestName: string, count: number, emoji: string }[];
  isAdmin?: boolean;
}

export const FruitStatusModal: React.FC<FruitStatusModalProps> = ({ isOpen, onClose, teamFruitCount, totalFruitCount, forestName, leaderboard = [], isAdmin }) => {
  const [showTooltip, setShowTooltip] = React.useState(false);
  const [isEditingReward, setIsEditingReward] = React.useState(false);
  const [rewardText, setRewardText] = React.useState("50개: 마을 간식 지원\n100개: 마을 식사 지원\n200개: 베스트 포레스트 시상");
  const [editVal, setEditVal] = React.useState(rewardText);

  React.useEffect(() => {
    if (!isOpen) return;
    const unsub = onSnapshot(doc(firestoreDb, 'settings', 'fruitRewards'), (docSnap) => {
      if (docSnap.exists() && docSnap.data().text) {
        setRewardText(docSnap.data().text);
        setEditVal(docSnap.data().text);
      }
    });
    return () => unsub();
  }, [isOpen]);

  const handleSaveReward = async () => {
    try {
      await setDoc(doc(firestoreDb, 'settings', 'fruitRewards'), { text: editVal });
      setIsEditingReward(false);
    } catch(e) {
      console.error(e);
    }
  };

  if (!isOpen) return null;
  const displayCount = totalFruitCount ?? teamFruitCount;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-10 duration-300">
        
        {/* Header */}
        <div className="relative p-8 pb-10 bg-white text-[#0F6045] overflow-hidden border-b border-gray-100">
          {/* Decorative background orbs */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-100/50 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-50/50 rounded-full -ml-10 -mb-10 blur-2xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/4 w-20 h-20 bg-emerald-100/30 rounded-full blur-xl pointer-events-none" />

          {/* Buttons */}
          <div className="absolute top-5 left-5 z-10">
            <button onClick={() => setShowTooltip(true)} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center border border-gray-200 text-gray-500 hover:text-[#0F6045]">
              <Info size={18} />
            </button>
          </div>
          <button onClick={onClose} className="absolute top-5 right-5 p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors z-10 border border-gray-200 text-gray-500 hover:text-[#0F6045]">
            <X size={18} />
          </button>

          {/* Tree icon with glow — no white box */}
          <div className="relative z-10 flex flex-col items-center text-center mt-3">
            <div className="relative mb-5">
              {/* Outer glow ring */}
              <div className="absolute inset-0 rounded-full bg-emerald-100/50 blur-xl scale-125 pointer-events-none" />
              {/* Inner soft circle */}
              <div className="relative w-28 h-28 rounded-full bg-emerald-50/80 flex items-center justify-center shadow-[0_0_40px_rgba(52,211,153,0.15)] hover:scale-105 transition-transform duration-300 overflow-hidden border border-emerald-100/50">
                <img src="/3d_tree.png" alt="3D Tree Logo" className="w-24 h-24 object-contain drop-shadow-xl" />
              </div>
            </div>
            <h2 className="text-xl font-black font-headline mb-1 text-[#0F6045]">{forestName.endsWith('숲') ? forestName : `${forestName} 숲`}</h2>
            <p className="text-xs font-semibold text-emerald-600 tracking-widest uppercase">누적 사랑의 열매 현황</p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-8 space-y-8 bg-gray-50/50">
          
          {/* Main Counter */}
          <div className="text-center">
            <div className="inline-flex items-end gap-2 mb-2">
              <span className="text-5xl font-black text-[#0F6045] tracking-tight">{displayCount}</span>
              <span className="text-xl font-bold text-gray-400 mb-1">개</span>
            </div>
          </div>

          {/* Leaderboard */}
          <div className="space-y-4 pt-4 border-t border-gray-200/50">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-emerald-800 font-bold flex items-center gap-2">
                <TrendingUp size={18} />
                우리들의 사랑의 열매 현황
              </h4>
            </div>
            
            <div className="space-y-3 max-h-[220px] overflow-y-auto px-1 pb-2">
              {leaderboard.map((forest: any, idx: number) => {
                let badge = null;
                if (idx === 0) badge = "🥇";
                else if (idx === 1) badge = "🥈";
                else if (idx === 2) badge = "🥉";

                const isMine = forest.forestName === forestName;

                return (
                  <div key={idx} className={`flex items-center justify-between p-3 rounded-2xl border transition-colors ${
                    isMine ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-white border-gray-100 shadow-sm'
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-lg relative">
                        {forest.emoji || '🌳'}
                        {badge && <span className="absolute -top-1 -left-2 text-sm">{badge}</span>}
                      </div>
                      <span className={`font-bold text-sm ${isMine ? 'text-emerald-800' : 'text-gray-700'}`}>
                        {forest.forestName.endsWith('숲') ? forest.forestName : `${forest.forestName} 숲`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`font-black tracking-tight ${isMine ? 'text-emerald-600' : 'text-gray-500'}`}>{forest.count}</span>
                      <span className="text-xs text-gray-400">개</span>
                    </div>
                  </div>
                );
              })}
              {leaderboard.length === 0 && (
                <div className="text-center text-gray-400 text-sm py-4">데이터를 불러오는 중입니다...</div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-6 bg-white flex justify-center border-t border-gray-100">
          <button 
            onClick={onClose}
            className="w-full py-4 bg-[#0F6045] hover:bg-[#1a7858] text-white font-bold rounded-2xl shadow-lg shadow-emerald-900/10 active:scale-[0.98] transition-all"
          >
            확인했어요
          </button>
        </div>

        {/* Tooltip Modal */}
        {showTooltip && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50">
            <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl relative">
              <button onClick={() => { setShowTooltip(false); setIsEditingReward(false); }} className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full text-gray-500">
                <X size={16} />
              </button>
              
              <h3 className="text-lg font-bold text-[#0F6045] mb-4 flex items-center gap-2">
                <Info size={20} />
                열매 적립 및 보상 안내
              </h3>
              
              <div className="space-y-4 text-sm mt-4">
                <div className="bg-emerald-50 rounded-2xl p-4">
                  <h4 className="font-bold text-emerald-800 mb-2">열매 적립 규칙</h4>
                  <ul className="list-inside list-disc text-emerald-700 space-y-1 text-xs">
                    <li>키즈돌봄 서비스에 참여할 때 1개 적립</li>
                    <li>매일 앱에 방문하여 물주기 누를 때 1개 적립</li>
                  </ul>
                </div>
                
                <div className="bg-amber-50 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-amber-800">누적 보상 안내</h4>
                    {isAdmin && !isEditingReward && (
                      <button onClick={() => setIsEditingReward(true)} className="text-[10px] bg-amber-200 text-amber-900 px-2 py-1 rounded-full font-bold">수정</button>
                    )}
                  </div>
                  
                  {isEditingReward ? (
                    <div className="space-y-2">
                      <textarea
                        value={editVal}
                        onChange={(e) => setEditVal(e.target.value)}
                        className="w-full h-24 p-2 text-xs border border-amber-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400"
                      />
                      <div className="flex gap-2">
                        <button onClick={handleSaveReward} className="flex-1 bg-amber-500 text-white text-xs py-2 rounded-xl font-bold">저장</button>
                        <button onClick={() => { setIsEditingReward(false); setEditVal(rewardText); }} className="flex-1 bg-gray-200 text-gray-600 text-xs py-2 rounded-xl font-bold">취소</button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-amber-700 text-xs whitespace-pre-wrap leading-relaxed">
                      {rewardText}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
