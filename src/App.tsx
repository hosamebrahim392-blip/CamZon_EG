import React, { useState, useEffect } from 'react';
import {
  CalculatorState,
  QuoteResult,
  OrderRecord,
  CartItem,
  OFFICIAL_CHANNELS,
} from './types';
import {
  calculateQuote,
  isValidEgyptianPhone,
  generateWhatsAppQuote,
  INITIAL_SHOP_PRODUCTS,
  calculateCartTotal,
} from './utils/calculator';
import { Surveillance3D } from './components/Surveillance3D';
import { PackageCalculator } from './components/PackageCalculator';
import { ProductShop } from './components/ProductShop';
import { TechnicianPortal } from './components/TechnicianPortal';
import { SocialIntegrator } from './components/SocialIntegrator';
import { StorageCalculatorModal } from './components/StorageCalculatorModal';
import { PowerCalculatorModal } from './components/PowerCalculatorModal';
import { SiteSurveyModal } from './components/SiteSurveyModal';
import { AdminModal } from './components/AdminModal';
import { PWAInstallButton } from './components/PWAInstallButton';
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
  Phone,
  MessageSquare,
  Sparkles,
  ClipboardList,
  ShieldCheck,
  Truck,
  Headphones,
  Award,
  ChevronDown,
  Menu,
  X,
  ShoppingCart,
  UserCheck,
  Facebook,
  Instagram,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

export default function App() {
  // Calculator State
  const [calcState, setCalcState] = useState<CalculatorState>({
    systemType: 'analog',
    brand: 'hikvision',
    res: '2MP',
    cams: 4,
    cable: 40,
    box: 4,
    hddSize: '1TB',
    rack: false,
    powerSupply: true,
    connectors: true,
    includeLabor: false,
    laborPerCam: 150,
    laborPerMeter: 5,
    mode: 'percent',
    margin: 15, // 15% default profit margin
    techMode: false,
  });

  // Modal states
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);
  const [isPowerModalOpen, setIsPowerModalOpen] = useState(false);
  const [isSurveyModalOpen, setIsSurveyModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Active Quote
  const currentQuote = calculateQuote(calcState);

  // Order Submission Form
  const [orderForm, setOrderForm] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
  });
  const [orderError, setOrderError] = useState('');
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Shopping Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('cz_cart_items_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // Persist cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cz_cart_items_v2', JSON.stringify(cartItems));
    } catch (e) {}
  }, [cartItems]);

  const totalCartQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Orders stored in localStorage
  const [orders, setOrders] = useState<OrderRecord[]>(() => {
    try {
      const saved = localStorage.getItem('cz_orders_v2');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'ord_sample_1',
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        customerName: 'م. أحمد الشريف',
        phone: '01098765432',
        address: 'التجمع الخامس - القاهرة الجديدة',
        systemSummary: '4 كاميرات Hikvision 5MP + هارد 2TB',
        items: ['4 كاميرات 5MP', 'DVR 4 قنوات', 'هارد 2TB', '60م سلك', '4 بواطات'],
        cost: 6500,
        profit: 1300,
        total: 7800,
        status: 'delivered',
        source: 'calculator',
      },
    ];
  });

  // Persist orders to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('cz_orders_v2', JSON.stringify(orders));
    } catch (e) {}
  }, [orders]);

  // Sync from 3D Planner to Calculator
  const handleSyncFrom3D = (data: { cameras: number; boxes: number; cableMeters: number }) => {
    setCalcState((prev) => ({
      ...prev,
      cams: data.cameras,
      box: data.boxes,
      cable: data.cableMeters,
    }));

    // Scroll smoothly to calculator section
    const el = document.getElementById('calculator-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Add 3D items directly to the shopping cart
  const handleAddToCartFrom3D = (data: {
    cameras: number;
    boxes: number;
    cableMeters: number;
    racks: number;
  }) => {
    setCartItems((prev) => {
      const updated = [...prev];
      const camProd =
        INITIAL_SHOP_PRODUCTS.find((p) => p.id === 'prod-hik-2mp-bullet') ||
        INITIAL_SHOP_PRODUCTS[0];
      const boxProd =
        INITIAL_SHOP_PRODUCTS.find((p) => p.id === 'prod-box-ip66') ||
        INITIAL_SHOP_PRODUCTS[6];
      const cableProd =
        INITIAL_SHOP_PRODUCTS.find((p) => p.id === 'prod-cable-rg59-roll') ||
        INITIAL_SHOP_PRODUCTS[5];
      const rackProd = INITIAL_SHOP_PRODUCTS.find((p) => p.id === 'prod-rack-6u');

      if (data.cameras > 0 && camProd) {
        const idx = updated.findIndex((i) => i.product.id === camProd.id);
        if (idx >= 0) updated[idx].quantity += data.cameras;
        else updated.push({ product: camProd, quantity: data.cameras });
      }

      if (data.boxes > 0 && boxProd) {
        const idx = updated.findIndex((i) => i.product.id === boxProd.id);
        if (idx >= 0) updated[idx].quantity += data.boxes;
        else updated.push({ product: boxProd, quantity: data.boxes });
      }

      if (data.cableMeters > 0 && cableProd) {
        const rolls = Math.max(1, Math.ceil(data.cableMeters / 100));
        const idx = updated.findIndex((i) => i.product.id === cableProd.id);
        if (idx >= 0) updated[idx].quantity += rolls;
        else updated.push({ product: cableProd, quantity: rolls });
      }

      if (data.racks > 0 && rackProd) {
        const idx = updated.findIndex((i) => i.product.id === rackProd.id);
        if (idx >= 0) updated[idx].quantity += data.racks;
        else updated.push({ product: rackProd, quantity: data.racks });
      }

      return updated;
    });

    const el = document.getElementById('shop-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  // Handle Order Submit from Package Calculator
  const handleConfirmOrder = () => {
    setOrderError('');
    if (!orderForm.name.trim()) {
      setOrderError('يرجى كتابة اسم العميل بالكامل');
      return;
    }
    if (!isValidEgyptianPhone(orderForm.phone)) {
      setOrderError('رقم الموبايل غير صحيح (يجب أن يبدأ بـ 010 أو 011 أو 012 أو 015 ويتكون من 11 رقماً)');
      return;
    }
    if (!orderForm.address.trim()) {
      setOrderError('يرجى إدخال العنوان التفصيلي للتسليم والمعاينة');
      return;
    }

    const newOrder: OrderRecord = {
      id: `ord_${Date.now()}`,
      created_at: new Date().toISOString(),
      customerName: orderForm.name.trim(),
      phone: orderForm.phone.trim(),
      address: orderForm.address.trim(),
      notes: orderForm.notes.trim(),
      systemSummary: `${calcState.cams} كاميرات ${calcState.brand} ${calcState.res} (${calcState.systemType})`,
      items: currentQuote.lines.map((l) => l.label),
      cost: currentQuote.cost,
      profit: currentQuote.profit,
      total: currentQuote.total,
      status: 'new',
      source: 'calculator',
    };

    setOrders((prev) => [newOrder, ...prev]);
    setOrderSuccess(true);
  };

  const handleShopOrderCreated = (newOrder: OrderRecord) => {
    setOrders((prev) => [newOrder, ...prev]);
  };

  // Close Order Dialog
  const handleCloseOrderModal = () => {
    setIsOrderModalOpen(false);
    setOrderSuccess(false);
    setOrderError('');
    setOrderForm({ name: '', phone: '', address: '', notes: '' });
  };

  // Status updater
  const handleUpdateOrderStatus = (orderId: string, status: OrderRecord['status']) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status } : o))
    );
  };

  const scrollTo3D = () => {
    const el = document.getElementById('designer3d');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#0b0c10] text-[#e2e8f0] font-['Cairo',sans-serif] flex flex-col selection:bg-amber-500/20 selection:text-amber-300">
      {/* Official Contact Top Notification Bar */}
      <div className="bg-[#08090d] border-b border-slate-800/80 px-4 py-1.5 text-[11px] text-slate-300">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-amber-400 font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>موزع معتمد لهيك فيجن وداهوا في مصر</span>
            </span>
            <span className="hidden md:inline text-slate-600">•</span>
            <span className="hidden md:inline text-slate-400">
              الدفع عند الاستلام والمعاينة لكافة المحافظات
            </span>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={OFFICIAL_CHANNELS.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-bold transition"
            >
              <Phone className="w-3 h-3" />
              <span>واتساب وموبايل: {OFFICIAL_CHANNELS.phoneDisplay}</span>
            </a>
            <span className="text-slate-600">|</span>
            <a
              href={OFFICIAL_CHANNELS.messengerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-bold transition"
            >
              <Send className="w-3 h-3" />
              <span className="hidden sm:inline">مسنجر</span>
            </a>
            <span className="text-slate-600">|</span>
            <a
              href={OFFICIAL_CHANNELS.facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-[#1877f2] transition"
              title="صفحة فيسبوك الرسمية"
            >
              <Facebook className="w-3 h-3" />
            </a>
            <a
              href={OFFICIAL_CHANNELS.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-[#e1306c] transition"
              title="حساب إنستجرام الرسمي"
            >
              <Instagram className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Top Main Navbar */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#0d0f17]/90 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 shadow-md shadow-amber-500/20">
              <Camera className="w-5 h-5 text-slate-950" />
              <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-950" />
            </div>
            <div>
              <div className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
                <span>CamZone</span>
                <span className="text-xs px-1.5 py-0.2 rounded bg-amber-500 text-slate-950 font-black">EG</span>
              </div>
              <p className="text-[10px] text-slate-400 -mt-0.5 font-medium hidden sm:block">
                منظومات المراقبة، المتجر، وبوابة الفنيين
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold text-slate-300">
            <a href="#designer3d" className="hover:text-amber-400 transition">المصمم 3D</a>
            <a href="#calculator-section" className="hover:text-amber-400 transition">حاسبة الباقات</a>
            <a href="#shop-section" className="hover:text-amber-400 transition flex items-center gap-1">
              <span>المتجر</span>
              {totalCartQuantity > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px]">
                  {totalCartQuantity}
                </span>
              )}
            </a>
            <a href="#technician-section" className="hover:text-amber-400 transition flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>بوابة الفنيين</span>
            </a>
            <button
              onClick={() => setIsStorageModalOpen(true)}
              className="hover:text-amber-400 transition cursor-pointer"
            >
              حاسبة الهارد
            </button>
            <button
              onClick={() => setIsPowerModalOpen(true)}
              className="hover:text-amber-400 transition cursor-pointer"
            >
              فحص الجهد
            </button>
            <button
              onClick={() => setIsSurveyModalOpen(true)}
              className="hover:text-amber-400 transition cursor-pointer"
            >
              معاينة موقع
            </button>
          </nav>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2">
            {/* Quick Cart Indicator for Desktop */}
            <a
              href="#shop-section"
              className="relative p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 transition"
              title="سلة المشتريات"
            >
              <ShoppingCart className="w-4 h-4 text-amber-400" />
              {totalCartQuantity > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px] flex items-center justify-center shadow">
                  {totalCartQuantity}
                </span>
              )}
            </a>

            <PWAInstallButton />

            {/* Admin Hub Button */}
            <button
              onClick={() => setIsAdminModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700/80 text-xs font-bold transition cursor-pointer"
              title="لوحة الإدارة والطلبات"
              aria-label="لوحة التحكم"
            >
              <Wrench className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">لوحة التحكم</span>
              {orders.filter((o) => o.status === 'new').length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400" />
              )}
            </button>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-300 hover:bg-slate-800 cursor-pointer"
              aria-label="قائمة التنقل"
              title="القائمة"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden px-4 py-3 bg-[#111420] border-b border-slate-800 space-y-2 text-xs font-semibold">
            <a
              href="#designer3d"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-slate-300 hover:text-amber-400"
            >
              📐 المصمم ثلاثي الأبعاد 3D
            </a>
            <a
              href="#calculator-section"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-slate-300 hover:text-amber-400"
            >
              🧮 حاسبة الباقات والتسعير
            </a>
            <a
              href="#shop-section"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-2 text-slate-300 hover:text-amber-400"
            >
              <span>🛒 متجر المنتجات المعتمدة</span>
              {totalCartQuantity > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px]">
                  {totalCartQuantity} منتجات
                </span>
              )}
            </a>
            <a
              href="#technician-section"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-2 text-slate-300 hover:text-amber-400"
            >
              👷 بوابة انضمام الفنيين (العقد الرقمي)
            </a>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setIsStorageModalOpen(true);
              }}
              className="block w-full text-right py-2 text-slate-300 hover:text-amber-400"
            >
              💾 حاسبة سعة الهارد ديسك
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setIsPowerModalOpen(true);
              }}
              className="block w-full text-right py-2 text-slate-300 hover:text-amber-400"
            >
              ⚡ فحص الباور سبلاي وهبوط الجهد
            </button>
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setIsSurveyModalOpen(true);
              }}
              className="block w-full text-right py-2 text-slate-300 hover:text-amber-400"
            >
              📋 كشف ومعاينة موقع ميداني
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 sm:py-10 space-y-12 sm:space-y-16">
        {/* Hero Section */}
        <section className="text-center max-w-3xl mx-auto space-y-4 pt-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>ضمان رسمي عامين استبدال فوري • كابلات نحاس نقي 100%</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white leading-tight">
            أمّن منزلك ومحلك بأفضل كاميرات{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-amber-600">
              Hikvision و Dahua
            </span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed max-w-2xl mx-auto">
            ارسم المكان، ركّب الكاميرات، وتأكد من زوايا الرؤية وعدم وجود زوايا عمياء، واحسب تكلفة الباقة وأرباحك
            في ثوانٍ معدودة، أو اشترِ المكونات من المتجر المعتمد مع الدفع عند التسليم والمعاينة.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <a
              href="#shop-section"
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/20 active:scale-95 transition"
            >
              تصفح متجر الكاميرات
            </a>
            <a
              href="#calculator-section"
              className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm active:scale-95 transition"
            >
              احسب باقتك الآن
            </a>
            <a
              href="#designer3d"
              className="px-6 py-3 rounded-xl bg-slate-900/60 hover:bg-slate-800 text-amber-400 border border-amber-500/30 font-bold text-xs sm:text-sm active:scale-95 transition"
            >
              صمّم منظومتك 3D
            </a>
          </div>

          {/* Quick Stats Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 text-xs text-slate-300">
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <Truck className="w-4 h-4 text-amber-400 mx-auto mb-1" />
              <div className="font-bold text-white">دفع عند التسليم</div>
              <div className="text-[10px] text-slate-400">معاينة قبل الاستلام</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <Headphones className="w-4 h-4 text-sky-400 mx-auto mb-1" />
              <div className="font-bold text-white">ربط موبايل مجاني</div>
              <div className="text-[10px] text-slate-400">متابعة صوت وصورة لايف</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <Award className="w-4 h-4 text-purple-400 mx-auto mb-1" />
              <div className="font-bold text-white">منتجات أصلية</div>
              <div className="text-[10px] text-slate-400">من الوكلاء المعتمدين</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
              <Wrench className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              <div className="font-bold text-white">وضع فني احترافي</div>
              <div className="text-[10px] text-slate-400">حساب هوامش الربح بدقة</div>
            </div>
          </div>
        </section>

        {/* 3D Interactive Surveillance Designer Section */}
        <section id="designer3d" className="space-y-3 scroll-mt-20">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                المصمم الهندسي التفاعلي ثلاثي الأبعاد (3D Surveillance Planner)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                توزيع الكاميرات على المخطط ومحاكاة مخاريط الرؤية والعدسات مع إمكانية تحويل المكونات بضغطة زر إلى سلة الشراء أو الحاسبة
              </p>
            </div>
          </div>

          <Surveillance3D
            onSyncToCalculator={handleSyncFrom3D}
            onAddToCartFrom3D={handleAddToCartFrom3D}
          />
        </section>

        {/* Engineering Quick Tools Bar */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={() => setIsStorageModalOpen(true)}
            className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-[#121622] border border-slate-800 hover:border-amber-500/40 text-right transition cursor-pointer shadow-lg group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition">
                <HardDrive className="w-5 h-5" />
              </span>
              <span className="text-[10px] text-amber-400 font-bold">أداة هندسية</span>
            </div>
            <h3 className="font-bold text-white text-sm">حاسبة سعة الهارد ديسك</h3>
            <p className="text-[11px] text-slate-400 mt-1">
              احسب كم يوماً سيسجل الهارد اعتماداً على دقة الكاميرات وضغط H.265+
            </p>
          </button>

          <button
            onClick={() => setIsPowerModalOpen(true)}
            className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-[#121622] border border-slate-800 hover:border-amber-500/40 text-right transition cursor-pointer shadow-lg group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-lg bg-sky-500/10 text-sky-400 group-hover:bg-sky-500 group-hover:text-slate-950 transition">
                <Zap className="w-5 h-5" />
              </span>
              <span className="text-[10px] text-sky-400 font-bold">أداة كهربائية</span>
            </div>
            <h3 className="font-bold text-white text-sm">فحص الباور وهبوط الجهد</h3>
            <p className="text-[11px] text-slate-400 mt-1">
              حساب أمبير المحول المطلوب والتأكد من وصول الفولت سليم للمسافات البعيدة
            </p>
          </button>

          <button
            onClick={() => setIsSurveyModalOpen(true)}
            className="p-4 rounded-xl bg-gradient-to-br from-slate-900 to-[#121622] border border-slate-800 hover:border-amber-500/40 text-right transition cursor-pointer shadow-lg group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-slate-950 transition">
                <ClipboardList className="w-5 h-5" />
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">للفنيين</span>
            </div>
            <h3 className="font-bold text-white text-sm">كشف ومعاينة موقع ميداني</h3>
            <p className="text-[11px] text-slate-400 mt-1">
              تسجيل طبيعة الجدران والإنترنت وملاحظات العميل وتصدير تقرير معاينة بواتساب
            </p>
          </button>
        </section>

        {/* Product Shop Section */}
        <section id="shop-section" className="scroll-mt-20">
          <ProductShop
            onOrderCreated={handleShopOrderCreated}
            cartItems={cartItems}
            setCartItems={setCartItems}
            onOpen3DDesigner={scrollTo3D}
          />
        </section>

        {/* Package Calculator Section */}
        <section id="calculator-section" className="scroll-mt-20">
          <PackageCalculator
            state={calcState}
            onChange={setCalcState}
            onOpenOrderModal={() => setIsOrderModalOpen(true)}
            onOpenStorageModal={() => setIsStorageModalOpen(true)}
            onOpenPowerModal={() => setIsPowerModalOpen(true)}
          />
        </section>

        {/* Technician Portal & Legal Contract Section */}
        <section id="technician-section" className="scroll-mt-20">
          <TechnicianPortal
            onApplicationSubmitted={(app) => {
              console.log('Technician application registered:', app);
            }}
          />
        </section>

        {/* Services & Capabilities Section */}
        <section className="space-y-6 pt-4">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white">خدماتنا لمنظومات الحماية المتكاملة</h2>
            <p className="text-xs text-slate-400">كل ما يلزم لتأمين منشأتك بمواصفات أمنية معتمدة</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
                <Camera className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">كاميرات مراقبة نهارية وليلية</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                كاميرات داخلية (Dome) وخارجية (Bullet) مقاومة للمطر والأتربة (IP67) بدقات Full HD و 5MP و 4K بوضوح فائق.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400">
                <HardDrive className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">أجهزة تسجيل NVR و DVR</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                أجهزة تسجيل من 4 إلى 32 قناة مع هارد ديسك احترافي مخصص للمراقبة 24/7 دون توقف (WD Purple / SkyHawk).
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                <Zap className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">كابلات ومستلزمات الحماية</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                كابلات نحاس شيلد RG59 باور أو Cat6 شبكة نقي، وبواطات حماية معزولة وراكات جدارية مؤمنة بقفل.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <Wrench className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-white text-sm">فنيين معتمدين وتركيب فوري</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                فريق من الفنيين المتخصصين لتركيب المنظومة بأعلى دقة ديكورية وتثبيت تطبيق الموبايل لجميع أفراد الأسرة.
              </p>
            </div>
          </div>
        </section>

        {/* WhatsApp & Contact Banner */}
        <section className="p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-[#121622] border border-emerald-500/30 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
              هل تحتاج معاينة خاصة أو استشارة فنية قبل الطلب؟
            </h3>
            <p className="text-xs text-slate-300">
              تواصل مباشرة مع أحد مهندسينا على واتساب أو اتصال هاتفي للحصول على استشارة مجانية لموقعك على الرقم{' '}
              <strong className="text-amber-400 font-bold">{OFFICIAL_CHANNELS.phoneDisplay}</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <a
              href={OFFICIAL_CHANNELS.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 transition"
            >
              <Phone className="w-4 h-4" />
              <span>محادثة واتساب: {OFFICIAL_CHANNELS.phoneDisplay}</span>
            </a>
            <a
              href={OFFICIAL_CHANNELS.messengerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 transition"
            >
              <Send className="w-4 h-4" />
              <span>شات مسنجر</span>
            </a>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-14 border-t border-slate-800/80 bg-[#07080b] py-10 px-4 sm:px-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 text-right">
          {/* Col 1: Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center text-slate-950 font-bold">
                <Camera className="w-4 h-4" />
              </div>
              <span className="text-white font-black text-base">CamZone-EG</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              المنصة الهندسية المتكاملة لحلول كاميرات المراقبة في مصر. توفير أحدث الموديلات الأصلية من هيك فيجن وداهوا مع الضمان المعتمد.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <a
                href={OFFICIAL_CHANNELS.facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-[#1877f2] transition"
                title="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href={OFFICIAL_CHANNELS.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-[#e1306c] transition"
                title="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href={OFFICIAL_CHANNELS.messengerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-300 hover:text-blue-400 transition"
                title="Messenger"
              >
                <Send className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Channels & Contact */}
          <div className="space-y-2.5">
            <h4 className="text-white font-bold text-sm">قنوات الاتصال المعتمدة</h4>
            <ul className="space-y-2 text-[11px]">
              <li>
                <a
                  href={OFFICIAL_CHANNELS.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-400 transition flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>موبايل وواتساب: {OFFICIAL_CHANNELS.phoneDisplay}</span>
                </a>
              </li>
              <li>
                <a
                  href={OFFICIAL_CHANNELS.messengerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-400 transition flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5 text-blue-400" />
                  <span>شات مسنجر الفوري (m.me)</span>
                </a>
              </li>
              <li>
                <a
                  href={OFFICIAL_CHANNELS.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-400 transition flex items-center gap-1.5"
                >
                  <Facebook className="w-3.5 h-3.5 text-blue-500" />
                  <span>الصفحة الرسمية على فيسبوك</span>
                </a>
              </li>
              <li>
                <a
                  href={OFFICIAL_CHANNELS.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-amber-400 transition flex items-center gap-1.5"
                >
                  <Instagram className="w-3.5 h-3.5 text-pink-500" />
                  <span>حساب إنستجرام الرسمي</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Col 3: Quick Navigation */}
          <div className="space-y-2.5">
            <h4 className="text-white font-bold text-sm">أقسام الموقع</h4>
            <ul className="space-y-1.5 text-[11px]">
              <li><a href="#designer3d" className="hover:text-amber-400 transition">📐 المصمم الهندسي 3D</a></li>
              <li><a href="#shop-section" className="hover:text-amber-400 transition">🛒 متجر المنتجات المعتمدة</a></li>
              <li><a href="#calculator-section" className="hover:text-amber-400 transition">🧮 حاسبة الباقات وحساب التكلفة</a></li>
              <li><a href="#technician-section" className="hover:text-amber-400 transition">👷 بوابة الفنيين والعقد القانوني</a></li>
            </ul>
          </div>

          {/* Col 4: Trust & Guarantee */}
          <div className="space-y-2.5">
            <h4 className="text-white font-bold text-sm">سياسة التسليم والأمان</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              الدفع عند الاستلام مع حق الفحص والمعاينة قبل السداد. ضمان لمدة عامين استبدال فوري ضد عيوب الصناعة مع فاتورة ضريبية رسمية.
            </p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>مأمن بنظام حماية RLS السحابي</span>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-900 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-right">
          <p>© {new Date().getFullYear()} CamZone-EG — جميع الحقوق محفوظة لمهندسي وفنيي أنظمة المراقبة في مصر.</p>
          <p className="text-[11px] text-slate-500">
            تطبيق PWA قابل للتثبيت ويعمل بدون إنترنت لتسهيل المعاينات الميدانية.
          </p>
        </div>
      </footer>

      {/* Floating Social & Messenger Hub in Bottom Corner */}
      <SocialIntegrator />

      {/* COD Order Confirmation Modal for Package Calculator */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#11141e] border border-amber-500/40 p-5 sm:p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">تأكيد طلب الباقة (الدفع عند التسليم)</h3>
              </div>
              <button
                onClick={handleCloseOrderModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {orderSuccess ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                  <Check className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-white">تم استلام طلبك بنجاح!</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  شكراً لثقتك في CamZone-EG. سيقوم أحد مهندسينا بالتواصل معك هاتفياً على الرقم{' '}
                  <strong className="text-amber-400 font-bold">{orderForm.phone}</strong> لتأكيد الموعد والمعاينة الفنية.
                </p>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-amber-300 font-bold">
                  إجمالي المبلغ المطلوب عند الاستلام: {currentQuote.total.toLocaleString('ar-EG')} جنيه مصري
                </div>
                <button
                  onClick={handleCloseOrderModal}
                  className="mt-2 w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                >
                  إغلاق
                </button>
              </div>
            ) : (
              <div className="mt-4 space-y-3.5 text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                  <div className="text-slate-400 text-[11px]">مواصفات الباقة المختارة:</div>
                  <div className="font-bold text-white">
                    {calcState.cams} كاميرات {calcState.brand} {calcState.res} ({calcState.systemType === 'ip' ? 'IP' : 'HD'})
                  </div>
                  <div className="text-amber-400 font-bold text-sm pt-1">
                    الإجمالي: {currentQuote.total.toLocaleString('ar-EG')} جنيه مصري (شامل التوريد)
                  </div>
                </div>

                {orderError && (
                  <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
                    ⚠️ {orderError}
                  </div>
                )}

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">اسم العميل:</label>
                  <input
                    type="text"
                    placeholder="مثال: أحمد مصطفى"
                    value={orderForm.name}
                    onChange={(e) => setOrderForm({ ...orderForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">رقم الموبايل (مصر):</label>
                  <input
                    type="tel"
                    placeholder="مثال: 01012345678"
                    value={orderForm.phone}
                    onChange={(e) => setOrderForm({ ...orderForm, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">فودافون، أورنج، اتصالات، أو وي</span>
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">عنوان التركيب بالتفصيل:</label>
                  <textarea
                    rows={2}
                    placeholder="المحافظة - المنطقة - الشارع - رقم العقار والعلامة المميزة"
                    value={orderForm.address}
                    onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <button
                  onClick={handleConfirmOrder}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>تأكيد الطلب والدفع عند التسليم</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Engineering Tools Modals */}
      <StorageCalculatorModal
        isOpen={isStorageModalOpen}
        onClose={() => setIsStorageModalOpen(false)}
        defaultCams={calcState.cams}
        defaultRes={calcState.res}
      />

      <PowerCalculatorModal
        isOpen={isPowerModalOpen}
        onClose={() => setIsPowerModalOpen(false)}
        defaultCams={calcState.cams}
        defaultAvgMeters={calcState.cable > 0 ? Math.round(calcState.cable / calcState.cams) : 25}
      />

      <SiteSurveyModal
        isOpen={isSurveyModalOpen}
        onClose={() => setIsSurveyModalOpen(false)}
      />

      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        orders={orders}
        onUpdateOrderStatus={handleUpdateOrderStatus}
      />
    </div>
  );
}
