import { getToken, onMessage } from 'firebase/messaging';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db, messagingPromise } from '../firebase';

const VAPID_KEY = 'BI_CzqSns-0EjOEnfhz3QrljB88tFOMUJprm4KxWyt7iA6RffRYKk1QLas44Gw0lxfVwjQfJZQYp816D5tWGBh8';

/**
 * Requests notification permission, obtains an FCM token,
 * and saves it to the user's Firestore document.
 * Returns 'granted' | 'denied' | 'unsupported'
 */
export async function requestAndSaveFcmToken(uid: string): Promise<'granted' | 'denied' | 'unsupported'> {
  if (!('Notification' in window)) return 'unsupported';

  const messaging = await messagingPromise;
  if (!messaging) return 'unsupported';

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return 'denied';

    // Register service worker explicitly
    const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    await navigator.serviceWorker.ready;

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg,
    });

    if (token) {
      // Save token to Firestore (arrayUnion prevents duplicates)
      await updateDoc(doc(db, 'users', uid), {
        fcm_tokens: arrayUnion(token),
      });
      console.log('[FCM] Token registered:', token.slice(0, 20) + '...');
    }

    return 'granted';
  } catch (error) {
    console.error('[FCM] Error registering token:', error);
    return 'denied';
  }
}

/**
 * Removes the current FCM token from Firestore (on notification disable).
 */
export async function removeFcmToken(uid: string): Promise<void> {
  const messaging = await messagingPromise;
  if (!messaging) return;

  try {
    const swReg = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    if (!swReg) return;

    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: swReg,
    });

    if (token) {
      await updateDoc(doc(db, 'users', uid), {
        fcm_tokens: arrayRemove(token),
      });
      console.log('[FCM] Token removed');
    }
  } catch (error) {
    console.error('[FCM] Error removing token:', error);
  }
}

/**
 * Listens to foreground FCM messages and shows a native notification.
 * Call once when the app initializes, passing the current user uid.
 */
export async function listenForegroundMessages(): Promise<void> {
  const messaging = await messagingPromise;
  if (!messaging) return;

  onMessage(messaging, (payload) => {
    console.log('[FCM] Foreground message:', payload);

    const title = payload.notification?.title || 'Forest 알림';
    const body = payload.notification?.body || '새 소식이 있습니다.';

    // Show browser notification even when app is in foreground
    if (Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-72.png',
      });
    }
  });
}
