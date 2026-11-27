import { Headphones, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SUPPORT_PHONE, SUPPORT_TEL, SUPPORT_WHATSAPP } from "@/lib/support";

export function SupportWidget() {
  return <div className="fixed bottom-4 left-4 z-40 pb-[env(safe-area-inset-bottom)]">
    <Popover>
      <PopoverTrigger asChild><Button size="icon" className="h-12 w-12 rounded-full shadow-glow" aria-label="التواصل مع الدعم" title="التواصل مع الدعم"><Headphones className="h-5 w-5" /></Button></PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-72 max-w-[calc(100vw-2rem)]" dir="rtl">
        <div className="flex items-center gap-3 mb-4"><Headphones className="text-primary h-6 w-6" /><div><p className="font-bold">دعم موعدك</p><p className="text-sm text-muted-foreground" dir="ltr">{SUPPORT_PHONE}</p></div></div>
        <div className="grid gap-2">
          <Button asChild><a href={SUPPORT_TEL}><Phone className="w-4 h-4 ml-2" />اتصال بالدعم</a></Button>
          <Button asChild variant="outline"><a href={SUPPORT_WHATSAPP} target="_blank" rel="noopener noreferrer"><MessageCircle className="w-4 h-4 ml-2" />محادثة واتساب</a></Button>
        </div>
      </PopoverContent>
    </Popover>
  </div>;
}