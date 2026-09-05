import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { ApiError } from "../services/api";

type Mode = "signin" | "signup";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim();

export default function Login() {
  const { login, register, loginWithGoogle } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<"credentials" | "demo" | "signup" | "google" | null>(null);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const latestRef = useRef({ loginWithGoogle, navigate });

  useEffect(() => {
    latestRef.current = { loginWithGoogle, navigate };
  });

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    let cancelled = false;

    const tryInit = (attemptsLeft: number) => {
      if (cancelled) return;
      const google = window.google;
      if (google?.accounts?.id && googleButtonRef.current) {
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async (response) => {
            setError(null);
            setLoading("google");
            try {
              await latestRef.current.loginWithGoogle(response.credential);
              latestRef.current.navigate("/dashboard");
            } catch (err) {
              setError(err instanceof ApiError ? err.message : "Unable to sign in with Google. Please try again.");
            } finally {
              setLoading(null);
            }
          },
        });
        google.accounts.id.renderButton(googleButtonRef.current, {
          theme: "outline",
          size: "large",
          width: 320,
        });
        return;
      }
      if (attemptsLeft > 0) setTimeout(() => tryInit(attemptsLeft - 1), 150);
    };

    tryInit(20);
    return () => {
      cancelled = true;
    };
  }, []);

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

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading("signup");
    try {
      await register({ name, email, password, confirmPassword });
      showToast("Account created. Welcome to PreClaim AI.", "success");
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Unable to create your account. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
  };

  return (
    <div className="flex min-h-screen bg-navy-950">
      {/* Left Column: Enterprise Branding & Clinical Workflow (Desktop) */}
      <div className="relative hidden w-1/2 flex-col justify-between border-r border-navy-800/80 bg-navy-950 p-12 lg:flex xl:p-16">
        <div>
          {/* Logo & Header */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 text-white shadow-sm">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white">PreClaim AI</span>
              <span className="ml-2.5 inline-flex items-center rounded border border-brand-400/30 bg-brand-500/10 px-2 py-0.5 text-2xs font-semibold text-brand-300">
                ENTERPRISE RCM
              </span>
            </div>
          </div>

          {/* Hero Pitch */}
          <div className="mt-14 max-w-lg">
            <p className="text-eyebrow text-brand-400">Pre-Submission Risk Analysis</p>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white xl:text-4xl">
              Predict and prevent claim denials before submission.
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-navy-200">
              Shift revenue cycle workflows from 45-day denial appeals to proactive, pre-submission risk detection
              and documentation verification.
            </p>

            {/* Workflow Pipeline */}
            <div className="mt-8 rounded-xl border border-navy-800 bg-navy-900/60 p-5">
              <p className="text-2xs font-semibold uppercase tracking-wider text-navy-400">
                Denial Prevention Workflow
              </p>
              <div className="mt-3.5 flex flex-wrap items-center gap-2">
                {[
                  { label: "Predict", desc: "Risk score" },
                  { label: "Explain", desc: "Root drivers" },
                  { label: "Detect", desc: "Policy gaps" },
                  { label: "Fix", desc: "Corrective actions" },
                  { label: "Simulate", desc: "Readiness test" },
                  { label: "Prevent", desc: "Clean claim" },
                ].map((s, idx) => (
                  <div key={s.label} className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-md border border-navy-700 bg-navy-800/80 px-2.5 py-1 text-xs font-semibold text-slate-200">
                      <span className="mr-1.5 text-2xs font-bold text-brand-400">{idx + 1}</span>
                      {s.label}
                    </span>
                    {idx < 5 && <span className="text-xs text-navy-500">→</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Value Highlights */}
            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-brand-300 text-xs font-bold">
                  ✓
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">Configured Payer Rules</p>
                  <p className="text-xs text-navy-300">
                    Analysis based on configured payer and workflow rules.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-brand-300 text-xs font-bold">
                  ✓
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">What-If Risk Simulator</p>
                  <p className="text-xs text-navy-300">
                    Interactive simulation demonstrating projected risk reduction before claim filing.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500/20 text-brand-300 text-xs font-bold">
                  ✓
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-200">Demo Environment</p>
                  <p className="text-xs text-navy-300">
                    Synthetic patient cases and deterministic risk calculations for evaluation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="border-t border-navy-800/80 pt-6">
          <p className="text-2xs text-navy-400">
            PreClaim AI · Pre-Submission Risk Analysis & Denial Prevention Prototype
          </p>
        </div>
      </div>

      {/* Right Column: Sign In / Demo Console */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="mb-6 flex flex-col items-center text-center lg:hidden">
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-brand-500 text-white shadow-sm">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">PreClaim AI</h1>
            <p className="mt-1 text-sm text-navy-300">Pre-Claim Denial Prevention Platform</p>
          </div>

          <div className="rounded-2xl border border-slate-200/90 bg-white p-7 shadow-panel sm:p-8">
            {/* Quick Demo Access banner */}
            <div className="mb-6 rounded-xl border border-brand-100 bg-brand-50/70 p-4">
              <div className="flex items-center justify-between">
                <span className="text-2xs font-bold uppercase tracking-wider text-brand-700">Quick Demo Access</span>
                <span className="inline-flex items-center rounded-full bg-brand-100 px-2 py-0.5 text-2xs font-semibold text-brand-700">
                  RCM Manager
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600">
                Explore the platform instantly with pre-loaded high-risk orthopedic and cardiology cases.
              </p>
              <Button
                type="button"
                className="mt-3.5 w-full font-semibold shadow-sm"
                onClick={handleDemo}
                isLoading={loading === "demo"}
              >
                <Sparkles className="h-4 w-4" />
                Launch Demo as Sarah Chen
              </Button>
            </div>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-2xs font-semibold uppercase tracking-wider text-slate-400">or sign in with credentials</span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <form onSubmit={mode === "signin" ? handleLogin : handleSignup} className="space-y-4" noValidate>
              {mode === "signup" && (
                <div>
                  <label htmlFor="name" className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Full Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="focus-ring w-full rounded-lg border border-slate-300/90 px-3.5 py-2.5 text-sm placeholder:text-slate-400 transition-colors focus:border-brand-500"
                  />
                </div>
              )}
              <div>
                <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-slate-700">
                  Work Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sarah.chen@preclaim.ai"
                  className="focus-ring w-full rounded-lg border border-slate-300/90 px-3.5 py-2.5 text-sm placeholder:text-slate-400 transition-colors focus:border-brand-500"
                />
              </div>
              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label htmlFor="password" className="text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  {mode === "signin" && (
                    <span className="text-2xs font-medium text-slate-400">Demo password: demo1234</span>
                  )}
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="focus-ring w-full rounded-lg border border-slate-300/90 px-3.5 py-2.5 text-sm placeholder:text-slate-400 transition-colors focus:border-brand-500"
                />
              </div>
              {mode === "signup" && (
                <div>
                  <label htmlFor="confirmPassword" className="mb-1.5 block text-xs font-semibold text-slate-700">
                    Confirm Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="focus-ring w-full rounded-lg border border-slate-300/90 px-3.5 py-2.5 text-sm placeholder:text-slate-400 transition-colors focus:border-brand-500"
                  />
                </div>
              )}

              {error && (
                <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="secondary"
                className="w-full font-semibold"
                isLoading={loading === "credentials" || loading === "signup"}
              >
                {mode === "signin" ? "Sign In to Workspace" : "Create Account"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>

            <div className="mt-3 flex justify-center" ref={googleButtonRef} />
            {!GOOGLE_CLIENT_ID && (
              <p className="mt-3 text-center text-2xs text-slate-400">Google Sign-In is not configured in this demo environment.</p>
            )}

            <div className="mt-5 border-t border-slate-100 pt-4 text-center">
              <p className="text-xs text-slate-500">
                {mode === "signin" ? (
                  <>
                    Need an enterprise account?{" "}
                    <button
                      type="button"
                      className="font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                      onClick={() => switchMode("signup")}
                    >
                      Request Access
                    </button>
                  </>
                ) : (
                  <>
                    Already have an account?{" "}
                    <button
                      type="button"
                      className="font-semibold text-brand-600 hover:text-brand-700 hover:underline"
                      onClick={() => switchMode("signin")}
                    >
                      Sign In
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>

          <p className="mt-5 text-center text-2xs text-navy-400">
            Synthetic demo environment. Prototype for pre-claim risk assessment.
          </p>
        </div>
      </div>
    </div>
  );
}
