import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [customerCityFilter, setCustomerCityFilter] = useState("all");
  const [customerSortOption, setCustomerSortOption] = useState("a-z");
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [viewingMultipleCustomers, setViewingMultipleCustomers] = useState<Customer[]>([]);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());

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

  // Fetch cities and states
  const { data: citiesData = [] } = useQuery<string[]>({
    queryKey: ["/api/locations/city"],
  });

  const { data: statesData = [] } = useQuery<string[]>({
    queryKey: ["/api/locations/state"],
  });

  // Customer form
  const customerForm = useForm<z.infer<typeof customerFormSchema>>({
    resolver: zodResolver(customerFormSchema),
    mode: "onChange",
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

  const handleCustomerSubmit = async (data: z.infer<typeof customerFormSchema>) => {
    try {
      // Save city if it's new
      if (data.city && !citiesData.includes(data.city)) {
        await apiRequest("POST", "/api/locations", { type: "city", value: data.city });
        queryClient.invalidateQueries({ queryKey: ["/api/locations/city"] });
      }
      
      // Save state if it's new
      if (data.state && !statesData.includes(data.state)) {
        await apiRequest("POST", "/api/locations", { type: "state", value: data.state });
        queryClient.invalidateQueries({ queryKey: ["/api/locations/state"] });
      }
      
      // Submit customer data
      if (editingCustomer) {
        updateCustomerMutation.mutate({ id: editingCustomer.id, data });
      } else {
        createCustomerMutation.mutate(data);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save location data",
        variant: "destructive",
      });
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

  const handleSelectCustomer = (customerId: string, checked: boolean) => {
    setSelectedCustomerIds(prev => {
      const newSet = new Set(prev);
      if (checked) {
        newSet.add(customerId);
      } else {
        newSet.delete(customerId);
      }
      return newSet;
    });
  };

  const handleSelectAllCustomers = (checked: boolean) => {
    if (checked) {
      setSelectedCustomerIds(new Set(filteredCustomers.map(c => c.id)));
    } else {
      setSelectedCustomerIds(new Set());
    }
  };

  const handleBulkDeleteCustomers = () => {
    selectedCustomerIds.forEach(id => {
      deleteCustomerMutation.mutate(id);
    });
    setSelectedCustomerIds(new Set());
  };

  const handleBulkViewCustomers = () => {
    const selectedCustomers = customers.filter(c => selectedCustomerIds.has(c.id));
    if (selectedCustomers.length > 0) {
      setViewingMultipleCustomers(selectedCustomers);
    }
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

      await generateInvoicePDF(invoiceData);
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
    // Separate selected and unselected customers
    const selectedCustomers = customers.filter(c => selectedCustomerIds.has(c.id));
    let unselectedCustomers = customers.filter(c => !selectedCustomerIds.has(c.id));

    // Apply filters only to unselected customers
    // Filter by name (shop name or contact name)
    if (customerNameSearch.trim()) {
      const searchLower = customerNameSearch.toLowerCase();
      unselectedCustomers = unselectedCustomers.filter(customer => 
        (customer.shopName?.toLowerCase() || "").includes(searchLower) ||
        (customer.name?.toLowerCase() || "").includes(searchLower)
      );
    }

    // Filter by city
    if (customerCityFilter && customerCityFilter !== "all") {
      unselectedCustomers = unselectedCustomers.filter(customer => 
        customer.city === customerCityFilter
      );
    }

    // Sort unselected customers
    unselectedCustomers.sort((a, b) => {
      switch (customerSortOption) {
        case "a-z":
          return (a.shopName || "").localeCompare(b.shopName || "");
        case "z-a":
          return (b.shopName || "").localeCompare(a.shopName || "");
        default:
          return 0;
      }
    });

    // Sort selected customers
    selectedCustomers.sort((a, b) => {
      switch (customerSortOption) {
        case "a-z":
          return (a.shopName || "").localeCompare(b.shopName || "");
        case "z-a":
          return (b.shopName || "").localeCompare(a.shopName || "");
        default:
          return 0;
      }
    });

    // Combine: selected customers first, then unselected
    return [...selectedCustomers, ...unselectedCustomers];
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
                  <Dialog open={customerDialogOpen} onOpenChange={(open) => {
                    setCustomerDialogOpen(open);
                    if (!open) {
                      setEditingCustomer(null);
                      customerForm.reset();
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button onClick={() => { 
                        setEditingCustomer(null); 
                        customerForm.reset({
                          name: "",
                          shopName: "",
                          phone: "",
                          email: "",
                          gstin: "",
                          address: "",
                          city: "",
                          state: "",
                          postalCode: "",
                        }); 
                      }} data-testid="button-add-customer">
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
                                    <FormLabel>Shop Name <span className="text-red-500">*</span></FormLabel>
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
                                    <Input {...field} value={field.value || ""} data-testid="input-customer-phone" />
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
                                  <FormLabel>City <span className="text-red-500">*</span></FormLabel>
                                  <div className="flex gap-2">
                                    <FormControl>
                                      <Input 
                                        {...field} 
                                        list="city-datalist"
                                        data-testid="input-customer-city"
                                        placeholder="Type or select city"
                                      />
                                    </FormControl>
                                  </div>
                                  <datalist id="city-datalist">
                                    {citiesData.map((city) => (
                                      <option key={city} value={city} />
                                    ))}
                                  </datalist>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={customerForm.control}
                              name="state"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>State <span className="text-red-500">*</span></FormLabel>
                                  <div className="flex gap-2">
                                    <FormControl>
                                      <Input 
                                        {...field} 
                                        list="state-datalist"
                                        data-testid="input-customer-state"
                                        placeholder="Type or select state"
                                      />
                                    </FormControl>
                                  </div>
                                  <datalist id="state-datalist">
                                    {statesData.map((state) => (
                                      <option key={state} value={state} />
                                    ))}
                                  </datalist>
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
                                  <Textarea {...field} value={field.value || ""} rows={3} data-testid="input-customer-address" />
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
                  <>
                    {/* Filter and Search Controls */}
                    <div className="mb-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {/* Name Search */}
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Search by shop or contact name"
                            value={customerNameSearch}
                            onChange={(e) => setCustomerNameSearch(e.target.value)}
                            className="pl-10 pr-10"
                            data-testid="input-search-customer-name"
                          />
                          {customerNameSearch && (
                            <button
                              onClick={() => setCustomerNameSearch("")}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              data-testid="button-clear-name-search"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          )}
                        </div>

                        {/* City Filter */}
                        <Select value={customerCityFilter} onValueChange={setCustomerCityFilter}>
                          <SelectTrigger data-testid="select-city-filter">
                            <SelectValue placeholder="Filter by city" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all" data-testid="city-option-all">All Cities</SelectItem>
                            {uniqueCities.map((city) => (
                              <SelectItem key={city} value={city!} data-testid={`city-option-${city}`}>
                                {city}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {/* Sort Options */}
                        <Select value={customerSortOption} onValueChange={setCustomerSortOption}>
                          <SelectTrigger data-testid="select-sort-option">
                            <SelectValue placeholder="Sort by" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="a-z" data-testid="sort-option-a-z">A to Z</SelectItem>
                            <SelectItem value="z-a" data-testid="sort-option-z-a">Z to A</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Bulk Actions and Results count */}
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600 dark:text-gray-400" data-testid="text-customer-count">
                          Showing {filteredCustomers.length} of {customers.length} customers
                          {selectedCustomerIds.size > 0 && (
                            <span className="ml-2 font-semibold text-indigo-600 dark:text-indigo-400">
                              ({selectedCustomerIds.size} selected)
                            </span>
                          )}
                        </div>
                        {selectedCustomerIds.size > 0 && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={handleBulkViewCustomers}
                              data-testid="button-bulk-view"
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Selected
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={handleBulkDeleteCustomers}
                              data-testid="button-bulk-delete"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Selected
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={filteredCustomers.length > 0 && filteredCustomers.every(c => selectedCustomerIds.has(c.id))}
                              onCheckedChange={handleSelectAllCustomers}
                              data-testid="checkbox-select-all"
                            />
                          </TableHead>
                          <TableHead>Shop Name</TableHead>
                          <TableHead>Contact Name</TableHead>
                          <TableHead>City</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredCustomers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-gray-500" data-testid="text-no-customers">
                              {customers.length === 0 
                                ? "No customers found. Add your first customer to get started."
                                : "No customers match your search criteria."}
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredCustomers.map((customer) => (
                            <TableRow 
                              key={customer.id} 
                              data-testid={`row-customer-${customer.id}`}
                              className={selectedCustomerIds.has(customer.id) ? "bg-indigo-50 dark:bg-indigo-900/20" : ""}
                            >
                              <TableCell>
                                <Checkbox
                                  checked={selectedCustomerIds.has(customer.id)}
                                  onCheckedChange={(checked) => handleSelectCustomer(customer.id, checked as boolean)}
                                  data-testid={`checkbox-customer-${customer.id}`}
                                />
                              </TableCell>
                              <TableCell className="font-medium">{customer.shopName}</TableCell>
                              <TableCell>{customer.name}</TableCell>
                              <TableCell>{customer.city}</TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setViewingCustomer(customer)}
                                  data-testid={`button-view-customer-${customer.id}`}
                                >
                                  <Eye className="h-4 w-4 text-blue-500" />
                                </Button>
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
                  </>
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

        {/* View Customer Dialog */}
        <Dialog open={!!viewingCustomer} onOpenChange={(open) => !open && setViewingCustomer(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Customer Details</DialogTitle>
              <DialogDescription>View customer information</DialogDescription>
            </DialogHeader>
            {viewingCustomer && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Shop Name</Label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100" data-testid="view-shop-name">{viewingCustomer.shopName || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Contact Name</Label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100" data-testid="view-contact-name">{viewingCustomer.name || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Phone</Label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100" data-testid="view-phone">{viewingCustomer.phone || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Email</Label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100" data-testid="view-email">{viewingCustomer.email || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">GSTIN</Label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100" data-testid="view-gstin">{viewingCustomer.gstin || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">City</Label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100" data-testid="view-city">{viewingCustomer.city || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">State</Label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100" data-testid="view-state">{viewingCustomer.state || "-"}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-500">Postal Code</Label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100" data-testid="view-postal-code">{viewingCustomer.postalCode || "-"}</p>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-sm font-medium text-gray-500">Address</Label>
                    <p className="mt-1 text-sm text-gray-900 dark:text-gray-100" data-testid="view-address">{viewingCustomer.address || "-"}</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={() => setViewingCustomer(null)} data-testid="button-close-view">Close</Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* View Multiple Customers Dialog */}
        <Dialog open={viewingMultipleCustomers.length > 0} onOpenChange={(open) => !open && setViewingMultipleCustomers([])}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Selected Customers Details ({viewingMultipleCustomers.length})</DialogTitle>
              <DialogDescription>View all selected customer information</DialogDescription>
            </DialogHeader>
            <div className="overflow-y-auto max-h-[60vh] space-y-6 pr-2">
              {viewingMultipleCustomers.map((customer, index) => (
                <div 
                  key={customer.id} 
                  className="border-b pb-4 last:border-b-0"
                  data-testid={`view-multiple-customer-${customer.id}`}
                >
                  <h3 className="text-lg font-semibold mb-3 text-indigo-600 dark:text-indigo-400">
                    Customer {index + 1}: {customer.shopName}
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Shop Name</Label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{customer.shopName || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Contact Name</Label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{customer.name || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Phone</Label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{customer.phone || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Email</Label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{customer.email || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">GSTIN</Label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{customer.gstin || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">City</Label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{customer.city || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">State</Label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{customer.state || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-500">Postal Code</Label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{customer.postalCode || "-"}</p>
                    </div>
                    <div className="col-span-2">
                      <Label className="text-sm font-medium text-gray-500">Address</Label>
                      <p className="mt-1 text-sm text-gray-900 dark:text-gray-100">{customer.address || "-"}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button onClick={() => setViewingMultipleCustomers([])} data-testid="button-close-multiple-view">Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

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
