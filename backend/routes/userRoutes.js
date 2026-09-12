const express = require('express');
const router = express.Router();
const multer = require('multer');

// ✅ FIX: Correct Import (Curly Braces ke sath)
// Path check karein: 'middlewares' folder ka naam plural hai aapke code mein
const { verifyToken } = require('../middlewares/auth'); 

const { 
    getMe, 
    updateProfile, 
    searchUsers, 
    uploadAvatar, 
    removeAvatar,
    updateFcmToken 
} = require('../controllers/userController');

const upload = multer({ dest: 'uploads/' });

// ✅ Debugging Lines (Agar server start na ho to ye print karega)
if (!verifyToken) console.error("❌ CRITICAL ERROR: 'verifyToken' Middleware import nahi hua!");
if (!searchUsers) console.error("❌ CRITICAL ERROR: 'searchUsers' Controller import nahi hua!");

// ==============================
// ROUTES
// ==============================

router.get('/me', verifyToken, getMe);
router.put('/update', verifyToken, updateProfile);

// ✅ Changed from '/' to '/search' to match your frontend!
router.get('/search', verifyToken, searchUsers); 

// Avatar Routes
router.post('/avatar', verifyToken, upload.single('avatar'), uploadAvatar);
router.delete('/avatar', verifyToken, removeAvatar);

// Notification Route
router.put('/fcm-token', verifyToken, updateFcmToken);

module.exports = router;