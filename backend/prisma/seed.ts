import "dotenv/config";
import prisma from "../src/database/prisma";
import { ensureDemoUser } from "../src/services/authService";
import { createCase, analyzeCase } from "../src/services/caseService";
import { buildDocumentChecklist } from "../src/ai/requirementsEngine";

interface SeedCase {
  patientName: string;
  patientIdentifier: string;
  dateOfBirth: string;
  payer: string;
  planName: string;
  memberId: string;
  diagnosis: string;
  diagnosisCode: string;
  procedure: string;
  procedureCode: string;
  provider: string;
  treatmentDate: string;
  urgency: "STANDARD" | "URGENT" | "EMERGENCY";
  missingTypes: string[];
  finalStatus?: string;
  completeActions?: boolean;
}

const seedCases: SeedCase[] = [
  {
    patientName: "Maria Gonzalez",
    patientIdentifier: "PT-20391",
    dateOfBirth: "1978-03-14",
    payer: "Aetna",
    planName: "Aetna Choice POS II",
    memberId: "AET-88213",
    diagnosis: "Routine colorectal screening",
    diagnosisCode: "Z12.11",
    procedure: "Colonoscopy",
    procedureCode: "45378",
    provider: "Dr. Alan Reyes",
    treatmentDate: "2026-09-10",
    urgency: "STANDARD",
    missingTypes: [],
    finalStatus: "COMPLETED",
  },
  {
    patientName: "Linda Chen",
    patientIdentifier: "PT-20455",
    dateOfBirth: "1990-07-22",
    payer: "Blue Cross Blue Shield",
    planName: "BCBS PPO",
    memberId: "BCBS-44120",
    diagnosis: "Rotator cuff strain",
    diagnosisCode: "M75.101",
    procedure: "Physical Therapy",
    procedureCode: "97110",
    provider: "Dr. Priya Nair",
    treatmentDate: "2026-09-08",
    urgency: "STANDARD",
    missingTypes: [],
    finalStatus: "SUBMITTED",
  },
  {
    patientName: "David Thompson",
    patientIdentifier: "PT-20502",
    dateOfBirth: "1955-11-02",
    payer: "Medicare",
    planName: "Medicare Part B",
    memberId: "MCR-11029",
    diagnosis: "Routine colorectal screening",
    diagnosisCode: "Z12.11",
    procedure: "Colonoscopy",
    procedureCode: "45378",
    provider: "Dr. Alan Reyes",
    treatmentDate: "2026-09-12",
    urgency: "STANDARD",
    missingTypes: [],
  },
  {
    patientName: "Patricia Brown",
    patientIdentifier: "PT-20588",
    dateOfBirth: "1982-05-30",
    payer: "Humana",
    planName: "Humana Gold Plus",
    memberId: "HUM-77410",
    diagnosis: "Chronic lower back pain",
    diagnosisCode: "M54.50",
    procedure: "MRI Lumbar Spine",
    procedureCode: "72148",
    provider: "Dr. Karen Osei",
    treatmentDate: "2026-09-15",
    urgency: "STANDARD",
    missingTypes: ["MEDICAL_NECESSITY_LETTER"],
  },
  {
    patientName: "Michael Davis",
    patientIdentifier: "PT-20612",
    dateOfBirth: "1988-01-19",
    payer: "UnitedHealthcare",
    planName: "UHC Choice Plus",
    memberId: "UHC-55871",
    diagnosis: "Migraine with aura",
    diagnosisCode: "G43.109",
    procedure: "MRI Brain",
    procedureCode: "70551",
    provider: "Dr. Karen Osei",
    treatmentDate: "2026-09-11",
    urgency: "STANDARD",
    missingTypes: ["MEDICAL_NECESSITY_LETTER"],
  },
  {
    patientName: "William Garcia",
    patientIdentifier: "PT-20674",
    dateOfBirth: "1975-09-08",
    payer: "Cigna",
    planName: "Cigna Open Access Plus",
    memberId: "CIG-33012",
    diagnosis: "Suspected obstructive sleep apnea",
    diagnosisCode: "G47.33",
    procedure: "Sleep Study",
    procedureCode: "95810",
    provider: "Dr. Noah Bennett",
    treatmentDate: "2026-09-18",
    urgency: "STANDARD",
    missingTypes: ["DIAGNOSTIC_REPORT", "PRIOR_AUTHORIZATION_FORM"],
  },
  {
    patientName: "Jennifer Lee",
    patientIdentifier: "PT-20733",
    dateOfBirth: "1993-12-27",
    payer: "Aetna",
    planName: "Aetna Choice POS II",
    memberId: "AET-90144",
    diagnosis: "Chronic abdominal pain",
    diagnosisCode: "R10.9",
    procedure: "CT Scan Abdomen",
    procedureCode: "74176",
    provider: "Dr. Alan Reyes",
    treatmentDate: "2026-09-09",
    urgency: "URGENT",
    missingTypes: ["DIAGNOSTIC_REPORT", "MEDICAL_NECESSITY_LETTER", "PRIOR_AUTHORIZATION_FORM"],
  },
  {
    // Primary demo case — must be the 8th case created so it lands on CASE-1048.
    patientName: "John Davis",
    patientIdentifier: "PT-20841",
    dateOfBirth: "1969-04-06",
    payer: "UnitedHealthcare",
    planName: "UHC Choice Plus",
    memberId: "UHC-40218",
    diagnosis: "Chronic knee pain",
    diagnosisCode: "M25.561",
    procedure: "MRI Knee",
    procedureCode: "73721",
    provider: "Dr. Karen Osei",
    treatmentDate: "2026-09-14",
    urgency: "STANDARD",
    missingTypes: ["DIAGNOSTIC_REPORT", "MEDICAL_NECESSITY_LETTER", "PRIOR_AUTHORIZATION_FORM"],
  },
  {
    patientName: "James Wilson",
    patientIdentifier: "PT-20902",
    dateOfBirth: "1961-06-17",
    payer: "Medicare",
    planName: "Medicare Advantage",
    memberId: "MCR-22981",
    diagnosis: "Severe osteoarthritis, right knee",
    diagnosisCode: "M17.11",
    procedure: "Total Knee Replacement",
    procedureCode: "27447",
    provider: "Dr. Karen Osei",
    treatmentDate: "2026-09-20",
    urgency: "STANDARD",
    missingTypes: ["DIAGNOSTIC_REPORT", "MEDICAL_NECESSITY_LETTER", "PRIOR_AUTHORIZATION_FORM"],
  },
  {
    patientName: "Robert Kim",
    patientIdentifier: "PT-20955",
    dateOfBirth: "1972-02-11",
    payer: "Cigna",
    planName: "Cigna Open Access Plus",
    memberId: "CIG-38820",
    diagnosis: "Degenerative disc disease, lumbar",
    diagnosisCode: "M51.36",
    procedure: "Spinal Fusion Surgery",
    procedureCode: "22612",
    provider: "Dr. Noah Bennett",
    treatmentDate: "2026-09-22",
    urgency: "URGENT",
    missingTypes: ["DIAGNOSTIC_REPORT", "MEDICAL_NECESSITY_LETTER", "PRIOR_AUTHORIZATION_FORM"],
  },
  {
    patientName: "Susan Martinez",
    patientIdentifier: "PT-21004",
    dateOfBirth: "1965-10-25",
    payer: "Blue Cross Blue Shield",
    planName: "BCBS PPO",
    memberId: "BCBS-51203",
    diagnosis: "Chest pain, suspected coronary artery disease",
    diagnosisCode: "I25.10",
    procedure: "Cardiac Catheterization",
    procedureCode: "93458",
    provider: "Dr. Noah Bennett",
    treatmentDate: "2026-09-13",
    urgency: "URGENT",
    missingTypes: ["DIAGNOSTIC_REPORT", "MEDICAL_NECESSITY_LETTER", "PRIOR_AUTHORIZATION_FORM"],
  },
  {
    patientName: "Emily Rodriguez",
    patientIdentifier: "PT-21077",
    dateOfBirth: "1997-08-03",
    payer: "Humana",
    planName: "Humana Gold Plus",
    memberId: "HUM-60218",
    diagnosis: "Multi-system trauma following motor vehicle collision",
    diagnosisCode: "T07",
    procedure: "Emergency Trauma Evaluation",
    procedureCode: "99284",
    provider: "Dr. Noah Bennett",
    treatmentDate: "2026-09-03",
    urgency: "EMERGENCY",
    missingTypes: ["PRESCRIPTION"],
  },
];

const DENIAL_REASONS = ["Missing Documentation", "Authorization", "Eligibility", "Coding", "Medical Necessity"] as const;

function randomDate(daysBack: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * daysBack));
  return d;
}

async function seedDenialRecords() {
  await prisma.denialRecord.deleteMany();

  // Pinned historical records for the primary demo case so the risk engine's
  // "Historical Pattern" factor and confidence calculation are deterministic.
  await prisma.denialRecord.createMany({
    data: [
      {
        payer: "UnitedHealthcare",
        procedure: "MRI Knee",
        diagnosis: "Chronic knee pain",
        reason: "Missing Documentation",
        outcome: "DENIED",
        date: randomDate(180),
      },
      {
        payer: "UnitedHealthcare",
        procedure: "MRI Knee",
        diagnosis: "Chronic knee pain",
        reason: "Authorization",
        outcome: "DENIED",
        date: randomDate(180),
      },
      {
        payer: "UnitedHealthcare",
        procedure: "MRI Knee",
        diagnosis: "Chronic knee pain",
        reason: "Missing Documentation",
        outcome: "APPROVED",
        date: randomDate(180),
      },
    ],
  });

  // Broad historical dataset approximating the spec's denial-reason mix:
  // Missing Documentation 34%, Authorization 27%, Eligibility 18%, Coding 12%, Medical Necessity 9%.
  const distribution: { reason: (typeof DENIAL_REASONS)[number]; count: number }[] = [
    { reason: "Missing Documentation", count: 15 },
    { reason: "Authorization", count: 12 },
    { reason: "Eligibility", count: 8 },
    { reason: "Coding", count: 5 },
    { reason: "Medical Necessity", count: 4 },
  ];

  const payers = ["UnitedHealthcare", "Aetna", "Cigna", "Blue Cross Blue Shield", "Medicare", "Humana"];
  const procedures = [
    "MRI Knee",
    "MRI Brain",
    "MRI Lumbar Spine",
    "CT Scan Abdomen",
    "Physical Therapy",
    "Colonoscopy",
    "Spinal Fusion Surgery",
    "Sleep Study",
    "Cardiac Catheterization",
    "Total Knee Replacement",
  ];
  const diagnoses = [
    "Chronic knee pain",
    "Migraine with aura",
    "Lower back pain",
    "Abdominal pain",
    "Rotator cuff strain",
    "Routine screening",
    "Degenerative disc disease",
    "Suspected sleep apnea",
    "Suspected coronary artery disease",
    "Osteoarthritis",
  ];

  const rows = [];
  for (const bucket of distribution) {
    for (let i = 0; i < bucket.count; i++) {
      rows.push({
        payer: payers[Math.floor(Math.random() * payers.length)],
        procedure: procedures[Math.floor(Math.random() * procedures.length)],
        diagnosis: diagnoses[Math.floor(Math.random() * diagnoses.length)],
        reason: bucket.reason,
        outcome: Math.random() > 0.15 ? "DENIED" : "APPROVED",
        date: randomDate(365),
      });
    }
  }
  await prisma.denialRecord.createMany({ data: rows });
}

async function main() {
  console.log("Seeding PreClaim AI demo data...");

  await prisma.copilotMessage.deleteMany();
  await prisma.simulation.deleteMany();
  await prisma.action.deleteMany();
  await prisma.riskFactor.deleteMany();
  await prisma.document.deleteMany();
  await prisma.case.deleteMany();
  await prisma.insurance.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  await ensureDemoUser();
  await seedDenialRecords();

  for (const seedCase of seedCases) {
    const checklist = buildDocumentChecklist(seedCase.payer, seedCase.procedure, seedCase.urgency);
    const availableDocumentTypes = checklist
      .map((item) => item.type)
      .filter((type) => !seedCase.missingTypes.includes(type));

    const created = await createCase({
      patientName: seedCase.patientName,
      patientIdentifier: seedCase.patientIdentifier,
      dateOfBirth: seedCase.dateOfBirth,
      payer: seedCase.payer,
      planName: seedCase.planName,
      memberId: seedCase.memberId,
      diagnosis: seedCase.diagnosis,
      diagnosisCode: seedCase.diagnosisCode,
      procedure: seedCase.procedure,
      procedureCode: seedCase.procedureCode,
      provider: seedCase.provider,
      treatmentDate: seedCase.treatmentDate,
      urgency: seedCase.urgency,
      availableDocumentTypes,
    });

    await analyzeCase(created.id);

    if (seedCase.finalStatus) {
      await prisma.case.update({ where: { id: created.id }, data: { status: seedCase.finalStatus } });
    }

    console.log(`  Created ${created.caseNumber} — ${seedCase.patientName}`);
  }

  const johnDavis = await prisma.case.findFirst({ where: { patient: { name: "John Davis" } } });
  if (johnDavis) {
    console.log(
      `\nPrimary demo case ${johnDavis.caseNumber}: risk=${johnDavis.riskScore} level=${johnDavis.riskLevel} confidence=${johnDavis.confidence}`
    );
  }

  console.log("\nSeed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
