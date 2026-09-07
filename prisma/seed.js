// prisma/seed.js — fictional seed data for local development.
// Run with: npm run db:seed   (after `npm run db:up && npm run db:migrate`)
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const PASSWORD = "test123";

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const [hospital, ambulance] = await Promise.all([
    prisma.organization.upsert({
      where: { id: 1 },
      update: {},
      create: { id: 1, name: "Stadsjukhuset", type: "hospital" },
    }),
    prisma.organization.upsert({
      where: { id: 2 },
      update: {},
      create: { id: 2, name: "Ambulans Syd", type: "ambulance service" },
    }),
  ]);

  const users = [
    { id: 1, username: "dr_test", role: "doctor", organizationId: hospital.id },
    { id: 2, username: "nurse_test", role: "nurse", organizationId: hospital.id },
    { id: 3, username: "amb_test", role: "ambulance", organizationId: ambulance.id },
    { id: 4, username: "patient_test", role: "patient", organizationId: null },
    { id: 5, username: "unauth_test", role: "unauthorized", organizationId: null },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { id: user.id },
      update: {},
      create: { ...user, passwordHash },
    });
  }

  const patient = await prisma.patient.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      personalNumber: "199001011234",
      firstName: "Anna",
      lastName: "Andersson",
      dateOfBirth: new Date("1990-01-01"),
    },
  });

  const record = await prisma.medicalRecord.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      recordType: "diagnosis",
      content: "Mild asthma — inhaler prescribed.",
      patientId: patient.id,
      authorId: 1,
    },
  });

  await prisma.note.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      content: "Follow-up in six months.",
      visibility: "healthcare",
      recordId: record.id,
      authorId: 2,
    },
  });

  console.log("Seeded organizations, users (pw: test123), patient Anna, one record + note.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
