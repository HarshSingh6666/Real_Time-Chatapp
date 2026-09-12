import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

// Yeh config tumhe Firebase Console se milegi
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "aurachat.firebaseapp.com",
  projectId: "aurachat",
  storageBucket: "aurachat.appspot.com",
  messagingSenderId: "123456...",
  appId: "1:12345..."
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export const requestNotificationPermission = async (userId) => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      // Google se Token mango
      const token = await getToken(messaging, {
        vapidKey: "YOUR_PUBLIC_VAPID_KEY_FROM_FIREBASE_CONSOLE"
      });
      
      console.log("FCM Token:", token);
      
      // IMPORTANT: Is token ko backend bhejo aur User ke DB mein save karo
      // axios.put('/api/user/fcm-token', { userId, token });
      return token;
    }
  } catch (error) {
    console.error("Permission denied", error);
  }
};