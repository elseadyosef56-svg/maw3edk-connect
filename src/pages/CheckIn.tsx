import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Loader2, Check, AlertCircle } from "lucide-react";

const CheckIn = () => {
  const { token } = useParams();
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<"loading" | "ok" | "already" | "error" | "noauth">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (authLoading) return;
    if (!user) { setState("noauth"); return; }
    if (!token) { setState("error"); setMessage("رابط غير صالح"); return; }
    (async () => {
      const { data: booking } = await supabase.from("bookings")
        .select("id, status, customer_name").eq("qr_token", token).maybeSingle();
      if (!booking) { setState("error"); setMessage("الحجز غير موجود"); return; }
      if (booking.status === "arrived" || booking.status === "completed") {
        setState("already"); setMessage(`الحجز للزبون ${booking.customer_name} تم تسجيله مسبقاً`); return;
      }
      const { error } = await supabase.from("bookings").update({ status: "arrived" as any }).eq("id", booking.id);
      if (error) { setState("error"); setMessage(error.message); return; }
      setState("ok"); setMessage(`تم تسجيل حضور ${booking.customer_name}`);
    })();
  }, [token, user, authLoading]);

  return (
    <div className="min-h-screen grid place-items-center p-4">
      <div className="glass rounded-3xl p-8 max-w-sm w-full text-center">
        {state === "loading" && <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto" />}
        {state === "noauth" && (
          <>
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <p className="font-display font-bold mb-3">يجب تسجيل الدخول</p>
            <Button asChild className="bg-gradient-primary"><Link to="/auth">تسجيل الدخول</Link></Button>
          </>
        )}
        {state === "ok" && <><div className="w-16 h-16 rounded-full bg-gradient-primary grid place-items-center mx-auto mb-3 shadow-glow"><Check className="w-8 h-8 text-primary-foreground" /></div><p className="font-display font-bold">{message}</p></>}
        {state === "already" && <><AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-3" /><p>{message}</p></>}
        {state === "error" && <><AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" /><p>{message}</p></>}
        {(state === "ok" || state === "already" || state === "error") && (
          <Button asChild variant="outline" className="mt-4 w-full"><Link to="/dashboard/calendar">العودة للتقويم</Link></Button>
        )}
      </div>
    </div>
  );
};

export default CheckIn;
