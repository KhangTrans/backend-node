const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User.model');

/**
 * Google OAuth2 Passport Configuration
 */

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Only initialize Google Strategy if credentials are configured
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/google/callback',
      scope: ['profile', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists with this Google ID
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // User exists, return user
          return done(null, user);
        }

        // Check if user exists with same email
        user = await User.findOne({ email: profile.emails[0].value });

        if (user) {
          // Link Google account to existing user
          user.googleId = profile.id;
          user.authProvider = 'google';
          if (!user.avatar && profile.photos[0]) {
            user.avatar = profile.photos[0].value;
          }
          await user.save();
          return done(null, user);
        }

        // Create new user
        const username = generateUniqueUsername(profile.displayName);
        
        user = await User.create({
          googleId: profile.id,
          email: profile.emails[0].value,
          username: username,
          fullName: profile.displayName,
          avatar: profile.photos[0]?.value || null,
          authProvider: 'google',
          isActive: true
        });

        return done(null, user);
      } catch (error) {
        console.error('Google OAuth error:', error);
        return done(error, null);
      }
    }
  ));
  console.log('✅ Google OAuth configured successfully');
} else {
  console.warn('⚠️  Google OAuth not configured - GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required');
}

// Helper function to generate unique username from display name
function generateUniqueUsername(displayName) {
  // Remove special characters and spaces
  let baseUsername = displayName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .substring(0, 20);
  
  // Add random suffix to ensure uniqueness
  const randomSuffix = Math.floor(Math.random() * 10000);
  return `${baseUsername}${randomSuffix}`;
}

module.exports = passport;
