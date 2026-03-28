import QRCode from "react-qr-code";
import { format } from "date-fns";
import { type OrderWithItems } from "@shared/schema";

interface ReceiptPreviewProps {
  order: OrderWithItems;
}

export function ReceiptPreview({ order }: ReceiptPreviewProps) {
  // Mock UPI string - in real app would be dynamic
  const upiString = `upi://pay?pa=shop@upi&pn=MakaryoPOS&am=${(order.totalAmount / 100).toFixed(2)}&tn=Order #${order.id}`;

  return (
    <div id="receipt-content" className="w-full max-w-[420px] mx-auto bg-white text-[#1A1D1F] p-8 rounded-none shadow-none font-sans text-sm leading-relaxed">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/20">
          <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-extrabold mb-1 uppercase tracking-tighter">Makaryo POS</h2>
        <p className="text-sm text-gray-400 font-medium">Jl. Culinary Avenue No. 123, Jakarta</p>
        <p className="text-sm text-gray-400 font-medium">Tel: +62 812-3456-7890</p>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-4 mb-8 p-5 bg-[#F8F9FB] rounded-[1.5rem]">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Order ID</p>
          <p className="font-extrabold">#{order.id}</p>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Date & Time</p>
          <p className="font-extrabold">{format(new Date(order.createdAt), "dd MMM, HH:mm")}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Customer</p>
          <p className="font-extrabold truncate">{order.customerName || 'Walk-in'}</p>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black">Phone</p>
          <p className="font-extrabold">{order.customerPhone || 'N/A'}</p>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-5 mb-8 px-1">
        <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black border-b border-gray-100 pb-2">Order Details</p>
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between items-start group">
            <div className="flex-1 min-w-0 pr-4">
              <p className="font-bold text-base leading-tight">{item.name}</p>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-xs text-gray-400 font-bold uppercase">{item.quantity} × ₹{(item.priceAtTime / 100).toFixed(2)}</span>
                {item.variationName && <span className="text-[9px] font-black text-primary border border-primary/20 px-1.5 py-0.5 rounded uppercase">{item.variationName}</span>}
                {Array.isArray(item.modifiers) && item.modifiers.length > 0 && (
                  <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded italic">
                    Mod: {(item.modifiers as any[]).map((m: any) => m.name).join(", ")}
                  </span>
                )}
              </div>
            </div>
            <p className="font-black text-base text-right shrink-0">₹{((item.priceAtTime * item.quantity) / 100).toFixed(2)}</p>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="space-y-3 mb-8 p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
        <div className="flex justify-between text-gray-500 font-bold text-sm">
          <span>Subtotal</span>
          <span className="text-[#1A1D1F]">₹{(order.subtotal / 100).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-500 font-bold text-sm">
          <span>Tax ({order.taxPercentage}%)</span>
          <span className="text-[#1A1D1F]">₹{(order.taxAmount / 100).toFixed(2)}</span>
        </div>
        {order.discountAmount > 0 && (
          <div className="flex justify-between text-red-500 font-bold text-sm">
            <span>Discount</span>
            <span>-₹{(order.discountAmount / 100).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between items-center pt-3 border-t border-primary/20 mt-1">
          <span className="text-[#1A1D1F] font-black text-lg uppercase tracking-tighter">Total</span>
          <span className="text-3xl font-black text-primary">
            ₹{(order.totalAmount / 100).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Payment Method Badge */}
      <div className="flex justify-center mb-8">
        <span className="px-5 py-2 bg-[#1A1D1F] text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">
          Paid via {order.paymentMethod}
        </span>
      </div>

      {/* Payment QR */}
      <div className="flex flex-col items-center justify-center space-y-4 mb-8">
        <div className="p-5 bg-white border-2 border-gray-100 rounded-[2.5rem] shadow-sm">
          <QRCode value={upiString} size={140} />
        </div>
        <div className="text-center">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Scan to pay via QRIS/UPI</p>
          <p className="text-[9px] text-gray-300 mt-1">Merchant: MAKARYOPOS-01</p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center border-t border-dashed border-gray-200 pt-8">
        <p className="font-black text-lg mb-1">Thank You!</p>
        <p className="text-gray-400 font-medium text-xs">Please come again & have a great day!</p>
        <div className="flex items-center justify-center gap-1 mt-4 text-[10px] text-gray-300 font-bold">
          <span>{format(new Date(), "dd/MM/yyyy")}</span>
          <span>•</span>
          <span>{format(new Date(), "HH:mm:ss")}</span>
        </div>
      </div>
    </div>
  );
}
