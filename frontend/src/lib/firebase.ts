import { initializeApp } from "firebase/app";
import { getMessaging, getToken, Messaging } from "firebase/messaging";
import axios from "axios";

// 1. Firebase Config (Console se copy karein)
const firebaseConfig = {
  apiKey: "AIzaSyCM81g77ugP6ZdguQU4pHlRvYSgX2P2Tys",
  authDomain: "aurachat-c9c08.firebaseapp.com",
  projectId: "aurachat-c9c08",
  storageBucket: "aurachat-c9c08.firebasestorage.app",
  messagingSenderId: "561206420582",
  appId: "1:561206420582:web:af250e142cd998950a79a7",
  measurementId: "G-WR6RZYZPKE"
};


const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestForToken = async () => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      const currentToken = await getToken(messaging, {
        vapidKey: "BA6Trx9Ik7Lex1mriNTRUnXa8RtCVATPppNdtCqILq8efdBxRTPn5OYnN0E42zWKQ4O2PnQhy_N5cwpGVTTCphY", // Apna VAPID Key yahan dalein
      });

      if (currentToken) {
        // ✅ FIX: Get Auth Token from LocalStorage
        const authToken = localStorage.getItem("token");

        if (authToken) {
            // ✅ FIX: Send Token in Headers
            await axios.put("http://localhost:5000/api/users/fcm-token", 
            { fcmToken: currentToken }, 
            {
                headers: {
                    Authorization: `Bearer ${authToken}`, // Ye zaroori hai
                },
            });
            console.log("✅ FCM Token Synced");
        }
      }
    }
  } catch (err) {
    console.log("An error occurred while retrieving token.", err);
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });