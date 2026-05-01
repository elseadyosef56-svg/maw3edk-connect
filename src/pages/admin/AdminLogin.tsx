import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Shield, Lock, KeyRound, ArrowLeft } from "lucide-react";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);
  const [hasAnySuperAdmin, setHasAnySuperAdmin] = useState<boolean | null>(null);

  // Master code used ONLY for the very first super-admin bootstrap.
  // Once an admin exists, this code is no longer accepted.
  const BOOTSTRAP_CODE = "MAW3EDK-OWNER-2026";

  useEffect(() => {
    (async () => {
      // Check if any super_admin already exists (only checks count via head)
      const { count } = await supabase
        .from("user_roles")
        .select("*", { count: "exact", head: true })
        .eq("role", "super_admin" as any);
      setHasAnySuperAdmin((count ?? 0) > 0);
      setChecking(false);
    })();
  }, []);

  // If logged in and already super-admin, redirect to admin panel
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", user.id)
        .eq("role", "super_admin" as any)
        .maybeSingle();
      if (data) navigate("/admin", { replace: true });
    })();
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data: signIn, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      const uid = signIn.user!.id;

      // Check role
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", uid)
        .eq("role", "super_admin" as any)
        .maybeSingle();

      if (existingRole) {
        toast.success("مرحباً أيها المسؤول");
        navigate("/admin", { replace: true });
        return;
      }

      // Bootstrap path: only if no super admin exists yet
      if (!hasAnySuperAdmin) {
        if (adminCode !== BOOTSTRAP_CODE) {
          throw new Error("رمز التهيئة غير صحيح");
        }
        const { error: roleErr } = await supabase
          .from("user_roles")
          .insert({ user_id: uid, role: "super_admin" as any });
        if (roleErr) throw roleErr;
        toast.success("تم تفعيل حسابك كمالك للمنصة");
        navigate("/admin", { replace: true });
        return;
      }

      throw new Error("ليس لديك صلاحية الإدارة العليا");
    } catch (err: any) {
      toast.error(err.message || "فشل الدخول");
      await supabase.auth.signOut();
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen relative overflow-hidden grid place-items-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 pointer-events-none" />
      <div className="absolute top-20 -right-20 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-float pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl animate-float pointer-events-none" style={{ animationDelay: "2s" }} />

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-6">
          <Logo className="justify-center" />
        </div>

        <div className="rounded-[2rem] p-7 sm:p-8 bg-slate-900/70 backdrop-blur-2xl border border-white/10 shadow-deep animate-fade-in">
          <div className="flex items-center justify-center mb-5">
            <div className="relative">
              <div className="absolute inset-0 bg-amber-400/40 rounded-full blur-xl" />
              <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 grid place-items-center shadow-gold">
                <Shield className="w-7 h-7 text-slate-900" strokeWidth={2.5} />
              </div>
            </div>
          </div>
          <h1 className="text-2xl font-display font-extrabold text-center text-white mb-1">لوحة الإدارة العليا</h1>
          <p className="text-center text-sm text-white/60 mb-6">دخول حصري لمالكي المنصة فقط</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ae" className="text-white/80">البريد الإلكتروني</Label>
              <Input id="ae" type="email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" required
                className="h-11 bg-white/5 border-white/10 text-white placeholder:text-white/40" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ap" className="text-white/80">كلمة المرور</Label>
              <Input id="ap" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                className="h-11 bg-white/5 border-white/10 text-white" />
            </div>

            {!hasAnySuperAdmin && (
              <div className="space-y-2 p-3 rounded-xl bg-amber-500/10 border border-amber-400/30">
                <Label htmlFor="ac" className="text-amber-200 flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4" /> رمز التهيئة (مرة واحدة فقط)
                </Label>
                <Input id="ac" type="password" value={adminCode} onChange={(e) => setAdminCode(e.target.value)} dir="ltr" required
                  placeholder="أدخل رمز المالك" className="h-11 bg-white/5 border-amber-400/30 text-white" />
                <p className="text-[11px] text-amber-200/70">
                  لم يتم تعيين مالك للمنصة بعد. سجّل دخولك بحساب موجود وأدخل رمز التهيئة لربطه كمالك.
                </p>
              </div>
            )}

            <Button type="submit" disabled={submitting} size="lg"
              className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 font-bold h-12 shadow-gold">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (<><Lock className="w-4 h-4 ml-2" /> دخول آمن</>)}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm mt-6">
          <Link to="/" className="text-white/60 hover:text-white transition-colors inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> العودة للرئيسية
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
