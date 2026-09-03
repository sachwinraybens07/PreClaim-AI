import prisma from "../database/prisma";

interface Filters {
  payer?: string;
  procedure?: string;
  reason?: string;
}

export async function getDenialAnalytics(filters: Filters) {
  const records = await prisma.denialRecord.findMany({
    where: {
      ...(filters.payer ? { payer: filters.payer } : {}),
      ...(filters.procedure ? { procedure: filters.procedure } : {}),
      ...(filters.reason ? { reason: filters.reason } : {}),
    },
    orderBy: { date: "desc" },
  });

  const total = records.length || 1;
  const reasonCounts = new Map<string, number>();
  for (const r of records) {
    reasonCounts.set(r.reason, (reasonCounts.get(r.reason) || 0) + 1);
  }

  const topDenialReasons = [...reasonCounts.entries()]
    .map(([reason, count]) => ({ reason, count, percentage: Math.round((count / total) * 100) }))
    .sort((a, b) => b.count - a.count);

  const payerCounts = new Map<string, number>();
  for (const r of records) payerCounts.set(r.payer, (payerCounts.get(r.payer) || 0) + 1);

  const allPayers = [...new Set((await prisma.denialRecord.findMany()).map((r) => r.payer))];
  const allProcedures = [...new Set((await prisma.denialRecord.findMany()).map((r) => r.procedure))];
  const allReasons = [...new Set((await prisma.denialRecord.findMany()).map((r) => r.reason))];

  const mostCommonReason = topDenialReasons[0]?.reason || "N/A";
  const authRecords = records.filter((r) => r.reason === "Authorization");
  const highestRiskWorkflow = authRecords.length / total >= 0.2 ? "Prior Authorization" : "Documentation Collection";

  return {
    topDenialReasons,
    records: records.slice(0, 50).map((r) => ({
      id: r.id,
      payer: r.payer,
      procedure: r.procedure,
      diagnosis: r.diagnosis,
      reason: r.reason,
      outcome: r.outcome,
      date: r.date,
    })),
    filters: { payers: allPayers, procedures: allProcedures, reasons: allReasons },
    insights: {
      mostCommonDenialFactor: mostCommonReason,
      highestRiskWorkflow,
      totalRecords: records.length,
    },
  };
}
