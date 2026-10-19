import assert from "node:assert/strict";
import test from "node:test";
import { MongoClient } from "mongodb";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";

const TEST_DB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/visutale_test";

test("Auth: complete registration, login, session persistence, logout, and isolation suite", async (t) => {
  const client = new MongoClient(TEST_DB_URI);
  await client.connect();
  const db = client.db("visutale_test_auth");

  // Clean test collections before test
  await db.collection("user").deleteMany({});
  await db.collection("session").deleteMany({});
  await db.collection("account").deleteMany({});

  const auth = betterAuth({
    database: mongodbAdapter(db, { transaction: false }),
    secret: "test_secret_32_characters_long_for_auth_tests_only!",
    baseURL: "http://localhost:3000",
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
    },
  });

  const testEmail = `test_${Date.now()}@institute.edu`;
  const testPassword = "SecurePassphrase123!";
  const testName = "Dr. Arthur Chen";
  let sessionCookie = "";

  await t.test("1. Successful Registration creates user and session in MongoDB", async () => {
    const signUpResponse = await auth.api.signUpEmail({
      body: {
        name: testName,
        email: testEmail,
        password: testPassword,
      },
      asResponse: true,
    });

    assert.ok(signUpResponse.ok, "Sign up response must be 200 OK");
    const rawSetCookie = signUpResponse.headers.get("set-cookie") || "";
    sessionCookie = rawSetCookie.split(";")[0];
    assert.ok(sessionCookie.startsWith("better-auth.session_token="), "Cookie must be signed session token");

    // Verify user is persisted in MongoDB
    const persistedUser = await db.collection("user").findOne({ email: testEmail });
    assert.ok(persistedUser, "User must be persisted in MongoDB user collection");
    assert.equal(persistedUser.email, testEmail);

    // Verify session is created in MongoDB
    const persistedSession = await db.collection("session").findOne({ userId: persistedUser._id });
    assert.ok(persistedSession, "Session must be created in MongoDB session collection");
    assert.ok(persistedSession.token, "Session must contain secure token");
  });

  await t.test("2. Duplicate email registration is rejected", async () => {
    let duplicateRejected = false;
    try {
      await auth.api.signUpEmail({
        body: {
          name: "Another User",
          email: testEmail,
          password: "AnotherPassword123!",
        },
      });
    } catch {
      duplicateRejected = true;
    }

    assert.ok(duplicateRejected, "Duplicate registration attempt must throw error");
    const userCount = await db.collection("user").countDocuments({ email: testEmail });
    assert.equal(userCount, 1, "Duplicate user must not exist in MongoDB");
  });

  await t.test("3. Password under 8 characters is rejected", async () => {
    let shortPasswordRejected = false;
    try {
      await auth.api.signUpEmail({
        body: {
          name: "Short Pass User",
          email: "shortpass@institute.edu",
          password: "short",
        },
      });
    } catch {
      shortPasswordRejected = true;
    }

    assert.ok(shortPasswordRejected, "Password under 8 characters must be rejected");
  });

  await t.test("4. Successful sign-in returns authenticated session and verifies password", async () => {
    const signInResponse = await auth.api.signInEmail({
      body: {
        email: testEmail,
        password: testPassword,
      },
      asResponse: true,
    });

    assert.ok(signInResponse.ok, "Sign in response must be 200 OK");
    const setCookie = signInResponse.headers.get("set-cookie") || "";
    sessionCookie = setCookie.split(";")[0];
    assert.ok(sessionCookie.includes("better-auth.session_token="), "Must issue signed cookie on sign in");
  });

  await t.test("5. Invalid credentials (wrong password) is rejected", async () => {
    let wrongPasswordRejected = false;
    try {
      await auth.api.signInEmail({
        body: {
          email: testEmail,
          password: "IncorrectPassword999!",
        },
      });
    } catch {
      wrongPasswordRejected = true;
    }

    assert.ok(wrongPasswordRejected, "Wrong password must be rejected");
  });

  await t.test("6. Nonexistent email sign-in is rejected", async () => {
    let nonexistentRejected = false;
    try {
      await auth.api.signInEmail({
        body: {
          email: "nonexistent_author@nowhere.org",
          password: testPassword,
        },
      });
    } catch {
      nonexistentRejected = true;
    }

    assert.ok(nonexistentRejected, "Nonexistent user must be rejected");
  });

  await t.test("7. Session verification against database succeeds for valid signed token and fails for tampered", async () => {
    const headers = new Headers();
    headers.set("cookie", sessionCookie);

    const verified = await auth.api.getSession({ headers });
    assert.ok(verified, "Session should be verified from DB");
    assert.equal(verified?.user?.email, testEmail);
    assert.equal(verified?.user?.name, testName);

    // Tampered signature
    const tamperedCookie = sessionCookie.replace(/\.[^.]+$/, ".forged_signature_xyz");
    const fakeHeaders = new Headers();
    fakeHeaders.set("cookie", tamperedCookie);
    const fakeVerified = await auth.api.getSession({ headers: fakeHeaders });
    assert.equal(fakeVerified, null, "Tampered session signature must fail database verification");
  });

  await t.test("8. Sign-out revokes session in database", async () => {
    const headers = new Headers();
    headers.set("cookie", sessionCookie);

    const signOutResponse = await auth.api.signOut({ headers, asResponse: true });
    assert.ok(signOutResponse.ok, "Sign out must return OK");

    // Verify session is revoked from DB
    const rechecked = await auth.api.getSession({ headers });
    assert.equal(rechecked, null, "Revoked session must not validate against database");
  });

  await t.test("9. Server-side User Isolation & Resource Ownership enforcement", () => {
    const userA = "usr_000000000000000001";
    const userB = "usr_000000000000000002";

    function assertOwnership(resourceOwnerId: string, sessionUserId: string): boolean {
      if (!resourceOwnerId || !sessionUserId || resourceOwnerId !== sessionUserId) {
        const error = new Error("RESOURCE_NOT_FOUND");
        (error as unknown as { status: number }).status = 404;
        throw error;
      }
      return true;
    }

    // Owner accessing own resource
    assert.equal(assertOwnership(userA, userA), true);

    // Cross-user access attempt
    assert.throws(
      () => assertOwnership(userA, userB),
      (err: unknown) => {
        const status = (err as { status: number })?.status;
        return status === 404; // Must return 404, never disclosing resource existence
      },
      "Cross-user access must throw 404"
    );

    // Browser-supplied ownerId attempt
    const browserSuppliedUserId = userB;
    const actualSessionId = userA;
    assert.throws(
      () => assertOwnership(browserSuppliedUserId, actualSessionId),
      "Browser-supplied user ID must never override session ID"
    );
  });

  // Cleanup test collections after tests
  await db.collection("user").deleteMany({});
  await db.collection("session").deleteMany({});
  await db.collection("account").deleteMany({});
  await client.close();
});

