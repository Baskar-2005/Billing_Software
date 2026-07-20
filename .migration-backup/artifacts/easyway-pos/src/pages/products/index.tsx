import { AppLayout } from "@/components/layout/AppLayout";
import { TopBar } from "@/components/layout/TopBar";
import { 
  useListProducts,
  useListCategories,
  useToggleFavorite,
  useDeleteProduct,
  getListProductsQueryKey
} from "@workspace/api-client-react";
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Search, Plus, Star, Edit, Trash2, PackageSearch, Loader2, MoreVertical } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

export default function Products() {
  const [search, setSearch] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: categories } = useListCategories();
  const { data: products, isLoading } = useListProducts(
    { search: search || undefined, categoryId: activeCategoryId || undefined }
  );

  const toggleFavorite = useToggleFavorite();
  const deleteProduct = useDeleteProduct();

  const handleToggleFavorite = (id: number) => {
    toggleFavorite.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteProduct.mutate({ id }, {
        onSuccess: () => {
          toast.success("Product deleted");
          queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        }
      });
    }
  };

  return (
    <AppLayout>
      <TopBar title="Products" />
      
      <div className="p-4 flex flex-col gap-4">
        <div className="sticky top-[64px] z-30 bg-background/95 backdrop-blur-sm pb-2 -mx-4 px-4 pt-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search products..." 
              className="pl-9 bg-card border-border rounded-xl"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto no-scrollbar mt-3 pb-1">
            <button
              className={cn(
                "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                activeCategoryId === null 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-card text-foreground border border-border hover:bg-muted"
              )}
              onClick={() => setActiveCategoryId(null)}
            >
              All
            </button>
            {categories?.map(cat => (
              <button
                key={cat.id}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors",
                  activeCategoryId === cat.id 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-card text-foreground border border-border hover:bg-muted"
                )}
                onClick={() => setActiveCategoryId(cat.id)}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !products || products.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-card rounded-3xl border border-border mt-4">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <PackageSearch className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-1">No products found</h3>
            <p className="text-muted-foreground text-sm mb-6">
              {search ? "Try adjusting your search or filters." : "Get started by adding your first product."}
            </p>
            {!search && (
              <Button onClick={() => setLocation("/products/add")} className="rounded-xl px-6">
                Add Product
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-24">
            {products.map(product => (
              <div 
                key={product.id}
                className="bg-card rounded-2xl p-3 border border-border shadow-sm flex items-center gap-4"
              >
                <div className="w-16 h-16 rounded-xl bg-muted flex-shrink-0 overflow-hidden">
                  {product.image ? (
                    <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-primary font-bold bg-primary/10">
                      {product.name.substring(0,2).toUpperCase()}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground text-sm truncate">{product.name}</h4>
                  <p className="text-primary font-bold">₹{product.price.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground truncate">{product.categoryName || 'Uncategorized'}</p>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="rounded-full w-8 h-8"
                    onClick={() => handleToggleFavorite(product.id)}
                  >
                    <Star className={cn("w-4 h-4", product.isFavorite ? "fill-amber-500 text-amber-500" : "text-muted-foreground")} />
                  </Button>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full w-8 h-8">
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 rounded-xl">
                      <DropdownMenuItem onClick={() => setLocation(`/products/edit/${product.id}`)}>
                        <Edit className="w-4 h-4 mr-2" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDelete(product.id)} className="text-destructive focus:bg-destructive/10">
                        <Trash2 className="w-4 h-4 mr-2" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Link href="/products/add">
        <Button className="fixed bottom-20 right-4 w-14 h-14 rounded-full shadow-lg bg-primary hover:bg-primary/90">
          <Plus className="w-6 h-6" />
        </Button>
      </Link>
    </AppLayout>
  );
}
