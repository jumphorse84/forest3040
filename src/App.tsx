/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Menu, Bell, User, Flame, QrCode, Users, ClipboardList, Wallet, FileText,
  MapPin, ChevronRight, ChevronLeft, Home, LayoutGrid, BookOpen, Calendar, Baby,
  MessageCircle, ArrowLeft, CheckCircle2, XCircle, FileEdit, X, Search, Phone, Lock, UserCircle, Settings, Award, Clock, Heart, MessageSquare, Send, LogOut, Sparkles, TreePine, HeartHandshake, GraduationCap, History, Plus, Play,
  SlidersHorizontal, Camera, Bookmark, MoreHorizontal, Music, Megaphone, Trash2, MoreVertical, PieChart, AlertTriangle, TrendingUp
} from 'lucide-react';
import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  getDocFromServer,
  Timestamp,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db as firestoreDb, auth, storage } from './firebase';
import {
  signInWithCustomToken,
  onAuthStateChanged,
  signOut,
  User as FirebaseUser,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  OAuthProvider
} from 'firebase/auth';
import { jwtDecode } from 'jwt-decode';
import AdminUserManagementView from './views/AdminUserManagementView';
import CalendarView from './views/CalendarView';
import ForestCommunityView from './views/ForestCommunityView';
import HomeView from './views/HomeView';
import KidsCareAddView from './views/KidsCareAddView';
import KidsCareAdminView from './views/KidsCareAdminView';
import KidsCareApplyView from './views/KidsCareApplyView';
import KidsCareDetailView from './views/KidsCareDetailView';
import KidsView from './views/KidsView';
import MembersView from './views/MembersView';
import MinutesView from './views/MinutesView';
import MyPageView from './views/MyPageView';
import PastoralStatsDashboardView from './views/PastoralStatsDashboardView';
import ProgramAddView from './views/ProgramAddView';
import ProgramDetailView from './views/ProgramDetailView';
import ProgramView from './views/ProgramView';
import SurveyView from './views/SurveyView';
import WorshipAddView from './views/WorshipAddView';
import WorshipDetailView from './views/WorshipDetailView';
import WorshipView from './views/WorshipView';
import { NotificationModal } from './components/NotificationModal';
import PastoralCardModal, { VISIT_CATEGORIES } from './components/PastoralCardModal';
import AdminAttendanceScannerView from './views/AdminAttendanceScannerView';

// ==========================================
// Types & Error Handling
// ==========================================
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// ==========================================
// 1. Mock Data (Fallback)
// ==========================================
const mockDb = {
  users: [
    { uid: 'u1', name: '김하늘', role: 'member', forest_id: 'f1', score: 120, phone: '010-1111-2222', attendance_rate: 92, badges: ['🌱 새가족반 수료', '🔥 5주 연속 출석'], activity_history: [{ id: 'h1', date: '2026.03.22', type: '출석', desc: '3월 3주차 주일예배 출석완료' }], email: 'sky@example.com', profile_image: 'https://picsum.photos/seed/sky/200' },
    { uid: 'u2', name: '이소망', role: 'leader', forest_id: 'f2', score: 80, phone: '010-2222-3333', email: 'hope@example.com', profile_image: 'https://picsum.photos/seed/hope/200' },
    { uid: 'u3', name: '다윗 민', role: 'member', forest_id: 'f1', score: 45, phone: '010-3333-4444', email: 'david@example.com', profile_image: 'https://picsum.photos/seed/david/200' },
  ],
  forests: [
    { forest_id: 'f1', name: '베베숲', leader_uid: 'u1', total_score: 180 },
    { forest_id: 'f2', name: '숲퍼파워', leader_uid: 'u2', total_score: 125 },
  ],
  schedules: [
    { id: 's1', title: '부활절 연합 예배', date: '4월 5일', fullDate: '2026-04-05', time: '오전 11:00', location: '본당 대예배실', d_day: 'D-10', active: true, type: 'worship' },
    { id: 's2', title: '청년 멘토링 세미나', date: '3월 28일', fullDate: '2026-03-28', time: '오후 14:00', location: '커뮤니티 센터 B1', d_day: 'D-2', active: true, type: 'education' },
    { id: 's3', title: '봄 맞이 숲 청소 봉사', date: '3월 29일', fullDate: '2026-03-29', time: '오후 15:00', location: '교회 인근 공원', d_day: 'D-3', active: true, type: 'volunteer' },
  ],
  programs: [
    { id: 'p1', category: '사역', type: '해외선교', host: '청년부 주관', title: '2026 여름 단기선교 (태국)', date: '7.25(목) - 8.1(목)', location: '태국 치앙마이 일대', image: 'https://images.unsplash.com/photo-1511632765486-a01980e01a18?q=80&w=2070&auto=format&fit=crop', status: '모집중', dDay: 'D-15', desc: '올해 여름, 태국 치앙마이로 단기선교를 떠납니다. 현지 교회와 협력하여 어린이 성경학교를 진행하고, 산지 마을을 방문하여 복음을 전하며 의료 및 노력 봉사를 실시할 예정입니다.' },
    { id: 'p2', category: '교육/훈련', type: '양육', host: '12주 과정', title: '제자훈련 1단계 (기초)', date: '매주 화요일 19:30', location: '비전센터 302호', image: 'https://images.unsplash.com/photo-1491841550275-ad7854e35ca6?q=80&w=1974&auto=format&fit=crop', status: '진행중', dDay: '', desc: '신앙의 기초를 다지는 제자훈련 1단계입니다. 말씀과 기도로 무장하며 그리스도의 참된 제자로 성장하는 시간을 가집니다.' },
    { id: 'p3', category: '봉사', type: '이웃사랑', host: '월 1회', title: '지역사회 독거노인 반찬봉사', date: '이번주 토요일 09:00', location: '교회 식당 집결', image: 'https://images.unsplash.com/photo-1593113580332-8288e4e46954?q=80&w=2070&auto=format&fit=crop', status: '마감임박', dDay: '2자리 남음', desc: '홀로 계신 어르신들을 위해 정성껏 반찬을 만들고 배달하는 봉사입니다. 작은 사랑의 실천이 큰 기적이 됩니다.' },
  ],
  forest_posts: [
    { id: 'fp1', forest_id: 'f1', author_uid: 'u3', author_name: '다윗 민', content: '이번 주 금요일 저녁 8시에 온라인으로 잠깐 모일까요?\n기도제목도 나누고 이번 주 미션도 같이 해봐요!', date: '10.20 10:30', comments: 2 },
  ]
};

export const FOREST_GROUPS = [
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
  { forest_id: 'start', name: '숲타트' }
];

// ==========================================
// 2. Main App Component
// ==========================================
export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [subPage, setSubPage] = useState<string | null>(null);
  const [selectedForestId, setSelectedForestId] = useState<string | null>(null);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(null);
  const [selectedWorshipId, setSelectedWorshipId] = useState<string | null>(null);
  const [selectedKidsCareId, setSelectedKidsCareId] = useState<string | null>(null);
  const [selectedPastoralUser, setSelectedPastoralUser] = useState<any>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showRedirectLoginModal, setShowRedirectLoginModal] = useState(false);

  const handleNavigateToAdmin = () => setSubPage('admin');

  // Firebase Auth & Firestore State
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [forests, setForests] = useState<any[]>([]);
  const [programs, setPrograms] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [forestPosts, setForestPosts] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [surveys, setSurveys] = useState<any[]>([]);
  const [worships, setWorships] = useState<any[]>([]);
  const [kidsCares, setKidsCares] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [pastoralRecords, setPastoralRecords] = useState<any[]>([]);
  const [weeklySettlements, setWeeklySettlements] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [worshipStartInEditMode, setWorshipStartInEditMode] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [loading, setLoading] = useState(true);

  // Test Firestore Connection
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(firestoreDb, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('the client is offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsAuthReady(true);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    getRedirectResult(auth).then(async (result) => {
      if (result) {
        const credential = OAuthProvider.credentialFromResult(result);
        if (credential && credential.idToken) {
          try {
            const decodedToken: any = jwtDecode(credential.idToken);
            const kakaoNickname = decodedToken.nickname;
            const kakaoPicture = decodedToken.picture;

            if (kakaoNickname && !result.user.displayName) {
              await updateProfile(result.user, {
                displayName: kakaoNickname,
                photoURL: kakaoPicture || result.user.photoURL
              });
              setUser({ ...result.user, displayName: kakaoNickname, photoURL: kakaoPicture || result.user.photoURL });
            }
          } catch (decodeError) {
            console.error("Token decoding failed:", decodeError);
          }
        }
        await saveUserToFirestore(result.user);
        setActiveTab('home');
        setSubPage(null);
        showToast("로그인되었습니다.");
      }
    }).catch((error) => {
      console.error("Redirect login failed:", error);
    });
  }, []);

  // 1. User Data Listener
  useEffect(() => {
    if (!isAuthReady || !user) {
      setUserData(null);
      return;
    }

    const unsubUser = onSnapshot(doc(firestoreDb, 'users', user.uid), (snapshot) => {
      if (snapshot.exists()) {
        setUserData(snapshot.data());
      } else {
        saveUserToFirestore(user);
      }
    }, (err) => handleFirestoreError(err, OperationType.GET, `users/${user.uid}`));

    return () => unsubUser();
  }, [isAuthReady, user?.uid]);

  // 2. Other Collections Listeners
  useEffect(() => {
    if (!isAuthReady || !user) {
      setForests([]);
      setPrograms([]);
      setAttendance([]);
      setUsers([]);
      setForestPosts([]);
      setSchedules([]);
      setSurveys([]);
      setFees([]);
      setPastoralRecords([]);
      setWeeklySettlements([]);
      return;
    }

    const unsubUsers = onSnapshot(collection(firestoreDb, 'users'), (snapshot) => {
      setUsers(snapshot.docs.map(d => ({ ...d.data(), uid: d.id })));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'users'));

    const unsubForests = onSnapshot(collection(firestoreDb, 'forests'), (snapshot) => {
      setForests(snapshot.docs.map(d => ({ ...d.data(), id: d.id })));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'forests'));

    const unsubPrograms = onSnapshot(collection(firestoreDb, 'programs'), (snapshot) => {
      setPrograms(snapshot.docs.map(d => ({ ...d.data(), id: d.id })));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'programs'));

    const unsubAttendance = onSnapshot(collection(firestoreDb, 'attendance'), (snapshot) => {
      setAttendance(snapshot.docs.map(d => ({ ...d.data(), id: d.id })));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'attendance'));

    const unsubForestPosts = onSnapshot(collection(firestoreDb, 'forest_posts'), (snapshot) => {
      setForestPosts(snapshot.docs.map(d => ({ ...d.data(), id: d.id })));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'forest_posts'));

    const unsubSchedules = onSnapshot(collection(firestoreDb, 'schedules'), (snapshot) => {
      setSchedules(snapshot.docs.map(d => ({ ...d.data(), id: d.id })));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'schedules'));

    const unsubSurveys = onSnapshot(collection(firestoreDb, 'surveys'), (snapshot) => {
      setSurveys(snapshot.docs.map(d => ({ ...d.data(), id: d.id })));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'surveys'));

    const unsubWorships = onSnapshot(collection(firestoreDb, 'worships'), (snapshot) => {
      setWorships(snapshot.docs.map(d => ({ ...d.data(), id: d.id })));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'worships'));

    const unsubKidsCares = onSnapshot(collection(firestoreDb, 'kids_cares'), (snapshot) => {
      setKidsCares(snapshot.docs.map(d => ({ ...d.data(), id: d.id })));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'kids_cares'));

    // Fees listener - restricted by permission
    const isAdminUser = userData?.role === 'admin' || user?.uid === 'sfViap2UZ2alO1kzinMETlcLCxv1' || user?.email === 'seokgwan.ms01@gmail.com' || user?.email === 'jumphorse@nate.com';
    const canSeeAllFees = isAdminUser || userData?.permissions?.finance;
    const feesQuery = canSeeAllFees
      ? collection(firestoreDb, 'fees')
      : query(collection(firestoreDb, 'fees'), where('uid', '==', user.uid));

    const unsubFees = onSnapshot(feesQuery, (snapshot) => {
      setFees(snapshot.docs.map(d => ({ ...d.data(), id: d.id })));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'fees'));

    const canSeePastoral = isAdminUser || userData?.role === 'pastor' || userData?.role === 'leader';
    let unsubPastoral = () => { };
    let unsubSettlements = () => { };

    if (canSeePastoral) {
      const pastoralQuery = isAdminUser
        ? collection(firestoreDb, 'pastoral_records')
        : query(collection(firestoreDb, 'pastoral_records'), where('forest_id', '==', userData?.forest_id));

      unsubPastoral = onSnapshot(pastoralQuery, (snapshot) => {
        setPastoralRecords(snapshot.docs.map(d => ({ ...d.data(), id: d.id })));
      }, (err) => handleFirestoreError(err, OperationType.GET, 'pastoral_records'));

      const settlementsQuery = isAdminUser
        ? collection(firestoreDb, 'weekly_settlements')
        : query(collection(firestoreDb, 'weekly_settlements'), where('forest_id', '==', userData?.forest_id));

      unsubSettlements = onSnapshot(settlementsQuery, (snapshot) => {
        setWeeklySettlements(snapshot.docs.map(d => ({ ...d.data(), id: d.id })));
      }, (err) => handleFirestoreError(err, OperationType.GET, 'weekly_settlements'));
    }

    const qNotifications = query(collection(firestoreDb, 'notifications'), orderBy('createdAt', 'desc'));
    const unsubNotifications = onSnapshot(qNotifications, (snapshot) => {
      setNotifications(snapshot.docs.map(d => ({ ...d.data(), id: d.id })).slice(0, 50));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'notifications'));

    return () => {
      unsubUsers();
      unsubForests();
      unsubPrograms();
      unsubAttendance();
      unsubForestPosts();
      unsubSchedules();
      unsubSurveys();
      unsubWorships();
      unsubKidsCares();
      unsubFees();
      unsubPastoral();
      unsubSettlements();
      unsubNotifications();
    };
  }, [isAuthReady, user?.uid, userData?.role, userData?.forest_id, userData?.permissions?.finance]);

  const saveUserToFirestore = async (firebaseUser: FirebaseUser) => {
    try {
      const userRef = doc(firestoreDb, 'users', firebaseUser.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        const newUser = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || '새 사용자',
          email: firebaseUser.email || '',
          profile_image: firebaseUser.photoURL || '',
          role: (firebaseUser.email === 'jumphorse@nate.com' || firebaseUser.email === 'seokgwan.ms01@gmail.com') ? 'admin' : 'member',
          forest_id: '', // No default forest, user must select one
          birthdate: '',
          gender: '',
          has_kids: false,
          kids_info: '',
          privacy_agreed: false,
          score: 0,
          phone: '',
          bio: '',
          attendance_rate: 0,
          badges: [],
          activity_history: [],
          permissions: {
            survey: false,
            finance: false,
            schedule: false,
            forest: false,
            attendance: false
          },
          createdAt: Timestamp.now()
        };
        await setDoc(userRef, newUser);
      } else {
        const updateData: any = {
          name: firebaseUser.displayName || userSnap.data().name,
          profile_image: firebaseUser.photoURL || userSnap.data().profile_image,
          email: firebaseUser.email || userSnap.data().email
        };
        // Ensure admin email always has admin role
        if (firebaseUser.email === 'jumphorse@nate.com' || firebaseUser.email === 'seokgwan.ms01@gmail.com') {
          updateData.role = 'admin';
        }
        await updateDoc(userRef, updateData);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${firebaseUser.uid}`);
    }
  };

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await saveUserToFirestore(result.user);
      setActiveTab('home');
      setSubPage(null);
    } catch (error) {
      console.error("Login failed:", error);
      showToast("로그인에 실패했습니다.");
    }
  };

  const handleCompleteRegistration = async (registrationData: any) => {
    if (!user) return;
    try {
      const userRef = doc(firestoreDb, 'users', user.uid);
      await updateDoc(userRef, registrationData);
      showToast('가입 절차가 완료되었습니다. 환영합니다!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  const handleKakaoLogin = async () => {
    const tryLogin = async (providerId: string) => {
      const provider = new OAuthProvider(providerId);
      try {
        const result = await signInWithPopup(auth, provider);
        const credential = OAuthProvider.credentialFromResult(result);

        if (credential && credential.idToken) {
          try {
            const decodedToken: any = jwtDecode(credential.idToken);
            const kakaoNickname = decodedToken.nickname;
            const kakaoPicture = decodedToken.picture;

            if (kakaoNickname && !result.user.displayName) {
              await updateProfile(result.user, {
                displayName: kakaoNickname,
                photoURL: kakaoPicture || result.user.photoURL
              });
              setUser({ ...result.user, displayName: kakaoNickname, photoURL: kakaoPicture || result.user.photoURL });
            }
          } catch (decodeError) {
            console.error("Token decoding failed:", decodeError);
          }
        }
        await saveUserToFirestore(result.user);
        setActiveTab('home');
        setSubPage(null);
        return true;
      } catch (error: any) {
        if (error.code === 'auth/operation-not-allowed') {
          console.warn(`Provider ID ${providerId} is not allowed. Trying next...`);
          return false;
        }
        throw error;
      }
    };

    try {
      // Try 'oidc.kakao' first
      let success = await tryLogin('oidc.kakao');
      if (!success) {
        // Try 'oidc.oidc.kakao' as a fallback
        success = await tryLogin('oidc.oidc.kakao');
      }

      if (!success) {
        showToast("카카오 로그인 설정이 올바르지 않습니다.");
      }
    } catch (error: any) {
      console.error("Kakao Login failed:", error);
      if (error.code === 'auth/popup-blocked') {
        setShowRedirectLoginModal(true);
      } else {
        console.error("Error Code:", error.code);
        console.error("Error Message:", error.message);
        console.error("Error Details:", error.customData);
        showToast(`카카오 로그인 실패: ${error.code}`);
      }
    }
  };

  const handleKakaoRedirectLogin = async () => {
    const provider = new OAuthProvider('oidc.kakao');
    try {
      await signInWithRedirect(auth, provider);
    } catch (error: any) {
      console.error("Kakao Redirect Login failed:", error);
      showToast("카카오 로그인에 실패했습니다.");
    }
  };

  const handleVote = async (surveyId: string, optionIndex: number) => {
    if (!currentUser) return;
    try {
      const surveyRef = doc(firestoreDb, 'surveys', surveyId);
      await updateDoc(surveyRef, {
        [`responses.${currentUser.uid}`]: optionIndex
      });
      showToast('설문 참여가 완료되었습니다.');
      return true;
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `surveys/${surveyId}`);
      return false;
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setSubPage(null);
      setActiveTab('home');
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Merge static forest groups with any available Firestore data
  const mergedForests = FOREST_GROUPS.map(fg => {
    const dbForest = forests.find((f: any) => f.forest_id === fg.forest_id || f.name === fg.name);
    return dbForest ? { ...fg, ...dbForest } : fg;
  });

  // Mock current user combined with Firebase user
  const currentUser = user ? {
    ...mockDb.users[0], // Fallback mock data
    ...userData, // Real Firestore data
    name: user.displayName || (userData?.name) || (mockDb.users[0] as any).name,
    email: user.email || (userData?.email) || (mockDb.users[0] as any).email,
    photoURL: user.photoURL || (userData?.profile_image) || (mockDb.users[0] as any).profile_image,
    uid: user.uid, role: (userData?.role === 'admin' || user?.uid === 'sfViap2UZ2alO1kzinMETlcLCxv1' || user?.email === 'seokgwan.ms01@gmail.com' || user?.email === 'jumphorse@nate.com') ? 'admin' : (userData?.role || 'member')
  } : null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-6 text-center">
        <div className="w-24 h-24 bg-primary-container rounded-full flex items-center justify-center mb-8">
          <TreePine size={48} className="text-primary" />
        </div>
        <h1 className="text-3xl font-bold font-headline text-on-surface mb-2">FOREST 3040</h1>
        <p className="text-on-surface-variant mb-12">함께 믿음으로 성장하는 공동체</p>

        <button
          onClick={handleLogin}
          className="w-full max-w-sm bg-white border border-surface-container-highest text-on-surface py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-sm hover:bg-surface-container-lowest transition-colors active:scale-95"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Google 계정으로 로그인
        </button>

        <button
          onClick={handleKakaoLogin}
          className="w-full max-w-sm mt-3 bg-[#FEE500] text-black/85 py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-sm hover:bg-[#FEE500]/90 transition-colors active:scale-95"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3c-5.523 0-10 3.47-10 7.75 0 2.73 1.88 5.13 4.68 6.47-.15.48-.48 1.68-.55 1.95-.09.33.12.33.26.24.11-.08 1.73-1.15 2.45-1.65 1.01.29 2.07.44 3.16.44 5.523 0 10-3.47 10-7.75S17.523 3 12 3z" />
          </svg>
          카카오 로그인
        </button>
      </div>
    );
  }

  if (userData && !userData.forest_id) {
    return (
      <RegistrationView
        forests={mergedForests}
        onComplete={handleCompleteRegistration}
        user={user}
      />
    );
  }

  const handleNavigateToMyForestBoard = () => {
    if (userData && userData.forest_id) {
      setSelectedForestId(userData.forest_id);
      setSubPage('forest_community');
    }
  };

  const renderBottomNav = () => {
    if (subPage) return null;
    return (
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto w-full flex justify-between items-center px-2 pb-6 pt-3 bg-[#f7f6f3]/80 backdrop-blur-2xl z-50 shadow-[0px_-10px_40px_rgba(0,0,0,0.04)] rounded-t-[3rem]">
        <BottomNavItem icon={<Home size={22} className={activeTab === 'home' ? 'fill-current' : ''} />} label="홈" id="home" activeTab={activeTab} onClick={setActiveTab} />
        <BottomNavItem icon={<Users size={22} className={activeTab === 'members' ? 'fill-current' : ''} />} label="삼성/사성이" id="members" activeTab={activeTab} onClick={setActiveTab} />
        <BottomNavItem icon={<LayoutGrid size={22} className={activeTab === 'program' ? 'fill-current' : ''} />} label="프로그램" id="program" activeTab={activeTab} onClick={setActiveTab} />
        <BottomNavItem icon={<BookOpen size={22} className={activeTab === 'worship' ? 'fill-current' : ''} />} label="예배" id="worship" activeTab={activeTab} onClick={setActiveTab} />
        <BottomNavItem icon={<Calendar size={22} className={activeTab === 'calendar' ? 'fill-current' : ''} />} label="일정" id="calendar" activeTab={activeTab} onClick={setActiveTab} />
        <BottomNavItem icon={<Baby size={22} className={activeTab === 'kids' ? 'fill-current' : ''} />} label="키즈돌봄" id="kids" activeTab={activeTab} onClick={setActiveTab} />
      </nav>
    );
  };

  const hasUnreadNotifications = !!(user && userData && notifications.length > 0 &&
    (!userData.lastCheckedNotificationAt || notifications[0].createdAt > userData.lastCheckedNotificationAt));

  return (
    <div className={`bg-surface font-body selection:bg-primary/20 min-h-screen ${!subPage ? 'pb-32' : 'h-screen overflow-hidden'}`}>
      {!subPage && (
        <nav className="sticky top-0 w-full z-50 bg-[#FAF9F6]/80 backdrop-blur-xl flex justify-between items-center px-6 py-4 max-w-md mx-auto left-0 right-0">
          <div className="flex items-center gap-3 active:scale-95 duration-200 cursor-pointer">
            <Menu className="text-primary-dim w-6 h-6" />
            <span className="font-headline font-bold text-lg tracking-tight text-primary-dim">
              {activeTab === 'home' ? 'FOREST 3040' :
                activeTab === 'members' ? '삼성/사성이' :
                  activeTab === 'program' ? '프로그램' :
                    activeTab === 'worship' ? '온라인 주보' :
                      activeTab === 'calendar' ? '일정' :
                        activeTab === 'kids' ? '키즈돌봄' : 'FOREST 3040'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            {userData?.role === 'admin' && (
              <div className="flex items-center gap-2 active:scale-95 duration-200 cursor-pointer" onClick={() => setSubPage('admin')}>
                <Settings className="text-stone-600 hover:opacity-80 transition-opacity w-6 h-6" />
              </div>
            )}
            <div 
              className="flex items-center gap-2 active:scale-95 duration-200 cursor-pointer relative"
              onClick={() => {
                setIsNotificationModalOpen(true);
                if (user && hasUnreadNotifications) {
                  updateDoc(doc(firestoreDb, 'users', user.uid), { lastCheckedNotificationAt: new Date().toISOString() });
                }
              }}
            >
              <Bell className="text-stone-600 hover:opacity-80 transition-opacity w-6 h-6" />
              {hasUnreadNotifications && (
                <span className="absolute top-0 -right-0.5 w-[10px] h-[10px] bg-red-500 border-2 border-surface rounded-full shadow-sm animate-pulse"></span>
              )}
            </div>
            <div className="flex items-center gap-2 active:scale-95 duration-200 cursor-pointer" onClick={() => setSubPage('mypage')}>
              <User className="text-stone-600 hover:opacity-80 transition-opacity w-6 h-6" />
            </div>
          </div>
        </nav>
      )}

      <main className="max-w-md mx-auto">
        {subPage === 'mypage' && (
          <MyPageView
            user={currentUser}
            forests={forests}
            attendance={attendance}
            onBack={() => setSubPage(null)}
            onShowToast={showToast}
            onLogout={handleLogout}
            onNavigateToAdmin={handleNavigateToAdmin}
          />
        )}
        {subPage === 'pastoral_stats' && (
          <PastoralStatsDashboardView
            user={currentUser}
            users={users.length > 0 ? users : mockDb.users}
            forests={mergedForests}
            attendance={attendance}
            pastoralRecords={pastoralRecords}
            weeklySettlements={weeklySettlements}
            onBack={() => setSubPage(null)}
            onShowToast={showToast}
          />
        )}
        {subPage === 'forest_board' && <ForestBoardView user={currentUser} forestId={selectedForestId} forests={forests} users={users} forestPosts={forestPosts} onBack={() => setSubPage(null)} />}
        {subPage === 'forest_community' && (
          <ForestCommunityView onBack={() => setSubPage(null)} user={currentUser} userData={userData} onShowToast={showToast} />
        )}
        {subPage === 'program_detail' && (
          <ProgramDetailView 
            user={currentUser} 
            programId={selectedProgramId} 
            programs={programs} 
            attendance={attendance.filter((a: any) => a.type === '프로그램신청')}
            users={users}
            onBack={() => setSubPage(null)} 
            onShowToast={showToast} 
          />
        )}
        {subPage === 'attendance' && <AttendanceView user={currentUser} attendance={attendance} onBack={() => setSubPage(null)} onShowToast={showToast} />}
        {subPage === 'survey' && (
          <SurveyView
            user={currentUser}
            surveys={surveys}
            onBack={() => setSubPage(null)}
            onShowToast={showToast}
            onVote={handleVote}
          />
        )}
        {subPage === 'finance' && (
          <FinanceView
            user={currentUser}
            fees={fees}
            onBack={() => setSubPage(null)}
            onShowToast={showToast}
          />
        )}
        {subPage === 'minutes' && (
          <MinutesView 
            user={currentUser} 
            userData={userData} 
            onBack={() => setSubPage(null)} 
            onShowToast={showToast} 
          />
        )}
        {subPage === 'admin' && (
          <AdminDashboardView
            onBack={() => setSubPage(null)}
            onNavigateToScanner={() => setSubPage('qr_scanner')}
            onNavigateToUsers={() => setSubPage('admin_users')}
            onNavigateToBoards={() => setSubPage('admin_boards')}
            onNavigateToSurveys={() => setSubPage('admin_surveys')}
            onNavigateToFinance={() => setSubPage('admin_finance')}
            onShowToast={showToast}
          />
        )}
        {subPage === 'qr_scanner' && (
          <AdminAttendanceScannerView
            currentUser={currentUser}
            onBack={() => setSubPage('admin')}
            onShowToast={showToast}
          />
        )}
        {subPage === 'admin_users' && (
          <AdminUserManagementView
            users={users}
            onBack={() => setSubPage('admin')}
            onShowToast={showToast}
          />
        )}
        {subPage === 'admin_boards' && (
          <AdminBoardManagementView
            forestPosts={forestPosts}
            onBack={() => setSubPage('admin')}
            onShowToast={showToast}
          />
        )}
        {subPage === 'admin_surveys' && (
          <AdminSurveyManagementView
            surveys={surveys}
            onBack={() => setSubPage('admin')}
            onShowToast={showToast}
          />
        )}
        {subPage === 'admin_finance' && (
          <AdminFinanceManagementView
            user={currentUser}
            users={users}
            forests={mergedForests}
            fees={fees}
            onBack={() => setSubPage('admin')}
            onShowToast={showToast}
          />
        )}

        {!subPage && activeTab === 'home' && (
          <div className="pt-6 px-6 space-y-10">
            <HomeView
              kidsCares={kidsCares}
              user={currentUser}
              users={users.length > 0 ? users : mockDb.users}
              forests={mergedForests}
              schedules={schedules.length > 0 ? schedules : mockDb.schedules}
              surveys={surveys}
              attendance={attendance}
              fees={fees}
              onNavigateToMyForestBoard={handleNavigateToMyForestBoard}
              onNavigate={(page: string) => setSubPage(page)}
              onNavigateToKidsDetail={(id: string) => { setSelectedKidsCareId(id); setSubPage('kids_care_detail'); }}
            />
          </div>
        )}
        {!subPage && activeTab === 'members' && (
          <div className="pt-6 px-6 space-y-10">
            <MembersView
              user={currentUser}
              users={users.length > 0 ? users : mockDb.users}
              forests={mergedForests}
              onOpenBoard={(fId: string) => { setSelectedForestId(fId); setSubPage('forest_community'); }}
              onShowToast={showToast}
              onNavigateToStats={() => setSubPage('pastoral_stats')}
              onMemberClick={(u: any) => {
                const canSeePastoral = currentUser?.role === 'admin' || currentUser?.role === 'pastor' || (currentUser?.role === 'leader' && currentUser?.forest_id === u.forest_id);
                if (canSeePastoral) {
                  setSelectedPastoralUser(u);
                } else {
                  showToast('목양 카드는 숲지기, 목사님, 관리자만 볼 수 있습니다.');
                }
              }}
            />
          </div>
        )}
        {!subPage && activeTab === 'program' && (
          <ProgramView
            user={currentUser}
            programs={programs}
            attendance={attendance.filter((a: any) => a.type === '프로그램신청')}
            users={users}
            onNavigateToDetail={(id: string) => { setSelectedProgramId(id); setSubPage('program_detail'); }}
            onNavigateToAdd={() => setSubPage('program_add')}
            onShowToast={showToast}
          />
        )}
        {subPage === 'program_add' && (
          <ProgramAddView
            onBack={() => setSubPage(null)}
            onShowToast={showToast}
          />
        )}
        {!subPage && activeTab === 'worship' && (
          <WorshipView
            user={currentUser}
            worships={worships}
            onNavigateToDetail={(id: string, isEdit?: boolean) => { 
              setSelectedWorshipId(id); 
              setWorshipStartInEditMode(!!isEdit);
              setSubPage('worship_detail'); 
            }}
            onNavigateToAdd={() => setSubPage('worship_add')}
            onShowToast={showToast}
          />
        )}
        {subPage === 'worship_add' && (
          <WorshipAddView
            onBack={() => setSubPage(null)}
            onShowToast={showToast}
          />
        )}
        {subPage === 'worship_detail' && (
          <WorshipDetailView
            user={currentUser}
            worshipId={selectedWorshipId}
            worships={worships}
            onBack={() => { setSubPage(null); setWorshipStartInEditMode(false); }}
            onShowToast={showToast}
            initialEditMode={worshipStartInEditMode}
          />
        )}
        {subPage === 'kids_care_add' && (
          <KidsCareAddView
            onBack={() => setSubPage(null)}
            onShowToast={showToast}
            forests={mergedForests}
          />
        )}
        {subPage === 'kids_care_apply' && (
          <KidsCareApplyView
            kidsCareId={selectedKidsCareId}
            kidsCares={kidsCares}
            user={currentUser}
            onBack={() => setSubPage('kids_care_detail')}
            onShowToast={showToast}
          />
        )}
        {subPage === 'kids_care_detail' && (
          <KidsCareDetailView
            kidsCareId={selectedKidsCareId}
            kidsCares={kidsCares}
            user={currentUser}
            onBack={() => setSubPage(null)}
            onShowToast={showToast}
            onNavigateToApply={() => setSubPage('kids_care_apply')}
          />
        )}
        {subPage === 'kids_care_admin' && (
          <KidsCareAdminView
            kidsCareId={selectedKidsCareId}
            kidsCares={kidsCares}
            user={currentUser}
            onBack={() => setSubPage(null)}
            onShowToast={showToast}
          />
        )}
        {!subPage && activeTab === 'calendar' && <CalendarView user={currentUser} schedules={schedules.length > 0 ? schedules : mockDb.schedules} onShowToast={showToast} />}
        {!subPage && activeTab === 'kids' && (
          <KidsView
            user={currentUser}
            kidsCares={kidsCares}
            forests={mergedForests}
            onNavigateToAdd={() => setSubPage('kids_care_add')}
            onNavigateToDetail={(id: string) => { setSelectedKidsCareId(id); setSubPage('kids_care_detail'); }}
            onNavigateToAdmin={(id: string) => { setSelectedKidsCareId(id); setSubPage('kids_care_admin'); }}
            onShowToast={showToast}
          />
        )}
      </main>

      {selectedPastoralUser && (
        <PastoralCardModal
          targetUser={selectedPastoralUser}
          pastoralRecords={pastoralRecords}
          attendance={attendance}
          forests={mergedForests}
          currentUser={currentUser}
          onClose={() => setSelectedPastoralUser(null)}
          onShowToast={showToast}
        />
      )}

      {renderBottomNav()}
      {toastMessage && <Toast message={toastMessage} />}
      {showRedirectLoginModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-surface-container-lowest w-full max-w-sm rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-6 mx-auto">
              <Lock size={32} />
            </div>
            <h2 className="text-xl font-headline font-extrabold text-on-surface text-center mb-4">팝업이 차단되었습니다</h2>
            <p className="text-on-surface-variant text-center text-sm leading-relaxed mb-8">
              브라우저의 팝업 차단 기능으로 인해 로그인 창을 열 수 없습니다. 페이지 이동 방식으로 로그인을 진행하시겠습니까?
            </p>
            <div className="space-y-3">
              <button
                onClick={() => { handleKakaoRedirectLogin(); setShowRedirectLoginModal(false); }}
                className="w-full py-4 bg-primary text-on-primary rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-95 transition-all"
              >
                페이지 이동으로 로그인
              </button>
              <button
                onClick={() => setShowRedirectLoginModal(false)}
                className="w-full py-4 bg-surface-container-high text-on-surface rounded-2xl font-bold active:scale-95 transition-all"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      <NotificationModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        notifications={notifications}
      />
    </div>
  );
}

// ==========================================
// 3. Sub Views
// ==========================================





const ForestBoardView = ({ user, forestId, forests, users, forestPosts, onBack }: any) => {
  const forest = forests.find((f: any) => f.forest_id === forestId);
  const forestMembers = users.filter((u: any) => u.forest_id === forestId);
  const [posts, setPosts] = useState(forestPosts.filter((p: any) => p.forest_id === forestId));
  const [newPost, setNewPost] = useState('');

  useEffect(() => {
    setPosts(forestPosts.filter((p: any) => p.forest_id === forestId));
  }, [forestPosts, forestId]);

  const handleSend = async () => {
    if (!newPost.trim()) return;

    try {
      const newPostObj = {
        forest_id: forestId,
        author_uid: user.uid,
        author_name: user.name,
        content: newPost,
        date: Timestamp.now(),
        comments: 0
      };

      await addDoc(collection(firestoreDb, 'forest_posts'), newPostObj);
      setNewPost('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'forest_posts');
    }
  };

  return (
    <div className="absolute inset-0 bg-surface z-[60] flex flex-col min-h-screen">
      <div className="bg-surface-container-lowest/80 backdrop-blur-xl px-4 py-4 flex items-center shadow-sm sticky top-0 z-10">
        <button onClick={onBack} className="p-2 mr-2 text-on-surface hover:bg-surface-container rounded-full transition">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-lg font-headline font-bold text-on-surface">{forest?.name} 전용 게시판 🤫</h2>
      </div>

      {/* Forest Members Quick View */}
      <div className="bg-surface-container-lowest border-b border-surface-container px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-outline uppercase tracking-widest">우리 숲 멤버</h3>
          <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
            {forestMembers.length}명
          </span>
        </div>
        <div className="flex -space-x-2 overflow-hidden">
          {forestMembers.map((member: any) => (
            <div key={member.uid} className="w-8 h-8 rounded-full border-2 border-surface-container-lowest bg-primary-container text-on-primary-container flex items-center justify-center text-[10px] font-bold overflow-hidden shadow-sm">
              {member.profile_image ? (
                <img src={member.profile_image} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <span>{member.name.charAt(0)}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto pb-24">
        {posts.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-surface-container rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare size={28} className="text-outline" />
            </div>
            <p className="text-on-surface-variant text-sm font-body">아직 작성된 글이 없습니다.<br />우리 숲의 첫 번째 이야기를 남겨보세요!</p>
          </div>
        )}

        {posts.map(post => (
          <div key={post.id} className="bg-surface-container-lowest p-5 squircle shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center font-bold text-sm">
                  {post.author_name.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface flex items-center gap-1">
                    {post.author_name} {post.author_uid === forest?.leader_uid ? '👑' : ''}
                  </p>
                  <p className="text-[11px] text-on-surface-variant">
                    {post.date?.toDate ? post.date.toDate().toLocaleString() :
                      (post.date?.seconds ? new Date(post.date.seconds * 1000).toLocaleString() : String(post.date || ''))}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-sm text-on-surface whitespace-pre-line leading-relaxed font-body">{post.content}</p>
          </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-surface-container-lowest/90 backdrop-blur-lg border-t border-surface-container p-3 pb-safe z-50 flex items-end gap-2">
        <textarea
          placeholder="우리 숲 멤버들과 이야기를 나누세요."
          value={newPost}
          onChange={e => setNewPost(e.target.value)}
          className="flex-1 bg-surface-container-low rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none max-h-24 font-body"
          rows={1}
        />
        <button onClick={handleSend} className="bg-primary text-on-primary p-3 rounded-full hover:bg-primary-dim flex-shrink-0 transition mb-0.5">
          <Send size={18} className="-ml-0.5 mt-0.5" />
        </button>
      </div>
    </div>
  );
};

const AdminDashboardView = ({ onBack, onNavigateToUsers, onNavigateToBoards, onNavigateToSurveys, onNavigateToFinance, onNavigateToScanner, onShowToast }: any) => {
  const adminMenus = [
    { id: 'scanner', label: 'QR 출석 스캐너', icon: <QrCode size={24} />, onClick: onNavigateToScanner, desc: '교인의 QR을 스캔하여 출석을 기록합니다.' },
    { id: 'users', label: '회원 권한 관리', icon: <Users size={24} />, onClick: onNavigateToUsers, desc: '사용자별 메뉴 접근 권한을 설정합니다.' },
    { id: 'boards', label: '게시판 관리', icon: <MessageSquare size={24} />, onClick: onNavigateToBoards, desc: '숲별 게시판의 게시글을 관리합니다.' },
    { id: 'surveys', label: '설문조사 관리', icon: <ClipboardList size={24} />, onClick: onNavigateToSurveys, desc: '진행 중인 설문조사를 관리합니다.' },
    { id: 'finance', label: '회비/재정 관리', icon: <Wallet size={24} />, onClick: onNavigateToFinance, desc: '공동체 재정 및 회비 납부 현황을 관리합니다.' },
  ];

  return (
    <div className="absolute inset-0 bg-surface z-[60] flex flex-col min-h-screen overflow-y-auto pb-24">
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface-container-highest">
        <div className="flex items-center px-2 py-3">
          <button onClick={onBack} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-bold tracking-tight text-on-surface ml-2">관리자 대시보드</h1>
        </div>
      </header>

      <div className="p-6 space-y-6">
        <div className="bg-primary-container/30 p-6 rounded-3xl border border-primary-container/50">
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-primary text-on-primary p-2 rounded-xl">
              <Settings size={20} />
            </div>
            <h2 className="text-xl font-headline font-extrabold text-on-surface">Admin Dashboard</h2>
          </div>
          <p className="text-sm text-on-surface-variant">공동체 운영에 필요한 모든 도구가 여기에 있습니다.</p>
        </div>

        <div className="grid gap-4">
          {adminMenus.map(menu => (
            <button
              key={menu.id}
              onClick={menu.onClick}
              className="flex items-center gap-4 p-5 bg-surface-container-lowest rounded-3xl border border-surface-container-low shadow-sm hover:border-primary transition-all text-left group active:scale-95"
            >
              <div className="bg-surface-container-high text-primary p-3 rounded-2xl group-hover:bg-primary group-hover:text-on-primary transition-colors">
                {menu.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-on-surface">{menu.label}</h3>
                <p className="text-xs text-on-surface-variant mt-0.5">{menu.desc}</p>
              </div>
              <ChevronRight size={20} className="text-outline group-hover:text-primary" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const AdminBoardManagementView = ({ forestPosts, onBack, onShowToast }: any) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDeletePost = async (postId: string) => {
    try {
      await updateDoc(doc(firestoreDb, 'forest_posts', postId), { deleted: true });
      onShowToast('게시글이 삭제되었습니다.');
      setConfirmDeleteId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `forest_posts/${postId}`);
    }
  };

  // Filter out deleted posts if any (though we might want to see them as admin)
  const activePosts = forestPosts.filter((p: any) => !p.deleted);

  return (
    <div className="absolute inset-0 bg-surface z-[60] flex flex-col min-h-screen overflow-y-auto pb-24">
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface-container-highest">
        <div className="flex items-center px-2 py-3">
          <button onClick={onBack} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-bold tracking-tight text-on-surface ml-2">게시판 관리</h1>
        </div>
      </header>

      <div className="p-6 space-y-4">
        {activePosts.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare size={48} className="mx-auto text-outline mb-4 opacity-20" />
            <p className="text-on-surface-variant">관리할 게시글이 없습니다.</p>
          </div>
        ) : (
          activePosts.map((post: any) => (
            <div key={post.id} className="bg-surface-container-lowest p-5 rounded-3xl border border-surface-container-low shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-surface-container-high rounded-full flex items-center justify-center text-xs font-bold">
                    {post.author_name?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">{post.author_name}</p>
                    <p className="text-[10px] text-on-surface-variant">
                      {post.date?.toDate ? post.date.toDate().toLocaleString() :
                        (post.date?.seconds ? new Date(post.date.seconds * 1000).toLocaleString() : String(post.date || ''))}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setConfirmDeleteId(post.id)}
                  className="p-2 text-error hover:bg-error/10 rounded-full transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <p className="text-sm text-on-surface leading-relaxed line-clamp-3">{post.content}</p>
              <div className="pt-2 flex items-center gap-2">
                <span className="text-[10px] bg-secondary-container text-on-secondary-container px-2 py-0.5 rounded-full font-bold">
                  Forest ID: {post.forest_id}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Custom Confirmation Dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
          <div className="bg-surface p-6 rounded-[2.5rem] shadow-2xl max-w-xs w-full text-center space-y-6">
            <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto">
              <XCircle size={32} />
            </div>
            <div>
              <h3 className="text-xl font-headline font-extrabold text-on-surface">게시글 삭제</h3>
              <p className="text-sm text-on-surface-variant mt-2">정말로 이 게시글을 삭제하시겠습니까?<br />삭제된 글은 복구할 수 없습니다.</p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => handleDeletePost(confirmDeleteId)}
                className="w-full py-4 bg-error text-white rounded-2xl font-bold active:scale-95 transition-transform"
              >
                삭제하기
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="w-full py-4 bg-surface-container-high text-on-surface rounded-2xl font-bold active:scale-95 transition-transform"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminSurveyManagementView = ({ surveys, onBack, onShowToast }: any) => {
  const handleDeleteSurvey = async (surveyId: string) => {
    try {
      await deleteDoc(doc(firestoreDb, 'surveys', surveyId));
      onShowToast('설문이 삭제되었습니다.');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `surveys/${surveyId}`);
    }
  };

  const handleToggleStatus = async (surveyId: string, currentStatus: string) => {
    try {
      await updateDoc(doc(firestoreDb, 'surveys', surveyId), {
        status: currentStatus === 'active' ? 'closed' : 'active'
      });
      onShowToast(`설문이 ${currentStatus === 'active' ? '마감' : '시작'}되었습니다.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `surveys/${surveyId}`);
    }
  };

  return (
    <div className="absolute inset-0 bg-surface z-[60] flex flex-col min-h-screen overflow-y-auto pb-24">
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface-container-highest">
        <div className="flex items-center px-2 py-3">
          <button onClick={onBack} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-bold tracking-tight text-on-surface ml-2">설문조사 관리</h1>
        </div>
      </header>

      <div className="p-6 space-y-4">
        {surveys.length === 0 ? (
          <div className="text-center py-20">
            <ClipboardList size={48} className="mx-auto text-outline mb-4 opacity-20" />
            <p className="text-on-surface-variant">관리할 설문이 없습니다.</p>
          </div>
        ) : (
          surveys.map((survey: any) => (
            <div key={survey.id} className="bg-surface-container-lowest p-5 rounded-3xl border border-surface-container-low shadow-sm space-y-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="font-bold text-on-surface">{survey.title}</h3>
                  <p className="text-xs text-on-surface-variant mt-1">{survey.description}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleToggleStatus(survey.id, survey.status)}
                    className={`p-2 rounded-full transition-colors ${survey.status === 'active' ? 'text-primary hover:bg-primary/10' : 'text-outline hover:bg-surface-container'}`}
                    title={survey.status === 'active' ? '마감하기' : '시작하기'}
                  >
                    {survey.status === 'active' ? <CheckCircle2 size={18} /> : <Play size={18} />}
                  </button>
                  <button
                    onClick={() => handleDeleteSurvey(survey.id)}
                    className="p-2 text-error hover:bg-error/10 rounded-full transition-colors"
                    title="삭제하기"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-surface-container flex items-center justify-between text-[10px] font-bold">
                <span className={`px-2 py-0.5 rounded-full ${survey.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant'}`}>
                  {survey.status === 'active' ? '진행중' : '마감됨'}
                </span>
                <span className="text-on-surface-variant">
                  참여 인원: {Object.keys(survey.responses || {}).length}명
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const AdminFinanceManagementView = ({ user, users, forests, fees, onBack, onShowToast }: any) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedForestTab, setSelectedForestTab] = useState<string>('all');
  const [showUnpaidOnly, setShowUnpaidOnly] = useState(false);
  const [checkedUids, setCheckedUids] = useState<Set<string>>(new Set());
  const [timelineUser, setTimelineUser] = useState<any>(null);
  const [sendingUid, setSendingUid] = useState<string | null>(null);

  // ── Derived data ── (회비는 역할 상관없이 전체 회원 대상)
  const memberUsers = users;

  const getIsPaid = (uid: string) => {
    const f = fees.find((f: any) => f.uid === uid && f.year === selectedYear && f.month === selectedMonth);
    return f?.status === 'paid';
  };

  const getConsecutiveUnpaid = (uid: string) => {
    let count = 0;
    let m = selectedMonth - 1; let y = selectedYear;
    for (let i = 0; i < 6; i++) {
      if (m < 1) { m = 12; y--; }
      const f = fees.find((f: any) => f.uid === uid && f.year === y && f.month === m);
      if (!f || f.status !== 'paid') { count++; m--; } else break;
    }
    return count;
  };

  // A – Summary stats
  const scopeUsers = selectedForestTab === 'all' ? memberUsers : memberUsers.filter((u: any) => u.forest_id === selectedForestTab);
  const paidCount = scopeUsers.filter((u: any) => getIsPaid(u.uid)).length;
  const unpaidCount = scopeUsers.length - paidCount;
  const paidRate = scopeUsers.length > 0 ? Math.round((paidCount / scopeUsers.length) * 100) : 0;
  const consecutiveCount = scopeUsers.filter((u: any) => getConsecutiveUnpaid(u.uid) >= 2).length;

  // B – Filter
  const visibleUsers = scopeUsers.filter((u: any) => {
    if (showUnpaidOnly && getIsPaid(u.uid)) return false;
    return true;
  });

  // ── Actions ──
  const toggleFeeStatus = async (targetUser: any) => {
    const existingFee = fees.find((f: any) => f.uid === targetUser.uid && f.year === selectedYear && f.month === selectedMonth);
    try {
      if (existingFee) {
        await updateDoc(doc(firestoreDb, 'fees', existingFee.id), {
          status: existingFee.status === 'paid' ? 'unpaid' : 'paid',
          paid_at: existingFee.status === 'paid' ? null : Timestamp.now()
        });
      } else {
        await addDoc(collection(firestoreDb, 'fees'), {
          uid: targetUser.uid, user_name: targetUser.name,
          year: selectedYear, month: selectedMonth,
          amount: 10000, status: 'paid', paid_at: Timestamp.now()
        });
      }
      onShowToast(`${targetUser.name}님의 회비 상태가 업데이트되었습니다.`);
    } catch (err) { handleFirestoreError(err, OperationType.WRITE, 'fees'); }
  };

  // C – Batch pay
  const handleBatchPay = async () => {
    if (checkedUids.size === 0) return;
    const targets = memberUsers.filter((u: any) => checkedUids.has(u.uid) && !getIsPaid(u.uid));
    if (targets.length === 0) { onShowToast('선택된 인원이 이미 모두 납부완료 상태입니다.'); return; }
    try {
      await Promise.all(targets.map(async (u: any) => {
        const existing = fees.find((f: any) => f.uid === u.uid && f.year === selectedYear && f.month === selectedMonth);
        if (existing) {
          await updateDoc(doc(firestoreDb, 'fees', existing.id), { status: 'paid', paid_at: Timestamp.now() });
        } else {
          await addDoc(collection(firestoreDb, 'fees'), {
            uid: u.uid, user_name: u.name, year: selectedYear, month: selectedMonth,
            amount: 10000, status: 'paid', paid_at: Timestamp.now()
          });
        }
      }));
      onShowToast(`${targets.length}명의 회비 납부를 일괄 처리했습니다.`);
      setCheckedUids(new Set());
    } catch (err) { handleFirestoreError(err, OperationType.WRITE, 'fees'); }
  };

  // E – Send reminder notification
  const handleSendReminder = async (targetUser: any) => {
    setSendingUid(targetUser.uid);
    try {
      await addDoc(collection(firestoreDb, 'notifications'), {
        uid: targetUser.uid, type: 'fee_reminder',
        title: '💰 회비 납부 안내',
        message: `${selectedYear}년 ${selectedMonth}월 회비(10,000원)가 미납 상태입니다. 빠른 납부를 부탁드립니다.`,
        createdAt: Timestamp.now(), isRead: false, from: user?.uid
      });
      onShowToast(`${targetUser.name}님에게 납부 안내 알림을 발송했습니다.`);
    } catch (err) { handleFirestoreError(err, OperationType.WRITE, 'notifications'); }
    setSendingUid(null);
  };

  const toggleCheck = (uid: string) => {
    setCheckedUids(prev => { const n = new Set(prev); n.has(uid) ? n.delete(uid) : n.add(uid); return n; });
  };
  const toggleAll = () => {
    if (checkedUids.size === visibleUsers.length) setCheckedUids(new Set());
    else setCheckedUids(new Set(visibleUsers.map((u: any) => u.uid)));
  };

  // F – Timeline months (current year)
  const timelineMonths = Array.from({ length: selectedMonth }, (_, i) => i + 1);

  return (
    <div className="absolute inset-0 bg-surface z-[60] flex flex-col min-h-screen overflow-y-auto pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface/90 backdrop-blur-md border-b border-surface-container-highest">
        <div className="flex items-center px-2 py-3">
          <button onClick={onBack} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-bold tracking-tight text-on-surface ml-2">회비 관리</h1>
        </div>
        {/* Year / Month selector */}
        <div className="flex items-center gap-3 px-4 pb-3">
          <div className="flex items-center gap-2 bg-surface-container rounded-xl px-3 py-2 flex-1">
            <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}
              className="bg-transparent font-bold text-on-surface outline-none text-sm">
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}년</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 bg-surface-container rounded-xl px-3 py-2 flex-1">
            <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}
              className="bg-transparent font-bold text-on-surface outline-none text-sm">
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{m}월</option>)}
            </select>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-4">
        {/* A – Summary dashboard */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-surface-container-lowest rounded-2xl p-3 flex flex-col items-center border border-surface-container-low shadow-sm">
            <span className="text-2xl font-black text-on-surface">{paidCount}</span>
            <span className="text-[10px] text-on-surface-variant font-medium mt-0.5">납부</span>
          </div>
          <div className="bg-rose-50 rounded-2xl p-3 flex flex-col items-center border border-rose-100 shadow-sm">
            <span className="text-2xl font-black text-rose-600">{unpaidCount}</span>
            <span className="text-[10px] text-on-surface-variant font-medium mt-0.5">미납</span>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl p-3 flex flex-col items-center border border-surface-container-low shadow-sm">
            <span className={`text-2xl font-black ${paidRate >= 80 ? 'text-emerald-600' : paidRate >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>{paidRate}%</span>
            <span className="text-[10px] text-on-surface-variant font-medium mt-0.5">납부율</span>
          </div>
        </div>
        {/*납부율 bar */}
        <div className="bg-surface-container-lowest rounded-2xl p-4 border border-surface-container-low shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-bold text-on-surface">이번 달 납부 현황</span>
            {consecutiveCount > 0 && (
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                연속 2개월↑ 미납: {consecutiveCount}명
              </span>
            )}
          </div>
          <div className="w-full bg-surface-container rounded-full h-3 overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-700 ${
              paidRate >= 80 ? 'bg-emerald-500' : paidRate >= 60 ? 'bg-amber-400' : 'bg-rose-500'
            }`} style={{ width: `${paidRate}%` }} />
          </div>
          <div className="flex justify-between mt-1.5">
            <span className="text-[10px] text-on-surface-variant">전체 {scopeUsers.length}명</span>
            <span className="text-[10px] font-bold text-on-surface">{paidCount}명 납부</span>
          </div>
        </div>

        {/* B – Forest tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedForestTab('all')}
            className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
              selectedForestTab === 'all' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-on-surface-variant'
            }`}>
            전체 ({memberUsers.length})
          </button>
          {forests.map((f: any) => {
            const cnt = memberUsers.filter((u: any) => u.forest_id === f.forest_id).length;
            const paidCnt = memberUsers.filter((u: any) => u.forest_id === f.forest_id && getIsPaid(u.uid)).length;
            return (
              <button key={f.forest_id}
                onClick={() => setSelectedForestTab(f.forest_id)}
                className={`shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                  selectedForestTab === f.forest_id ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container text-on-surface-variant'
                }`}>
                {f.name} ({paidCnt}/{cnt})
              </button>
            );
          })}
        </div>

        {/* C + Filter controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUnpaidOnly(v => !v)}
            className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all ${
              showUnpaidOnly ? 'bg-rose-500 text-white border-rose-500' : 'bg-surface-container text-on-surface-variant border-surface-container-low'
            }`}>
            {showUnpaidOnly ? '✓ 미납만' : '미납만 보기'}
          </button>
          <span className="text-[11px] text-on-surface-variant ml-1">{visibleUsers.length}명 표시</span>
          {checkedUids.size > 0 && (
            <button onClick={handleBatchPay}
              className="ml-auto bg-emerald-500 text-white px-4 py-1.5 rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-transform">
              {checkedUids.size}명 일괄 납부
            </button>
          )}
        </div>

        {/* Member list */}
        <div className="space-y-2">
          {/* Select all */}
          <div className="flex items-center gap-2 px-2">
            <input type="checkbox" id="check-all"
              checked={checkedUids.size === visibleUsers.length && visibleUsers.length > 0}
              onChange={toggleAll}
              className="w-4 h-4 accent-primary rounded"
            />
            <label htmlFor="check-all" className="text-[11px] font-bold text-on-surface-variant cursor-pointer">전체 선택</label>
          </div>

          {visibleUsers.map((u: any) => {
            const isPaid = getIsPaid(u.uid);
            const consec = getConsecutiveUnpaid(u.uid);
            const isChecked = checkedUids.has(u.uid);
            const forestName = forests.find((f: any) => f.forest_id === u.forest_id)?.name || u.forest_id || '?';

            return (
              <div key={u.uid}
                className={`rounded-2xl border shadow-sm transition-all overflow-hidden ${
                  isPaid ? 'bg-surface-container-lowest border-surface-container-low' : 'bg-rose-50/50 border-rose-100'
                } ${isChecked ? 'ring-2 ring-primary' : ''}`}>
                <div className="p-3 flex items-center gap-3">
                  {/* C – Checkbox */}
                  <input type="checkbox" checked={isChecked} onChange={() => toggleCheck(u.uid)}
                    className="w-4 h-4 accent-primary rounded shrink-0" />
                  {/* Avatar */}
                  <div className="w-9 h-9 bg-surface-container-high rounded-full flex items-center justify-center text-sm font-bold overflow-hidden shrink-0">
                    {u.profile_image ? <img src={u.profile_image} alt={u.name} className="w-full h-full object-cover" /> : u.name.charAt(0)}
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-on-surface text-sm">{u.name}</p>
                      {consec >= 2 && <span className="text-[9px] font-bold text-rose-600 bg-rose-100 px-1.5 py-0.5 rounded-full">{consec}개월↑ 미납</span>}
                    </div>
                    <p className="text-[10px] text-on-surface-variant">{forestName}</p>
                  </div>
                  {/* E – Reminder bell */}
                  {!isPaid && (
                    <button
                      onClick={() => handleSendReminder(u)}
                      disabled={sendingUid === u.uid}
                      className="p-1.5 rounded-full bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors"
                      title="납부 안내 알림 발송">
                      <Bell size={13} />
                    </button>
                  )}
                  {/* Status toggle */}
                  <button
                    onClick={() => toggleFeeStatus(u)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                      isPaid ? 'bg-emerald-500 text-white shadow-sm' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                    }`}>
                    {isPaid ? '완납' : '미납'}
                  </button>
                  {/* F – Timeline button */}
                  <button
                    onClick={() => setTimelineUser(timelineUser?.uid === u.uid ? null : u)}
                    className="p-1.5 rounded-full bg-surface-container text-on-surface-variant hover:bg-surface-container-low transition-colors"
                    title="납부 이력 보기">
                    <History size={13} />
                  </button>
                </div>

                {/* F – Timeline expanded */}
                {timelineUser?.uid === u.uid && (
                  <div className="border-t border-surface-container-low px-4 py-3 bg-surface/50">
                    <p className="text-[11px] font-bold text-on-surface-variant mb-2">{selectedYear}년 납부 이력</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {timelineMonths.map(m => {
                        const mFee = fees.find((f: any) => f.uid === u.uid && f.year === selectedYear && f.month === m);
                        const mPaid = mFee?.status === 'paid';
                        return (
                          <div key={m} className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl border ${
                            mPaid ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100 animate-pulse'
                          }`}>
                            <span className="text-[10px] font-bold text-on-surface-variant">{m}월</span>
                            <span className={`text-base ${mPaid ? '' : ''}`}>{mPaid ? '✅' : '❌'}</span>
                            {mPaid && mFee?.paid_at?.seconds && (
                              <span className="text-[8px] text-on-surface-variant">
                                {new Date(mFee.paid_at.seconds * 1000).toLocaleDateString('ko', { month:'short', day:'numeric' })}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {visibleUsers.length === 0 && (
            <div className="text-center py-12 text-on-surface-variant">
              <Wallet size={40} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">표시할 회원이 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};





function RegistrationView({ forests, onComplete, user }: any) {
  const [birthdate, setBirthdate] = useState('');
  const [gender, setGender] = useState('');
  const [hasKids, setHasKids] = useState<boolean | null>(null);
  const [kidsInfo, setKidsInfo] = useState('');
  const [selectedForest, setSelectedForest] = useState('');
  const [privacyAgreed, setPrivacyAgreed] = useState(false);

  const displayForests = forests;

  const isFormValid = birthdate && gender && hasKids !== null && (hasKids ? kidsInfo.trim() !== '' : true) && selectedForest && privacyAgreed;

  const handleSubmit = () => {
    if (!isFormValid) return;
    onComplete({
      birthdate,
      gender,
      has_kids: hasKids,
      kids_info: hasKids ? kidsInfo : '',
      forest_id: selectedForest,
      privacy_agreed: privacyAgreed
    });
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col p-6 overflow-y-auto">
      <div className="mt-8 mb-6">
        <div className="w-16 h-16 bg-primary-container rounded-2xl flex items-center justify-center mb-6 shadow-sm">
          <TreePine size={32} className="text-primary" />
        </div>
        <h1 className="text-2xl font-bold font-headline text-on-surface mb-2 tracking-tight">환영합니다!</h1>
        <p className="text-on-surface-variant text-sm leading-relaxed">원활한 소통을 위해 처음 한 번만<br />가입 정보를 입력해 주세요.</p>
      </div>

      <div className="space-y-8 flex-1 pb-8">
        <div className="space-y-3">
          <label className="block text-sm font-bold text-on-surface">생년월일</label>
          <input
            type="date"
            value={birthdate}
            onChange={e => setBirthdate(e.target.value)}
            className="w-full bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 text-on-surface font-medium outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
          />
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-bold text-on-surface">성별</label>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setGender('male')} className={`p-4 rounded-2xl border font-bold transition-all shadow-sm ${gender === 'male' ? 'bg-primary/10 border-primary text-primary' : 'bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:bg-surface-container-low'}`}>남성</button>
            <button onClick={() => setGender('female')} className={`p-4 rounded-2xl border font-bold transition-all shadow-sm ${gender === 'female' ? 'bg-primary/10 border-primary text-primary' : 'bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:bg-surface-container-low'}`}>여성</button>
          </div>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-bold text-on-surface">자녀 유무 (키즈돌봄)</label>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setHasKids(true)} className={`p-4 rounded-2xl border font-bold transition-all shadow-sm ${hasKids === true ? 'bg-primary/10 border-primary text-primary' : 'bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:bg-surface-container-low'}`}>있음</button>
            <button onClick={() => { setHasKids(false); setKidsInfo(''); }} className={`p-4 rounded-2xl border font-bold transition-all shadow-sm ${hasKids === false ? 'bg-primary/10 border-primary text-primary' : 'bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:bg-surface-container-low'}`}>없음</button>
          </div>
          {hasKids && (
            <input
              type="text"
              placeholder="예: 7세 남, 5세 여"
              value={kidsInfo}
              onChange={e => setKidsInfo(e.target.value)}
              className="mt-3 w-full bg-surface-container-lowest border border-outline-variant rounded-2xl p-4 text-on-surface outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm"
            />
          )}
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-bold text-on-surface">소속 숲 선택</label>
          <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto p-1 scrollbar-hide">
            {displayForests.map((forest: any) => (
              <button
                key={forest.id}
                onClick={() => setSelectedForest(forest.id)}
                className={`flex flex-col items-center justify-center py-4 px-2 border rounded-2xl transition-all shadow-sm ${selectedForest === forest.id ? 'bg-primary text-on-primary border-primary shadow-md' : 'bg-surface-container-lowest border-outline-variant text-on-surface hover:bg-surface-container-low'}`}
              >
                <span className="font-bold">{forest.name}</span>
                {forest.leader && <span className={`text-xs mt-1 ${selectedForest === forest.id ? 'opacity-90' : 'text-on-surface-variant'}`}>{forest.leader} 리더</span>}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-outline-variant space-y-4">
          <label className="flex items-start gap-4 cursor-pointer group p-3 rounded-2xl hover:bg-surface-container-lowest transition-colors -mx-3">
            <div className={`mt-0.5 shrink-0 w-6 h-6 rounded-md flex items-center justify-center border transition-all ${privacyAgreed ? 'bg-primary border-primary text-on-primary' : 'bg-white border-outline-variant text-transparent group-hover:border-primary/50'}`}>
              <CheckCircle2 size={16} className={privacyAgreed ? 'opacity-100' : 'opacity-0'} />
            </div>
            <input type="checkbox" className="hidden" checked={privacyAgreed} onChange={(e) => setPrivacyAgreed(e.target.checked)} />
            <span className="text-sm text-on-surface-variant leading-relaxed">
              [필수] 원활한 모임 및 회원 관리를 위해 위 개인정보(생년월일, 성별, 자녀정보, 소속)를 수집 및 이용하는 것에 동의합니다.
            </span>
          </label>
        </div>
      </div>

      <div className="mt-auto pt-4 pb-2 sticky bottom-0 bg-surface/90 backdrop-blur-md">
        <button
          onClick={handleSubmit}
          disabled={!isFormValid}
          className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-sm ${isFormValid ? 'bg-primary text-on-primary shadow-lg active:scale-95' : 'bg-surface-container-highest text-outline cursor-not-allowed opacity-70'}`}
        >
          가입 완료하기
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}

export function MenuButton({ icon, label, hoverBg, onClick }: any) {
  return (
    <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={onClick}>
      <div className={`w-14 h-14 bg-surface-container-lowest shadow-sm rounded-2xl flex items-center justify-center transition-colors ${hoverBg}`}>
        {icon}
      </div>
      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter whitespace-nowrap">{label}</span>
    </div>
  );
}

export function ScheduleItem({ month, day, dDay, time, title, location, dDayClass, active }: any) {
  return (
    <div className="bg-surface-container-lowest p-6 squircle flex items-center gap-6 group hover:bg-surface-container-low transition-colors duration-300 shadow-sm cursor-pointer">
      <div className={`flex flex-col items-center justify-center ${!active ? 'opacity-60' : ''}`}>
        <span className={`text-xs font-bold uppercase tracking-widest ${active ? 'text-primary-dim' : 'text-outline'}`}>{month}</span>
        <span className="font-headline text-3xl font-extrabold text-on-surface">{day}</span>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className={`${dDayClass} text-[10px] font-black px-2 py-0.5 rounded-full uppercase`}>{dDay}</span>
          <span className="text-xs font-bold text-tertiary-dim">{time}</span>
        </div>
        <h3 className="font-headline font-bold text-on-surface text-lg">{title}</h3>
        <p className="text-xs text-on-surface-variant flex items-center gap-1 mt-1">
          <MapPin className="w-3.5 h-3.5" />
          {location}
        </p>
      </div>
      <ChevronRight className="w-6 h-6 text-surface-container-highest group-hover:text-primary transition-colors" />
    </div>
  );
}

function BottomNavItem({ icon, label, id, activeTab, onClick }: any) {
  const isActive = activeTab === id;
  if (isActive) {
    return (
      <button className="flex flex-col items-center justify-center bg-[#006948]/10 text-[#006948] rounded-full px-3 py-2 active:scale-90 transition-transform duration-300">
        {icon}
        <span className="font-headline text-[10px] font-semibold tracking-wide mt-1 whitespace-nowrap">{label}</span>
      </button>
    );
  }
  return (
    <button onClick={() => onClick(id)} className="flex flex-col items-center justify-center text-stone-500 hover:text-[#006948] px-3 py-2 active:scale-90 transition-transform duration-300">
      {icon}
      <span className="font-headline text-[10px] font-semibold tracking-wide mt-1 whitespace-nowrap">{label}</span>
    </button>
  );
}

export const MemberRow = ({ member, forests, onClick }: any) => {
  const forestName = forests?.find((f: any) => f.forest_id === member.forest_id)?.name || '소속 없음';

  const getMinistryBadge = (ministry: string) => {
    switch (ministry) {
      case '예배팀': return 'bg-purple-100 text-purple-700 border-purple-200';
      case '새가족팀': return 'bg-green-100 text-green-700 border-green-200';
      case '기획팀': return 'bg-blue-100 text-blue-700 border-blue-200';
      case '선교봉사팀': return 'bg-orange-100 text-orange-700 border-orange-200';
      case '관리팀': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div onClick={onClick} className="flex justify-between items-center p-3 hover:bg-surface-container-low rounded-[2rem] cursor-pointer transition-colors group">
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          {member.profile_image ? (
            <img src={member.profile_image} alt={member.name} className="w-12 h-12 rounded-full object-cover shadow-inner border border-surface-container-highest" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-12 h-12 bg-surface-container-high text-on-surface rounded-full flex items-center justify-center font-headline font-bold text-lg shadow-inner border border-surface-container-highest">
              {member.name.charAt(0)}
            </div>
          )}
          {member.role === 'leader' && (
            <div className="absolute -bottom-1 -right-1 bg-tertiary text-on-tertiary w-5 h-5 rounded-full flex items-center justify-center border-2 border-surface-container-lowest shadow-sm">
              <span className="text-[8px]">👑</span>
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <p className="font-bold text-on-surface text-sm tracking-tight group-hover:text-primary transition-colors">
              {member.name}
            </p>
            {member.ministry && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getMinistryBadge(member.ministry)}`}>
                {member.ministry}
              </span>
            )}
          </div>
          <p className="text-[11px] text-on-surface-variant font-medium mt-0.5 flex items-center gap-1">
            {forestName} {member.role === 'leader' ? '• 숲장' : '• 멤버'}
          </p>
        </div>
      </div>
      <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center group-hover:bg-primary/10 transition-colors">
        <ChevronRight size={16} className="text-outline group-hover:text-primary transition-colors" />
      </div>
    </div>
  );
};







// ==========================================
// 5. Worship View (온라인 주보)
// ==========================================










const Toast = ({ message }: { message: string }) => {
  return (
    <div className="fixed bottom-24 left-0 right-0 z-[100] flex justify-center px-4 pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-300">
      <div className="bg-inverse-surface text-inverse-on-surface px-6 py-3 rounded-full shadow-lg font-medium text-sm flex items-center gap-2">
        <CheckCircle2 size={16} className="text-primary-container" />
        {message}
      </div>
    </div>
  );
};

// ==========================================
// 5. Quick Menu Detailed Views
// ==========================================

const AttendanceView = ({ user, attendance, onBack, onShowToast }: any) => {
  const userAttendance = attendance
    .filter((a: any) => a.uid === user.uid)
    .sort((a: any, b: any) => b.date?.seconds - a.date?.seconds);

  return (
    <div className="absolute inset-0 bg-surface z-[60] flex flex-col min-h-screen overflow-y-auto pb-24">
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface-container-highest">
        <div className="flex items-center px-2 py-3">
          <button onClick={onBack} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-bold tracking-tight text-on-surface ml-2">출석체크</h1>
        </div>
      </header>
      <div className="p-6 space-y-8">
        <div className="bg-surface-container-lowest rounded-3xl p-8 shadow-sm border border-surface-container-low flex flex-col items-center text-center">
          <h2 className="text-xl font-bold text-on-surface mb-2">주일 예배 출석</h2>
          <p className="text-sm text-on-surface-variant mb-8">아래 QR 코드를 리더에게 보여주세요.</p>
          <div className="bg-white p-6 rounded-2xl shadow-inner border border-surface-container mb-6">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${user.uid}`}
              alt="My Attendance QR Code"
              className="w-48 h-48"
              referrerPolicy="no-referrer"
            />
          </div>
          <p className="text-xs text-on-surface-variant max-w-[200px]">
            현장에 비치된 QR 리더기에 위 코드를 인식시키면 자동으로 출석이 체크됩니다.
          </p>
        </div>

        <section className="space-y-4">
          <h3 className="text-lg font-bold text-on-surface font-headline px-2">최근 출석 내역</h3>
          <div className="space-y-3">
            {userAttendance.length > 0 ? (
              userAttendance.slice(0, 5).map((item: any) => (
                <div key={item.id} className="bg-surface-container-lowest p-4 rounded-2xl flex items-center justify-between border border-surface-container-low">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
                      <CheckCircle2 size={20} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-on-surface text-sm">{item.type}</p>
                      <p className="text-xs text-on-surface-variant">
                        {item.date?.toDate ? item.date.toDate().toLocaleDateString() :
                          (item.date?.seconds ? new Date(item.date.seconds * 1000).toLocaleDateString() : '날짜 정보 없음')}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full">{item.status}</span>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-on-surface-variant text-sm">
                출석 내역이 없습니다.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};



const FinanceView = ({ user, fees, onBack, onShowToast }: any) => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const userFees = fees.filter((f: any) => f.uid === user?.uid);
  const currentMonthFee = userFees.find((f: any) => f.year === currentYear && f.month === currentMonth);
  const totalPaidThisYear = userFees
    .filter((f: any) => f.year === currentYear && f.status === 'paid')
    .reduce((sum: number, f: any) => sum + f.amount, 0);

  const isPaid = currentMonthFee?.status === 'paid';

  return (
    <div className="absolute inset-0 bg-surface z-[60] flex flex-col min-h-screen overflow-y-auto pb-24">
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface-container-highest">
        <div className="flex items-center px-2 py-3">
          <button onClick={onBack} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-bold tracking-tight text-on-surface ml-2">회비 납부내역</h1>
        </div>
      </header>
      <div className="p-6 space-y-8">
        <div className="bg-[#6b4ce6] rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-48 h-48 bg-white/10 rounded-3xl rotate-12 blur-sm"></div>
          <div className="absolute top-4 right-4 opacity-20">
            <Wallet size={80} strokeWidth={1.5} />
          </div>

          <div className="relative z-10">
            <p className="text-sm font-medium opacity-90 mb-1">{currentYear}년 총 납부액</p>
            <h2 className="text-4xl font-extrabold font-headline tracking-tight mb-6">{totalPaidThisYear.toLocaleString()}원</h2>

            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 flex items-center justify-between">
              <span className="text-sm font-medium">{currentMonth}월 회비 납부 상태</span>
              {isPaid ? (
                <div className="bg-emerald-500 text-white px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1.5 shadow-sm">
                  <CheckCircle2 size={16} />
                  <span>완납</span>
                </div>
              ) : (
                <div className="bg-[#d9776c] text-white px-3 py-1 rounded-lg text-sm font-bold flex items-center gap-1.5 shadow-sm">
                  <XCircle size={16} />
                  <span>미납</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <section className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-xl font-bold text-on-surface font-headline">월별 납부 내역</h3>
          </div>

          {userFees.length > 0 ? (
            <div className="space-y-3">
              {userFees.sort((a: any, b: any) => b.month - a.month).map((item: any, i: number) => (
                <div key={i} className="bg-surface-container-lowest p-5 rounded-2xl flex items-center justify-between border border-surface-container-low shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#6b4ce6]/10 flex items-center justify-center">
                      <span className="font-bold text-[#6b4ce6]">{item.month}월</span>
                    </div>
                    <div>
                      <p className="font-bold text-on-surface text-sm">{item.month}월 회비</p>
                      <p className="text-xs text-on-surface-variant mt-0.5">
                        {item.paid_at?.toDate ? item.paid_at.toDate().toLocaleDateString() :
                          (item.paid_at?.seconds ? new Date(item.paid_at.seconds * 1000).toLocaleDateString() :
                            (item.status === 'paid' ? '납부 완료' : '납부 대기'))}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-on-surface block">{item.amount.toLocaleString()} 원</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${item.status === 'paid' ? 'text-emerald-600 bg-emerald-50' : 'text-error bg-error/10'
                      }`}>
                      {item.status === 'paid' ? '완납' : '미납'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-2xl p-10 text-center border border-surface-container-low border-dashed flex flex-col items-center">
              <div className="w-16 h-16 bg-surface-container-high rounded-full flex items-center justify-center mb-4">
                <Wallet size={32} className="text-outline" />
              </div>
              <p className="text-on-surface-variant font-medium">아직 납부된 회비 내역이 없습니다.</p>
              <p className="text-xs text-outline mt-1">회비는 매월 1일에 청구됩니다.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};









