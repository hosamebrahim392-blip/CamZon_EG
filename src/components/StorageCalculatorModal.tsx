import React, { useState } from 'react';
import { CameraResolution } from '../types';
import { calculateStorageDays } from '../utils/calculator';
import { HardDrive, X, Calendar, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface StorageCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCams?: number;
  defaultRes?: CameraResolution;
}

export const StorageCalculatorModal: React.FC<StorageCalculatorModalProps> = ({
  isOpen,
  onClose,
  defaultCams = 4,
  defaultRes = '2MP',
}) => {
  const [cams, setCams] = useState<number>(defaultCams);
  const [res, setRes] = useState<CameraResolution>(defaultRes);
  const [hddTB, setHddTB] = useState<number>(1);
  const [codec, setCodec] = useState<'H.264' | 'H.265' | 'H.265+'>('H.265+');
  const [mode, setMode] = useState<'continuous' | 'motion'>('continuous');

  if (!isOpen) return null;

  const result = calculateStorageDays(cams, res, hddTB, codec, mode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-lg rounded-2xl bg-[#11141e] border border-amber-500/30 p-5 sm:p-6 shadow-2xl text-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <HardDrive className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-white text-base">حاسبة سعة الهارد ديسك ومدة التسجيل</h3>
              <p className="text-[11px] text-slate-400">حساب دقيق لعدد أيام حفظ الفيديو طبقا لمعايير Bitrate</p>
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
          {/* Inputs Row 1: Cams and Res */}
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
              <label className="block text-slate-400 mb-1">دقة الصورة:</label>
              <select
                value={res}
                onChange={(e) => setRes(e.target.value as CameraResolution)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold"
              >
                <option value="2MP">2 ميجابكسل (1080p FHD)</option>
                <option value="5MP">5 ميجابكسل (Super HD)</option>
                <option value="8MP">8 ميجابكسل (4K Ultra HD)</option>
              </select>
            </div>
          </div>

          {/* Inputs Row 2: HDD capacity & Codec */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">سعة الهارد (تيرابايت):</label>
              <select
                value={hddTB}
                onChange={(e) => setHddTB(parseFloat(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold"
              >
                <option value="1">1 تيرا (1TB)</option>
                <option value="2">2 تيرا (2TB)</option>
                <option value="4">4 تيرا (4TB)</option>
                <option value="6">6 تيرا (6TB)</option>
                <option value="8">8 تيرا (8TB)</option>
                <option value="16">16 تيرا (16TB)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">تقنية ضغط الفيديو (Codec):</label>
              <select
                value={codec}
                onChange={(e) => setCodec(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold"
              >
                <option value="H.265+">H.265+ الذكي (يوفر حتى 70% مساحة)</option>
                <option value="H.265">H.265 القياسي</option>
                <option value="H.264">H.264 القديم</option>
              </select>
            </div>
          </div>

          {/* Mode: Continuous vs Motion */}
          <div>
            <label className="block text-slate-400 mb-1">طريقة التسجيل:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode('continuous')}
                className={`py-2 rounded-lg border font-semibold transition cursor-pointer ${
                  mode === 'continuous'
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-950 text-slate-300 border-slate-800'
                }`}
              >
                تسجيل مستمر 24/7 (Continuous)
              </button>
              <button
                onClick={() => setMode('motion')}
                className={`py-2 rounded-lg border font-semibold transition cursor-pointer ${
                  mode === 'motion'
                    ? 'bg-amber-500 text-slate-950 border-amber-400'
                    : 'bg-slate-950 text-slate-300 border-slate-800'
                }`}
              >
                تسجيل عند الحركة فقط (Motion Detection)
              </button>
            </div>
          </div>

          {/* Results Box */}
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-amber-500/30 text-center">
            <div className="text-slate-400 text-xs mb-1">مدة التسجيل التقديرية المحسوبة:</div>
            <div className="text-3xl font-black text-amber-400 font-bold font-['Cairo',sans-serif] tracking-tight flex items-center justify-center gap-2">
              <Calendar className="w-7 h-7 text-amber-400" />
              <span>{result.days}</span>
              <span className="text-base font-normal text-amber-200">يوم تسجيل كامل</span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
              <div>استهلاك البيانات اليومي: <strong className="text-slate-200">{result.dailyGB} GB / يوم</strong></div>
              <div>المساحة الفعلية الصافية: <strong className="text-slate-200">{result.totalGB} GB</strong></div>
            </div>

            <div className="mt-2.5 p-2 rounded-lg bg-amber-500/10 text-amber-300 text-[11px] text-right flex items-center gap-2 border border-amber-500/20">
              <Info className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{result.recommendation}</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition"
        >
          حفظ وإغلاق
        </button>
      </div>
    </div>
  );
};
