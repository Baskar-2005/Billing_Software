import { AppLayout } from "@/components/layout/AppLayout";
import { TopBar } from "@/components/layout/TopBar";
import { 
  useGetProduct, 
  useUpdateProduct, 
  useListCategories, 
  getListProductsQueryKey,
  getGetProductQueryKey
} from "@workspace/api-client-react";
import { useLocation, useParams } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/ui/image-upload";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.coerce.number().min(0, "Price must be positive"),
  categoryId: z.coerce.number().nullable().optional(),
  image: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  stock: z.coerce.number().min(0).optional(),
  barcode: z.string().optional().or(z.literal("")),
});

export default function EditProduct() {
  const params = useParams<{ id: string }>();
  const id = Number(params.id);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const { data: categories } = useListCategories();
  const { data: product, isLoading } = useGetProduct(id, {
    query: {
      enabled: !!id,
      queryKey: getGetProductQueryKey(id)
    }
  });
  
  const updateProduct = useUpdateProduct();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      price: 0,
      categoryId: null,
      image: "",
      stock: 0,
      barcode: "",
    },
  });

  useEffect(() => {
    if (product) {
      form.reset({
        name: product.name,
        price: product.price,
        categoryId: product.categoryId,
        image: product.image || "",
        stock: product.stock || 0,
        barcode: product.barcode || "",
      });
    }
  }, [product, form]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    updateProduct.mutate({
      id,
      data: {
        name: values.name,
        price: values.price,
        categoryId: values.categoryId || undefined,
        image: values.image || undefined,
        stock: values.stock || undefined,
        barcode: values.barcode || undefined,
      }
    }, {
      onSuccess: () => {
        toast.success("Product updated successfully");
        queryClient.invalidateQueries({ queryKey: getListProductsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetProductQueryKey(id) });
        setLocation("/products");
      },
      onError: (err) => {
        toast.error("Failed to update product: " + ((err as any)?.error || "Unknown error"));
      }
    });
  }

  if (isLoading) {
    return (
      <AppLayout hideNav>
        <TopBar title="Edit Product" showBack onBack={() => setLocation("/products")} />
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout hideNav>
      <TopBar title="Edit Product" showBack onBack={() => setLocation("/products")} />
      
      <div className="p-4 max-w-md mx-auto w-full">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 bg-card p-5 rounded-2xl border border-border shadow-sm">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Masala Chai" className="bg-background rounded-xl" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price (₹)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" className="bg-background rounded-xl" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <select 
                      className="flex h-10 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={field.value || ""}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">No Category</option>
                      {categories?.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Image (Optional)</FormLabel>
                  <FormControl>
                    <ImageUpload
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      disabled={updateProduct.isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock (Optional)</FormLabel>
                    <FormControl>
                      <Input type="number" className="bg-background rounded-xl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barcode (Optional)</FormLabel>
                    <FormControl>
                      <Input className="bg-background rounded-xl" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" className="w-full h-12 rounded-xl text-lg font-semibold mt-4" disabled={updateProduct.isPending}>
              {updateProduct.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Save Changes"}
            </Button>
          </form>
        </Form>
      </div>
    </AppLayout>
  );
}
