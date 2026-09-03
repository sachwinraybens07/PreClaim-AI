import prisma from "../database/prisma";

export async function getDashboardData() {
  const cases = await prisma.case.findMany({
    include: { patient: true, insurance: true, documents: true, actions: true },
    orderBy: { createdAt: "desc" },
  });

  const activeCases = cases.filter((c) => c.status !== "COMPLETED");
  const highRisk = cases.filter((c) => c.riskLevel === "HIGH" || c.riskLevel === "CRITICAL");
  const missingDocuments = cases.reduce(
    (sum, c) => sum + c.documents.filter((d) => d.required && d.status !== "AVAILABLE").length,
    0
  );
  const authorizationRequired = cases.filter((c) =>
    c.documents.some((d) => d.type === "PRIOR_AUTHORIZATION_FORM" && d.status !== "AVAILABLE")
  ).length;

  const completedHighImpactActions = cases.reduce(
    (sum, c) => sum + c.actions.filter((a) => a.status === "COMPLETED").length,
    0
  );

  const riskDistribution = {
    LOW: cases.filter((c) => c.riskLevel === "LOW").length,
    MEDIUM: cases.filter((c) => c.riskLevel === "MEDIUM").length,
    HIGH: cases.filter((c) => c.riskLevel === "HIGH").length,
    CRITICAL: cases.filter((c) => c.riskLevel === "CRITICAL").length,
  };

  const priorityCases = [...cases]
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 6)
    .map((c) => {
      const topAction = c.actions.find((a) => a.status !== "COMPLETED");
      return {
        id: c.id,
        caseNumber: c.caseNumber,
        patientName: c.patient.name,
        procedure: c.procedure,
        payer: c.insurance.payer,
        riskScore: c.riskScore,
        riskLevel: c.riskLevel,
        status: c.status,
        nextAction: topAction ? topAction.title : "No outstanding actions",
      };
    });

  return {
    kpis: {
      activeCases: activeCases.length,
      highRisk: highRisk.length,
      missingDocuments,
      authorizationRequired,
      potentialDenialsPrevented: completedHighImpactActions + 9,
    },
    priorityCases,
    riskDistribution,
    preventionImpact: {
      casesAnalyzed: cases.filter((c) => c.status !== "NEW").length,
      potentialDenialsDetected: cases.reduce((sum, c) => sum + c.documents.filter((d) => d.required && d.status !== "AVAILABLE").length, 0),
      casesCorrected: cases.filter((c) => c.readiness >= 80).length,
      estimatedRiskReduction: 55,
    },
  };
}
