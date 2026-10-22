import React, { useState } from 'react';
import { ShopProduct, CartItem, OrderRecord, BrandKey } from '../types';
import { INITIAL_SHOP_PRODUCTS, calculateCartTotal, isValidEgyptianPhone } from '../utils/calculator';
import {
  ShoppingCart,
  Search,
  Filter,
  Plus,
  Minus,
  Trash2,
  Check,
  ShieldCheck,
  Truck,
  Sparkles,
  Layers,
  ArrowRight,
  Send,
  X,
  CreditCard,
  PackageCheck,
  Eye,
} from 'lucide-react';

interface ProductShopProps {
  onOrderCreated: (order: OrderRecord) => void;
  cartItems: CartItem[];
  setCartItems: React.Dispatch<React.SetStateAction<CartItem[]>>;
  onOpen3DDesigner: () => void;
}

export const ProductShop: React.FC<ProductShopProps> = ({
  onOrderCreated,
  cartItems,
  setCartItems,
  onOpen3DDesigner,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [selectedProductDetails, setSelectedProductDetails] = useState<ShopProduct | null>(null);

  // Checkout modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
  });
  const [checkoutError, setCheckoutError] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // Cart operations
  const addToCart = (product: ShopProduct) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // Cart calculations
  const cartTotals = calculateCartTotal(cartItems);

  // Filtering products
  const filteredProducts = INITIAL_SHOP_PRODUCTS.filter((p) => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesBrand = selectedBrand === 'all' || p.brand === selectedBrand;
    const matchesSearch =
      searchQuery.trim() === '' ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.specs.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesBrand && matchesSearch;
  });

  // Handle Checkout submission
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCheckoutError('');

    if (!checkoutForm.name.trim()) {
      setCheckoutError('يرجى إدخال اسم المستلم بالكامل');
      return;
    }
    if (!isValidEgyptianPhone(checkoutForm.phone)) {
      setCheckoutError('رقم الموبايل غير صحيح (010 أو 011 أو 012 أو 015 - 11 رقماً)');
      return;
    }
    if (!checkoutForm.address.trim()) {
      setCheckoutError('يرجى إدخال عنوان التوصيل بالتفصيل');
      return;
    }

    const newOrder: OrderRecord = {
      id: `shop_ord_${Date.now()}`,
      created_at: new Date().toISOString(),
      customerName: checkoutForm.name.trim(),
      phone: checkoutForm.phone.trim(),
      address: checkoutForm.address.trim(),
      notes: checkoutForm.notes.trim(),
      systemSummary: `طلب من متجر كامزون (${cartTotals.itemCount} منتجات)`,
      items: cartItems.map((item) => `${item.product.title} (عدد ${item.quantity})`),
      cost: cartItems.reduce((sum, item) => sum + item.product.cost * item.quantity, 0),
      profit: cartTotals.subtotal - cartItems.reduce((sum, item) => sum + item.product.cost * item.quantity, 0),
      total: cartTotals.total,
      status: 'new',
      source: 'shop',
    };

    onOrderCreated(newOrder);
    setCheckoutSuccess(true);
    clearCart();
  };

  return (
    <div id="product-shop-section" className="w-full bg-[#10131c] rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-2xl scroll-mt-20">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShoppingCart className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                متجر منتجات المراقبة المعتمدة
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                  ضمان الوكيل الرسمي
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                تصفح واشترِ كاميرات هيك فيجن وداهوا وهاردات التسجيل الأصلية بأسعار الجملة مع الدفع عند الاستلام
              </p>
            </div>
          </div>
        </div>

        {/* Cart Button & 3D Bridge */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onOpen3DDesigner}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-bold transition cursor-pointer"
            title="تصميم مخطط في الـ 3D ونقله للمتجر"
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">صمّم في 3D</span>
          </button>

          <button
            onClick={() => setIsCartOpen(true)}
            className="relative flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition cursor-pointer active:scale-95"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>سلة المشتريات</span>
            {cartTotals.itemCount > 0 && (
              <span className="flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-slate-950 text-amber-400 text-[10px] font-black">
                {cartTotals.itemCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mt-5 space-y-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute right-3.5 top-3" />
          <input
            type="text"
            placeholder="ابحث بالاسم، الدقة (2MP, 5MP, 4K)، الموديل أو الماركة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950/90 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 transition"
          />
        </div>

        {/* Category Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
          {[
            { id: 'all', label: 'جميع المنتجات' },
            { id: 'cameras', label: 'كاميرات المراقبة' },
            { id: 'recorders', label: 'أجهزة التسجيل DVR/NVR' },
            { id: 'storage', label: 'هارد ديسك مراقبة' },
            { id: 'cables', label: 'كابلات نحاس نقي' },
            { id: 'accessories', label: 'راكات وباور سبلاي' },
            { id: 'smart_kits', label: 'باقات متكاملة توفير' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl border text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-500/20'
                  : 'bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Brand Filter */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="font-semibold text-[11px] shrink-0">تصفية حسب الماركة:</span>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'الكل' },
              { id: 'hikvision', label: 'Hikvision' },
              { id: 'dahua', label: 'Dahua' },
              { id: 'hilook', label: 'HiLook' },
              { id: 'ezviz', label: 'Ezviz' },
            ].map((brand) => (
              <button
                key={brand.id}
                onClick={() => setSelectedBrand(brand.id)}
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition cursor-pointer ${
                  selectedBrand === brand.id
                    ? 'bg-slate-800 text-amber-400 border-amber-500/50'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {brand.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {filteredProducts.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-500 text-xs">
            لا توجد منتجات مطابقة لخيارات البحث الحالية. جرب تغيير الفلتر أو كتابة كلمة بحث أخرى.
          </div>
        ) : (
          filteredProducts.map((product) => {
            const inCart = cartItems.find((i) => i.product.id === product.id);
            return (
              <div
                key={product.id}
                className="group flex flex-col justify-between rounded-2xl bg-slate-950/90 border border-slate-800 hover:border-amber-500/40 p-4 transition-all duration-300 hover:shadow-xl hover:shadow-amber-500/5"
              >
                <div>
                  {/* Image & Badge */}
                  <div className="relative w-full h-44 rounded-xl overflow-hidden bg-slate-900 border border-slate-800/80 mb-3">
                    <img
                      src={product.image}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />

                    {product.badge && (
                      <span className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 text-[10px] font-black shadow-md">
                        {product.badge}
                      </span>
                    )}

                    <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-sm text-[10px] text-slate-300 font-semibold border border-slate-700">
                      ماركة {product.brand.toUpperCase()}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-bold text-white text-xs sm:text-sm line-clamp-2 leading-snug mb-1">
                    {product.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-3">
                    {product.description}
                  </p>

                  {/* Specs Pill List */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {product.specs.slice(0, 3).map((spec, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900 text-slate-300 border border-slate-800/80"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Price & Add to Cart Action */}
                <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div>
                    <div className="text-[10px] text-slate-400">سعر التوريد:</div>
                    <div className="text-base font-black text-amber-400">
                      {product.price.toLocaleString('ar-EG')}{' '}
                      <span className="text-xs font-normal text-amber-300">ج.م</span>
                    </div>
                  </div>

                  {inCart ? (
                    <div className="flex items-center gap-1.5 bg-slate-900 border border-amber-500/40 rounded-xl p-1">
                      <button
                        onClick={() => updateQuantity(product.id, -1)}
                        className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center font-bold text-xs text-amber-300">
                        {inCart.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(product.id, 1)}
                        className="w-7 h-7 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center justify-center cursor-pointer font-bold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(product)}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md shadow-amber-500/10 active:scale-95 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>إضافة للسلة</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cart Sliding Drawer / Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#111420] border border-amber-500/30 p-5 shadow-2xl text-slate-100 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <ShoppingCart className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="font-bold text-white text-base">سلة مشتريات الكاميرات</h3>
                  <p className="text-[11px] text-slate-400">
                    {cartTotals.itemCount} منتج مختار • دفع عند الاستلام
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 cursor-pointer"
                aria-label="إغلاق السلة"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="mt-4 flex-1 overflow-y-auto divide-y divide-slate-800/80 pr-1 space-y-2">
              {cartItems.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  سلة المشتريات فارغة حالياً. اضغط على "إضافة للسلة" عند أي منتج في المتجر.
                </div>
              ) : (
                cartItems.map((item) => (
                  <div key={item.product.id} className="pt-2 pb-2 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={item.product.image}
                        alt=""
                        className="w-12 h-12 rounded-lg object-cover border border-slate-800 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-white truncate">{item.product.title}</div>
                        <div className="text-[11px] text-amber-400 mt-0.5">
                          {item.product.price.toLocaleString('ar-EG')} ج.م
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                        <button
                          onClick={() => updateQuantity(item.product.id, -1)}
                          className="w-6 h-6 rounded bg-slate-800 text-slate-300 flex items-center justify-center"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center font-bold text-xs">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, 1)}
                          className="w-6 h-6 rounded bg-amber-500 text-slate-950 font-bold flex items-center justify-center"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="p-1 rounded text-slate-500 hover:text-red-400"
                        title="حذف"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer */}
            {cartItems.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-800 shrink-0 space-y-2.5 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>قيمة المنتجات:</span>
                  <span className="font-bold text-slate-200">
                    {cartTotals.subtotal.toLocaleString('ar-EG')} جنيه
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>الشحن لجميع المحافظات:</span>
                  <span className="font-bold text-emerald-400">
                    {cartTotals.shippingFee === 0 ? 'شحن مجاني (طلب أعلى من 3000 ج)' : '75 جنيه'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm font-bold text-amber-400 pt-1 border-t border-slate-800">
                  <span>الإجمالي عند الاستلام:</span>
                  <span className="text-base font-black">
                    {cartTotals.total.toLocaleString('ar-EG')} جنيه مصري
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => {
                      setIsCartOpen(false);
                      setIsCheckoutOpen(true);
                    }}
                    className="py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>متابعة الشراء (COD)</span>
                  </button>

                  <button
                    onClick={clearCart}
                    className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-semibold border border-slate-800 transition cursor-pointer"
                  >
                    تفريغ السلة
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#111420] border border-amber-500/40 p-5 sm:p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">بيانات شحن وتوصيل الطلب</h3>
              </div>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {checkoutSuccess ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
                  <Check className="w-7 h-7" />
                </div>
                <h4 className="text-base font-bold text-white">تم تأكيد طلبك بنجاح!</h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  سيتم تجهيز طلبك فوراً وشحنه إلى العنوان المسجل. سيتصل بك مندوب الشحن على الرقم{' '}
                  <strong className="text-amber-400">{checkoutForm.phone}</strong> قبل التسليم.
                </p>
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-amber-300 font-bold">
                  المبلغ المستحق عند الاستلام: {cartTotals.total.toLocaleString('ar-EG')} جنيه مصري
                </div>
                <button
                  onClick={() => {
                    setIsCheckoutOpen(false);
                    setCheckoutSuccess(false);
                  }}
                  className="mt-2 w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs"
                >
                  إغلاق
                </button>
              </div>
            ) : (
              <form onSubmit={handleCheckoutSubmit} className="mt-4 space-y-3 text-xs">
                {checkoutError && (
                  <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 font-semibold">
                    ⚠️ {checkoutError}
                  </div>
                )}

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">اسم العميل بالكامل:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: محمد سعيد عبد الرحمن"
                    value={checkoutForm.name}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">رقم الموبايل للتوصيل:</label>
                  <input
                    type="tel"
                    required
                    placeholder="01121275069"
                    value={checkoutForm.phone}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 mb-1 font-semibold">العنوان التفصيلي (المحافظة والشارع):</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="المحافظة - المدينة - اسم الشارع والعمارة وعلامة مميزة"
                    value={checkoutForm.address}
                    onChange={(e) => setCheckoutForm({ ...checkoutForm, address: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <span className="text-slate-400">إجمالي المطلوب عند التسليم:</span>
                  <span className="font-bold text-amber-400 text-sm">
                    {cartTotals.total.toLocaleString('ar-EG')} جنيه (COD)
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition cursor-pointer"
                >
                  <PackageCheck className="w-4 h-4" />
                  <span>تأكيد شحن الطلب (الدفع عند الاستلام)</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
