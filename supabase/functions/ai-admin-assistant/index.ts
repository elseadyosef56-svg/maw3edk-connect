import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is the platform owner
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await userClient.auth.getUser();
    const email = userData?.user?.email?.toLowerCase();
    if (email !== "elseadyosef56@gmail.com") {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pull platform snapshot via service role
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const now = new Date();
    const startToday = new Date(now); startToday.setHours(0, 0, 0, 0);
    const start7 = new Date(now.getTime() - 7 * 86400000);
    const start30 = new Date(now.getTime() - 30 * 86400000);

    const [bizR, subR, payR, walR, bkAll, bkToday, bk7, bk30, topBizR] = await Promise.all([
      admin.from("businesses").select("id,name,status,category,created_at"),
      admin.from("subscriptions").select("business_id,plan,status,end_date"),
      admin.from("payment_requests").select("amount,status,plan,created_at"),
      admin.from("wallets").select("business_id,balance"),
      admin.from("bookings").select("*", { count: "exact", head: true }),
      admin.from("bookings").select("*", { count: "exact", head: true }).gte("start_time", startToday.toISOString()),
      admin.from("bookings").select("*", { count: "exact", head: true }).gte("start_time", start7.toISOString()),
      admin.from("bookings").select("business_id,price_snapshot,status,start_time").gte("start_time", start30.toISOString()),
      admin.from("bookings").select("business_id").gte("start_time", start30.toISOString()),
    ]);

    const businesses = bizR.data ?? [];
    const subs = subR.data ?? [];
    const payments = payR.data ?? [];
    const wallets = walR.data ?? [];
    const bookings30 = bk30.data ?? [];

    const totalRevenue = payments.filter((p: any) => p.status === "approved").reduce((s: number, p: any) => s + Number(p.amount || 0), 0);
    const totalWallets = wallets.reduce((s: number, w: any) => s + Number(w.balance || 0), 0);
    const pendingPay = payments.filter((p: any) => p.status === "pending").length;
    const activeBiz = businesses.filter((b: any) => b.status === "active").length;
    const trialBiz = businesses.filter((b: any) => b.status === "trial").length;
    const suspendedBiz = businesses.filter((b: any) => b.status === "suspended").length;

    // Top businesses by bookings (last 30 days)
    const bookingsByBiz: Record<string, number> = {};
    const revenueByBiz: Record<string, number> = {};
    bookings30.forEach((b: any) => {
      bookingsByBiz[b.business_id] = (bookingsByBiz[b.business_id] || 0) + 1;
      if (b.status !== "cancelled" && b.status !== "no_show") {
        revenueByBiz[b.business_id] = (revenueByBiz[b.business_id] || 0) + Number(b.price_snapshot || 0);
      }
    });
    const top5 = Object.entries(bookingsByBiz)
      .sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([id, count]) => {
        const biz = businesses.find((x: any) => x.id === id);
        return { name: biz?.name ?? "—", bookings: count, revenue: revenueByBiz[id] || 0 };
      });

    const snapshot = {
      تاريخ_التقرير: now.toISOString(),
      إجمالي_المنشآت: businesses.length,
      منشآت_مفعلة: activeBiz,
      منشآت_تجريبية: trialBiz,
      منشآت_موقوفة: suspendedBiz,
      إجمالي_الإيرادات_المعتمدة: totalRevenue,
      رصيد_المحافظ_الإجمالي: totalWallets,
      طلبات_دفع_معلقة: pendingPay,
      إجمالي_الحجوزات: bkAll.count ?? 0,
      حجوزات_اليوم: bkToday.count ?? 0,
      حجوزات_آخر_7_أيام: bk7.count ?? 0,
      حجوزات_آخر_30_يوم: bookings30.length,
      أفضل_5_منشآت_آخر_30_يوم: top5,
      توزيع_الباقات: subs.reduce((acc: any, s: any) => {
        acc[s.plan] = (acc[s.plan] || 0) + 1; return acc;
      }, {}),
    };

    const systemPrompt = `أنت "مستشار المنصة" — مساعد ذكي خاص بمالك منصة موعدك (maw3edk-connect) لحجز مواعيد العيادات وصالونات التجميل في ليبيا.

مهمتك:
- الإجابة عن أسئلة المالك حول بيانات منصته بدقة من التقرير الفوري أدناه.
- تقديم تحليلات ذكية واقتراحات تسويقية وأفكار نمو الأعمال باللغة العربية الفصحى.
- استخدام أرقام محددة وتنسيق Markdown (عناوين، نقاط، جداول قصيرة) لسهولة القراءة.
- إذا سُئلت عن شيء غير موجود في التقرير، قل ذلك بصراحة بدلاً من التخمين.
- العملة بالدينار الليبي (د.ل).

تقرير المنصة الحالي (JSON):
\`\`\`json
${JSON.stringify(snapshot, null, 2)}
\`\`\``;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
      }),
    });

    if (res.status === 429) {
      return new Response(JSON.stringify({ error: "تم تجاوز حد الطلبات، حاول بعد قليل." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (res.status === 402) {
      return new Response(JSON.stringify({ error: "نفذت أرصدة الذكاء الاصطناعي. يرجى الترقية." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!res.ok) {
      const txt = await res.text();
      return new Response(JSON.stringify({ error: txt }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content?.trim() ?? "";
    return new Response(JSON.stringify({ reply, snapshot }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
