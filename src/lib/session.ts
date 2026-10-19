import { headers } from "next/headers";
import { auth } from "./auth";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  image?: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type SessionRecord = {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
};

export type ActiveSession = {
  user: SessionUser;
  session: SessionRecord;
};

/**
 * Validates the current request session against MongoDB via Better Auth.
 * Does not trust client cookies blindly; queries the authoritative database.
 */
export async function getServerSession(): Promise<ActiveSession | null> {
  try {
    const reqHeaders = headers();
    const session = await auth.api.getSession({
      headers: reqHeaders,
    });

    if (!session || !session.user || !session.session) {
      return null;
    }

    return session as unknown as ActiveSession;
  } catch (error) {
    console.error("Failed to retrieve server session:", error);
    return null;
  }
}

/**
 * Enforces authenticated access on the server.
 * Throws an Error with 401 status if no valid database session exists.
 */
export async function requireServerSession(): Promise<ActiveSession> {
  const currentSession = await getServerSession();
  if (!currentSession) {
    const error = new Error("UNAUTHORIZED");
    (error as unknown as { status: number }).status = 401;
    throw error;
  }
  return currentSession;
}

/**
 * Enforces strict user ownership on the server.
 * Never trust browser-supplied user IDs. Returns true only if the resource owner
 * strictly matches the verified session user ID.
 */
export function assertResourceOwnership(
  resourceOwnerId: string,
  sessionUserId: string
): void {
  if (!resourceOwnerId || !sessionUserId || resourceOwnerId !== sessionUserId) {
    const error = new Error("RESOURCE_NOT_FOUND");
    (error as unknown as { status: number }).status = 404; // Return 404 to prevent resource existence enumeration
    throw error;
  }
}
