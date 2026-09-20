import { expect, test } from "@playwright/test";

const recordId = 1;

function headers(role: string, userId: number) {
  return {
    "x-mock-role": role,
    "x-mock-user-id": String(userId),
  };
}

test.describe("note visibility", () => {
  test("private notes are visible to their author", async ({ request }) => {
    const response = await request.get(`/api/notes?recordId=${recordId}`, {
      headers: headers("doctor", 1),
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    const contents = body.data.notes.map((note: { content: string }) => note.content);

    expect(contents).toContain("Private doctor note.");
  });

  test("private notes from another author are hidden", async ({ request }) => {
    const response = await request.get(`/api/notes?recordId=${recordId}`, {
      headers: headers("nurse", 2),
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    const contents = body.data.notes.map((note: { content: string }) => note.content);

    expect(contents).not.toContain("Private doctor note.");
  });

  test("healthcare notes are visible to healthcare staff", async ({ request }) => {
    const response = await request.get(`/api/notes?recordId=${recordId}`, {
      headers: headers("nurse", 2),
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    const contents = body.data.notes.map((note: { content: string }) => note.content);

    expect(contents).toContain("Follow-up in six months.");
  });

  test("patient cannot read private or healthcare notes", async ({ request }) => {
    const response = await request.get(`/api/notes?recordId=${recordId}`, {
      headers: headers("patient", 4),
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    const contents = body.data.notes.map((note: { content: string }) => note.content);

    expect(contents).not.toContain("Private doctor note.");
    expect(contents).not.toContain("Follow-up in six months.");
    expect(body.data.hiddenNotesCount).toBe(2);
  });

  test("all notes are visible to patient", async ({ request }) => {
    const response = await request.get(`/api/notes?recordId=${recordId}`, {
      headers: headers("patient", 4),
    });

    expect(response.status()).toBe(200);

    const body = await response.json();
    const contents = body.data.notes.map((note: { content: string }) => note.content);

    expect(contents).toContain("Visible to everyone with journal access.");
  });

  test("unauthenticated GET is rejected", async ({ request }) => {
    const response = await request.get(`/api/notes?recordId=${recordId}`);

    expect(response.status()).toBe(401);
  });
});

test.describe("create notes", () => {
  test("healthcare staff can create a note", async ({ request }) => {
    const response = await request.post("/api/notes", {
      headers: headers("doctor", 1),
      data: {
        recordId,
        content: "Created by Playwright.",
        visibility: "private",
      },
    });

    expect(response.status()).toBe(201);

    const body = await response.json();

    expect(body.data.note.content).toBe("Created by Playwright.");
    expect(body.data.note.visibility).toBe("private");
    expect(body.data.note.authorUserId).toBe(1);
  });

  test("patient cannot create notes", async ({ request }) => {
    const response = await request.post("/api/notes", {
      headers: headers("patient", 4),
      data: {
        recordId,
        content: "Patient should not create this.",
        visibility: "all",
      },
    });

    expect(response.status()).toBe(403);
  });

  test("empty note content is rejected", async ({ request }) => {
    const response = await request.post("/api/notes", {
      headers: headers("doctor", 1),
      data: {
        recordId,
        content: "",
        visibility: "private",
      },
    });

    expect(response.status()).toBe(400);
  });

  test("invalid visibility is rejected", async ({ request }) => {
    const response = await request.post("/api/notes", {
      headers: headers("doctor", 1),
      data: {
        recordId,
        content: "Invalid visibility.",
        visibility: "secret",
      },
    });

    expect(response.status()).toBe(400);
  });

  test("unauthenticated note creation is rejected", async ({ request }) => {
    const response = await request.post("/api/notes", {
      data: {
        recordId,
        content: "Unauthenticated.",
        visibility: "private",
      },
    });

    expect(response.status()).toBe(401);
  });
});

test.describe("edit and delete notes", () => {
  test("author can edit own note", async ({ request }) => {
    const response = await request.patch("/api/notes/2", {
      headers: headers("doctor", 1),
      data: {
        content: "Updated private doctor note.",
      },
    });

    expect(response.status()).toBe(200);

    const body = await response.json();

    expect(body.data.note.content).toBe("Updated private doctor note.");
  });

  test("another user cannot edit the note", async ({ request }) => {
    const response = await request.patch("/api/notes/2", {
      headers: headers("nurse", 2),
      data: {
        content: "Should not work.",
      },
    });

    expect(response.status()).toBe(403);
  });

  test("author can delete own note", async ({ request }) => {
    const createResponse = await request.post("/api/notes", {
      headers: headers("doctor", 1),
      data: {
        recordId,
        content: "Temporary note for deletion.",
        visibility: "private",
      },
    });

    expect(createResponse.status()).toBe(201);

    const createBody = await createResponse.json();
    const noteId = createBody.data.note.id;

    const deleteResponse = await request.delete(`/api/notes/${noteId}`, {
      headers: headers("doctor", 1),
    });

    expect(deleteResponse.status()).toBe(200);

    const deleteBody = await deleteResponse.json();
    expect(deleteBody.data.deletedId).toBe(noteId);
  });

  test("another user cannot delete the note", async ({ request }) => {
    const response = await request.delete("/api/notes/1", {
      headers: headers("doctor", 1),
    });

    expect(response.status()).toBe(403);
  });
});
