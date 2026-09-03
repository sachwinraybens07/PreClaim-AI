import { AppLayout } from "../components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/Card";
import { useAuth } from "../hooks/useAuth";

export default function Settings() {
  const { user } = useAuth();
  return (
    <AppLayout title="Settings" subtitle="Manage your PreClaim AI workspace.">
      <div className="max-w-xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Name</span>
              <span className="font-semibold text-slate-800">{user?.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Email</span>
              <span className="font-semibold text-slate-800">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Role</span>
              <span className="font-semibold text-slate-800">{user?.role?.replace(/_/g, " ")}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>About PreClaim AI</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-500">
            <p>PreClaim AI is a decision-support tool for revenue cycle teams. Predictions are estimates based on
              available case data and historical patterns — they do not replace payer verification.</p>
            <p>This build uses synthetic demo data only. No real patient information is stored or processed.</p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
