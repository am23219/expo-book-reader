#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Path for the service account file
const serviceAccountPath = path.join(__dirname, '..', 'barakaat-makiyyah-service-account.json');

// Extracting environment variables
const serviceAccountData = {
  type: 'service_account',
  project_id: process.env.GOOGLE_CLOUD_PROJECT_ID,
  private_key_id: process.env.GOOGLE_CLOUD_PRIVATE_KEY_ID,
  private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY,
  client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
  client_id: process.env.GOOGLE_CLOUD_CLIENT_ID,
  auth_uri: process.env.GOOGLE_CLOUD_AUTH_URI,
  token_uri: process.env.GOOGLE_CLOUD_TOKEN_URI,
  auth_provider_x509_cert_url: process.env.GOOGLE_CLOUD_AUTH_PROVIDER_CERT_URL,
  client_x509_cert_url: process.env.GOOGLE_CLOUD_CLIENT_CERT_URL,
  universe_domain: process.env.GOOGLE_CLOUD_UNIVERSE_DOMAIN
};

// Make sure all required fields are present
const requiredFields = ['project_id', 'private_key_id', 'private_key', 'client_email'];
const missingFields = requiredFields.filter(field => !serviceAccountData[field]);

if (missingFields.length > 0) {
  console.error(`Error: Missing required environment variables: ${missingFields.join(', ')}`);
  process.exit(1);
}

// Write the service account file
try {
  fs.writeFileSync(
    serviceAccountPath,
    JSON.stringify(serviceAccountData, null, 2)
  );
  console.log(`Service account file generated at: ${serviceAccountPath}`);
} catch (error) {
  console.error('Error generating service account file:', error);
  process.exit(1);
} 