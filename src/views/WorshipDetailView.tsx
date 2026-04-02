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

const WorshipDetailView = ({ worshipId, worships, onBack }: { worshipId: string | null, worships: any[], onBack: () => void }) => {
  const worship = worships.find(w => w.id === worshipId);

  useEffect(() => {
    if (worshipId) {
      const updateViewCount = async () => {
        try {
          const worshipRef = doc(firestoreDb, 'worships', worshipId);
          await updateDoc(worshipRef, {
            view_count: (worship?.view_count || 0) + 1
          });
        } catch (err) {
          console.error('Failed to update view count:', err);
        }
      };
      updateViewCount();
    }
  }, [worshipId]);

  if (!worship) return null;

  const formatDate = (date: any) => {
    if (!date) return '';
    const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  return (
    <div className="absolute inset-0 bg-surface z-[60] flex flex-col min-h-screen overflow-y-auto pb-32">
      {/* Background Hero */}
      <div className="relative h-80 shrink-0">
        <img 
          src={worship.image || "https://picsum.photos/seed/worship/800/1200"} 
          className="w-full h-full object-cover" 
          alt="Worship background" 
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/40"></div>
        
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <button onClick={onBack} className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
            <X size={24} />
          </button>
          <div className="flex gap-2">
            <button className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
              <Bookmark size={20} />
            </button>
            <button className="px-5 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center gap-2 text-white font-bold text-sm border border-white/20">
              <Send size={18} />
              <span>공유</span>
            </button>
          </div>
        </div>

        <div className="absolute bottom-8 left-8 right-8 space-y-2">
          <h2 className="text-white text-4xl font-bold tracking-tight">{worship.title}</h2>
          <p className="text-white/80 font-bold text-sm bg-white/20 backdrop-blur-md inline-block px-3 py-1 rounded-lg border border-white/20">
            {formatDate(worship.date)}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 -mt-6 relative z-10 space-y-8">
        {/* YouTube Video Section */}
        {worship.youtube_url && (() => {
          let embedUrl = worship.youtube_url;
          const match = worship.youtube_url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
          if (match?.[1]) embedUrl = `https://www.youtube.com/embed/${match[1]}?rel=0`;
          return (
            <div className="rounded-2xl overflow-hidden shadow-sm aspect-video w-full">
              <iframe 
                className="w-full h-full"
                src={embedUrl}
                title="YouTube video player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
              />
            </div>
          );
        })()}

        {/* Scripture Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 px-2">
            <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 border border-green-100">
              <BookOpen size={20} />
            </div>
            <h3 className="font-bold text-on-surface">본문 말씀</h3>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-surface-container-highest shadow-sm space-y-4">
            <h4 className="text-2xl font-bold text-primary">{worship.scripture}</h4>
            <p className="text-on-surface-variant leading-relaxed whitespace-pre-wrap">
              {worship.scripture_content}
            </p>
          </div>
        </div>

        {/* Participants Section */}
        {worship.participants && worship.participants.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                <Users size={20} />
              </div>
              <h3 className="font-bold text-on-surface">예배 임사자</h3>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-surface-container-highest shadow-sm space-y-4">
              {worship.participants.map((p: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between border-b border-surface-container-low last:border-0 pb-3 last:pb-0">
                  <span className="text-on-surface-variant font-bold">{p.role}</span>
                  <span className="text-on-surface font-bold">{p.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Praise Section */}
        {worship.praise && worship.praise.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 border border-orange-100">
                <Music size={20} />
              </div>
              <h3 className="font-bold text-on-surface">경배와 찬양</h3>
            </div>
            <div className="space-y-3">
              {worship.praise.map((p: any, idx: number) => (
                <a 
                  key={idx} 
                  href={p.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-white rounded-2xl p-4 flex items-center gap-4 border border-surface-container-highest shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-error/10 flex items-center justify-center text-error group-hover:scale-110 transition-transform">
                    <Play size={24} fill="currentColor" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-on-surface">{p.title}</h4>
                    <p className="text-xs text-on-surface-variant truncate">{p.link}</p>
                  </div>
                  <ChevronRight size={20} className="text-on-surface-variant" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Announcements Section */}
        {worship.announcements && worship.announcements.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 px-2">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
                <Megaphone size={20} />
              </div>
              <h3 className="font-bold text-on-surface">광고</h3>
            </div>
            <div className="bg-white rounded-2xl p-5 border border-surface-container-highest shadow-sm space-y-6">
              {worship.announcements.map((a: any, idx: number) => (
                <div key={idx} className="space-y-1 border-b border-surface-container-low last:border-0 pb-4 last:pb-0">
                  <h4 className="font-bold text-on-surface text-lg">{a.title}</h4>
                  <p className="text-on-surface-variant text-sm leading-relaxed">{a.content}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorshipDetailView;
