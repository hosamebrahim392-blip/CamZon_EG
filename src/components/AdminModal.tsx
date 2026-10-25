import React, { useState } from 'react';
import { OrderRecord } from '../types';
import {
  ShieldAlert,
  X,
  Package,
  CheckCircle,
  Truck,
  XCircle,
  Phone,
  Calendar,
  DollarSign,
  TrendingUp,
  BarChart3,
  Layers,
  Edit3,
  Download,
} from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: OrderRecord[];
  onUpdateOrderStatus: (orderId: string, status: OrderRecord['status']) => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  orders,
  onUpdateOrderStatus,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'reports'>('orders');

  if (!isOpen) return null;

  // Analytics calculation
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const totalProfit = orders.reduce((sum, o) => sum + o.profit, 0);
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;
  const newCount = orders.filter((o) => o.status === 'new').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-[#11141e] border border-amber-500/30 p-5 sm:p-6 shadow-2xl text-slate-100 max-h-[90vh] flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-bold text-white text-base">لوحة المشرف والتحكم المركزي (Admin Hub)</h3>
              <p className="text-[11px] text-slate-400">متابعة طلبات الدفع عند الاستلام وإحصائيات العمليات</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="./CamZone-EG-Project.zip"
              download="CamZone-EG-Project.zip"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition cursor-pointer"
              title="تحميل كود المشروع كملف ZIP لرفعه لمستودع جديد"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تحميل كود المشروع ZIP</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mt-4 pb-2 border-b border-slate-800/80 text-xs shrink-0">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>الطلبات الواردة ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-amber-500 text-slate-950'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>التقارير المالية والأرباح</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="mt-4 flex-1 overflow-y-auto pr-1">
          {activeTab === 'orders' && (
            <div className="space-y-3">
              {orders.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">
                  لا توجد طلبات مسجلة بعد. عند إرسال أي طلب من الحاسبة سيظهر هنا مباشرة.
                </div>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.id}
                    className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 hover:border-slate-700 transition text-xs space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <strong className="text-white text-sm">{order.customerName}</strong>
                        <span className="text-slate-400 text-[11px]">
                          ({new Date(order.created_at).toISOString().split('T')[0]})
                        </span>
                      </div>

                      {/* Status Badges & Controls */}
                      <div className="flex items-center gap-1.5">
                        <select
                          value={order.status}
                          onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as any)}
                          className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 font-semibold"
                        >
                          <option value="new">جديد (قيد المراجعة)</option>
                          <option value="shipping">جاري التجهيز والشحن</option>
                          <option value="delivered">تم التركيب والتسليم</option>
                          <option value="cancelled">ملغي</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-amber-400" />
                        <a
                          href={`tel:${order.phone}`}
                          className="text-amber-400 hover:underline"
                        >
                          {order.phone}
                        </a>
                      </div>
                      <div className="text-slate-400">
                        📍 {order.address}
                      </div>
                    </div>

                    <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800 text-[11px] text-slate-300">
                      <div className="font-semibold text-amber-300 mb-1">تفاصيل المنظومة: {order.systemSummary}</div>
                      <div className="text-slate-400">
                        البنود: {order.items.join(' • ')}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                      <span className="text-slate-400">
                        التكلفة: <strong className="text-slate-200">{order.cost.toLocaleString('ar-EG')} ج</strong> |
                        الربح: <strong className="text-emerald-400">{order.profit.toLocaleString('ar-EG')} ج</strong>
                      </span>
                      <span className="text-sm font-bold text-amber-400">
                        الإجمالي: {order.total.toLocaleString('ar-EG')} جنيه (COD)
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-xs">إجمالي الإيرادات:</div>
                  <div className="text-xl font-bold text-amber-400 mt-1">
                    {totalRevenue.toLocaleString('ar-EG')} <span className="text-xs">ج.م</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-xs">صافي أرباح العمليات:</div>
                  <div className="text-xl font-bold text-emerald-400 mt-1">
                    {totalProfit.toLocaleString('ar-EG')} <span className="text-xs">ج.م</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-xs">الطلبات المسلمة:</div>
                  <div className="text-xl font-bold text-sky-400 mt-1">
                    {deliveredCount} <span className="text-xs font-normal">طلب</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-slate-400 text-xs">الطلبات الجديدة:</div>
                  <div className="text-xl font-bold text-amber-300 mt-1">
                    {newCount} <span className="text-xs font-normal">طلب</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs leading-relaxed text-slate-300 space-y-2">
                <h4 className="font-bold text-white text-sm">ملاحظات حوكمة الأسعار في السوق المصري:</h4>
                <p>
                  • الأسعار المعتمدة في النظام مرتبطة بقوائم الموزعين الرسميين في مصر (Hikvision, Dahua, HiLook).
                </p>
                <p>
                  • يوصى بمراجعة سعر أمتار السلك النحاس الخالص شهرياً نظراً لتغيرات أسعار النحاس والجمارك.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
