import React, { useState } from 'react';
import { ClipboardList, X, Check, Share2, FileDown, MapPin, Building, Wifi, Zap } from 'lucide-react';

interface SiteSurveyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SiteSurveyModal: React.FC<SiteSurveyModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    clientName: '',
    phone: '',
    address: '',
    propertyType: 'محل تجاري',
    cameraCountNeeded: '4',
    internetType: 'فايبر / راوتر أرضي متوفر',
    powerReady: 'يوجد مصدر كهرباء مخصص بجانب جهاز التسجيل',
    mountingSurface: 'جدران خرسانية ومحارة عادية',
    nightVisionNeed: 'رؤية ليلية بالأشعة IR عادية 20-30م',
    specialNotes: '',
  });

  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const generateReportText = () => {
    return `📋 *تقرير معاينة موقع كاميرات مراقبة ميدانية (CamZone-EG)*
══════════════════════════════
👤 *العميل:* ${formData.clientName || 'غير مسجل'}
📞 *رقم الهاتف:* ${formData.phone || 'غير مسجل'}
📍 *الموقع:* ${formData.address || 'غير مسجل'}
🏢 *نوع العقار:* ${formData.propertyType}
📹 *العدد المقترح للكاميرات:* ${formData.cameraCountNeeded} نقاط
🌐 *حالة الإنترنت وتطبيق الموبايل:* ${formData.internetType}
⚡ *تغذية الكهرباء والباور:* ${formData.powerReady}
🧱 *طبيعة مسارات السلك والجدران:* ${formData.mountingSurface}
🌙 *متطلبات الرؤية الليلية:* ${formData.nightVisionNeed}
📝 *ملاحظات الفني:* ${formData.specialNotes || 'لا توجد ملاحظات إضافية'}
══════════════════════════════
تاريخ المعاينة: ${new Date().toLocaleDateString('ar-EG')}`.trim();
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(generateReportText());
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generateReportText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-xl rounded-2xl bg-[#11141e] border border-amber-500/30 p-5 sm:p-6 shadow-2xl text-slate-100 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <ClipboardList className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-white text-base">نموذج كشف ومعاينة موقع ميداني (Site Survey)</h3>
              <p className="text-[11px] text-slate-400">توثيق مواصفات المكان وشبكة الإنترنت قبل بدء التركيب</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="mt-4 space-y-3.5 text-xs overflow-y-auto pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">اسم العميل:</label>
              <input
                type="text"
                value={formData.clientName}
                onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                placeholder="أحمد محمد"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-400 mb-1">رقم الموبايل:</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="01000000000"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">العنوان / المنطقة:</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="مثال: مدينة نصر - الحي السابع"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1">نوع العقار:</label>
              <select
                value={formData.propertyType}
                onChange={(e) => setFormData({ ...formData, propertyType: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
              >
                <option value="محل تجاري">محل تجاري</option>
                <option value="شقة سكنية / عمارة">شقة سكنية / مدخل عمارة</option>
                <option value="فيلا / منزل خاص">فيلا / منزل خاص</option>
                <option value="مستودع / مخزن">مستودع / مخزن</option>
                <option value="مصنع / ورشة">مصنع / ورشة</option>
                <option value="صيدلية / عيادة">صيدلية / عيادة</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 mb-1">حالة اتصال الإنترنت:</label>
              <select
                value={formData.internetType}
                onChange={(e) => setFormData({ ...formData, internetType: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
              >
                <option value="راوتر أرضي VDSL/فايبر شغال">راوتر أرضي VDSL/فايber شغال</option>
                <option value="راوتر هوائي شريحة 4G">راوتر هوائي شريحة 4G</option>
                <option value="لا يوجد إنترنت (تسجيل محلي على الهارد فقط)">لا يوجد إنترنت (تسجيل محلي فقط)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1">ملاحظات المسارات والأسلاك وتمديدات الديكور:</label>
            <textarea
              rows={2}
              value={formData.specialNotes}
              onChange={(e) => setFormData({ ...formData, specialNotes: e.target.value })}
              placeholder="مثال: يفضل استخدام مواسير PVC في الواجهة الخارجية لحماية السلك من الشمس، والكاميرا 3 تحتاج مسافة 45 متر..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
            />
          </div>
        </div>

        {/* Actions Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 grid grid-cols-2 gap-2 shrink-0">
          <button
            onClick={handleCopy}
            className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <ClipboardList className="w-4 h-4" />}
            <span>{copied ? 'تم النسخ!' : 'نسخ التقرير'}</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            <span>مشاركة بواتساب</span>
          </button>
        </div>
      </div>
    </div>
  );
};
