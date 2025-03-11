const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const guideRoutes = require('./routes/guide');
const postRoutes = require('./routes/post');
const profileRoutes = require('./routes/profile');
const notificationRoutes = require('./routes/notification');
const searchRoutes = require('./routes/search');
const auth = require('./middleware/auth');

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/guides', auth, guideRoutes);
app.use('/api/posts', auth, postRoutes);
app.use('/api/profiles', auth, profileRoutes);
app.use('/api/notifications', auth, notificationRoutes);
app.use('/api/search', searchRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.toString() : undefined
  });
});

module.exports = app; 