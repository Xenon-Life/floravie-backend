const passport = require('passport'); // Import passport
const { Strategy, ExtractJwt } = require("passport-jwt");
const User = require("./models/users");
const jwtSecret = process.env.SECRETKEY;

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken(); // Extract token from Authorization header
opts.secretOrKey = jwtSecret;

if (jwtSecret) {
  passport.use(
    new Strategy(opts, async (jwt_payload, done) => {
      try {
        const user = await User.findById(jwt_payload._id);
        if (user) {
          return done(null, user);
        } else {
          return done(null, false);
        }
      } catch (err) {
        return done(err, false);
      }
    })
  );
} else {
  console.warn("[passportJWT] JWT auth strategy is disabled. Missing SECRETKEY.");
}
