import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.growyourneed.vision',
    appName: 'Grow Your Need',
    webDir: 'dist',
    server: {
        androidScheme: 'https'
    }
};

export default config;
