import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { z } from "zod";

const emailSchema = z.string().trim().email("بريد إلكتروني غير صالح").max(255);
const passwordSchema = z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل").max(72);

const Auth = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(email);
      passwordSchema.parse(password);
      if (!businessName.trim()) throw new Error("اسم المنشأة مطلوب");
    } catch (err: any) {
      toast.error(err.errors?.[0]?.message || err.message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
        data: { business_name: businessName },
      },
    });
    setSubmitting(false);
    if (error) {
      toast.error(error.message.includes("already") ? "هذا البريد مسجّل مسبقاً" : error.message);
      return;
    }
    toast.success("تم إنشاء حسابك! جاري الدخول…");
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      emailSchema.parse(email);
    } catch (err: any) {
      toast.error(err.errors?.[0]?.message);
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setSubmitting(false);
    if (error) {
      toast.error(error.message.includes("Invalid") ? "بيانات الدخول غير صحيحة" : error.message);
      return;
    }
    toast.success("مرحباً بعودتك");
  };

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="w-full max-w-md">
        <Logo className="justify-center mb-8" />
        <div className="glass rounded-3xl p-8 animate-fade-in">
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger value="signin">تسجيل الدخول</TabsTrigger>
              <TabsTrigger value="signup">حساب جديد</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="si-email">البريد الإلكتروني</Label>
                  <Input id="si-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="si-pass">كلمة المرور</Label>
                  <Input id="si-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <Button type="submit" disabled={submitting} className="w-full bg-gradient-primary shadow-glow">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                  دخول
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="su-biz">اسم المنشأة</Label>
                  <Input id="su-biz" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="صالون النخبة" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-email">البريد الإلكتروني</Label>
                  <Input id="su-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-pass">كلمة المرور</Label>
                  <Input id="su-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                </div>
                <Button type="submit" disabled={submitting} className="w-full bg-gradient-primary shadow-glow">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                  ابدأ تجربة مجانية 3 أيام
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-6">
          <Link to="/" className="hover:text-foreground">← العودة للرئيسية</Link>
        </p>
      </div>
    </div>
  );
};

export default Auth;
