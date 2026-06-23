import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Bot, Send, Loader2, Sparkles, User } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Msg { role: "user" | "assistant"; content: string; }

const SUGGESTIONS = [
  "ما هي أفضل 5 منشآت أداءً هذا الشهر؟",
  "كم إيرادات المنصة اليوم وآخر 7 أيام؟",
  "اقترح حملة تسويقية لزيادة الاشتراكات.",
  "ما المنشآت التي يجب متابعتها بسبب انخفاض النشاط؟",
];

export const AdminAssistant = () => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = async (text?: string) => {
    const content = (text ?? input).trim();
    if (!content || loading) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-admin-assistant", {
        body: { messages: next.map(m => ({ role: m.role, content: m.content })) },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setMessages([...next, { role: "assistant", content: (data as any).reply || "—" }]);
    } catch (e: any) {
      toast.error(e.message || "تعذّر الاتصال بالمساعد");
      setMessages(next);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm overflow-hidden flex flex-col h-[70vh]">
      <div className="px-4 sm:px-5 py-3 border-b border-white/10 flex items-center gap-3 bg-gradient-to-r from-amber-500/10 to-fuchsia-500/10">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-fuchsia-500 grid place-items-center">
          <Bot className="w-5 h-5 text-slate-900" />
        </div>
        <div>
          <p className="font-bold">مستشار المنصة الذكي</p>
          <p className="text-xs text-white/60">يقرأ بيانات منصتك مباشرةً ويقدّم تحليلات واقتراحات</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8 space-y-4">
            <Sparkles className="w-10 h-10 text-amber-300 mx-auto" />
            <p className="text-white/70">اسأل عن أي شيء يخص منصتك</p>
            <div className="flex flex-wrap gap-2 justify-center max-w-xl mx-auto">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)}
                  className="text-xs px-3 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition text-white/80">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}>
            <div className={`w-8 h-8 rounded-lg grid place-items-center shrink-0 ${
              m.role === "user" ? "bg-amber-500 text-slate-900" : "bg-gradient-to-br from-fuchsia-500 to-violet-600 text-white"
            }`}>
              {m.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            <div className={`rounded-2xl px-4 py-3 max-w-[85%] text-sm leading-relaxed ${
              m.role === "user" ? "bg-amber-500/15 border border-amber-500/30" : "bg-white/5 border border-white/10"
            }`}>
              <div className="prose prose-sm prose-invert max-w-none prose-headings:text-amber-200 prose-strong:text-white prose-p:my-2 prose-ul:my-2">
                <ReactMarkdown>{m.content}</ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg grid place-items-center bg-gradient-to-br from-fuchsia-500 to-violet-600">
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            </div>
            <div className="rounded-2xl px-4 py-3 bg-white/5 border border-white/10 text-sm text-white/60">يفكّر...</div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="p-3 sm:p-4 border-t border-white/10 bg-slate-900/40">
        <div className="flex gap-2 items-end">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="اسأل عن المنشآت، الإيرادات، أو اطلب اقتراحاً تسويقياً..."
            rows={1}
            disabled={loading}
            className="resize-none bg-white/5 border-white/10 text-white placeholder:text-white/40 min-h-[44px] max-h-32"
          />
          <Button onClick={() => send()} disabled={loading || !input.trim()}
            className="h-11 w-11 p-0 bg-gradient-to-br from-amber-400 to-amber-600 hover:opacity-90 text-slate-900 shrink-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  );
};
