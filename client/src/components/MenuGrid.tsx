import { useState } from "react";
import { useMenu } from "@/hooks/use-menu";
import { MenuItemWithVariations } from "@shared/schema";
import { Plus, Search, ChevronDown, Utensils, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface MenuGridProps {
  onAdd: (item: MenuItemWithVariations, variation?: { name: string; price: number }) => void;
}

export function MenuGrid({ onAdd }: MenuGridProps) {
  const { data: menuItems, isLoading } = useMenu();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [selectedItemForVariation, setSelectedItemForVariation] = useState<MenuItemWithVariations | null>(null);
  const categories = ["All", ...Array.from(new Set(menuItems?.map(i => i.category?.name).filter(Boolean) || []))] as string[];
  console.log(menuItems);
  const filteredItems = menuItems?.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "All" || item.category?.name === category;
    return matchesSearch && matchesCategory;
  });

  const getCategoryCount = (cat: string) => {
    if (cat === "All") return menuItems?.length || 0;
    return menuItems?.filter(i => i.category?.name === cat).length || 0;
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <Skeleton key={i} className="h-64 rounded-3xl" />
        ))}
      </div>
    );
  }

  const handleAddClick = (item: MenuItemWithVariations) => {
    // Check if there are any variation options in any group
    const hasVariations = (item.menuItemVariations?.length || 0) > 0;

    if (hasVariations) {
      setSelectedItemForVariation(item);
    } else {
      onAdd(item);
    };
  }

  return (
    <div className="flex flex-col h-full space-y-6">
      <div className="flex flex-col space-y-4 flex-shrink-0">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div className="hidden md:block">
            <h1 className="text-xl font-extrabold text-[#1A1D1F]">Welcome, Guest</h1>
            <p className="text-gray-400 text-xs font-medium">Discover whatever you need easily</p>
          </div>
          <div className="relative w-full lg:w-[450px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-6 h-6" />
            <Input
              placeholder="Search product..."
              className="pl-14 h-16 bg-white border border-gray-100 rounded-2xl shadow-sm focus-visible:ring-primary/20 text-lg font-medium"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`category-pill text-xs md:text-sm ${category === cat ? 'category-pill-active shadow-lg shadow-primary/20' : 'category-pill-inactive'}`}
            >
              {cat} <span className="opacity-60 ml-1">({getCategoryCount(cat)})</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 pr-2 no-scrollbar pb-20">
          {filteredItems?.map((item) => (
            <div
              key={item.id}
              onClick={() => handleAddClick(item)}
              className="item-card group active:scale-95 touch-manipulation"
            >
              <div className="aspect-square rounded-2xl bg-[#F0F2F5] mb-4 overflow-hidden relative">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <Utensils className="w-12 h-12" />
                  </div>
                )}
                {(item.menuItemVariations?.length || 0) > 0 && (
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[10px] font-black text-primary flex items-center gap-1 shadow-sm">
                    Variations <ChevronDown className="w-3 h-3" />
                  </div>
                )}
                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Plus className="w-10 h-10 text-white drop-shadow-md" />
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-[#1A1D1F] text-base md:text-lg leading-tight group-hover:text-primary transition-colors line-clamp-2 min-h-[2.5rem]">{item.name}</h3>
                <div className="flex justify-between items-center">
                  <p className="text-primary font-black text-lg md:text-xl">
                    ₹{(item.price).toFixed(2)}
                  </p>
                  <div className="w-8 h-8 rounded-xl bg-[#F0F2F5] flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                    <Plus className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredItems?.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-gray-400">
              <Info className="w-16 h-16 mb-4 opacity-10" />
              <p className="text-lg font-medium">No items found</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!selectedItemForVariation} onOpenChange={(open) => !open && setSelectedItemForVariation(null)}>
        <DialogContent className="sm:max-w-[400px] rounded-[2rem] p-8 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-[#1A1D1F] text-center">Select Variation</DialogTitle>
            <p className="text-center text-gray-400 font-medium">Choose your preferred size</p>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {selectedItemForVariation?.menuItemVariations?.map((vg, i) => ({
              id: vg.specificOption.id,
              name: `${vg.specificOption.parentGroup.name}: ${vg.specificOption.name}`,
              price: vg.price
            })).map((v, i) => (
              <Button
                key={v.id || i}
                variant="outline"
                className="w-full h-20 rounded-2xl flex justify-between px-8 border-gray-100 hover:border-primary hover:text-primary transition-all font-black text-lg shadow-sm"
                onClick={() => {
                  onAdd(selectedItemForVariation, v);
                  setSelectedItemForVariation(null);
                }}
              >
                <span>{v.name}</span>
                <span className="text-primary">₹{(v.price / 100).toFixed(2)}</span>
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
