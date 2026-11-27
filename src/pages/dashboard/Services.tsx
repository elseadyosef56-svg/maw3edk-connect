import { useEffect, useState } from "react";
import { useBusiness } from "@/contexts/BusinessContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2, Scissors, Clock, Tag, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { ImagePlus, X } from "lucide-react";

interface Service {
  id: string; name: string; description: string | null;
  price: number; duration_minutes: number; is_active: boolean; image_url: string | null;
}

const empty = { name: "", description: "", price: "0", duration_minutes: "30", image_url: "" };

const Services = () => {
  const { business } = useBusiness();
  const { user } = useAuth();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  useEffect(() => {
    if (!imageFile) { setPreview(""); return; }
    const url = URL.createObjectURL(imageFile); setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const generateAiDescription = async () => {
    if (!form.name.trim()) { toast.error("اكتب اسم الخدمة أولاً"); return; }
    setAiLoading(true);
    const { data, error } = await supabase.functions.invoke("ai-describe-service", {
      body: { name: form.name.trim(), category: business?.category || null },
    });
    setAiLoading(false);
    if (error) { toast.error("تعذّر توليد الوصف"); return; }
    if (data?.error) { toast.error(data.error); return; }
    if (data?.description) {
      setForm((f) => ({ ...f, description: data.description }));
      toast.success("تم توليد الوصف بالذكاء الاصطناعي ✨");
    }
  };

  const load = async () => {
    if (!business) return;
    setLoading(true);
    const { data } = await supabase.from("services").select("*").eq("business_id", business.id).order("created_at", { ascending: false });
    setItems((data || []) as Service[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [business]);

  const openNew = () => { setEditing(null); setForm(empty); setImageFile(null); setOpen(true); };
  const openEdit = (s: Service) => {
    setEditing(s);
    setImageFile(null);
    setForm({ name: s.name, description: s.description || "", price: String(s.price), duration_minutes: String(s.duration_minutes), image_url: s.image_url || "" });
    setOpen(true);
  };

  const save = async () => {
    if (!business || !user) return;
    if (!form.name.trim()) { toast.error("الاسم مطلوب"); return; }
    setSaving(true);
    let imageUrl = form.image_url || null;
    let uploadedPath: string | null = null;
    try {
    if (imageFile) {
      const extensions: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };
      const extension = extensions[imageFile.type];
      if (!extension || imageFile.size > 5 * 1024 * 1024) throw new Error("اختر صورة JPG أو PNG أو WebP لا تتجاوز 5 ميجابايت");
      const bitmap = await createImageBitmap(imageFile); bitmap.close();
      const path = `${user.id}/services/${business.id}/${crypto.randomUUID()}.${extension}`;
      const { error } = await supabase.storage.from("service-images").upload(path, imageFile, { contentType: imageFile.type });
      if (error) throw error;
      uploadedPath = path;
      imageUrl = supabase.storage.from("service-images").getPublicUrl(path).data.publicUrl;
    }
    const payload = {
      business_id: business.id,
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: Number(form.price) || 0,
      duration_minutes: Number(form.duration_minutes) || 30,
      image_url: imageUrl,
    };
    const res = editing
      ? await supabase.from("services").update(payload).eq("id", editing.id)
      : await supabase.from("services").insert(payload);
    if (res.error) throw res.error;
    toast.success(editing ? "تم التحديث" : "تمت الإضافة");
    setOpen(false);
    load();
    } catch (error) {
      if (uploadedPath) await supabase.storage.from("service-images").remove([uploadedPath]);
      toast.error(error instanceof Error ? error.message : "تعذر حفظ الخدمة، حاول مجدداً");
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("حذف هذه الخدمة؟")) return;
    const { error } = await supabase.from("services").update({ is_active: false }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("تم الحذف");
    load();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold">الخدمات</h1>
          <p className="text-sm text-muted-foreground">أدر الخدمات التي تقدمها منشأتك.</p>
        </div>
        <Button onClick={openNew} className="bg-gradient-primary shadow-glow"><Plus className="w-4 h-4 ml-1" /> إضافة خدمة</Button>
      </div>

      {loading ? (
        <div className="grid place-items-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : items.filter(s => s.is_active).length === 0 ? (
        <div className="glass rounded-3xl p-12 text-center">
          <Scissors className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <h3 className="font-display font-bold mb-2">لا توجد خدمات بعد</h3>
          <p className="text-sm text-muted-foreground mb-4">أضف أول خدمة لتبدأ في استقبال الحجوزات.</p>
          <Button onClick={openNew} className="bg-gradient-primary"><Plus className="w-4 h-4 ml-1" /> إضافة خدمة</Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.filter(s => s.is_active).map((s) => (
            <div key={s.id} className="bg-card border rounded-lg overflow-hidden group">
              {s.image_url && <img src={s.image_url} alt={s.name} loading="lazy" decoding="async" className="w-full aspect-[4/3] object-cover" />}
              <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-display font-bold text-lg">{s.name}</h3>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" aria-label={`تعديل ${s.name}`} title="تعديل الخدمة" className="h-9 w-9" onClick={() => openEdit(s)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button size="icon" variant="ghost" aria-label={`حذف ${s.name}`} title="حذف الخدمة" className="h-9 w-9 text-destructive" onClick={() => remove(s.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                </div>
              </div>
              </div>
              {s.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{s.description}</p>}
              <div className="flex items-center gap-4 text-sm">
                <span className="flex items-center gap-1 text-primary font-medium"><Tag className="w-3.5 h-3.5" />{s.price} د.ل</span>
                <span className="flex items-center gap-1 text-muted-foreground"><Clock className="w-3.5 h-3.5" />{s.duration_minutes} د</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card max-h-[90dvh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "تعديل خدمة" : "خدمة جديدة"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="service-photo">صورة الخدمة أو المنتج</Label>
              {(preview || form.image_url) && <div className="relative"><img src={preview || form.image_url} alt="معاينة صورة الخدمة" className="w-full max-h-48 object-contain rounded-lg bg-muted" /><Button type="button" size="icon" variant="secondary" aria-label="إزالة الصورة" title="إزالة الصورة" className="absolute top-2 left-2" onClick={() => { setImageFile(null); setForm(f => ({ ...f, image_url: "" })); }}><X className="w-4 h-4" /></Button></div>}
              <div className="flex items-center gap-2 border border-dashed rounded-lg p-3"><ImagePlus className="w-5 h-5 text-primary shrink-0" /><Input id="service-photo" type="file" accept="image/jpeg,image/png,image/webp" disabled={saving} className="border-0 p-0 h-auto min-w-0" onChange={e => { const file = e.target.files?.[0]; if (!file) return; if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) { toast.error("اختر صورة JPG أو PNG أو WebP لا تتجاوز 5 ميجابايت"); e.target.value = ""; return; } setImageFile(file); }} /></div>
            </div>
            <div className="space-y-2"><Label>الاسم *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={80} /></div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>الوصف</Label>
                <Button type="button" size="sm" variant="ghost" onClick={generateAiDescription} disabled={aiLoading} className="h-7 text-xs text-primary hover:bg-primary/10">
                  {aiLoading ? <Loader2 className="w-3 h-3 animate-spin ml-1" /> : <Sparkles className="w-3 h-3 ml-1" />}
                  توليد بالذكاء الاصطناعي
                </Button>
              </div>
              <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={300} placeholder="وصف موجز جذاب…" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>السعر (د.ل)</Label><Input type="number" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
              <div className="space-y-2"><Label>المدة (دقيقة)</Label><Input type="number" min="5" step="5" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: e.target.value })} /></div>
            </div>
            <Button onClick={save} disabled={saving} className="w-full bg-gradient-primary">
              {saving && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              حفظ
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Services;
