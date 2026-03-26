import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createOrderSchema, type CreateOrderRequest, type Order } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type CartItem } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, Banknote, QrCode, User, Phone, Activity } from "lucide-react";

interface CheckoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CartItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  total: number;
  onSuccess: (orderId: number) => void;
}

export function CheckoutDialog({
  open, onOpenChange, items, subtotal, taxRate, taxAmount, discount, total, onSuccess
}: CheckoutDialogProps) {
  const { toast } = useToast();
  const form = useForm<CreateOrderRequest>({
    resolver: zodResolver(createOrderSchema),
    defaultValues: {
      customerName: "",
      customerPhone: "",
      paymentMethod: "cash",
      paymentStatus: "pending",
      orderStatus: "preparing",
      subtotal: subtotal,
      taxPercentage: taxRate,
      taxAmount: taxAmount,
      discountAmount: discount,
      totalAmount: total,
      items: items.map(i => ({
        menuItemId: i.menuItemId,
        name: i.name,
        quantity: i.quantity,
        priceAtTime: i.price,
        variationName: i.variationName,
        modifiers: i.selectedExtras, // Correct JSON array payload instead of tracking string
        modifiersAmount: i.selectedExtras.reduce((s, e) => s + e.price, 0),
        totalPrice: ((i.price) + i.selectedExtras.reduce((s, e) => s + e.price, 0)) * i.quantity
      })),
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: CreateOrderRequest) => {
      const res = await apiRequest("POST", "/api/orders", data);
      return res.json() as Promise<Order>;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      onSuccess(data.id);
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Checkout failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function onSubmit(data: CreateOrderRequest) {
    mutation.mutate({
      ...data,
      subtotal,
      taxPercentage: taxRate,
      taxAmount,
      discountAmount: discount,
      totalAmount: total,
      items: items.map(i => ({
        menuItemId: i.menuItemId,
        name: i.name,
        quantity: i.quantity,
        priceAtTime: i.price,
        variationName: i.variationName,
        modifiers: i.selectedExtras, // Correct format
        modifiersAmount: i.selectedExtras.reduce((s, e) => s + e.price, 0),
        totalPrice: ((i.price) + i.selectedExtras.reduce((s, e) => s + e.price, 0)) * i.quantity
      })),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden border-none rounded-[2.5rem] bg-[#F8F9FB] max-h-[90vh] overflow-y-auto">
        <div className="p-8 bg-white border-b border-gray-100">
          <DialogTitle className="text-2xl font-extrabold text-[#1A1D1F]">Checkout Information</DialogTitle>
          <p className="text-gray-400 font-medium mt-1">Complete the customer details to place order</p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="p-8 space-y-6">
            <div className="grid grid-cols-1 gap-6">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#1A1D1F] font-bold">Customer Name</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          placeholder="Enter name"
                          {...field}
                          value={field.value || ""}
                          className="pl-12 h-14 bg-white border-none rounded-2xl shadow-sm focus-visible:ring-primary/20"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="customerPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#1A1D1F] font-bold">Phone Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <Input
                          placeholder="08123456789"
                          {...field}
                          value={field.value || ""}
                          className="pl-12 h-14 bg-white border-none rounded-2xl shadow-sm focus-visible:ring-primary/20"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#1A1D1F] font-bold">Payment</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-14 bg-white border-none rounded-2xl shadow-sm focus-visible:ring-primary/20">
                            <SelectValue placeholder="Method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-2xl border-none shadow-xl">
                          <SelectItem value="cash" className="py-3 rounded-xl">Cash</SelectItem>
                          <SelectItem value="card" className="py-3 rounded-xl">Card</SelectItem>
                          <SelectItem value="upi" className="py-3 rounded-xl">UPI</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="orderStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#1A1D1F] font-bold">Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="h-14 bg-white border-none rounded-2xl shadow-sm focus-visible:ring-primary/20">
                            <SelectValue placeholder="Status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-2xl border-none shadow-xl">
                          <SelectItem value="preparing" className="py-3 rounded-xl">Preparing</SelectItem>
                          <SelectItem value="ready" className="py-3 rounded-xl">Ready</SelectItem>
                          <SelectItem value="completed" className="py-3 rounded-xl">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100">
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>Subtotal</span>
                  <span>${(subtotal / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-500 font-medium">
                  <span>Tax ({taxRate}%)</span>
                  <span>${(taxAmount / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-red-500 font-medium">
                  <span>Discount</span>
                  <span>-${(discount / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[#1A1D1F] font-bold">Grand Total</span>
                  <span className="text-2xl font-extrabold text-primary">${(total / 100).toFixed(2)}</span>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
                disabled={mutation.isPending}
              >
                {mutation.isPending ? "Processing..." : "Confirm & Place Order"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
