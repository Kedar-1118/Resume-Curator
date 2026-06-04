const express = require('express');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const GitHubStrategy = require('passport-github2').Strategy;
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RepoChunk = require('../models/RepoChunk');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// ─── Passport Google OAuth Strategy ──────────────────────────
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Find existing user or create new one
        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          user = await User.create({
            googleId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            avatar: profile.photos?.[0]?.value || '',
          });
        }

        done(null, user);
      } catch (err) {
        done(err, null);
      }
    }
  )
);

// ─── Passport GitHub OAuth Strategy (Feature 1) ──────────────
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: process.env.GITHUB_CLIENT_ID,
        clientSecret: process.env.GITHUB_CLIENT_SECRET,
        callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/auth/github/callback',
        scope: ['user:email', 'public_repo', 'read:user'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          // This strategy is only for linking GitHub to an existing user.
          // The user must already be authenticated via Google OAuth.
          // We pass the GitHub profile + token through to the callback handler.
          done(null, { githubProfile: profile, githubAccessToken: accessToken });
        } catch (err) {
          done(err, null);
        }
      }
    )
  );
}

// Passport serialize/deserialize (needed for strategy but we use JWT, not sessions)
passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// ═══════════════════════════════════════════════════════════════
// Google OAuth Routes
// ═══════════════════════════════════════════════════════════════

// GET /api/auth/google → Redirect to Google OAuth consent screen
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

// GET /api/auth/google/callback → Handle OAuth callback
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: process.env.CLIENT_URL || 'http://localhost:5173',
  }),
  (req, res) => {
    // Sign JWT with user info
    const payload = {
      id: req.user._id,
      email: req.user.email,
      name: req.user.name,
      avatar: req.user.avatar,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });

    // Set httpOnly cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Redirect to dashboard
    const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(`${clientURL}/dashboard`);
  }
);

// ═══════════════════════════════════════════════════════════════
// GitHub OAuth Routes (Feature 1)
// ═══════════════════════════════════════════════════════════════

// GET /api/auth/github → Initiate GitHub OAuth (user must be logged in)
router.get('/github', authMiddleware, (req, res, next) => {
  // Store the user's JWT ID in the session state so callback can find the user
  passport.authenticate('github', {
    session: false,
    state: req.user.id, // Pass user ID through OAuth state parameter
  })(req, res, next);
});

// GET /api/auth/github/callback → Handle GitHub OAuth callback
router.get(
  '/github/callback',
  passport.authenticate('github', {
    session: false,
    failureRedirect: process.env.CLIENT_URL || 'http://localhost:5173',
  }),
  async (req, res) => {
    try {
      const { githubProfile, githubAccessToken } = req.user;
      const userId = req.query.state; // Retrieve from OAuth state

      if (!userId) {
        const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';
        return res.redirect(`${clientURL}/dashboard?github=error`);
      }

      // Update user with GitHub info
      await User.findByIdAndUpdate(userId, {
        githubId: githubProfile.id,
        githubAccessToken: githubAccessToken,
        githubUsername: githubProfile.username,
        githubConnectedAt: new Date(),
        githubIngestionStatus: 'idle',
      });

      const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';
      res.redirect(`${clientURL}/dashboard?github=connected`);
    } catch (err) {
      console.error('GitHub callback error:', err.message);
      const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';
      res.redirect(`${clientURL}/dashboard?github=error`);
    }
  }
);

// DELETE /api/auth/github/disconnect → Remove GitHub connection
router.delete('/github/disconnect', authMiddleware, async (req, res) => {
  try {
    // Clear GitHub fields on user
    await User.findByIdAndUpdate(req.user.id, {
      $unset: { githubId: 1, githubAccessToken: 1, githubUsername: 1, githubConnectedAt: 1 },
      githubIngestionStatus: 'idle',
    });

    // Delete all stored repo embeddings for this user
    await RepoChunk.deleteMany({ userId: req.user.id });

    res.json({ message: 'GitHub disconnected successfully' });
  } catch (err) {
    console.error('GitHub disconnect error:', err.message);
    res.status(500).json({ error: 'Failed to disconnect GitHub' });
  }
});

// ═══════════════════════════════════════════════════════════════
// Common Auth Routes
// ═══════════════════════════════════════════════════════════════

// GET /api/auth/me → Return current user (protected)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-__v -githubAccessToken');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/logout → Clear JWT cookie
router.post('/logout', (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    expires: new Date(0),
  });
  res.status(200).json({ message: 'Logged out successfully' });
});

module.exports = router;
