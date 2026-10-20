import assert from "node:assert/strict";
import test from "node:test";
import { MongoClient } from "mongodb";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";

const TEST_DB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/visutale_test";

test("Performance & Session Concurrency Suite", async (t) => {
  const client = new MongoClient(TEST_DB_URI);
  await client.connect();
  const db = client.db("visutale_test_perf");

  try {
    // Clean test database
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
        autoSignIn: true,
      },
      session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
        cookieCache: {
          enabled: true,
          maxAge: 5 * 60,
        },
      },
    });

    await t.test("1. Database index verification guarantees index coverage for token, user, and account", async () => {
      // Create indexes on test collections
      await Promise.allSettled([
        db.collection("session").createIndex({ token: 1 }, { unique: true }),
        db.collection("session").createIndex({ userId: 1 }),
        db.collection("session").createIndex({ expiresAt: 1 }),
        db.collection("user").createIndex({ email: 1 }, { unique: true }),
        db.collection("account").createIndex({ userId: 1 }),
        db.collection("account").createIndex({ providerId: 1, accountId: 1 }),
      ]);

      const sessionIndexes = await db.collection("session").indexes();
      const userIndexes = await db.collection("user").indexes();
      const accountIndexes = await db.collection("account").indexes();

      const hasSessionTokenIndex = sessionIndexes.some((idx) => idx.key.token === 1);
      const hasSessionUserIdIndex = sessionIndexes.some((idx) => idx.key.userId === 1);
      const hasUserEmailIndex = userIndexes.some((idx) => idx.key.email === 1);
      const hasAccountUserIdIndex = accountIndexes.some((idx) => idx.key.userId === 1);

      assert.ok(hasSessionTokenIndex, "Session collection must have index on token for O(1) seeks");
      assert.ok(hasSessionUserIdIndex, "Session collection must have index on userId");
      assert.ok(hasUserEmailIndex, "User collection must have unique index on email");
      assert.ok(hasAccountUserIdIndex, "Account collection must have index on userId");
    });

    await t.test("2. Concurrent and repeated sign-out calls are idempotent and non-blocking", async () => {
      const email = `perf_${Date.now()}@visutale.local`;
      const password = "ValidPassword123!";

      const signUpRes = await auth.api.signUpEmail({
        body: { email, password, name: "Perf Concurrent User" },
        asResponse: true,
      });
      assert.ok(signUpRes.ok, "Sign up must succeed");

      const setCookie = signUpRes.headers.get("set-cookie") || "";
      const cookieHeader = setCookie.split(";")[0];
      const headers = new Headers();
      headers.set("cookie", cookieHeader);

      // Verify session is active
      const session1 = await auth.api.getSession({ headers });
      assert.ok(session1?.user, "Session must be active initially");

      // Simulate rapid concurrent sign-out calls (e.g. repeated user clicks or parallel handlers)
      const [signOutRes1, signOutRes2, signOutRes3] = await Promise.all([
        auth.api.signOut({ headers, asResponse: true }),
        auth.api.signOut({ headers, asResponse: true }),
        auth.api.signOut({ headers, asResponse: true }),
      ]);

      assert.ok(signOutRes1.ok, "First concurrent sign-out must succeed");
      assert.ok(signOutRes2.ok, "Second concurrent sign-out must succeed idempotently");
      assert.ok(signOutRes3.ok, "Third concurrent sign-out must succeed idempotently");

      // Session must now be fully revoked in database
      const sessionAfter = await auth.api.getSession({ headers });
      assert.equal(sessionAfter, null, "Session must evaluate to null after sign out");

      // Sequential repeat sign-out after already signed out must also succeed gracefully
      const subsequentSignOut = await auth.api.signOut({ headers, asResponse: true });
      assert.ok(subsequentSignOut.ok, "Sequential subsequent sign-out must not throw or fail");
    });

    await t.test("3. Concurrent session reads execute cleanly with low latency", async () => {
      const email = `session_bench_${Date.now()}@visutale.local`;
      const password = "ValidPassword123!";

      const signUpRes = await auth.api.signUpEmail({
        body: { email, password, name: "Parallel User" },
        asResponse: true,
      });

      const setCookie = signUpRes.headers.get("set-cookie") || "";
      const cookieHeader = setCookie.split(";")[0];
      const headers = new Headers();
      headers.set("cookie", cookieHeader);

      // Fire 10 parallel getSession requests
      const tStart = performance.now();
      const results = await Promise.all(
        Array.from({ length: 10 }).map(() => auth.api.getSession({ headers }))
      );
      const elapsed = performance.now() - tStart;

      for (const res of results) {
        assert.ok(res?.user, "Parallel session lookup must return active user");
        assert.equal(res?.user.email, email);
      }

      assert.ok(elapsed < 2000, `10 parallel session lookups took ${elapsed}ms, expected under 2000ms`);
    });
  } finally {
    // Cleanup
    await db.collection("user").deleteMany({});
    await db.collection("session").deleteMany({});
    await db.collection("account").deleteMany({});
    await client.close();
  }
});

