import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';
import { upsertGoogleUser } from './auth.service.js';

let configured = false;

export function configureGoogleOAuth() {
  if (configured) return;
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_CALLBACK_URL) {
    logger.info('Google OAuth disabled (missing credentials)');
    return;
  }
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL,
        passReqToCallback: true,
      },
      async (req, _accessToken, _refreshToken, profile, done) => {
        try {
          const email = profile.emails?.[0]?.value?.toLowerCase();
          if (!email) return done(new Error('Google profile has no email'));
          const { user, tokens } = await upsertGoogleUser({
            googleId: profile.id,
            email,
            name: profile.displayName || email.split('@')[0],
            avatarUrl: profile.photos?.[0]?.value,
            req,
          });
          done(null, { user, tokens });
        } catch (err) {
          done(err);
        }
      },
    ),
  );
  configured = true;
  logger.info('Google OAuth configured');
}

export const googleEnabled = () =>
  Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET && env.GOOGLE_CALLBACK_URL);
