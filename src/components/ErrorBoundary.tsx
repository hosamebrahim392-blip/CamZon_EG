import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Trash2, Home, ShieldCheck } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CamZone-EG Uncaught Error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleClearStorageAndReset = () => {
    try {
      localStorage.removeItem('cz_cart_items_v2');
      localStorage.removeItem('cz_orders_v2');
    } catch (e) {}
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b0c10] text-slate-100 flex items-center justify-center p-4 font-['Cairo',sans-serif]" dir="rtl">
          <div className="w-full max-w-lg rounded-2xl bg-[#111420] border border-red-500/30 p-6 sm:p-8 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">
                تنبيه: حدث خطأ غير متوقع أثناء المعالجة
              </h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                تم تفعيل درع الحماية الذاتي لـ <strong className="text-amber-400 font-bold">CamZone-EG</strong> لمنع تعطل النظام أو فقدان بياناتك.
              </p>
            </div>

            {this.state.error && (
              <div className="text-right p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] font-mono text-red-300 overflow-x-auto max-h-36">
                <div className="font-bold text-slate-400 text-[10px] mb-1">تفاصيل الخطأ التقني:</div>
                <div dir="ltr" className="text-left whitespace-pre-wrap">{this.state.error.toString()}</div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>إعادة تحميل المنصة</span>
              </button>

              <button
                onClick={this.handleClearStorageAndReset}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-700 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-amber-400" />
                <span>إعادة ضبط السلة والمحاولة</span>
              </button>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-center gap-2 text-[10px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>بيانات الاتصال الفورية وخدمة الدعم الفني: 01121275069</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
