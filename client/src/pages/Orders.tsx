import { Sidebar } from "@/components/Sidebar";
import { useOrders } from "@/hooks/use-orders";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Eye, Edit, Menu as MenuIcon, Printer, X, Plus, Minus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ReceiptPreview } from "@/components/ReceiptPreview";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type OrderWithItems, type MenuItem } from "@shared/schema";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

type EditItem = {
  menuItemId: number;
  name: string;
  quantity: number;
  basePrice: number;
  variationName?: string | null;
  modifiers: any;
  modifiersAmount: number;
};

export default function Orders() {
  const { data: orders, isLoading } = useOrders();
  const { data: menuItems } = useQuery<MenuItem[]>({ queryKey: ["/api/menu"] });
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [viewMode, setViewMode] = useState<"view" | "edit" | null>(null);
  const [editItems, setEditItems] = useState<EditItem[]>([]);
  const [orderStatus, setOrderStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [addMenuItemId, setAddMenuItemId] = useState<string>("");

  const filteredOrders = orders?.filter(order => 
    order.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    order.customerPhone?.includes(search) ||
    order.displayId?.toLowerCase().includes(search.toLowerCase())
  );

  const openEditMode = (order: OrderWithItems) => {
    setSelectedOrder(order);
    setViewMode("edit");
    setEditItems(order.items.map(i => ({
      menuItemId: i.menuItemId,
      name: i.name,
      quantity: i.quantity,
      basePrice: i.basePrice,
      variationName: i.variationName,
      modifiers: (i as any).modifiers || null,
      modifiersAmount: i.modifiersAmount || 0,
    })));
    setOrderStatus(order.orderStatus || "");
    setPaymentStatus(order.paymentStatus || "");
    setOrderNotes(order.note || "");
  };

  const editSubtotal = editItems.reduce((s, i) => s + i.basePrice * i.quantity, 0);
  const editTaxAmount = selectedOrder ? Math.round(editSubtotal * selectedOrder.taxPercentage / 100) : 0;
  const editDiscount = selectedOrder?.discountAmount || 0;
  const editTotal = editSubtotal + editTaxAmount - editDiscount;

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/orders/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setSelectedOrder(null);
      setViewMode(null);
    }
  });

  const handleSaveEdit = () => {
    if (!selectedOrder) return;
    updateOrderMutation.mutate({
      id: selectedOrder.id,
      data: {
        orderStatus,
        paymentStatus,
        note: orderNotes || null,
        items: editItems,
        subtotal: editSubtotal,
        taxAmount: editTaxAmount,
        grandTotal: editTotal,
      }
    });
  };

  const updateEditItemQty = (idx: number, delta: number) => {
    setEditItems(prev => {
      const next = [...prev];
      const newQty = next[idx].quantity + delta;
      if (newQty <= 0) {
        next.splice(idx, 1);
      } else {
        next[idx] = { ...next[idx], quantity: newQty };
      }
      return next;
    });
  };

  const removeEditItem = (idx: number) => {
    setEditItems(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddMenuItem = () => {
    if (!addMenuItemId) return;
    const menuItem = menuItems?.find(m => m.id === Number(addMenuItemId));
    if (!menuItem) return;
    const existing = editItems.findIndex(i => i.menuItemId === menuItem.id && !i.variationName);
    if (existing >= 0) {
      updateEditItemQty(existing, 1);
    } else {
      setEditItems(prev => [...prev, {
        menuItemId: menuItem.id,
        name: menuItem.name,
        quantity: 1,
        basePrice: menuItem.price,
        variationName: null,
        modifiers: null,
        modifiersAmount: 0,
      }]);
    }
    setAddMenuItemId("");
  };

  const handlePrint = () => {
    window.print();
  };

  const isCompleted = (order: OrderWithItems | null) => order?.orderStatus === 'completed';

  return (
    <div className="flex h-screen w-full bg-[#F8F9FB] overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
        <header className="p-4 md:p-6 pb-3">
          <div className="flex items-center gap-3 mb-3">
            <Button variant="ghost" size="icon" className="md:hidden shrink-0" onClick={() => setSidebarOpen(true)}>
              <MenuIcon className="w-5 h-5" />
            </Button>
            <div className="flex-1 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div>
                <h1 className="text-xl font-extrabold text-[#1A1D1F]">Order History</h1>
                <p className="text-gray-400 text-xs font-medium">View and manage past transactions</p>
              </div>
              <div className="relative w-full sm:w-72 lg:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input 
                  placeholder="Search orders..." 
                  className="pl-10 h-11 bg-white border-none rounded-2xl shadow-sm focus-visible:ring-primary/20 font-medium text-sm"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  data-testid="input-search-orders"
                />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto px-4 md:px-6 pb-4">
          <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden bg-white">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/50">
                    <tr className="border-b border-gray-100">
                      <th className="font-bold text-[#1A1D1F] h-12 pl-5 text-left uppercase text-[10px] tracking-widest whitespace-nowrap">ID</th>
                      <th className="font-bold text-[#1A1D1F] text-left uppercase text-[10px] tracking-widest px-2 whitespace-nowrap">Customer</th>
                      <th className="font-bold text-[#1A1D1F] text-left uppercase text-[10px] tracking-widest px-2 whitespace-nowrap hidden sm:table-cell">Status</th>
                      <th className="font-bold text-[#1A1D1F] text-left uppercase text-[10px] tracking-widest px-2 whitespace-nowrap hidden md:table-cell">Payment</th>
                      <th className="font-bold text-[#1A1D1F] text-left uppercase text-[10px] tracking-widest px-2 whitespace-nowrap">Amount</th>
                      <th className="font-bold text-[#1A1D1F] text-right pr-5 uppercase text-[10px] tracking-widest whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      Array.from({ length: 5 }).map((_, i) => (
                        <tr key={i} className="border-b border-gray-50">
                          <td className="pl-5 py-3"><Skeleton className="h-4 w-10" /></td>
                          <td className="px-2 py-3"><Skeleton className="h-4 w-28" /></td>
                          <td className="px-2 py-3 hidden sm:table-cell"><Skeleton className="h-4 w-16" /></td>
                          <td className="px-2 py-3 hidden md:table-cell"><Skeleton className="h-4 w-14" /></td>
                          <td className="px-2 py-3"><Skeleton className="h-4 w-16" /></td>
                          <td className="pr-5 py-3"><Skeleton className="h-8 w-16 ml-auto" /></td>
                        </tr>
                      ))
                    ) : filteredOrders?.map((order) => (
                      <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                        <td className="font-bold text-[#1A1D1F] pl-5 py-3 text-sm">#{order.displayId}</td>
                        <td className="px-2 py-3">
                          <div className="font-bold text-[#1A1D1F] text-sm">{order.customerName || 'Walk-in'}</div>
                          <div className="text-[10px] text-gray-400 font-bold uppercase">{format(new Date(order.createdAt), "dd MMM, HH:mm")}</div>
                        </td>
                        <td className="px-2 py-3 hidden sm:table-cell">
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              "font-black uppercase tracking-widest text-[10px] px-2 py-0.5 rounded-full",
                              order.orderStatus === 'preparing' && "bg-orange-100 text-orange-600",
                              order.orderStatus === 'ready' && "bg-blue-100 text-blue-600",
                              order.orderStatus === 'completed' && "bg-green-100 text-green-600",
                              order.orderStatus === 'cancelled' && "bg-red-100 text-red-600",
                            )}
                          >
                            {order.orderStatus}
                          </Badge>
                        </td>
                        <td className="px-2 py-3 hidden md:table-cell">
                          <Badge variant="outline" className={cn(
                            "text-[9px] font-black uppercase tracking-widest border-none px-2",
                            order.paymentStatus === 'paid' ? "text-green-500 bg-green-50" : "text-amber-500 bg-amber-50"
                          )}>
                            {order.paymentStatus}
                          </Badge>
                        </td>
                        <td className="px-2 py-3 font-black text-[#1A1D1F] text-sm">
                          ₹{(order.grandTotal / 100).toFixed(2)}
                        </td>
                        <td className="text-right pr-5 py-3">
                          <div className="flex justify-end gap-1.5">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => { setSelectedOrder(order); setViewMode("view"); }}
                              className="w-8 h-8 rounded-xl hover:bg-white hover:text-primary hover:shadow-sm"
                              data-testid={`button-view-${order.displayId}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => openEditMode(order)}
                              disabled={isCompleted(order)}
                              className="w-8 h-8 rounded-xl hover:bg-white hover:text-primary hover:shadow-sm disabled:opacity-30"
                              data-testid={`button-edit-${order.displayId}`}
                              title={isCompleted(order) ? "Completed orders cannot be edited" : "Edit order"}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Print-only receipt */}
      {selectedOrder && viewMode === "view" && (
        <div className="print-only">
          <ReceiptPreview order={selectedOrder} />
        </div>
      )}

      <Dialog open={!!selectedOrder} onOpenChange={() => { setSelectedOrder(null); setViewMode(null); }}>
        <DialogContent className="w-full sm:max-w-[540px] p-0 overflow-hidden border-none rounded-[2rem] bg-white max-h-[92vh] overflow-y-auto shadow-2xl mx-2 sm:mx-auto">
          {selectedOrder && (
            <>
              {viewMode === "view" ? (
                <div>
                  <ReceiptPreview order={selectedOrder} />
                  <div className="p-5 bg-gray-50 flex gap-3 no-print border-t border-gray-100">
                    <Button onClick={handlePrint} className="flex-1 h-12 rounded-2xl font-bold gap-2">
                      <Printer className="w-4 h-4" /> Print Invoice
                    </Button>
                    <Button variant="outline" onClick={() => setSelectedOrder(null)} className="flex-1 h-12 rounded-2xl font-bold">Close</Button>
                  </div>
                </div>
              ) : viewMode === "edit" ? (
                <div className="p-5 md:p-7">
                  <DialogHeader className="mb-5">
                    <DialogTitle className="text-xl font-black text-[#1A1D1F]">Edit Order #{selectedOrder.displayId}</DialogTitle>
                    <p className="text-gray-400 font-medium text-sm">Modify items, status, and notes</p>
                  </DialogHeader>
                  
                  <div className="space-y-5">
                    {/* Status row */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="font-black text-[10px] uppercase tracking-widest text-gray-400">Order Status</Label>
                        <Select value={orderStatus} onValueChange={setOrderStatus}>
                          <SelectTrigger className="h-12 bg-[#F8F9FB] border-none rounded-2xl font-bold text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-none shadow-xl">
                            <SelectItem value="preparing">Preparing</SelectItem>
                            <SelectItem value="ready">Ready</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="cancelled">Cancelled</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="font-black text-[10px] uppercase tracking-widest text-gray-400">Payment</Label>
                        <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                          <SelectTrigger className="h-12 bg-[#F8F9FB] border-none rounded-2xl font-bold text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-none shadow-xl">
                            <SelectItem value="pending">Pending</SelectItem>
                            <SelectItem value="paid">Paid</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-1.5">
                      <Label className="font-black text-[10px] uppercase tracking-widest text-gray-400">Order Notes</Label>
                      <Input 
                        placeholder="Add notes (optional)..." 
                        value={orderNotes}
                        onChange={e => setOrderNotes(e.target.value)}
                        className="h-12 bg-[#F8F9FB] border-none rounded-2xl font-medium text-sm"
                        data-testid="input-order-notes"
                      />
                    </div>

                    {/* Items List */}
                    <div className="space-y-2">
                      <Label className="font-black text-[10px] uppercase tracking-widest text-gray-400">Order Items</Label>
                      {editItems.length === 0 ? (
                        <div className="text-center py-6 text-gray-400 bg-[#F8F9FB] rounded-2xl">
                          <p className="text-sm font-medium">No items in order</p>
                        </div>
                      ) : (
                        <ScrollArea className="max-h-56">
                          <div className="space-y-2 pr-2">
                            {editItems.map((item, idx) => (
                              <div key={idx} className="flex items-center gap-2 bg-[#F8F9FB] rounded-2xl p-3">
                                <div className="flex-1 min-w-0">
                                  <p className="font-bold text-sm text-[#1A1D1F] truncate">{item.name}</p>
                                  {item.variationName && (
                                    <p className="text-[10px] text-primary font-black uppercase">{item.variationName}</p>
                                  )}
                                  <p className="text-xs text-gray-400 font-bold">₹{(item.basePrice / 100).toFixed(2)} each</p>
                                </div>
                                <div className="flex items-center gap-1 bg-white rounded-xl p-0.5">
                                  <button
                                    onClick={() => updateEditItemQty(idx, -1)}
                                    className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-gray-50 text-gray-600"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="w-6 text-center text-sm font-black text-[#1A1D1F]">{item.quantity}</span>
                                  <button
                                    onClick={() => updateEditItemQty(idx, 1)}
                                    className="h-7 w-7 rounded-lg flex items-center justify-center hover:bg-gray-50 text-gray-600"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                                <p className="font-black text-sm text-[#1A1D1F] w-16 text-right">
                                  ₹{(item.basePrice * item.quantity / 100).toFixed(2)}
                                </p>
                                <button
                                  onClick={() => removeEditItem(idx)}
                                  className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </div>

                    {/* Add Menu Item */}
                    <div className="space-y-1.5">
                      <Label className="font-black text-[10px] uppercase tracking-widest text-gray-400">Add Item</Label>
                      <div className="flex gap-2">
                        <Select value={addMenuItemId} onValueChange={setAddMenuItemId}>
                          <SelectTrigger className="flex-1 h-11 bg-[#F8F9FB] border-none rounded-2xl font-medium text-sm">
                            <SelectValue placeholder="Select a menu item..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-none shadow-xl max-h-48">
                            {menuItems?.map(item => (
                              <SelectItem key={item.id} value={String(item.id)}>
                                {item.name} — ₹{(item.price / 100).toFixed(2)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          onClick={handleAddMenuItem}
                          disabled={!addMenuItemId}
                          className="h-11 px-4 rounded-2xl font-bold"
                          data-testid="button-add-menu-item"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Recalculated totals */}
                    <div className="bg-primary/5 rounded-2xl p-4 space-y-2">
                      <div className="flex justify-between text-sm font-bold text-gray-500">
                        <span>Subtotal</span>
                        <span className="text-[#1A1D1F]">₹{(editSubtotal / 100).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold text-gray-500">
                        <span>Tax ({selectedOrder.taxPercentage}%)</span>
                        <span className="text-[#1A1D1F]">₹{(editTaxAmount / 100).toFixed(2)}</span>
                      </div>
                      {editDiscount > 0 && (
                        <div className="flex justify-between text-sm font-bold text-red-500">
                          <span>Discount</span>
                          <span>-₹{(editDiscount / 100).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t border-primary/20">
                        <span className="font-black text-[#1A1D1F]">Total</span>
                        <span className="text-2xl font-black text-primary">₹{(editTotal / 100).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-1">
                      <Button 
                        variant="outline" 
                        type="button" 
                        onClick={() => { setSelectedOrder(null); setViewMode(null); }} 
                        className="flex-1 h-12 rounded-2xl font-bold border-gray-200"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="button"
                        onClick={handleSaveEdit}
                        disabled={updateOrderMutation.isPending || editItems.length === 0}
                        className="flex-1 h-12 rounded-2xl font-black uppercase tracking-wider"
                        data-testid="button-save-order"
                      >
                        {updateOrderMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
