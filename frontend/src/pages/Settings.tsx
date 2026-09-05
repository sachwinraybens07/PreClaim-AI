import { AppLayout } from "../components/layout/AppLayout";
import { Card, CardContent } from "../components/ui/Card";
import { useAuth } from "../hooks/useAuth";
import { PayerBadge } from "../components/ui/Badge";
import { ShieldCheck, Sliders, UserCheck } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  return (
    <AppLayout title="Workspace Settings" subtitle="Organization settings, configured payer rulebases, and risk threshold calibration.">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* User & Hospital Profile */}
        <Card className="shadow-card">
          <div className="flex items-center gap-3 border-b border-slate-100/90 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <UserCheck className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">User Profile & Institutional Affiliation</h3>
              <p className="text-xs text-slate-500">Authenticated clinician credentials and organizational assignment</p>
            </div>
          </div>
          <CardContent className="p-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
                <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Practitioner Name</p>
                <p className="mt-1 text-sm font-bold text-slate-800">{user?.name || "Sarah Chen"}</p>
                <p className="mt-0.5 text-xs text-slate-500">{user?.email}</p>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
                <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Assigned Operational Role</p>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  {user?.role?.replace(/_/g, " ") || "RCM MANAGER"}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">Revenue Cycle Management & Denial Triage</p>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
                <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Health System Organization</p>
                <p className="mt-1 text-sm font-bold text-slate-800">MetroHealth Memorial Hospital System</p>
                <p className="mt-0.5 text-xs text-slate-500">Facility NPI: 1942850182 · Region: Great Lakes</p>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4">
                <p className="text-2xs font-bold uppercase tracking-wider text-slate-400">Session Security State</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-green-500" />
                  <p className="text-sm font-bold text-slate-800">Authenticated (Demo Token Active)</p>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">Auto-refresh enabled · 30-minute idle timeout</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Engine Rules & Payer Coverage Matrices */}
        <Card className="shadow-card">
          <div className="flex items-center gap-3 border-b border-slate-100/90 px-6 py-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Pre-Submission Rules Configuration</h3>
              <p className="text-xs text-slate-500">Configured policy threshold limits and active payer guideline databases</p>
            </div>
          </div>
          <CardContent className="space-y-5 p-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Configured Payer Guidelines</p>
              <p className="mt-0.5 text-xs text-slate-500">
                The pre-submission workflow validates against configured commercial and public guidelines in this demo environment:
              </p>
              <div className="mt-3 flex flex-wrap gap-2.5">
                {[
                  "UnitedHealthcare",
                  "Blue Cross Blue Shield",
                  "Aetna",
                  "Cigna",
                  "Medicare",
                  "Humana",
                ].map((payer) => (
                  <div key={payer} className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2">
                    <PayerBadge payer={payer} />
                    <span className="text-2xs text-slate-400">Demo Rulebase</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Pre-Submission Risk Thresholds</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-4">
                <div className="rounded-xl border border-green-200 bg-green-50/50 p-3">
                  <p className="text-2xs font-bold text-green-700 uppercase">Low Risk</p>
                  <p className="mt-1 text-base font-bold text-green-800">0 – 39%</p>
                  <p className="text-2xs text-green-600">Clean claim pass</p>
                </div>
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3">
                  <p className="text-2xs font-bold text-amber-700 uppercase">Medium Risk</p>
                  <p className="mt-1 text-base font-bold text-amber-800">40 – 59%</p>
                  <p className="text-2xs text-amber-600">Review warnings</p>
                </div>
                <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-3">
                  <p className="text-2xs font-bold text-orange-700 uppercase">High Risk</p>
                  <p className="mt-1 text-base font-bold text-orange-800">60 – 84%</p>
                  <p className="text-2xs text-orange-600">Remediation required</p>
                </div>
                <div className="rounded-xl border border-red-200 bg-red-50/50 p-3">
                  <p className="text-2xs font-bold text-red-700 uppercase">Critical Risk</p>
                  <p className="mt-1 text-base font-bold text-red-800">85 – 100%</p>
                  <p className="text-2xs text-red-600">Immediate block</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clinical Disclaimer & Synthetic Sandbox Notice */}
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-navy-100 text-navy-700">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <div className="space-y-2 text-xs leading-relaxed text-slate-500">
              <p className="font-bold text-slate-800 uppercase tracking-wider">
                Decision Support & Synthetic Sandbox Notice
              </p>
              <p>
                PreClaim AI operates strictly as an administrative decision-support platform designed to assist healthcare
                revenue cycle teams in identifying pre-submission documentation deficits and payer coverage
                requirements. Risk scores and recommendations are generated from configured payer guidelines and workflow heuristics — they
                do not replace official payer determinations or direct clinician judgment.
              </p>
              <p>
                This installation is configured for synthetic development and demonstration. No real protected health
                information (PHI) is processed, stored, or transmitted.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
