import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { MongoClient, ObjectId } from "mongodb";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { LocalArtifactStore } from "../src/storage/localArtifactStore.js";
import { createStudioRun, getStudioRun } from "../src/studio/studioService.js";

const TEST_DB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/visutale_test";
const fixtureRoot = path.resolve("fixtures/plans");

test("Google Account Linking & Security Suite", async (t) => {
  const client = new MongoClient(TEST_DB_URI);
  await client.connect();
  const db = client.db("visutale_test_google_linking");

  // Clean test database before test
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
    socialProviders: {
      google: {
        clientId: "test_google_client_id.apps.googleusercontent.com",
        clientSecret: "test_google_client_secret_value",
      },
    },
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ["google"],
      },
    },
    onAPIError: {
      errorURL: "http://localhost:3000/sign-in",
    },
  });

  const ctx = await (auth as unknown as { $context: Promise<{ internalAdapter: Record<string, Function> }> }).$context;
  const temporaryDir = await mkdtemp(path.join(os.tmpdir(), "namaste-google-link-test-"));
  const store = new LocalArtifactStore(path.join(temporaryDir, "runs"));

  try {
    // -------------------------------------------------------------------------
    // Test 1: New user signing in with Google
    // -------------------------------------------------------------------------
    let googleUserAId = "";
    await t.test("1. New user signing in with Google creates user with verified email and google account", async () => {
      const email = `new_google_user_${Date.now()}@visutale.edu`;
      const name = "Dr. Google Pioneer";
      const googleAccountId = `google_sub_${Date.now()}`;

      // Simulate Better Auth OAuth user creation
      const createdUser = await ctx.internalAdapter.createOAuthUser(
        {
          email,
          name,
          emailVerified: true,
        },
        {
          providerId: "google",
          accountId: googleAccountId,
          scope: "email,profile,openid",
        }
      );

      assert.ok(createdUser, "OAuth user must be created");
      googleUserAId = String(createdUser.user.id);
      assert.equal(createdUser.user.email, email);
      assert.equal(createdUser.user.emailVerified, true, "Google users must be marked with emailVerified: true");

      // Verify MongoDB documents
      const userDoc = await db.collection("user").findOne({ email });
      assert.ok(userDoc, "User document must exist in MongoDB user collection");
      assert.equal(userDoc.emailVerified, true);

      const accountDoc = await db.collection("account").findOne({ providerId: "google", accountId: googleAccountId });
      assert.ok(accountDoc, "Account document must exist in MongoDB account collection with providerId google");
      assert.equal(String(accountDoc.userId), String(userDoc._id));
    });

    // -------------------------------------------------------------------------
    // Test 2: Existing email/password user signing in with same verified Google email
    // -------------------------------------------------------------------------
    const sharedEmail = `shared_author_${Date.now()}@visutale.edu`;
    const sharedPassword = "StrongAuthorPass123!";
    let sharedUserId = "";

    await t.test("2. Existing email/password user with verified email links Google account without duplicates", async () => {
      // Step A: Register with email and password
      const signUpRes = await auth.api.signUpEmail({
        body: {
          name: "Prof. Shared Author",
          email: sharedEmail,
          password: sharedPassword,
        },
      });

      assert.ok(signUpRes.user, "User registration must succeed");
      sharedUserId = String(signUpRes.user.id);

      // Verify initial account record is credential only
      const initialAccounts = await db.collection("account").find({ userId: new ObjectId(sharedUserId) }).toArray();
      assert.equal(initialAccounts.length, 1);
      assert.equal(initialAccounts[0].providerId, "credential");

      // Step B: Mark emailVerified: true (policy compliance: verified email)
      await db.collection("user").updateOne(
        { _id: new ObjectId(sharedUserId) },
        { $set: { emailVerified: true } }
      );

      // Step C: Link Google account for the same verified email
      const googleAccountId = `google_sub_shared_${Date.now()}`;
      const linkSuccess = await ctx.internalAdapter.linkAccount({
        providerId: "google",
        accountId: googleAccountId,
        userId: sharedUserId,
        scope: "email,profile,openid",
      });

      assert.ok(linkSuccess, "Google account linking must succeed");

      // Step D: Confirm ZERO duplicate user records
      const totalUserDocs = await db.collection("user").countDocuments({ email: sharedEmail });
      assert.equal(totalUserDocs, 1, "There must remain exactly ONE user record in MongoDB");

      // Step E: Confirm dual account bindings exist under same user ID
      const userAccounts = await db.collection("account").find({ userId: new ObjectId(sharedUserId) }).toArray();
      assert.equal(userAccounts.length, 2, "User must now have exactly 2 account bindings (credential + google)");
      const providers = userAccounts.map((a) => a.providerId);
      assert.ok(providers.includes("credential"), "Must retain credential account binding");
      assert.ok(providers.includes("google"), "Must include google account binding");
    });

    // -------------------------------------------------------------------------
    // Test 3: Existing user signing in with an unrelated Google email
    // -------------------------------------------------------------------------
    await t.test("3. Signing in with an unrelated Google email creates an isolated separate user", async () => {
      const unrelatedEmail = `unrelated_user_${Date.now()}@visutale.edu`;
      const unrelatedGoogleSub = `google_unrelated_${Date.now()}`;

      const createdUnrelated = await ctx.internalAdapter.createOAuthUser(
        {
          email: unrelatedEmail,
          name: "Unrelated Researcher",
          emailVerified: true,
        },
        {
          providerId: "google",
          accountId: unrelatedGoogleSub,
          scope: "email,profile,openid",
        }
      );

      assert.ok(createdUnrelated);
      assert.notEqual(String(createdUnrelated.user.id), sharedUserId, "Must not link to unrelated existing user");

      // Verify separation in DB
      const userA = await db.collection("user").findOne({ email: sharedEmail });
      const userB = await db.collection("user").findOne({ email: unrelatedEmail });
      assert.notEqual(String(userA?._id), String(userB?._id), "Users must have distinct MongoDB ObjectIDs");
    });

    // -------------------------------------------------------------------------
    // Test 4: Email/password login after Google sign-in
    // -------------------------------------------------------------------------
    await t.test("4. Email/password login remains functional after Google account linking", async () => {
      const signInRes = await auth.api.signInEmail({
        body: {
          email: sharedEmail,
          password: sharedPassword,
        },
        asResponse: true,
      });

      assert.ok(signInRes.ok, "Passphrase sign in must succeed even after Google linking");
      const cookie = signInRes.headers.get("set-cookie") || "";
      assert.ok(cookie.includes("better-auth.session_token="), "Must issue session token");

      // Verify wrong password is still rejected
      let wrongPassRejected = false;
      try {
        await auth.api.signInEmail({
          body: {
            email: sharedEmail,
            password: "WrongPassword999!",
          },
        });
      } catch {
        wrongPassRejected = true;
      }
      assert.ok(wrongPassRejected, "Incorrect passphrase must still be strictly rejected");
    });

    // -------------------------------------------------------------------------
    // Test 5: Repeated Google sign-in without duplicate users
    // -------------------------------------------------------------------------
    await t.test("5. Repeated Google sign-in resolves existing account with zero duplicates", async () => {
      const initialUsersCount = await db.collection("user").countDocuments({});
      const initialAccountsCount = await db.collection("account").countDocuments({});

      // Query account owner by provider key (as Better Auth does on repeated sign-ins)
      const existingGoogleAccount = await db.collection("account").findOne({
        userId: new ObjectId(sharedUserId),
        providerId: "google",
      });
      assert.ok(existingGoogleAccount, "Linked Google account must be found");

      const ownerLookup = await ctx.internalAdapter.findAccountOwnerByKey({
        providerId: "google",
        accountId: existingGoogleAccount.accountId,
      });

      assert.equal(ownerLookup?.kind, "owned", "Repeated sign in must resolve to existing owned account");
      assert.equal(String(ownerLookup.user.id), sharedUserId, "Resolved user must equal original shared user ID");

      // Ensure no new user or account documents were created
      const finalUsersCount = await db.collection("user").countDocuments({});
      const finalAccountsCount = await db.collection("account").countDocuments({});
      assert.equal(finalUsersCount, initialUsersCount, "No duplicate user documents allowed");
      assert.equal(finalAccountsCount, initialAccountsCount, "No duplicate account documents allowed");
    });

    // -------------------------------------------------------------------------
    // Test 6: Session creation and logout
    // -------------------------------------------------------------------------
    await t.test("6. Session creation and logout works cleanly for linked account", async () => {
      // Create session for shared user
      const userDoc = await db.collection("user").findOne({ _id: new ObjectId(sharedUserId) });
      assert.ok(userDoc);

      const sessionRes = await auth.api.signInEmail({
        body: {
          email: sharedEmail,
          password: sharedPassword,
        },
        asResponse: true,
      });

      const rawCookie = sessionRes.headers.get("set-cookie") || "";
      const sessionCookie = rawCookie.split(";")[0];

      const verifyHeaders = new Headers();
      verifyHeaders.set("cookie", sessionCookie);
      const verified = await auth.api.getSession({ headers: verifyHeaders });
      assert.ok(verified, "Session must be verified");
      assert.equal(verified?.user?.id, sharedUserId);

      // Sign out
      const signOutRes = await auth.api.signOut({ headers: verifyHeaders, asResponse: true });
      assert.ok(signOutRes.ok, "Sign out must return OK");

      // Verify revoked
      const rechecked = await auth.api.getSession({ headers: verifyHeaders });
      assert.equal(rechecked, null, "Session must be revoked in database after sign out");
    });

    // -------------------------------------------------------------------------
    // Test 7: Existing Studio API authorization remains intact
    // -------------------------------------------------------------------------
    await t.test("7. Existing Studio API authorization and resource ownership remains intact", async () => {
      // Shared user creates a run
      const created = await createStudioRun({
        topic: "Water Cycle and Precipitation",
        fixtureId: "water-cycle",
        store,
        ownerId: sharedUserId,
        customFixtureRoot: fixtureRoot,
      });

      assert.equal(created.manifest.ownerId, sharedUserId, "Run manifest must belong to shared user");

      // Owner can retrieve own run
      const retrieved = await getStudioRun(created.runPath, sharedUserId, store);
      assert.ok(retrieved, "Owner must be able to retrieve own run");
      assert.equal(retrieved.manifest.runId, created.manifest.runId);

      // Unrelated user cannot retrieve run (must return 404 RESOURCE_NOT_FOUND)
      const foreignUserId = "foreign_user_9999999999";
      await assert.rejects(
        () => getStudioRun(created.runPath, foreignUserId, store),
        (err: unknown) => {
          const status = (err as { status: number })?.status;
          const code = (err as { code: string })?.code;
          return status === 404 && code === "RESOURCE_NOT_FOUND";
        },
        "Cross-user retrieval must reject with 404 RESOURCE_NOT_FOUND"
      );
    });
  } finally {
    // Cleanup temporary files and database collections
    try {
      await rm(temporaryDir, { recursive: true, force: true });
    } catch {
      // Ignore file locks on Windows temp
    }
    await db.collection("user").deleteMany({});
    await db.collection("session").deleteMany({});
    await db.collection("account").deleteMany({});
    await client.close();
  }
});

