import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Mail, Lock, Eye, EyeOff, XCircle, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);

  // Lockout Logic States
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [lockoutTimeLeft, setLockoutTimeLeft] = useState(0);

  const navigate = useNavigate();
  const { session } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (session) {
      navigate("/");
    }
  }, [session, navigate]);

  // Handle Lockout Timer
  useEffect(() => {
    if (lockoutUntil) {
      const interval = setInterval(() => {
        const now = Date.now();
        if (now >= lockoutUntil) {
          setLockoutUntil(null);
          setFailedAttempts(0);
          setLockoutTimeLeft(0);
          clearInterval(interval);
        } else {
          setLockoutTimeLeft(Math.ceil((lockoutUntil - now) / 1000));
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockoutUntil]);

  const isLockedOut = lockoutTimeLeft > 0;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOut) return;

    setLoading(true);
    setError(null);

    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);

      if (newAttempts >= 5) {
        const lockoutTime = Date.now() + 5 * 60 * 1000; // 5 minutes lockout
        setLockoutUntil(lockoutTime);
        setLockoutTimeLeft(300);
        setError("Too many failed attempts. Account locked for 5 minutes.");
      } else {
        if (signInError.message === 'Invalid login credentials') {
          setError(`Incorrect email or password. ${5 - newAttempts} attempts remaining.`);
        } else {
          setError(signInError.message);
        }
      }
      setLoading(false);
      return;
    }

    // Reset attempts on successful login
    setFailedAttempts(0);
    setLockoutUntil(null);

    // Fetch profile to determine redirect
    const { data: profile, error: profileError } = await (supabase
      .from("user_profiles")
      .select("role")
      .eq("id", authData.user?.id)
      .single() as any);

    if (profileError || !profile) {
      // Profile might not exist yet if created via dashboard and trigger failed
      // Or user is deleted from user_profiles but exists in auth
      setError("Account setup incomplete. Contact your administrator.");
      setLoading(false);
      return;
    }

    const role = profile.role;
    if (role === "field_worker") {
      navigate("/catch");
    } else if (role === "clinic_vet") {
      navigate("/"); // Or clinic dashboard if it exists, default to stats
    } else if (role === "programme_manager" || role === "admin") {
      navigate("/"); // Dashboard/Stats
    } else {
      navigate("/");
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[#F9FAFB] p-6 font-inter antialiased">
      {/* Daylight Meadow Background Elements */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#e0f2fe] via-[#f0f9ff] to-[#fdf4ff]" />
      <div className="absolute right-[15%] top-[10%] z-10 h-[140px] w-[140px] animate-[sunPulse_8s_ease-in-out_infinite] rounded-full bg-[radial-gradient(circle,#fef08a_0%,rgba(254,240,138,0)_70%)] opacity-80" />

      {/* Hills */}
      <svg className="absolute bottom-0 left-0 z-[1] h-[45%] w-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <path fill="#d1fae5" d="M0,192L48,181.3C96,171,192,149,288,154.7C384,160,480,192,576,186.7C672,181,768,139,864,128C960,117,1056,139,1152,154.7C1248,171,1344,181,1392,186.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        <path fill="#a7f3d0" d="M0,256L48,240C96,224,192,192,288,181.3C384,171,480,181,576,197.3C672,213,768,235,864,224C960,213,1056,171,1152,154.7C1248,139,1344,149,1392,154.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        <path fill="#6ee7b7" opacity="0.6" d="M0,288L48,272C96,256,192,224,288,213.3C384,203,480,213,576,229.3C672,245,768,267,864,261.3C960,256,1056,224,1152,208C1248,192,1344,192,1392,192L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
      </svg>

      {/* Birds */}
      <svg className="absolute left-[-50px] top-[20%] z-[2] h-[30px] w-[60px] animate-[flyAcross_25s_linear_infinite]" viewBox="0 0 60 30">
        <path d="M5,15 Q15,5 20,15 Q25,5 35,15" stroke="#64748b" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M25,25 Q35,15 40,25 Q45,15 55,25" stroke="#64748b" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      </svg>

      {/* Login Card */}
      <div className="relative z-[4] w-full max-cols-fit max-w-[420px] animate-[cardFloat_0.9s_cubic-bezier(0.16,1,0.3,1)_both] overflow-hidden rounded-[28px] border border-[rgba(255,255,255,0.9)] bg-[rgba(255,255,255,0.85)] p-[48px_40px_36px] shadow-[0_30px_80px_-20px_rgba(15,23,42,0.15),0_0_0_0.5px_rgba(255,255,255,0.8)_inset,0_1px_0_0_rgba(255,255,255,1)_inset] backdrop-blur-[24px] saturate-[180%]">
        <div className="absolute left-[10%] right-[10%] top-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent" />

        {/* Avatar */}
        <div className="relative mx-auto mb-[22px] flex h-[72px] w-[72px] animate-[avatarPop_0.7s_cubic-bezier(0.34,1.56,0.64,1)_0.2s_both] items-center justify-center rounded-full border border-[rgba(16,185,129,0.2)] bg-gradient-to-br from-[rgba(16,185,129,0.1)] to-[rgba(255,255,255,0.8)] shadow-[0_8px_32px_rgba(16,185,129,0.15),0_1px_0_rgba(255,255,255,1)_inset]">
          <div className="absolute inset-[-10px] z-[-1] animate-[glowPulse_4s_ease-in-out_infinite] rounded-full bg-[radial-gradient(circle,rgba(16,185,129,0.2)_0%,transparent_75%)] blur-[14px]" />
          <span className="text-[36px] drop-shadow-[0_2px_4px_rgba(16,185,129,0.3)]">🐾</span>
        </div>

        <h1 className="mb-2 text-center text-[22px] font-[800] tracking-[0.05em] text-[#0f172a]">PAWPRINT AI</h1>
        <p className="mb-[38px] text-center text-[12px] font-[500] leading-[1.6] tracking-[0.04em] text-[#475569]">
          <span className="mx-1 opacity-50">—</span> Management Portal <span className="mx-1 opacity-50">—</span>
          <br />
          <span className="mt-1 inline-block text-[13px] font-[600] tracking-[0.02em] text-[#059669]">Sign In</span>
        </p>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="login-email" className="pl-0.5 text-[11px] font-[600] uppercase tracking-[0.08em] text-[#94a3b8]">Email address</label>
            <div className={`relative flex h-[52px] items-center rounded-[14px] border-[1.5px] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition-all duration-[350ms] ${focused === "email" ? "border-[#10b981] shadow-[0_0_0_4px_rgba(16,185,129,0.25),0_1px_2px_rgba(15,23,42,0.05)]" : "border-[#e2e8f0] hover:border-[#cbd5e1]"}`}>
              <span className={`flex w-[48px] shrink-0 items-center justify-center transition-colors duration-300 ${focused === "email" ? "text-[#10b981]" : "text-[#94a3b8]"}`}>
                <Mail size={16} strokeWidth={1.6} />
              </span>
              <input
                id="login-email" type="email" autoComplete="email"
                value={email} onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocused("email")} onBlur={() => setFocused(null)}
                required disabled={loading || isLockedOut} placeholder="you@acnnepal.org"
                className="h-full flex-1 border-none bg-transparent pr-[14px] font-inter text-[15px] font-[500] tracking-[0.01em] text-[#0f172a] outline-none placeholder:font-[400] placeholder:text-[#94a3b8] disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="login-password" className="pl-0.5 text-[11px] font-[600] uppercase tracking-[0.08em] text-[#94a3b8]">Password</label>
            <div className={`relative flex h-[52px] items-center rounded-[14px] border-[1.5px] bg-white shadow-[0_1px_2px_rgba(15,23,42,0.05)] transition-all duration-[350ms] ${focused === "password" ? "border-[#10b981] shadow-[0_0_0_4px_rgba(16,185,129,0.25),0_1px_2px_rgba(15,23,42,0.05)]" : "border-[#e2e8f0] hover:border-[#cbd5e1]"}`}>
              <span className={`flex w-[48px] shrink-0 items-center justify-center transition-colors duration-300 ${focused === "password" ? "text-[#10b981]" : "text-[#94a3b8]"}`}>
                <Lock size={16} strokeWidth={1.6} />
              </span>
              <input
                id="login-password" type={showPassword ? "text" : "password"}
                autoComplete="current-password" value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocused("password")} onBlur={() => setFocused(null)}
                required disabled={loading || isLockedOut} placeholder="••••••••"
                className="h-full flex-1 border-none bg-transparent pr-0 font-inter text-[15px] font-[500] tracking-[0.01em] text-[#0f172a] outline-none placeholder:font-[400] placeholder:text-[#94a3b8] disabled:cursor-not-allowed disabled:opacity-60"
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)}
                className="mr-1 flex h-[40px] w-[40px] shrink-0 items-center justify-center rounded-[10px] text-[#94a3b8] transition-all hover:bg-[rgba(15,23,42,0.05)] hover:text-[#0f172a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#10b981] disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={showPassword ? "Hide password" : "Show password"} disabled={isLockedOut}>
                {showPassword ? <EyeOff size={16} strokeWidth={1.6} /> : <Eye size={16} strokeWidth={1.6} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex animate-[errorSlide_0.35s_cubic-bezier(0.34,1.56,0.64,1)_both] items-center gap-2 rounded-[12px] border border-[#fecaca] bg-[#fef2f2] p-[11px_14px] text-[13px] font-[500] text-[#991b1b] shadow-[0_1px_2px_rgba(239,68,68,0.1)]" role="alert">
              <XCircle size={15} strokeWidth={1.8} className="shrink-0" />
              <span>{error} {isLockedOut && lockoutTimeLeft > 0 && `(${formatTime(lockoutTimeLeft)})`}</span>
            </div>
          )}

          <button type="submit" disabled={loading || !email || !password || isLockedOut} className="relative mt-2 h-[52px] w-full overflow-hidden rounded-[16px] bg-gradient-to-br from-[#10b981] to-[#059669] font-inter text-[15px] font-[600] tracking-[0.01em] text-white shadow-[0_4px_6px_-1px_rgba(16,185,129,0.3),0_2px_4px_-1px_rgba(16,185,129,0.15),0_1px_0_rgba(255,255,255,0.2)_inset] transition-all duration-[250ms] cubic-bezier(0.34,1.56,0.64,1) hover:translate-y-[-2px] hover:shadow-[0_10px_15px_-3px_rgba(16,185,129,0.35),0_4px_6px_-2px_rgba(16,185,129,0.2),0_1px_0_rgba(255,255,255,0.25)_inset] active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:grayscale-[0.3] disabled:opacity-60 disabled:hover:translate-y-0">
            <div className="absolute left-[-100%] top-0 h-full w-full animate-[sheenSweep_5s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-[rgba(255,255,255,0.3)] to-transparent" />
            <span className="relative z-[2] flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Signing in…
                </>
              ) : (
                <>
                  {isLockedOut ? `Locked (${formatTime(lockoutTimeLeft)})` : "Sign In"}
                  {!isLockedOut && <ArrowRight size={16} strokeWidth={2} />}
                </>
              )}
            </span>
          </button>
        </form>

        <p className="mt-[28px] flex items-center justify-center gap-2 text-center text-[10.5px] font-[500] uppercase tracking-[0.06em] text-[#94a3b8]">
          <span className="h-[4px] w-[4px] animate-[dotPulse_2s_ease-in-out_infinite] rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
          Authorised personnel only · All Care Nepal
        </p>
      </div>

      <style>{`
        @keyframes sunPulse {
          0%, 100% { transform: scale(1); opacity: 0.8; }
          50% { transform: scale(1.15); opacity: 1; }
        }
        @keyframes flyAcross {
          0% { transform: translateX(0) translateY(0); }
          50% { transform: translateX(50vw) translateY(-20px); }
          100% { transform: translateX(110vw) translateY(10px); }
        }
        @keyframes cardFloat {
          from { opacity: 0; transform: translateY(24px) scale(0.96); filter: blur(8px); }
          to   { opacity: 1; transform: translateY(0) scale(1);       filter: blur(0); }
        }
        @keyframes avatarPop {
          from { opacity: 0; transform: scale(0.3) rotate(-20deg); }
          to   { opacity: 1; transform: scale(1) rotate(0); }
        }
        @keyframes glowPulse {
          0%,100% { opacity: 0.6; transform: scale(1); }
          50%     { opacity: 1;   transform: scale(1.2); }
        }
        @keyframes errorSlide {
          from { opacity: 0; transform: translateY(-6px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes sheenSweep {
          0%,70% { left: -100%; }
          85% { left: 100%; }
          100% { left: 100%; }
        }
        @keyframes dotPulse {
          0%,100% { opacity: 0.5; transform: scale(1); }
          50%     { opacity: 1;   transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
