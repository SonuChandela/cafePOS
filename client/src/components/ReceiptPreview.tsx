import QRCode from "react-qr-code";
import { format } from "date-fns";
import { type OrderWithItems } from "@shared/schema";

interface ReceiptPreviewProps {
  order: OrderWithItems;
}

export function ReceiptPreview({ order }: ReceiptPreviewProps) {
  // Mock UPI string - in real app would be dynamic
  const upiString = `upi://pay?pa=shop@upi&pn=QuickBite&am=${(order.totalAmount / 100).toFixed(2)}&tn=Order #${order.id}`;

  return (
    <div id="receipt-content" className="w-full max-w-[350px] mx-auto bg-white text-black p-6 rounded-none shadow-none font-mono text-sm leading-relaxed">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold mb-1">QuickBite Cafe</h2>
        <p className="text-xs text-gray-500">123 Culinary Avenue, Foodie City</p>
        <p className="text-xs text-gray-500">Tel: +1 234-567-8900</p>
      </div>

      {/* Meta */}
      <div className="flex justify-between text-xs mb-4 border-b border-dashed border-gray-300 pb-2">
        <div className="space-y-1">
          <p>Order #: {order.id}</p>
          <p>Date: {format(new Date(order.createdAt), "dd/MM/yy HH:mm")}</p>
        </div>
        <div className="text-right space-y-1">
          <p>{order.customerName}</p>
          <p>{order.customerPhone}</p>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2 mb-4 border-b border-dashed border-gray-300 pb-4 min-h-[100px]">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between items-start">
            <div className="flex-1">
              <p className="font-bold">{item.name}</p>
              {item.extras && <p className="text-[10px] italic text-gray-500">{item.extras}</p>}
              <p className="text-xs text-gray-500">{item.quantity} x ${(item.priceAtTime / 100).toFixed(2)}</p>
            </div>
            <p className="font-bold">${((item.priceAtTime * item.quantity) / 100).toFixed(2)}</p>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="space-y-1 mb-6 text-right">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>${((order.totalAmount / 1.05) / 100).toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-500 text-xs">
          <span>Tax (5%)</span>
          <span>${((order.totalAmount - (order.totalAmount / 1.05)) / 100).toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg border-t border-black pt-2 mt-2">
          <span>Total</span>
          <span>${(order.totalAmount / 100).toFixed(2)}</span>
        </div>
        <p className="text-xs text-gray-500 mt-1">Paid via {order.paymentMethod.toUpperCase()}</p>
      </div>

      {/* Payment QR */}
      <div className="flex flex-col items-center justify-center space-y-2 mb-6">
        <div className="p-2 bg-white border border-gray-200 rounded">
          <QRCode value={upiString} size={100} />
        </div>
        <p className="text-[10px] text-center text-gray-500">Scan to pay via UPI</p>
      </div>

      {/* Footer */}
      <div className="text-center text-xs space-y-1">
        <p className="font-bold">Thank you for visiting!</p>
        <p className="text-gray-400">Please come again</p>
      </div>
    </div>
  );
}
