import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { Menu as MenuIcon, Package, AlertTriangle, CheckCircle, Search, Edit2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { InventoryItem } from "@shared/schema";

export default function Inventory() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "low" | "ok">("all");
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [editQty, setEditQty] = useState("");
  const [editMin, setEditMin] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({ name: "", category: "", quantity: "", unit: "pcs", minQuantity: "", usedInItems: "" });
  const { toast } = useToast();

  const { data: items = [], isLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/inventory"],
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      apiRequest("PATCH", `/api/inventory/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      setEditItem(null);
      toast({ title: "Updated", description: "Inventory updated successfully" });
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => apiRequest("POST", "/api/inventory", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/inventory"] });
      setShowAddForm(false);
      setNewItem({ name: "", category: "", quantity: "", unit: "pcs", minQuantity: "", usedInItems: "" });
      toast({ title: "Added", description: "Inventory item added" });
    },
  });

  const isLow = (item: InventoryItem) => item.quantity <= item.minQuantity;

  const categories = ["all", ...Array.from(new Set(items.map(i => i.category)))];

  const filtered = items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.usedInItems || "").toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCategory === "all" || item.category === filterCategory;
    const matchStatus = filterStatus === "all" || (filterStatus === "low" ? isLow(item) : !isLow(item));
    return matchSearch && matchCat && matchStatus;
  });

  const lowCount = items.filter(isLow).length;

  const handleSaveEdit = () => {
    if (!editItem) return;
    updateMutation.mutate({
      id: editItem.id,
      data: { quantity: parseInt(editQty), minQuantity: parseInt(editMin) },
    });
  };

  const handleCreate = () => {
    if (!newItem.name || !newItem.category || !newItem.quantity || !newItem.minQuantity) {
      toast({ title: "Error", description: "Fill all required fields", variant: "destructive" });
      return;
    }
    createMutation.mutate({
      ...newItem,
      quantity: parseInt(newItem.quantity),
      minQuantity: parseInt(newItem.minQuantity),
    });
  };

  return (
    <div className="flex h-screen w-full bg-[#F8F9FB] overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="p-4 md:p-6 flex items-center gap-4 bg-white border-b border-gray-100 shrink-0">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(true)}>
            <MenuIcon className="w-5 h-5" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-black text-[#1A1D1F]">Inventory</h1>
            <p className="text-gray-400 text-xs font-medium">Ingredient & stock management</p>
          </div>
          {lowCount > 0 && (
            <div className="flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1.5 rounded-full text-xs font-bold">
              <AlertTriangle className="w-3.5 h-3.5" />
              {lowCount} Low Stock
            </div>
          )}
          <Button
            size="sm"
            onClick={() => setShowAddForm(true)}
            className="h-9 rounded-xl gap-1.5 font-bold"
            data-testid="button-add-inventory"
          >
            <Plus className="w-4 h-4" /> Add Item
          </Button>
        </header>

        <div className="flex-1 overflow-y-auto p-3 md:p-6 pb-20 md:pb-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search items or menu..."
                className="pl-9 h-10 rounded-xl border-gray-200 text-sm"
                data-testid="input-inventory-search"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all",
                    filterCategory === cat
                      ? "bg-primary text-white"
                      : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-200"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              {(["all", "low", "ok"] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all",
                    filterStatus === s
                      ? s === "low" ? "bg-red-500 text-white" : "bg-green-500 text-white"
                      : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-200"
                  )}
                >
                  {s === "all" ? "All Status" : s === "low" ? "Low Stock" : "In Stock"}
                </button>
              ))}
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-white rounded-2xl p-4 border border-gray-100">
              <p className="text-xs text-gray-400 font-medium mb-1">Total Items</p>
              <p className="text-2xl font-black text-[#1A1D1F]">{items.length}</p>
            </div>
            <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
              <p className="text-xs text-red-400 font-medium mb-1">Low Stock</p>
              <p className="text-2xl font-black text-red-600">{lowCount}</p>
            </div>
            <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
              <p className="text-xs text-green-500 font-medium mb-1">Sufficient</p>
              <p className="text-2xl font-black text-green-600">{items.length - lowCount}</p>
            </div>
          </div>

          {/* Inventory Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-4 animate-pulse h-36" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <Package className="w-12 h-12 mb-3 opacity-20" />
              <p className="font-bold text-sm">No items found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(item => {
                const low = isLow(item);
                const pct = Math.min(100, Math.round((item.quantity / (item.minQuantity * 2)) * 100));
                return (
                  <div
                    key={item.id}
                    data-testid={`card-inventory-${item.id}`}
                    className={cn(
                      "bg-white rounded-2xl p-4 border transition-all hover:shadow-md",
                      low ? "border-red-200 bg-red-50/30" : "border-gray-100"
                    )}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="font-black text-[#1A1D1F] text-sm truncate">{item.name}</h3>
                          {low ? (
                            <Badge className="bg-red-100 text-red-600 border-0 text-[10px] px-2 py-0.5 font-bold shrink-0">
                              Low Stock
                            </Badge>
                          ) : (
                            <Badge className="bg-green-100 text-green-600 border-0 text-[10px] px-2 py-0.5 font-bold shrink-0">
                              OK
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-400 font-medium">{item.category}</p>
                      </div>
                      <button
                        onClick={() => { setEditItem(item); setEditQty(String(item.quantity)); setEditMin(String(item.minQuantity)); }}
                        className="ml-2 p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-primary transition-colors shrink-0"
                        data-testid={`button-edit-inventory-${item.id}`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-baseline gap-1 mb-2">
                      <span className={cn("text-2xl font-black", low ? "text-red-600" : "text-[#1A1D1F]")}>
                        {item.quantity}
                      </span>
                      <span className="text-xs text-gray-400 font-medium">{item.unit}</span>
                      <span className="text-xs text-gray-300 ml-1">/ min {item.minQuantity}</span>
                    </div>

                    <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                      <div
                        className={cn("h-1.5 rounded-full transition-all", low ? "bg-red-400" : "bg-green-400")}
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    {item.usedInItems && (
                      <p className="text-[10px] text-gray-400 leading-relaxed line-clamp-2">
                        Used in: {item.usedInItems}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setEditItem(null)} />
          <div className="relative bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl z-10">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-lg text-[#1A1D1F]">{editItem.name}</h3>
              <button onClick={() => setEditItem(null)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Current Quantity ({editItem.unit})
                </label>
                <Input
                  type="number"
                  value={editQty}
                  onChange={e => setEditQty(e.target.value)}
                  className="rounded-xl border-gray-200"
                  data-testid="input-edit-quantity"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">
                  Minimum Quantity (Reorder Level)
                </label>
                <Input
                  type="number"
                  value={editMin}
                  onChange={e => setEditMin(e.target.value)}
                  className="rounded-xl border-gray-200"
                  data-testid="input-edit-min"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setEditItem(null)}
                className="flex-1 h-11 rounded-xl border-gray-200"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={updateMutation.isPending}
                className="flex-1 h-11 rounded-xl"
                data-testid="button-save-inventory"
              >
                {updateMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Item Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setShowAddForm(false)} />
          <div className="relative bg-white rounded-[2rem] p-6 w-full max-w-sm shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-black text-lg text-[#1A1D1F]">Add Inventory Item</h3>
              <button onClick={() => setShowAddForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              {[
                { label: "Name *", key: "name", placeholder: "e.g. Mozzarella Cheese" },
                { label: "Category *", key: "category", placeholder: "e.g. Pizzas" },
                { label: "Unit *", key: "unit", placeholder: "kg, pcs, liters..." },
                { label: "Used In Menu Items", key: "usedInItems", placeholder: "e.g. Margherita Pizza, Burger" },
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">{f.label}</label>
                  <Input
                    value={(newItem as any)[f.key]}
                    onChange={e => setNewItem(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="rounded-xl border-gray-200"
                  />
                </div>
              ))}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Qty *</label>
                  <Input type="number" value={newItem.quantity} onChange={e => setNewItem(p => ({ ...p, quantity: e.target.value }))} className="rounded-xl border-gray-200" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5 block">Min Qty *</label>
                  <Input type="number" value={newItem.minQuantity} onChange={e => setNewItem(p => ({ ...p, minQuantity: e.target.value }))} className="rounded-xl border-gray-200" />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowAddForm(false)} className="flex-1 h-11 rounded-xl border-gray-200">Cancel</Button>
              <Button onClick={handleCreate} disabled={createMutation.isPending} className="flex-1 h-11 rounded-xl">
                {createMutation.isPending ? "Adding..." : "Add Item"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
