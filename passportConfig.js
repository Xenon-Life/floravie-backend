const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('./models/users');

const hasGoogleOAuthConfig =
  !!process.env.GOOGLE_CLIENT_ID &&
  !!process.env.GOOGLE_CLIENT_SECRET &&
  !!process.env.BACKEND_URL;

if (hasGoogleOAuthConfig) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BACKEND_URL}/api/auth/google/callback`,
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ googleId: profile.id });

      if (user) {
        return done(null, user);
      }
      user = await User.findOne({ email: profile.emails[0].value });
      if (user) {
        user.googleId = profile.id;
        await user.save();
        return done(null, user);
      }

      console.log("user", profile);

      const newUser = new User({
        username: profile.displayName,
        email: profile.emails[0].value,
        googleId: profile.id,
        age: "N/A",
        number: "N/A",
      });

      await newUser.save();
      return done(null, newUser);
    } catch (err) {
      return done(err, false);
    }
  }));
} else {
  console.warn(
    "[passportConfig] Google OAuth is disabled. Missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or BACKEND_URL."
  );
}

// Serialize user to store in session (if needed)
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session (if needed)
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
