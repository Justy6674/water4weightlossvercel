
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'

// Import the type augmentation file to ensure it gets loaded
import './types/supabase-augmentation';

// Set up console warning for multiple profiles
if (process.env.NODE_ENV !== 'production') {
  console.warn('DEVELOPMENT MODE: Profile duplication detection is active');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
