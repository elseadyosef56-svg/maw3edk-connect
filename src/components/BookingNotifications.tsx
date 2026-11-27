import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, RefreshCw, Volume2, VolumeX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

interface Notice { id: string; customer_name: string; start_time: string; created_at: string; }
export function BookingNotifications({ businessId }: { businessId: string }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [seen, setSeen] = useState("");
  const [sound, setSound] = useState(false);
  const known = useRef<Set<string> | null>(null);
  const audio = useRef<AudioContext | null>(null);
  const storageKey = `maw3edk-notices:${user?.id}:${businessId}`;
  const refresh = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from("bookings").select("id,customer_name,start_time,created_at").eq("business_id", businessId).order("created_at", { ascending: false }).limit(20);
    setLoading(false); setFailed(!!error);
    if (error || !data) return;
    const fresh = known.current ? data.filter(r => !known.current?.has(r.id)) : [];
    if (fresh.length) {
      toast.success(`حجز جديد من ${fresh[0].customer_name}`, { action: { label: "عرض", onClick: () => navigate("/dashboard/calendar") } });
      if (audio.current?.state === "running") {
        const oscillator = audio.current.createOscillator();
        const gain = audio.current.createGain();
        oscillator.connect(gain); gain.connect(audio.current.destination);
        oscillator.frequency.value = 660; gain.gain.value = 0.06;
        oscillator.start(); oscillator.stop(audio.current.currentTime + 0.18);
      }
    }
    known.current = new Set(data.map(r => r.id)); setRows(data);
  }, [businessId, navigate]);
  useEffect(() => {
    known.current = null; setRows([]);
    try { setSeen(localStorage.getItem(storageKey) || ""); } catch { setSeen(""); }
    void refresh();
    const timer = window.setInterval(() => { if (document.visibilityState === "visible") void refresh(); }, 30000);
    const onVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, [refresh, storageKey]);
  useEffect(() => () => { void audio.current?.close(); }, []);
  const unread = rows.filter(r => !seen || r.created_at > seen).length;
  const markRead = () => { const value = new Date().toISOString(); setSeen(value); try { localStorage.setItem(storageKey, value); } catch { /* Storage may be unavailable. */ } };
  const toggleSound = async () => {
    if (sound) { await audio.current?.suspend(); setSound(false); return; }
    try { audio.current ??= new AudioContext(); await audio.current.resume(); setSound(true); } catch { toast.error("تعذر تفعيل الصوت في هذا المتصفح"); }
  };
  return <Popover><PopoverTrigger asChild>
    <Button variant="ghost" size="icon" aria-label={`تنبيهات الحجوزات${unread ? `، ${unread} جديدة` : ""}`} title="تنبيهات الحجوزات" className="relative shrink-0"><Bell className="w-5 h-5" />{unread > 0 && <span className="absolute top-0 right-0 min-w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] px-1">{unread}</span>}</Button>
  </PopoverTrigger><PopoverContent align="end" className="w-80 max-w-[calc(100vw-2rem)] p-0" dir="rtl">
    <div className="flex items-center justify-between p-3 border-b"><h2 className="font-bold text-base">الحجوزات الجديدة</h2><div className="flex"><Button variant="ghost" size="icon" title={sound ? "إيقاف الصوت" : "تفعيل الصوت"} aria-label={sound ? "إيقاف الصوت" : "تفعيل الصوت"} onClick={toggleSound}>{sound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}</Button><Button variant="ghost" size="icon" disabled={loading} onClick={() => void refresh()} aria-label="تحديث التنبيهات" title="تحديث التنبيهات"><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /></Button></div></div>
    <div className="max-h-72 overflow-y-auto">{failed ? <p role="alert" className="p-4 text-sm text-destructive">تعذر تحديث التنبيهات. حاول مجدداً.</p> : rows.length === 0 ? <p className="p-6 text-sm text-muted-foreground text-center">{loading ? "جارٍ التحميل…" : "لا توجد حجوزات بعد"}</p> : rows.map(row => <Button key={row.id} variant="ghost" className={`w-full rounded-none h-auto justify-start whitespace-normal border-b p-3 text-right ${!seen || row.created_at > seen ? "bg-primary/5" : ""}`} onClick={() => { markRead(); navigate("/dashboard/calendar"); }}><div className="min-w-0"><p className="font-medium break-words">{row.customer_name}</p><p className="text-xs text-muted-foreground">{new Date(row.start_time).toLocaleString("ar-LY", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p></div></Button>)}</div>
    <Button variant="ghost" className="w-full rounded-none text-primary" onClick={markRead} disabled={!unread}><CheckCheck className="h-4 w-4 ml-2" />تحديد الكل كمقروء</Button>
  </PopoverContent></Popover>;
}