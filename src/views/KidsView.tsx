import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Menu, Bell, User, Flame, QrCode, Users, ClipboardList, Wallet, FileText,
  MapPin, ChevronRight, ChevronLeft, Home, LayoutGrid, BookOpen, Calendar, Baby,
  MessageCircle, ArrowLeft, CheckCircle2, XCircle, FileEdit, X, Search, Phone, Lock, UserCircle, Settings, Award, Clock, Heart, MessageSquare, Send, LogOut, Sparkles, TreePine, HeartHandshake, GraduationCap, History, Plus, Play,
  SlidersHorizontal, Camera, Bookmark, MoreHorizontal, Music, Megaphone, Trash2, MoreVertical, PieChart, AlertTriangle, TrendingUp
} from 'lucide-react';
import { collection, doc, setDoc, addDoc, getDoc, onSnapshot, query, where, orderBy, getDocFromServer, Timestamp, updateDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db as firestoreDb, auth, storage } from '../firebase';
import { VISIT_CATEGORIES, MenuButton, ScheduleItem, MemberRow, OperationType, handleFirestoreError } from '../App';

const KidsView = ({ user, onShowToast }: any) => {
  return (
    <div className="pb-32">
      <div className="pt-6 px-6 space-y-8 max-w-2xl mx-auto">
        {/* Hero Section: Pastel Forest */}
        <section className="relative overflow-hidden rounded-xl h-64 flex flex-col justify-end p-8 bg-gradient-to-br from-[#ffefeb] to-[#ffc4b1]">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-[#fac097]/30 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-48 h-48 bg-[#006948]/5 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <span className="inline-block bg-white/40 backdrop-blur-md px-3 py-1 rounded-full text-[12px] font-bold text-[#8b4932] mb-3 tracking-wider font-headline">FOREST3040 KIDS</span>
            <h2 className="text-3xl font-extrabold text-on-surface leading-tight tracking-tight font-headline">우리 아이들을 위한<br/>따뜻한 숲</h2>
            <p className="text-on-surface-variant mt-2 text-sm">전문 교사와 함께하는 안전하고 행복한 시간</p>
          </div>
          <div className="absolute top-10 right-10 opacity-20">
            <TreePine size={96} className="text-on-surface" />
          </div>
        </section>

        {/* Primary Action: Application Button */}
        <section>
          <button onClick={() => onShowToast('돌봄 사전 신청 폼으로 이동합니다.')} className="w-full group bg-gradient-to-r from-primary to-primary-dim text-white h-18 py-5 px-8 rounded-xl shadow-lg flex items-center justify-between transition-transform active:scale-95 duration-200">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <Baby size={24} className="text-white" />
              </div>
              <span className="text-lg font-bold font-headline">돌봄 사전 신청하기</span>
            </div>
            <ChevronRight size={24} className="text-white group-hover:translate-x-1 transition-transform" />
          </button>
        </section>

        {/* Info Card: Weekly Care Guide */}
        <section className="bg-white rounded-xl p-8 shadow-[0_20px_40px_rgba(46,47,45,0.06)]">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-on-surface font-headline">이번 주 돌봄 안내</h3>
            <span className="bg-secondary-container text-on-secondary-container px-3 py-1 rounded-full text-xs font-bold font-headline">진행 중</span>
          </div>
          <div className="space-y-6">
            <div className="flex items-start gap-5">
              <div className="w-10 h-10 bg-[#8b4932]/10 rounded-full flex items-center justify-center shrink-0">
                <MapPin size={20} className="text-[#8b4932]" />
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1 font-headline">장소</p>
                <p className="text-lg font-semibold text-on-surface font-headline">비전센터 2층 (키즈룸)</p>
              </div>
            </div>
            <div className="flex items-start gap-5">
              <div className="w-10 h-10 bg-[#8b4932]/10 rounded-full flex items-center justify-center shrink-0">
                <Clock size={20} className="text-[#8b4932]" />
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1 font-headline">시간</p>
                <p className="text-lg font-semibold text-on-surface font-headline">주일 오후 1:30 ~ 3:30</p>
              </div>
            </div>
            <div className="flex items-start gap-5">
              <div className="w-10 h-10 bg-[#8b4932]/10 rounded-full flex items-center justify-center shrink-0">
                <Users size={20} className="text-[#8b4932]" />
              </div>
              <div>
                <p className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1 font-headline">대상</p>
                <p className="text-lg font-semibold text-on-surface font-headline">3세 ~ 미취학 아동</p>
              </div>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-surface-container-low flex items-center justify-between">
            <div className="flex -space-x-3">
              <img className="w-10 h-10 rounded-full border-2 border-white object-cover" alt="Teacher 1" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhiF083HjOk0GpL3SjDq9y4r3U1KlDFB1wnmnPovJ-GjvR3lg9sD4l8q2haAD0vehpDH0oobryl1e0Ep-7Gy4oY7eJRpRxYDP3zyKeTgCyV2pFAR1brjj_L6ihhEg5E5VxFwug6sllKQ1XqYAyXhU9gWCpjLjxK7lTZ7APhEN-6Qw_G8No1vLBeUFYf0Cw6quaXQ8avirMksA53ogQiGoQFaT8Cb1ynpSMLpbQOBw67Y8Q03Bw38WJhmpXETd7aWb_vLERW6_7Dw" referrerPolicy="no-referrer" />
              <img className="w-10 h-10 rounded-full border-2 border-white object-cover" alt="Teacher 2" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCPlpvNbb4XJboVSu2tbfRp9xDLKVJnDPuUMhd2_5wg8LquZXh-QwooKk9Of5qmgquKYF65roFbTo3dvDE2C_OaC1sGRfOJp8XYqPqwgCx4XzeDmxHbKDc9t9HtFci3N9D9KniZk3KO6-nB5m5cYV6paPewDNRGntzELDKLlhRddlzWoadfPXBSeOEbyxuINucZog-BS_QoE1fTsJMXms3BptjGJelXXELxG8w8Pm1yyREgQjPPGdG9kvm4j1WRYr55zEIVwDNm1Q" referrerPolicy="no-referrer" />
              <div className="w-10 h-10 rounded-full bg-[#fac097] border-2 border-white flex items-center justify-center text-[10px] font-bold text-[#613b1c]">+2</div>
            </div>
            <p className="text-sm text-on-surface-variant font-medium">현재 12명의 아이들이 신청했어요</p>
          </div>
        </section>

        {/* My Status: Registration History */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-xl font-bold text-on-surface font-headline">나의 신청 내역</h3>
            <button onClick={() => onShowToast('전체 내역 페이지로 이동합니다.')} className="text-sm font-semibold text-primary hover:underline">전체보기</button>
          </div>
          {/* Empty State Placeholder or Item */}
          <div className="bg-[#f1f1ee] rounded-xl p-10 flex flex-col items-center justify-center text-center border-2 border-dashed border-[#adadab]/20">
            <div className="w-16 h-16 bg-[#e3e3df] rounded-full flex items-center justify-center mb-4">
              <History size={32} className="text-[#767775]" />
            </div>
            <p className="text-on-surface-variant font-medium">최근 신청 내역이 없습니다</p>
            <p className="text-xs text-[#767775] mt-1">우리 아이를 위한 첫 신청을 시작해보세요!</p>
          </div>
        </section>

        {/* Gallery / Features Grid */}
        <section className="grid grid-cols-2 gap-4">
          <div className="aspect-square rounded-xl bg-[#fac097] overflow-hidden relative group">
            <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Play" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDbZCKi3cgC_Fn5j5uhlKWmh3lI4_KwAQaTU-Tyg-6JnqSNBFg1xpue3jQsIn1n0ORZRsBKBLe-iBobY-Ph5jYw8yAwuf8ThG4IryagoU8mhXu4klzPDa9BmGmCXuuTl09n3yA20TyWP0Rvbw8G1lRYjisfx_3RD-Jb_RUHujpnSFiwU8H2k7G_BkX-RdSvdn73G_Oag-GgByCDiVeyXZhimt6ucKIEl8O2yujE9OefkwBA32NLFdNid2cG0cgrg1XLHV9i9wfPNg" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent p-4 flex flex-col justify-end">
              <p className="text-white text-xs font-bold uppercase tracking-widest font-headline">프로그램</p>
              <p className="text-white font-bold font-headline">오감 놀이</p>
            </div>
          </div>
          <div className="aspect-square rounded-xl bg-[#6bffc1] overflow-hidden relative group">
            <img className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" alt="Safety" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBq-w949lDzuA1HLdgMWSKlWpYy9R3hI9wm4BfWw7MMz2MOzgvX9KXoi2moVGHHZYvq4e51ig7a4h-6tjLpdqricBHsA62V93gc2VUdoR-dJr8gc_SdCTV5VQqHE2uOEn0H4mJBEQ4EAj6XHxZw393ACUtKc0LJM0TGBPk7frz3Tn-_LT6uLKaaadVGuRYhmGC__tWQhHfVE3pdZzw_pFTUK2itDxD_A1QmJZR9QZzSbwN4tw-vsbiLHpyVYBVwEe4P5zC8PRW_EA" referrerPolicy="no-referrer" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent p-4 flex flex-col justify-end">
              <p className="text-white text-xs font-bold uppercase tracking-widest font-headline">안전 관리</p>
              <p className="text-white font-bold font-headline">실시간 모니터링</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default KidsView;
