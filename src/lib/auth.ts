import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { db, client } from "./db";

const googleClientId = process.env.GOOGLE_CLIENT_ID || "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
const isGoogleConfigured = Boolean(googleClientId.trim() && googleClientSecret.trim());

export const auth = betterAuth({
  database: mongodbAdapter(db, { transaction: false }),
  secret: process.env.BETTER_AUTH_SECRET || "visutale_default_secret_key_needs_override_32_chars!",
  baseURL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    autoSignIn: true,
  },
  socialProviders: isGoogleConfigured
    ? {
        google: {
          clientId: googleClientId,
          clientSecret: googleClientSecret,
        },
      }
    : {},
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: isGoogleConfigured ? ["google"] : [],
    },
  },
  onAPIError: {
    errorURL: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/sign-in`,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days (API_DESIGN section 3)
    updateAge: 60 * 60 * 24, // Refresh token window 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 min cache
    },
  },
});
