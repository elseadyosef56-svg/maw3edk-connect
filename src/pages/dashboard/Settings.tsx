import { useEffect, useState } from "react";
import { useBusiness } from "@/contexts/BusinessContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { defaultHours, dayKeys, dayLabels, WorkingHours, categoryLabels } from "@/lib/business";

const SettingsPage = () => {
  const { business, refresh } = useBusiness();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [phone, setPhone] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [hours, setHours] = useState<WorkingHours>(defaultHours);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"logo" | "cover" | null>(null);

  useEffect(() => {
    if (!business) return;
    setName(business.name);
    setCategory(business.category || "");
    setPhone(business.phone || "");
    setLogoUrl(business.logo_url);
    setCoverUrl(business.cover_url);
    setHours({ ...defaultHours, ...(business.working_hours || {}) });
  }, [business]);

  const upload = async (file: File, kind: "logo" | "cover") => {
    if (!user || !business) return;
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
      logo_url: logoUrl,
      cover_url: coverUrl,
      working_hours: hours as any,
    }).eq("id", business.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("تم الحفظ");
    refresh();
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-2xl font-display font-bold">الإعدادات</h1>
        <p className="text-sm text-muted-foreground">بيانات منشأتك وساعات العمل.</p>
      </div>

      <div className="glass rounded-3xl p-6 space-y-5">
        <h2 className="font-display font-bold">بيانات المنشأة</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2"><Label>اسم المنشأة</Label><Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} /></div>
          <div className="space-y-2">
            <Label>التصنيف</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue placeholder="اختر" /></SelectTrigger>
              <SelectContent>
                {Object.entries(categoryLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>رقم الهاتف</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" /></div>
          <div className="space-y-2">
            <Label>الرابط العام</Label>
            <Input value={business?.slug || ""} disabled dir="ltr" />
          </div>
        </div>
      </div>

      <div className="glass rounded-3xl p-6 space-y-5">
        <h2 className="font-display font-bold">الشعار وصورة الغلاف</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>الشعار</Label>
            <div className="flex items-center gap-3">
              {logoUrl && <img src={logoUrl} alt="logo" className="w-16 h-16 rounded-xl object-cover" />}
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "logo")} />
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-sm font-medium hover:bg-secondary/80">
                  {uploading === "logo" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  رفع
                </span>
              </label>
            </div>
          </div>
          <div className="space-y-2">
            <Label>صورة الغلاف</Label>
            <div className="flex items-center gap-3">
              {coverUrl && <img src={coverUrl} alt="cover" className="w-24 h-16 rounded-xl object-cover" />}
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0], "cover")} />
                <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-sm font-medium hover:bg-secondary/80">
                  {uploading === "cover" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  رفع
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="glass rounded-3xl p-6 space-y-5">
        <h2 className="font-display font-bold">ساعات العمل</h2>
        <div className="space-y-3">
          {dayKeys.map((d) => (
            <div key={d} className="grid grid-cols-12 gap-3 items-center">
              <div className="col-span-3 sm:col-span-2 font-medium">{dayLabels[d]}</div>
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
                className="col-span-3 sm:col-span-4"
              />
              <Input
                type="time"
                value={hours[d]?.close || "21:00"}
                disabled={hours[d]?.closed}
                onChange={(e) => setHours({ ...hours, [d]: { ...hours[d], close: e.target.value } })}
                className="col-span-3 sm:col-span-4"
              />
            </div>
          ))}
        </div>
      </div>

      <Button onClick={save} disabled={saving} className="bg-gradient-primary shadow-glow w-full sm:w-auto">
        {saving && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
        حفظ التغييرات
      </Button>
    </div>
  );
};

export default SettingsPage;
