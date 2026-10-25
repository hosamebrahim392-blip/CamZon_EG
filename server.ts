import express from 'express';
import type { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const isProduction = process.env.NODE_ENV === 'production';
const PORT = isProduction ? Number(process.env.PORT || 8080) : 3000;

app.use(express.json());

// Health check endpoint for Cloud Run container probes
app.get('/health', (_req, res) => {
  res.status(200).send('OK');
});

// Initialize Gemini SDK on the server with recommended telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// System instruction tailored for CamZone-EG surveillance expert
const SYSTEM_INSTRUCTION = `
أنت "مساعد كام زون الفني الذكي" (CamZone AI Support Expert)، مهندس واستشاري أنظمة المراقبة والأمن والحماية الذكية لمنصة CamZone-EG في مصر.
مهمتك الأساسية هي مساعدة العملاء والفنيين وحل جميع مشاكلهم التقنية بسرعة ودقة واحترافية.

قواعدك وإرشاداتك الفنية:
1. التحدث باللغة العربية بأسلوب ودود، واضح، ومباشر مع فهم المصطلحات المصرية والتقنية الدارجة (مثل: الباور سبلاي، البي إن سي BNC، الكاشير، كابل شيلد، التخريج، الـ Switch PoE، الـ NVR والـ DVR).
2. حل الأعطال الشائعة باقتراح خطوات محددة ومرتبة نقطياً:
   - الكاميرات غير متصلة (Offline) في تطبيق الهاتف (Hik-Connect, DMSS, XMeye, SuperLive Plus): فحص كابل الـ LAN، إعدادات الـ IP (Static vs DHCP)، تفعيل خدمة Cloud P2P، وفحص ضوء مؤشر الشبكة في الـ DVR/NVR.
   - مشاكل الرؤية الليلية: فحص حساس الإضاءة (LDR)، لمبات الأشعة تحت الحمراء (IR LEDs)، عاكسات الزجاج أو الحشرات، وهبوط الجهد (Voltage Drop) عبر الكابلات الطويلة واقتراح باور سبلاي مركزي أو تقريب مصدر الكهرباء.
   - الهارد ديسك والتسجيل: كيفية اختيار الهارد المخصص للمراقبة (WD Purple أو Seagate SkyHawk)، تفعيل ضغط الفيديو الحديث H.265+ لتوفير أكثر من 50% من المساحة، وضبط التسجيل عند الحركة (Motion Detection).
   - اختيار زاوية العدسة المناسبة:
     * 2.8 مم: زاوية واسعة (102°) للمساحات الداخلية والمحلات الصغيرة والغرف لكشف أوسع مساحة.
     * 3.6 مم: زاوية قياسية (82°) للصالات والشارع والحدائق متوسطة المدى.
     * 6.0 مم: زاوية مركزة (53°) للكاشير، الممرات الطويلة، ومداخل الجراجات.
     * 12.0 مم: زاوية تليسكوبية (24°) للمسافات البعيدة وقراءة لوحات السيارات (LPR).
   - المقارنة بين أنظمة IP الحديثة وأنظمة Analog HD: توضيح فروق نقاء الصورة، التوسعة، كابلات الشبكة UTP CAT6، وتقنية PoE لنقل الكهرباء والبيانات بكابل واحد.
3. باقات CamZone-EG في مصر:
   - نوفر باقات متكاملة (كاميرات هيكفيجن أو داهوا مع هارد ديسك، باور سبلاي، كابلات، بي إن سي، شاشات، وضمان سنتين استبدال فوري).
   - نوفر خدمة المعاينة الميدانية المجانية في القاهرة، الجيزة، والإسكندرية، وشحن لجميع محافظات مصر.
   - دعم الفنيين المعتمدين وتسهيل الانضمام لفريق الفنيين الحرين المعتمدين.
4. حافظ على إجابات منظمة، مشجعة، وقدم في نهاية كل إجابة نصيحة فنية وقائية أو دعوة للتواصل المباشر هاتفياً على 01121275069 أو عبر ماسنجر وحجز موعد معاينة.
`;

// Gemini Chat Endpoint
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'حقل الرسالة مطلوب ويجب أن يكون نصاً صالحاً.' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        error: 'لم يتم العثور على GEMINI_API_KEY على الخادم.',
        isFallbackNeeded: true,
      });
    }

    // Format previous history for Gemini
    const contents: any[] = [];
    if (Array.isArray(history)) {
      for (const item of history) {
        if (item && item.role && item.text) {
          contents.push({
            role: item.role === 'user' ? 'user' : 'model',
            parts: [{ text: item.text }],
          });
        }
      }
    }

    // Add current user message
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    // Call Gemini with models/gemini-3.8-flash as required
    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    const reply = response.text || 'عذراً، لم أستطع توليد إجابة في الوقت الحالي. يرجى إعادة المحاولة.';
    return res.json({ reply });
  } catch (error: any) {
    console.error('Error generating response with Gemini:', error);
    return res.status(500).json({
      error: error?.message || 'حدث خطأ غير متوقع أثناء معالجة الطلب.',
      isFallbackNeeded: true,
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(import.meta.dirname, 'dist');
    app.use('/CamZon_EG', express.static(distPath));
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CamZone-EG Server running on http://0.0.0.0:${PORT} (Production: ${isProduction})`);
  });
}

startServer();
