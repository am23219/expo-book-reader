import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

// Initialize environment variables object
export const ENV = {
  GOOGLE_CLOUD_PROJECT_ID: process.env.GOOGLE_CLOUD_PROJECT_ID,
  GOOGLE_CLOUD_PRIVATE_KEY_ID: process.env.GOOGLE_CLOUD_PRIVATE_KEY_ID,
  GOOGLE_CLOUD_PRIVATE_KEY: process.env.GOOGLE_CLOUD_PRIVATE_KEY,
  GOOGLE_CLOUD_CLIENT_EMAIL: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
  GOOGLE_CLOUD_CLIENT_ID: process.env.GOOGLE_CLOUD_CLIENT_ID,
  GOOGLE_CLOUD_AUTH_URI: process.env.GOOGLE_CLOUD_AUTH_URI,
  GOOGLE_CLOUD_TOKEN_URI: process.env.GOOGLE_CLOUD_TOKEN_URI,
  GOOGLE_CLOUD_AUTH_PROVIDER_CERT_URL: process.env.GOOGLE_CLOUD_AUTH_PROVIDER_CERT_URL,
  GOOGLE_CLOUD_CLIENT_CERT_URL: process.env.GOOGLE_CLOUD_CLIENT_CERT_URL,
  GOOGLE_CLOUD_UNIVERSE_DOMAIN: process.env.GOOGLE_CLOUD_UNIVERSE_DOMAIN,
};

// Function to load environment variables from a local .env file for development
export const loadEnvFromFile = async () => {
  if (__DEV__ && Platform.OS !== 'web') {
    try {
      const envPath = `${FileSystem.documentDirectory}../.env`;
      const fileExists = await FileSystem.getInfoAsync(envPath);
      
      if (fileExists.exists) {
        const content = await FileSystem.readAsStringAsync(envPath);
        const lines = content.split('\n');
        
        lines.forEach(line => {
          // Skip comments and empty lines
          if (line.trim() && !line.startsWith('#')) {
            const [key, value] = line.split('=');
            if (key && value) {
              ENV[key.trim()] = value.trim().replace(/["']/g, '');
            }
          }
        });
        
        console.log('Environment variables loaded from .env file');
      } else {
        console.warn('.env file not found');
      }
    } catch (error) {
      console.error('Error loading .env file:', error);
    }
  }
};

// Function to get Google Cloud Service Account credentials
export const getGoogleServiceAccountCredentials = () => {
  return {
    type: 'service_account',
    project_id: ENV.GOOGLE_CLOUD_PROJECT_ID,
    private_key_id: ENV.GOOGLE_CLOUD_PRIVATE_KEY_ID,
    private_key: ENV.GOOGLE_CLOUD_PRIVATE_KEY,
    client_email: ENV.GOOGLE_CLOUD_CLIENT_EMAIL,
    client_id: ENV.GOOGLE_CLOUD_CLIENT_ID,
    auth_uri: ENV.GOOGLE_CLOUD_AUTH_URI,
    token_uri: ENV.GOOGLE_CLOUD_TOKEN_URI,
    auth_provider_x509_cert_url: ENV.GOOGLE_CLOUD_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: ENV.GOOGLE_CLOUD_CLIENT_CERT_URL,
    universe_domain: ENV.GOOGLE_CLOUD_UNIVERSE_DOMAIN,
  };
}; 