// ==========================================
// VERSA FIREBASE CONFIGURATION
// ==========================================

const firebaseConfig = {
  apiKey: "AIzaSyC-olUeNs8cm2cPVrf1g-5zdDA0I-ylk_4",
  authDomain: "versa-15309.firebaseapp.com",
  projectId: "versa-15309",
  storageBucket: "versa-15309.firebasestorage.app",
  messagingSenderId: "356424768866",
  appId: "1:356424768866:web:75194e6c9c3c96c7b6203b",
  measurementId: "G-9DBDF13DZJ"
};

// 1. Initialize Firebase
firebase.initializeApp(firebaseConfig);

// 2. Export Services for other files to use
// We use 'const' so these variables are available globally in your app
const auth = firebase.auth();
const db = firebase.firestore();

console.log("🔥 Firebase Connected Successfully to Versa!");
