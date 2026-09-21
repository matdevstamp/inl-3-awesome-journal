import { expect, test, type APIRequestContext } from "@playwright/test";

const recordId = 1;
const anotherRecordId = 2;

// Every test that POSTs a note must register the returned id here.
// test.afterEach deletes them all, so the suite is idempotent — reruns don't
// accumulate throwaway private notes onto a shared record, which would
// otherwise skew hiddenNotesCount.
const createdNoteIds: number[] = [];

test.afterEach(async ({ request }) => {
  // All throwaway notes are authored by dr_test namesake, but a failed 403
  // path (e.g. cross-user delete) can leave the session bound to nurse/patient.
  // Re-assert the author's identity first so the drain actually succeeds.
  if (createdNoteIds.length > 0) {
    await loginAs(request, "dr_test");
  }

  while (createdNoteIds.length > 0) {
    const id = createdNoteIds.pop()!;
    await request.delete(`/api/notes/${id}`);
  }
});

const CREDENTIALS: Record<string, { username: string; password: string }> = {
  dr_test: { username: "dr_test", password: "test123" },
  nurse_test: { username: "nurse_test", password: "test123" },
  patient_test: { username: "patient_test", password: "test123" },
};

async function loginAs(request: APIRequestContext, user: keyof typeof CREDENTIALS) {
  const credentials = CREDENTIALS[user];
  if (!credentials) throw new Error(`No credentials for ${user}`);
  const { username, password } = credentials;
  const login = await request.post("/api/auth/login", {
    data: { username, password },
  });
  expect(login.status()).toBe(200);
}

test.describe("note visibility", () => {
  test("private notes are visible to their author", async ({ request }) => {
    await loginAs(request, "dr_test");

    const response = await request.get(`/api/notes?recordId=${recordId}`);

    expect(response.status()).toBe(200);

    const body = await response.json();
    const contents = body.data.notes.map((note: { text: string }) => note.text);

    expect(contents).toContain("Private doctor note.");
  });

  test("private notes from another author are hidden", async ({ request }) => {
    await loginAs(request, "nurse_test");

    const response = await request.get(`/api/notes?recordId=${recordId}`);

    expect(response.status()).toBe(200);

    const body = await response.json();
    const contents = body.data.notes.map((note: { text: string }) => note.text);

    expect(contents).not.toContain("Private doctor note.");
  });

  test("healthcare notes are visible to healthcare staff", async ({ request }) => {
    await loginAs(request, "nurse_test");

    const response = await request.get(`/api/notes?recordId=${recordId}`);

    expect(response.status()).toBe(200);

    const body = await response.json();
    const contents = body.data.notes.map((note: { text: string }) => note.text);

    expect(contents).toContain("Follow-up in six months.");
  });

  test("patient cannot read private or healthcare notes", async ({ request }) => {
    await loginAs(request, "patient_test");

    const response = await request.get(`/api/notes?recordId=${recordId}`);

    expect(response.status()).toBe(200);

    const body = await response.json();
    const contents = body.data.notes.map((note: { text: string }) => note.text);

    expect(contents).not.toContain("Private doctor note.");
    expect(contents).not.toContain("Follow-up in six months.");
    expect(body.data.hiddenNotesCount).toBe(2);
  });

  test("all notes are visible to everyone with journal access", async ({ request }) => {
    await loginAs(request, "patient_test");

    const response = await request.get(`/api/notes?recordId=${recordId}`);

    expect(response.status()).toBe(200);

    const body = await response.json();
    const contents = body.data.notes.map((note: { text: string }) => note.text);

    expect(contents).toContain("Visible to everyone with journal access.");
  });

  test("patient cannot read another patient's notes", async ({ request }) => {
    await loginAs(request, "patient_test");

    const response = await request.get(`/api/notes?recordId=${anotherRecordId}`);

    expect(response.status()).toBe(403);

    const body = await response.json();

    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  test("unauthenticated note listing is rejected", async ({ request }) => {
    const response = await request.get(`/api/notes?recordId=${recordId}`);

    expect(response.status()).toBe(401);
  });

  test("rejects forged mock headers without a session", async ({ request }) => {
    const response = await request.get(`/api/notes?recordId=${recordId}`, {
      headers: { "x-mock-role": "doctor", "x-mock-user-id": "1" },
    });

    expect(response.status()).toBe(401);

    const body = await response.json();

    expect(body.ok).toBe(false);
  });
});

test.describe("create notes", () => {
  test("healthcare staff can create a note", async ({ request }) => {
    await loginAs(request, "dr_test");

    const response = await request.post("/api/notes", {
      data: {
        recordId,
        text: "Created by Playwright.",
        visibility: "private",
      },
    });

    expect(response.status()).toBe(201);

    const body = await response.json();

    expect(body.data.note.text).toBe("Created by Playwright.");
    expect(body.data.note.visibility).toBe("private");
    expect(body.data.note.authorUserId).toBe(1);

    createdNoteIds.push(body.data.note.id);
  });

  test("patient cannot create notes", async ({ request }) => {
    await loginAs(request, "patient_test");

    const response = await request.post("/api/notes", {
      data: {
        recordId,
        text: "Patient should not create this.",
        visibility: "private",
      },
    });

    expect(response.status()).toBe(403);
  });

  test("empty note text is rejected", async ({ request }) => {
    await loginAs(request, "dr_test");

    const response = await request.post("/api/notes", {
      data: {
        recordId,
        text: "",
        visibility: "private",
      },
    });

    expect(response.status()).toBe(400);
  });

  test("invalid visibility is rejected", async ({ request }) => {
    await loginAs(request, "dr_test");

    const response = await request.post("/api/notes", {
      data: {
        recordId,
        text: "Invalid visibility.",
        visibility: "secret",
      },
    });

    expect(response.status()).toBe(400);
  });

  test("unauthenticated note creation is rejected", async ({ request }) => {
    const response = await request.post("/api/notes", {
      data: {
        recordId,
        text: "Unauthenticated.",
        visibility: "private",
      },
    });

    expect(response.status()).toBe(401);
  });
});

test.describe("edit and delete notes", () => {
  test("author can edit own note", async ({ request }) => {
    await loginAs(request, "dr_test");

    const createResponse = await request.post("/api/notes", {
      data: {
        recordId,
        text: "Temporary note for editing.",
        visibility: "private",
      },
    });

    expect(createResponse.status()).toBe(201);

    const createBody = await createResponse.json();
    const noteId = createBody.data.note.id;

    createdNoteIds.push(noteId);

    const response = await request.patch(`/api/notes/${noteId}`, {
      data: {
        text: "Updated temporary note.",
      },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(body.data.note.text).toBe("Updated temporary note.");
  });

  test("another user cannot edit the note", async ({ request }) => {
    await loginAs(request, "nurse_test");

    const response = await request.patch("/api/notes/2", {
      data: {
        text: "Should not work.",
      },
    });

    expect(response.status()).toBe(403);
  });

  test("author can delete own note", async ({ request }) => {
    await loginAs(request, "dr_test");

    const createResponse = await request.post("/api/notes", {
      data: {
        recordId,
        text: "Temporary note for deletion.",
        visibility: "private",
      },
    });

    expect(createResponse.status()).toBe(201);

    const createBody = await createResponse.json();
    const noteId = createBody.data.note.id;

    createdNoteIds.push(noteId);

    const response = await request.delete(`/api/notes/${noteId}`);

    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(body.data.deletedId).toBe(noteId);
  });

  test("another user cannot delete the note", async ({ request }) => {
    await loginAs(request, "dr_test");

    const createResponse = await request.post("/api/notes", {
      data: {
        recordId,
        text: "Temporary note for cross-user delete.",
        visibility: "private",
      },
    });

    expect(createResponse.status()).toBe(201);

    const createBody = await createResponse.json();
    const noteId = createBody.data.note.id;

    createdNoteIds.push(noteId);

    await loginAs(request, "nurse_test");

    const response = await request.delete(`/api/notes/${noteId}`);

    expect(response.status()).toBe(403);
  });
});
