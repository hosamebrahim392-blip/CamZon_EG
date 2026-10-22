import React, { useState, useEffect } from 'react';
import { OFFICIAL_CHANNELS } from '../types';
import {
  MessageCircle,
  Phone,
  Send,
  X,
  Instagram,
  Facebook,
  ExternalLink,
  ShieldCheck,
  Headphones,
  Check,
} from 'lucide-react';

export const SocialIntegrator: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Initialize Facebook Messenger Chat Plugin SDK
  useEffect(() => {
    try {
      const chatbox = document.getElementById('fb-customer-chat');
      if (chatbox) {
        chatbox.setAttribute('page_id', OFFICIAL_CHANNELS.messengerPageId);
        chatbox.setAttribute('attribution', 'biz_inbox');
      }

      // Check if FB SDK is already loaded
      if (!(window as any).FB && !document.getElementById('facebook-jssdk')) {
        const js = document.createElement('script');
        js.id = 'facebook-jssdk';
        js.src = 'https://connect.facebook.net/ar_AR/sdk/xfbml.customerchat.js';
        js.async = true;
        js.defer = true;
        document.body.appendChild(js);

        (window as any).fbAsyncInit = function () {
          try {
            (window as any).FB.init({
              xfbml: true,
              version: 'v18.0',
            });
          } catch (e) {}
        };
      }
    } catch (e) {
      // Graceful fallback to direct m.me link
    }
  }, []);

  const handleCopyPhone = () => {
    navigator.clipboard.writeText(OFFICIAL_CHANNELS.phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Facebook Customer Chat Plugin Root Anchors */}
      <div id="fb-root"></div>
      <div id="fb-customer-chat" className="fb-customerchat"></div>

      {/* Floating Action Button in Bottom-Left Corner */}
      <div className="fixed bottom-5 left-5 z-40 flex flex-col items-start gap-3">
        {/* Expanded Quick Contact Card */}
        {isOpen && (
          <div className="w-80 rounded-2xl bg-[#111420]/95 backdrop-blur-xl border border-amber-500/30 p-4 shadow-2xl text-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-bold">
                  <Headphones className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-xs">خدمة عملاء CamZone-EG</h4>
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>متاحون الآن للمساعدة الفورية</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition text-xs"
                title="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Channels List */}
            <div className="mt-3 space-y-2 text-xs">
              {/* WhatsApp & Mobile Direct */}
              <a
                href={OFFICIAL_CHANNELS.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
                    <MessageCircle className="w-4 h-4 fill-slate-950" />
                  </div>
                  <div>
                    <div className="font-bold text-white group-hover:text-emerald-300 transition">محادثة واتساب سريعة</div>
                    <div className="text-[10px] text-emerald-400 font-mono" dir="ltr">
                      {OFFICIAL_CHANNELS.phoneDisplay}
                    </div>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
              </a>

              {/* Messenger Interactive Chat */}
              <a
                href={OFFICIAL_CHANNELS.messengerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-2.5 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 transition group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Send className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-white group-hover:text-blue-300 transition">شات ماسنجر المباشر</div>
                    <div className="text-[10px] text-blue-400">تواصل عبر صفحة فيسبوك</div>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100" />
              </a>

              {/* Direct Phone Call */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300">
                <a
                  href={`tel:${OFFICIAL_CHANNELS.phoneDial}`}
                  className="flex items-center gap-2.5 hover:text-amber-400 transition"
                >
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-white">اتصال هاتفي مباشر</div>
                    <div className="text-[10px] text-slate-400 font-mono" dir="ltr">{OFFICIAL_CHANNELS.phoneDisplay}</div>
                  </div>
                </a>
                <button
                  onClick={handleCopyPhone}
                  className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 transition cursor-pointer"
                  title="نسخ الرقم"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : 'نسخ'}
                </button>
              </div>

              {/* Social Pages Links */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <a
                  href={OFFICIAL_CHANNELS.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-900 hover:bg-[#1877f2]/20 hover:text-[#1877f2] border border-slate-800 text-slate-300 text-[11px] font-bold transition"
                >
                  <Facebook className="w-3.5 h-3.5" />
                  <span>صفحة فيسبوك</span>
                </a>

                <a
                  href={OFFICIAL_CHANNELS.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-900 hover:bg-[#e1306c]/20 hover:text-[#e1306c] border border-slate-800 text-slate-300 text-[11px] font-bold transition"
                >
                  <Instagram className="w-3.5 h-3.5" />
                  <span>إنستجرام</span>
                </a>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center gap-1.5 text-[10px] text-slate-400 justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>القنوات الرسمية المعتمدة لـ CamZone-EG</span>
            </div>
          </div>
        )}

        {/* Master Floating Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-2xl transition-all duration-300 active:scale-95 cursor-pointer ${
            isOpen
              ? 'bg-slate-800 text-slate-200 border border-slate-700'
              : 'bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-slate-950 font-black border border-amber-400/50 shadow-amber-500/30 hover:shadow-amber-500/50 hover:brightness-110'
          }`}
          aria-label="تواصل مع الدعم الفني"
        >
          {isOpen ? (
            <X className="w-5 h-5 text-amber-400" />
          ) : (
            <div className="relative">
              <MessageCircle className="w-5 h-5 fill-slate-950 text-slate-950" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-950 animate-ping" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-slate-950" />
            </div>
          )}
          <span className="text-xs font-black hidden sm:inline">
            {isOpen ? 'إغلاق المحادثة' : 'تواصل معنا فوري (واتساب / شات)'}
          </span>
          <span className="text-xs font-black sm:hidden">
            {isOpen ? 'إغلاق' : 'تواصل فوري'}
          </span>
        </button>
      </div>
    </>
  );
};
