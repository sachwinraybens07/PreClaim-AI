import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { ApiError } from "../services/api";

export default function Login() {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"credentials" | "demo" | null>(null);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading("credentials");
    try {
      await login({ email, password });
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to sign in. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const handleDemo = async () => {
    setError(null);
    setLoading("demo");
    try {
      await login({ demo: true });
      showToast("Welcome to the PreClaim AI demo workspace.", "success");
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to start the demo. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500 text-white shadow-sm">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">PreClaim AI</h1>
          <p className="mt-1.5 text-sm font-medium text-slate-500">
            Prevent insurance denials before they happen.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-7 shadow-card">
          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@healthsystem.org"
                className="focus-ring w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm placeholder:text-slate-400"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="focus-ring w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm placeholder:text-slate-400"
              />
            </div>

            {error && (
              <div role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" isLoading={loading === "credentials"}>
              Sign In
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">or</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleDemo}
            isLoading={loading === "demo"}
          >
            <Sparkles className="h-4 w-4 text-brand-500" />
            Enter Demo
          </Button>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          Synthetic demo data only. No real patient information is used.
        </p>
      </div>
    </div>
  );
}
