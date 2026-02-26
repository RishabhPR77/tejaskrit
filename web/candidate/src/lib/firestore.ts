import {
  collection,
  doc,
  deleteDoc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  addDoc,
  Timestamp,
} from "firebase/firestore";
import type { User } from "firebase/auth";
import { db } from "./firebase";
import type {
  ApplicationDoc,
  ApplicationStatusKey,
  JobDoc,
  MasterProfileDoc,
  NotificationDoc,
  RecommendationDoc,
  InstituteDoc,
  UserDoc,
} from "./types";
import { slugify } from "./utils";

// Firestore does NOT allow `undefined` values anywhere in the object.
// This helper recursively removes keys with `undefined`.
function stripUndefinedDeep<T>(value: T): T {
  if (value === undefined) return undefined as unknown as T;
  if (value === null) return value;
  if (Array.isArray(value)) {
    // keep array order; strip undefined elements
    return value.filter((v) => v !== undefined).map((v) => stripUndefinedDeep(v)) as unknown as T;
  }
  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined) continue;
      const vv = stripUndefinedDeep(v);
      if (vv === undefined) continue;
      out[k] = vv;
    }
    return out as unknown as T;
  }
  return value;
}

function stripRef(prefix: string, val: string) {
  return val.startsWith(prefix) ? val.slice(prefix.length) : val;
}

export function jobIdFromAny(jobIdOrRef: string) {
  return stripRef("jobs/", stripRef("/jobs/", jobIdOrRef));
}

export async function ensureUserDoc(authUser: User): Promise<UserDoc> {
  const ref = doc(db, "users", authUser.uid);
  const snap = await getDoc(ref);

  const base: UserDoc = {
    uid: authUser.uid,
    email: authUser.email ?? undefined,
    name: authUser.displayName ?? undefined,
    photoUrl: authUser.photoURL ?? undefined,
    role: "student",
    consents: {
      resumeGeneration: true,
      jobMatching: true,
      shareWithTpo: false,
    },
  };

  if (!snap.exists()) {
    await setDoc(
      ref,
      stripUndefinedDeep({
        ...base,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
      }),
      { merge: true }
    );
    return base;
  }

  await updateDoc(ref, { lastLoginAt: serverTimestamp(), updatedAt: serverTimestamp() });

  const existing = snap.data() as UserDoc;
  // Preserve existing fields (like role/institute/consents), but refresh auth-derived fields when available.
  return {
    ...base,
    ...existing,
    uid: authUser.uid,
    email: authUser.email ?? existing.email,
    name: authUser.displayName ?? existing.name,
    photoUrl: authUser.photoURL ?? existing.photoUrl,
  };
}

export async function getUserDoc(uid: string): Promise<UserDoc | null> {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? (snap.data() as UserDoc) : null;
}

export async function getMasterProfile(uid: string): Promise<MasterProfileDoc | null> {
  const snap = await getDoc(doc(db, "users", uid, "master_profile", "main"));
  return snap.exists() ? (snap.data() as MasterProfileDoc) : null;
}

export async function saveMasterProfile(uid: string, profile: MasterProfileDoc) {
  await setDoc(
    doc(db, "users", uid, "master_profile", "main"),
    stripUndefinedDeep({ ...profile, updatedAt: serverTimestamp() }),
    { merge: true }
  );
}

export async function saveOnboarding(uid: string, patch: Partial<UserDoc>, profilePatch: MasterProfileDoc, instituteMember?: {
  instituteId?: string | null;
  instituteName?: string;
  branch?: string;
  batch?: string;
  cgpa?: number;
}) {
  const userRef = doc(db, "users", uid);
  const masterRef = doc(db, "users", uid, "master_profile", "main");

  const batch = writeBatch(db);
  batch.set(
    userRef,
    stripUndefinedDeep({
      ...patch,
      role: patch.role ?? "student",
      onboardedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
    { merge: true }
  );
  batch.set(masterRef, stripUndefinedDeep({ ...profilePatch, updatedAt: serverTimestamp() }), { merge: true });

  // Optional: ensure institute member record for TPO views
  if (instituteMember?.instituteId) {
    const instituteId = instituteMember.instituteId;
    const instRef = doc(db, "institutes", instituteId);
    const instituteName =
      instituteMember.instituteName?.trim() ||
      profilePatch?.education?.[0]?.institute?.trim() ||
      instituteId;
    batch.set(
      instRef,
      stripUndefinedDeep({
        name: instituteName,
        isActive: true,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      }),
      { merge: true }
    );

    const memRef = doc(db, "institutes", instituteId, "members", uid);
    batch.set(
      memRef,
      {
        uid,
        role: "student",
        branch: instituteMember.branch ?? "",
        batch: instituteMember.batch ?? "",
        cgpa: instituteMember.cgpa ?? null,
        status: "active",
        joinedAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  await batch.commit();
}

export async function listInstitutes(take = 50): Promise<Array<{ id: string; data: InstituteDoc }>> {
  const q = query(collection(db, "institutes"), orderBy("name", "asc"), limit(take));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as InstituteDoc }));
}

export async function connectUserToInstitute(args: {
  uid: string;
  instituteName: string;
  instituteCode?: string;
  branch?: string;
  batch?: string;
  cgpa?: number;
}) {
  const { uid, instituteName, instituteCode, branch, batch: batchYear, cgpa } = args;
  const name = (instituteName ?? "").trim();
  if (!name) throw new Error("Institute name is required");

  const instituteId = slugify(name);
  if (!instituteId) throw new Error("Invalid institute name");

  const userRef = doc(db, "users", uid);
  const instRef = doc(db, "institutes", instituteId);
  const memRef = doc(db, "institutes", instituteId, "members", uid);

  const batch = writeBatch(db);
  batch.set(
    instRef,
    stripUndefinedDeep({
      name,
      code: instituteCode?.trim() ? instituteCode.trim().toUpperCase() : undefined,
      isActive: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    }),
    { merge: true }
  );

  batch.set(
    memRef,
    {
      uid,
      role: "student",
      branch: branch?.trim() ?? "",
      batch: batchYear?.trim() ?? "",
      cgpa: typeof cgpa === "number" ? cgpa : null,
      status: "active",
      joinedAt: serverTimestamp(),
    },
    { merge: true }
  );

  batch.set(
    userRef,
    {
      instituteId,
      role: "student",
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );

  await batch.commit();
  return instituteId;
}

export async function listRecommendations(uid: string, take = 50): Promise<Array<{ id: string; data: RecommendationDoc }>> {
  const q = query(collection(db, "users", uid, "recommendations"), orderBy("score", "desc"), limit(take));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as RecommendationDoc }));
}

export async function listPublicJobs(take = 50): Promise<Array<{ id: string; data: JobDoc }>> {
  const q = query(collection(db, "jobs"), where("visibility", "==", "public"), orderBy("postedAt", "desc"), limit(take));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as JobDoc }));
}

export async function listInstituteJobs(instituteId: string, take = 50): Promise<Array<{ id: string; data: JobDoc }>> {
  const q = query(
    collection(db, "jobs"),
    where("visibility", "==", "institute"),
    where("instituteId", "==", instituteId),
    orderBy("postedAt", "desc"),
    limit(take)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as JobDoc }));
}

export async function getJobsByIds(ids: string[]): Promise<Record<string, JobDoc>> {
  const unique = Array.from(new Set(ids)).filter(Boolean);
  const out: Record<string, JobDoc> = {};
  await Promise.all(
    unique.map(async (id) => {
      const snap = await getDoc(doc(db, "jobs", id));
      if (snap.exists()) out[id] = snap.data() as JobDoc;
    })
  );
  return out;
}

export async function upsertApplicationForJob(args: {
  uid: string;
  instituteId?: string | null;
  jobId: string;
  status: ApplicationStatusKey;
  matchScore?: number;
  matchReasons?: string[];
  origin?: ApplicationDoc["origin"];
}) {
  const { uid, instituteId, jobId, status, matchScore, matchReasons, origin } = args;

  // deterministic id so it’s idempotent: userId__jobId
  const id = `${uid}__${jobId}`;
  const ref = doc(db, "applications", id);
  const snap = await getDoc(ref);

  const base: Partial<ApplicationDoc> = {
    userId: uid,
    instituteId: instituteId ?? null,
    jobId,
    status,
    matchScore: matchScore ?? null,
    matchReasons: matchReasons ?? [],
    origin: origin ?? { type: "platform" },
    updatedAt: serverTimestamp() as unknown as Timestamp,
  };

  if (!snap.exists()) {
    await setDoc(
      ref,
      {
        ...base,
        createdAt: serverTimestamp(),
        appliedAt: status === "applied" ? serverTimestamp() : null,
      },
      { merge: true }
    );
  } else {
    await updateDoc(ref, {
      ...base,
      appliedAt: status === "applied" ? serverTimestamp() : (snap.data() as ApplicationDoc).appliedAt ?? null,
    } as any);
  }

  // log
  await addDoc(collection(db, "applications", id, "logs"), {
    action: "status_changed",
    to: status,
    at: serverTimestamp(),
    by: uid,
  });

  return id;
}

export async function updateApplicationStatus(appId: string, uid: string, status: ApplicationStatusKey) {
  const ref = doc(db, "applications", appId);
  await updateDoc(ref, {
    status,
    updatedAt: serverTimestamp(),
    appliedAt: status === "applied" ? serverTimestamp() : null,
  } as any);
  await addDoc(collection(db, "applications", appId, "logs"), {
    action: "status_changed",
    to: status,
    at: serverTimestamp(),
    by: uid,
  });
}

export async function saveApplicationNotes(appId: string, uid: string, notes: string) {
  await updateDoc(doc(db, "applications", appId), { notes, updatedAt: serverTimestamp() } as any);
  await addDoc(collection(db, "applications", appId, "logs"), {
    action: "notes_updated",
    at: serverTimestamp(),
    by: uid,
  });
}

export async function requestResumeGeneration(args: {
  uid: string;
  jobId: string;
  applicationId?: string;
  model?: string;
}) {
  const { uid, jobId, applicationId, model } = args;

  // This creates a generation request record. In a full system, a Cloud Function/worker
  // reads this doc, generates LaTeX+PDF, uploads to Storage, then updates the application.
  const genRef = await addDoc(collection(db, "resume_generations"), {
    userId: uid,
    jobId,
    applicationId: applicationId ?? null,
    model: model ?? "llm",
    promptVersion: "v1",
    status: "pending",
    createdAt: serverTimestamp(),
  });

  if (applicationId) {
    await updateDoc(doc(db, "applications", applicationId), {
      status: "tailored",
      updatedAt: serverTimestamp(),
      tailoredResume: {
        genId: genRef.id,
        generatedAt: serverTimestamp(),
      },
    } as any);

    await addDoc(collection(db, "applications", applicationId, "logs"), {
      action: "resume_generated",
      meta: { genId: genRef.id },
      at: serverTimestamp(),
      by: uid,
    });
  }

  return genRef.id;
}

export async function listApplications(uid: string): Promise<Array<{ id: string; data: ApplicationDoc }>> {
  const q = query(collection(db, "applications"), where("userId", "==", uid), orderBy("updatedAt", "desc"), limit(200));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as ApplicationDoc }));
}

export async function addApplicationEvent(args: {
  applicationId: string;
  uid: string;
  type: "oa" | "interview" | "deadline" | "followup";
  scheduledAt: Date;
  title?: string;
  link?: string;
  description?: string;
}) {
  const { applicationId, uid, type, scheduledAt, title, link, description } = args;
  const ref = collection(db, "applications", applicationId, "events");
  await addDoc(ref, {
    type,
    scheduledAt: Timestamp.fromDate(scheduledAt),
    title: title ?? null,
    link: link ?? null,
    description: description ?? null,
    createdBy: uid,
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "applications", applicationId), {
    lastEventAt: Timestamp.fromDate(scheduledAt),
    updatedAt: serverTimestamp(),
  } as any);
}

export async function listUpcomingEvents(uid: string, take = 10) {
  // Firestore can’t easily query nested subcollections by user unless you use collectionGroup + userId on event docs.
  // Hackathon-safe approach: fetch apps and their next upcoming event.
  const apps = await listApplications(uid);
  const now = Timestamp.now();

  const results: Array<{ applicationId: string; jobId: string; event: any }> = [];

  await Promise.all(
    apps.map(async ({ id, data }) => {
      const evQ = query(collection(db, "applications", id, "events"), orderBy("scheduledAt", "asc"), limit(5));
      const snap = await getDocs(evQ);
      const upcoming = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) }))
        .filter((e) => e.scheduledAt && e.scheduledAt.toMillis() >= now.toMillis())
        .sort((a, b) => a.scheduledAt.toMillis() - b.scheduledAt.toMillis())[0];

      if (upcoming) results.push({ applicationId: id, jobId: jobIdFromAny(data.jobId), event: upcoming });
    })
  );

  return results
    .sort((a, b) => a.event.scheduledAt.toMillis() - b.event.scheduledAt.toMillis())
    .slice(0, take);
}

export async function listUserNotifications(uid: string, take = 50): Promise<Array<{ id: string; data: NotificationDoc }>> {
  const q = query(collection(db, "users", uid, "notifications"), orderBy("createdAt", "desc"), limit(take));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as NotificationDoc }));
}

export async function markNotificationRead(uid: string, notificationId: string) {
  await updateDoc(doc(db, "users", uid, "notifications", notificationId), { read: true } as any);
}

export async function markAllNotificationsRead(uid: string) {
  const q = query(collection(db, "users", uid, "notifications"), limit(200));
  const snap = await getDocs(q);
  if (snap.empty) return;

  const batch = writeBatch(db);
  snap.docs.forEach((d) => batch.update(d.ref, { read: true } as any));
  await batch.commit();
}

export async function saveUserConsents(uid: string, consents: UserDoc["consents"]) {
  await updateDoc(doc(db, "users", uid), { consents, updatedAt: serverTimestamp() } as any);
}

export async function createPrivateJobForUser(args: {
  uid: string;
  title: string;
  company: string;
  location?: string;
  jobType?: "Internship" | "Full-time";
  applyUrl?: string;
  jdText?: string;
  tags?: string[];
  source?: JobDoc["source"];
}) {
  const { uid, title, company, location, jobType, applyUrl, jdText, tags, source } = args;
  const ref = await addDoc(collection(db, "jobs"), {
    title,
    company,
    location: location ?? "",
    jobType: jobType ?? "Internship",
    applyUrl: applyUrl ?? "",
    jdText: jdText ?? "",
    tags: tags ?? [],
    source: source ?? "manual",
    visibility: "private",
    ownerUid: uid,
    instituteId: null,
    status: "open",
    postedAt: serverTimestamp(),
    lastSeenAt: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as any);
  return ref.id;
}

export async function exportUserData(uid: string) {
  const user = await getUserDoc(uid);
  const masterProfile = await getMasterProfile(uid);
  const recommendations = await listRecommendations(uid, 200);
  const notifications = await listUserNotifications(uid, 200);
  const applications = await listApplications(uid);

  // Fetch referenced jobs
  const jobIds = applications.map((a) => jobIdFromAny(a.data.jobId));
  const jobs = await getJobsByIds(jobIds);

  return {
    exportedAt: new Date().toISOString(),
    user,
    masterProfile,
    recommendations: recommendations.map((r) => ({ id: r.id, ...r.data })),
    notifications: notifications.map((n) => ({ id: n.id, ...n.data })),
    applications: applications.map((a) => ({ id: a.id, ...a.data })),
    jobs,
  };
}

async function deleteDocsChunk(refs: any[]) {
  const batch = writeBatch(db);
  refs.forEach((r) => batch.delete(r));
  await batch.commit();
}

export async function deleteUserData(uid: string) {
  // Mark requested deletion (useful even if client deletion is interrupted)
  try {
    await updateDoc(doc(db, "users", uid), { deleteRequestedAt: serverTimestamp(), updatedAt: serverTimestamp() } as any);
  } catch {
    // ignore
  }

  // Delete master profile
  await deleteDoc(doc(db, "users", uid, "master_profile", "main")).catch(() => void 0);
  await updateDoc(doc(db, "users", uid), { updatedAt: serverTimestamp() } as any).catch(() => void 0);

  // Delete subcollections: recommendations + notifications
  const recSnap = await getDocs(query(collection(db, "users", uid, "recommendations"), limit(500)));
  if (!recSnap.empty) {
    await deleteDocsChunk(recSnap.docs.map((d) => d.ref) as any);
  }

  const notifSnap = await getDocs(query(collection(db, "users", uid, "notifications"), limit(500)));
  if (!notifSnap.empty) {
    await deleteDocsChunk(notifSnap.docs.map((d) => d.ref) as any);
  }

  // Delete applications + their child docs (events/logs)
  const appsSnap = await getDocs(query(collection(db, "applications"), where("userId", "==", uid), limit(200)));
  for (const appDoc of appsSnap.docs) {
    const appId = appDoc.id;
    const eventsSnap = await getDocs(query(collection(db, "applications", appId, "events"), limit(500)));
    if (!eventsSnap.empty) await deleteDocsChunk(eventsSnap.docs.map((d) => d.ref) as any);

    const logsSnap = await getDocs(query(collection(db, "applications", appId, "logs"), limit(500)));
    if (!logsSnap.empty) await deleteDocsChunk(logsSnap.docs.map((d) => d.ref) as any);

    await deleteDocsChunk([appDoc.ref] as any);
  }

  // Finally delete the user doc itself.
  // Note: this does NOT delete Firebase Auth user; that requires Admin SDK.
  await deleteDocsChunk([doc(db, "users", uid)] as any);
}
