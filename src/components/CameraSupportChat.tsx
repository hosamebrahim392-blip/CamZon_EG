import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  X,
  Send,
  RotateCcw,
  Sparkles,
  Bot,
  User,
  Wrench,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

const QUICK_SOLVER_PROMPTS = [
  {
    title: 'الكاميرا Offline بالموبايل',
    desc: 'حل مشكلة عدم اتصال التطبيق بالـ DVR/NVR',
    prompt: 'الكاميرات عندي في البيت/المحل فاصلة على تطبيق الموبايل وبتكتب Offline، إيه الخطوات لحل المشكلة فوراً؟',
  },
  {
    title: 'الرؤية الليلية سوداء/مظلمة',
    desc: 'فحص لمبات الأشعة تحت الحمراء IR والباور',
    prompt: 'الكاميرا شغالة تمام بالنهار لكن أول ما الليل ييجي الشاشة بتسود أو مشوشة، إيه سبب العطل وكيف أصلحه؟',
  },
  {
    title: 'الهارد ممتلئ وما بيسجل',
    desc: 'تفعيل الكتابة التلقائية وضغط H.265+',
    prompt: 'جهاز التسجيل بيطلع صوت صفارة وبيقول الهارد ديسك ممتلئ ومش راضي يسجل أيام جديدة، أعمل إيه؟',
  },
  {
    title: 'اختيار زاوية العدسة',
    desc: 'مقارنة 2.8mm و 3.6mm و 6mm و 12mm',
    prompt: 'عاوز أعرف إزاي أختار زاوية العدسة المناسبة بين 2.8 مم و 3.6 مم و 6 مم لمحل أو فيلا؟',
  },
  {
    title: 'هبوط الفولت والكابلات',
    desc: 'حساب الأمبير لكابلات أطول من 50 متراً',
    prompt: 'عندي كاميرا راكبة على مسافة 70 متراً والصورة بتهتز أو بتفصل، إزاي أحسب الباور سبلاي والأمبير الصح؟',
  },
  {
    title: 'طلب فني أو معاينة مجانية',
    desc: 'حجز موعد فحص موقع في القاهرة والجيزة',
    prompt: 'إزاي أحجز موعد معاينة ميدانية مجانية أو أطلب فني تركيب معتمد من CamZone-EG؟',
  },
];

// Offline knowledge fallback for GitHub Pages static deployments
function getLocalKnowledgeFallback(query: string): string {
  const q = query.toLowerCase();

  if (q.includes('offline') || q.includes('تطبيق') || q.includes('موبايل') || q.includes('فاصلة') || q.includes('راوتر') || q.includes('نت')) {
    return `### 📱 خطوات حل عطل الكاميرات غير المتصلة (Offline) في تطبيق الهاتف:

1. **فحص كابل الشبكة (LAN):** تأكد من إضاءة لمبة كابل الإنترنت الأخضر/البرتقالي خلف جهاز التسجيل (DVR/NVR) وراوتر المكان.
2. **التحقق من حالة السحابة (Platform Access / Cloud P2P):**
   - ادخل على شاشة التسجيل -> القائمة الرئيسية -> **Configuration** -> **Network** -> **Advanced** -> **Platform Access** (في هيكفيجن) أو **Network** -> **P2P** (في داهوا).
   - تأكد أن الحالة تظهر **Online** وليست Offline.
3. **ضبط عنوان الـ IP والـ DNS:**
   - فعّل خيار **DHCP** مؤقتاً لسحب IP متوافق مع الراوتر تلقائياً.
   - اضبط عنوان الـ DNS الأساسي إلى \`8.8.8.8\` والثانوي إلى \`8.8.4.4\` أو \`1.1.1.1\`.
4. **فحص تطبيق الموبايل:**
   - احذف الكاميرا من التطبيق ثم امسح كود الـ QR الموجود أسفل الجهاز أو في صفحة P2P مرة أخرى.
   - تأكد من عدم تشغيل تطبيق VPN على هاتفك أثناء المشاهدة.

💡 **نصيحة فنية:** إذا استمر العطل بعد إعادة تشغيل الراوتر وجهاز التسجيل، يرجى طلب زيارة فنية مجانية لمعاينة كابل الـ UTP وحالة الراوتر.`;
  }

  if (q.includes('ليل') || q.includes('سوداء') || q.includes('ظلام') || q.includes('مشوشة') || q.includes('night') || q.includes('اشعة')) {
    return `### 🌙 حل مشكلة الرؤية الليلية السوداء أو المشوشة:

1. **فحص هبوط الجهد (Voltage Drop):**
   - في النهار تستهلك الكاميرا نحو 0.3 أمبير، ولكن عند تشغيل لمبات الأشعة تحت الحمراء (IR LEDs) بالليل يقفز الاستهلاك إلى 1.0 - 1.5 أمبير.
   - إذا كان الكابل طويلاً أو محول الطاقة (الباور سبلاي) ضعيفاً، سينخفض الجهد لأقل من 10 فولت فتفصل لمبات الأشعة أو تبهت الصورة.
   - **الحل:** استخدم باور سبلاي مركزي 12V 10A/20A أو محول منفصل 12V 2A قريب من الكاميرا.
2. **انعكاس الأشعة (IR Reflection):**
   - تأكد من عدم وجود جدار أو زجاج أو حافة مظلة قريبة جداً من زاوية الكاميرا تعكس الأشعة لداخل العدسة وتعميها.
3. **تنظيف غطاء العدسة الزجاجي:**
   - نظف الزجاج الخارجي من الغبار وخيوط العنكبوت بقطعة قماش ناعمة.

💡 **نصيحة فنية:** تقنية **ColorVu / Full-Color** توفر تصويراً ملوناً 24 ساعة بإضاءة بيضاء دافئة وتعتبر بديلاً ممتازاً للأشعة التقليدية.`;
  }

  if (q.includes('هارد') || q.includes('ممتلئ') || q.includes('تسجيل') || q.includes('صفارة') || q.includes('تخزين') || q.includes('hdd')) {
    return `### 💾 حل مشكلة امتلاء الهارد ديسك وتوقف التسجيل:

1. **تفعيل خيار الكتابة التلقائية (Overwrite / Recyle):**
   - من شاشة الـ DVR -> ادخل على **Storage** أو **Record** -> **General** -> اضبط خيار **HDD Full** على **Overwrite** بدلاً من Stop.
   - بهذه الطريقة يقوم الجهاز تلقائياً بمسح أقدم يوم تسجيل واستبداله باليوم الجديد دون الحاجة لأي تدخل يدوي!
2. **تفعيل ضغط الفيديو الذكي (H.265+ / H.264+):**
   - ادخل على **Video/Audio** -> فعّل **H.265+**، سيوفر ذلك أكثر من 50% من المساحة ويضاعف مدة التسجيل على نفس الهارد.
3. **تفعيل التسجيل عند الحركة (Motion Detection):**
   - ضبط الكاميرات على التسجيل عند كشف الحركة يوفر من 30% إلى 70% من سعة الهارد مقارنة بالتسجيل المستمر 24/7.
4. **تأكد من نوع الهارد ديسك:**
   - تأكد أن الهارد مصمم خصيصاً لأنظمة المراقبة (مثل **Western Digital Purple** أو **Seagate SkyHawk**) لتحمل العمل الشاق 24/7.

💡 يمكنك أيضاً استخدام **حاسبة التخزين التفاعلية** المدمجة في الموقع لحساب الهارد الدقيق لكل كاميراتك.`;
  }

  if (q.includes('عدسة') || q.includes('زاوية') || q.includes('2.8') || q.includes('3.6') || q.includes('6') || q.includes('12')) {
    return `### 📐 دليلك السريع لاختيار زاوية عدسة الكاميرا المناسبة:

- **عدسة 2.8 مم (زاوية واسعة جداً ~102°):**
  - **الاستخدام الأفضل:** الغرف الداخلية، المكاتب، المحلات الصغيرة، والمداخل الضيقة.
  - **الميزة:** كشف مساحة الغرفة بالكامل من الزاوية بدون مناطق عمياء.
  
- **عدسة 3.6 مم (زاوية قياسية ~82°):**
  - **الاستخدام الأفضل:** الشارع الخارجي، الحدائق، الصالات الواسعة، وأسوار الفلل.
  - **الميزة:** توازن رائع بين زاوية الرؤية وعمق التفاصيل حتى 15-20 متراً.

- **عدسة 6.0 مم (زاوية موجهة ~53°):**
  - **الاستخدام الأفضل:** مراقبة درج الكاشير، الممرات الطويلة، أو البوابات البعيدة.
  - **الميزة:** تقريب الأشخاص بوضوح وتفاصيل أدق للوجه.

- **عدسة 12.0 مم (تليسكوبية ~24°):**
  - **الاستخدام الأفضل:** قراءة لوحات السيارات (LPR) والمسافات البعيدة (35-50 متراً).

💡 **جرب المصمم ثلاثي الأبعاد (3D Studio)** في الموقع لمحاكاة مخروط الرؤية لكل عدسة والتجول به في بيئة افتراضية!`;
  }

  if (q.includes('باور') || q.includes('أمبير') || q.includes('فولت') || q.includes('كابل') || q.includes('سلك') || q.includes('power')) {
    return `### ⚡ حسابات الباور سبلاي والجهد الكهربائي:

1. **قاعدة حساب الأمبير الإجمالي:**
   - الكاميرا العادية 2MP/5MP تستهلك بالمتوسط **1 أمبير** (مع تشغيل الأشعة IR).
   - مسجل الفيديو DVR/NVR يستهلك نحو **2 أمبير**.
   - **معامل الأمان (Safety Margin):** نضيف دائماً هامش أمان 25% لتفادي سخونة الباور أو انخفاض العمر الافتراضي.
   - **مثال:** لباقة 4 كاميرات = (4 × 1A) + 2A = 6A + هامش أمان = **باور سبلاي 10A**.
2. **الكابلات الطويلة (> 50 متراً):**
   - عند المسافات الطويلة، استخدم كابل كهرباء نحاس نقي مقاس **2 × 1 مم** لتقليل هبوط الجهد (Voltage Drop)، أو استخدم تقنية **PoE (Power over Ethernet)** مع سويتش معتمد.

💡 يمكنك فتح **حاسبة الباور سبلاي والأمبير** المدمجة في الموقع لحساب متطلباتك بالسنتيمتر والأمبير الفعلي!`;
  }

  // General default response
  return `مرحباً بك في **CamZone-EG**! أنا مساعدك الفني الذكي 🛡️🎥

يسعدني مساعدتك في:
- **حل أعطال الكاميرات وأجهزة التسجيل:** (أعطال الرؤية الليلية، انقطاع الاتصال Offline، مشاكل الهارد ديسك).
- **تصميم وحساب الباقات:** اختيار دقة الكاميرات (2MP, 5MP, 4K)، نوع النظام (IP PoE مقابل Analog HD)، وتحديد زوايا العدسات.
- **حسابات التخزين والباور:** تحديد سعة الهارد المناسبة وحجم الباور سبلاي بالكابلات المناسبة.
- **المعاينة وتركيب الفنيين:** حجز موعد فحص موقع مجاني وضمان سنتين استبدال فوري في مصر.

تفضل بكتابة تفاصيل مشكلتك وسأعطيك الحل الفني المباشر خطوة بخطوة!`;
}

export const CameraSupportChat: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      role: 'assistant',
      text: 'أهلاً بك في **CamZone-EG**! أنا مساعدك الفني الذكي المدعوم بـ **Gemini 3.8 Flash** 🎥⚡\n\nكيف يمكنني مساعدتك اليوم؟ يمكنك اختيار مشكلتك من الاقتراحات السريعة بالأسفل أو كتابة أي استفسار تريده.',
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || input).trim();
    if (!textToSend || isLoading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!customText) setInput('');
    setIsLoading(true);

    try {
      // Build history for multi-turn chat
      const historyPayload = messages.slice(-8).map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        text: m.text,
      }));

      // Call our backend endpoint running Gemini 3.8 Flash
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          history: historyPayload,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      const replyText = data.reply || getLocalKnowledgeFallback(textToSend);

      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (_error) {
      // Graceful fallback for static hosting / offline GitHub Pages
      const fallbackReply = getLocalKnowledgeFallback(textToSend);
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: fallbackReply,
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        text: 'تمت إعادة ضبط المحادثة بنجاح 🔄\nتفضل بطرح أي مشكلة أو استفسار فني وسأساعدك فوراً.',
        timestamp: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <>
      {/* Small floating button shaped like a surveillance camera */}
      <div className="fixed bottom-5 right-5 z-40 flex items-center gap-3">
        {!isOpen && (
          <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#12151f]/95 border border-amber-500/40 text-[11px] font-bold text-amber-300 shadow-xl shadow-black/60 animate-pulse pointer-events-none">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>مساعد كام زون الفني الذكي</span>
          </div>
        )}

        <button
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label="مساعد كام زون الذكي"
          className="relative group w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 via-amber-600 to-amber-700 text-slate-950 flex items-center justify-center shadow-2xl shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105 active:scale-95 transition-all duration-300 border-2 border-amber-300/60 cursor-pointer"
        >
          {/* Animated lens glow ring */}
          <span className="absolute inset-0 rounded-2xl bg-amber-400/20 animate-ping opacity-75 pointer-events-none" />

          {/* Camera body and lens icon */}
          <div className="relative flex items-center justify-center">
            {isOpen ? (
              <X className="w-7 h-7 text-slate-950 font-black transition-transform group-hover:rotate-90 duration-300" />
            ) : (
              <div className="relative">
                <Camera className="w-7 h-7 text-slate-950" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 border-2 border-slate-950 rounded-full" />
              </div>
            )}
          </div>
        </button>
      </div>

      {/* Floating Chat Modal */}
      {isOpen && (
        <div
          dir="rtl"
          className="fixed bottom-22 right-4 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[430px] h-[580px] max-h-[82vh] bg-[#0c0e15]/95 backdrop-blur-2xl border border-amber-500/30 rounded-3xl shadow-2xl shadow-black/90 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-gradient-to-r from-slate-900/90 to-[#121522] border-b border-amber-500/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-white text-sm">مساعد كام زون الفني</h3>
                  <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                    Gemini 3.8
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>متصل لحل جميع مشاكل الكاميرات</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleResetChat}
                title="إعادة ضبط المحادثة"
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                title="إغلاق"
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/80 rounded-lg transition cursor-pointer"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Solver Chips */}
          <div className="p-2.5 bg-slate-950/60 border-b border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
            {QUICK_SOLVER_PROMPTS.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(item.prompt)}
                className="shrink-0 px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-amber-500/20 border border-slate-800 hover:border-amber-500/40 text-[11px] text-slate-300 hover:text-amber-300 transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Wrench className="w-3 h-3 text-amber-400" />
                <span>{item.title}</span>
              </button>
            ))}
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-semibold rounded-br-xs shadow-md shadow-amber-500/10'
                      : 'bg-slate-900/95 text-slate-200 border border-slate-800/90 rounded-bl-xs shadow-md whitespace-pre-wrap'
                  }`}
                >
                  <div>{msg.text}</div>
                  <div
                    className={`text-[9px] mt-1.5 font-mono ${
                      msg.role === 'user' ? 'text-slate-900/70 text-left' : 'text-slate-500 text-right'
                    }`}
                  >
                    {msg.timestamp}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5 animate-pulse">
                  <Camera className="w-4 h-4" />
                </div>
                <div className="bg-slate-900/90 border border-slate-800 rounded-2xl rounded-bl-xs px-4 py-3 flex items-center gap-2 text-slate-400 text-xs">
                  <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                  <span>جاري تحليل المشكلة وصياغة الحل الفني...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-slate-950/90 border-t border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="اكتب استفسارك أو مشكلة الكاميرا هنا..."
                disabled={isLoading}
                className="flex-1 bg-slate-900 border border-slate-800 focus:border-amber-400 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:hover:bg-amber-500 text-slate-950 font-bold transition shadow-md shadow-amber-500/20 cursor-pointer"
                title="إرسال"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>

            <div className="flex items-center justify-between pt-2 px-1 text-[10px] text-slate-500">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>دعم فني معتمد لجميع محافظات مصر</span>
              </span>
              <a
                href="https://wa.me/201121275069?text=%D9%85%D8%B1%D8%AD%D8%A8%D8%A7%D9%8B%20CamZone%D8%8C%20%D8%A3%D8%AD%D8%AA%D8%A7%D8%AC%20%D9%85%D8%B3%D8%A7%D8%B9%D8%AF%D8%A9%20%D9%81%D9%86%D9%8A%D8%A9%20%D8%B9%D8%A7%D8%AC%D9%84%D8%A9"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:underline flex items-center gap-1"
              >
                <span>واتساب مباشر</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
