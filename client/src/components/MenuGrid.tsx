import { useState } from "react";
import { useMenu } from "@/hooks/use-menu";
import { MenuItem } from "@shared/schema";
import { Plus, Search, UtensilsCrossed } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface MenuGridProps {
  onAdd: (item: MenuItem) => void;
}

export function MenuGrid({ onAdd }: MenuGridProps) {
  const { data: menuItems, isLoading } = useMenu();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("All");

  const categories = ["All", ...Array.from(new Set(menuItems?.map(i => i.category) || []))];

  const filteredItems = menuItems?.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === "All" || item.category === category;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-48 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row gap-4 sticky top-0 bg-background/95 backdrop-blur z-10 py-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input 
            placeholder="Search menu..." 
            className="pl-10 bg-card border-border/50 shadow-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`
                px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all
                ${category === cat 
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20' 
                  : 'bg-card border border-border/50 text-muted-foreground hover:bg-muted'
                }
              `}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pb-20">
        {filteredItems?.map((item) => (
          <div 
            key={item.id}
            onClick={() => onAdd(item)}
            className="
              group relative bg-card rounded-2xl p-4 border border-border/50
              hover:border-primary/50 hover:shadow-lg hover:-translate-y-1
              transition-all duration-300 cursor-pointer overflow-hidden
            "
          >
            <div className="aspect-square rounded-xl bg-muted/50 mb-4 overflow-hidden relative">
              {item.image ? (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                  <UtensilsCrossed className="w-12 h-12" />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Plus className="text-white w-8 h-8 drop-shadow-lg" />
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-semibold text-foreground leading-tight">{item.name}</h3>
              </div>
              <p className="text-primary font-bold">
                ${(item.price / 100).toFixed(2)}
              </p>
              <Badge variant="secondary" className="text-xs font-normal opacity-70">
                {item.category}
              </Badge>
            </div>
          </div>
        ))}

        {filteredItems?.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-12 text-muted-foreground">
            <UtensilsCrossed className="w-12 h-12 mb-4 opacity-20" />
            <p>No items found matching your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
