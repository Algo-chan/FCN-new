import passport from "passport";
import { Strategy as GoogleStrategy, type Profile } from "passport-google-oauth20";
import { Role, UserStatus } from "@prisma/client";
import { prisma } from "./database";
import { env } from "./env";
import { logger } from "../utils/logger";

export interface GooglePassportUser {
  id: string;
  email: string;
  full_name: string;
  avatar?: string;
  role: Role;
  status: UserStatus;
  googleId: string;
}

const mapGoogleProfile = (profile: Profile): GooglePassportUser => {
  const email = profile.emails?.[0]?.value;

  if (!email) {
    throw new Error("Google account does not expose an email address");
  }

  return {
    id: profile.id,
    googleId: profile.id,
    email,
    full_name: profile.displayName || email.split("@")[0],
    avatar: profile.photos?.[0]?.value,
    role: "patient",
    status: "active"
  };
};

export const configurePassport = (): void => {
  passport.serializeUser((user, done) => {
    done(null, (user as GooglePassportUser).id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { id } });
      done(null, user as Express.User | false | null | undefined);
    } catch (error) {
      done(error);
    }
  });

  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_CALLBACK_URL) {
    logger.warn("Google OAuth is not configured. Set GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_CALLBACK_URL.");
    return;
  }

  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: env.GOOGLE_CALLBACK_URL
      },
      async (_accessToken, _refreshToken, profile, done) => {
        try {
          const googleUser = mapGoogleProfile(profile);
          const existing = await prisma.user.findUnique({ where: { email: googleUser.email } });

          if (existing) {
            done(null, {
              id: existing.id,
              email: existing.email ?? googleUser.email,
              full_name: existing.full_name,
              role: existing.role,
              status: existing.status,
              avatar: googleUser.avatar,
              googleId: profile.id
            });
            return;
          }

          const created = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
              data: {
                full_name: googleUser.full_name,
                email: googleUser.email,
                phone: null,
                password_hash: null,
                role: "patient",
                status: "active",
                email_verified: true,
                phone_verified: false
              }
            });

            await tx.patientProfile.create({
              data: {
                user_id: user.id,
                chronic_conditions: []
              }
            });

            return user;
          });

          done(null, {
            id: created.id,
            email: created.email ?? googleUser.email,
            full_name: created.full_name,
            role: created.role,
            status: created.status,
            avatar: googleUser.avatar,
            googleId: profile.id
          });
        } catch (error) {
          done(error);
        }
      }
    )
  );
};
