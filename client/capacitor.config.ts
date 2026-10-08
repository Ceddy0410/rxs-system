import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rxs.restaurant',
  appName: 'RXS Restaurant',
  webDir: 'dist',
  server: {
    cleartext: true
  }
};

export default config;
