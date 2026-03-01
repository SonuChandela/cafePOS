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
        <h2 className="text-2xl font-extrabold mb-1">Makaryo POS</h2>
        <p className="text-sm text-gray-400 font-medium">Jl. Culinary Avenue No. 123, Jakarta</p>
        <p className="text-sm text-gray-400 font-medium">Tel: +62 812-3456-7890</p>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-4 mb-8 p-4 bg-[#F8F9FB] rounded-2xl">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Order ID</p>
          <p className="font-extrabold">#{order.id}</p>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Date & Time</p>
          <p className="font-extrabold">{format(new Date(order.createdAt), "dd MMM yyyy, HH:mm")}</p>
        </div>
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Customer</p>
          <p className="font-extrabold truncate">{order.customerName}</p>
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Phone</p>
          <p className="font-extrabold">{order.customerPhone}</p>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-4 mb-8">
        <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold px-1">Order Details</p>
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between items-center group">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-base">{item.name}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-400 font-medium">{item.quantity} x ${(item.priceAtTime / 100).toFixed(2)}</span>
                {item.extras && <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 rounded text-gray-500 font-medium">{item.extras}</span>}
              </div>
            </div>
            <p className="font-extrabold text-base">${((item.priceAtTime * item.quantity) / 100).toFixed(2)}</p>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="space-y-3 mb-8 p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
        <div className="flex justify-between text-gray-500 font-bold">
          <span>Subtotal</span>
          <span className="text-[#1A1D1F]">${((order.totalAmount / 1.05) / 100).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-500 font-bold">
          <span>Tax (5%)</span>
          <span className="text-[#1A1D1F]">${((order.totalAmount - (order.totalAmount / 1.05)) / 100).toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-primary/20">
          <span className="text-[#1A1D1F] font-extrabold text-lg">Total</span>
          <span className="text-2xl font-extrabold text-primary">
            ${(order.totalAmount / 100).toFixed(2)}
          </span>
        </div>
      </div>

      {/* Payment Method Badge */}
      <div className="flex justify-center mb-8">
        <span className="px-4 py-1.5 bg-[#1A1D1F] text-white rounded-full text-[10px] font-extrabold uppercase tracking-[0.2em]">
          Paid via {order.paymentMethod}
        </span>
      </div>

      {/* Payment QR */}
      <div className="flex flex-col items-center justify-center space-y-3 mb-8">
        <div className="p-4 bg-white border-2 border-[#F0F2F5] rounded-[2rem]">
          <QRCode value={upiString} size={120} />
        </div>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Scan to pay via QRIS/UPI</p>
      </div>

      {/* Footer */}
      <div className="text-center">
        <p className="font-extrabold text-base mb-1">Thank You!</p>
        <p className="text-gray-400 font-medium">Please come again & have a great day!</p>
      </div>
    </div>
  );
}
