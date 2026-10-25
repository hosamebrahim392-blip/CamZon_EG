import React, { useState } from 'react';
import { TechnicianApplication } from '../types';
import { isValidEgyptianNationalId, isValidEgyptianPhone, SUPABASE_RLS_POLICIES_SQL } from '../utils/calculator';
import {
  Wrench,
  FileCheck,
  ShieldAlert,
  ShieldCheck,
  Award,
  CheckCircle,
  AlertTriangle,
  UserCheck,
  Copy,
  Check,
  Download,
  Terminal,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface TechnicianPortalProps {
  onApplicationSubmitted?: (app: TechnicianApplication) => void;
}

export const TechnicianPortal: React.FC<TechnicianPortalProps> = ({ onApplicationSubmitted }) => {
  const [activeTab, setActiveTab] = useState<'contract' | 'security_rls'>('contract');

  // Form State
  const [form, setForm] = useState({
    fullName: '',
    nationalId: '',
    phone: '',
    governorate: 'القاهرة',
    experienceYears: 3,
    specializations: ['analog', 'ip'],
    toolsOwned: ['أراجة شبكة RJ45 و BNC', 'شنيور/هيلتي لتثبيت الكاميرات', 'كابل تيستر Network Tester', 'أفوميتر قياس جهد 12V'],
    criminalRecordPledged: false,
    legalAgreementAccepted: false,
    signatureText: '',
  });

  const [formError, setFormError] = useState('');
  const [submittedApp, setSubmittedApp] = useState<TechnicianApplication | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [contractDetailsExpanded, setContractDetailsExpanded] = useState(false);

  // Derive Governorate & Birth Info from Egyptian National ID
  const parseNationalId = (nid: string) => {
    if (!isValidEgyptianNationalId(nid)) return null;
    const century = nid[0] === '2' ? '19' : '20';
    const year = century + nid.substring(1, 3);
    const month = nid.substring(3, 5);
    const day = nid.substring(5, 7);

    const govMap: Record<string, string> = {
      '01': 'القاهرة', '02': 'الإسكندرية', '03': 'بورسعيد', '04': 'السويس',
      '11': 'دمياط', '12': 'الدقهلية', '13': 'الشرقية', '14': 'القليوبية',
      '15': 'كفر الشيخ', '16': 'الغربية', '17': 'المنوفية', '18': 'البحيرة',
      '19': 'الإسماعيلية', '21': 'الجيزة', '22': 'بني سويف', '23': 'الفيوم',
      '24': 'المنيا', '25': 'أسيوط', '26': 'سوهاج', '27': 'قنا', '28': 'أسوان',
      '29': 'الأقصر', '31': 'البحر الأحمر', '32': 'الوادي الجديد', '33': 'مطروح',
      '34': 'شمال سيناء', '35': 'جنوب سيناء', '88': 'المصريين بالخارج'
    };
    const gov = govMap[nid.substring(7, 9)] || 'محافظة مصرية';
    return { birthDate: `${year}/${month}/${day}`, gov };
  };

  const idInfo = parseNationalId(form.nationalId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!form.fullName.trim() || form.fullName.trim().split(' ').length < 3) {
      setFormError('يرجى كتابة الاسم الثلاثي على الأقل كما هو مدون ببطاقة الرقم القومي');
      return;
    }

    if (!isValidEgyptianNationalId(form.nationalId)) {
      setFormError('الرقم القومي غير صحيح (يجب أن يتكون من 14 رقماً مصرياً صالحاً يبدأ بـ 2 أو 3 مع كود محافظة وتاريخ ميلاد صحيح)');
      return;
    }

    if (!isValidEgyptianPhone(form.phone)) {
      setFormError('رقم الموبايل غير صحيح (010 أو 011 أو 012 أو 015 يتكون من 11 رقماً)');
      return;
    }

    if (!form.criminalRecordPledged) {
      setFormError('يجب الإقرار بعدم وجود سوابق جنائية مخلة بالشرف والأمانة');
      return;
    }

    if (!form.legalAgreementAccepted) {
      setFormError('يجب الموافقة على بنود عقد الانضمام وسرية بيانات العملاء');
      return;
    }

    if (!form.signatureText.trim()) {
      setFormError('يرجى كتابة اسمك الكامل في خانة التوقيع الرقمي');
      return;
    }

    const application: TechnicianApplication = {
      id: `tech_${Date.now()}`,
      created_at: new Date().toISOString(),
      fullName: form.fullName.trim(),
      nationalId: form.nationalId.trim(),
      phone: form.phone.trim(),
      governorate: form.governorate,
      experienceYears: form.experienceYears,
      specialization: form.specializations as any,
      toolsOwned: form.toolsOwned,
      criminalRecordPledged: form.criminalRecordPledged,
      legalAgreementAccepted: form.legalAgreementAccepted,
      signatureText: form.signatureText.trim(),
      status: 'pending_review',
    };

    // Save in localStorage
    try {
      const existing = JSON.parse(localStorage.getItem('cz_technicians_apps') || '[]');
      existing.unshift(application);
      localStorage.setItem('cz_technicians_apps', JSON.stringify(existing));
    } catch (err) {}

    if (onApplicationSubmitted) {
      onApplicationSubmitted(application);
    }

    setSubmittedApp(application);
  };

  const handleCopySql = () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(SUPABASE_RLS_POLICIES_SQL).catch(() => {});
      }
    } catch (e) {}
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div id="technician-portal-section" className="w-full bg-[#10131c] rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-2xl scroll-mt-20">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Wrench className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                بوابة انضمام الفنيين والمهندسين المعتمدين
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">
                  عقد عمل حر رسمي
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                انضم لشبكة فنيي كاميرات المراقبة الأولى في مصر مع نظام تعاقد رقمي موثق وحماية كاملة لحقوقك
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('contract')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'contract'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            عقد الانضمام الرقمي
          </button>
          <button
            onClick={() => setActiveTab('security_rls')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'security_rls'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>سياسات الحماية و RLS</span>
          </button>
        </div>
      </div>

      {activeTab === 'contract' ? (
        <div className="mt-6">
          {submittedApp ? (
            <div className="p-6 sm:p-8 rounded-2xl bg-slate-950 border border-emerald-500/40 text-center space-y-4 max-w-xl mx-auto">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                <FileCheck className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">تم توثيق طلب انضمامك وتوقيع العقد بنجاح!</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                مرحباً بك يا كابتن / <strong className="text-amber-400">{submittedApp.fullName}</strong>. تم تسجيل بياناتك
                في سجل فنيي CamZone-EG بمحافظة <strong className="text-amber-400">{submittedApp.governorate}</strong> برقم طلب{' '}
                <span className="font-mono text-emerald-400">{submittedApp.id}</span>.
              </p>
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-right text-xs space-y-1.5 text-slate-300">
                <div>• الرقم القومي المسجل: <strong className="font-mono text-white">{submittedApp.nationalId}</strong></div>
                <div>• رقم هاتف التواصل: <strong className="font-mono text-white">{submittedApp.phone}</strong></div>
                <div>• حالة الحساب: <span className="text-amber-400 font-bold">قيد الفحص والمطابقة (تفعيل فوري خلال 24 ساعة)</span></div>
              </div>
              <p className="text-[11px] text-slate-400">
                سيتواصل معك المشرف الفني عبر واتساب لترتيب أولى عمليات المعاينة والتركيب في نطاقك الجغرافي.
              </p>
              <button
                onClick={() => setSubmittedApp(null)}
                className="mt-2 px-6 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
              >
                تعديل أو تسجيل فني جديد
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Advantages & Legal Summary */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-[#141826] border border-slate-800 space-y-3">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    <Award className="w-4 h-4 text-amber-400" />
                    مزايا الانضمام لشبكة فنيي CamZone-EG:
                  </h3>
                  <ul className="space-y-2 text-xs text-slate-300">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>طلبات تركيب ومعاينة مستمرة:</strong> توجيه العملاء في منطقتك الجغرافية إليك مباشرة.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>أسعار جملة خاصة للفنيين:</strong> تخفيضات مباشرة على الكاميرات وأجهزة الـ DVR والـ NVR.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>دعم فني واستشارات هندسية:</strong> دعم مباشر من مهندسي النظم لحل أعطال الشبكات والبرمجة.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span><strong>عقد عمل حر موثق:</strong> يضمن حقوقك المالية ومصنعياتك بنظام الدفع عند الاستلام.</span>
                    </li>
                  </ul>
                </div>

                {/* Collapsible Full Legal Text */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <button
                    onClick={() => setContractDetailsExpanded(!contractDetailsExpanded)}
                    className="w-full flex items-center justify-between text-xs font-bold text-amber-400 cursor-pointer"
                  >
                    <span>📜 نص بنود العقد والالتزامات القانونية (اضغط للقراءة)</span>
                    {contractDetailsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {contractDetailsExpanded && (
                    <div className="mt-3 text-[11px] text-slate-300 leading-relaxed space-y-2 pt-2 border-t border-slate-800 max-h-60 overflow-y-auto pr-1">
                      <p className="font-bold text-white">
                        عقد اتفاق وتنفيذ أعمال تركيب منظومات مراقبة إلكترونية (وفقاً للقانون المدني والتجاري المصري):
                      </p>
                      <p>
                        <strong>البند الأول (السرية والخصوصية):</strong> يقر الفني ويتعهد تعهداً قاطعاً بالحفاظ على حرمة مساكن
                        ومقرات العملاء، والامتناع التام عن نسخ أو استبقاء كلمات المرور (Passwords) لأجهزة التسجيل أو حسابات
                        التطبيقات السحابية للمشتركين، ويتحمل المسؤولية الجنائية والمدنية الكاملة في حال الإخلال بذلك.
                      </p>
                      <p>
                        <strong>البند الثاني (معايير الجودة):</strong> يلتزم الفني بتركيب الكابلات النحاسية طبقاً للأصول الهندسية،
                        واستخدام البواطات المعزولة المقاومة للرطوبة، وتثبيت الكاميرات بحرفية وأمان.
                      </p>
                      <p>
                        <strong>البند الثالث (الأمانة المهنية):</strong> يلتزم الفني بتحصيل المبالغ المحددة في أمر التوريد دون
                        أية زيادات غير متفق عليها، مع تسليم العميل فاتورة الضمان الرسمية الصادرة من المنصة.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Interactive Contract Form */}
              <div className="lg:col-span-7">
                <form onSubmit={handleSubmit} className="p-5 sm:p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 text-xs">
                  {formError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 font-semibold flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {/* Name */}
                  <div>
                    <label className="block text-slate-300 mb-1 font-semibold">
                      الاسم الرباعي للفني (كما هو بالبطاقة الشخصية):
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: حسام إبراهيم محمد عبد الله"
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  {/* National ID & Governorate */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">
                        الرقم القومي المصري (14 رقماً):
                      </label>
                      <input
                        type="text"
                        maxLength={14}
                        required
                        placeholder="29505150101234"
                        value={form.nationalId}
                        onChange={(e) => setForm({ ...form, nationalId: e.target.value.replace(/\D/g, '') })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-amber-400 tracking-wider"
                      />
                      {idInfo && (
                        <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
                          <Check className="w-3 h-3" />
                          <span>تاريخ الميلاد: {idInfo.birthDate} • المحافظة: {idInfo.gov}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">
                        محافظة العمل الرئيسية:
                      </label>
                      <select
                        value={form.governorate}
                        onChange={(e) => setForm({ ...form, governorate: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-amber-400"
                      >
                        <option value="القاهرة">القاهرة</option>
                        <option value="الجيزة">الجيزة</option>
                        <option value="الإسكندرية">الإسكندرية</option>
                        <option value="القليوبية">القليوبية</option>
                        <option value="الشرقية">الشرقية</option>
                        <option value="الغربية">الغربية</option>
                        <option value="الدقهلية">الدقهلية</option>
                        <option value="المنوفية">المنوفية</option>
                        <option value="البحيرة">البحيرة</option>
                        <option value="دمياط">دمياط</option>
                        <option value="بورسعيد">بورسعيد</option>
                        <option value="السويس">السويس</option>
                        <option value="الإسماعيلية">الإسماعيلية</option>
                        <option value="الفيوم">الفيوم</option>
                        <option value="بني سويف">بني سويف</option>
                        <option value="المنيا">المنيا</option>
                        <option value="أسيوط">أسيوط</option>
                        <option value="سوهاج">سوهاج</option>
                        <option value="قنا">قنا</option>
                        <option value="الأقصر">الأقصر</option>
                        <option value="أسوان">أسوان</option>
                        <option value="البحر الأحمر">البحر الأحمر</option>
                        <option value="مطروح">مطروح</option>
                      </select>
                    </div>
                  </div>

                  {/* Phone & Experience */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">رقم الموبايل المسجل (واتساب):</label>
                      <input
                        type="tel"
                        required
                        placeholder="01121275069"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-amber-400"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 mb-1 font-semibold">سنوات الخبرة في المجال:</label>
                      <input
                        type="number"
                        min="1"
                        max="35"
                        value={form.experienceYears}
                        onChange={(e) => setForm({ ...form, experienceYears: parseInt(e.target.value, 10) || 1 })}
                        className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  {/* Legal Pledges Checkboxes */}
                  <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.criminalRecordPledged}
                        onChange={(e) => setForm({ ...form, criminalRecordPledged: e.target.checked })}
                        className="w-4 h-4 mt-0.5 rounded text-amber-500 focus:ring-amber-400"
                      />
                      <span className="text-[11px] text-slate-300 leading-relaxed">
                        أقر بعدم وجود أية أحكام أو سوابق جنائية مخلة بالشرف أو الأمانة، ومستعد لتقديم صحيفة الحالة الجنائية (فيش وتشبيه) عند الطلب.
                      </span>
                    </label>

                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.legalAgreementAccepted}
                        onChange={(e) => setForm({ ...form, legalAgreementAccepted: e.target.checked })}
                        className="w-4 h-4 mt-0.5 rounded text-amber-500 focus:ring-amber-400"
                      />
                      <span className="text-[11px] text-slate-300 leading-relaxed">
                        أوافق على كافة بنود عقد التعاقد الحر، وأتعهد بالحفاظ المطلق على خصوصية وسرية بيانات وكاميرات العملاء طبقاً للقوانين المصرية.
                      </span>
                    </label>
                  </div>

                  {/* Digital Signature */}
                  <div className="p-3 rounded-xl bg-slate-900/80 border border-amber-500/20">
                    <label className="block text-[11px] text-amber-400 mb-1 font-bold">
                      التوقيع الرقمي (اكتب اسمك الثلاثي تأكيداً على توقيع هذا العقد):
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="اكتب اسمك هنا كتوقيع إلكتروني رسمي"
                      value={form.signatureText}
                      onChange={(e) => setForm({ ...form, signatureText: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-bold focus:outline-none focus:border-amber-400 text-xs"
                    />
                    <div className="text-[10px] text-slate-500 mt-1">
                      تاريخ التوقيع الإلكتروني: {new Date().toLocaleDateString('ar-EG')}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>توقيع العقد وإرسال طلب الانضمام</span>
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Security Policies & RLS Code Tab */
        <div className="mt-6 space-y-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-2">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              حوكمة وسياسات الأمان (Row Level Security - RLS) ومكافحة SQL Injection:
            </h3>
            <p>
              تعتمد منصة <strong>CamZone-EG</strong> مبدأ أمان الدفاع في العمق (Defense in Depth). يتم فحص وتطهير جميع المدخلات
              قبل الاستعلام، وتفعيل سياسات الأمان على مستوى صفوف قاعدة البيانات (PostgreSQL RLS) في Supabase:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div className="font-bold text-amber-400 text-[11px] mb-1">جدول الطلبات (Orders)</div>
                <div className="text-[10px] text-slate-400">إدخال مقيد بالتحقق من أرقام الهواتف المصرية، والقراءة مقتصرة فقط على المشرفين.</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div className="font-bold text-amber-400 text-[11px] mb-1">جدول الفنيين (Technicians)</div>
                <div className="text-[10px] text-slate-400">تحقق إلزامي من طول الرقم القومي (14 رقماً) وصحة رقم الهاتف عند التقديم.</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <div className="font-bold text-amber-400 text-[11px] mb-1">حماية الـ SQL Injection</div>
                <div className="text-[10px] text-slate-400">منع الفواصل المنقوطة والتعليقات والرموز الخبيثة عبر دالة التطهير الصارمة.</div>
              </div>
            </div>
          </div>

          {/* SQL Viewer */}
          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#07090e]">
            <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2 font-mono text-slate-300">
                <Terminal className="w-4 h-4 text-amber-400" />
                <span>supabase_security_rls.sql</span>
              </div>
              <button
                onClick={handleCopySql}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-bold transition cursor-pointer"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'تم النسخ!' : 'نسخ كود SQL'}</span>
              </button>
            </div>
            <pre className="p-4 text-[11px] text-emerald-300 font-mono leading-relaxed overflow-x-auto" dir="ltr">
              {SUPABASE_RLS_POLICIES_SQL}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
