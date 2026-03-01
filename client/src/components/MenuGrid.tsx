import { useState } from "react";
import { useMenu } from "@/hooks/use-menu";
import { MenuItem } from "@shared/schema";
import { Plus, Search, ChevronDown, Utensils } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface MenuGridProps {
  onAdd: (item: MenuItem, variation?: { name: string; price: number }) => void;
}

export function MenuGrid({ onAdd }: MenuGridProps) {
  const { data: menuItems, isLoading } = useMenu();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [selectedItemForVariation, setSelectedItemForVariation] = useState<MenuItem | null>(null);

  const categories = ["All", ...Array.from(new Set(menuItems?.map(i => i.category) || []))];

  const filteredItems = menuItems?.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "All" || item.category === category;
    return matchesSearch && matchesCategory;
  });

  const getCategoryCount = (cat: string) => {
    if (cat === "All") return menuItems?.length || 0;
    return menuItems?.filter(i => i.category === cat).length || 0;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Skeleton key={i} className="h-64 rounded-3xl" />
        ))}
      </div>
    );
  }

  const handleAddClick = (item: MenuItem) => {
    if (item.variations && item.variations.length > 0) {
      setSelectedItemForVariation(item);
    } else {
      onAdd(item);
    }
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div>
            <h1 className="text-lg font-extrabold text-[#1A1D1F]">Welcome, Guest</h1>
            <p className="text-gray-400 text-xs font-medium">Discover whatever you need easily</p>
          </div>
          <div className="relative w-full lg:w-[450px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
            <Input 
              placeholder="Search product..." 
              className="pl-14 h-16 bg-white border border-gray-100 rounded-2xl shadow-sm focus-visible:ring-primary/20 text-xl font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`category-pill ${category === cat ? 'category-pill-active shadow-lg shadow-primary/20' : 'category-pill-inactive'}`}
            >
              {cat} ({getCategoryCount(cat)})
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto pb-24 pr-2 -mr-2 no-scrollbar">
        {filteredItems?.map((item) => (
          <div 
            key={item.id}
            onClick={() => handleAddClick(item)}
            className="item-card group"
          >
            <div className="aspect-square rounded-2xl bg-[#F0F2F5] mb-4 overflow-hidden relative">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <Utensils className="w-16 h-16" />
                </div>
              )}
              {item.variations && item.variations.length > 0 && (
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-bold text-primary flex items-center gap-1">
                  Variations <ChevronDown className="w-3 h-3" />
                </div>
              )}
              <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            
            <div className="space-y-2">
              <h3 className="font-bold text-[#1A1D1F] text-lg leading-tight group-hover:text-primary transition-colors">{item.name}</h3>
              <div className="flex justify-between items-center">
                <p className="text-primary font-extrabold text-xl">
                  ${(item.price / 100).toFixed(2)}
                </p>
                <div className="w-8 h-8 rounded-xl bg-[#F0F2F5] flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                  <Plus className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredItems?.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
            <Utensils className="w-16 h-16 mb-4 opacity-10" />
            <p className="text-lg font-medium">No items found</p>
          </div>
        )}
      </div>

      {/* Variation Selection Dialog */}
      <Dialog open={!!selectedItemForVariation} onOpenChange={(open) => !open && setSelectedItemForVariation(null)}>
        <DialogContent className="sm:max-w-[400px] rounded-[2rem] p-8">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-[#1A1D1F]">Select Variation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {selectedItemForVariation?.variations?.map((v, i) => (
              <Button
                key={i}
                variant="outline"
                className="w-full h-16 rounded-2xl flex justify-between px-6 border-gray-100 hover:border-primary hover:text-primary transition-all font-bold"
                onClick={() => {
                  onAdd(selectedItemForVariation, v);
                  setSelectedItemForVariation(null);
                }}
              >
                <span>{v.name}</span>
                <span>${(v.price / 100).toFixed(2)}</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
