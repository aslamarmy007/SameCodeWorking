import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil, Trash2, Plus, Download, Eye, LayoutDashboard, Search, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Customer, Product, Invoice } from "@shared/schema";
import { insertCustomerSchema, insertProductSchema } from "@shared/schema";
import { generateInvoicePDF } from "@/lib/pdf-generator";
import { format } from "date-fns";

const customerFormSchema = insertCustomerSchema;
const productFormSchema = insertProductSchema;

export default function Dashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("customers");
  const [customerDialogOpen, setCustomerDialogOpen] = useState(false);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteCustomerId, setDeleteCustomerId] = useState<string | null>(null);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [deleteInvoiceId, setDeleteInvoiceId] = useState<string | null>(null);
  const [billDateRange, setBillDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [customerNameSearch, setCustomerNameSearch] = useState("");
  const [customerPhoneSearch, setCustomerPhoneSearch] = useState("");
  const [customerCityFilter, setCustomerCityFilter] = useState("");
  const [customerSortOption, setCustomerSortOption] = useState("a-z");

  // Fetch customers
  const { data: customers = [], isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  // Fetch invoices (filtered or all)
  const { data: invoices = [], isLoading: invoicesLoading } = useQuery<Invoice[]>({
    queryKey: billDateRange.startDate && billDateRange.endDate 
      ? ["/api/invoices/filter/date-range", billDateRange.startDate, billDateRange.endDate]
      : ["/api/invoices"],
    queryFn: async () => {
      if (billDateRange.startDate && billDateRange.endDate) {
        const response = await fetch(
          `/api/invoices/filter/date-range?startDate=${billDateRange.startDate}&endDate=${billDateRange.endDate}`
        );
        if (!response.ok) throw new Error("Failed to fetch invoices");
        return response.json();
      }
      const response = await fetch("/api/invoices");
      if (!response.ok) throw new Error("Failed to fetch invoices");
      return response.json();
    },
  });

  // Customer form
  const customerForm = useForm<z.infer<typeof customerFormSchema>>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      name: "",
      shopName: "",
      phone: "",
      email: "",
      gstin: "",
      address: "",
      city: "",
      state: "",
      postalCode: "",
    },
  });

  // Product form
  const productForm = useForm<z.infer<typeof productFormSchema>>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      hsn: "",
      defaultPrice: "",
      unit: "",
      gstRate: "0",
    },
  });

  // Customer mutations
  const createCustomerMutation = useMutation({
    mutationFn: (data: z.infer<typeof customerFormSchema>) =>
      apiRequest("POST", "/api/customers", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({ title: "Customer created successfully" });
      setCustomerDialogOpen(false);
      customerForm.reset();
    },
    onError: (error: any) => {
      const errorData = error.body;
      if (errorData?.error === "Customer already exists") {
        toast({
          title: "Customer Already Exists",
          description: errorData.message || "A customer with this shop name already exists",
          variant: "destructive",
        });
      } else if (errorData?.error === "Validation error") {
        toast({
          title: "Validation Error",
          description: errorData.message || "Please check all fields and try again",
          variant: "destructive",
        });
      } else {
        toast({ title: "Failed to create customer", variant: "destructive" });
      }
    },
  });

  const updateCustomerMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: z.infer<typeof customerFormSchema> }) =>
      apiRequest("PUT", `/api/customers/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({ title: "Customer updated successfully" });
      setCustomerDialogOpen(false);
      setEditingCustomer(null);
      customerForm.reset();
    },
    onError: (error: any) => {
      const errorData = error.body;
      if (error.status === 404) {
        setCustomerDialogOpen(false);
        setEditingCustomer(null);
        customerForm.reset();
        queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
        toast({
          title: "Customer not found",
          description: "This customer may have been deleted",
          variant: "destructive",
        });
      } else if (errorData?.error === "Validation error") {
        toast({
          title: "Validation Error",
          description: errorData.message || "Please check all fields and try again",
          variant: "destructive",
        });
      } else {
        toast({ title: "Failed to update customer", variant: "destructive" });
      }
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/customers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      toast({ title: "Customer deleted successfully" });
      setDeleteCustomerId(null);
    },
    onError: (error: any) => {
      setDeleteCustomerId(null);
      if (error.status === 404) {
        queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
        toast({ 
          title: "Customer not found", 
          description: "This customer may have already been deleted",
          variant: "destructive" 
        });
      } else {
        toast({ title: "Failed to delete customer", variant: "destructive" });
      }
    },
  });

  // Product mutations
  const createProductMutation = useMutation({
    mutationFn: (data: z.infer<typeof productFormSchema>) =>
      apiRequest("POST", "/api/products", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product created successfully" });
      setProductDialogOpen(false);
      productForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to create product", variant: "destructive" });
    },
  });

  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: z.infer<typeof productFormSchema> }) =>
      apiRequest("PUT", `/api/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product updated successfully" });
      setProductDialogOpen(false);
      setEditingProduct(null);
      productForm.reset();
    },
    onError: () => {
      toast({ title: "Failed to update product", variant: "destructive" });
    },
  });

  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({ title: "Product deleted successfully" });
      setDeleteProductId(null);
    },
    onError: (error: any) => {
      setDeleteProductId(null);
      if (error.status === 404) {
        queryClient.invalidateQueries({ queryKey: ["/api/products"] });
        toast({ 
          title: "Product not found", 
          description: "This product may have already been deleted",
          variant: "destructive" 
        });
      } else {
        toast({ title: "Failed to delete product", variant: "destructive" });
      }
    },
  });

  // Invoice mutations
  const deleteInvoiceMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/invoices/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      if (billDateRange.startDate && billDateRange.endDate) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/invoices/filter/date-range", billDateRange.startDate, billDateRange.endDate] 
        });
      }
      toast({ title: "Bill deleted successfully" });
      setDeleteInvoiceId(null);
    },
    onError: (error: any) => {
      setDeleteInvoiceId(null);
      if (error.status === 404) {
        queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
        if (billDateRange.startDate && billDateRange.endDate) {
          queryClient.invalidateQueries({ 
            queryKey: ["/api/invoices/filter/date-range", billDateRange.startDate, billDateRange.endDate] 
          });
        }
        toast({ 
          title: "Bill not found", 
          description: "This bill may have already been deleted",
          variant: "destructive" 
        });
      } else {
        toast({ title: "Failed to delete bill", variant: "destructive" });
      }
    },
  });

  const handleCustomerSubmit = (data: z.infer<typeof customerFormSchema>) => {
    const nameRegex = /^[a-zA-Z\s]+$/;
    const shopNameRegex = /^[a-zA-Z0-9\s]+$/;
    const phoneRegex = /^\d{10}$/;
    const gstinRegex = /^[a-zA-Z0-9]+$/;
    
    // Validate shop name (required)
    if (!data.shopName?.trim()) {
      toast({
        title: "Validation Error",
        description: "Shop name is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!shopNameRegex.test(data.shopName.trim())) {
      toast({
        title: "Validation Error",
        description: "Shop name can only contain letters and numbers",
        variant: "destructive",
      });
      return;
    }
    
    // Validate customer name (optional)
    if (data.name?.trim() && !nameRegex.test(data.name.trim())) {
      toast({
        title: "Validation Error",
        description: "Customer name must contain only letters",
        variant: "destructive",
      });
      return;
    }
    
    // Validate phone
    if (data.phone?.trim() && !phoneRegex.test(data.phone.trim())) {
      toast({
        title: "Validation Error",
        description: "Phone number must be exactly 10 digits",
        variant: "destructive",
      });
      return;
    }
    
    // Validate GSTIN
    if (data.gstin?.trim()) {
      if (!gstinRegex.test(data.gstin.trim())) {
        toast({
          title: "Validation Error",
          description: "GSTIN can only contain letters and numbers",
          variant: "destructive",
        });
        return;
      }
      if (data.gstin.trim().length > 15) {
        toast({
          title: "Validation Error",
          description: "GSTIN must be maximum 15 characters",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Validate city (required)
    if (!data.city?.trim()) {
      toast({
        title: "Validation Error",
        description: "City is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!nameRegex.test(data.city.trim())) {
      toast({
        title: "Validation Error",
        description: "City must contain only letters",
        variant: "destructive",
      });
      return;
    }
    
    // Validate state (required)
    if (!data.state?.trim()) {
      toast({
        title: "Validation Error",
        description: "State is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!nameRegex.test(data.state.trim())) {
      toast({
        title: "Validation Error",
        description: "State must contain only letters",
        variant: "destructive",
      });
      return;
    }
    
    // All validations passed, submit the form
    if (editingCustomer) {
      updateCustomerMutation.mutate({ id: editingCustomer.id, data });
    } else {
      createCustomerMutation.mutate(data);
    }
  };

  const handleProductSubmit = (data: z.infer<typeof productFormSchema>) => {
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data });
    } else {
      createProductMutation.mutate(data);
    }
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    customerForm.reset({
      name: customer.name || "",
      shopName: customer.shopName || "",
      phone: customer.phone || "",
      email: customer.email || "",
      gstin: customer.gstin || "",
      address: customer.address || "",
      city: customer.city || "",
      state: customer.state || "",
      postalCode: customer.postalCode || "",
    });
    setCustomerDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    productForm.reset({
      name: product.name,
      description: product.description || "",
      hsn: product.hsn,
      defaultPrice: product.defaultPrice,
      unit: product.unit,
      gstRate: product.gstRate,
    });
    setProductDialogOpen(true);
  };

  const handleDownloadInvoice = async (invoice: Invoice) => {
    try {
      const response = await fetch(`/api/invoices/${invoice.id}/items`);
      const items = await response.json();

      const invoiceData = {
        invoiceNumber: invoice.invoiceNumber,
        billDate: invoice.billDate,
        customer: {
          name: invoice.customerName,
          shopName: invoice.shopName || "",
          phone: invoice.phone || "",
          email: invoice.email || "",
          gstin: invoice.gstin || "",
          address: invoice.address || "",
          city: invoice.city || "",
          state: invoice.state || "",
          postalCode: invoice.postalCode || "",
        },
        shipping: {
          name: invoice.shippingName || "",
          shopName: invoice.shippingShopName || "",
          phone: invoice.shippingPhone || "",
          email: invoice.shippingEmail || "",
          gstin: invoice.shippingGstin || "",
          address: invoice.shippingAddress || "",
          city: invoice.shippingCity || "",
          state: invoice.shippingState || "",
          postalCode: invoice.shippingPostalCode || "",
        },
        items: items.map((item: any) => ({
          productName: item.productName,
          hsn: item.hsn,
          quantity: parseFloat(item.quantity),
          price: parseFloat(item.price),
          total: parseFloat(item.total),
          gstRate: parseFloat(item.gstRate),
          gstAmount: parseFloat(item.gstAmount),
        })),
        subtotal: parseFloat(invoice.subtotal),
        transport: parseFloat(invoice.transport || "0"),
        packaging: parseFloat(invoice.packaging || "0"),
        other: parseFloat(invoice.otherCharges || "0"),
        gstAmount: parseFloat(invoice.gstAmount || "0"),
        grandTotal: parseFloat(invoice.grandTotal),
        lorryNumber: invoice.lorryNumber || "",
        eSignatureEnabled: false,
      };

      generateInvoicePDF(invoiceData);
      toast({ title: "Invoice downloaded successfully" });
    } catch (error) {
      toast({ title: "Failed to download invoice", variant: "destructive" });
    }
  };

  const handleDateFilterChange = (field: "startDate" | "endDate", value: string) => {
    setBillDateRange(prev => ({ ...prev, [field]: value }));
  };

  const handleClearFilter = () => {
    setBillDateRange({ startDate: "", endDate: "" });
  };

  // Filter and sort customers
  const getFilteredAndSortedCustomers = () => {
    let filtered = [...customers];

    // Filter by name (shop name or contact name)
    if (customerNameSearch.trim()) {
      const searchLower = customerNameSearch.toLowerCase();
      filtered = filtered.filter(customer => 
        (customer.shopName?.toLowerCase() || "").includes(searchLower) ||
        (customer.name?.toLowerCase() || "").includes(searchLower)
      );
    }

    // Filter by phone
    if (customerPhoneSearch.trim()) {
      filtered = filtered.filter(customer => 
        (customer.phone || "").includes(customerPhoneSearch)
      );
    }

    // Filter by city
    if (customerCityFilter) {
      filtered = filtered.filter(customer => 
        customer.city === customerCityFilter
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (customerSortOption) {
        case "a-z":
          return (a.shopName || "").localeCompare(b.shopName || "");
        case "z-a":
          return (b.shopName || "").localeCompare(a.shopName || "");
        case "new-old":
          return (b.id || "").localeCompare(a.id || "");
        case "old-new":
          return (a.id || "").localeCompare(b.id || "");
        default:
          return 0;
      }
    });

    return filtered;
  };

  // Get unique cities for filter dropdown
  const uniqueCities = Array.from(new Set(customers.map(c => c.city).filter(Boolean))).sort();

  const filteredCustomers = getFilteredAndSortedCustomers();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <LayoutDashboard className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Management Dashboard</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-300">Manage customers, products, and bills</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6" data-testid="tabs-list">
            <TabsTrigger value="customers" data-testid="tab-customers">Customers</TabsTrigger>
            <TabsTrigger value="products" data-testid="tab-products">Products</TabsTrigger>
            <TabsTrigger value="bills" data-testid="tab-bills">Bills</TabsTrigger>
          </TabsList>

          {/* Customers Tab */}
          <TabsContent value="customers" data-testid="content-customers">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Customer Management</CardTitle>
                    <CardDescription>Add, edit, and delete customer information</CardDescription>
                  </div>
                  <Dialog open={customerDialogOpen} onOpenChange={setCustomerDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => { setEditingCustomer(null); customerForm.reset(); }} data-testid="button-add-customer">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Customer
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{editingCustomer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
                        <DialogDescription>
                          {editingCustomer ? "Update customer information" : "Enter customer details"}
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...customerForm}>
                        <form onSubmit={customerForm.handleSubmit(handleCustomerSubmit)} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={customerForm.control}
                              name="shopName"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Shop Name *</FormLabel>
                                  <FormControl>
                                    <Input {...field} data-testid="input-customer-shopname" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={customerForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Contact Name</FormLabel>
                                  <FormControl>
                                    <Input {...field} data-testid="input-customer-name" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={customerForm.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Phone</FormLabel>
                                  <FormControl>
                                    <Input {...field} data-testid="input-customer-phone" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={customerForm.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Email</FormLabel>
                                  <FormControl>
                                    <Input {...field} data-testid="input-customer-email" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={customerForm.control}
                              name="gstin"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>GSTIN</FormLabel>
                                  <FormControl>
                                    <Input {...field} data-testid="input-customer-gstin" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={customerForm.control}
                              name="city"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>City *</FormLabel>
                                  <FormControl>
                                    <Input {...field} data-testid="input-customer-city" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={customerForm.control}
                              name="state"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>State *</FormLabel>
                                  <FormControl>
                                    <Input {...field} data-testid="input-customer-state" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={customerForm.control}
                              name="postalCode"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Postal Code</FormLabel>
                                  <FormControl>
                                    <Input {...field} data-testid="input-customer-postalcode" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={customerForm.control}
                            name="address"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Address</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-customer-address" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <DialogFooter>
                            <Button type="submit" data-testid="button-save-customer">
                              {editingCustomer ? "Update" : "Create"} Customer
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {customersLoading ? (
                  <div data-testid="loading-customers">Loading customers...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Shop Name</TableHead>
                          <TableHead>Contact Name</TableHead>
                          <TableHead>Phone</TableHead>
                          <TableHead>City</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {customers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-gray-500" data-testid="text-no-customers">
                              No customers found. Add your first customer to get started.
                            </TableCell>
                          </TableRow>
                        ) : (
                          customers.map((customer) => (
                            <TableRow key={customer.id} data-testid={`row-customer-${customer.id}`}>
                              <TableCell className="font-medium">{customer.shopName}</TableCell>
                              <TableCell>{customer.name}</TableCell>
                              <TableCell>{customer.phone}</TableCell>
                              <TableCell>{customer.city}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditCustomer(customer)}
                                  data-testid={`button-edit-customer-${customer.id}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteCustomerId(customer.id)}
                                  data-testid={`button-delete-customer-${customer.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" data-testid="content-products">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Product Management</CardTitle>
                    <CardDescription>Add, edit, and delete product catalog</CardDescription>
                  </div>
                  <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}>
                    <DialogTrigger asChild>
                      <Button onClick={() => { setEditingProduct(null); productForm.reset(); }} data-testid="button-add-product">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Product
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
                        <DialogDescription>
                          {editingProduct ? "Update product information" : "Enter product details"}
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...productForm}>
                        <form onSubmit={productForm.handleSubmit(handleProductSubmit)} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <FormField
                              control={productForm.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Product Name *</FormLabel>
                                  <FormControl>
                                    <Input {...field} data-testid="input-product-name" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={productForm.control}
                              name="hsn"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>HSN Code *</FormLabel>
                                  <FormControl>
                                    <Input {...field} data-testid="input-product-hsn" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={productForm.control}
                              name="defaultPrice"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Price *</FormLabel>
                                  <FormControl>
                                    <Input type="number" step="0.01" {...field} data-testid="input-product-price" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={productForm.control}
                              name="unit"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Unit *</FormLabel>
                                  <FormControl>
                                    <Input {...field} placeholder="e.g., Kg, Piece, Block" data-testid="input-product-unit" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={productForm.control}
                              name="gstRate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>GST Rate (%) *</FormLabel>
                                  <FormControl>
                                    <Input type="number" step="0.01" {...field} data-testid="input-product-gstrate" />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <FormField
                            control={productForm.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl>
                                  <Input {...field} value={field.value || ""} data-testid="input-product-description" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <DialogFooter>
                            <Button type="submit" data-testid="button-save-product">
                              {editingProduct ? "Update" : "Create"} Product
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {productsLoading ? (
                  <div data-testid="loading-products">Loading products...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product Name</TableHead>
                          <TableHead>HSN</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Unit</TableHead>
                          <TableHead>GST Rate</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center text-gray-500" data-testid="text-no-products">
                              No products found. Add your first product to get started.
                            </TableCell>
                          </TableRow>
                        ) : (
                          products.map((product) => (
                            <TableRow key={product.id} data-testid={`row-product-${product.id}`}>
                              <TableCell className="font-medium">{product.name}</TableCell>
                              <TableCell>{product.hsn}</TableCell>
                              <TableCell>₹{parseFloat(product.defaultPrice).toFixed(2)}</TableCell>
                              <TableCell>{product.unit}</TableCell>
                              <TableCell>{parseFloat(product.gstRate).toFixed(2)}%</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditProduct(product)}
                                  data-testid={`button-edit-product-${product.id}`}
                                >
                                  <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteProductId(product.id)}
                                  data-testid={`button-delete-product-${product.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bills Tab */}
          <TabsContent value="bills" data-testid="content-bills">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Bill Management</CardTitle>
                  <CardDescription>View, filter, and manage all generated bills</CardDescription>
                </div>
                <div className="flex gap-4 mt-4">
                  <div className="flex-1">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={billDateRange.startDate}
                      onChange={(e) => handleDateFilterChange("startDate", e.target.value)}
                      data-testid="input-filter-startdate"
                    />
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={billDateRange.endDate}
                      onChange={(e) => handleDateFilterChange("endDate", e.target.value)}
                      data-testid="input-filter-enddate"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      variant="outline"
                      onClick={handleClearFilter}
                      data-testid="button-clear-filter"
                    >
                      Clear Filter
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {invoicesLoading ? (
                  <div data-testid="loading-bills">Loading bills...</div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice No</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Total Amount</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {invoices.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-gray-500" data-testid="text-no-bills">
                              No bills found. {billDateRange.startDate && billDateRange.endDate ? "Try adjusting the date range." : "Create your first bill from the billing page."}
                            </TableCell>
                          </TableRow>
                        ) : (
                          invoices.map((invoice) => (
                            <TableRow key={invoice.id} data-testid={`row-bill-${invoice.id}`}>
                              <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                              <TableCell>{format(new Date(invoice.billDate), "dd MMM yyyy")}</TableCell>
                              <TableCell>{invoice.shopName || invoice.customerName}</TableCell>
                              <TableCell>₹{parseFloat(invoice.grandTotal).toFixed(2)}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDownloadInvoice(invoice)}
                                  data-testid={`button-download-bill-${invoice.id}`}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeleteInvoiceId(invoice.id)}
                                  data-testid={`button-delete-bill-${invoice.id}`}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Delete Customer Confirmation */}
        <AlertDialog open={!!deleteCustomerId} onOpenChange={() => setDeleteCustomerId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this customer. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete-customer">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteCustomerId && deleteCustomerMutation.mutate(deleteCustomerId)}
                data-testid="button-confirm-delete-customer"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Product Confirmation */}
        <AlertDialog open={!!deleteProductId} onOpenChange={() => setDeleteProductId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this product. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete-product">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteProductId && deleteProductMutation.mutate(deleteProductId)}
                data-testid="button-confirm-delete-product"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Invoice Confirmation */}
        <AlertDialog open={!!deleteInvoiceId} onOpenChange={() => setDeleteInvoiceId(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this bill and all its items. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel data-testid="button-cancel-delete-bill">Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteInvoiceId && deleteInvoiceMutation.mutate(deleteInvoiceId)}
                data-testid="button-confirm-delete-bill"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
