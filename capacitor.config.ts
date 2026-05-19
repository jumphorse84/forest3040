import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.story.forest',
  appName: 'Forest',
  webDir: 'dist',
  plugins: {
    FirebaseMessaging: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com'],
    },
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  ios: {
    contentInset: 'automatic',
  },
  server: {
    hostname: 'forest3040-6f109.web.app',
    androidScheme: 'https',
    // Allow Firebase auth domains to stay inside the WebView.
    // By default Capacitor opens external URLs in Chrome, which breaks
    // signInWithRedirect (sessionStorage is split between WebView and Chrome).
    allowNavigation: [
      '*.firebaseapp.com',
      '*.firebase.com',
      'accounts.google.com',
      '*.google.com',
      'kauth.kakao.com',
      '*.kakao.com',
    ],
  },
};

export default config;
