import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nursefolio.app',
  appName: 'Nursefolio',
  webDir: 'dist',
  server: {
    url: 'https://nursefolio.vercel.app/',
    cleartext: false
  }
};

export default config;
