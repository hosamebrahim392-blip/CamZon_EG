import React, { useState } from 'react';
import {
  CalculatorState,
  QuoteResult,
  SystemType,
  BrandKey,
  CameraResolution,
} from '../types';
import {
  calculateQuote,
  calculateStorageDays,
  BASE_PRICES,
  generateWhatsAppQuote,
} from '../utils/calculator';
import {
  Shield,
  Camera,
  HardDrive,
  Cpu,
  Layers,
  Wrench,
  Percent,
  Check,
  Send,
  Share2,
  HelpCircle,
  Zap,
  Box,
  Server,
  DollarSign,
  TrendingUp,
  Receipt,
  FileText,
} from 'lucide-react';

interface PackageCalculatorProps {
  state: CalculatorState;
  onChange: (updater: (prev: CalculatorState) => CalculatorState) => void;
  onOpenOrderModal: (quote: QuoteResult) => void;
  onOpenStorageModal: () => void;
  onOpenPowerModal: () => void;
}

export const PackageCalculator: React.FC<PackageCalculatorProps> = ({
  state,
  onChange,
  onOpenOrderModal,
  onOpenStorageModal,
  onOpenPowerModal,
}) => {
  const [customerNameForQuote, setCustomerNameForQuote] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const quote = calculateQuote(state);

  // Storage days quick calculation
  const hddNum = state.hddSize === 'none' ? 0 : parseInt(state.hddSize, 10);
  const storageInfo = calculateStorageDays(state.cams, state.res, hddNum, 'H.265+', 'continuous');

  // Handle WhatsApp Share
  const handleWhatsAppShare = () => {
    const text = generateWhatsAppQuote(customerNameForQuote || 'العميل العزيز', state, quote);
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleCopyQuote = () => {
    const text = generateWhatsAppQuote(customerNameForQuote || 'العميل العزيز', state, quote);
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2500);
  };

  return (
    <div id="calculator-section" className="w-full bg-[#10131c] rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-2xl scroll-mt-20">
      {/* Header & Tech Mode Switch */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Receipt className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                حاسبة باقات المراقبة والتسعير الفوري
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                اختر مواصفات منظومتك وسيقوم النظام باحتساب التكلفة وسعر البيع بدقة هندسية
              </p>
            </div>
          </div>
        </div>

        {/* Technician Mode Toggle */}
        <label className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-slate-900 border border-amber-500/30 cursor-pointer select-none hover:bg-slate-800/80 transition shadow-inner">
          <input
            type="checkbox"
            checked={state.techMode}
            onChange={(e) => onChange((prev) => ({ ...prev, techMode: e.target.checked }))}
            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 focus:ring-offset-slate-900"
          />
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
            <Wrench className="w-4 h-4 text-amber-400" />
            <span>وضع الفني (كشف التكلفة والربح)</span>
          </div>
        </label>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Controls Column (7 Cols on desktop) */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. System Architecture Type */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">نوع المنظومة:</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'analog', label: 'تناظري (Turbo HD / DVR)', sub: 'الأكثر انتشاراً واقتصادية' },
                { id: 'ip', label: 'شبكي ذكي (IP / PoE)', sub: 'أعلى دقة وثبات للمشاريع' },
                { id: 'wireless', label: 'لاسلكي Smart Wi-Fi', sub: 'بدون تكسير أو تمديدات' },
              ].map((sys) => (
                <button
                  key={sys.id}
                  onClick={() => onChange((prev) => ({ ...prev, systemType: sys.id as SystemType }))}
                  className={`p-2.5 rounded-xl border text-right transition cursor-pointer ${
                    state.systemType === sys.id
                      ? 'bg-amber-500/15 border-amber-400 text-white shadow-md shadow-amber-500/10'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <div className="text-xs font-bold text-amber-300">{sys.label}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 leading-tight">{sys.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Brand Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">الماركة المعتمدة:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(BASE_PRICES) as BrandKey[]).map((b) => (
                <button
                  key={b}
                  onClick={() => onChange((prev) => ({ ...prev, brand: b }))}
                  className={`py-2 px-3 rounded-xl border text-center transition cursor-pointer ${
                    state.brand === b
                      ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md shadow-amber-500/20'
                      : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700 text-xs'
                  }`}
                >
                  <span className="text-xs">{BASE_PRICES[b].name.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Resolution & Camera Count */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Resolution */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">دقة ووضوح الكاميرات:</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['2MP', '5MP', '8MP'] as CameraResolution[]).map((res) => (
                  <button
                    key={res}
                    onClick={() => onChange((prev) => ({ ...prev, res }))}
                    className={`py-2 text-center rounded-xl border text-xs font-bold transition cursor-pointer ${
                      state.res === res
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div>{res}</div>
                    <div className="text-[10px] opacity-80">{res === '2MP' ? '1080p' : res === '5MP' ? 'Super HD' : '4K Ultra'}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Camera Count */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2">عدد الكاميرات المطلوب:</label>
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                {[1, 2, 3, 4, 6, 8, 16, 32].map((num) => (
                  <button
                    key={num}
                    onClick={() => onChange((prev) => ({ ...prev, cams: num }))}
                    className={`py-2 text-center rounded-xl border text-xs font-bold transition cursor-pointer ${
                      state.cams === num
                        ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                        : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Hard Drive & Storage Days Calculation */}
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-amber-400" />
                <span>سعة هارد التسجيل (WD Purple / SkyHawk):</span>
              </label>
              <button
                onClick={onOpenStorageModal}
                className="text-[11px] text-amber-400 hover:text-amber-300 underline flex items-center gap-1 cursor-pointer"
              >
                <span>حاسبة الأيام المتقدمة</span>
              </button>
            </div>

            <div className="grid grid-cols-5 gap-1.5">
              {(['none', '1TB', '2TB', '4TB', '8TB'] as const).map((h) => (
                <button
                  key={h}
                  onClick={() => onChange((prev) => ({ ...prev, hddSize: h }))}
                  className={`py-1.5 text-center rounded-lg border text-xs font-semibold transition cursor-pointer ${
                    state.hddSize === h
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                      : 'bg-slate-950/80 text-slate-300 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {h === 'none' ? 'بدون هارد' : h}
                </button>
              ))}
            </div>

            {state.hddSize !== 'none' && (
              <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800/80">
                <span>
                  تقدير مدة التسجيل المتاحة: <strong className="text-amber-400 font-bold">{storageInfo.days} يوم</strong> تقريباً
                </span>
                <span className="text-[11px] text-slate-400">بترميز H.265+ الذكي</span>
              </div>
            )}
          </div>

          {/* 5. Wiring & Junction Boxes Counters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Cable Meters */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center justify-between mb-1.5 text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  أمتار السلك (متر):
                </span>
                <button
                  onClick={onOpenPowerModal}
                  className="text-[10px] text-sky-400 hover:text-sky-300 underline"
                >
                  فحص هبوط الجهد
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={state.cable}
                  onChange={(e) => {
                    const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                    onChange((prev) => ({ ...prev, cable: val }));
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
                <span className="text-xs text-slate-400 shrink-0">متر</span>
              </div>
            </div>

            {/* Boxes */}
            <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
              <div className="flex items-center justify-between mb-1.5 text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Box className="w-3.5 h-3.5 text-amber-400" />
                  عدد البواطات المعزولة 10×10:
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  value={state.box}
                  onChange={(e) => {
                    const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                    onChange((prev) => ({ ...prev, box: val }));
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
                />
                <span className="text-xs text-slate-400 shrink-0">بواط</span>
              </div>
            </div>
          </div>

          {/* 6. Hardware Accessories Toggles */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">الملحقات ومستلزمات الحماية:</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onChange((prev) => ({ ...prev, rack: !prev.rack }))}
                className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                  state.rack
                    ? 'bg-amber-500/15 border-amber-400 text-white'
                    : 'bg-slate-900/90 border-slate-800 text-slate-400'
                }`}
              >
                <Server className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                <div className="text-xs font-bold">كابينة راك 6U</div>
                <div className="text-[10px] text-slate-400">حماية الأجهزة والباور</div>
              </button>

              <button
                onClick={() => onChange((prev) => ({ ...prev, powerSupply: !prev.powerSupply }))}
                className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                  state.powerSupply
                    ? 'bg-amber-500/15 border-amber-400 text-white'
                    : 'bg-slate-900/90 border-slate-800 text-slate-400'
                }`}
              >
                <Zap className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                <div className="text-xs font-bold">باور / سويتش PoE</div>
                <div className="text-[10px] text-slate-400">تغذية مستقرة بفيوزات</div>
              </button>

              <button
                onClick={() => onChange((prev) => ({ ...prev, connectors: !prev.connectors }))}
                className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                  state.connectors
                    ? 'bg-amber-500/15 border-amber-400 text-white'
                    : 'bg-slate-900/90 border-slate-800 text-slate-400'
                }`}
              >
                <Cpu className="w-4 h-4 mx-auto mb-1 text-amber-400" />
                <div className="text-xs font-bold">جاكات وتوصيلات أصلية</div>
                <div className="text-[10px] text-slate-400">نحاس لمنع التشويش</div>
              </button>
            </div>
          </div>

          {/* 7. Technician Mode Controls (Visible when techMode is active) */}
          {state.techMode && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  إعدادات هامش ربح الفني والمصنعيات:
                </span>
                <span className="text-[11px] text-slate-400">لا تظهر للعميل في الفاتورة النهائية</span>
              </div>

              {/* Margin Mode & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">نوع هامش الربح:</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => onChange((prev) => ({ ...prev, mode: 'percent' }))}
                      className={`py-1.5 text-center rounded-lg border text-xs font-bold transition cursor-pointer ${
                        state.mode === 'percent'
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-900 text-slate-300 border-slate-800'
                      }`}
                    >
                      نسبة مئوية %
                    </button>
                    <button
                      onClick={() => onChange((prev) => ({ ...prev, mode: 'fixed' }))}
                      className={`py-1.5 text-center rounded-lg border text-xs font-bold transition cursor-pointer ${
                        state.mode === 'fixed'
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-900 text-slate-300 border-slate-800'
                      }`}
                    >
                      مبلغ ثابت (ج.م)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">
                    قيمة الهامش {state.mode === 'percent' ? '(%)' : '(جنيه)'}:
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={state.margin}
                    onChange={(e) => {
                      const val = Math.max(0, parseFloat(e.target.value) || 0);
                      onChange((prev) => ({ ...prev, margin: val }));
                    }}
                    className="w-full bg-slate-950 border border-amber-500/40 rounded-lg px-3 py-1.5 text-xs text-amber-300 font-bold focus:outline-none"
                  />
                </div>
              </div>

              {/* Labor Fees Checkbox & Inputs */}
              <div className="pt-2 border-t border-amber-500/20">
                <label className="flex items-center gap-2 cursor-pointer mb-2">
                  <input
                    type="checkbox"
                    checked={state.includeLabor}
                    onChange={(e) => onChange((prev) => ({ ...prev, includeLabor: e.target.checked }))}
                    className="w-4 h-4 text-amber-500 rounded"
                  />
                  <span className="text-xs font-bold text-slate-200">
                    إدراج مصنعية التركيب والتسليك في العرض
                  </span>
                </label>

                {state.includeLabor && (
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">مصنعية النقطة (الكاميرا):</label>
                      <input
                        type="number"
                        min="0"
                        value={state.laborPerCam}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                          onChange((prev) => ({ ...prev, laborPerCam: val }));
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 mb-1">مصنعية المتر سلك:</label>
                      <input
                        type="number"
                        min="0"
                        value={state.laborPerMeter}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                          onChange((prev) => ({ ...prev, laborPerMeter: val }));
                        }}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Bill Summary & Ordering Column (5 Cols on desktop) */}
        <div className="lg:col-span-5 flex flex-col justify-between rounded-xl bg-slate-950 border border-slate-800 p-4 sm:p-5 shadow-xl">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="font-bold text-white text-sm flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-400" />
                ملخص الباقة والمقايسة
              </span>
              <span className="text-[11px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-medium">
                {quote.channelCount} قنوات
              </span>
            </div>

            {/* Line Items List */}
            <ul className="mt-3 divide-y divide-slate-900 max-h-72 overflow-y-auto text-xs text-slate-300 pr-1">
              {quote.lines.map((line, idx) => (
                <li key={idx} className="py-2 flex items-start justify-between gap-2">
                  <div>
                    <span className="text-slate-200 font-medium">{line.label}</span>
                  </div>
                  {state.techMode && (
                    <span className="text-slate-400 font-bold shrink-0">
                      {line.totalCost.toLocaleString('ar-EG')} ج
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Pricing Totals Section */}
          <div className="mt-5 pt-4 border-t border-slate-800 space-y-3">
            {state.techMode && (
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>تكلفة البضاعة جملة:</span>
                  <span className="font-bold text-slate-300">{quote.cost.toLocaleString('ar-EG')} جنيه</span>
                </div>
                {state.includeLabor && (
                  <div className="flex items-center justify-between text-slate-400">
                    <span>إجمالي المصنعية:</span>
                    <span className="font-bold text-slate-300">{quote.laborCost.toLocaleString('ar-EG')} جنيه</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-emerald-400 font-bold pt-1 border-t border-slate-800">
                  <span>صافي ربحك في الباقة:</span>
                  <span className="font-bold">{quote.profit.toLocaleString('ar-EG')} جنيه</span>
                </div>
              </div>
            )}

            {/* Grand Total */}
            <div className="flex items-baseline justify-between p-3.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30">
              <span className="text-xs font-bold text-slate-300">الإجمالي النهائي للعميل:</span>
              <div className="text-left">
                <div className="text-2xl font-black text-amber-400 font-bold tracking-tight">
                  {quote.total.toLocaleString('ar-EG')}{' '}
                  <span className="text-xs font-normal text-amber-300">جنيه</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">شامل التوريد والدفع عند الاستلام</div>
              </div>
            </div>

            {/* Order & Share Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => onOpenOrderModal(quote)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>طلب الباقة (دفع عند الاستلام)</span>
              </button>

              <button
                onClick={() => setShowShareModal(true)}
                className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-emerald-400" />
                <span>مشاركة عرض سعر واتساب</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Share / WhatsApp Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#131722] border border-amber-500/30 p-5 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-amber-400 text-sm flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                مشاركة عرض سعر معتمد
              </h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-slate-200 text-xs p-1"
              >
                ✕ إغلاق
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs text-slate-300 mb-1">اسم العميل (يظهر في بداية العرض):</label>
                <input
                  type="text"
                  placeholder="مثال: أستاذ أحمد محمود"
                  value={customerNameForQuote}
                  onChange={(e) => setCustomerNameForQuote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-300 mb-1">معاينة النص:</label>
                <pre className="w-full h-36 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-300 font-sans whitespace-pre-wrap overflow-y-auto leading-relaxed">
                  {generateWhatsAppQuote(customerNameForQuote || 'العميل العزيز', state, quote)}
                </pre>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={handleCopyQuote}
                  className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {copySuccess ? <Check className="w-4 h-4 text-emerald-400" /> : <FileText className="w-4 h-4" />}
                  <span>{copySuccess ? 'تم النسخ!' : 'نسخ النص'}</span>
                </button>

                <button
                  onClick={handleWhatsAppShare}
                  className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>فتح واتساب</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
