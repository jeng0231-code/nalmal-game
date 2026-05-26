import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'kr.khakdang.app',
  appName: 'K학당',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
