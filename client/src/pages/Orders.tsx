import { Sidebar } from "@/components/Sidebar";
import { useOrders } from "@/hooks/use-orders";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Eye, Edit, EyeOff, Menu as MenuIcon, Printer, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ReceiptPreview } from "@/components/ReceiptPreview";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { type OrderWithItems } from "@shared/schema";

export default function Orders() {
  const { data: orders, isLoading } = useOrders();
  const [search, setSearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderWithItems | null>(null);
  const [viewMode, setViewMode] = useState<"view" | "edit" | null>(null);

  const filteredOrders = orders?.filter(order => 
    order.customerName?.toLowerCase().includes(search.toLowerCase()) ||
    order.customerPhone?.includes(search) ||
    order.id.toString().includes(search)
  );

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await apiRequest("PATCH", `/api/orders/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setSelectedOrder(null);
      setViewMode(null);
    }
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex h-screen w-full bg-[#F8F9FB] overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="p-8 pb-4">
          <div className="flex items-center gap-4 mb-4 md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
              <MenuIcon className="w-6 h-6" />
            </Button>
          </div>
          <div className="flex justify-between items-end gap-4">
            <div>
              <h1 className="text-2xl font-extrabold text-[#1A1D1F]">Order History</h1>
              <p className="text-gray-400 text-sm font-medium">View and manage past transactions</p>
            </div>
            <div className="relative w-full lg:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input 
                placeholder="Search by ID, name, phone..." 
                className="pl-12 h-14 bg-white border-none rounded-2xl shadow-sm focus-visible:ring-primary/20 font-medium"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8 pt-4">
          <Card className="rounded-[2rem] border-none shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-gray-50/50">
                  <TableRow className="hover:bg-transparent border-gray-100">
                    <TableHead className="font-bold text-[#1A1D1F] h-14 pl-8">Order #</TableHead>
                    <TableHead className="font-bold text-[#1A1D1F]">Date</TableHead>
                    <TableHead className="font-bold text-[#1A1D1F]">Customer</TableHead>
                    <TableHead className="font-bold text-[#1A1D1F]">Status</TableHead>
                    <TableHead className="font-bold text-[#1A1D1F]">Amount</TableHead>
                    <TableHead className="font-bold text-[#1A1D1F] text-right pr-8">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i} className="border-gray-50">
                        <TableCell className="pl-8"><Skeleton className="h-4 w-12" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                        <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                        <TableCell className="pr-8"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                      </TableRow>
                    ))
                  ) : filteredOrders?.map((order) => {
                    const isCompleted = order.orderStatus === 'completed';
                    return (
                      <TableRow key={order.id} className="border-gray-50 group hover:bg-gray-50/50 transition-colors">
                        <TableCell className="font-bold text-[#1A1D1F] pl-8">#{order.id}</TableCell>
                        <TableCell className="text-gray-500 font-medium">
                          {format(new Date(order.createdAt), "MMM d, HH:mm")}
                        </TableCell>
                        <TableCell>
                          <div className="font-bold text-[#1A1D1F]">{order.customerName}</div>
                          <div className="text-xs text-gray-400 font-medium">{order.customerPhone}</div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              "font-bold uppercase tracking-wider text-[10px] px-2.5 py-0.5 rounded-full border-none",
                              order.orderStatus === 'preparing' && "bg-orange-100 text-orange-600",
                              order.orderStatus === 'ready' && "bg-blue-100 text-blue-600",
                              order.orderStatus === 'completed' && "bg-green-100 text-green-600",
                              order.orderStatus === 'cancelled' && "bg-red-100 text-red-600",
                            )}
                          >
                            {order.orderStatus}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-extrabold text-[#1A1D1F]">
                          ₹{(order.totalAmount / 100).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <div className="flex justify-end gap-2">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => { setSelectedOrder(order); setViewMode("view"); }}
                              className="w-9 h-9 rounded-xl hover:bg-white hover:text-primary hover:shadow-sm"
                            >
                              <Eye className="w-4.5 h-4.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              disabled={isCompleted}
                              onClick={() => { setSelectedOrder(order); setViewMode("edit"); }}
                              className={cn(
                                "w-9 h-9 rounded-xl transition-all",
                                isCompleted 
                                  ? "opacity-30 cursor-not-allowed" 
                                  : "hover:bg-white hover:text-primary hover:shadow-sm"
                              )}
                            >
                              <Edit className="w-4.5 h-4.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  
                  {filteredOrders?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-20 text-gray-400">
                        <div className="flex flex-col items-center">
                          <EyeOff className="w-12 h-12 mb-4 opacity-10" />
                          <p className="font-medium">No orders found</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Order Detail / Edit Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => { setSelectedOrder(null); setViewMode(null); }}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-none rounded-[2.5rem] bg-white max-h-[90vh] overflow-y-auto shadow-2xl">
          {selectedOrder && (
            <>
              {viewMode === "view" ? (
                <div className="p-0">
                  <ReceiptPreview order={selectedOrder} />
                  <div className="p-8 bg-gray-50 flex gap-4 no-print border-t border-gray-100">
                    <Button 
                      onClick={handlePrint} 
                      className="flex-1 h-14 rounded-2xl font-bold gap-2 shadow-lg shadow-primary/20"
                    >
                      <Printer className="w-5 h-5" /> Print Invoice
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedOrder(null)}
                      className="flex-1 h-14 rounded-2xl font-bold border-gray-200"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-8">
                  <DialogHeader className="mb-8">
                    <DialogTitle className="text-2xl font-extrabold text-[#1A1D1F]">Modify Order Status</DialogTitle>
                    <p className="text-gray-400 font-medium">Update the current status for order #{selectedOrder.id}</p>
                  </DialogHeader>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-[#1A1D1F]">Order Status</label>
                      <Select 
                        defaultValue={selectedOrder.orderStatus}
                        onValueChange={(val) => updateOrderMutation.mutate({ id: selectedOrder.id, data: { orderStatus: val } })}
                      >
                        <SelectTrigger className="h-14 bg-[#F8F9FB] border-none rounded-2xl shadow-sm focus:ring-primary/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-xl">
                          <SelectItem value="preparing" className="py-3 rounded-xl">Preparing</SelectItem>
                          <SelectItem value="ready" className="py-3 rounded-xl">Ready</SelectItem>
                          <SelectItem value="completed" className="py-3 rounded-xl">Completed</SelectItem>
                          <SelectItem value="cancelled" className="py-3 rounded-xl">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-[#1A1D1F]">Payment Status</label>
                      <Select 
                        defaultValue={selectedOrder.paymentStatus}
                        onValueChange={(val) => updateOrderMutation.mutate({ id: selectedOrder.id, data: { paymentStatus: val } })}
                      >
                        <SelectTrigger className="h-14 bg-[#F8F9FB] border-none rounded-2xl shadow-sm focus:ring-primary/20">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-xl">
                          <SelectItem value="pending" className="py-3 rounded-xl">Pending</SelectItem>
                          <SelectItem value="paid" className="py-3 rounded-xl">Paid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button 
                      className="w-full h-14 rounded-2xl font-bold mt-4"
                      onClick={() => setSelectedOrder(null)}
                    >
                      Done
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Hidden print container */}
      {selectedOrder && viewMode === "view" && (
        <div className="print-only">
          <ReceiptPreview order={selectedOrder} />
        </div>
      )}
    </div>
  );
}
