import { useState } from "react";
import { Minus, Plus, ShoppingBag, Trash2, Tag, Percent, Utensils, PlusCircle, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { type CartItem, type CartExtra } from "@/hooks/use-cart";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useMenu } from "@/hooks/use-menu";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

import { useCart } from "@/hooks/use-cart";

interface CartPanelProps {
  onCheckout: () => void;
}

export function CartPanel({ onCheckout }: CartPanelProps) {
  const {
    items, subtotal, taxRate, setTaxRate, taxAmount, discount, setDiscount, total,
    updateQuantity: onUpdateQuantity, toggleExtra: onToggleExtra, 
    updateNotes: onUpdateNotes, removeItem: onRemove, clearCart
  } = useCart();
  const { data: menuItems } = useMenu();
  const [footerExpanded, setFooterExpanded] = useState(false);

  const predefinedDiscounts = [
    { label: "None", value: 0 },
    { label: "₹50 Off", value: 50 },
    { label: "₹100 Off", value: 100 },
    { label: "10%", value: Math.round(subtotal * 0.1) },
  ];

  return (
    <div className="h-full flex flex-col bg-white w-full overflow-hidden">
      <div className="p-4 md:p-6 pb-3 shrink-0">
        <h2 className="text-xl font-extrabold text-[#1A1D1F]">Current Order</h2>
        <div className="flex justify-between items-center mt-2">
          <div className="flex gap-2">
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold uppercase tracking-wider">
              POS Terminal
            </span>
            <span className="px-3 py-1 bg-gray-100 text-gray-500 rounded-full text-xs font-bold uppercase tracking-wider">
              {items.length} Items
            </span>
          </div>
          {items.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-red-500 hover:text-red-600 hover:bg-red-50 text-xs font-bold"
              onClick={clearCart}
            >
              Clear Cart
            </Button>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 px-4 md:px-6 min-h-0">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 py-16">
            <ShoppingBag className="w-14 h-14 mb-3 opacity-10" />
            <p className="font-medium text-base">Your cart is empty</p>
          </div>
        ) : (
          <div className="space-y-4 py-3">
            {items.map((item) => {
              const menuItem = menuItems?.find(m => m.id === item.menuItemId);
              const extrasTotal = item.selectedExtras.reduce((s, e) => s + e.price, 0);
              return (
                <div
                  key={`${item.menuItemId}-${item.variationName}`}
                  className="animate-in fade-in slide-in-from-right-4 duration-300"
                >
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-xl bg-[#F0F2F5] shrink-0 overflow-hidden flex items-center justify-center text-gray-300">
                      <Utensils className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0 flex-1 pr-2">
                          <h4 className="font-bold text-[#1A1D1F] truncate text-sm">{item.name}</h4>
                          {item.variationName && (
                            <p className="text-[10px] font-extrabold text-primary uppercase tracking-widest">{item.variationName}</p>
                          )}
                        </div>
                        <p className="font-bold text-[#1A1D1F] text-sm shrink-0">
                          ₹{((item.price + extrasTotal) * item.quantity).toFixed(2)}
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center bg-[#F0F2F5] rounded-xl p-0.5 gap-0.5">
                          <button
                            className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-white transition-colors text-gray-600 disabled:opacity-30"
                            onClick={() => onUpdateQuantity(item.menuItemId, -1, item.variationName)}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-7 text-center text-sm font-black text-[#1A1D1F]">{item.quantity}</span>
                          <button
                            className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-white transition-colors text-gray-600"
                            onClick={() => onUpdateQuantity(item.menuItemId, 1, item.variationName)}
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {menuItem?.extras && menuItem.extras.length > 0 && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2.5 rounded-xl bg-primary/5 text-primary hover:bg-primary/10 border-none flex items-center gap-1"
                                >
                                  <PlusCircle className="w-3.5 h-3.5" />
                                  <span className="text-[10px] font-black uppercase">Extras</span>
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-60 p-3 rounded-[1.5rem] shadow-2xl border-none z-[70]">
                                <h5 className="font-bold text-sm mb-2 px-1">Add Extras</h5>
                                <div className="space-y-1.5">
                                  {menuItem.extras.flatMap((extraGroup) => 
                                    extraGroup.modifiers.map((modifier: any) => {
                                      const isSelected = item.selectedExtras.some(e => e.name === modifier.name);
                                      return (
                                        <button
                                          key={`${extraGroup.id}-${modifier.id}`}
                                          onClick={() => onToggleExtra(item.menuItemId, modifier, item.variationName)}
                                          className={cn(
                                            "w-full text-left px-3 py-2.5 rounded-2xl text-xs font-bold flex justify-between transition-all items-center",
                                            isSelected ? "bg-primary text-white" : "bg-[#F8F9FB] text-gray-600 hover:bg-gray-100"
                                          )}
                                        >
                                          <span>{modifier.name}</span>
                                          <span className={cn("text-[10px]", isSelected ? "text-white/80" : "text-primary")}>+₹{Number(modifier.price).toFixed(2)}</span>
                                        </button>
                                      );
                                    })
                                  )}
                                </div>
                              </PopoverContent>
                            </Popover>
                          )}
                          <button
                            className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                            onClick={() => onRemove(item.menuItemId, item.variationName)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {item.selectedExtras.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2 ml-15">
                      {item.selectedExtras.map((e, idx) => (
                        <span key={idx} className="px-2 py-0.5 bg-primary text-white text-[10px] font-black rounded-lg shadow-sm">
                          + {e.name}
                        </span>
                      ))}
                    </div>
                  )}

                  <Input
                    className="mt-2 h-9 text-xs bg-[#F8F9FB] border-none rounded-xl placeholder:text-gray-400 focus-visible:ring-primary/20"
                    placeholder="Note (e.g., no spice)..."
                    value={item.notes || ''}
                    onChange={(e) => onUpdateNotes(item.menuItemId, e.target.value, item.variationName)}
                  />

                  <Separator className="mt-4 bg-gray-50" />
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Footer - Collapsible summary + Place Order */}
      <div className="shrink-0 bg-white border-t border-gray-100">
        {/* Drag handle / toggle */}
        <button
          onClick={() => setFooterExpanded(!footerExpanded)}
          className="w-full flex items-center justify-between px-4 md:px-6 py-3 hover:bg-gray-50/60 transition-colors"
          data-testid="button-toggle-footer"
        >
          <div className="flex items-center gap-2">
            <span className="text-base font-black text-[#1A1D1F]">Total</span>
            <span className="text-xl font-black text-primary">₹{total.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1 text-gray-400">
            <span className="text-[10px] font-bold uppercase">{footerExpanded ? "Less" : "Details"}</span>
            {footerExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </div>
        </button>

        {/* Expandable detail section */}
        <div className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          footerExpanded ? "max-h-80 opacity-100" : "max-h-0 opacity-0"
        )}>
          <div className="px-4 md:px-6 pb-3 space-y-2.5">
            <div className="flex justify-between text-gray-500 font-bold text-sm">
              <span>Subtotal</span>
              <span className="text-[#1A1D1F]">₹{subtotal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center text-gray-500 font-bold text-sm">
              <div className="flex items-center gap-2">
                <span>Tax</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-1 text-[10px] bg-gray-100 px-2.5 py-1 rounded-full hover:bg-gray-200 transition-colors">
                      {taxRate} <Percent className="w-2.5 h-2.5" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-40 p-4 rounded-2xl shadow-xl border-none z-[70]">
                    <Label className="text-xs font-bold mb-2 block">Tax %</Label>
                    <Input
                      type="number"
                      value={taxRate}
                      onChange={(e) => setTaxRate(Number(e.target.value))}
                      className="h-10 rounded-xl border-gray-100"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <span className="text-[#1A1D1F]">₹{taxAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center text-gray-500 font-bold text-sm">
              <div className="flex items-center gap-2">
                <span>Discount</span>
                <Popover>
                  <PopoverTrigger asChild>
                    <button className="flex items-center gap-1 text-[10px] bg-gray-100 px-2.5 py-1 rounded-full hover:bg-gray-200 transition-colors text-primary font-black">
                      EDIT <Tag className="w-2.5 h-2.5 ml-0.5" />
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-60 p-4 rounded-[1.5rem] shadow-2xl border-none space-y-3 z-[70]">
                    <div>
                      <Label className="text-xs font-black mb-2 block uppercase tracking-wider">Manual (₹)</Label>
                      <Input
                        type="number"
                        value={discount / 100}
                        onChange={(e) => setDiscount(Number(e.target.value) * 100)}
                        className="h-12 rounded-xl border-gray-100 text-lg font-bold"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-[10px] h-9 bg-[#F8F9FB] rounded-xl hover:bg-primary/10 hover:text-primary font-bold"
                        onClick={() => setDiscount(0)}
                      >
                        None
                      </Button>
                      {useCart().discounts?.map((d: any) => (
                        <Button
                          key={d.id}
                          variant="ghost"
                          size="sm"
                          className="text-[10px] h-9 bg-[#F8F9FB] rounded-xl hover:bg-primary/10 hover:text-primary font-bold"
                          onClick={() => {
                            const val = d.type === 'percentage' ? Math.round(subtotal * (d.value / 10000)) : d.value;
                            setDiscount(val);
                          }}
                        >
                          {d.name}
                        </Button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
              <span className="text-red-500 font-bold">-₹{discount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Place Order Button */}
        <div className="px-4 md:px-6 pb-5 pt-2">
          <Button
            className="w-full h-14 text-base font-black rounded-2xl shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest"
            onClick={onCheckout}
            disabled={items.length === 0}
            data-testid="button-place-order"
          >
            Place Order · ₹{total.toFixed(2)}
          </Button>
        </div>
      </div>
    </div>
  );
}
