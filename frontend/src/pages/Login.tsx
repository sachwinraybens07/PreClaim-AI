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
    <div className="flex min-h-screen items-center justify-center bg-navy-950 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-brand-500 text-white">
            <ShieldCheck className="h-5.5 w-5.5" />
          </div>
          <h1 className="text-2xl font-bold text-white">PreClaim AI</h1>
          <p className="mt-1.5 text-sm font-medium text-navy-300">
            Predict and prevent insurance denials before submission.
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-7 shadow-panel">
          <form onSubmit={mode === "signin" ? handleLogin : handleSignup} className="space-y-4" noValidate>
            {mode === "signup" && (
              <div>
                <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="focus-ring w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm placeholder:text-slate-400"
                />
              </div>
            )}
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
            {mode === "signup" && (
              <div>
                <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="focus-ring w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm placeholder:text-slate-400"
                />
              </div>
            )}

            {error && (
              <div role="alert" className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              isLoading={loading === "credentials" || loading === "signup"}
            >
              {mode === "signin" ? "Sign In" : "Create Account"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-medium uppercase tracking-wide text-slate-400">or</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {mode === "signin" && (
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
          )}

          <div className="mt-3 flex justify-center" ref={googleButtonRef} />
          {!GOOGLE_CLIENT_ID && (
            <p className="mt-3 text-center text-xs text-slate-400">Google sign-in is not configured yet.</p>
          )}

          <p className="mt-5 text-center text-sm text-slate-500">
            {mode === "signin" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  className="font-semibold text-brand-600 hover:underline"
                  onClick={() => switchMode("signup")}
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  className="font-semibold text-brand-600 hover:underline"
                  onClick={() => switchMode("signin")}
                >
                  Sign In
                </button>
              </>
            )}
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-navy-400">
          Synthetic demo data only. No real patient information is used.
        </p>
      </div>
    </div>
  );
}
