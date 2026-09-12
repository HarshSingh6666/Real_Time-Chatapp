// 1. Firebase Scripts Import (CDN se)
// Hum version 9 (Compat) use kar rahe hain jo service workers ke liye best hai
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// 2. Firebase Configuration
// IMPORTANT: Yahan apni Firebase Project Settings wali values daalein
// (Firebase Console -> Project Settings -> General -> SDK Setup/Config)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// 3. Initialize Firebase
firebase.initializeApp(firebaseConfig);

// 4. Initialize Messaging
const messaging = firebase.messaging();

// 5. Background Message Handler
// Ye tab chalega jab website close hogi ya background mein hogi
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // Notification ka Title aur Body server se aayegi
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png', // Public folder mein apni logo.png rakh lena
    badge: '/logo.png', // Mobile status bar ke liye chhota icon
    data: payload.data, // Extra data (jaise redirect link)
    
    // Actions (Optional - Buttons on notification)
    // actions: [
    //   {action: 'open_url', title: 'Reply Now'}
    // ]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 6. Notification Click Handler
// Jab user notification par click karega
self.addEventListener('notificationclick', function(event) {
  console.log('Notification click received.');
  
  event.notification.close(); // Notification band karo

  // Browser tab kholo ya focus karo
  // Server se jo link bheja tha (fcm_options.link) uspar le jao
  // Default fallback: root URL
  const urlToOpen = event.notification.data?.fcm_options?.link || 'http://localhost:5173';

  event.waitUntil(
    clients.matchAll({type: 'window', includeUncontrolled: true}).then(function(windowClients) {
      // Agar tab already khula hai to focus karo
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Agar nahi khula to naya kholo
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});