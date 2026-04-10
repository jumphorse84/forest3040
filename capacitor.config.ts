import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.forest3040.app',
  appName: 'Forest',
  webDir: 'dist',
  plugins: {
    FirebaseMessaging: {
      presentationOptions: ['badge', 'sound', 'alert'],
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
    // For local dev testing with Capacitor
    // Remove this block before production build
    // url: 'http://192.168.x.x:3000',
    // cleartext: true,
  },
};

export default config;
