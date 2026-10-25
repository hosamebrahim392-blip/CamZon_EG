import React, { useState } from 'react';
import { calculatePowerSupply } from '../utils/calculator';
import { Zap, X, AlertTriangle, ShieldCheck, Cpu } from 'lucide-react';

interface PowerCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCams?: number;
  defaultAvgMeters?: number;
}

export const PowerCalculatorModal: React.FC<PowerCalculatorModalProps> = ({
  isOpen,
  onClose,
  defaultCams = 4,
  defaultAvgMeters = 30,
}) => {
  const [cams, setCams] = useState<number>(defaultCams);
  const [avgMeters, setAvgMeters] = useState<number>(defaultAvgMeters);
  const [wireGauge, setWireGauge] = useState<number>(0.75);
  const [copperType, setCopperType] = useState<'pure' | 'cca'>('pure');

  if (!isOpen) return null;

  const result = calculatePowerSupply(cams, avgMeters, wireGauge, copperType, 1.2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-lg rounded-2xl bg-[#11141e] border border-amber-500/30 p-5 sm:p-6 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Zap className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-white text-base">حاسبة الباور سبلاي وهبوط الجهد (Voltage Drop)</h3>
              <p className="text-[11px] text-slate-400">فحص استقرار التغذية الكهربائية ومواصفات المحول المطلوب</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">عدد الكاميرات:</label>
              <input
                type="number"
                min="1"
                max="64"
                value={cams}
                onChange={(e) => setCams(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">متوسط طول مسار الكابل (متر):</label>
              <input
                type="number"
                min="5"
                max="250"
                step="5"
                value={avgMeters}
                onChange={(e) => setAvgMeters(Math.max(5, parseInt(e.target.value, 10) || 5))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">مقطع السلك النحاسي:</label>
              <select
                value={wireGauge}
                onChange={(e) => setWireGauge(parseFloat(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold text-xs"
              >
                <option value={0.5}>0.5 مم² (اقتصادي)</option>
                <option value={0.75}>0.75 مم² (قياسي)</option>
                <option value={1.0}>1.0 مم² (نحاس معتمد)</option>
                <option value={1.5}>1.5 مم² (مسافات طويلة)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">خامة النحاس:</label>
              <select
                value={copperType}
                onChange={(e) => setCopperType(e.target.value as 'pure' | 'cca')}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold text-xs"
              >
                <option value="pure">نحاس نقي 100% (السويدي)</option>
                <option value="cca">تجاري / نحاس مكسو ألمنيوم (CCA)</option>
              </select>
            </div>
          </div>

          {/* Results Summary Box */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">سعة الباور سبلاي الموصى به:</span>
              <strong className="text-lg text-amber-400 font-bold font-mono">
                12V {result.recommendedAmps} Amps ({result.totalWattage}W)
              </strong>
            </div>

            <div className="flex items-center justify-between text-slate-400 border-t border-slate-900 pt-2">
              <span>أقصى سحب تيار متوقع (ليلاً مع الأشعة):</span>
              <span className="font-bold text-slate-200">{Math.round(cams * 1.2 * 10) / 10} أمبير</span>
            </div>

            <div className="flex items-center justify-between text-slate-400">
              <span>معامل الأمان الإضافي (Safety Margin):</span>
              <span className="text-emerald-400 font-bold">+30% حماية من ارتفاع الحمل</span>
            </div>

            {result.calculatedVoltageDrop !== undefined && (
              <div className="flex items-center justify-between text-slate-400 border-t border-slate-900 pt-2 font-mono">
                <span>هبوط الجهد المتوقع:</span>
                <span className={result.isSafe ? "text-cyan-400 font-bold" : "text-rose-400 font-bold"}>
                  ΔV = {result.calculatedVoltageDrop}V (يصل للكاميرا: {result.terminalVoltage}V)
                </span>
              </div>
            )}

            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                result.isSafe
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              }`}
            >
              {result.isSafe ? (
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              )}
              <div className="leading-relaxed">{result.voltageDropNotice}</div>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition"
        >
          فهمت ذلك
        </button>
      </div>
    </div>
  );
};
