// Tejaskrit Extension Config
// Firebase config is public (same values used in web apps). You can override in Settings.

export const DEFAULT_CONFIG = {
  firebase: {
    apiKey: "AIzaSyDR00yrTZYpz5tt0OXsO1qGnO3601dU9jE",
    authDomain: "tejaskrit.firebaseapp.com",
    projectId: "tejaskrit",
    storageBucket: "tejaskrit.firebasestorage.app",
    messagingSenderId: "850762391545",
    appId: "1:850762391545:web:f6f99a25a9325f6fc36728",
    measurementId: "G-9YTQFDNLKM"
  },

  // Where your Candidate web app / Vercel API lives.
  // Needed for: /api/resume/generate-latex and /api/resume/pdf
  // Example: https://your-candidate-app.vercel.app
  // Hardcoded Candidate web app / API base.
  // (Kept here so resume generation + tracker link work out of the box.)
  backendBaseUrl: "https://tejaskrit.vercel.app",

  // Autofill toggles
  autofill: {
    name: true,
    email: true,
    phone: true,
    links: true,
    education: true,
    skills: true,
    summary: true,
    location: true
  }
};

export const STORAGE_KEYS = {
  config: "tejaskrit_config_v1",
  session: "tejaskrit_session_v1"
};
