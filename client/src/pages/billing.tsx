import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation } from "@tanstack/react-query";
import { StepProgress } from "@/components/step-progress";
import { BillSummary } from "@/components/bill-summary";
import { useToast } from "@/hooks/use-toast";
import { Settings, User, Package, FileCheck, Loader2, FileText, Save, Download, Sprout, Star, Circle, Hash, Weight } from "lucide-react";
import type { Customer, Product } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { generateInvoicePDF } from "@/lib/pdf-generator";

type BillItem = {
  productId: string;
  productName: string;
  hsn: string;
  quantity: number;
  price: number;
  total: number;
  gstRate: number;
  gstAmount: number;
  unit: string;
};

type BillConfig = {
  billDate: string;
  gstEnabled: boolean;
};

type CustomerData = {
  id?: string;
  name: string;
  shopName: string;
  phone: string;
  gstin: string;
  address: string;
  city: string;
  state: string;
};

type AdditionalCharges = {
  transport: number;
  packaging: number;
  other: number;
  lorryNumber: string;
};

export default function BillingPage() {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [billConfig, setBillConfig] = useState<BillConfig>({
    billDate: new Date().toISOString().split("T")[0],
    gstEnabled: true,
  });
  const [customerData, setCustomerData] = useState<CustomerData>({
    name: "",
    shopName: "",
    phone: "",
    gstin: "",
    address: "",
    city: "",
    state: "",
  });
  const [isNewCustomer, setIsNewCustomer] = useState(true);
  const [isNewShippingCustomer, setIsNewShippingCustomer] = useState(true);
  const [sameAsbilling, setSameAsBinding] = useState(true);
  const [shippingData, setShippingData] = useState<CustomerData>({
    name: "",
    shopName: "",
    phone: "",
    gstin: "",
    address: "",
    city: "",
    state: "",
  });
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [additionalCharges, setAdditionalCharges] = useState<AdditionalCharges>({
    transport: 0,
    packaging: 0,
    other: 0,
    lorryNumber: "",
  });

  const { data: customers = [], isLoading: customersLoading } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const saveCustomerMutation = useMutation({
    mutationFn: async (customer: CustomerData) => {
      const { id, ...customerData } = customer;
      return await apiRequest<Customer>("POST", "/api/customers", customerData);
    },
    onSuccess: (savedCustomer: Customer) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setCustomerData({ ...customerData, id: savedCustomer.id });
      toast({
        title: "Customer Saved",
        description: "Customer has been saved successfully",
      });
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
        toast({
          title: "Error",
          description: "Failed to save customer",
          variant: "destructive",
        });
      }
    },
  });

  const createInvoiceMutation = useMutation({
    mutationFn: async () => {
      const finalShippingData = sameAsbilling ? customerData : shippingData;
      const invoiceData = {
        billDate: billConfig.billDate,
        customerId: customerData.id || "",
        customerName: customerData.name,
        shopName: customerData.shopName,
        phone: customerData.phone,
        gstin: customerData.gstin,
        address: customerData.address,
        city: customerData.city,
        state: customerData.state,
        shippingName: finalShippingData.name,
        shippingShopName: finalShippingData.shopName,
        shippingPhone: finalShippingData.phone,
        shippingGstin: finalShippingData.gstin,
        shippingAddress: finalShippingData.address,
        shippingCity: finalShippingData.city,
        shippingState: finalShippingData.state,
        subtotal: subtotal.toString(),
        transport: additionalCharges.transport.toString(),
        packaging: additionalCharges.packaging.toString(),
        otherCharges: additionalCharges.other.toString(),
        gstEnabled: billConfig.gstEnabled,
        gstAmount: gstAmount.toString(),
        grandTotal: grandTotal.toString(),
        lorryNumber: additionalCharges.lorryNumber,
        items: billItems.map((item) => ({
          productId: item.productId,
          productName: item.productName,
          hsn: item.hsn,
          quantity: item.quantity,
          price: item.price.toString(),
          total: item.total.toString(),
          gstRate: item.gstRate.toString(),
          gstAmount: item.gstAmount.toString(),
        })),
      };
      return await apiRequest<{ invoice: any; items: any[] }>("POST", "/api/invoices", invoiceData);
    },
    onSuccess: (response: { invoice: any; items: any[] }) => {
      const { invoice } = response;
      const finalShippingData = sameAsbilling ? customerData : shippingData;
      
      // Generate PDF
      generateInvoicePDF({
        invoiceNumber: invoice.invoiceNumber,
        billDate: billConfig.billDate,
        customer: {
          name: customerData.name,
          shopName: customerData.shopName,
          phone: customerData.phone,
          gstin: customerData.gstin,
          address: customerData.address,
          city: customerData.city,
          state: customerData.state,
        },
        shipping: {
          name: finalShippingData.name,
          shopName: finalShippingData.shopName,
          phone: finalShippingData.phone,
          gstin: finalShippingData.gstin,
          address: finalShippingData.address,
          city: finalShippingData.city,
          state: finalShippingData.state,
        },
        items: billItems,
        subtotal,
        transport: additionalCharges.transport,
        packaging: additionalCharges.packaging,
        other: additionalCharges.other,
        gstAmount,
        grandTotal,
        lorryNumber: additionalCharges.lorryNumber,
      });

      toast({
        title: "Invoice Created",
        description: `Invoice ${invoice.invoiceNumber} generated successfully`,
      });

      // Reset form
      setCurrentStep(1);
      setBillConfig({
        billDate: new Date().toISOString().split("T")[0],
        gstEnabled: true,
      });
      setCustomerData({
        name: "",
        shopName: "",
        phone: "",
        gstin: "",
        address: "",
        city: "",
        state: "",
      });
      setIsNewCustomer(true);
      setSameAsBinding(true);
      setShippingData({
        name: "",
        shopName: "",
        phone: "",
        gstin: "",
        address: "",
        city: "",
        state: "",
      });
      setBillItems([]);
      setAdditionalCharges({
        transport: 0,
        packaging: 0,
        other: 0,
        lorryNumber: "",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create invoice",
        variant: "destructive",
      });
    },
  });

  const subtotal = billItems.reduce((sum, item) => sum + item.total, 0);
  const totalCharges = additionalCharges.transport + additionalCharges.packaging + additionalCharges.other;
  const itemsGstAmount = billItems.reduce((sum, item) => sum + (item.gstAmount || 0), 0);
  const gstAmount = billConfig.gstEnabled ? itemsGstAmount : 0;
  const grandTotal = subtotal + totalCharges + gstAmount;

  const handleCustomerSelect = (customerId: string) => {
    const customer = customers.find((c) => c.id === customerId);
    if (customer) {
      setCustomerData({
        id: customer.id,
        name: customer.name,
        shopName: customer.shopName || "",
        phone: customer.phone || "",
        gstin: customer.gstin || "",
        address: customer.address || "",
        city: customer.city || "",
        state: customer.state || "",
      });
    }
  };

  const handleAddProduct = (product: Product) => {
    const existing = billItems.find((item) => item.productId === product.id);
    const gstRate = parseFloat(product.gstRate || "0");
    const isWeightBased = product.unit.toLowerCase() === "kg";
    const defaultQty = isWeightBased ? 0 : 1;
    
    if (existing) {
      setBillItems(
        billItems.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: isWeightBased ? item.quantity : item.quantity + 1,
                total: isWeightBased ? item.total : (item.quantity + 1) * item.price,
                gstAmount: isWeightBased ? item.gstAmount : billConfig.gstEnabled ? ((item.quantity + 1) * item.price * item.gstRate) / 100 : 0,
              }
            : item
        )
      );
    } else {
      const itemTotal = isWeightBased ? 0 : parseFloat(product.defaultPrice);
      setBillItems([
        ...billItems,
        {
          productId: product.id,
          productName: product.name,
          hsn: product.hsn,
          quantity: defaultQty,
          price: parseFloat(product.defaultPrice),
          total: itemTotal,
          gstRate: gstRate,
          gstAmount: billConfig.gstEnabled ? (itemTotal * gstRate) / 100 : 0,
          unit: product.unit,
        },
      ]);
    }
    toast({
      title: "Product Added",
      description: isWeightBased ? `${product.name} added - enter weight manually` : `${product.name} added to bill`,
    });
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity < 0) {
      return;
    }
    setBillItems(
      billItems.map((item) =>
        item.productId === productId
          ? { 
              ...item, 
              quantity, 
              total: quantity * item.price,
              gstAmount: billConfig.gstEnabled ? (quantity * item.price * item.gstRate) / 100 : 0,
            }
          : item
      )
    );
  };

  const handleUpdatePrice = (productId: string, price: number) => {
    if (price < 0) {
      return;
    }
    setBillItems(
      billItems.map((item) =>
        item.productId === productId
          ? { 
              ...item, 
              price, 
              total: item.quantity * price,
              gstAmount: billConfig.gstEnabled ? (item.quantity * price * item.gstRate) / 100 : 0,
            }
          : item
      )
    );
  };

  const handleRemoveItem = (productId: string) => {
    setBillItems(billItems.filter((item) => item.productId !== productId));
  };

  const canProceedFromConfig = billConfig.billDate !== "";
  const canProceedFromCustomer = customerData.name.trim() !== "";
  const canProceedFromProducts = billItems.length > 0;
  const allItemsHaveValidQuantity = billItems.every(item => item.quantity >= 0.1);
  const canGeneratePDF = billItems.length > 0 && allItemsHaveValidQuantity;

  const handleSaveCustomer = () => {
    const nameRegex = /^[a-zA-Z\s]+$/;
    const shopNameRegex = /^[a-zA-Z0-9\s]+$/;
    const phoneRegex = /^\d{10}$/;
    const gstinRegex = /^[a-zA-Z0-9]+$/;
    
    // Validate customer name
    if (!customerData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Customer name is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!nameRegex.test(customerData.name.trim())) {
      toast({
        title: "Validation Error",
        description: "Customer name must contain only letters",
        variant: "destructive",
      });
      return;
    }
    
    // Validate shop name
    if (customerData.shopName.trim() && !shopNameRegex.test(customerData.shopName.trim())) {
      toast({
        title: "Validation Error",
        description: "Shop name can only contain letters and numbers",
        variant: "destructive",
      });
      return;
    }
    
    // Validate phone
    if (customerData.phone.trim() && !phoneRegex.test(customerData.phone.trim())) {
      toast({
        title: "Validation Error",
        description: "Phone number must be exactly 10 digits",
        variant: "destructive",
      });
      return;
    }
    
    // Validate GSTIN
    if (customerData.gstin.trim()) {
      if (!gstinRegex.test(customerData.gstin.trim())) {
        toast({
          title: "Validation Error",
          description: "GSTIN can only contain letters and numbers",
          variant: "destructive",
        });
        return;
      }
      if (customerData.gstin.trim().length > 15) {
        toast({
          title: "Validation Error",
          description: "GSTIN must be maximum 15 characters",
          variant: "destructive",
        });
        return;
      }
    }
    
    // Validate city
    if (customerData.city.trim() && !nameRegex.test(customerData.city.trim())) {
      toast({
        title: "Validation Error",
        description: "City must contain only letters",
        variant: "destructive",
      });
      return;
    }
    
    // Validate state
    if (customerData.state.trim() && !nameRegex.test(customerData.state.trim())) {
      toast({
        title: "Validation Error",
        description: "State must contain only letters",
        variant: "destructive",
      });
      return;
    }
    
    saveCustomerMutation.mutate(customerData);
  };

  const handleGeneratePDF = async () => {
    // Validate all items have quantity >= 0.1
    if (!allItemsHaveValidQuantity) {
      toast({
        title: "Invalid Quantity",
        description: "All items must have a quantity of at least 0.1 to generate the PDF",
        variant: "destructive",
      });
      return;
    }

    // Ensure customer is saved before creating invoice
    if (!customerData.id && customerData.shopName.trim()) {
      try {
        const savedCustomer = await apiRequest<Customer>("POST", "/api/customers", {
          name: customerData.name,
          shopName: customerData.shopName,
          phone: customerData.phone,
          gstin: customerData.gstin,
          address: customerData.address,
          city: customerData.city,
          state: customerData.state,
        });
        setCustomerData({ ...customerData, id: savedCustomer.id });
        // Wait a bit to ensure state is updated
        setTimeout(() => {
          createInvoiceMutation.mutate();
        }, 100);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to save customer before creating invoice",
          variant: "destructive",
        });
      }
    } else {
      createInvoiceMutation.mutate();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2]">
      <div className="bg-gradient-to-br from-[#667eea] to-[#764ba2] text-white py-8 rounded-b-[30px] shadow-lg mb-8">
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Sprout className="w-10 h-10" />
            <h1 className="text-4xl font-bold">AYESHA Coco Pith</h1>
          </div>
          <p className="text-lg opacity-90">Professional Billing System</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-8">
        <StepProgress currentStep={currentStep} />

        <div className="grid lg:grid-cols-[2fr,1fr] gap-8 items-start">
          <div>
            {currentStep === 1 && (
              <Card className="p-8 rounded-[20px] shadow-xl" data-testid="card-config">
                <div className="flex items-center gap-3 mb-6">
                  <Settings className="w-8 h-8 text-primary" />
                  <h2 className="text-3xl font-bold text-foreground">Bill Configuration</h2>
                </div>
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="billDate" className="text-base font-semibold mb-2 block">
                      Bill Date
                    </Label>
                    <Input
                      id="billDate"
                      type="date"
                      value={billConfig.billDate}
                      onChange={(e) =>
                        setBillConfig({ ...billConfig, billDate: e.target.value })
                      }
                      className="text-base"
                      data-testid="input-bill-date"
                    />
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-base font-semibold block">
                        {billConfig.gstEnabled ? "With GST" : "Without GST"}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        GST rates vary by product (0%, 5%, etc.)
                      </span>
                    </div>
                    <Switch
                      checked={billConfig.gstEnabled}
                      onCheckedChange={(checked) => {
                        setBillConfig({ ...billConfig, gstEnabled: checked });
                        setBillItems(billItems.map(item => ({
                          ...item,
                          gstAmount: checked ? (item.total * item.gstRate) / 100 : 0,
                        })));
                      }}
                      data-testid="switch-gst"
                    />
                  </div>
                  <Button
                    onClick={() => setCurrentStep(2)}
                    disabled={!canProceedFromConfig}
                    className="w-full text-base py-6"
                    data-testid="button-next-customer"
                  >
                    Next: Customer Information →
                  </Button>
                </div>
              </Card>
            )}

            {currentStep === 2 && (
              <Card className="p-8 rounded-[20px] shadow-xl" data-testid="card-customer">
                <div className="flex items-center gap-3 mb-6">
                  <User className="w-8 h-8 text-primary" />
                  <h2 className="text-3xl font-bold text-foreground">Customer Information</h2>
                </div>
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold mb-2 block">
                      Customer Type
                    </Label>
                    <Select 
                      value={isNewCustomer ? "new" : "existing"} 
                      onValueChange={(value) => {
                        setIsNewCustomer(value === "new");
                        if (value === "new") {
                          setCustomerData({
                            name: "",
                            shopName: "",
                            phone: "",
                            gstin: "",
                            address: "",
                            city: "",
                            state: "",
                          });
                        }
                      }}
                    >
                      <SelectTrigger className="text-base" data-testid="select-customer-type">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="existing">Existing Customer</SelectItem>
                        <SelectItem value="new">New Customer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="border-t-2 pt-6">
                    <h3 className="text-xl font-bold mb-4">Billing To</h3>
                    
                    {!isNewCustomer && (
                      <div>
                        <Label htmlFor="customerSelect" className="text-base font-semibold mb-2 block">
                          Select Customer
                        </Label>
                        <Select onValueChange={handleCustomerSelect}>
                          <SelectTrigger className="text-base" data-testid="select-customer">
                            <SelectValue placeholder="Select a customer..." />
                          </SelectTrigger>
                          <SelectContent>
                            {customers.map((customer) => (
                              <SelectItem key={customer.id} value={customer.id}>
                                {customer.shopName || customer.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {!isNewCustomer && customerData.shopName && (
                      <div className="mt-4 p-4 bg-muted rounded-lg space-y-2" data-testid="display-billing-info">
                        <div className="grid md:grid-cols-2 gap-4">
                          {customerData.shopName && (
                            <div>
                              <p className="text-sm text-muted-foreground">Shop Name</p>
                              <p className="font-semibold">{customerData.shopName}</p>
                            </div>
                          )}
                          {customerData.name && (
                            <div>
                              <p className="text-sm text-muted-foreground">Customer Name</p>
                              <p className="font-semibold">{customerData.name}</p>
                            </div>
                          )}
                          {customerData.phone && (
                            <div>
                              <p className="text-sm text-muted-foreground">Phone</p>
                              <p className="font-semibold">{customerData.phone}</p>
                            </div>
                          )}
                          {customerData.gstin && (
                            <div>
                              <p className="text-sm text-muted-foreground">GSTIN</p>
                              <p className="font-semibold">{customerData.gstin}</p>
                            </div>
                          )}
                        </div>
                        {customerData.address && (
                          <div className="mt-2">
                            <p className="text-sm text-muted-foreground">Address</p>
                            <p className="font-semibold">{customerData.address}</p>
                          </div>
                        )}
                        <div className="grid md:grid-cols-2 gap-4">
                          {customerData.city && (
                            <div>
                              <p className="text-sm text-muted-foreground">City</p>
                              <p className="font-semibold">{customerData.city}</p>
                            </div>
                          )}
                          {customerData.state && (
                            <div>
                              <p className="text-sm text-muted-foreground">State</p>
                              <p className="font-semibold">{customerData.state}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                  {isNewCustomer && (
                  <div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="shopName" className="text-base font-semibold mb-2 block">
                          Shop Name *
                        </Label>
                        <Input
                          id="shopName"
                          value={customerData.shopName}
                          onChange={(e) =>
                            setCustomerData({ ...customerData, shopName: e.target.value })
                          }
                          placeholder="Enter shop name"
                          className="text-base"
                          data-testid="input-shop-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="customerName" className="text-base font-semibold mb-2 block">
                          Customer Name
                        </Label>
                        <Input
                          id="customerName"
                          value={customerData.name}
                          onChange={(e) =>
                            setCustomerData({ ...customerData, name: e.target.value })
                          }
                          placeholder="Enter name"
                          className="text-base"
                          data-testid="input-customer-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone" className="text-base font-semibold mb-2 block">
                          Phone
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={customerData.phone}
                          onChange={(e) =>
                            setCustomerData({ ...customerData, phone: e.target.value })
                          }
                          placeholder="Enter phone"
                          className="text-base"
                          data-testid="input-phone"
                        />
                      </div>
                      <div>
                        <Label htmlFor="gstin" className="text-base font-semibold mb-2 block">
                          GSTIN
                        </Label>
                        <Input
                          id="gstin"
                          value={customerData.gstin}
                          onChange={(e) =>
                            setCustomerData({ ...customerData, gstin: e.target.value })
                          }
                          placeholder="Enter GSTIN"
                          className="text-base"
                          data-testid="input-gstin"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label htmlFor="address" className="text-base font-semibold mb-2 block">
                        Address
                      </Label>
                      <Input
                        id="address"
                        value={customerData.address}
                        onChange={(e) =>
                          setCustomerData({ ...customerData, address: e.target.value })
                        }
                        placeholder="Enter address"
                        className="text-base"
                        data-testid="input-address"
                      />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                      <div>
                        <Label htmlFor="city" className="text-base font-semibold mb-2 block">
                          City
                        </Label>
                        <Input
                          id="city"
                          value={customerData.city}
                          onChange={(e) =>
                            setCustomerData({ ...customerData, city: e.target.value })
                          }
                          placeholder="Enter city"
                          className="text-base"
                          data-testid="input-city"
                        />
                      </div>
                      <div>
                        <Label htmlFor="state" className="text-base font-semibold mb-2 block">
                          State
                        </Label>
                        <Input
                          id="state"
                          value={customerData.state}
                          onChange={(e) =>
                            setCustomerData({ ...customerData, state: e.target.value })
                          }
                          placeholder="Enter state"
                          className="text-base"
                          data-testid="input-state"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleSaveCustomer}
                      disabled={saveCustomerMutation.isPending || !customerData.name.trim()}
                      className="w-full mt-4 text-base py-6 bg-success hover:bg-success/90 text-success-foreground"
                      data-testid="button-save-customer"
                    >
                      {saveCustomerMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Save Customer
                        </>
                      )}
                    </Button>
                  </div>
                  )}
                  </div>

                  <div className="border-t-2 pt-6 mt-6">
                    <h3 className="text-xl font-bold mb-4">Shipping To</h3>
                    
                    <div className="flex items-center space-x-2 mb-4">
                      <Checkbox
                        id="sameAsBilling"
                        checked={sameAsbilling}
                        onCheckedChange={(checked) => setSameAsBinding(checked as boolean)}
                        data-testid="checkbox-same-as-billing"
                      />
                      <Label
                        htmlFor="sameAsBilling"
                        className="text-base font-semibold cursor-pointer"
                      >
                        Shipping address is same as billing address
                      </Label>
                    </div>

                    {!sameAsbilling && (
                      <>
                        <div className="mb-4">
                          <Label className="text-base font-semibold mb-2 block">
                            Shipping Customer Type
                          </Label>
                          <Select 
                            value={isNewShippingCustomer ? "new" : "existing"} 
                            onValueChange={(value) => {
                              setIsNewShippingCustomer(value === "new");
                              if (value === "new") {
                                setShippingData({
                                  name: "",
                                  shopName: "",
                                  phone: "",
                                  gstin: "",
                                  address: "",
                                  city: "",
                                  state: "",
                                });
                              }
                            }}
                          >
                            <SelectTrigger className="text-base" data-testid="select-shipping-customer-type">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="existing">Existing Customer</SelectItem>
                              <SelectItem value="new">New Customer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {!isNewShippingCustomer && (
                          <div className="mb-4">
                            <Label htmlFor="shippingCustomerSelect" className="text-base font-semibold mb-2 block">
                              Select Customer
                            </Label>
                            <Select onValueChange={(customerId) => {
                              const customer = customers.find((c) => c.id === customerId);
                              if (customer) {
                                setShippingData({
                                  id: customer.id,
                                  name: customer.name,
                                  shopName: customer.shopName || "",
                                  phone: customer.phone || "",
                                  gstin: customer.gstin || "",
                                  address: customer.address || "",
                                  city: customer.city || "",
                                  state: customer.state || "",
                                });
                              }
                            }}>
                              <SelectTrigger className="text-base" data-testid="select-shipping-customer">
                                <SelectValue placeholder="Select shipping customer..." />
                              </SelectTrigger>
                              <SelectContent>
                                {customers.map((customer) => (
                                  <SelectItem key={customer.id} value={customer.id}>
                                    {customer.shopName || customer.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        )}

                        {!isNewShippingCustomer && shippingData.shopName && (
                          <div className="mb-4 p-4 bg-muted rounded-lg space-y-2" data-testid="display-shipping-info">
                            <div className="grid md:grid-cols-2 gap-4">
                              {shippingData.shopName && (
                                <div>
                                  <p className="text-sm text-muted-foreground">Shop Name</p>
                                  <p className="font-semibold">{shippingData.shopName}</p>
                                </div>
                              )}
                              {shippingData.name && (
                                <div>
                                  <p className="text-sm text-muted-foreground">Customer Name</p>
                                  <p className="font-semibold">{shippingData.name}</p>
                                </div>
                              )}
                              {shippingData.phone && (
                                <div>
                                  <p className="text-sm text-muted-foreground">Phone</p>
                                  <p className="font-semibold">{shippingData.phone}</p>
                                </div>
                              )}
                              {shippingData.gstin && (
                                <div>
                                  <p className="text-sm text-muted-foreground">GSTIN</p>
                                  <p className="font-semibold">{shippingData.gstin}</p>
                                </div>
                              )}
                            </div>
                            {shippingData.address && (
                              <div className="mt-2">
                                <p className="text-sm text-muted-foreground">Address</p>
                                <p className="font-semibold">{shippingData.address}</p>
                              </div>
                            )}
                            <div className="grid md:grid-cols-2 gap-4">
                              {shippingData.city && (
                                <div>
                                  <p className="text-sm text-muted-foreground">City</p>
                                  <p className="font-semibold">{shippingData.city}</p>
                                </div>
                              )}
                              {shippingData.state && (
                                <div>
                                  <p className="text-sm text-muted-foreground">State</p>
                                  <p className="font-semibold">{shippingData.state}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {isNewShippingCustomer && (
                        <>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="shippingShopName" className="text-base font-semibold mb-2 block">
                              Shop Name *
                            </Label>
                            <Input
                              id="shippingShopName"
                              value={shippingData.shopName}
                              onChange={(e) =>
                                setShippingData({ ...shippingData, shopName: e.target.value })
                              }
                              placeholder="Enter shop name"
                              className="text-base"
                            />
                          </div>
                          <div>
                            <Label htmlFor="shippingCustomerName" className="text-base font-semibold mb-2 block">
                              Customer Name
                            </Label>
                            <Input
                              id="shippingCustomerName"
                              value={shippingData.name}
                              onChange={(e) =>
                                setShippingData({ ...shippingData, name: e.target.value })
                              }
                              placeholder="Enter name"
                              className="text-base"
                            />
                          </div>
                          <div>
                            <Label htmlFor="shippingPhone" className="text-base font-semibold mb-2 block">
                              Phone
                            </Label>
                            <Input
                              id="shippingPhone"
                              type="tel"
                              value={shippingData.phone}
                              onChange={(e) =>
                                setShippingData({ ...shippingData, phone: e.target.value })
                              }
                              placeholder="Enter phone"
                              className="text-base"
                            />
                          </div>
                          <div>
                            <Label htmlFor="shippingGstin" className="text-base font-semibold mb-2 block">
                              GSTIN
                            </Label>
                            <Input
                              id="shippingGstin"
                              value={shippingData.gstin}
                              onChange={(e) =>
                                setShippingData({ ...shippingData, gstin: e.target.value })
                              }
                              placeholder="Enter GSTIN"
                              className="text-base"
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <Label htmlFor="shippingAddress" className="text-base font-semibold mb-2 block">
                            Address
                          </Label>
                          <Input
                            id="shippingAddress"
                            value={shippingData.address}
                            onChange={(e) =>
                              setShippingData({ ...shippingData, address: e.target.value })
                            }
                            placeholder="Enter address"
                            className="text-base"
                          />
                        </div>
                        <div className="grid md:grid-cols-2 gap-4 mt-4">
                          <div>
                            <Label htmlFor="shippingCity" className="text-base font-semibold mb-2 block">
                              City
                            </Label>
                            <Input
                              id="shippingCity"
                              value={shippingData.city}
                              onChange={(e) =>
                                setShippingData({ ...shippingData, city: e.target.value })
                              }
                              placeholder="Enter city"
                              className="text-base"
                            />
                          </div>
                          <div>
                            <Label htmlFor="shippingState" className="text-base font-semibold mb-2 block">
                              State
                            </Label>
                            <Input
                              id="shippingState"
                              value={shippingData.state}
                              onChange={(e) =>
                                setShippingData({ ...shippingData, state: e.target.value })
                              }
                              placeholder="Enter state"
                              className="text-base"
                            />
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            const nameRegex = /^[a-zA-Z\s]+$/;
                            const shopNameRegex = /^[a-zA-Z0-9\s]+$/;
                            const phoneRegex = /^\d{10}$/;
                            const gstinRegex = /^[a-zA-Z0-9]+$/;
                            
                            // Validate customer name
                            if (!shippingData.name.trim()) {
                              toast({
                                title: "Validation Error",
                                description: "Customer name is required",
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            if (!nameRegex.test(shippingData.name.trim())) {
                              toast({
                                title: "Validation Error",
                                description: "Customer name must contain only letters",
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            // Validate shop name
                            if (shippingData.shopName.trim() && !shopNameRegex.test(shippingData.shopName.trim())) {
                              toast({
                                title: "Validation Error",
                                description: "Shop name can only contain letters and numbers",
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            // Validate phone
                            if (shippingData.phone.trim() && !phoneRegex.test(shippingData.phone.trim())) {
                              toast({
                                title: "Validation Error",
                                description: "Phone number must be exactly 10 digits",
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            // Validate GSTIN
                            if (shippingData.gstin.trim()) {
                              if (!gstinRegex.test(shippingData.gstin.trim())) {
                                toast({
                                  title: "Validation Error",
                                  description: "GSTIN can only contain letters and numbers",
                                  variant: "destructive",
                                });
                                return;
                              }
                              if (shippingData.gstin.trim().length > 15) {
                                toast({
                                  title: "Validation Error",
                                  description: "GSTIN must be maximum 15 characters",
                                  variant: "destructive",
                                });
                                return;
                              }
                            }
                            
                            // Validate city
                            if (shippingData.city.trim() && !nameRegex.test(shippingData.city.trim())) {
                              toast({
                                title: "Validation Error",
                                description: "City must contain only letters",
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            // Validate state
                            if (shippingData.state.trim() && !nameRegex.test(shippingData.state.trim())) {
                              toast({
                                title: "Validation Error",
                                description: "State must contain only letters",
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            saveCustomerMutation.mutate(shippingData);
                          }}
                          disabled={saveCustomerMutation.isPending || !shippingData.name.trim()}
                          className="w-full mt-4 text-base py-6 bg-success hover:bg-success/90 text-success-foreground"
                          data-testid="button-save-shipping-customer"
                        >
                          {saveCustomerMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="w-4 h-4 mr-2" />
                              Save Customer
                            </>
                          )}
                        </Button>
                        </>
                        )}
                      </>
                    )}
                  </div>

                  <div className="flex gap-4 mt-6">
                    <Button
                      variant="secondary"
                      onClick={() => setCurrentStep(1)}
                      className="flex-1 text-base py-6"
                      data-testid="button-back-config"
                    >
                      ← Back
                    </Button>
                    <Button
                      onClick={() => setCurrentStep(3)}
                      disabled={!canProceedFromCustomer}
                      className="flex-1 text-base py-6"
                      data-testid="button-next-products"
                    >
                      Next: Products →
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {currentStep === 3 && (
              <Card className="p-8 rounded-[20px] shadow-xl" data-testid="card-products">
                <div className="flex items-center gap-3 mb-6">
                  <Package className="w-8 h-8 text-primary" />
                  <h2 className="text-3xl font-bold text-foreground">Add Products</h2>
                </div>
                {productsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="ml-3 text-lg">Loading products...</span>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {products.map((product) => {
                      const gstRate = parseFloat(product.gstRate || "0");
                      const hasGST = gstRate > 0;
                      const isWeightBased = product.unit.toLowerCase() === "kg";
                      return (
                      <Card
                        key={product.id}
                        className="p-6 rounded-2xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-primary border-2 cursor-pointer hover-elevate active-elevate-2 relative"
                        onClick={() => handleAddProduct(product)}
                        data-testid={`card-product-${product.id}`}
                      >
                        {hasGST ? (
                          <div className="absolute top-3 right-3 flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-2 py-1 rounded-full text-xs font-semibold">
                            <Star className="w-3 h-3 fill-current" />
                            <span>{gstRate}% GST</span>
                          </div>
                        ) : (
                          <div className="absolute top-3 right-3 flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full text-xs font-semibold">
                            <Circle className="w-3 h-3 fill-current" />
                            <span>0% GST</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 mb-2">
                          {isWeightBased ? (
                            <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-full text-xs font-semibold">
                              <Weight className="w-3 h-3" />
                              <span>Kg</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-1 rounded-full text-xs font-semibold">
                              <Hash className="w-3 h-3" />
                              <span>Qty</span>
                            </div>
                          )}
                          <h3 className="font-bold text-lg pr-20">{product.name}</h3>
                        </div>
                        {product.description && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {product.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">HSN: {product.hsn}</span>
                          <span className="font-bold text-primary text-lg">
                            ₹{parseFloat(product.defaultPrice).toFixed(2)}/{product.unit}
                          </span>
                        </div>
                      </Card>
                      );
                    })}
                  </div>
                )}
                <div className="flex gap-4">
                  <Button
                    variant="secondary"
                    onClick={() => setCurrentStep(2)}
                    className="flex-1 text-base py-6"
                    data-testid="button-back-customer"
                  >
                    ← Back
                  </Button>
                  <Button
                    onClick={() => setCurrentStep(4)}
                    disabled={!canProceedFromProducts}
                    className="flex-1 text-base py-6"
                    data-testid="button-next-review"
                  >
                    Next: Review →
                  </Button>
                </div>
              </Card>
            )}

            {currentStep === 4 && (
              <Card className="p-8 rounded-[20px] shadow-xl" data-testid="card-review">
                <div className="flex items-center gap-3 mb-6">
                  <FileCheck className="w-8 h-8 text-primary" />
                  <h2 className="text-3xl font-bold text-foreground">Additional Charges & Review</h2>
                </div>
                <div className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="transport" className="text-base font-semibold mb-2 block">
                        Transport (₹)
                      </Label>
                      <Input
                        id="transport"
                        type="text"
                        value={additionalCharges.transport || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "" || /^\d*\.?\d*$/.test(value)) {
                            setAdditionalCharges({
                              ...additionalCharges,
                              transport: value === "" ? 0 : parseFloat(value) || 0,
                            });
                          }
                        }}
                        placeholder="0"
                        className="text-base"
                        data-testid="input-transport"
                      />
                    </div>
                    <div>
                      <Label htmlFor="packaging" className="text-base font-semibold mb-2 block">
                        Packaging (₹)
                      </Label>
                      <Input
                        id="packaging"
                        type="text"
                        value={additionalCharges.packaging || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "" || /^\d*\.?\d*$/.test(value)) {
                            setAdditionalCharges({
                              ...additionalCharges,
                              packaging: value === "" ? 0 : parseFloat(value) || 0,
                            });
                          }
                        }}
                        placeholder="0"
                        className="text-base"
                        data-testid="input-packaging"
                      />
                    </div>
                    <div>
                      <Label htmlFor="other" className="text-base font-semibold mb-2 block">
                        Other Charges (₹)
                      </Label>
                      <Input
                        id="other"
                        type="text"
                        value={additionalCharges.other || ""}
                        onChange={(e) => {
                          const value = e.target.value;
                          if (value === "" || /^\d*\.?\d*$/.test(value)) {
                            setAdditionalCharges({
                              ...additionalCharges,
                              other: value === "" ? 0 : parseFloat(value) || 0,
                            });
                          }
                        }}
                        placeholder="0"
                        className="text-base"
                        data-testid="input-other"
                      />
                    </div>
                    <div>
                      <Label htmlFor="lorryNo" className="text-base font-semibold mb-2 block">
                        Lorry / Vehicle No.
                      </Label>
                      <Input
                        id="lorryNo"
                        value={additionalCharges.lorryNumber}
                        onChange={(e) =>
                          setAdditionalCharges({
                            ...additionalCharges,
                            lorryNumber: e.target.value,
                          })
                        }
                        placeholder="e.g. TN 01 AB 1234"
                        className="text-base"
                        data-testid="input-lorry"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <Button
                      variant="secondary"
                      onClick={() => setCurrentStep(3)}
                      className="flex-[2] text-base py-6"
                      data-testid="button-back-products"
                    >
                      ← Back
                    </Button>
                    <Button
                      onClick={handleGeneratePDF}
                      disabled={createInvoiceMutation.isPending || !canGeneratePDF}
                      className="flex-[3] text-base py-6 bg-success hover:bg-success/90 text-success-foreground"
                      data-testid="button-generate-pdf"
                    >
                      {createInvoiceMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Generate & Download PDF
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>

          <BillSummary
            items={billItems}
            subtotal={subtotal}
            charges={totalCharges}
            gstAmount={gstAmount}
            grandTotal={grandTotal}
            gstEnabled={billConfig.gstEnabled}
            customerShopName={customerData.shopName}
            billDate={billConfig.billDate}
            onUpdateQuantity={handleUpdateQuantity}
            onUpdatePrice={handleUpdatePrice}
            onRemoveItem={handleRemoveItem}
          />
        </div>
      </div>
    </div>
  );
}
