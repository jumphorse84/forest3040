const fs = require('fs');

const backup = fs.readFileSync('src/App.tsx.backup', 'utf-8');

const commonImports = `import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Menu, Bell, User, Flame, QrCode, Users, ClipboardList, Wallet, FileText,
  MapPin, ChevronRight, ChevronLeft, Home, LayoutGrid, BookOpen, Calendar, Baby,
  MessageCircle, ArrowLeft, CheckCircle2, XCircle, FileEdit, X, Search, Phone, Lock, UserCircle, Settings, Award, Clock, Heart, MessageSquare, Send, LogOut, Sparkles, TreePine, HeartHandshake, GraduationCap, History, Plus, Play,
  SlidersHorizontal, Camera, Bookmark, MoreHorizontal, Music, Megaphone, Trash2, MoreVertical, PieChart, AlertTriangle, TrendingUp
} from 'lucide-react';
import { collection, doc, setDoc, addDoc, getDoc, onSnapshot, query, where, orderBy, getDocFromServer, Timestamp, updateDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { db as firestoreDb, auth, storage } from '../firebase';
import { VISIT_CATEGORIES, MenuButton, ScheduleItem, SmallGroupCard, MemberRow, OperationType, handleFirestoreError } from '../App';
`;

// Based on discovered positions, build a proper ordered list
// Format: [componentName, startOffset, componentExportedName, outFile]
const componentOrder = [
  { name: 'HomeView',                   start: 36566,  file: 'src/views/HomeView.tsx' },
  { name: 'MembersView',                start: 45445,  file: 'src/views/MembersView.tsx' },
  { name: 'AdminUserManagementView',    start: 76048,  file: 'src/views/AdminUserManagementView.tsx' },
  { name: 'MyPageView',                 start: 86929,  file: 'src/views/MyPageView.tsx' },
  { name: 'ProgramView',                start: 109358, file: 'src/views/ProgramView.tsx' },
  { name: 'ProgramAddView',             start: 116565, file: 'src/views/ProgramAddView.tsx' },
  { name: 'WorshipView',                start: 132791, file: 'src/views/WorshipView.tsx' },
  { name: 'WorshipAddView',             start: 139147, file: 'src/views/WorshipAddView.tsx' },
  { name: 'WorshipDetailView',          start: 157971, file: 'src/views/WorshipDetailView.tsx' },
  { name: 'KidsView',                   start: 166162, file: 'src/views/KidsView.tsx' },
  { name: 'CalendarView',               start: 174843, file: 'src/views/CalendarView.tsx' },
  { name: 'SurveyView',                 start: 185463, file: 'src/views/SurveyView.tsx' },
  { name: 'PastoralStatsDashboardView', start: 220514, file: 'src/views/PastoralStatsDashboardView.tsx' },
];

// Sort by start position to determine end boundaries
componentOrder.sort((a, b) => a.start - b.start);

for (let i = 0; i < componentOrder.length; i++) {
  const comp = componentOrder[i];
  // Find the actual start of "const XxxView ="
  const startMarker = `\nconst ${comp.name} = `;
  let startIdx = backup.indexOf(startMarker, comp.start - 10);
  if (startIdx === -1) startIdx = backup.lastIndexOf(`const ${comp.name} = `, comp.start + 100);
  if (startIdx === -1) { console.log(`❌ Start not found: ${comp.name}`); continue; }

  // End is either next component start or the export default App
  let endIdx;
  // Find next component that comes after this one
  const nextComp = componentOrder[i + 1];
  if (nextComp) {
    endIdx = backup.indexOf(`\nconst ${nextComp.name} = `, nextComp.start - 10);
  }
  if (!endIdx || endIdx === -1) {
    endIdx = backup.indexOf('\nexport default function App', startIdx);
  }
  if (endIdx === -1) endIdx = backup.length;

  const componentCode = backup.substring(startIdx + 1, endIdx).trim(); // +1 to skip leading \n
  const fileContent = `${commonImports}
${componentCode}

export default ${comp.name};
`;

  fs.writeFileSync(comp.file, fileContent, 'utf-8');
  console.log(`✅ ${comp.name} (${Math.round(componentCode.length / 1024)}KB) -> ${comp.file}`);
}

console.log('\nDone rebuilding views!');
