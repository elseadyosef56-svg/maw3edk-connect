import { useEffect, useState } from "react";
import { useBusiness } from "@/contexts/BusinessContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Loader2, Scissors, Clock, Tag } from "lucide-react";
import { toast } from "sonner";

interface Service {
  id: string; name: string; description: string | null;
  price: number; duration_minutes: number; is_active: boolean;
}

const empty = { name: "", description: "", price: "0", duration_minutes: "30" };

const Services = () => {
  const { business } = useBusiness();
  const [items, setItems] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    if (!business) return;
    setLoading(true);
    const { data } = await supabase.from("services").select("*").eq("business_id", business.id).order("created_at", { ascending: false });
    setItems((data || []) as Service[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, [business]);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (s: Service) => {
    setEditing(s);
    setForm({ name: s.name, description: s.description || "", price: String(s.price), duration_minutes: String(s.duration_minutes) });
    setOpen(true);
  };

  const save = async () => {
    if (!business) return;
    if (!form.name.trim()) { toast.error("الاسم مطلوب"); return; }
    setSaving(true);
    const payload = {
      business_id: business.id,
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: Number(form.price) || 0,
      duration_minutes: Number(form.duration_minutes) || 30,
    };
    const res = editing
      ? await supabase.from("services").update(payload).eq("id", editing.id)
      : await supabase.from("services").insert(payload);
    setSaving(false);
    if (res.error) { toast.error(res.error.message); return; }
    toast.success(editing ? "تم التحديث" : "تمت الإضافة");
    setOpen(false);
    load();
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
            <div key={s.id} className="glass rounded-2xl p-5 group">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-display font-bold text-lg">{s.name}</h3>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(s)}><Pencil className="w-3.5 h-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(s.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
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
        <DialogContent className="glass">
          <DialogHeader><DialogTitle>{editing ? "تعديل خدمة" : "خدمة جديدة"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2"><Label>الاسم *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={80} /></div>
            <div className="space-y-2"><Label>الوصف</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} maxLength={300} /></div>
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
