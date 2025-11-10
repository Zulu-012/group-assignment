// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAQW_n3T_6KRyKUsHJrdPPL94n84HEq1P8",
  authDomain: "group-eff37.firebaseapp.com",
  projectId: "group-eff37",
  storageBucket: "group-eff37.firebasestorage.app",
  messagingSenderId: "56382349165",
  appId: "1:56382349165:web:fbcb1a65dcdcca2c1b8464",
  measurementId: "G-K8DVSCTTS9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);