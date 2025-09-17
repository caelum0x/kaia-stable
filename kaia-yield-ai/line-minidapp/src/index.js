import React from 'react';
import ReactDOM from 'react-dom/client';
import liff from '@line/liff';
import App from './App';
import './styles/global.css';

// Initialize LIFF
async function initializeLiff() {
  try {
    await liff.init({
      liffId: process.env.REACT_APP_LIFF_ID || 'YOUR_LIFF_ID'
    });
    
    if (!liff.isLoggedIn()) {
      liff.login();
    }
    
    // Get user profile for DID integration
    const profile = await liff.getProfile();
    console.log('User profile:', profile);
    
    // Store user data for DID-based credentials
    localStorage.setItem('lineUserId', profile.userId);
    localStorage.setItem('lineDisplayName', profile.displayName);
    localStorage.setItem('linePictureUrl', profile.pictureUrl);
    
  } catch (error) {
    console.error('LIFF initialization failed:', error);
  }
}

// Initialize app
initializeLiff().then(() => {
  const root = ReactDOM.createRoot(document.getElementById('root'));
  root.render(<App />);
});