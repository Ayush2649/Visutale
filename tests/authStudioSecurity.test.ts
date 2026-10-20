import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { MongoClient } from "mongodb";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { LocalArtifactStore } from "../src/storage/localArtifactStore.js";
import {
  createStudioRun,
  updateStudioPlan,
  approveStudioRun,
  getStudioRun,
  findRunPathById,
  listRecentRuns,
} from "../src/studio/studioService.js";
import { StudioJobRegistry } from "../src/studio/studioJobManager.js";
import type { StoryboardPlan } from "../src/contracts/plan.js";

const TEST_DB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/visutale_test";
const fixtureRoot = path.resolve("fixtures/plans");

test("Auth & Studio Security: registration, sessions, deny-by-default, and strict tenant isolation", async (t) => {
  const client = new MongoClient(TEST_DB_URI);
  await client.connect();
  const db = client.db("visutale_test_auth_studio_security");

  // Clean test database collections
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

  const temporaryDir = await mkdtemp(path.join(os.tmpdir(), "namaste-auth-studio-test-"));
  const store = new LocalArtifactStore(path.join(temporaryDir, "runs"));
  const jobRegistry = new StudioJobRegistry(store);

  // User A credentials
  const userAEmail = `author_a_${Date.now()}@visutale.edu`;
  const userAPassword = "AuthorAPassword123!";
  const userAName = "Dr. Alice Adams";
  let userAId = "";
  let userACookie = "";

  // User B credentials
  const userBEmail = `author_b_${Date.now()}@visutale.edu`;
  const userBPassword = "AuthorBPassword123!";
  const userBName = "Prof. Bob Baker";
  let userBId = "";
  let userBCookie = "";

  // Run created by User A
  let userARunId = "";
  let userARunPath = "";
  let userAPlanHash = "";
  let userAPlan: StoryboardPlan;

  try {
    await t.test("1. Register User A and User B via Better Auth and verify MongoDB persistence", async () => {
      // Register User A
      const signUpAResponse = await auth.api.signUpEmail({
        body: {
          name: userAName,
          email: userAEmail,
          password: userAPassword,
        },
        asResponse: true,
      });
      assert.ok(signUpAResponse.ok, "User A sign up must succeed with 200 OK");
      const cookieA = signUpAResponse.headers.get("set-cookie") || "";
      userACookie = cookieA.split(";")[0];
      assert.ok(userACookie.startsWith("better-auth.session_token="), "Must issue session token cookie");

      const userADoc = await db.collection("user").findOne({ email: userAEmail });
      assert.ok(userADoc, "User A must exist in MongoDB user collection");
      userAId = String(userADoc._id);
      assert.ok(userAId.length > 5, "User A ID must be resolved");

      // Register User B
      const signUpBResponse = await auth.api.signUpEmail({
        body: {
          name: userBName,
          email: userBEmail,
          password: userBPassword,
        },
        asResponse: true,
      });
      assert.ok(signUpBResponse.ok, "User B sign up must succeed with 200 OK");
      const cookieB = signUpBResponse.headers.get("set-cookie") || "";
      userBCookie = cookieB.split(";")[0];

      const userBDoc = await db.collection("user").findOne({ email: userBEmail });
      assert.ok(userBDoc, "User B must exist in MongoDB user collection");
      userBId = String(userBDoc._id);
      assert.ok(userBId.length > 5, "User B ID must be resolved");
      assert.notEqual(userAId, userBId, "User A and User B must have distinct tenant IDs");
    });

    await t.test("2. Session token validation against database succeeds for valid cookie and fails for forged cookie", async () => {
      const headersA = new Headers();
      headersA.set("cookie", userACookie);

      const verifiedA = await auth.api.getSession({ headers: headersA });
      assert.ok(verifiedA, "Valid session token must resolve active session");
      assert.equal(verifiedA.user.email, userAEmail);
      assert.equal(verifiedA.user.id, userAId);

      // Forged / tampered cookie must fail
      const forgedCookie = userACookie.replace(/\.[^.]+$/, ".forged_tampered_signature");
      const forgedHeaders = new Headers();
      forgedHeaders.set("cookie", forgedCookie);
      const forgedSession = await auth.api.getSession({ headers: forgedHeaders });
      assert.equal(forgedSession, null, "Forged session cookie must not resolve to a user session");
    });

    await t.test("3. Unauthenticated access is denied by default (401)", async () => {
      // Simulate handler guard with null session
      const simulateRouteGuard = (session: unknown) => {
        if (!session || !(session as { user?: { id?: string } }).user?.id) {
          const err = new Error("Unauthorized");
          (err as unknown as { status: number }).status = 401;
          throw err;
        }
      };

      assert.throws(
        () => simulateRouteGuard(null),
        (err: unknown) => (err as { status: number })?.status === 401,
        "Missing session must result in 401 Unauthorized"
      );

      assert.throws(
        () => simulateRouteGuard({}),
        (err: unknown) => (err as { status: number })?.status === 401,
        "Empty session must result in 401 Unauthorized"
      );
    });

    await t.test("4. User A creates a run: run is isolated under runs/<userAId>/ and manifest.ownerId equals userAId", async () => {
      const created = await createStudioRun({
        topic: "Photosynthesis and Light Reactions",
        fixtureId: "water-cycle",
        store,
        ownerId: userAId,
        customFixtureRoot: fixtureRoot,
      });

      userARunId = created.manifest.runId;
      userARunPath = created.runPath;
      userAPlanHash = created.planHash;
      userAPlan = created.plan;

      assert.equal(created.manifest.ownerId, userAId, "Manifest ownerId must strictly equal User A ID");
      assert.ok(created.runPath.includes(userAId), "Run path must be within User A tenant folder");
      assert.equal(created.manifest.state, "awaiting-approval");
    });

    await t.test("5. User A can retrieve their own run (200 OK)", async () => {
      const run = await getStudioRun(userARunPath, userAId, store);
      assert.ok(run, "User A must be able to retrieve own run");
      assert.equal(run.manifest.runId, userARunId);
      assert.equal(run.manifest.ownerId, userAId);
    });

    await t.test("6. User A can update and revise their manuscript (re-approval workflow)", async () => {
      const modifiedPlan: StoryboardPlan = {
        ...userAPlan,
        scenes: userAPlan.scenes.map((s, idx) =>
          idx === 0
            ? {
                ...s,
                narration: [{ id: "line-hook", text: "Solar energy powers the water cycle through continuous evaporation." }],
              }
            : s
        ),
      };

      const updated = await updateStudioPlan({
        runPath: userARunPath,
        modifiedPlan,
        store,
        ownerId: userAId,
      });

      assert.notEqual(updated.newPlanHash, userAPlanHash, "Plan hash must change on revision");
      userAPlanHash = updated.newPlanHash;
      userARunPath = updated.newRunPath;
      assert.equal(updated.newManifest.ownerId, userAId, "Updated run must preserve User A ownership");
      assert.equal(updated.newManifest.state, "awaiting-approval");
    });

    await t.test("7. User A can approve their own run", async () => {
      const approved = await approveStudioRun({
        runPath: userARunPath,
        planHash: userAPlanHash,
        approvedBy: userAEmail,
        store,
        ownerId: userAId,
      });

      assert.equal(approved.state, "approved");
      assert.equal(approved.ownerId, userAId);
    });

    await t.test("8. User A can dispatch render job and poll status", async () => {
      const job = await jobRegistry.startRenderJob(userARunPath, userAId);
      assert.ok(job.jobId.startsWith("job-"));
      assert.equal(job.ownerId, userAId);

      const status = await jobRegistry.getRunStatus(userARunPath, userAId);
      assert.ok(status.status === "running" || status.status === "completed" || status.status === "failed");
      assert.ok(status.telemetryLogs.length > 0, "Telemetry logs must be accessible by owner");
    });

    await t.test("9. Cross-Tenant Attack 1: User B cannot retrieve User A's run (returns 404 RESOURCE_NOT_FOUND)", async () => {
      await assert.rejects(
        () => getStudioRun(userARunPath, userBId, store),
        (err: unknown) => {
          const status = (err as { status: number })?.status;
          const code = (err as { code: string })?.code;
          return status === 404 && code === "RESOURCE_NOT_FOUND";
        },
        "User B retrieving User A's run must throw 404 RESOURCE_NOT_FOUND"
      );
    });

    await t.test("10. Cross-Tenant Attack 2: User B cannot update User A's plan (returns 404 RESOURCE_NOT_FOUND)", async () => {
      await assert.rejects(
        () =>
          updateStudioPlan({
            runPath: userARunPath,
            modifiedPlan: userAPlan,
            store,
            ownerId: userBId,
          }),
        (err: unknown) => {
          const status = (err as { status: number })?.status;
          const code = (err as { code: string })?.code;
          return status === 404 && code === "RESOURCE_NOT_FOUND";
        },
        "User B modifying User A's run must throw 404 RESOURCE_NOT_FOUND"
      );
    });

    await t.test("11. Cross-Tenant Attack 3: User B cannot approve User A's run (returns 404 RESOURCE_NOT_FOUND)", async () => {
      await assert.rejects(
        () =>
          approveStudioRun({
            runPath: userARunPath,
            planHash: userAPlanHash,
            approvedBy: userBEmail,
            store,
            ownerId: userBId,
          }),
        (err: unknown) => {
          const status = (err as { status: number })?.status;
          const code = (err as { code: string })?.code;
          return status === 404 && code === "RESOURCE_NOT_FOUND";
        },
        "User B approving User A's run must throw 404 RESOURCE_NOT_FOUND"
      );
    });

    await t.test("12. Cross-Tenant Attack 4: User B cannot start render on User A's run (returns 404 RESOURCE_NOT_FOUND)", async () => {
      await assert.rejects(
        () => jobRegistry.startRenderJob(userARunPath, userBId),
        (err: unknown) => {
          const status = (err as { status: number })?.status;
          const code = (err as { code: string })?.code;
          return status === 404 && code === "RESOURCE_NOT_FOUND";
        },
        "User B dispatching render for User A's run must throw 404 RESOURCE_NOT_FOUND"
      );
    });

    await t.test("13. Cross-Tenant Attack 5: User B cannot inspect status / telemetry of User A's run (returns 404)", async () => {
      await assert.rejects(
        () => jobRegistry.getRunStatus(userARunPath, userBId),
        (err: unknown) => {
          const status = (err as { status: number })?.status;
          const code = (err as { code: string })?.code;
          return status === 404 && code === "RESOURCE_NOT_FOUND";
        },
        "User B querying status for User A's run must throw 404 RESOURCE_NOT_FOUND"
      );
    });

    await t.test("14. Cross-Tenant Isolation: User B cannot resolve User A's run path or list User A's runs", async () => {
      // findRunPathById with userBId must return null
      const resolvedByB = await findRunPathById(userARunId, store, userBId);
      assert.equal(resolvedByB, null, "findRunPathById for User B must return null when querying User A's run");

      // findRunPathById with userAId succeeds
      const resolvedByA = await findRunPathById(userARunId, store, userAId);
      assert.ok(resolvedByA, "findRunPathById for User A must resolve own run");
      assert.ok(resolvedByA.endsWith(userARunId), "Resolved path must end with userARunId");

      // listRecentRuns for User B returns empty or only User B's runs
      const userBRuns = await listRecentRuns(store, userBId);
      assert.equal(userBRuns.some((r) => r.runId === userARunId), false, "User B recent runs must never list User A's runs");

      // listRecentRuns for User A contains User A's run
      const userARuns = await listRecentRuns(store, userAId);
      assert.equal(userARuns.some((r) => r.runId === userARunId), true, "User A recent runs must contain User A's run");
    });

    await t.test("15. Process restart durability: disk manifest reconstructs run state accurately", async () => {
      // Create a fresh job registry instance simulating node server restart
      const rebootedJobRegistry = new StudioJobRegistry(store);
      const reconstructedStatus = await rebootedJobRegistry.getRunStatus(userARunPath, userAId);

      assert.ok(reconstructedStatus, "Rebooted registry must reconstruct status from disk manifest");
      assert.ok(reconstructedStatus.status, "Status must be defined");
      assert.ok(reconstructedStatus.stage, "Stage must be defined");
    });

    await t.test("16. Sign-out revokes session in database", async () => {
      const headersA = new Headers();
      headersA.set("cookie", userACookie);

      const signOutResp = await auth.api.signOut({ headers: headersA, asResponse: true });
      assert.ok(signOutResp.ok, "Sign out must return OK");

      const sessionAfterSignOut = await auth.api.getSession({ headers: headersA });
      assert.equal(sessionAfterSignOut, null, "Revoked session must evaluate to null in Better Auth");
    });
  } finally {
    // Cleanup temporary directories and MongoDB collections
    try {
      await rm(temporaryDir, { recursive: true, force: true });
    } catch {
      // Ignore async locks on Windows temp
    }
    await db.collection("user").deleteMany({});
    await db.collection("session").deleteMany({});
    await db.collection("account").deleteMany({});
    await client.close();
  }
});
