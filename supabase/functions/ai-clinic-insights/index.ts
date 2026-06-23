import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve user's business
    const { data: prof } = await userClient.from("profiles").select("business_id").eq("user_id", userData.user.id).maybeSingle();
    const businessId = (prof as any)?.business_id;
    if (!businessId) {
      return new Response(JSON.stringify({ error: "no business" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const now = new Date();
    const start30 = new Date(now.getTime() - 30 * 86400000).toISOString();
    const start7 = new Date(now.getTime() - 7 * 86400000).toISOString();

    const [bizR, bkR, svcR, empR, walR] = await Promise.all([
      admin.from("businesses").select("name,category").eq("id", businessId).maybeSingle(),
      admin.from("bookings").select("price_snapshot,status,start_time,service_id").eq("business_id", businessId).gte("start_time", start30),
      admin.from("services").select("id,name,price").eq("business_id", businessId).eq("is_active", true),
      admin.from("employees").select("id", { count: "exact", head: true }).eq("business_id", businessId).eq("is_active", true),
      admin.from("wallets").select("balance").eq("business_id", businessId).maybeSingle(),
    ]);

    const bookings = bkR.data ?? [];
    const services = svcR.data ?? [];
    const last7 = bookings.filter((b: any) => b.start_time >= start7);
    const completed = bookings.filter((b: any) => b.status !== "cancelled" && b.status !== "no_show");
    const cancelled = bookings.filter((b: any) => b.status === "cancelled" || b.status === "no_show");
    const revenue30 = completed.reduce((s: number, b: any) => s + Number(b.price_snapshot || 0), 0);
    const byService: Record<string, number> = {};
    bookings.forEach((b: any) => { byService[b.service_id] = (byService[b.service_id] || 0) + 1; });
    const topServices = Object.entries(byService).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([id, c]) => {
      const s = services.find((x: any) => x.id === id); return { name: s?.name ?? "—", count: c };
    });

    const snap = {
      المنشأة: (bizR.data as any)?.name,
      التصنيف: (bizR.data as any)?.category,
      رصيد_المحفظة: Number((walR.data as any)?.balance ?? 0),
      عدد_الموظفين: empR.count ?? 0,
      حجوزات_30_يوم: bookings.length,
      حجوزات_7_أيام: last7.length,
      حجوزات_ملغاة: cancelled.length,
      نسبة_الإلغاء: bookings.length ? Math.round((cancelled.length / bookings.length) * 100) : 0,
      إيراد_30_يوم: revenue30,
      أفضل_الخدمات: topServices,
      عدد_الخدمات_المفعّلة: services.length,
    };

    const prompt = `أنت مستشار أعمال متخصص في عيادات وصالونات ليبيا. حلّل بيانات هذه المنشأة وقدّم:
1) **ملخص الأداء** (3 جمل قصيرة).
2) **3 نقاط قوة** و **3 نقاط للتحسين**.
3) **3 اقتراحات تسويقية عملية** قابلة للتنفيذ هذا الأسبوع.

استخدم Markdown مع عناوين وأرقام محددة. كن مختصراً ومفيداً. العملة د.ل.

بيانات المنشأة:
\`\`\`json
${JSON.stringify(snap, null, 2)}
\`\`\``;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "أنت مستشار أعمال عربي محترف، تكتب باحترافية وإيجاز." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (res.status === 429) return new Response(JSON.stringify({ error: "تم تجاوز الحد، حاول لاحقاً." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (res.status === 402) return new Response(JSON.stringify({ error: "نفذت أرصدة الذكاء الاصطناعي." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    if (!res.ok) {
      const txt = await res.text();
      return new Response(JSON.stringify({ error: txt }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const data = await res.json();
    const insights = data.choices?.[0]?.message?.content?.trim() ?? "";
    return new Response(JSON.stringify({ insights, snapshot: snap }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
