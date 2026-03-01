import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { type CartItem } from "@/hooks/use-cart";

interface CartPanelProps {
  items: CartItem[];
  total: number;
  onUpdateQuantity: (id: number, delta: number) => void;
  onUpdateExtras: (id: number, text: string) => void;
  onRemove: (id: number) => void;
  onCheckout: () => void;
}

export function CartPanel({ items, total, onUpdateQuantity, onUpdateExtras, onRemove, onCheckout }: CartPanelProps) {
  return (
    <div className="h-full flex flex-col bg-white border-l border-gray-100 w-full md:w-[380px] lg:w-[420px]">
      <div className="p-8 pb-4">
        <h2 className="text-2xl font-extrabold text-[#1A1D1F]">Current Order</h2>
        <div className="flex gap-2 mt-4">
          <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider">
            Table #12
          </span>
          <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-bold uppercase tracking-wider">
            {items.length} Items
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1 px-8">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 py-20">
            <ShoppingBag className="w-16 h-16 mb-4 opacity-10" />
            <p className="font-medium">Your cart is empty</p>
          </div>
        ) : (
          <div className="space-y-8 py-6">
            {items.map((item) => (
              <div key={item.menuItemId} className="group animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#F0F2F5] shrink-0 overflow-hidden">
                    {/* Placeholder for item image if we had one in cart */}
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                      <UtensilsCrossed className="w-8 h-8" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-[#1A1D1F] truncate pr-2">{item.name}</h4>
                      <p className="font-bold text-[#1A1D1F]">
                        ${((item.price * item.quantity) / 100).toFixed(2)}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-gray-400 mt-0.5">
                      ${(item.price / 100).toFixed(2)} / unit
                    </p>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center bg-[#F0F2F5] rounded-xl p-1 gap-1">
                        <button
                          className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-white transition-colors text-gray-600 disabled:opacity-30"
                          onClick={() => onUpdateQuantity(item.menuItemId, -1)}
                          disabled={item.quantity <= 1}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-extrabold text-[#1A1D1F]">{item.quantity}</span>
                        <button
                          className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-white transition-colors text-gray-600"
                          onClick={() => onUpdateQuantity(item.menuItemId, 1)}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      
                      <button
                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                        onClick={() => onRemove(item.menuItemId)}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
                <Input
                  className="mt-3 h-9 text-xs bg-[#F8F9FB] border-none rounded-xl placeholder:text-gray-400 focus-visible:ring-primary/20"
                  placeholder="Order note..."
                  value={item.extras || ''}
                  onChange={(e) => onUpdateExtras(item.menuItemId, e.target.value)}
                />
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="p-8 pt-6 space-y-6">
        <div className="space-y-3">
          <div className="flex justify-between text-gray-500 font-medium">
            <span>Subtotal</span>
            <span className="text-[#1A1D1F] font-bold">${(total / 100).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-500 font-medium">
            <span>Discount</span>
            <span className="text-[#1A1D1F] font-bold">-$0.00</span>
          </div>
          <Separator className="bg-gray-100" />
          <div className="flex justify-between items-center pt-2">
            <span className="text-gray-500 font-medium">Total</span>
            <span className="text-3xl font-extrabold text-primary">
              ${(total / 100).toFixed(2)}
            </span>
          </div>
        </div>

        <Button 
          className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]" 
          onClick={onCheckout}
          disabled={items.length === 0}
        >
          Place Order
        </Button>
      </div>
    </div>
  );
}

function UtensilsCrossed({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8" />
      <path d="M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3" />
      <path d="m2 22 7.1-7.1" />
      <path d="m8 22 9-11" />
      <path d="M15 3h1" />
      <path d="M19 7v1" />
    </svg>
  );
}
