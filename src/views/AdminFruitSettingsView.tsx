import React, { useEffect, useState } from 'react';
import {
  ChevronLeft, TrendingUp, RotateCcw, Save, AlertTriangle, TreePine
} from 'lucide-react';
import {
  doc, setDoc, onSnapshot, collection, getDocs,
  query, where, writeBatch
} from 'firebase/firestore';
import { db as firestoreDb } from '../firebase';

// 숲 목록 (App.tsx의 FOREST_GROUPS와 동일)
const FOREST_GROUPS = [
  { forest_id: 'bebe', name: '베베숲' },
  { forest_id: 'superpower', name: '숲퍼파워' },
  { forest_id: 'supermance', name: '숲퍼맨스' },
  { forest_id: 'bts', name: 'BTS숲' },
  { forest_id: 'haneul', name: '하늘숲' },
  { forest_id: 'bamboo', name: '대나무숲' },
  { forest_id: 'tta', name: '따숲' },
  { forest_id: 'pureun', name: '푸른숲' },
  { forest_id: 'goyo', name: '고요숲' },
  { forest_id: 'supreme', name: '숲프림' },
  { forest_id: 'start', name: '숲타트' },
];

interface Props {
  onBack: () => void;
  onShowToast: (msg: string) => void;
}

export default function AdminFruitSettingsView({ onBack, onShowToast }: Props) {
  // ─── 보상 텍스트 상태 ─────────────────────────────────────────
  const [rewardText, setRewardText] = useState(
    '50개: 마을 간식 지원\n100개: 마을 식사 지원\n200개: 베스트 포레스트 시상'
  );
  const [editVal, setEditVal] = useState(rewardText);
  const [isSaving, setIsSaving] = useState(false);

  // ─── 숲별 열매 카운트 상태 ────────────────────────────────────
  const [fruitCounts, setFruitCounts] = useState<Record<string, number>>({});
  const [confirmReset, setConfirmReset] = useState<string | null>(null);
  const [resettingId, setResettingId] = useState<string | null>(null);

  // 보상 텍스트 실시간 구독
  useEffect(() => {
    const unsub = onSnapshot(
      doc(firestoreDb, 'settings', 'fruitRewards'),
      (snap) => {
        if (snap.exists() && snap.data().text) {
          setRewardText(snap.data().text);
          setEditVal(snap.data().text);
        }
      }
    );
    return () => unsub();
  }, []);

  // 숲별 카운터 실시간 구독
  useEffect(() => {
    const unsub = onSnapshot(
      collection(firestoreDb, 'forest_fruit_counts'),
      (snap) => {
        const counts: Record<string, number> = {};
        snap.docs.forEach((d) => { counts[d.id] = d.data().count || 0; });
        setFruitCounts(counts);
      }
    );
    return () => unsub();
  }, []);

  // ─── 보상 텍스트 저장 ─────────────────────────────────────────
  const handleSaveReward = async () => {
    setIsSaving(true);
    try {
      await setDoc(doc(firestoreDb, 'settings', 'fruitRewards'), { text: editVal });
      onShowToast('보상 안내가 저장되었습니다.');
    } catch (e) {
      console.error(e);
      onShowToast('저장 실패. 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  // ─── 숲별 열매 초기화 ─────────────────────────────────────────
  const handleResetForest = async (forestId: string, forestName: string) => {
    setResettingId(forestId);
    try {
      // 1) 집계 카운터 0으로 리셋
      await setDoc(
        doc(firestoreDb, 'forest_fruit_counts', forestId),
        { count: 0 }
      );

      // 2) daily_fruits에서 해당 숲 문서 배치 삭제
      const q = query(
        collection(firestoreDb, 'daily_fruits'),
        where('forest_id', '==', forestId)
      );
      const snap = await getDocs(q);
      if (snap.size > 0) {
        const BATCH_SIZE = 400;
        for (let i = 0; i < snap.docs.length; i += BATCH_SIZE) {
          const batch = writeBatch(firestoreDb);
          snap.docs.slice(i, i + BATCH_SIZE).forEach((d) => batch.delete(d.ref));
          await batch.commit();
        }
      }

      setConfirmReset(null);
      onShowToast(`${forestName} 열매가 초기화되었습니다.`);
    } catch (e) {
      console.error(e);
      onShowToast('초기화 실패. 다시 시도해주세요.');
    } finally {
      setResettingId(null);
    }
  };

  // 표시용 데이터 (카운트 내림차순 정렬)
  const forestsWithCounts = FOREST_GROUPS.map((fg) => ({
    ...fg,
    count: fruitCounts[fg.forest_id] || 0,
  })).sort((a, b) => b.count - a.count);

  const totalFruits = forestsWithCounts.reduce((s, f) => s + f.count, 0);

  return (
    <div className="absolute inset-0 bg-[#f7f6f3] z-[60] flex flex-col min-h-screen overflow-y-auto pb-24">
      {/* ── 헤더 ── */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-100">
        <div className="flex items-center gap-3 px-4 py-4">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-gray-100 active:scale-95 transition-all"
          >
            <ChevronLeft size={22} className="text-gray-700" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500 rounded-xl flex items-center justify-center">
              <TrendingUp size={16} className="text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base text-gray-900 leading-tight">
                열매 보상 안내 설정
              </h1>
              <p className="text-[10px] text-gray-400">
                보상 텍스트 편집 · 숲별 열매 초기화
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-6">
        {/* ── 전체 열매 현황 요약 ── */}
        <div className="bg-gradient-to-br from-emerald-500 to-[#0F6045] rounded-2xl p-5 flex items-center justify-between text-white shadow-lg shadow-emerald-900/20">
          <div>
            <p className="text-xs font-bold opacity-70 mb-0.5">전체 누적 열매</p>
            <p className="text-4xl font-black tracking-tight">
              {totalFruits}
              <span className="text-lg font-bold ml-1 opacity-70">개</span>
            </p>
            <p className="text-[11px] opacity-60 mt-1">숲 {forestsWithCounts.length}개 합산</p>
          </div>
          <div className="opacity-20">
            <TreePine size={72} />
          </div>
        </div>

        {/* ── 섹션 1: 보상 텍스트 편집 ── */}
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
            🎁 누적 보상 안내 텍스트
          </h2>
          <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
            <p className="text-xs text-gray-500 leading-relaxed">
              앱 내 열매 현황 팝업의 <strong>"누적 보상 안내"</strong>에 표시되는 문구입니다.
              줄바꿈으로 항목을 구분해 입력하세요.
            </p>
            <textarea
              value={editVal}
              onChange={(e) => setEditVal(e.target.value)}
              rows={6}
              className="w-full p-3 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none font-medium"
              placeholder={'예시:\n50개: 마을 간식 지원\n100개: 마을 식사 지원\n200개: 베스트 포레스트 시상'}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveReward}
                disabled={isSaving || editVal === rewardText}
                className="flex-1 flex items-center justify-center gap-2 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-white font-bold rounded-xl text-sm transition-all active:scale-95"
              >
                <Save size={14} />
                {isSaving ? '저장 중...' : '저장하기'}
              </button>
              <button
                onClick={() => setEditVal(rewardText)}
                disabled={editVal === rewardText}
                className="px-4 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl text-sm transition-all active:scale-95 disabled:opacity-40"
              >
                되돌리기
              </button>
            </div>
          </div>
        </section>

        {/* ── 섹션 2: 숲별 열매 초기화 ── */}
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">
            🔄 숲별 열매 초기화
          </h2>

          {/* 경고 배너 */}
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 mb-3 flex items-start gap-2">
            <AlertTriangle size={15} className="text-rose-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-rose-700 font-medium leading-relaxed">
              초기화하면 해당 숲의 <strong>물주기 기록 전체</strong>와{' '}
              <strong>누적 카운터</strong>가 삭제됩니다.
              이 작업은 <strong>되돌릴 수 없습니다.</strong>
            </p>
          </div>

          <div className="space-y-2">
            {forestsWithCounts.map((forest) => (
              <div
                key={forest.forest_id}
                className="bg-white rounded-2xl px-4 py-3 shadow-sm border border-gray-100 flex items-center justify-between gap-3"
              >
                {/* 이름 + 카운트 */}
                <div>
                  <p className="font-bold text-gray-900 text-sm">{forest.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    누적 열매{' '}
                    <span className={`font-black ${forest.count > 0 ? 'text-emerald-600' : 'text-gray-300'}`}>
                      {forest.count}개
                    </span>
                  </p>
                </div>

                {/* 초기화 버튼 또는 확인 UI */}
                {confirmReset === forest.forest_id ? (
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] text-rose-600 font-bold">정말 초기화?</span>
                    <button
                      onClick={() => handleResetForest(forest.forest_id, forest.name)}
                      disabled={resettingId === forest.forest_id}
                      className="px-3 py-1.5 bg-rose-500 text-white text-xs font-bold rounded-xl active:scale-95 transition-all disabled:opacity-50"
                    >
                      {resettingId === forest.forest_id ? '처리중...' : '확인'}
                    </button>
                    <button
                      onClick={() => setConfirmReset(null)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-bold rounded-xl active:scale-95 transition-all"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmReset(forest.forest_id)}
                    disabled={forest.count === 0}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 text-xs font-bold rounded-xl border border-rose-200 active:scale-95 transition-all disabled:opacity-25 disabled:cursor-not-allowed"
                  >
                    <RotateCcw size={12} />
                    초기화
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
