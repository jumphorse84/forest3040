const fs = require('fs');
const path = require('path');

const APP_PATH = path.join(__dirname, 'src', 'App.tsx');
let content = fs.readFileSync(APP_PATH, 'utf-8');

const targets = [
  { name: 'AdminUserManagementView', dir: 'views' },
  { name: 'MembersView', dir: 'views' },
  { name: 'WorshipDetailView', dir: 'views' },
  { name: 'HomeView', dir: 'views' },
  { name: 'CalendarView', dir: 'views' },
  { name: 'WorshipView', dir: 'views' },
  { name: 'ProgramView', dir: 'views' },
  { name: 'KidsView', dir: 'views' }
];

['views', 'components'].forEach(dir => {
  const p = path.join(__dirname, 'src', dir);
  if (!fs.existsSync(p)) fs.mkdirSync(p);
});

const commonImports = "import React, { useState, useEffect, useRef } from 'react';\n" +
"import {\n" +
"  Menu, Bell, User, Flame, QrCode, Users, ClipboardList, Wallet, FileText,\n" +
"  MapPin, ChevronRight, ChevronLeft, Home, LayoutGrid, BookOpen, Calendar, Baby,\n" +
"  MessageCircle, ArrowLeft, CheckCircle2, XCircle, FileEdit, X, Search, Phone, Lock, UserCircle, Settings, Award, Clock, Heart, MessageSquare, Send, LogOut, Sparkles, TreePine, HeartHandshake, GraduationCap, History, Plus, Play,\n" +
"  SlidersHorizontal, Camera, Bookmark, MoreHorizontal, Music, Megaphone, Trash2, MoreVertical, PieChart, AlertTriangle, TrendingUp\n" +
"} from 'lucide-react';\n" +
"import { collection, doc, setDoc, addDoc, getDoc, onSnapshot, query, where, orderBy, getDocFromServer, Timestamp, updateDoc, deleteDoc, arrayUnion, arrayRemove } from 'firebase/firestore';\n" +
"import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';\n" +
"import { db as firestoreDb, auth, storage } from '../firebase';\n" +
"import { VISIT_CATEGORIES } from '../App';\n\n";

let importMents = [];

targets.forEach(target => {
  const decRegex = new RegExp('^const ' + target.name + ' = \\(', 'm');
  const match = content.match(decRegex);
  if (!match) {
    console.log('Skipping (not found):', target.name);
    return;
  }
  
  const startIndex = match.index;
  const rest = content.slice(startIndex);
  const endMatch = rest.match(/^};/m);
  if (!endMatch) {
    console.log('End not found for', target.name);
    return;
  }
  
  const endIndex = startIndex + endMatch.index + 2; 
  let componentString = content.slice(startIndex, endIndex);
  
  const needsMockDb = componentString.includes('mockDb') ? "import { mockDb } from '../App';\n\n" : "";
  const finalFileContent = commonImports + needsMockDb + componentString + "\n\nexport default " + target.name + ";\n";
    
  const filePath = path.join(__dirname, 'src', target.dir, target.name + '.tsx');
  fs.writeFileSync(filePath, finalFileContent);
  console.log('Created ' + filePath);
  
  content = content.slice(0, startIndex) + content.slice(endIndex);
  importMents.push("import " + target.name + " from './" + target.dir + "/" + target.name + "';");
});

const lastImportIdx = content.lastIndexOf("from './firebase';");
if (lastImportIdx !== -1) {
  const endOfLine = content.indexOf('\n', lastImportIdx);
  content = content.slice(0, endOfLine + 1) + importMents.join('\n') + '\n' + content.slice(endOfLine + 1);
}

content = content.replace('const mockDb = {', 'export const mockDb = {');
content = content.replace('const VISIT_CATEGORIES = [', 'export const VISIT_CATEGORIES = [');

fs.writeFileSync(APP_PATH, content);
console.log('App.tsx updated and components extracted successfully.');
