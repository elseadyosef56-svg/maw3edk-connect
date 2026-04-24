import { useEffect, useState } from "react";
import { useBusiness } from "@/contexts/BusinessContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Upload, Building2, Phone, MessageCircle, Clock, Image as ImageIcon, MapPin, Instagram, Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { defaultHours, dayKeys, dayLabels, WorkingHours, categories, BusinessCategory } from "@/lib/business";

const SettingsPage = () => {
  const { business, refresh } = useBusiness();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<BusinessCategory | "">("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [instagram, setInstagram] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [hours, setHours] = useState<WorkingHours>(defaultHours);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"logo" | "cover" | null>(null);

  useEffect(() => {
    if (!business) return;
    setName(business.name);
    setCategory((business.category as BusinessCategory) || "");
    setPhone(business.phone || "");
    setWhatsapp(business.whatsapp_number || "");
    setAddress(business.address || "");
    setDescription(business.description || "");
    setInstagram(business.instagram || "");
    setLogoUrl(business.logo_url);
    setCoverUrl(business.cover_url);
    setHours({ ...defaultHours, ...(business.working_hours || {}) });
  }, [business]);

  const upload = async (file: File, kind: "logo" | "cover") => {
    if (!user || !business) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("الحد الأقصى 5MB"); return; }
    setUploading(kind);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${business.id}-${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("business-assets").upload(path, file, { upsert: true });
    if (error) { toast.error(error.message); setUploading(null); return; }
    const { data } = supabase.storage.from("business-assets").getPublicUrl(path);
    if (kind === "logo") setLogoUrl(data.publicUrl); else setCoverUrl(data.publicUrl);
    setUploading(null);
    toast.success("تم رفع الصورة");
  };

  const save = async () => {
    if (!business) return;
    setSaving(true);
    const { error } = await supabase.from("businesses").update({
      name: name.trim(),
      category,
      phone: phone.trim() || null,
      whatsapp_number: whatsapp.trim() || null,
      address: address.trim() || null,
      description: description.trim() || null,
      instagram: instagram.trim().replace(/^@/, "") || null,
      logo_url: logoUrl,
      cover_url: coverUrl,
      working_hours: hours as any,
    }).eq("id", business.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("تم الحفظ ✨");
    refresh();
  };

  const publicUrl = `${window.location.origin}/${business?.slug || ""}`;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-3xl font-display font-bold">الإعدادات</h1>
        <p className="text-sm text-muted-foreground">خصّص منشأتك بالكامل وحدّد ساعات العمل.</p>
      </div>

      {/* Business identity */}
      <div className="luxe-card rounded-3xl p-6 space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-border/40">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary grid place-items-center text-primary-foreground shadow-glow">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg">هوية المنشأة</h2>
            <p className="text-xs text-muted-foreground">الاسم والنوع والوصف</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2 sm:col-span-2">
            <Label>اسم المنشأة *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} className="h-11" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>نوع النشاط</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.entries(categories) as [BusinessCategory, typeof categories[BusinessCategory]][]).map(([k, c]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setCategory(k)}
                  className={`p-3 rounded-xl border-2 text-center transition-all ${
                    category === k ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className="text-xl mb-1">{c.emoji}</div>
                  <div className="text-xs font-medium">{c.label}</div>
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>وصف منشأتك</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} maxLength={300} placeholder="نقدم خدمات احترافية..." />
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="luxe-card rounded-3xl p-6 space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-border/40">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary grid place-items-center text-primary-foreground shadow-glow">
            <Phone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg">معلومات التواصل</h2>
            <p className="text-xs text-muted-foreground">واتساب لاستقبال الحجوزات + بيانات الاتصال</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><MessageCircle className="w-3.5 h-3.5 text-primary" /> واتساب الحجوزات *</Label>
            <Input type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} dir="ltr" placeholder="0911234567" className="h-11" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-primary" /> الهاتف العام</Label>
            <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" className="h-11" />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary" /> العنوان</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} maxLength={200} className="h-11" />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-1.5"><Instagram className="w-3.5 h-3.5 text-primary" /> الإنستغرام</Label>
            <Input value={instagram} onChange={(e) => setInstagram(e.target.value)} dir="ltr" placeholder="username" className="h-11" />
          </div>
          <div className="space-y-2">
            <Label>الرابط العام</Label>
            <div className="flex gap-2">
              <Input value={publicUrl} disabled dir="ltr" className="h-11" />
              <Button variant="outline" size="icon" className="h-11 w-11 shrink-0" onClick={() => { navigator.clipboard.writeText(publicUrl); toast.success("تم النسخ"); }}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Branding */}
      <div className="luxe-card rounded-3xl p-6 space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-border/40">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary grid place-items-center text-primary-foreground shadow-glow">
            <ImageIcon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg">الشعار والغلاف</h2>
            <p className="text-xs text-muted-foreground">JPG / PNG حتى 5MB</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label>الشعار (Logo)</Label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-secondary grid place-items-center overflow-hidden shrink-0">
                {logoUrl ? <img src={logoUrl} alt="logo" className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-muted-foreground" />}
              </div>
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "logo")} />
                <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 shadow-glow">
                  {uploading === "logo" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  رفع الشعار
                </span>
              </label>
            </div>
          </div>
          <div className="space-y-3">
            <Label>صورة الغلاف</Label>
            <div className="flex items-center gap-4">
              <div className="w-28 h-20 rounded-2xl bg-secondary grid place-items-center overflow-hidden shrink-0">
                {coverUrl ? <img src={coverUrl} alt="cover" className="w-full h-full object-cover" /> : <ImageIcon className="w-6 h-6 text-muted-foreground" />}
              </div>
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "cover")} />
                <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-medium hover:opacity-90 shadow-glow">
                  {uploading === "cover" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  رفع الغلاف
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Working hours */}
      <div className="luxe-card rounded-3xl p-6 space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-border/40">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary grid place-items-center text-primary-foreground shadow-glow">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display font-bold text-lg">ساعات العمل</h2>
            <p className="text-xs text-muted-foreground">حدّد مواقيت العمل لكل يوم</p>
          </div>
        </div>
        <div className="space-y-2">
          {dayKeys.map((d) => (
            <div key={d} className={`grid grid-cols-12 gap-3 items-center p-3 rounded-xl transition-colors ${hours[d]?.closed ? "bg-muted/40" : "bg-secondary/40"}`}>
              <div className="col-span-3 sm:col-span-2 font-medium text-sm">{dayLabels[d]}</div>
              <div className="col-span-3 sm:col-span-2 flex items-center gap-2">
                <Switch
                  checked={!hours[d]?.closed}
                  onCheckedChange={(v) => setHours({ ...hours, [d]: { ...hours[d], closed: !v } })}
                />
                <span className="text-xs text-muted-foreground">{hours[d]?.closed ? "مغلق" : "مفتوح"}</span>
              </div>
              <Input
                type="time"
                value={hours[d]?.open || "09:00"}
                disabled={hours[d]?.closed}
                onChange={(e) => setHours({ ...hours, [d]: { ...hours[d], open: e.target.value } })}
                className="col-span-3 sm:col-span-4 h-9"
              />
              <Input
                type="time"
                value={hours[d]?.close || "21:00"}
                disabled={hours[d]?.closed}
                onChange={(e) => setHours({ ...hours, [d]: { ...hours[d], close: e.target.value } })}
                className="col-span-3 sm:col-span-4 h-9"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="sticky bottom-4 z-20">
        <Button onClick={save} disabled={saving} size="lg" className="bg-gradient-primary shadow-glow w-full h-12 text-base">
          {saving ? <Loader2 className="w-4 h-4 animate-spin ml-2" /> : <Check className="w-4 h-4 ml-2" />}
          حفظ كل التغييرات
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage;
