import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2, Phone, Clock, Check, Calendar as CalendarIcon, ArrowRight,
  Sparkles, MessageCircle, MapPin, Instagram, Star, Shield, Award
} from "lucide-react";
import { toast } from "sonner";
import { addDays, addMinutes, format, isAfter, isBefore, startOfDay } from "date-fns";
import { ar } from "date-fns/locale";
import {
  dayKeys, defaultHours, WorkingHours, getCategoryConfig,
  buildWhatsAppLink, formatBookingMessage
} from "@/lib/business";

interface Biz {
  id: string; name: string; slug: string; category: string | null;
  phone: string | null; whatsapp_number: string | null;
  address: string | null; description: string | null; instagram: string | null;
  logo_url: string | null; cover_url: string | null;
  working_hours: any; status: string;
}
interface Service { id: string; name: string; description: string | null; price: number; duration_minutes: number; }
interface Employee { id: string; name: string; service_ids: string[]; image_url: string | null; }

const PublicBooking = () => {
  const { slug } = useParams();
  const [biz, setBiz] = useState<Biz | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [bookings, setBookings] = useState<{ start_time: string; end_time: string; employee_id: string }[]>([]);
  const [promos, setPromos] = useState<{ id: string; title: string; description: string | null; discount_percent: number; ends_at: string; service_id: string | null; }[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [service, setService] = useState<Service | null>(null);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [date, setDate] = useState<Date>(addDays(startOfDay(new Date()), 0));
  const [slot, setSlot] = useState<Date | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [whatsappLink, setWhatsappLink] = useState<string>("");

  const cfg = useMemo(() => getCategoryConfig(biz?.category), [biz?.category]);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data: b } = await supabase.from("businesses")
        .select("id, name, slug, category, phone, whatsapp_number, address, description, instagram, logo_url, cover_url, working_hours, status")
        .eq("slug", slug).maybeSingle();
      if (!b) { setLoading(false); return; }
      setBiz(b as Biz);
      const [sRes, eRes, pRes] = await Promise.all([
        supabase.from("services").select("*").eq("business_id", b.id).eq("is_active", true).order("name"),
        supabase.from("employees").select("id, name, service_ids, image_url").eq("business_id", b.id).eq("is_active", true).order("name"),
        supabase.from("promotions" as any).select("id, title, description, discount_percent, ends_at, service_id")
          .eq("business_id", b.id).eq("is_active", true).gt("ends_at", new Date().toISOString()),
      ]);
      setServices((sRes.data || []) as Service[]);
      setEmployees((eRes.data || []) as Employee[]);
      setPromos((pRes.data || []) as any);
      setLoading(false);
    })();
  }, [slug]);

  useEffect(() => {
    if (!biz || !employee || !date) return;
    (async () => {
      const start = startOfDay(date).toISOString();
      const end = addDays(startOfDay(date), 1).toISOString();
      const { data } = await supabase.from("bookings")
        .select("start_time, end_time, employee_id, status")
        .eq("business_id", biz.id)
        .eq("employee_id", employee.id)
        .gte("start_time", start)
        .lt("start_time", end);
      setBookings((data || []).filter((b: any) => b.status !== "cancelled" && b.status !== "no_show"));
    })();
  }, [biz, employee, date]);

  const hours: WorkingHours = useMemo(() => ({ ...defaultHours, ...(biz?.working_hours || {}) }), [biz]);

  const slots = useMemo(() => {
    if (!service || !employee || !date) return [];
    const dKey = dayKeys[date.getDay()];
    const h = hours[dKey];
    if (!h || h.closed) return [];
    const [oh, om] = h.open.split(":").map(Number);
    const [ch, cm] = h.close.split(":").map(Number);
    const start = new Date(date); start.setHours(oh, om, 0, 0);
    const end = new Date(date); end.setHours(ch, cm, 0, 0);
    const out: Date[] = [];
    let cur = start;
    while (isBefore(addMinutes(cur, service.duration_minutes), addMinutes(end, 1))) {
      const slotEnd = addMinutes(cur, service.duration_minutes);
      const conflict = bookings.some(b => {
        const bs = new Date(b.start_time), be = new Date(b.end_time);
        return isBefore(cur, be) && isAfter(slotEnd, bs);
      });
      const inFuture = isAfter(cur, new Date());
      if (!conflict && inFuture) out.push(new Date(cur));
      cur = addMinutes(cur, 15);
    }
    return out;
  }, [service, employee, date, hours, bookings]);

  const availableEmployees = useMemo(
    () => service ? employees.filter(e => e.service_ids?.includes(service.id)) : [],
    [employees, service]
  );

  const submit = async () => {
    if (!biz || !service || !employee || !slot) return;
    if (!name.trim() || name.trim().length < 2) { toast.error("الاسم مطلوب"); return; }
    if (!phone.trim() || phone.trim().length < 7) { toast.error("رقم هاتف صحيح مطلوب"); return; }
    setSubmitting(true);
    const start_time = slot.toISOString();
    const end_time = addMinutes(slot, service.duration_minutes).toISOString();
    const { data, error } = await supabase.from("bookings").insert({
      business_id: biz.id,
      service_id: service.id,
      employee_id: employee.id,
      customer_name: name.trim(),
      customer_phone: phone.trim(),
      customer_notes: notes.trim() || null,
      start_time, end_time,
      price_snapshot: service.price,
    }).select("qr_token").maybeSingle();
    setSubmitting(false);
    if (error) { toast.error(error.message); return; }

    // Build WhatsApp link to the BUSINESS owner's number
    const targetNumber = biz.whatsapp_number || biz.phone || "";
    if (targetNumber) {
      const message = formatBookingMessage({
        businessName: biz.name,
        customerName: name.trim(),
        customerPhone: phone.trim(),
        serviceName: service.name,
        staffName: employee.name,
        staffLabel: cfg.staffSingular,
        dateTime: format(slot, "EEEE d MMMM yyyy - HH:mm", { locale: ar }),
        price: service.price,
        notes: notes.trim() || undefined,
      });
      const link = buildWhatsAppLink(targetNumber, message);
      setWhatsappLink(link);
      // Auto-open WhatsApp in a new tab so the booking is delivered
      if (link) {
        setTimeout(() => window.open(link, "_blank", "noopener"), 500);
      }
    }

    setSuccess(data?.qr_token || "");
  };

  if (loading) return (
    <div className="min-h-screen grid place-items-center bg-gradient-mesh">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  );

  if (!biz) return (
    <div className="min-h-screen grid place-items-center p-4 text-center">
      <div className="glass rounded-3xl p-8 max-w-sm">
        <h1 className="text-2xl font-display font-bold mb-2">المنشأة غير موجودة</h1>
        <p className="text-muted-foreground mb-4">الرابط الذي تحاول الوصول إليه غير صحيح.</p>
        <Button asChild className="bg-gradient-primary"><Link to="/">العودة للرئيسية</Link></Button>
      </div>
    </div>
  );

  if (success !== null) {
    return (
      <div className="min-h-screen grid place-items-center p-4 bg-gradient-mesh">
        <div className="glass-strong rounded-3xl p-6 sm:p-8 max-w-md w-full text-center animate-slide-up">
          <div className="relative inline-block mb-5">
            <div className="absolute inset-0 bg-gradient-primary rounded-full blur-2xl opacity-50 animate-pulse" />
            <div className="relative w-20 h-20 rounded-full bg-gradient-primary grid place-items-center mx-auto shadow-glow">
              <Check className="w-10 h-10 text-primary-foreground" strokeWidth={3} />
            </div>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold mb-2 text-gradient">تم تأكيد حجزك!</h1>
          <p className="text-muted-foreground mb-5 text-sm sm:text-base">
            نراك في <span className="font-bold text-foreground">{biz.name}</span>
            <br />
            {format(slot!, "EEEE d MMMM yyyy", { locale: ar })}
            <br />
            الساعة <span className="font-bold text-primary">{format(slot!, "HH:mm")}</span>
          </p>

          <div className="p-4 rounded-2xl bg-secondary/60 mb-4 text-right text-sm space-y-2">
            <div className="flex justify-between"><span className="text-muted-foreground">{cfg.servicesLabel.split(" ")[0]}</span><span className="font-bold">{service?.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">{cfg.staffSingular}</span><span className="font-bold">{employee?.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">السعر</span><span className="font-bold text-primary">{service?.price} د.ل</span></div>
          </div>

          {whatsappLink && (
            <Button asChild className="w-full bg-[#25D366] hover:bg-[#1eb158] text-white h-12 mb-2 shadow-lg">
              <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="w-5 h-5 ml-2" />
                إرسال تأكيد للمنشأة عبر واتساب
              </a>
            </Button>
          )}

          <Button asChild variant="outline" className="w-full h-11">
            <Link to={`/${biz.slug}`} onClick={() => window.location.reload()}>حجز موعد آخر</Link>
          </Button>

          <p className="text-xs text-muted-foreground mt-4">احتفظ برقم الحجز للمراجعة عند الحضور.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-12 bg-gradient-mesh">
      {/* Premium Hero */}
      <div className="booking-hero">
        <div className="relative">
          {biz.cover_url && (
            <img src={biz.cover_url} alt={biz.name} className="absolute inset-0 w-full h-full object-cover opacity-30" />
          )}
          <div className="relative container max-w-3xl px-4 pt-8 pb-20 sm:pt-12 sm:pb-28">
            <div className="flex items-center gap-3 mb-4 text-white/90 text-xs sm:text-sm">
              <Shield className="w-4 h-4" />
              <span>منصة موعدك — حجز آمن وسريع</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-display font-extrabold text-white mb-2">
              احجز موعدك في <br className="sm:hidden" />
              <span className="bg-gradient-to-r from-amber-200 to-amber-50 bg-clip-text text-transparent">{biz.name}</span>
            </h1>
            {biz.description && (
              <p className="text-white/85 text-sm sm:text-base mt-2 max-w-xl leading-relaxed">{biz.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-3 mt-4 text-xs sm:text-sm text-white/85">
              {biz.category && (
                <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <Sparkles className="w-3 h-3" /> {getCategoryConfig(biz.category).label}
                </span>
              )}
              {biz.address && (
                <span className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm px-3 py-1.5 rounded-full">
                  <MapPin className="w-3 h-3" /> {biz.address}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Identity card */}
      <div className="container max-w-3xl px-4 -mt-14 relative z-10">
        <div className="glass-strong rounded-3xl p-4 sm:p-5 mb-5 flex items-center gap-3 sm:gap-4">
          {biz.logo_url
            ? <img src={biz.logo_url} alt="logo" className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-4 border-background shadow-lg shrink-0" />
            : <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-primary grid place-items-center text-primary-foreground text-xl sm:text-2xl font-bold border-4 border-background shadow-lg shrink-0">{biz.name.charAt(0)}</div>
          }
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="text-xs text-muted-foreground mr-1">منصة معتمدة</span>
            </div>
            <h2 className="font-display font-bold text-base sm:text-lg truncate">{biz.name}</h2>
            <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
              {biz.phone && <a href={`tel:${biz.phone}`} className="inline-flex items-center gap-1 text-primary" dir="ltr"><Phone className="w-3 h-3" />{biz.phone}</a>}
              {biz.instagram && <a href={`https://instagram.com/${biz.instagram}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary"><Instagram className="w-3 h-3" />@{biz.instagram}</a>}
            </div>
          </div>
        </div>

        {/* Stepper */}
        <div className="mb-5 px-1">
          <div className="flex items-center gap-1 sm:gap-2">
            {[
              { n: 1, label: cfg.servicesLabel.split(" ")[0] },
              { n: 2, label: cfg.staffSingular },
              { n: 3, label: "الموعد" },
              { n: 4, label: "البيانات" },
            ].map((s, i, arr) => (
              <div key={s.n} className="flex-1 flex items-center">
                <div className="flex flex-col items-center flex-1 min-w-0">
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full grid place-items-center text-xs sm:text-sm font-bold transition-all ${
                    step >= s.n
                      ? "bg-gradient-primary text-primary-foreground shadow-glow scale-110"
                      : "bg-secondary text-muted-foreground"
                  }`}>
                    {step > s.n ? <Check className="w-4 h-4" /> : s.n}
                  </div>
                  <span className={`text-[10px] sm:text-xs mt-1 truncate w-full text-center ${step >= s.n ? "text-foreground font-bold" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                </div>
                {i < arr.length - 1 && (
                  <div className={`h-0.5 w-full mb-5 transition-colors ${step > s.n ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Service */}
        {step === 1 && (
          <div className="glass-strong rounded-3xl p-4 sm:p-6 animate-slide-up">
            <h2 className="font-display font-bold text-lg mb-1 flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" /> اختر {cfg.servicesLabel.split(" ")[0]}
            </h2>
            <p className="text-xs text-muted-foreground mb-4">اختر ما يناسبك من الخيارات المتاحة</p>
            {services.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">لا توجد خدمات متاحة حالياً.</p>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                {services.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setService(s); setEmployee(null); setSlot(null); setStep(2); }}
                    className={`service-card text-right ${service?.id === s.id ? "selected" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-sm sm:text-base flex-1 min-w-0">{s.name}</h3>
                      <span className="shrink-0 text-primary font-display font-extrabold text-base sm:text-lg">{s.price}<span className="text-xs font-normal mr-1">د.ل</span></span>
                    </div>
                    {s.description && <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{s.description}</p>}
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />{s.duration_minutes} دقيقة
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Employee */}
        {step === 2 && (
          <div className="glass-strong rounded-3xl p-4 sm:p-6 animate-slide-up">
            <button onClick={() => setStep(1)} className="text-xs text-muted-foreground mb-3 inline-flex items-center gap-1 hover:text-primary"><ArrowRight className="w-3 h-3" /> رجوع</button>
            <h2 className="font-display font-bold text-lg mb-1">اختر {cfg.staffSingular}</h2>
            <p className="text-xs text-muted-foreground mb-4">اختر من يقدّم لك الخدمة</p>
            {availableEmployees.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">لا يوجد {cfg.staffSingular} يقدم هذه الخدمة حالياً.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {availableEmployees.map(e => (
                  <button
                    key={e.id}
                    onClick={() => { setEmployee(e); setSlot(null); setStep(3); }}
                    className={`service-card text-center ${employee?.id === e.id ? "selected" : ""}`}
                  >
                    {e.image_url ? (
                      <img src={e.image_url} alt={e.name} className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover mx-auto mb-2 border-2 border-primary/20" />
                    ) : (
                      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-primary text-primary-foreground grid place-items-center mx-auto mb-2 font-bold text-lg shadow-glow">
                        {e.name.charAt(0)}
                      </div>
                    )}
                    <p className="font-bold text-sm">{e.name}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 3: Date + Slot */}
        {step === 3 && (
          <div className="glass-strong rounded-3xl p-4 sm:p-6 animate-slide-up">
            <button onClick={() => setStep(2)} className="text-xs text-muted-foreground mb-3 inline-flex items-center gap-1 hover:text-primary"><ArrowRight className="w-3 h-3" /> رجوع</button>
            <h2 className="font-display font-bold text-lg mb-1 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" /> اختر اليوم والوقت
            </h2>
            <p className="text-xs text-muted-foreground mb-4">المواعيد المتاحة فقط ستظهر لك</p>

            <div className="flex gap-2 overflow-x-auto pb-3 mb-5 -mx-1 px-1 scrollbar-thin">
              {Array.from({ length: 14 }, (_, i) => addDays(startOfDay(new Date()), i)).map(d => {
                const isSel = d.getTime() === date.getTime();
                return (
                  <button
                    key={d.toISOString()}
                    onClick={() => { setDate(d); setSlot(null); }}
                    className={`shrink-0 w-14 sm:w-16 py-2.5 rounded-2xl text-center transition-all border-2 ${
                      isSel
                        ? "bg-gradient-primary text-primary-foreground border-primary shadow-glow scale-105"
                        : "bg-card border-border hover:border-primary/40"
                    }`}
                  >
                    <div className={`text-[10px] sm:text-xs ${isSel ? "opacity-90" : "text-muted-foreground"}`}>{format(d, "EEE", { locale: ar })}</div>
                    <div className="text-lg font-bold">{format(d, "d")}</div>
                    <div className={`text-[9px] sm:text-[10px] ${isSel ? "opacity-90" : "text-muted-foreground"}`}>{format(d, "MMM", { locale: ar })}</div>
                  </button>
                );
              })}
            </div>

            {slots.length === 0 ? (
              <div className="text-center py-8 px-4 rounded-2xl bg-secondary/40">
                <Clock className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-bold">لا أوقات متاحة في هذا اليوم</p>
                <p className="text-xs text-muted-foreground mt-1">جرب يوماً آخر</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {slots.map(t => (
                  <button
                    key={t.toISOString()}
                    onClick={() => { setSlot(t); setStep(4); }}
                    className={`slot-btn ${slot?.getTime() === t.getTime() ? "selected" : ""}`}
                  >
                    {format(t, "HH:mm")}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Customer info */}
        {step === 4 && (
          <div className="glass-strong rounded-3xl p-4 sm:p-6 animate-slide-up space-y-4">
            <button onClick={() => setStep(3)} className="text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-primary"><ArrowRight className="w-3 h-3" /> رجوع</button>
            <h2 className="font-display font-bold text-lg">بياناتك للحجز</h2>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 text-sm space-y-1.5">
              <div className="flex justify-between gap-2"><span className="text-muted-foreground shrink-0">الخدمة</span><span className="font-bold text-left">{service?.name}</span></div>
              <div className="flex justify-between gap-2"><span className="text-muted-foreground shrink-0">{cfg.staffSingular}</span><span className="font-bold">{employee?.name}</span></div>
              <div className="flex justify-between gap-2"><span className="text-muted-foreground shrink-0">الموعد</span><span className="font-bold text-left text-xs sm:text-sm">{slot && format(slot, "EEEE d MMM HH:mm", { locale: ar })}</span></div>
              <div className="flex justify-between gap-2 pt-2 border-t border-primary/20"><span className="text-muted-foreground shrink-0">السعر الإجمالي</span><span className="font-display font-extrabold text-lg text-primary">{service?.price} د.ل</span></div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-sm font-bold">الاسم الكامل *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className="h-12 text-base" placeholder="اسمك الكامل" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-bold">رقم الهاتف *</Label>
                <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" placeholder="091XXXXXXX" className="h-12 text-base" />
                <p className="text-[10px] text-muted-foreground">سنستخدمه للتواصل بخصوص الموعد فقط</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-bold">ملاحظات (اختياري)</Label>
                <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={300} placeholder="أي معلومات إضافية..." />
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs flex items-start gap-2">
              <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="text-emerald-700 dark:text-emerald-300">سيتم إرسال تفاصيل الحجز إلى {biz.name} عبر واتساب فوراً للتأكيد.</span>
            </div>

            <Button onClick={submit} disabled={submitting} className="w-full bg-gradient-primary shadow-glow h-13 text-base font-bold">
              {submitting && <Loader2 className="w-4 h-4 animate-spin ml-2" />}
              تأكيد الحجز • {service?.price} د.ل
            </Button>
          </div>
        )}

        <div className="text-center mt-6 text-xs text-muted-foreground">
          مدعوم من <Link to="/" className="text-primary font-bold">موعدك</Link>
        </div>
      </div>
    </div>
  );
};

export default PublicBooking;
