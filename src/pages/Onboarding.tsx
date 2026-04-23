import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Sparkles } from "lucide-react";

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("businesses")
        .select("id, name, category, phone, onboarded")
        .eq("owner_id", user.id)
        .maybeSingle();
      if (data) {
        if (data.onboarded) {
          navigate("/dashboard", { replace: true });
          return;
        }
        setBusinessId(data.id);
        setName(data.name || "");
        setCategory(data.category || "");
        setPhone(data.phone || "");
      }
      setLoading(false);
    })();
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId) return;
    if (!name.trim() || !category) {
      toast.error("الرجاء تعبئة الحقول المطلوبة");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase
      .from("businesses")
      .update({ name: name.trim(), category, phone: phone.trim() || null, onboarded: true })
      .eq("id", businessId);
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("تم إعداد منشأتك بنجاح 🎉");
    navigate("/dashboard", { replace: true });
  };

  if (loading) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="w-full max-w-lg">
        <Logo className="justify-center mb-8" />
        <div className="glass rounded-3xl p-8 animate-fade-in">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 text-sm text-primary mb-3">
              <Sparkles className="w-4 h-4" /> تجربتك المجانية بدأت
            </div>
            <h1 className="text-2xl font-display font-bold mb-2">أعدّ منشأتك</h1>
            <p className="text-sm text-muted-foreground">معلومات سريعة لتفعيل صفحة الحجز.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">اسم المنشأة *</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cat">التصنيف *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger id="cat"><SelectValue placeholder="اختر التصنيف" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="barbershop">حلاقة رجالية</SelectItem>
                  <SelectItem value="salon">صالون نسائي</SelectItem>
                  <SelectItem value="clinic">عيادة</SelectItem>
                  <SelectItem value="spa">سبا ومنتجع</SelectItem>
                  <SelectItem value="service">خدمات أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">رقم الهاتف</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" placeholder="091xxxxxxx" />
            </div>
            <Button type="submit" disabled={submitting} className="w-full bg-gradient-primary shadow-glow h-11">
              {submitting && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              إكمال الإعداد
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
