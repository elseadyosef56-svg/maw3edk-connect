import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Sparkles, Check, ArrowLeft, ArrowRight, MessageCircle, MapPin } from "lucide-react";
import { categories, BusinessCategory } from "@/lib/business";

const Onboarding = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<BusinessCategory | "">("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [instagram, setInstagram] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("businesses")
        .select("id, name, category, phone, whatsapp_number, address, description, instagram, onboarded")
        .eq("owner_id", user.id)
        .maybeSingle();
      if (data) {
        if (data.onboarded) {
          navigate("/dashboard", { replace: true });
          return;
        }
        setBusinessId(data.id);
        setName(data.name || "");
        setCategory((data.category as BusinessCategory) || "");
        setPhone(data.phone || "");
        setWhatsapp(data.whatsapp_number || "");
        setAddress(data.address || "");
        setDescription(data.description || "");
        setInstagram(data.instagram || "");
      }
      setLoading(false);
    })();
  }, [user, navigate]);

  const next = () => {
    if (step === 1 && (!name.trim() || !category)) {
      toast.error("الرجاء إدخال اسم المنشأة واختيار النوع");
      return;
    }
    if (step === 2 && !whatsapp.trim()) {
      toast.error("رقم الواتساب مطلوب لاستقبال الحجوزات");
      return;
    }
    setStep((step + 1) as any);
  };

  const handleSubmit = async () => {
    if (!businessId) return;
    setSubmitting(true);
    const { error } = await supabase
      .from("businesses")
      .update({
        name: name.trim(),
        category,
        phone: phone.trim() || null,
        whatsapp_number: whatsapp.trim(),
        address: address.trim() || null,
        description: description.trim() || null,
        instagram: instagram.trim().replace(/^@/, "") || null,
        onboarded: true,
      })
      .eq("id", businessId);
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }
    toast.success("تم إعداد منشأتك بنجاح 🎉");
    navigate("/dashboard", { replace: true });
  };

  if (loading) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="min-h-screen p-4 py-10 relative">
      <div className="absolute inset-0 bg-gradient-hero opacity-60 pointer-events-none" />
      <div className="relative w-full max-w-2xl mx-auto">
        <Logo className="justify-center mb-8" />

        {/* Stepper */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center gap-2">
              <div className={`w-9 h-9 rounded-full grid place-items-center text-sm font-bold transition-all ${
                step >= n ? "bg-gradient-primary text-primary-foreground shadow-glow scale-110" : "bg-secondary text-muted-foreground"
              }`}>
                {step > n ? <Check className="w-4 h-4" /> : n}
              </div>
              {n < 3 && <div className={`w-12 h-0.5 ${step > n ? "bg-primary" : "bg-border"}`} />}
            </div>
          ))}
        </div>

        <div className="glass-strong rounded-3xl p-8 animate-fade-in">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 text-sm text-primary mb-3 px-4 py-1.5 rounded-full bg-primary/10">
              <Sparkles className="w-4 h-4" /> تجربة مجانية 3 أيام
            </div>
            <h1 className="text-3xl font-display font-bold mb-2">
              {step === 1 && "أعدّ منشأتك"}
              {step === 2 && "بيانات التواصل"}
              {step === 3 && "اللمسات الأخيرة"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {step === 1 && "اختر نوع نشاطك حتى نخصص الواجهة لك"}
              {step === 2 && "حتى تصلك إشعارات الحجوزات على واتساب فوراً"}
              {step === 3 && "اختياري — يساعد عملاءك على معرفتك أفضل"}
            </p>
          </div>

          {step === 1 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name">اسم المنشأة *</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={100} className="h-12" placeholder="مثال: عيادة د. أحمد" />
              </div>
              <div className="space-y-3">
                <Label>نوع النشاط *</Label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {(Object.entries(categories) as [BusinessCategory, typeof categories[BusinessCategory]][]).map(([key, cfg]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setCategory(key)}
                      className={`p-4 rounded-2xl border-2 text-right transition-all ${
                        category === key
                          ? "border-primary bg-primary/5 shadow-glow scale-[1.02]"
                          : "border-border hover:border-primary/40 hover:bg-secondary/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{cfg.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-display font-bold text-sm">{cfg.label}</p>
                          <p className="text-xs text-muted-foreground truncate">{cfg.staffPlural} • {cfg.servicesLabel}</p>
                        </div>
                        {category === key && <Check className="w-5 h-5 text-primary shrink-0" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="wa" className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-primary" /> رقم واتساب لاستقبال الحجوزات *
                </Label>
                <Input id="wa" type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} dir="ltr" placeholder="0911234567" className="h-12" />
                <p className="text-xs text-muted-foreground">سيصلك إشعار فوري عند كل حجز جديد على هذا الرقم</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">رقم الهاتف للعرض العام</Label>
                <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" placeholder="091xxxxxxx" className="h-12" />
                <p className="text-xs text-muted-foreground">يظهر في صفحة الحجز ليتصل به الزبائن</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="addr" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" /> العنوان
                </Label>
                <Input id="addr" value={address} onChange={(e) => setAddress(e.target.value)} maxLength={200} placeholder="طرابلس، شارع الجمهورية" className="h-12" />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="desc">وصف منشأتك</Label>
                <Textarea id="desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} placeholder="نقدم خدمات احترافية بأعلى جودة…" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ig">الإنستغرام</Label>
                <Input id="ig" value={instagram} onChange={(e) => setInstagram(e.target.value)} dir="ltr" placeholder="username" className="h-12" />
              </div>
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-sm">
                <p className="font-medium mb-1">جاهز للانطلاق! 🚀</p>
                <p className="text-muted-foreground text-xs">يمكنك تعديل كل هذه المعلومات لاحقاً من الإعدادات.</p>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep((step - 1) as any)} className="flex-1 h-12">
                <ArrowRight className="w-4 h-4 ml-1" /> السابق
              </Button>
            )}
            {step < 3 ? (
              <Button onClick={next} className="flex-1 bg-gradient-primary shadow-glow h-12">
                التالي <ArrowLeft className="w-4 h-4 mr-1" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={submitting} className="flex-1 bg-gradient-primary shadow-glow h-12">
                {submitting && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
                إكمال الإعداد <Sparkles className="w-4 h-4 mr-1" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
