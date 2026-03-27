/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Menu, Bell, User, Flame, QrCode, Users, ClipboardList, Wallet, FileText,
  MapPin, ChevronRight, ChevronLeft, Home, LayoutGrid, BookOpen, Calendar, Baby,
  MessageCircle, ArrowLeft, CheckCircle2, XCircle, FileEdit, X, Search, Phone, Lock, UserCircle, Settings, Award, Clock, Heart, MessageSquare, Send, LogOut, Sparkles, TreePine, HeartHandshake, GraduationCap, History, Plus, Play,
  SlidersHorizontal, Camera, Bookmark, MoreHorizontal, Music, Megaphone, Trash2, MoreVertical
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

// ==========================================
// Types & Error Handling
// ==========================================
enum OperationType {
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

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
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
  const [fees, setFees] = useState<any[]>([]);
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

    // Fees listener - restricted by permission
    const isAdminUser = userData?.role === 'admin' || user?.uid === 'sfViap2UZ2alO1kzinMETlcLCxv1' || user?.email === 'seokgwan.ms01@gmail.com' || user?.email === 'jumphorse@nate.com';
    const canSeeAllFees = isAdminUser || userData?.permissions?.finance;
    const feesQuery = canSeeAllFees 
      ? collection(firestoreDb, 'fees') 
      : query(collection(firestoreDb, 'fees'), where('uid', '==', user.uid));

    const unsubFees = onSnapshot(feesQuery, (snapshot) => {
      setFees(snapshot.docs.map(d => ({ ...d.data(), id: d.id })));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'fees'));

    return () => {
      unsubUsers();
      unsubForests();
      unsubPrograms();
      unsubAttendance();
      unsubForestPosts();
      unsubSchedules();
      unsubSurveys();
      unsubWorships();
      unsubFees();
    };
  }, [isAuthReady, user?.uid, userData?.role, userData?.permissions?.finance]);

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
    role: (userData?.role === 'admin' || user?.uid === 'sfViap2UZ2alO1kzinMETlcLCxv1' || user?.email === 'seokgwan.ms01@gmail.com' || user?.email === 'jumphorse@nate.com') ? 'admin' : (userData?.role || 'member')
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
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Google 계정으로 로그인
        </button>

        <button 
          onClick={handleKakaoLogin}
          className="w-full max-w-sm mt-3 bg-[#FEE500] text-black/85 py-4 px-6 rounded-2xl font-bold flex items-center justify-center gap-3 shadow-sm hover:bg-[#FEE500]/90 transition-colors active:scale-95"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 3c-5.523 0-10 3.47-10 7.75 0 2.73 1.88 5.13 4.68 6.47-.15.48-.48 1.68-.55 1.95-.09.33.12.33.26.24.11-.08 1.73-1.15 2.45-1.65 1.01.29 2.07.44 3.16.44 5.523 0 10-3.47 10-7.75S17.523 3 12 3z"/>
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
      setSubPage('forest_board');
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
            <div className="flex items-center gap-2 active:scale-95 duration-200 cursor-pointer">
              <Bell className="text-stone-600 hover:opacity-80 transition-opacity w-6 h-6" />
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
        {subPage === 'forest_board' && <ForestBoardView user={currentUser} forestId={selectedForestId} forests={forests} users={users} forestPosts={forestPosts} onBack={() => setSubPage(null)} />}
        {subPage === 'program_detail' && <ProgramDetailView user={currentUser} programId={selectedProgramId} programs={programs} onBack={() => setSubPage(null)} onShowToast={showToast} />}
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
        {subPage === 'minutes' && <MinutesView onBack={() => setSubPage(null)} onShowToast={showToast} />}
        {subPage === 'admin' && (
          <AdminDashboardView 
            onBack={() => setSubPage(null)} 
            onNavigateToUsers={() => setSubPage('admin_users')}
            onNavigateToBoards={() => setSubPage('admin_boards')}
            onNavigateToSurveys={() => setSubPage('admin_surveys')}
            onNavigateToFinance={() => setSubPage('admin_finance')}
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
            users={users}
            fees={fees}
            onBack={() => setSubPage('admin')} 
            onShowToast={showToast} 
          />
        )}
        
        {!subPage && activeTab === 'home' && (
          <div className="pt-6 px-6 space-y-10">
            <HomeView 
              user={currentUser} 
              schedules={schedules.length > 0 ? schedules : mockDb.schedules} 
              surveys={surveys}
              attendance={attendance}
              onNavigateToMyForestBoard={handleNavigateToMyForestBoard}
              onNavigate={(page: string) => setSubPage(page)}
            />
          </div>
        )}
        {!subPage && activeTab === 'members' && (
          <div className="pt-6 px-6 space-y-10">
            <MembersView 
              user={currentUser} 
              users={users.length>0 ? users : mockDb.users}
              forests={mergedForests}
              onOpenBoard={(fId: string) => { setSelectedForestId(fId); setSubPage('forest_board'); }} 
              onShowToast={showToast}
            />
          </div>
        )}
        {!subPage && activeTab === 'program' && (
          <ProgramView 
            user={currentUser}
            programs={programs.length > 0 ? programs : mockDb.programs} 
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
            onNavigateToDetail={(id: string) => { setSelectedWorshipId(id); setSubPage('worship_detail'); }}
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
            worshipId={selectedWorshipId}
            worships={worships}
            onBack={() => setSubPage(null)} 
          />
        )}
        {!subPage && activeTab === 'calendar' && <CalendarView schedules={schedules.length > 0 ? schedules : mockDb.schedules} onShowToast={showToast} />}
        {!subPage && activeTab === 'kids' && <KidsView user={currentUser} onShowToast={showToast} />}
      </main>

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
    </div>
  );
}

// ==========================================
// 3. Sub Views
// ==========================================

const HomeView = ({ user, schedules, surveys, attendance, onNavigateToMyForestBoard, onNavigate }: any) => {
  const today = new Date().toISOString().split('T')[0];
  const hasCheckedInToday = attendance?.some((a: any) => 
    a.uid === user.uid && 
    a.date?.toDate && 
    a.date.toDate().toISOString().split('T')[0] === today
  );

  const activeSurveys = surveys?.filter((s: any) => s.status === 'active') || [];

  return (
    <>
      {/* Greeting Card */}
      <section className="relative overflow-hidden squircle p-8 bg-gradient-to-br from-emerald-300 to-emerald-400 text-on-primary-container shadow-sm group">
        <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 bg-white/20 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
        <div className="relative z-10">
          <p className="font-headline text-lg font-semibold opacity-90 mb-1">기쁨 가득한 한 주 되세요, {user.name} 님</p>
          <div className="flex items-end gap-2">
            <h1 className="font-headline text-4xl font-extrabold tracking-tight">{user.score}점</h1>
            <span className="mb-1 text-sm font-bold opacity-75">내 활동 점수</span>
          </div>
          <div className="mt-6 flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/30 backdrop-blur-md py-2 px-4 rounded-full w-fit">
              <Flame className="w-4 h-4" fill="currentColor" />
              <span className="text-xs font-bold uppercase tracking-wider">상위 5%</span>
            </div>
          </div>
        </div>
        <div className="absolute -bottom-6 -right-6 w-32 h-32 opacity-20">
          <img 
            className="w-full h-full object-contain" 
            alt="상큼한 초록 잎사귀 수채화 텍스처" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTliXpNYHI2hYhXGRPTI8UzhskQgAgV_Ea6d0i8IK-htrFSr7OjZD_TFziS-_qPf-aTbB-yelF9F_gNOMm-Ho0lqKqubgQWL3FJwo6_0TW1Dv-g6t61ojCgHZYmcIoBIeMNwxfZGXluLM9SgEi4w9z3EYsc7ADBZ6F4oHAE42NiTNwdLMQMvzdHeIpy2p5RyqXuX13Pt1xvnBNVTp-6rW8-BotFzZreFB8Z2nkpswN4JDil48AEBjijjd2Mm3dST4gwP--BYVT1Q"
            referrerPolicy="no-referrer"
          />
        </div>
      </section>

      {/* Quick Menu Grid */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h2 className="font-headline text-xl font-bold tracking-tight text-on-surface">간편 메뉴</h2>
          <span className="text-xs font-bold text-primary-dim uppercase tracking-widest cursor-pointer">전체보기</span>
        </div>
        <div className="grid grid-cols-5 gap-3">
          <MenuButton icon={<QrCode className="w-6 h-6 text-primary-dim group-hover:scale-110 transition-transform" />} label="출석체크" hoverBg="hover:bg-primary-container" onClick={() => onNavigate('attendance')} />
          <MenuButton icon={<Users className="w-6 h-6 text-secondary group-hover:scale-110 transition-transform" />} label="숲 모임" hoverBg="hover:bg-secondary-container" onClick={onNavigateToMyForestBoard} />
          <MenuButton icon={<ClipboardList className="w-6 h-6 text-tertiary group-hover:scale-110 transition-transform" />} label="설문조사" hoverBg="hover:bg-tertiary-container" onClick={() => onNavigate('survey')} />
          <MenuButton icon={<Wallet className="w-6 h-6 text-emerald-800 group-hover:scale-110 transition-transform" />} label="회비납부" hoverBg="hover:bg-emerald-100" onClick={() => onNavigate('finance')} />
          <MenuButton icon={<FileText className="w-6 h-6 text-blue-800 group-hover:scale-110 transition-transform" />} label="회의록" hoverBg="hover:bg-blue-100" onClick={() => onNavigate('minutes')} />
        </div>
      </section>

      {/* Active Surveys Section */}
      {activeSurveys.length > 0 && (
        <section className="space-y-4">
          <div className="flex justify-between items-center px-2">
            <h2 className="font-headline text-xl font-bold tracking-tight text-on-surface">진행 중인 설문</h2>
            <span onClick={() => onNavigate('survey')} className="text-xs font-bold text-primary cursor-pointer">더보기</span>
          </div>
          <div className="space-y-3">
            {activeSurveys.map((survey: any) => (
              <div 
                key={survey.id} 
                onClick={() => onNavigate('survey')}
                className="bg-tertiary-container/20 border border-tertiary-container/30 p-5 rounded-3xl flex items-center justify-between group cursor-pointer hover:bg-tertiary-container/30 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="bg-tertiary text-on-tertiary p-2.5 rounded-2xl">
                    <ClipboardList size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-on-surface">{survey.title}</h3>
                    <p className="text-xs text-on-surface-variant mt-0.5">{survey.deadline?.toDate ? `마감: ${survey.deadline.toDate().toLocaleDateString()}` : '진행 중'}</p>
                  </div>
                </div>
                <ChevronRight size={20} className="text-tertiary group-hover:translate-x-1 transition-transform" />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Upcoming Schedule Section */}
    <section className="space-y-6">
      <div className="flex justify-between items-center px-2">
        <h2 className="font-headline text-xl font-bold tracking-tight text-on-surface">다가오는 일정</h2>
        <div className="flex gap-1">
          <div className="w-2 h-2 rounded-full bg-primary"></div>
          <div className="w-2 h-2 rounded-full bg-surface-container-highest"></div>
        </div>
      </div>
      <div className="space-y-4">
        {schedules.map((schedule: any) => (
          <ScheduleItem 
            key={schedule.id}
            month={schedule.date.split(' ')[0]} 
            day={schedule.date.split(' ')[1].replace('일', '')} 
            dDay={schedule.d_day} 
            time={schedule.time} 
            title={schedule.title} 
            location={schedule.location} 
            dDayClass={schedule.active ? "bg-error-container/20 text-on-error-container" : "bg-surface-container-high text-on-surface-variant"}
            active={schedule.active}
          />
        ))}
      </div>
    </section>

    {/* Community Highlight */}
    <section className="bg-tertiary-container/30 squircle overflow-hidden p-6 relative">
      <div className="relative z-10 flex flex-col gap-4">
        <span className="bg-tertiary text-on-tertiary text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-full w-fit">멤버 이야기</span>
        <h4 className="font-headline text-2xl font-extrabold text-on-tertiary-container leading-tight">매일의 신앙 산책 속에서 평안을 찾다.</h4>
        <div className="flex items-center gap-3 mt-2">
          <div className="w-10 h-10 rounded-full border-2 border-white overflow-hidden">
            <img 
              className="w-full h-full object-cover" 
              alt="웃고 있는 한국인 남성 멤버 프로필" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA8iYWtDYB66oP6sVlyf1a1oU9e0bn0UolNyAnjiC4cWxvHHehWeK9fvFgv0MrgPHoetw6Gq74dA4LgaTdZ7QUeKwew2-w93mRv3ZOtjGJtIjb7QSJr_UNQt6k_7HiZ_QT1aRRuKgH-LeRplKy5hLDK23z4FMjTWeDbDRAte4VGf1kwa4UX9Hv68vGl3z0NyddNszTU_BOBrLFbYvTI0w3ZTQRcNbXYhqOwWj2luL7zQmuxsm55pEMyZpNPRyllwo5gchEdny8YpA"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-bold text-on-tertiary-container">다윗 민</span>
            <span className="text-[10px] font-medium text-tertiary-dim uppercase">디자인 팀</span>
          </div>
        </div>
      </div>
      <div className="absolute top-0 right-0 w-1/2 h-full">
        <img 
          className="w-full h-full object-cover mix-blend-multiply opacity-20" 
          alt="가을 숲의 부드러운 배경" 
          src="https://lh3.googleusercontent.com/aida-public/AB6AXuDbWVS0jJsnx05Pemrlg8SarOQuUSDp0emLH_KtYNKtZrnmHdvbmGzAMCBJru2-poOs2AR8pdpCx8PHwGzRHJGODwnEjjZFj9bDlayCSSLjBPXxCOTCKMyDb7wPEoSprE1u36FcBS77CVhkXsjcS4qjlhP2plOsn7bhJ1nzX32Xo2Qq0klT6aLFyNc3gtMNKTgfMDWmhv-v7eOWeMxB1zLwwK6hGNcEo3pFocbyNAOUSZ1Vnrh6a25wv5ZAHYx6LICCr3RyHUTYEg"
          referrerPolicy="no-referrer"
        />
      </div>
    </section>
    </>
  );
};

const MembersView = ({ user, users, forests, onOpenBoard, onShowToast }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMembersTab, setActiveMembersTab] = useState('all'); // all, ministry, forest
  const [expandedForests, setExpandedForests] = useState<Record<string, boolean>>({});

  const searchResults = searchQuery
    ? users.filter((u: any) => {
        const forest = forests.find((f: any) => f.forest_id === u.forest_id);
        const forestName = forest?.name || '';
        return u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
               forestName.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : [];

  const getForestEmoji = (forestId: string) => {
    switch(forestId) {
      case 'bebe': return '👶';
      case 'superpower': return '💪';
      case 'supermance': return '🏃';
      case 'bts': return '🌟';
      case 'haneul': return '☁️';
      case 'bamboo': return '🎋';
      case 'tta': return '☕';
      case 'pureun': return '🌲';
      case 'goyo': return '🤫';
      case 'supreme': return '🧢';
      case 'start': return '🚀';
      default: return '🌳';
    }
  };

  const toggleForest = (forestId: string) => {
    setExpandedForests(prev => ({...prev, [forestId]: !prev[forestId]}));
  };

  const ministries = ['예배팀', '새가족팀', '기획팀', '선교봉사팀', '관리팀'];

  return (
    <div className="space-y-6 pb-24">
      {/* Header Section */}
      <div className="flex flex-col gap-2 px-2">
        <h2 className="font-headline text-3xl font-extrabold text-on-surface tracking-tight">삼성/사성이</h2>
        <p className="text-sm font-medium text-on-surface-variant">FOREST 3040의 모든 가족들을 만나보세요.</p>
      </div>

      {/* Tabs */}
      <div className="flex bg-surface-container-lowest p-1.5 rounded-[1.25rem] shadow-sm">
        {[
          { id: 'all', label: '전체' },
          { id: 'ministry', label: '사역' },
          { id: 'forest', label: '숲그룹' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveMembersTab(tab.id)}
            className={`flex-1 py-2.5 text-sm font-bold rounded-xl transition-all ${
              activeMembersTab === tab.id 
                ? 'bg-white shadow-sm text-primary' 
                : 'text-on-surface-variant hover:text-on-surface hover:bg-white/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
          <Search className="text-outline group-focus-within:text-primary transition-colors" size={20} />
        </div>
        <input
          type="text"
          placeholder="이름으로 검색하세요..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-14 pr-5 py-4 bg-surface-container-lowest squircle shadow-[0_4px_20px_rgba(0,0,0,0.03)] border-none focus:ring-2 focus:ring-primary/30 transition-all font-body text-on-surface placeholder:text-outline-variant outline-none"
        />
      </div>

      {searchQuery ? (
        <div className="bg-surface-container-lowest p-3 squircle shadow-sm">
          {searchResults.length > 0 ? (
            <div className="space-y-1">
              {searchResults.map((member: any) => (
                <MemberRow key={member.uid} member={member} forests={forests} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 opacity-70">
              <UserCircle size={40} className="text-outline mb-3" />
              <p className="text-on-surface-variant text-sm font-medium">검색 결과가 없습니다.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {activeMembersTab === 'all' && (
            <div className="bg-surface-container-lowest p-3 squircle shadow-sm space-y-1">
              {users.map((member: any) => (
                <MemberRow key={member.uid} member={member} forests={forests} />
              ))}
            </div>
          )}

          {activeMembersTab === 'ministry' && (
            <div className="space-y-6">
              {ministries.map(ministry => {
                const teamMembers = users.filter((u: any) => u.ministry === ministry);
                if (teamMembers.length === 0) return null;
                return (
                  <div key={ministry} className="bg-surface-container-lowest p-5 squircle shadow-sm">
                    <h3 className="font-bold text-on-surface text-lg tracking-tight mb-4 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary"></span> {ministry}
                    </h3>
                    <div className="space-y-1">
                      {teamMembers.map((member: any) => (
                        <MemberRow key={member.uid} member={member} forests={forests} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeMembersTab === 'forest' && (
            <div className="space-y-4">
              {forests.map((forest: any) => {
                const forestMembers = users.filter((u: any) => u.forest_id === forest.forest_id);
                const leader = users.find((u: any) => u.forest_id === forest.forest_id && u.role === 'leader');
                const leaderName = leader ? leader.name : '공석';
                const isExpanded = expandedForests[forest.forest_id];

                return (
                  <div key={forest.forest_id} className="bg-surface-container-lowest p-5 squircle shadow-sm relative overflow-hidden transition-all duration-300 border border-transparent hover:border-surface-container-low">
                    <div 
                      className="flex justify-between items-center cursor-pointer select-none"
                      onClick={() => toggleForest(forest.forest_id)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-3xl bg-surface-container p-3 rounded-2xl shadow-inner border border-surface-container-high/50">
                          {getForestEmoji(forest.forest_id)}
                        </div>
                        <div className="flex flex-col">
                          <h3 className="font-extrabold text-on-surface text-lg">{forest.name}</h3>
                          <div className="flex items-center gap-2 text-xs text-on-surface-variant font-bold mt-0.5">
                            <span>{forestMembers.length}명</span>
                            <span className="w-1 h-1 bg-outline-variant rounded-full"></span>
                            <span className="flex items-center gap-0.5">👑 {leaderName}</span>
                          </div>
                        </div>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center transition-transform duration-300">
                        <ChevronRight size={20} className={`text-on-surface-variant transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    </div>
                    
                    <div className={`grid transition-all duration-500 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-4' : 'grid-rows-[0fr] opacity-0'}`}>
                      <div className="overflow-hidden space-y-1">
                        <div className="pt-2 border-t border-surface-container-low space-y-1 gap-1 flex flex-col">
                          {forestMembers.map((member: any) => (
                            <MemberRow key={member.uid} member={member} forests={forests} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

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
            <p className="text-on-surface-variant text-sm font-body">아직 작성된 글이 없습니다.<br/>우리 숲의 첫 번째 이야기를 남겨보세요!</p>
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

const AdminDashboardView = ({ onBack, onNavigateToUsers, onNavigateToBoards, onNavigateToSurveys, onNavigateToFinance, onShowToast }: any) => {
  const adminMenus = [
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
              <p className="text-sm text-on-surface-variant mt-2">정말로 이 게시글을 삭제하시겠습니까?<br/>삭제된 글은 복구할 수 없습니다.</p>
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

const AdminFinanceManagementView = ({ users, fees, onBack, onShowToast }: any) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const handleToggleFeeStatus = async (user: any) => {
    const existingFee = fees.find((f: any) => f.uid === user.uid && f.year === selectedYear && f.month === selectedMonth);
    
    try {
      if (existingFee) {
        await updateDoc(doc(firestoreDb, 'fees', existingFee.id), {
          status: existingFee.status === 'paid' ? 'unpaid' : 'paid',
          paid_at: existingFee.status === 'paid' ? null : Timestamp.now()
        });
      } else {
        await addDoc(collection(firestoreDb, 'fees'), {
          uid: user.uid,
          user_name: user.name,
          year: selectedYear,
          month: selectedMonth,
          amount: 10000, // Default fee amount
          status: 'paid',
          paid_at: Timestamp.now()
        });
      }
      onShowToast(`${user.name}님의 회비 상태가 업데이트되었습니다.`);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'fees');
    }
  };

  return (
    <div className="absolute inset-0 bg-surface z-[60] flex flex-col min-h-screen overflow-y-auto pb-24">
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface-container-highest">
        <div className="flex items-center px-2 py-3">
          <button onClick={onBack} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-bold tracking-tight text-on-surface ml-2">회비 관리</h1>
        </div>
      </header>

      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4 bg-surface-container-lowest p-4 rounded-2xl border border-surface-container-low shadow-sm">
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-outline uppercase mb-1">연도</label>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full bg-transparent font-bold text-on-surface outline-none"
            >
              {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}년</option>)}
            </select>
          </div>
          <div className="w-px h-8 bg-surface-container-high"></div>
          <div className="flex-1">
            <label className="block text-[10px] font-bold text-outline uppercase mb-1">월</label>
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full bg-transparent font-bold text-on-surface outline-none"
            >
              {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => <option key={m} value={m}>{m}월</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-bold text-on-surface px-2">회원별 납부 현황</h3>
          {users.map((u: any) => {
            const fee = fees.find((f: any) => f.uid === u.uid && f.year === selectedYear && f.month === selectedMonth);
            const isPaid = fee?.status === 'paid';
            
            return (
              <div key={u.uid} className="bg-surface-container-lowest p-4 rounded-2xl flex items-center justify-between border border-surface-container-low shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-surface-container-high rounded-full flex items-center justify-center text-sm font-bold overflow-hidden">
                    {u.profile_image ? <img src={u.profile_image} alt={u.name} className="w-full h-full object-cover" /> : u.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-on-surface text-sm">{u.name}</p>
                    <p className="text-[10px] text-on-surface-variant">{u.forest_id || '소속 없음'}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleToggleFeeStatus(u)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    isPaid 
                      ? 'bg-emerald-500 text-white shadow-sm' 
                      : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                  }`}
                >
                  {isPaid ? '납부완료' : '미납'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const AdminUserManagementView = ({ users, onBack, onShowToast }: any) => {
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [editProfile, setEditProfile] = useState<any>(null);

  const handleSelectUser = (u: any) => {
    setSelectedUser(u);
    setEditProfile({
      name: u.name || '',
      birthdate: u.birthdate || '',
      gender: u.gender || '',
      forest_id: u.forest_id || '',
      ministry: u.ministry || '',
      role: u.role || 'member',
      score: u.score || 0
    });
  };

  const handleSaveProfile = async () => {
    if (!selectedUser) return;
    try {
      const userRef = doc(firestoreDb, 'users', selectedUser.uid);
      await updateDoc(userRef, {
        name: editProfile.name,
        birthdate: editProfile.birthdate,
        gender: editProfile.gender,
        forest_id: editProfile.forest_id,
        ministry: editProfile.ministry,
        role: editProfile.role,
        score: Number(editProfile.score) || 0
      });
      onShowToast('프로필 정보가 수정되었습니다.');
      setSelectedUser({ ...selectedUser, ...editProfile, score: Number(editProfile.score) || 0 });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${selectedUser.uid}`);
    }
  };

  const handlePermissionToggle = async (userId: string, menu: string, currentValue: boolean) => {
    try {
      const userRef = doc(firestoreDb, 'users', userId);
      await updateDoc(userRef, {
        [`permissions.${menu}`]: !currentValue
      });
      onShowToast('권한이 변경되었습니다.');
      setSelectedUser({
        ...selectedUser,
        permissions: {
          ...selectedUser.permissions,
          [menu]: !currentValue
        }
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  if (selectedUser) {
    const permissions = selectedUser.permissions || {};
    const menuItems = [
      { id: 'survey', label: '설문조사 관리' },
      { id: 'finance', label: '회비 관리' },
      { id: 'schedule', label: '일정 관리' },
      { id: 'forest', label: '숲 관리' },
      { id: 'attendance', label: '출석 관리' },
    ];

    return (
      <div className="absolute inset-0 bg-surface z-[70] flex flex-col min-h-screen overflow-y-auto pb-24">
        <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface-container-highest">
          <div className="flex items-center px-2 py-3">
            <button onClick={() => setSelectedUser(null)} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-lg font-bold tracking-tight text-on-surface ml-2">회원 관리: {selectedUser.name}</h1>
          </div>
        </header>
        <div className="p-6 space-y-6">
          
          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-low shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-outline uppercase tracking-widest mb-4">프로필 수정</h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-on-surface-variant mb-1 block">이름</label>
                <input type="text" value={editProfile.name} onChange={e => setEditProfile({...editProfile, name: e.target.value})} className="w-full bg-surface-container p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-on-surface-variant mb-1 block">생년월일</label>
                  <input type="date" value={editProfile.birthdate} onChange={e => setEditProfile({...editProfile, birthdate: e.target.value})} className="w-full bg-surface-container p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant mb-1 block">성별</label>
                  <select value={editProfile.gender} onChange={e => setEditProfile({...editProfile, gender: e.target.value})} className="w-full bg-surface-container p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary">
                    <option value="">선택 안함</option>
                    <option value="male">남성</option>
                    <option value="female">여성</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-on-surface-variant mb-1 block">소속 사역팀</label>
                  <select value={editProfile.ministry || ''} onChange={e => setEditProfile({...editProfile, ministry: e.target.value})} className="w-full bg-surface-container p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary">
                    <option value="">사역팀 없음</option>
                    <option value="예배팀">예배팀</option>
                    <option value="새가족팀">새가족팀</option>
                    <option value="기획팀">기획팀</option>
                    <option value="선교봉사팀">선교봉사팀</option>
                    <option value="관리팀">관리팀</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
               <div>
                  <label className="text-xs font-bold text-on-surface-variant mb-1 block">소속 숲</label>
                  <select value={editProfile.forest_id} onChange={e => setEditProfile({...editProfile, forest_id: e.target.value})} className="w-full bg-surface-container p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary">
                    <option value="">소속 없음</option>
                    {FOREST_GROUPS.map((f: any) => (
                      <option key={f.forest_id} value={f.forest_id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-on-surface-variant mb-1 block">등급 (Role)</label>
                  <select value={editProfile.role} onChange={e => setEditProfile({...editProfile, role: e.target.value})} className="w-full bg-surface-container p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary">
                    <option value="member">일반 (member)</option>
                    <option value="leader">리더 (leader)</option>
                    <option value="admin">관리자 (admin)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-on-surface-variant mb-1 block">미션 점수</label>
                <input type="number" value={editProfile.score} onChange={e => setEditProfile({...editProfile, score: e.target.value})} className="w-full bg-surface-container p-3 rounded-xl text-sm outline-none focus:ring-1 focus:ring-primary" />
              </div>
              <button onClick={handleSaveProfile} className="w-full mt-2 py-3 bg-primary text-on-primary rounded-xl font-bold shadow-sm active:scale-95 transition-all">
                프로필 정보 저장
              </button>
            </div>
          </div>

          <div className="bg-surface-container-lowest p-6 rounded-2xl border border-surface-container-low shadow-sm">
            <h3 className="text-sm font-bold text-outline uppercase tracking-widest mb-4">메뉴별 권한 설정</h3>
            <div className="space-y-4">
              {menuItems.map(item => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-surface-container-low rounded-xl">
                  <span className="font-bold text-on-surface">{item.label}</span>
                  <button 
                    onClick={() => handlePermissionToggle(selectedUser.uid, item.id, permissions[item.id])}
                    className={`w-12 h-6 rounded-full transition-colors relative ${permissions[item.id] ? 'bg-primary' : 'bg-surface-container-high'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${permissions[item.id] ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <p className="text-xs text-on-surface-variant text-center px-4">
            권한을 부여받은 사용자는 해당 메뉴의 생성, 수정, 삭제 권한을 갖게 됩니다.<br/>관리자(admin)는 이미 모든 권한을 가지고 있습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-surface z-[60] flex flex-col min-h-screen overflow-y-auto pb-24">
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface-container-highest">
        <div className="flex items-center px-2 py-3">
          <button onClick={onBack} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-bold tracking-tight text-on-surface ml-2">사용자 계정 관리</h1>
        </div>
      </header>
      <div className="p-6 space-y-4">
        {users.map((u: any) => (
          <div 
            key={u.uid} 
            onClick={() => handleSelectUser(u)}
            className="bg-surface-container-lowest p-4 rounded-2xl border border-surface-container-low shadow-sm flex items-center justify-between hover:border-primary transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-primary-container text-on-primary-container rounded-full flex items-center justify-center font-bold">
                {u.name.charAt(0)}
              </div>
              <div>
                <p className="font-bold text-on-surface">{u.name}</p>
                <p className="text-xs text-on-surface-variant">{u.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${u.role === 'admin' ? 'bg-error-container text-on-error-container' : u.role === 'leader' ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container text-on-surface-variant'}`}>
                {u.role || 'member'}
              </span>
              <ChevronRight size={20} className="text-outline" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const MyPageView = ({ user, forests, attendance, onBack, onShowToast, onLogout, onNavigateToAdmin }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editPhone, setEditPhone] = useState(user.phone || '');
  const [editBio, setEditBio] = useState(user.bio || '');

  const forestName = forests?.find((f: any) => f.forest_id === user.forest_id)?.name || '소속 없음';
  
  const userActivities = attendance
    .filter((a: any) => a.uid === user.uid)
    .sort((a: any, b: any) => b.date?.seconds - a.date?.seconds)
    .slice(0, 3);

  const handleSaveProfile = async () => {
    try {
      const userRef = doc(firestoreDb, 'users', user.uid);
      await updateDoc(userRef, {
        phone: editPhone,
        bio: editBio
      });
      onShowToast('프로필이 수정되었습니다.');
      setIsEditing(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  return (
    <div className="absolute inset-0 bg-surface z-[60] flex flex-col min-h-screen overflow-y-auto pb-40">
      {/* Top Navigation Bar */}
      <header className="fixed top-0 left-0 right-0 w-full z-50 bg-white/80 dark:bg-stone-900/80 backdrop-blur-xl shadow-sm dark:shadow-none">
        <div className="flex justify-between items-center px-6 py-4 w-full max-w-md mx-auto">
          <button onClick={onBack} className="text-stone-500 hover:opacity-80 transition">
            <Menu size={24} />
          </button>
          <h1 className="font-headline font-bold tracking-tight text-xl text-emerald-700 dark:text-emerald-400">마이페이지</h1>
          <button className="text-stone-500 hover:opacity-80 transition">
            <Bell size={24} />
          </button>
        </div>
      </header>

      <main className="max-w-md mx-auto px-6 pt-24 space-y-8 w-full">
        {/* User Profile Header */}
        <section className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full overflow-hidden shadow-lg border-4 border-white bg-primary-container flex items-center justify-center text-3xl font-bold text-on-primary-container">
              {user.photoURL || user.profile_image ? (
                <img alt="사용자 프로필" className="w-full h-full object-cover" src={user.photoURL || user.profile_image} referrerPolicy="no-referrer" />
              ) : (
                <span>{user.name.charAt(0)}</span>
              )}
            </div>
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`absolute bottom-0 right-0 p-2 rounded-full text-on-primary shadow-md border-2 border-white flex items-center justify-center transition-colors ${isEditing ? 'bg-emerald-600' : 'bg-primary'}`}
            >
              <FileEdit size={14} />
            </button>
          </div>
          <div className="flex-1">
            <p className="text-primary font-headline font-extrabold text-2xl tracking-tight">{user.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-primary-container text-on-primary-container px-3 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">{forestName}</span>
            </div>
            {isEditing ? (
              <input 
                value={editBio}
                onChange={e => setEditBio(e.target.value)}
                placeholder="자기소개를 입력하세요."
                className="w-full mt-2 text-sm bg-surface-container-low border-b border-primary focus:outline-none py-1"
              />
            ) : (
              <p className="text-on-surface-variant text-sm mt-1 font-medium italic">
                {user.bio || "함께 믿음으로 성장합니다."}
              </p>
            )}
          </div>
        </section>

        {/* Edit Mode Fields */}
        {isEditing && (
          <section className="bg-surface-container-lowest p-6 rounded-[2.5rem] shadow-sm space-y-4 border border-primary/10">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-outline uppercase tracking-widest px-1">연락처</label>
              <input 
                type="tel"
                value={editPhone}
                onChange={e => setEditPhone(e.target.value)}
                placeholder="010-0000-0000"
                className="w-full p-4 bg-surface-container-low rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <button 
              onClick={handleSaveProfile}
              className="w-full py-4 bg-primary text-on-primary rounded-2xl font-bold shadow-lg shadow-primary/20 active:scale-[0.98] transition-all"
            >
              저장하기
            </button>
          </section>
        )}

        {/* Stats Widget */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container-lowest p-6 rounded-2xl flex flex-col items-center text-center shadow-[0px_20px_40px_rgba(46,47,45,0.06)]">
            <div className="bg-secondary-container p-3 rounded-full mb-3">
              <Award className="text-on-secondary-container" size={24} />
            </div>
            <p className="text-xs font-bold text-outline uppercase tracking-widest mb-1">나의 배지</p>
            <p className="text-2xl font-headline font-extrabold text-on-surface">{user.badges?.length || 0}</p>
          </div>
          <div className="bg-surface-container-lowest p-6 rounded-2xl flex flex-col items-center text-center shadow-[0px_20px_40px_rgba(46,47,45,0.06)]">
            <div className="bg-primary-container p-3 rounded-full mb-3">
              <CheckCircle2 className="text-on-primary-container" size={24} />
            </div>
            <p className="text-xs font-bold text-outline uppercase tracking-widest mb-1">올해 출석률</p>
            <p className="text-2xl font-headline font-extrabold text-on-surface">{user.attendance_rate || 0}%</p>
          </div>
        </section>

        {/* Activity Timeline */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-headline font-extrabold tracking-tight">나의 활동 기록</h2>
            <span onClick={() => onShowToast('활동 기록 전체보기로 이동합니다.')} className="text-primary text-sm font-bold cursor-pointer">모두 보기</span>
          </div>
          <div className="relative space-y-8 before:content-[''] before:absolute before:left-3 before:top-2 before:bottom-2 before:w-[2px] before:bg-surface-container-high">
            {userActivities.length > 0 ? (
              userActivities.map((activity: any, idx: number) => (
                <div key={activity.id || idx} className="relative pl-10">
                  <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-surface ${
                    activity.type === '주일예배' ? 'bg-primary' : 
                    activity.type === '프로그램신청' ? 'bg-secondary' : 'bg-tertiary'
                  }`}>
                    {activity.type === '주일예배' && <Calendar className="text-white" size={14} />}
                    {activity.type === '프로그램신청' && <Heart className="text-white" size={14} />}
                    {activity.type !== '주일예배' && activity.type !== '프로그램신청' && <BookOpen className="text-white" size={14} />}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-outline uppercase tracking-widest mb-1">
                      {activity.date?.toDate ? activity.date.toDate().toLocaleString() : 
                       (activity.date?.seconds ? new Date(activity.date.seconds * 1000).toLocaleString() : '날짜 정보 없음')}
                    </p>
                    <h4 className="font-bold text-on-surface">{activity.type}</h4>
                    <p className="text-on-surface-variant text-sm mt-1">
                      {activity.program_title || activity.status || '활동 완료'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-on-surface-variant text-sm">
                활동 기록이 없습니다.
              </div>
            )}
          </div>
        </section>

        {/* Settings & Actions */}
        <section className="space-y-3 pt-4">
          {(user.role === 'admin' || user.email === 'jumphorse@nate.com' || user.email === 'seokgwan.ms01@gmail.com' || user.uid === 'sfViap2UZ2alO1kzinMETlcLCxv1') && (
            <button onClick={onNavigateToAdmin} className="w-full flex items-center justify-between p-5 bg-primary/5 border border-primary/20 rounded-2xl hover:bg-primary/10 transition-colors">
              <div className="flex items-center gap-4">
                <Lock className="text-primary" size={24} />
                <span className="font-bold text-primary">관리자 권한 설정</span>
              </div>
              <ChevronRight className="text-primary" size={24} />
            </button>
          )}
          <button onClick={() => onShowToast('계정 설정 페이지로 이동합니다.')} className="w-full flex items-center justify-between p-5 bg-surface-container-low rounded-2xl hover:bg-surface-container-high transition-colors">
            <div className="flex items-center gap-4">
              <Settings className="text-on-surface-variant" size={24} />
              <span className="font-bold text-on-surface">계정 설정</span>
            </div>
            <ChevronRight className="text-outline" size={24} />
          </button>
          <button onClick={onLogout} className="w-full flex items-center justify-between p-5 bg-surface-container-low rounded-2xl hover:bg-error-container/10 transition-colors group">
            <div className="flex items-center gap-4">
              <LogOut className="text-error" size={24} />
              <span className="font-bold text-error">로그아웃</span>
            </div>
          </button>
        </section>
      </main>
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
        <p className="text-on-surface-variant text-sm leading-relaxed">원활한 소통을 위해 처음 한 번만<br/>가입 정보를 입력해 주세요.</p>
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

function MenuButton({ icon, label, hoverBg, onClick }: any) {
  return (
    <div className="flex flex-col items-center gap-2 cursor-pointer group" onClick={onClick}>
      <div className={`w-14 h-14 bg-surface-container-lowest shadow-sm rounded-2xl flex items-center justify-center transition-colors ${hoverBg}`}>
        {icon}
      </div>
      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-tighter whitespace-nowrap">{label}</span>
    </div>
  );
}

function ScheduleItem({ month, day, dDay, time, title, location, dDayClass, active }: any) {
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

const MemberRow = ({ member, forests, onClick }: any) => {
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
        <div className="relative">
          <div className="w-12 h-12 bg-surface-container-high text-on-surface rounded-full flex items-center justify-center font-headline font-bold text-lg shadow-inner border border-surface-container-highest">
            {member.name.charAt(0)}
          </div>
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

const ProgramView = ({ user, programs, onNavigateToDetail, onNavigateToAdd, onShowToast }: { user: any, programs: any[], onNavigateToDetail: (id: string) => void, onNavigateToAdd: () => void, onShowToast: (msg: string) => void }) => {
  const [activeTab, setActiveTab] = useState('전체');
  const categories = ['전체', '사역', '교육/훈련', '봉사', '선교', '동아리'];

  const filteredPrograms = activeTab === '전체' 
    ? programs 
    : programs.filter(p => p.type === activeTab || p.category === activeTab);

  return (
    <div className="flex flex-col h-full relative">
      {/* Category Tabs */}
      <div className="sticky top-0 z-40 bg-surface/80 backdrop-blur-md border-b border-surface-container-highest flex overflow-x-auto px-4 py-3 gap-2 no-scrollbar">
        {categories.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === tab 
                ? 'bg-primary text-on-primary shadow-sm shadow-primary/20 scale-105' 
                : 'font-medium text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Program List */}
        <div className="p-5 space-y-6">
          
          {filteredPrograms.length === 0 && (
            <div className="text-center py-10 text-on-surface-variant text-sm">
              해당 카테고리의 프로그램이 없습니다.
            </div>
          )}

          {filteredPrograms.map(program => (
            <article key={program.id} className="bg-surface-container-lowest rounded-3xl overflow-hidden shadow-sm border border-surface-container-low group cursor-pointer hover:shadow-md transition-all duration-300">
              <div className="relative h-48 overflow-hidden bg-surface-container-low">
                <img src={program.image} alt={program.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
                <div className="absolute top-4 left-4 flex gap-2">
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm ${
                    program.status === '모집중' ? 'bg-primary text-on-primary' : 
                    program.status === '마감임박' ? 'bg-error text-on-error' : 
                    'bg-secondary text-on-secondary'
                  }`}>{program.status}</span>
                  {program.dDay && (
                    <span className="bg-surface/90 backdrop-blur-sm text-on-surface text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm">{program.dDay}</span>
                  )}
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); onShowToast('관심 프로그램으로 등록되었습니다.'); }}
                  className="absolute top-4 right-4 w-8 h-8 bg-surface/90 backdrop-blur-sm rounded-full flex items-center justify-center text-on-surface-variant hover:text-error transition-colors shadow-sm"
                >
                  <Heart size={18} />
                </button>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-tertiary">{program.type || program.category}</span>
                  <span className="w-1 h-1 rounded-full bg-surface-container-highest"></span>
                  <span className="text-xs font-medium text-on-surface-variant">{program.host}</span>
                </div>
                <h3 className="text-lg font-bold text-on-surface mb-2 tracking-tight group-hover:text-primary transition-colors">{program.title}</h3>
                
                <div className="space-y-1.5 mb-5">
                  <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <Calendar size={16} className="text-outline" />
                    <span>{program.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <MapPin size={16} className="text-outline" />
                    <span>{program.location}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button onClick={() => onNavigateToDetail(program.id)} className="flex-1 bg-surface-container-low text-on-surface py-2.5 rounded-xl text-sm font-bold hover:bg-surface-container transition-colors">상세보기</button>
                  <button onClick={(e) => { e.stopPropagation(); onShowToast('신청 페이지로 이동합니다.'); }} className="flex-1 bg-primary text-on-primary py-2.5 rounded-xl text-sm font-bold hover:bg-primary-dim transition-colors shadow-sm shadow-primary/20">신청하기</button>
                </div>
              </div>
            </article>
          ))}

        </div>

        {/* Recommendation Section */}
        <div className="mt-4 mb-8 px-5">
          <div className="bg-secondary-container/50 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-secondary/20 rounded-full blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="text-secondary" size={20} />
                <span className="text-xs font-bold text-secondary uppercase tracking-wider">Pick for you</span>
              </div>
              <h3 className="text-lg font-bold text-on-surface mb-1">나에게 맞는 프로그램을 찾아보세요!</h3>
              <p className="text-sm text-on-surface-variant mb-4">관심사를 설정하면 맞춤 프로그램을 추천해 드립니다.</p>
              
              <div className="flex flex-wrap gap-2">
                <span className="bg-surface text-on-surface text-xs font-medium px-3 py-1.5 rounded-lg border border-surface-container-highest shadow-sm">#찬양</span>
                <span className="bg-surface text-on-surface text-xs font-medium px-3 py-1.5 rounded-lg border border-surface-container-highest shadow-sm">#미디어</span>
                <span className="bg-surface text-on-surface text-xs font-medium px-3 py-1.5 rounded-lg border border-surface-container-highest shadow-sm">#어린이</span>
                <button className="bg-surface-container-high text-on-surface text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-surface-container-highest transition-colors">+</button>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Floating Action Button for Admins */}
      {user?.role === 'admin' && (
        <button 
          onClick={onNavigateToAdd}
          className="fixed bottom-24 right-6 w-14 h-14 bg-primary text-on-primary rounded-full shadow-lg shadow-primary/30 flex items-center justify-center active:scale-90 transition-transform z-50"
        >
          <Plus size={28} />
        </button>
      )}
    </div>
  );
};

const ProgramAddView = ({ onBack, onShowToast }: { onBack: () => void, onShowToast: (msg: string) => void }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: '사역',
    host: '',
    date: '',
    location: '',
    image: 'https://picsum.photos/seed/program/800/400',
    status: '모집중',
    dDay: ''
  });

  const categories = ['사역', '교육/훈련', '봉사', '선교', '동아리'];
  const statuses = ['모집중', '마감임박', '모집완료'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.host || !formData.date) {
      onShowToast('필수 정보를 모두 입력해주세요.');
      return;
    }

    try {
      await addDoc(collection(firestoreDb, 'programs'), {
        ...formData,
        createdAt: Timestamp.now()
      });
      onShowToast('프로그램이 성공적으로 추가되었습니다.');
      onBack();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'programs');
    }
  };

  return (
    <div className="absolute inset-0 bg-surface z-[60] flex flex-col min-h-screen overflow-y-auto pb-24">
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface-container-highest">
        <div className="flex items-center px-2 py-3">
          <button onClick={onBack} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-bold tracking-tight text-on-surface ml-2">프로그램 추가</h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        <div className="space-y-4">
          <div className="bg-surface-container-lowest p-5 rounded-3xl border border-surface-container-low shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">카테고리</label>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormData({...formData, type: cat})}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      formData.type === cat 
                        ? 'bg-primary text-on-primary shadow-sm' 
                        : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">프로그램 명</label>
              <input 
                type="text" 
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                placeholder="예: 2026 여름 단기선교 (태국)"
                className="w-full bg-surface-container-high text-on-surface p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">주관 / 호스트</label>
              <input 
                type="text" 
                value={formData.host}
                onChange={(e) => setFormData({...formData, host: e.target.value})}
                placeholder="예: 청년부 주관"
                className="w-full bg-surface-container-high text-on-surface p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              />
            </div>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-3xl border border-surface-container-low shadow-sm space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">일정</label>
                <input 
                  type="text" 
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  placeholder="예: 7.25(목) - 8.1(목)"
                  className="w-full bg-surface-container-high text-on-surface p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">D-Day</label>
                <input 
                  type="text" 
                  value={formData.dDay}
                  onChange={(e) => setFormData({...formData, dDay: e.target.value})}
                  placeholder="예: D-15"
                  className="w-full bg-surface-container-high text-on-surface p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">장소</label>
              <input 
                type="text" 
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="예: 태국 치앙마이 일대"
                className="w-full bg-surface-container-high text-on-surface p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              />
            </div>
          </div>

          <div className="bg-surface-container-lowest p-5 rounded-3xl border border-surface-container-low shadow-sm space-y-4">
            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">모집 상태</label>
              <div className="flex gap-2">
                {statuses.map(status => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setFormData({...formData, status: status})}
                    className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${
                      formData.status === status 
                        ? 'bg-primary text-on-primary shadow-sm' 
                        : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">상세 설명</label>
              <textarea 
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="프로그램에 대한 상세 내용을 입력하세요."
                className="w-full bg-surface-container-high text-on-surface p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium min-h-[120px] resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-outline uppercase tracking-wider mb-2">이미지 URL</label>
              <input 
                type="text" 
                value={formData.image}
                onChange={(e) => setFormData({...formData, image: e.target.value})}
                placeholder="이미지 URL을 입력하세요."
                className="w-full bg-surface-container-high text-on-surface p-4 rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
              />
            </div>
          </div>
        </div>

        <button 
          type="submit"
          className="w-full bg-primary text-on-primary py-4 rounded-2xl font-bold shadow-lg shadow-primary/30 active:scale-95 transition-all"
        >
          프로그램 등록하기
        </button>
      </form>
    </div>
  );
};

const ProgramDetailView = ({ user, programId, programs, onBack, onShowToast }: { user: any, programId: string | null, programs: any[], onBack: () => void, onShowToast: (msg: string) => void }) => {
  const program = programs.find((p: any) => p.id === programId);

  if (!program) return null;

  const handleApply = async () => {
    try {
      const attendanceRef = collection(firestoreDb, 'attendance');
      await addDoc(attendanceRef, {
        uid: user.uid,
        user_name: user.name,
        date: Timestamp.now(),
        type: '프로그램신청',
        program_id: programId,
        program_title: program.title,
        status: '신청완료'
      });
      onShowToast('신청이 완료되었습니다.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'attendance');
    }
  };

  return (
    <div className="flex flex-col bg-surface min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface-container-highest">
        <div className="flex items-center px-2 py-3">
          <button onClick={onBack} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-lg font-bold tracking-tight text-on-surface ml-2">프로그램 상세</h1>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1">
        {/* Hero Image */}
        <div className="relative h-64 w-full bg-surface-container-low">
          <img src={program.image} alt={program.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          <div className="absolute top-4 left-4 flex gap-2">
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider shadow-sm ${
              program.status === '모집중' ? 'bg-primary text-on-primary' : 
              program.status === '마감임박' ? 'bg-error text-on-error' : 
              'bg-secondary text-on-secondary'
            }`}>{program.status}</span>
            {program.dDay && (
              <span className="bg-surface/90 backdrop-blur-sm text-on-surface text-xs font-bold px-3 py-1.5 rounded-full shadow-sm">{program.dDay}</span>
            )}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 -mt-6 relative bg-surface rounded-t-3xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-bold text-tertiary">{program.type}</span>
            <span className="w-1 h-1 rounded-full bg-surface-container-highest"></span>
            <span className="text-sm font-medium text-on-surface-variant">{program.host}</span>
          </div>
          
          <h2 className="text-2xl font-bold text-on-surface mb-6 tracking-tight leading-tight">{program.title}</h2>
          
          <div className="space-y-4 mb-8 bg-surface-container-lowest p-5 rounded-2xl border border-surface-container-low">
            <div className="flex items-start gap-3">
              <Calendar size={20} className="text-primary mt-0.5" />
              <div>
                <p className="text-sm font-bold text-on-surface">일정</p>
                <p className="text-sm text-on-surface-variant mt-0.5">{program.date}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={20} className="text-primary mt-0.5" />
              <div>
                <p className="text-sm font-bold text-on-surface">장소</p>
                <p className="text-sm text-on-surface-variant mt-0.5">{program.location}</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-bold text-on-surface mb-3">프로그램 소개</h3>
              <p className="text-on-surface-variant text-sm leading-relaxed">
                {program.desc}
              </p>
            </section>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-surface/90 backdrop-blur-md border-t border-surface-container-highest p-4 flex gap-3 z-50">
        <button onClick={() => onShowToast('관심 프로그램으로 등록되었습니다.')} className="w-14 h-14 rounded-2xl bg-surface-container-low flex items-center justify-center text-on-surface-variant hover:text-error transition-colors shadow-sm">
          <Heart size={24} />
        </button>
        <button onClick={handleApply} className="flex-1 bg-primary text-on-primary rounded-2xl text-base font-bold hover:bg-primary-dim transition-colors shadow-md shadow-primary/20">
          신청하기
        </button>
      </div>
    </div>
  );
};

// ==========================================
// 5. Worship View (온라인 주보)
// ==========================================
const WorshipView = ({ user, worships, onNavigateToDetail, onNavigateToAdd, onShowToast }: { user: any, worships: any[], onNavigateToDetail: (id: string) => void, onNavigateToAdd: () => void, onShowToast: (msg: string) => void }) => {
  const sortedWorships = [...worships].sort((a, b) => {
    const dateA = a.date?.seconds ? a.date.seconds : new Date(a.date).getTime() / 1000;
    const dateB = b.date?.seconds ? b.date.seconds : new Date(b.date).getTime() / 1000;
    return dateB - dateA;
  });

  const featuredWorship = sortedWorships[0];
  const previousWorships = sortedWorships.slice(1);

  const formatDate = (date: any) => {
    if (!date) return '';
    const d = date.seconds ? new Date(date.seconds * 1000) : new Date(date);
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  };

  return (
    <div className="flex flex-col h-full bg-surface-container-lowest pb-32">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-surface/80 backdrop-blur-md sticky top-0 z-40">
        <h1 className="text-2xl font-bold text-on-surface tracking-tight">예배</h1>
        <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
          <MoreVertical size={24} />
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-5 space-y-6 pt-2">
        {/* Featured Worship Card */}
        {featuredWorship && (
          <article 
            onClick={() => onNavigateToDetail(featuredWorship.id)}
            className="relative h-[420px] rounded-[32px] overflow-hidden shadow-xl shadow-primary/10 group cursor-pointer"
          >
            <img 
              src={featuredWorship.image || "https://picsum.photos/seed/worship/800/1200"} 
              alt={featuredWorship.title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
            
            <div className="absolute top-6 right-6">
              <button className="text-white/80 hover:text-white transition-colors">
                <MoreVertical size={24} />
              </button>
            </div>

            <div className="absolute bottom-10 left-8 right-8 space-y-3">
              <span className="inline-block bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/20">
                {formatDate(featuredWorship.date)} 예배
              </span>
              <h2 className="text-3xl font-bold text-white leading-tight">
                {featuredWorship.title}
              </h2>
              <div className="space-y-1">
                <p className="text-white/90 font-bold text-sm">{featuredWorship.scripture}</p>
                <p className="text-white/70 text-xs line-clamp-2 leading-relaxed">
                  {featuredWorship.scripture_content}
                </p>
              </div>
            </div>
          </article>
        )}

        {/* Search Bar */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Sparkles size={20} className="text-primary/60 group-focus-within:text-primary transition-colors" />
          </div>
          <input 
            type="text" 
            placeholder="제목, 부제목, 본문 검색..."
            className="w-full bg-white border border-surface-container-highest py-4 pl-14 pr-14 rounded-full text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
          />
          <div className="absolute inset-y-0 right-5 flex items-center">
            <button className="p-1 text-on-surface-variant hover:text-primary transition-colors">
              <SlidersHorizontal size={20} />
            </button>
          </div>
        </div>

        {/* Previous Worship List */}
        <div className="space-y-4 pb-10">
          {previousWorships.map(worship => (
            <div 
              key={worship.id}
              onClick={() => onNavigateToDetail(worship.id)}
              className="bg-white rounded-3xl p-4 flex items-center gap-4 border border-surface-container-highest shadow-sm hover:shadow-md transition-all cursor-pointer group"
            >
              <div className="w-16 h-16 rounded-2xl overflow-hidden shrink-0 bg-surface-container-low">
                <img 
                  src={worship.image || "https://picsum.photos/seed/church/200/200"} 
                  alt={worship.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-on-surface-variant mb-0.5">{formatDate(worship.date)}</p>
                <h3 className="text-base font-bold text-on-surface truncate">{worship.title}</h3>
                <div className="flex items-center gap-3 mt-1 text-xs text-on-surface-variant font-medium">
                  <div className="flex items-center gap-1">
                    <User size={12} />
                    <span>{worship.view_count || 0}</span>
                  </div>
                  <span>•</span>
                  <span>{worship.scripture}</span>
                </div>
              </div>
              <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
                <MoreVertical size={20} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Action Button for Admins */}
      {user?.role === 'admin' && (
        <button 
          onClick={onNavigateToAdd}
          className="fixed bottom-32 left-1/2 -translate-x-1/2 bg-white text-primary border border-primary/20 px-6 py-4 rounded-full shadow-xl shadow-primary/10 flex items-center gap-3 font-bold active:scale-95 transition-all z-50"
        >
          <FileText size={24} />
          <span>예배추가</span>
        </button>
      )}
    </div>
  );
};

const WorshipAddView = ({ onBack, onShowToast }: { onBack: () => void, onShowToast: (msg: string) => void }) => {
  const [formData, setFormData] = useState<any>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    image: 'https://picsum.photos/seed/worship/800/1200',
    youtube_url: '',
    scripture: '',
    scripture_content: '',
    participants: [
      { role: '사회', name: '' },
      { role: '기도', name: '' },
      { role: '성경봉독', name: '' },
      { role: '봉헌기도', name: '' }
    ],
    praise: [],
    announcements: [],
    status: 'published'
  });
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `worship_images/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
      const storageRef = ref(storage, fileName);
      
      const uploadTask = await uploadBytesResumable(storageRef, file);
      const downloadURL = await getDownloadURL(uploadTask.ref);
      
      setFormData({...formData, image: downloadURL});
      onShowToast('이미지가 성공적으로 업로드되었습니다.');
    } catch (err) {
      console.error('Upload Error:', err);
      onShowToast('이미지 업로드에 실패했습니다. (Storage 규칙 확인 요망)');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddParticipant = () => {
    setFormData({
      ...formData,
      participants: [...formData.participants, { role: '', name: '' }]
    });
  };

  const handleRemoveParticipant = (index: number) => {
    const newParticipants = [...formData.participants];
    newParticipants.splice(index, 1);
    setFormData({ ...formData, participants: newParticipants });
  };

  const handleAddPraise = () => {
    setFormData({
      ...formData,
      praise: [...formData.praise, { title: '', link: '' }]
    });
  };

  const handleRemovePraise = (index: number) => {
    const newPraise = [...formData.praise];
    newPraise.splice(index, 1);
    setFormData({ ...formData, praise: newPraise });
  };

  const handleAddAnnouncement = () => {
    setFormData({
      ...formData,
      announcements: [...formData.announcements, { title: '', content: '' }]
    });
  };

  const handleRemoveAnnouncement = (index: number) => {
    const newAnnouncements = [...formData.announcements];
    newAnnouncements.splice(index, 1);
    setFormData({ ...formData, announcements: newAnnouncements });
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.date) {
      onShowToast('제목과 날짜를 입력해주세요.');
      return;
    }

    try {
      await addDoc(collection(firestoreDb, 'worships'), {
        ...formData,
        date: Timestamp.fromDate(new Date(formData.date)),
        view_count: 0,
        createdAt: Timestamp.now()
      });
      onShowToast('예배 정보가 등록되었습니다.');
      onBack();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'worships');
    }
  };

  return (
    <div className="absolute inset-0 bg-surface z-[60] flex flex-col min-h-screen overflow-y-auto pb-32">
      {/* Background Hero */}
      <div className="relative h-80 shrink-0">
        <img 
          src={formData.image} 
          className="w-full h-full object-cover" 
          alt="Worship background" 
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-black/40"></div>
        
        <div className="absolute top-16 left-4 right-4 z-20 flex flex-col gap-2">
          <input 
            type="text" 
            value={formData.image}
            onChange={(e) => setFormData({...formData, image: e.target.value})}
            className="w-full bg-black/40 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs border border-white/20 outline-none placeholder:text-white/50"
            placeholder="대표 배경 이미지 URL 입력 (예: https://...)"
          />
          <div className="flex justify-end relative">
            <input 
              type="file" 
              accept="image/*" 
              id="worship-image-upload" 
              className="hidden" 
              onChange={handleImageUpload}
              disabled={isUploading}
            />
            <label 
              htmlFor="worship-image-upload" 
              className={`bg-white/20 backdrop-blur-md text-white border border-white/30 px-3 py-2 rounded-xl text-xs font-bold shadow-sm cursor-pointer hover:bg-white/30 transition-colors flex items-center gap-1.5 ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
            >
              <Camera size={14} />
              {isUploading ? '업로드 중...' : '기기에서 사진 첨부'}
            </label>
          </div>
        </div>

        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <button onClick={onBack} className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
            <X size={24} />
          </button>
          <div className="flex gap-2">
            <button className="w-10 h-10 bg-black/20 backdrop-blur-md rounded-full flex items-center justify-center text-white">
              <Bookmark size={20} />
            </button>
            <button onClick={handleSubmit} className="px-5 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center gap-2 text-white font-bold text-sm border border-white/20">
              <Send size={18} />
              <span>배포</span>
            </button>
          </div>
        </div>

        <div className="absolute bottom-8 left-8 right-8 space-y-4">
          <input 
            type="text" 
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            placeholder="설교 제목"
            className="w-full bg-transparent text-white text-4xl font-bold placeholder:text-white/50 outline-none"
          />
          <div className="relative inline-block">
            <input 
              type="date" 
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-xl border border-white/20 outline-none text-sm font-bold"
            />
            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 pointer-events-none">
              <Camera size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="px-6 -mt-6 relative z-10 space-y-8">
        {/* Section Header */}
        <div className="flex items-center justify-between bg-white/80 backdrop-blur-md p-4 rounded-2xl border border-surface-container-highest shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-on-surface">섹션 목록</span>
            <span className="bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5 rounded-full">4개의 섹션</span>
          </div>
          <button className="text-xs font-bold text-primary bg-primary/5 px-3 py-1.5 rounded-lg">순서 편집</button>
        </div>

        {/* YouTube Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600 border border-red-100">
                <Play size={20} />
              </div>
              <h3 className="font-bold text-on-surface">예배 영상 (YouTube)</h3>
            </div>
            <a 
              href="https://m.youtube.com/results?search_query=찬양+예배" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1.5 rounded-lg flex items-center gap-1 active:scale-95 transition-transform"
            >
              <Search size={14} />
              유튜브 검색
            </a>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-surface-container-highest shadow-sm">
            <input 
              type="text" 
              value={formData.youtube_url || ''}
              onChange={(e) => setFormData({...formData, youtube_url: e.target.value})}
              placeholder="YouTube 동영상 링크를 붙여넣으세요"
              className="w-full text-sm font-medium text-on-surface placeholder:text-outline outline-none"
            />
          </div>
        </div>

        {/* Scripture Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600 border border-green-100">
                <BookOpen size={20} />
              </div>
              <h3 className="font-bold text-on-surface">본문 말씀</h3>
            </div>
            <button className="text-on-surface-variant"><MoreHorizontal size={20} /></button>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-surface-container-highest shadow-sm space-y-4">
            <input 
              type="text" 
              value={formData.scripture}
              onChange={(e) => setFormData({...formData, scripture: e.target.value})}
              placeholder="예: 요한복음 15:1-8"
              className="w-full text-2xl font-bold text-primary placeholder:text-primary/20 outline-none"
            />
            <textarea 
              value={formData.scripture_content}
              onChange={(e) => setFormData({...formData, scripture_content: e.target.value})}
              placeholder="1. 나는 참 포도나무요..."
              className="w-full min-h-[100px] text-on-surface-variant leading-relaxed outline-none resize-none"
            />
          </div>
        </div>

        {/* Participants Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
                <Users size={20} />
              </div>
              <h3 className="font-bold text-on-surface">예배 임사자</h3>
            </div>
            <button className="text-on-surface-variant"><MoreHorizontal size={20} /></button>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-surface-container-highest shadow-sm space-y-3">
            {formData.participants.map((p: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3 group">
                <div className="p-2 text-on-surface-variant/30"><Menu size={16} /></div>
                <input 
                  type="text" 
                  value={p.role}
                  onChange={(e) => {
                    const newP = [...formData.participants];
                    newP[idx].role = e.target.value;
                    setFormData({...formData, participants: newP});
                  }}
                  className="w-20 bg-surface-container-low px-3 py-2 rounded-xl text-sm font-bold outline-none"
                  placeholder="역할"
                />
                <input 
                  type="text" 
                  value={p.name}
                  onChange={(e) => {
                    const newP = [...formData.participants];
                    newP[idx].name = e.target.value;
                    setFormData({...formData, participants: newP});
                  }}
                  className="flex-1 bg-white border border-surface-container-highest px-3 py-2 rounded-xl text-sm outline-none"
                  placeholder="이름"
                />
                <button onClick={() => handleRemoveParticipant(idx)} className="p-2 text-error/40 hover:text-error transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            <button 
              onClick={handleAddParticipant}
              className="w-full py-3 flex items-center justify-center gap-2 text-primary font-bold text-sm border-t border-surface-container-low mt-2"
            >
              <Plus size={18} />
              <span>추가</span>
            </button>
          </div>
        </div>

        {/* Praise Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600 border border-orange-100">
                <Music size={20} />
              </div>
              <h3 className="font-bold text-on-surface">경배와 찬양</h3>
            </div>
            <button className="text-on-surface-variant"><MoreHorizontal size={20} /></button>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-surface-container-highest shadow-sm space-y-3">
            {formData.praise.map((p: any, idx: number) => (
              <div key={idx} className="flex items-center gap-4 p-4 bg-surface-container-lowest rounded-2xl border border-surface-container-low relative group">
                <div className="w-12 h-12 rounded-xl bg-error/10 flex items-center justify-center text-error">
                  <Play size={24} fill="currentColor" />
                </div>
                <div className="flex-1 space-y-1">
                  <input 
                    type="text" 
                    value={p.title}
                    onChange={(e) => {
                      const newP = [...formData.praise];
                      newP[idx].title = e.target.value;
                      setFormData({...formData, praise: newP});
                    }}
                    placeholder="곡 제목"
                    className="w-full font-bold text-on-surface outline-none bg-transparent"
                  />
                  <input 
                    type="text" 
                    value={p.link}
                    onChange={(e) => {
                      const newP = [...formData.praise];
                      newP[idx].link = e.target.value;
                      setFormData({...formData, praise: newP});
                    }}
                    placeholder="YouTube 링크"
                    className="w-full text-xs text-on-surface-variant outline-none bg-transparent"
                  />
                </div>
                <button onClick={() => handleRemovePraise(idx)} className="p-2 text-error/40 hover:text-error transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            <button 
              onClick={handleAddPraise}
              className="w-full py-3 flex items-center justify-center gap-2 text-primary font-bold text-sm border-t border-surface-container-low mt-2"
            >
              <Plus size={18} />
              <span>추가</span>
            </button>
          </div>
        </div>

        {/* Announcements Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
                <Megaphone size={20} />
              </div>
              <h3 className="font-bold text-on-surface">광고</h3>
            </div>
            <button className="text-on-surface-variant"><MoreHorizontal size={20} /></button>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-surface-container-highest shadow-sm space-y-3">
            {formData.announcements.map((a: any, idx: number) => (
              <div key={idx} className="flex items-center gap-3 group border-b border-surface-container-low last:border-0 pb-3 last:pb-0">
                <div className="p-2 text-on-surface-variant/30"><Menu size={16} /></div>
                <div className="flex-1 space-y-1">
                  <input 
                    type="text" 
                    value={a.title}
                    onChange={(e) => {
                      const newA = [...formData.announcements];
                      newA[idx].title = e.target.value;
                      setFormData({...formData, announcements: newA});
                    }}
                    placeholder="광고 제목"
                    className="w-full font-bold text-on-surface outline-none"
                  />
                  <input 
                    type="text" 
                    value={a.content}
                    onChange={(e) => {
                      const newA = [...formData.announcements];
                      newA[idx].content = e.target.value;
                      setFormData({...formData, announcements: newA});
                    }}
                    placeholder="광고 내용"
                    className="w-full text-sm text-on-surface-variant outline-none"
                  />
                </div>
                <button onClick={() => handleRemoveAnnouncement(idx)} className="p-2 text-error/40 hover:text-error transition-colors">
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
            <button 
              onClick={handleAddAnnouncement}
              className="w-full py-3 flex items-center justify-center gap-2 text-primary font-bold text-sm border-t border-surface-container-low mt-2"
            >
              <Plus size={18} />
              <span>추가</span>
            </button>
          </div>
        </div>

        {/* Add Section Button */}
        <button className="flex items-center gap-4 px-2 py-4 text-on-surface-variant/50 hover:text-primary transition-colors group">
          <div className="w-10 h-10 rounded-full border-2 border-dashed border-current flex items-center justify-center group-hover:border-primary">
            <Plus size={24} />
          </div>
          <span className="font-bold text-lg">섹션 추가</span>
        </button>
      </div>
    </div>
  );
};

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

const CalendarView = ({ schedules, onShowToast }: any) => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 2, 1)); // March 2026
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 2, 26)); // March 26, 2026

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));

  const isSameDate = (d1: Date, d2: Date) => {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  const getSchedulesForDate = (date: Date) => {
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return schedules.filter((s: any) => s.fullDate === dateStr);
  };

  const selectedSchedules = getSchedulesForDate(selectedDate);

  return (
    <div className="pb-32 bg-surface min-h-screen">
      <div className="p-5 space-y-6">
        {/* Calendar Card */}
        <div className="bg-surface-container-lowest rounded-3xl p-5 shadow-sm border border-surface-container-low">
          {/* Month Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={prevMonth} className="p-2 hover:bg-surface-container-low rounded-full transition-colors">
              <ChevronLeft size={20} className="text-on-surface-variant" />
            </button>
            <h2 className="text-lg font-bold text-on-surface font-headline">
              {year}년 {month + 1}월
            </h2>
            <button onClick={nextMonth} className="p-2 hover:bg-surface-container-low rounded-full transition-colors">
              <ChevronRight size={20} className="text-on-surface-variant" />
            </button>
          </div>

          {/* Days of Week */}
          <div className="grid grid-cols-7 gap-1 mb-2 text-center">
            {['일', '월', '화', '수', '목', '금', '토'].map((day, i) => (
              <div key={day} className={`text-xs font-bold ${i === 0 ? 'text-error' : 'text-on-surface-variant'}`}>
                {day}
              </div>
            ))}
          </div>

          {/* Dates Grid */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((date, i) => {
              if (!date) return <div key={`empty-${i}`} className="h-10" />;
              
              const isSelected = isSameDate(date, selectedDate);
              const isToday = isSameDate(date, new Date(2026, 2, 26)); // Mock today
              const hasEvents = getSchedulesForDate(date).length > 0;
              const isSunday = date.getDay() === 0;

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(date)}
                  className={`relative h-10 flex items-center justify-center rounded-full text-sm font-medium transition-colors
                    ${isSelected ? 'bg-primary text-on-primary font-bold shadow-md' : 'hover:bg-surface-container-low'}
                    ${!isSelected && isToday ? 'border border-primary text-primary font-bold' : ''}
                    ${!isSelected && !isToday && isSunday ? 'text-error' : ''}
                    ${!isSelected && !isToday && !isSunday ? 'text-on-surface' : ''}
                  `}
                >
                  {date.getDate()}
                  {hasEvents && !isSelected && (
                    <div className="absolute bottom-1 w-1 h-1 rounded-full bg-secondary"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Date Events */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-bold text-on-surface font-headline">
              {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 일정
            </h3>
          </div>

          {selectedSchedules.length === 0 ? (
            <div className="bg-surface-container-lowest rounded-2xl p-8 text-center border border-surface-container-low border-dashed">
              <p className="text-on-surface-variant text-sm font-medium">예정된 일정이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedSchedules.map((schedule: any) => (
                <div key={schedule.id} onClick={() => onShowToast('일정 상세 페이지로 이동합니다.')} className="bg-surface-container-lowest p-5 rounded-2xl flex items-start gap-4 shadow-sm border border-surface-container-low cursor-pointer hover:bg-surface-container-low transition-colors">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                    schedule.type === 'worship' ? 'bg-primary-container text-on-primary-container' :
                    schedule.type === 'education' ? 'bg-secondary-container text-on-secondary-container' :
                    'bg-tertiary-container text-on-tertiary-container'
                  }`}>
                    {schedule.type === 'worship' && <BookOpen size={20} />}
                    {schedule.type === 'education' && <GraduationCap size={20} />}
                    {schedule.type === 'volunteer' && <HeartHandshake size={20} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-primary-dim">{schedule.time}</span>
                      <span className="bg-surface-container-high text-on-surface-variant text-[10px] font-bold px-2 py-0.5 rounded-full">{schedule.d_day}</span>
                    </div>
                    <h4 className="font-bold text-on-surface mb-1">{schedule.title}</h4>
                    <p className="text-xs text-on-surface-variant flex items-center gap-1">
                      <MapPin size={12} /> {schedule.location}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

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

const SurveyView = ({ user, surveys, onBack, onShowToast, onVote }: any) => {
  const [selectedSurvey, setSelectedSurvey] = useState<any>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newSurvey, setNewSurvey] = useState({
    title: '',
    description: '',
    options: ['', ''],
    deadline: ''
  });

  const handleAddSurvey = async () => {
    if (!newSurvey.title || newSurvey.options.some(opt => !opt) || !newSurvey.deadline) {
      onShowToast('모든 필드를 입력해주세요.');
      return;
    }

    try {
      await addDoc(collection(firestoreDb, 'surveys'), {
        ...newSurvey,
        status: 'active',
        responses: {},
        deadline: Timestamp.fromDate(new Date(newSurvey.deadline)),
        createdAt: Timestamp.now()
      });
      onShowToast('설문조사가 추가되었습니다.');
      setIsAdding(false);
      setNewSurvey({ title: '', description: '', options: ['', ''], deadline: '' });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'surveys');
    }
  };

  if (isAdding) {
    return (
      <div className="absolute inset-0 bg-surface z-[70] flex flex-col min-h-screen overflow-y-auto pb-24">
        <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface-container-highest">
          <div className="flex items-center justify-between px-2 py-3">
            <div className="flex items-center">
              <button onClick={() => setIsAdding(false)} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
                <ChevronLeft size={24} />
              </button>
              <h1 className="text-lg font-bold tracking-tight text-on-surface ml-2">설문 추가</h1>
            </div>
            <button 
              onClick={handleAddSurvey}
              className="px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-bold mr-2"
            >
              저장
            </button>
          </div>
        </header>
        <div className="p-6 space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-on-surface mb-1">제목</label>
              <input 
                type="text" 
                value={newSurvey.title}
                onChange={(e) => setNewSurvey({...newSurvey, title: e.target.value})}
                className="w-full bg-surface-container-low border border-surface-container-high rounded-xl px-4 py-3 text-on-surface outline-none focus:border-primary"
                placeholder="설문 제목을 입력하세요"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-on-surface mb-1">설명</label>
              <textarea 
                value={newSurvey.description}
                onChange={(e) => setNewSurvey({...newSurvey, description: e.target.value})}
                className="w-full bg-surface-container-low border border-surface-container-high rounded-xl px-4 py-3 text-on-surface outline-none focus:border-primary min-h-[100px]"
                placeholder="설문에 대한 설명을 입력하세요"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-on-surface mb-2">선택지</label>
              <div className="space-y-2">
                {newSurvey.options.map((opt, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input 
                      type="text" 
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...newSurvey.options];
                        newOpts[idx] = e.target.value;
                        setNewSurvey({...newSurvey, options: newOpts});
                      }}
                      className="flex-1 bg-surface-container-low border border-surface-container-high rounded-xl px-4 py-3 text-on-surface outline-none focus:border-primary"
                      placeholder={`옵션 ${idx + 1}`}
                    />
                    {newSurvey.options.length > 2 && (
                      <button 
                        onClick={() => {
                          const newOpts = newSurvey.options.filter((_, i) => i !== idx);
                          setNewSurvey({...newSurvey, options: newOpts});
                        }}
                        className="p-3 text-error"
                      >
                        <X size={20} />
                      </button>
                    )}
                  </div>
                ))}
                <button 
                  onClick={() => setNewSurvey({...newSurvey, options: [...newSurvey.options, '']})}
                  className="w-full py-3 border border-dashed border-outline rounded-xl text-sm text-on-surface-variant flex items-center justify-center gap-2"
                >
                  <Plus size={16} />
                  <span>선택지 추가</span>
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-on-surface mb-1">마감 기한</label>
              <input 
                type="datetime-local" 
                value={newSurvey.deadline}
                onChange={(e) => setNewSurvey({...newSurvey, deadline: e.target.value})}
                className="w-full bg-surface-container-low border border-surface-container-high rounded-xl px-4 py-3 text-on-surface outline-none focus:border-primary"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedSurvey) {
    const userResponse = selectedSurvey.responses?.[user?.uid];
    return (
      <div className="absolute inset-0 bg-surface z-[70] flex flex-col min-h-screen overflow-y-auto pb-24">
        <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface-container-highest">
          <div className="flex items-center px-2 py-3">
            <button onClick={() => setSelectedSurvey(null)} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-lg font-bold tracking-tight text-on-surface ml-2">설문 참여</h1>
          </div>
        </header>
        <div className="p-6 space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-on-surface leading-tight">{selectedSurvey.title}</h2>
            <p className="text-on-surface-variant">{selectedSurvey.description}</p>
          </div>

          <div className="space-y-3">
            {selectedSurvey.options.map((option: string, index: number) => {
              const isSelected = userResponse === index;
              const totalVotes = Object.keys(selectedSurvey.responses || {}).length;
              const optionVotes = Object.values(selectedSurvey.responses || {}).filter(v => v === index).length;
              const percentage = totalVotes > 0 ? Math.round((optionVotes / totalVotes) * 100) : 0;

              return (
                <button
                  key={index}
                  onClick={async () => {
                    const success = await onVote(selectedSurvey.id, index);
                    if (success) setSelectedSurvey(null);
                  }}
                  disabled={userResponse !== undefined}
                  className={`w-full p-4 rounded-2xl border transition-all text-left relative overflow-hidden ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : 'border-surface-container-high bg-surface-container-lowest hover:border-primary/50'
                  }`}
                >
                  {userResponse !== undefined && (
                    <div 
                      className="absolute inset-y-0 left-0 bg-primary/10 transition-all duration-1000" 
                      style={{ width: `${percentage}%` }}
                    />
                  )}
                  <div className="relative z-10 flex justify-between items-center">
                    <span className={`font-bold ${isSelected ? 'text-primary' : 'text-on-surface'}`}>{option}</span>
                    {userResponse !== undefined && (
                      <span className="text-xs font-bold text-primary">{percentage}%</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {userResponse !== undefined && (
            <div className="bg-surface-container-low p-4 rounded-2xl text-center">
              <p className="text-sm text-on-surface-variant">이미 설문에 참여하셨습니다.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 bg-surface z-[60] flex flex-col min-h-screen overflow-y-auto pb-24">
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface-container-highest">
        <div className="flex items-center justify-between px-2 py-3">
          <div className="flex items-center">
            <button onClick={onBack} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-lg font-bold tracking-tight text-on-surface ml-2">설문조사</h1>
          </div>
          {(user?.role === 'admin' || user?.email === 'jumphorse@nate.com' || user?.email === 'seokgwan.ms01@gmail.com' || user?.uid === 'sfViap2UZ2alO1kzinMETlcLCxv1') && (
            <button 
              onClick={() => setIsAdding(true)}
              className="p-2 text-primary hover:bg-primary/10 rounded-full transition-colors mr-1"
            >
              <Plus size={24} />
            </button>
          )}
        </div>
      </header>
      <div className="p-6 space-y-6">
        <div className="bg-tertiary-container/30 rounded-2xl p-5 border border-tertiary-container/50">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList size={20} className="text-tertiary" />
            <h2 className="font-bold text-tertiary">진행 중인 설문</h2>
          </div>
          <p className="text-sm text-on-surface-variant">공동체의 의견을 들려주세요. 여러분의 참여가 큰 힘이 됩니다.</p>
        </div>

        <div className="space-y-4">
          {surveys.length > 0 ? (
            surveys.map((survey: any) => {
              const isClosed = survey.status === 'closed';
              const userResponded = survey.responses?.[user?.uid] !== undefined;
              
              return (
                <div 
                  key={survey.id} 
                  className="bg-surface-container-lowest p-5 rounded-2xl border border-surface-container-low shadow-sm group cursor-pointer hover:border-primary transition-colors" 
                  onClick={() => setSelectedSurvey(survey)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                      isClosed ? 'bg-surface-container-high text-on-surface-variant' : 'bg-primary/10 text-primary'
                    }`}>
                      {isClosed ? '마감됨' : (userResponded ? '참여완료' : '진행중')}
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      {survey.deadline?.toDate ? `~ ${survey.deadline.toDate().toLocaleDateString()}까지` : 
                       (survey.deadline?.seconds ? `~ ${new Date(survey.deadline.seconds * 1000).toLocaleDateString()}까지` : '기한 정보 없음')}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-on-surface mb-1 group-hover:text-primary transition-colors">{survey.title}</h3>
                  <p className="text-sm text-on-surface-variant mb-4">{survey.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-primary font-bold">{userResponded ? '결과 보기' : '참여하기'}</span>
                    <ChevronRight size={16} className="text-primary" />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-10 text-on-surface-variant text-sm">
              진행 중인 설문이 없습니다.
            </div>
          )}
        </div>
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
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${
                      item.status === 'paid' ? 'text-emerald-600 bg-emerald-50' : 'text-error bg-error/10'
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

const MinutesView = ({ onBack, onShowToast }: any) => (
  <div className="absolute inset-0 bg-surface z-[60] flex flex-col min-h-screen overflow-y-auto pb-24">
    <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-md border-b border-surface-container-highest">
      <div className="flex items-center px-2 py-3">
        <button onClick={onBack} className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold tracking-tight text-on-surface ml-2">회의록</h1>
      </div>
    </header>
    <div className="p-6 space-y-4">
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="text-outline" size={18} />
        </div>
        <input
          type="text"
          placeholder="회의록 검색..."
          className="w-full pl-11 pr-4 py-3 bg-surface-container-lowest rounded-xl shadow-sm border border-surface-container-low focus:ring-2 focus:ring-primary/30 transition-all text-sm outline-none"
        />
      </div>

      <div className="space-y-3">
        {[
          { title: '3월 정기 임원 회의록', date: '2026. 03. 15', category: '임원회' },
          { title: '여름 수련회 기획팀 1차 회의', date: '2026. 03. 10', category: '기획팀' },
          { title: '2월 결산 및 사역 보고', date: '2026. 02. 28', category: '전체' },
          { title: '새가족 환영회 준비 모임', date: '2026. 02. 15', category: '새가족팀' },
        ].map((item, i) => (
          <div key={i} onClick={() => onShowToast('문서를 엽니다.')} className="bg-surface-container-lowest p-4 rounded-2xl flex items-center gap-4 border border-surface-container-low hover:bg-surface-container-low transition-colors cursor-pointer group">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
              <FileText size={24} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-surface-container-high text-on-surface-variant text-[10px] font-bold px-2 py-0.5 rounded-md">{item.category}</span>
                <span className="text-xs text-on-surface-variant">{item.date}</span>
              </div>
              <h3 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{item.title}</h3>
            </div>
            <ChevronRight size={18} className="text-surface-container-highest group-hover:text-primary transition-colors" />
          </div>
        ))}
      </div>
    </div>
  </div>
);