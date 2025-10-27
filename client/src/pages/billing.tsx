import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Settings, User, Package, FileCheck, Loader2, FileText, Save, Download, Sprout, Star, Circle, Hash, Weight, Pencil } from "lucide-react";
import type { Customer, Product } from "@shared/schema";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { generateInvoicePDF } from "@/lib/pdf-generator";
import logoImage from "@assets/cocologo_1761383042737.png";
import aslamSignature from "@assets/pngegg_1761410687109.png";
import zupearSignature from "@assets/signature_1761410697487.png";

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
  eSignatureEnabled: boolean;
  signedBy: string;
  billType: string;
};

type CustomerData = {
  id?: string;
  name: string;
  shopName: string;
  phone: string;
  email: string;
  gstin: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
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
    eSignatureEnabled: false,
    signedBy: "",
    billType: "cash-credit",
  });
  const [customerData, setCustomerData] = useState<CustomerData>({
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
  const [isNewCustomer, setIsNewCustomer] = useState<boolean | null>(null);
  const [isNewShippingCustomer, setIsNewShippingCustomer] = useState<boolean | null>(null);
  const [sameAsbilling, setSameAsBinding] = useState(true);
  const [isEditingCustomer, setIsEditingCustomer] = useState(false);
  const [isEditingShippingCustomer, setIsEditingShippingCustomer] = useState(false);
  const [selectedBillingCustomerId, setSelectedBillingCustomerId] = useState<string>("");
  const [selectedShippingCustomerId, setSelectedShippingCustomerId] = useState<string>("");
  const [shippingData, setShippingData] = useState<CustomerData>({
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

  const updateCustomerMutation = useMutation({
    mutationFn: async (customer: CustomerData) => {
      const { id, ...customerData } = customer;
      return await apiRequest<Customer>("PUT", `/api/customers/${id}`, customerData);
    },
    onSuccess: (updatedCustomer: Customer) => {
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      
      // Prepare the updated customer data
      const updatedData = {
        id: updatedCustomer.id,
        name: updatedCustomer.name || "",
        shopName: updatedCustomer.shopName || "",
        phone: updatedCustomer.phone || "",
        email: updatedCustomer.email || "",
        gstin: updatedCustomer.gstin || "",
        address: updatedCustomer.address || "",
        city: updatedCustomer.city || "",
        state: updatedCustomer.state || "",
        postalCode: updatedCustomer.postalCode || "",
      };
      
      // Update billing data if this customer is the billing customer
      if (customerData.id === updatedCustomer.id) {
        setCustomerData(updatedData);
      }
      
      // Update shipping data if this customer is the shipping customer
      if (shippingData.id === updatedCustomer.id) {
        setShippingData(updatedData);
      }
      
      // If "same as billing" is checked and billing was updated, sync to shipping
      if (sameAsbilling && customerData.id === updatedCustomer.id) {
        setShippingData(updatedData);
      }
      
      setIsEditingCustomer(false);
      setIsEditingShippingCustomer(false);
      toast({
        title: "Customer Updated",
        description: "Customer has been updated successfully",
      });
    },
    onError: (error: any) => {
      const errorData = error.body;
      if (errorData?.error === "Validation error") {
        toast({
          title: "Validation Error",
          description: errorData.message || "Please check all fields and try again",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update customer",
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
        email: customerData.email,
        gstin: customerData.gstin,
        address: customerData.address,
        city: customerData.city,
        state: customerData.state,
        postalCode: customerData.postalCode,
        shippingName: finalShippingData.name,
        shippingShopName: finalShippingData.shopName,
        shippingPhone: finalShippingData.phone,
        shippingEmail: finalShippingData.email,
        shippingGstin: finalShippingData.gstin,
        shippingAddress: finalShippingData.address,
        shippingCity: finalShippingData.city,
        shippingState: finalShippingData.state,
        shippingPostalCode: finalShippingData.postalCode,
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
          email: customerData.email,
          gstin: customerData.gstin,
          address: customerData.address,
          city: customerData.city,
          state: customerData.state,
          postalCode: customerData.postalCode,
        },
        shipping: {
          name: finalShippingData.name,
          shopName: finalShippingData.shopName,
          phone: finalShippingData.phone,
          email: finalShippingData.email,
          gstin: finalShippingData.gstin,
          address: finalShippingData.address,
          city: finalShippingData.city,
          state: finalShippingData.state,
          postalCode: finalShippingData.postalCode,
        },
        items: billItems,
        subtotal,
        transport: additionalCharges.transport,
        packaging: additionalCharges.packaging,
        other: additionalCharges.other,
        gstAmount,
        grandTotal,
        lorryNumber: additionalCharges.lorryNumber,
        eSignatureEnabled: billConfig.eSignatureEnabled,
        signedBy: billConfig.signedBy,
        billType: billConfig.billType,
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
        eSignatureEnabled: false,
        signedBy: "",
        billType: "cash-credit",
      });
      setCustomerData({
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
      setIsNewCustomer(true);
      setSameAsBinding(true);
      setShippingData({
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
      setSelectedBillingCustomerId(customerId);
      const customerInfo = {
        id: customer.id,
        name: customer.name || "",
        shopName: customer.shopName || "",
        phone: customer.phone || "",
        email: customer.email || "",
        gstin: customer.gstin || "",
        address: customer.address || "",
        city: customer.city || "",
        state: customer.state || "",
        postalCode: customer.postalCode || "",
      };
      setCustomerData(customerInfo);
      
      // If "same as billing" is checked, also update shipping data
      if (sameAsbilling) {
        setShippingData(customerInfo);
      }
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
  const canProceedFromCustomer = 
    customerData.shopName.trim() !== "" && 
    customerData.city.trim() !== "" && 
    customerData.state.trim() !== "" &&
    (!billConfig.gstEnabled || customerData.gstin.trim() !== "") &&
    (sameAsbilling || (
      shippingData.shopName.trim() !== "" && 
      shippingData.city.trim() !== "" && 
      shippingData.state.trim() !== "" &&
      (!billConfig.gstEnabled || shippingData.gstin.trim() !== "")
    ));
  const allItemsHaveValidQuantity = billItems.every(item => item.quantity >= 0.1);
  const hasValidProducts = billItems.length > 0 && allItemsHaveValidQuantity;
  const hasAnyCharges = additionalCharges.transport > 0 || additionalCharges.packaging > 0 || additionalCharges.other > 0;
  const canProceedFromProducts = billItems.length === 0 || allItemsHaveValidQuantity;
  const canGeneratePDF = hasValidProducts || hasAnyCharges;

  const handleSaveCustomer = () => {
    const nameRegex = /^[a-zA-Z\s]+$/;
    const shopNameRegex = /^[a-zA-Z0-9\s]+$/;
    const phoneRegex = /^\d{10}$/;
    const gstinRegex = /^[a-zA-Z0-9]+$/;
    
    // Validate shop name (required)
    if (!customerData.shopName.trim()) {
      toast({
        title: "Validation Error",
        description: "Shop name is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!shopNameRegex.test(customerData.shopName.trim())) {
      toast({
        title: "Validation Error",
        description: "Shop name can only contain letters and numbers",
        variant: "destructive",
      });
      return;
    }
    
    // Validate customer name (optional)
    if (customerData.name.trim() && !nameRegex.test(customerData.name.trim())) {
      toast({
        title: "Validation Error",
        description: "Customer name must contain only letters",
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
    
    // Validate city (required)
    if (!customerData.city.trim()) {
      toast({
        title: "Validation Error",
        description: "City is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!nameRegex.test(customerData.city.trim())) {
      toast({
        title: "Validation Error",
        description: "City must contain only letters",
        variant: "destructive",
      });
      return;
    }
    
    // Validate state (required)
    if (!customerData.state.trim()) {
      toast({
        title: "Validation Error",
        description: "State is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!nameRegex.test(customerData.state.trim())) {
      toast({
        title: "Validation Error",
        description: "State must contain only letters",
        variant: "destructive",
      });
      return;
    }
    
    saveCustomerMutation.mutate(customerData);
    
    // If "same as billing" is checked, sync shipping data with billing data
    if (sameAsbilling) {
      setShippingData({
        id: customerData.id,
        name: customerData.name,
        shopName: customerData.shopName,
        phone: customerData.phone,
        email: customerData.email,
        gstin: customerData.gstin,
        address: customerData.address,
        city: customerData.city,
        state: customerData.state,
        postalCode: customerData.postalCode,
      });
    }
  };

  const handleUpdateCustomer = () => {
    const nameRegex = /^[a-zA-Z\s]+$/;
    const shopNameRegex = /^[a-zA-Z0-9\s]+$/;
    const phoneRegex = /^\d{10}$/;
    const gstinRegex = /^[a-zA-Z0-9]+$/;
    
    // Validate shop name (required)
    if (!customerData.shopName.trim()) {
      toast({
        title: "Validation Error",
        description: "Shop name is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!shopNameRegex.test(customerData.shopName.trim())) {
      toast({
        title: "Validation Error",
        description: "Shop name can only contain letters and numbers",
        variant: "destructive",
      });
      return;
    }
    
    // Validate customer name (optional)
    if (customerData.name.trim() && !nameRegex.test(customerData.name.trim())) {
      toast({
        title: "Validation Error",
        description: "Customer name must contain only letters",
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
    
    // Validate city (required)
    if (!customerData.city.trim()) {
      toast({
        title: "Validation Error",
        description: "City is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!nameRegex.test(customerData.city.trim())) {
      toast({
        title: "Validation Error",
        description: "City must contain only letters",
        variant: "destructive",
      });
      return;
    }
    
    // Validate state (required)
    if (!customerData.state.trim()) {
      toast({
        title: "Validation Error",
        description: "State is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!nameRegex.test(customerData.state.trim())) {
      toast({
        title: "Validation Error",
        description: "State must contain only letters",
        variant: "destructive",
      });
      return;
    }
    
    updateCustomerMutation.mutate(customerData);
    
    // If "same as billing" is checked, sync shipping data with billing data
    if (sameAsbilling) {
      setShippingData({
        id: customerData.id,
        name: customerData.name,
        shopName: customerData.shopName,
        phone: customerData.phone,
        email: customerData.email,
        gstin: customerData.gstin,
        address: customerData.address,
        city: customerData.city,
        state: customerData.state,
        postalCode: customerData.postalCode,
      });
    }
  };

  const handleUpdateShippingCustomer = () => {
    const nameRegex = /^[a-zA-Z\s]+$/;
    const shopNameRegex = /^[a-zA-Z0-9\s]+$/;
    const phoneRegex = /^\d{10}$/;
    const gstinRegex = /^[a-zA-Z0-9]+$/;
    
    // Validate shop name (required)
    if (!shippingData.shopName.trim()) {
      toast({
        title: "Validation Error",
        description: "Shop name is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!shopNameRegex.test(shippingData.shopName.trim())) {
      toast({
        title: "Validation Error",
        description: "Shop name can only contain letters and numbers",
        variant: "destructive",
      });
      return;
    }
    
    // Validate customer name (optional)
    if (shippingData.name.trim() && !nameRegex.test(shippingData.name.trim())) {
      toast({
        title: "Validation Error",
        description: "Customer name must contain only letters",
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
    
    // Validate city (required)
    if (!shippingData.city.trim()) {
      toast({
        title: "Validation Error",
        description: "City is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!nameRegex.test(shippingData.city.trim())) {
      toast({
        title: "Validation Error",
        description: "City must contain only letters",
        variant: "destructive",
      });
      return;
    }
    
    // Validate state (required)
    if (!shippingData.state.trim()) {
      toast({
        title: "Validation Error",
        description: "State is required",
        variant: "destructive",
      });
      return;
    }
    
    if (!nameRegex.test(shippingData.state.trim())) {
      toast({
        title: "Validation Error",
        description: "State must contain only letters",
        variant: "destructive",
      });
      return;
    }
    
    // Update shipping customer in database if it has an ID
    if (shippingData.id) {
      updateCustomerMutation.mutate(shippingData);
      setIsEditingShippingCustomer(false);
    }
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
          postalCode: customerData.postalCode,
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
    <div className="min-h-screen bg-gradient-to-br from-[#667eea] to-[#764ba2] pt-2.5">
      <div className="mx-2.5 bg-white/20 dark:bg-white/10 backdrop-blur-md text-white py-4 sm:py-6 rounded-[20px] sm:rounded-[30px] shadow-lg mb-4 sm:mb-8 border border-white/30">
        <div className="flex items-center justify-between px-4 sm:px-6">
          <img src={logoImage} alt="Logo" className="w-16 h-16 sm:w-20 sm:h-20 object-contain flex-shrink-0" />
          <div className="flex-1 text-center">
            <h1 className="text-xl sm:text-3xl md:text-4xl font-bold mb-1">AYESHA COCO PITH & FIBER INDUSTRIES</h1>
            <p className="text-sm sm:text-lg opacity-90">Billing System</p>
          </div>
          <div className="w-16 sm:w-20 flex-shrink-0"></div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-2 sm:px-4 pb-4 sm:pb-8">
        <StepProgress currentStep={currentStep} />

        <div className="flex flex-col gap-4 sm:gap-6">
          <div className="w-full">
            {currentStep === 1 && (
              <Card className="p-4 sm:p-6 md:p-8 rounded-[15px] sm:rounded-[20px] shadow-xl" data-testid="card-config">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <Settings className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Bill Configuration</h2>
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
                  <div className="bg-purple-50 dark:bg-purple-950/30 p-4 rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-base font-semibold block">
                          {billConfig.eSignatureEnabled ? "With E-Signature" : "Without E-Signature"}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          Add authorized signature to bill
                        </span>
                      </div>
                      <Switch
                        checked={billConfig.eSignatureEnabled}
                        onCheckedChange={(checked) => {
                          setBillConfig({ ...billConfig, eSignatureEnabled: checked, signedBy: checked ? billConfig.signedBy : "" });
                        }}
                        data-testid="switch-esignature"
                      />
                    </div>
                    {billConfig.eSignatureEnabled && (
                      <div>
                        <Label htmlFor="signedBy" className="text-base font-semibold mb-2 block">
                          Whose Signature?
                        </Label>
                        <Select
                          value={billConfig.signedBy}
                          onValueChange={(value) =>
                            setBillConfig({ ...billConfig, signedBy: value })
                          }
                        >
                          <SelectTrigger id="signedBy" className="text-base" data-testid="select-signature">
                            <SelectValue placeholder="Select who signs" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Aslam">Aslam</SelectItem>
                            <SelectItem value="Zupear">Zupear</SelectItem>
                            <SelectItem value="Salman">Salman</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    <div>
                      <Label htmlFor="billType" className="text-base font-semibold mb-2 block">
                        Bill Type
                      </Label>
                      <Select
                        value={billConfig.billType}
                        onValueChange={(value) =>
                          setBillConfig({ ...billConfig, billType: value })
                        }
                      >
                        <SelectTrigger id="billType" className="text-base" data-testid="select-bill-type">
                          <SelectValue placeholder="Select bill type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash-credit">Cash/Credit Bill</SelectItem>
                          <SelectItem value="purchase">Purchase Bill</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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
              <Card className="p-4 sm:p-6 md:p-8 rounded-[15px] sm:rounded-[20px] shadow-xl" data-testid="card-customer">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <User className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Customer Information</h2>
                </div>
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-semibold mb-2 block">
                      Customer Type
                    </Label>
                    <Select 
                      value={isNewCustomer === null ? "" : (isNewCustomer ? "new" : "existing")} 
                      onValueChange={(value) => {
                        setIsNewCustomer(value === "new");
                        if (value === "new") {
                          setSelectedBillingCustomerId("");
                          setCustomerData({
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
                        } else {
                          setSelectedBillingCustomerId("");
                          setCustomerData({
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
                        }
                      }}
                    >
                      <SelectTrigger className="text-base" data-testid="select-customer-type">
                        <SelectValue placeholder="Select new customer or Existing customer" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="existing">Existing Customer</SelectItem>
                        <SelectItem value="new">New Customer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="border-t-2 pt-6">
                    <h3 className="text-xl font-bold mb-4">Billing To</h3>
                    
                    {isNewCustomer === false && (
                      <div>
                        <Label htmlFor="customerSelect" className="text-base font-semibold mb-2 block">
                          Select Customer
                        </Label>
                        <Select value={selectedBillingCustomerId} onValueChange={handleCustomerSelect}>
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

                    {customerData.shopName && !isEditingCustomer && (
                      <div className="mt-4 p-4 bg-muted rounded-lg space-y-2" data-testid="display-billing-info">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="text-lg font-semibold">Customer Details</h4>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsEditingCustomer(true)}
                            className="h-8 w-8 p-0"
                            data-testid="button-edit-customer"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
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
                          {customerData.email && (
                            <div>
                              <p className="text-sm text-muted-foreground">Email</p>
                              <p className="font-semibold">{customerData.email}</p>
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
                          {customerData.postalCode && (
                            <div>
                              <p className="text-sm text-muted-foreground">Postal Code</p>
                              <p className="font-semibold">{customerData.postalCode}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {isEditingCustomer && (
                      <div className="mt-4">
                        <h4 className="text-lg font-semibold mb-4">Edit Customer Details</h4>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="editShopName" className="text-base font-semibold mb-2 block">
                              Shop Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="editShopName"
                              value={customerData.shopName}
                              onChange={(e) =>
                                setCustomerData({ ...customerData, shopName: e.target.value.slice(0, 50) })
                              }
                              placeholder="Enter shop name (required)"
                              className="text-base"
                              maxLength={50}
                              data-testid="input-edit-shop-name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="editCustomerName" className="text-base font-semibold mb-2 block">
                              Customer Name (Optional)
                            </Label>
                            <Input
                              id="editCustomerName"
                              value={customerData.name}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^a-zA-Z\s]/g, '').slice(0, 50);
                                setCustomerData({ ...customerData, name: value });
                              }}
                              placeholder="Enter name (optional)"
                              className="text-base"
                              maxLength={50}
                              data-testid="input-edit-customer-name"
                            />
                          </div>
                          <div>
                            <Label htmlFor="editPhone" className="text-base font-semibold mb-2 block">
                              Phone (Optional)
                            </Label>
                            <Input
                              id="editPhone"
                              type="tel"
                              value={customerData.phone}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                setCustomerData({ ...customerData, phone: value });
                              }}
                              placeholder="Enter phone (optional)"
                              className="text-base"
                              maxLength={10}
                              data-testid="input-edit-phone"
                            />
                          </div>
                          <div>
                            <Label htmlFor="editEmail" className="text-base font-semibold mb-2 block">
                              Email
                            </Label>
                            <Input
                              id="editEmail"
                              type="email"
                              value={customerData.email}
                              onChange={(e) => {
                                setCustomerData({ ...customerData, email: e.target.value });
                              }}
                              placeholder="Enter email (optional)"
                              className="text-base"
                              data-testid="input-edit-email"
                            />
                          </div>
                          <div>
                            <Label htmlFor="editGstin" className="text-base font-semibold mb-2 block">
                              GSTIN {billConfig.gstEnabled && <span className="text-destructive">*</span>}
                            </Label>
                            <Input
                              id="editGstin"
                              value={customerData.gstin}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\s/g, '').slice(0, 15);
                                setCustomerData({ ...customerData, gstin: value });
                              }}
                              placeholder={billConfig.gstEnabled ? "Enter GSTIN (required)" : "Enter GSTIN (optional)"}
                              className="text-base"
                              maxLength={15}
                              data-testid="input-edit-gstin"
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <Label htmlFor="editAddress" className="text-base font-semibold mb-2 block">
                            Address
                          </Label>
                          <Textarea
                            id="editAddress"
                            value={customerData.address}
                            onChange={(e) =>
                              setCustomerData({ ...customerData, address: e.target.value.slice(0, 200) })
                            }
                            placeholder="Enter address (optional)"
                            className="text-base min-h-[80px]"
                            maxLength={200}
                            data-testid="input-edit-address"
                          />
                        </div>
                        <div className="grid md:grid-cols-3 gap-4 mt-4">
                          <div>
                            <Label htmlFor="editCity" className="text-base font-semibold mb-2 block">
                              City <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="editCity"
                              value={customerData.city}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^a-zA-Z\s]/g, '').slice(0, 40);
                                setCustomerData({ ...customerData, city: value });
                              }}
                              placeholder="Enter city (required)"
                              className="text-base"
                              maxLength={40}
                              data-testid="input-edit-city"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="editState" className="text-base font-semibold mb-2 block">
                              State <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="editState"
                              value={customerData.state}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^a-zA-Z\s]/g, '').slice(0, 40);
                                setCustomerData({ ...customerData, state: value });
                              }}
                              placeholder="Enter state (required)"
                              className="text-base"
                              maxLength={40}
                              data-testid="input-edit-state"
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="editPostalCode" className="text-base font-semibold mb-2 block">
                              Postal Code
                            </Label>
                            <Input
                              id="editPostalCode"
                              value={customerData.postalCode}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 15);
                                setCustomerData({ ...customerData, postalCode: value });
                              }}
                              placeholder="Enter postal code (optional)"
                              className="text-base"
                              maxLength={15}
                              data-testid="input-edit-postal-code"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-4">
                          <Button
                            onClick={handleUpdateCustomer}
                            disabled={updateCustomerMutation.isPending || !customerData.shopName.trim() || !customerData.city.trim() || !customerData.state.trim()}
                            className="flex-1 text-base py-6 bg-success hover:bg-success/90 text-success-foreground"
                            data-testid="button-update-customer"
                          >
                            {updateCustomerMutation.isPending ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Updating...
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4 mr-2" />
                                Update Customer
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setIsEditingCustomer(false)}
                            className="text-base py-6"
                            data-testid="button-cancel-edit"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                      </div>
                    )}

                  {isNewCustomer === true && (
                  <div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="shopName" className="text-base font-semibold mb-2 block">
                          Shop Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="shopName"
                          value={customerData.shopName}
                          onChange={(e) =>
                            setCustomerData({ ...customerData, shopName: e.target.value.slice(0, 50) })
                          }
                          placeholder="Enter shop name (required)"
                          className="text-base"
                          maxLength={50}
                          data-testid="input-shop-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="customerName" className="text-base font-semibold mb-2 block">
                          Customer Name (Optional)
                        </Label>
                        <Input
                          id="customerName"
                          value={customerData.name}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^a-zA-Z\s]/g, '').slice(0, 50);
                            setCustomerData({ ...customerData, name: value });
                          }}
                          placeholder="Enter name (optional)"
                          className="text-base"
                          maxLength={50}
                          data-testid="input-customer-name"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone" className="text-base font-semibold mb-2 block">
                          Phone (Optional)
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={customerData.phone}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                            setCustomerData({ ...customerData, phone: value });
                          }}
                          placeholder="Enter phone (optional)"
                          className="text-base"
                          maxLength={10}
                          data-testid="input-phone"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" className="text-base font-semibold mb-2 block">
                          Email
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          value={customerData.email}
                          onChange={(e) => {
                            setCustomerData({ ...customerData, email: e.target.value });
                          }}
                          placeholder="Enter email (optional)"
                          className="text-base"
                          data-testid="input-email"
                        />
                      </div>
                      <div>
                        <Label htmlFor="gstin" className="text-base font-semibold mb-2 block">
                          GSTIN {billConfig.gstEnabled && <span className="text-destructive">*</span>}
                        </Label>
                        <Input
                          id="gstin"
                          value={customerData.gstin}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\s/g, '').slice(0, 15);
                            setCustomerData({ ...customerData, gstin: value });
                          }}
                          placeholder={billConfig.gstEnabled ? "Enter GSTIN (required)" : "Enter GSTIN (optional)"}
                          className="text-base"
                          maxLength={15}
                          data-testid="input-gstin"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <Label htmlFor="address" className="text-base font-semibold mb-2 block">
                        Address
                      </Label>
                      <Textarea
                        id="address"
                        value={customerData.address}
                        onChange={(e) =>
                          setCustomerData({ ...customerData, address: e.target.value.slice(0, 200) })
                        }
                        placeholder="Enter address (optional)"
                        className="text-base min-h-[80px]"
                        maxLength={200}
                        data-testid="input-address"
                      />
                    </div>
                    <div className="grid md:grid-cols-3 gap-4 mt-4">
                      <div>
                        <Label htmlFor="city" className="text-base font-semibold mb-2 block">
                          City <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="city"
                          value={customerData.city}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^a-zA-Z\s]/g, '').slice(0, 40);
                            setCustomerData({ ...customerData, city: value });
                          }}
                          placeholder="Enter city (required)"
                          className="text-base"
                          maxLength={40}
                          data-testid="input-city"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="state" className="text-base font-semibold mb-2 block">
                          State <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="state"
                          value={customerData.state}
                          onChange={(e) => {
                            const value = e.target.value.replace(/[^a-zA-Z\s]/g, '').slice(0, 40);
                            setCustomerData({ ...customerData, state: value });
                          }}
                          placeholder="Enter state (required)"
                          className="text-base"
                          maxLength={40}
                          data-testid="input-state"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="postalCode" className="text-base font-semibold mb-2 block">
                          Postal Code
                        </Label>
                        <Input
                          id="postalCode"
                          value={customerData.postalCode}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 15);
                            setCustomerData({ ...customerData, postalCode: value });
                          }}
                          placeholder="Enter postal code (optional)"
                          className="text-base"
                          maxLength={15}
                          data-testid="input-postal-code"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={handleSaveCustomer}
                      disabled={saveCustomerMutation.isPending || !customerData.shopName.trim() || !customerData.city.trim() || !customerData.state.trim()}
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
                        onCheckedChange={(checked) => {
                          setSameAsBinding(checked as boolean);
                          // When checked, immediately copy billing data to shipping
                          if (checked) {
                            setShippingData({
                              id: customerData.id,
                              name: customerData.name,
                              shopName: customerData.shopName,
                              phone: customerData.phone,
                              email: customerData.email,
                              gstin: customerData.gstin,
                              address: customerData.address,
                              city: customerData.city,
                              state: customerData.state,
                              postalCode: customerData.postalCode,
                            });
                          } else {
                            // When unchecked, clear shipping data completely
                            setSelectedShippingCustomerId("");
                            setShippingData({
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
                            setIsNewShippingCustomer(null);
                            setIsEditingShippingCustomer(false);
                          }
                        }}
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
                            value={isNewShippingCustomer === null ? "" : (isNewShippingCustomer ? "new" : "existing")} 
                            onValueChange={(value) => {
                              setIsNewShippingCustomer(value === "new");
                              if (value === "new") {
                                setSelectedShippingCustomerId("");
                                setShippingData({
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
                              } else {
                                setSelectedShippingCustomerId("");
                                setShippingData({
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
                              }
                            }}
                          >
                            <SelectTrigger className="text-base" data-testid="select-shipping-customer-type">
                              <SelectValue placeholder="Select new customer or Existing customer" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="existing">Existing Customer</SelectItem>
                              <SelectItem value="new">New Customer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {isNewShippingCustomer === false && (
                          <div className="mb-4">
                            <Label htmlFor="shippingCustomerSelect" className="text-base font-semibold mb-2 block">
                              Select Customer
                            </Label>
                            <Select value={selectedShippingCustomerId} onValueChange={(customerId) => {
                              const customer = customers.find((c) => c.id === customerId);
                              if (customer) {
                                setSelectedShippingCustomerId(customerId);
                                setShippingData({
                                  id: customer.id,
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

                        {isNewShippingCustomer === false && shippingData.shopName && !isEditingShippingCustomer && (
                          <div className="mb-4 p-4 bg-muted rounded-lg space-y-2" data-testid="display-shipping-info">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="text-lg font-semibold">Shipping Customer Details</h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsEditingShippingCustomer(true)}
                                className="h-8 w-8 p-0"
                                data-testid="button-edit-shipping-customer"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </div>
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
                              {shippingData.email && (
                                <div>
                                  <p className="text-sm text-muted-foreground">Email</p>
                                  <p className="font-semibold">{shippingData.email}</p>
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
                              {shippingData.postalCode && (
                                <div>
                                  <p className="text-sm text-muted-foreground">Postal Code</p>
                                  <p className="font-semibold">{shippingData.postalCode}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {isEditingShippingCustomer && (
                          <div className="mb-4">
                            <h4 className="text-lg font-semibold mb-4">Edit Shipping Customer Details</h4>
                            <div className="grid md:grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="editShippingShopName" className="text-base font-semibold mb-2 block">
                                  Shop Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                  id="editShippingShopName"
                                  value={shippingData.shopName}
                                  onChange={(e) =>
                                    setShippingData({ ...shippingData, shopName: e.target.value.slice(0, 50) })
                                  }
                                  placeholder="Enter shop name (required)"
                                  className="text-base"
                                  maxLength={50}
                                  data-testid="input-edit-shipping-shop-name"
                                />
                              </div>
                              <div>
                                <Label htmlFor="editShippingCustomerName" className="text-base font-semibold mb-2 block">
                                  Customer Name (Optional)
                                </Label>
                                <Input
                                  id="editShippingCustomerName"
                                  value={shippingData.name}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^a-zA-Z\s]/g, '').slice(0, 50);
                                    setShippingData({ ...shippingData, name: value });
                                  }}
                                  placeholder="Enter name (optional)"
                                  className="text-base"
                                  maxLength={50}
                                  data-testid="input-edit-shipping-customer-name"
                                />
                              </div>
                              <div>
                                <Label htmlFor="editShippingPhone" className="text-base font-semibold mb-2 block">
                                  Phone (Optional)
                                </Label>
                                <Input
                                  id="editShippingPhone"
                                  type="tel"
                                  value={shippingData.phone}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                    setShippingData({ ...shippingData, phone: value });
                                  }}
                                  placeholder="Enter phone (optional)"
                                  className="text-base"
                                  maxLength={10}
                                  data-testid="input-edit-shipping-phone"
                                />
                              </div>
                              <div>
                                <Label htmlFor="editShippingEmail" className="text-base font-semibold mb-2 block">
                                  Email
                                </Label>
                                <Input
                                  id="editShippingEmail"
                                  type="email"
                                  value={shippingData.email}
                                  onChange={(e) => {
                                    setShippingData({ ...shippingData, email: e.target.value });
                                  }}
                                  placeholder="Enter email (optional)"
                                  className="text-base"
                                  data-testid="input-edit-shipping-email"
                                />
                              </div>
                              <div>
                                <Label htmlFor="editShippingGstin" className="text-base font-semibold mb-2 block">
                                  GSTIN {billConfig.gstEnabled && <span className="text-destructive">*</span>}
                                </Label>
                                <Input
                                  id="editShippingGstin"
                                  value={shippingData.gstin}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/\s/g, '').slice(0, 15);
                                    setShippingData({ ...shippingData, gstin: value });
                                  }}
                                  placeholder={billConfig.gstEnabled ? "Enter GSTIN (required)" : "Enter GSTIN (optional)"}
                                  className="text-base"
                                  maxLength={15}
                                  data-testid="input-edit-shipping-gstin"
                                />
                              </div>
                            </div>
                            <div className="mt-4">
                              <Label htmlFor="editShippingAddress" className="text-base font-semibold mb-2 block">
                                Address
                              </Label>
                              <Textarea
                                id="editShippingAddress"
                                value={shippingData.address}
                                onChange={(e) =>
                                  setShippingData({ ...shippingData, address: e.target.value.slice(0, 200) })
                                }
                                placeholder="Enter address (optional)"
                                className="text-base min-h-[80px]"
                                maxLength={200}
                                data-testid="input-edit-shipping-address"
                              />
                            </div>
                            <div className="grid md:grid-cols-3 gap-4 mt-4">
                              <div>
                                <Label htmlFor="editShippingCity" className="text-base font-semibold mb-2 block">
                                  City <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                  id="editShippingCity"
                                  value={shippingData.city}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^a-zA-Z\s]/g, '').slice(0, 40);
                                    setShippingData({ ...shippingData, city: value });
                                  }}
                                  placeholder="Enter city (required)"
                                  className="text-base"
                                  maxLength={40}
                                  data-testid="input-edit-shipping-city"
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="editShippingState" className="text-base font-semibold mb-2 block">
                                  State <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                  id="editShippingState"
                                  value={shippingData.state}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/[^a-zA-Z\s]/g, '').slice(0, 40);
                                    setShippingData({ ...shippingData, state: value });
                                  }}
                                  placeholder="Enter state (required)"
                                  className="text-base"
                                  maxLength={40}
                                  data-testid="input-edit-shipping-state"
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="editShippingPostalCode" className="text-base font-semibold mb-2 block">
                                  Postal Code
                                </Label>
                                <Input
                                  id="editShippingPostalCode"
                                  value={shippingData.postalCode}
                                  onChange={(e) => {
                                    const value = e.target.value.replace(/\D/g, '').slice(0, 15);
                                    setShippingData({ ...shippingData, postalCode: value });
                                  }}
                                  placeholder="Enter postal code (optional)"
                                  className="text-base"
                                  maxLength={15}
                                  data-testid="input-edit-shipping-postal-code"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2 mt-4">
                              <Button
                                onClick={handleUpdateShippingCustomer}
                                disabled={updateCustomerMutation.isPending || !shippingData.shopName.trim() || !shippingData.city.trim() || !shippingData.state.trim()}
                                className="flex-1 text-base py-6 bg-success hover:bg-success/90 text-success-foreground"
                                data-testid="button-update-shipping-customer"
                              >
                                {updateCustomerMutation.isPending ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Updating...
                                  </>
                                ) : (
                                  <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Update Shipping Customer
                                  </>
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => setIsEditingShippingCustomer(false)}
                                className="text-base py-6"
                                data-testid="button-cancel-edit-shipping"
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        )}

                        {isNewShippingCustomer === true && (
                        <>
                        <div className="grid md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="shippingShopName" className="text-base font-semibold mb-2 block">
                              Shop Name <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="shippingShopName"
                              value={shippingData.shopName}
                              onChange={(e) =>
                                setShippingData({ ...shippingData, shopName: e.target.value.slice(0, 50) })
                              }
                              placeholder="Enter shop name (required)"
                              className="text-base"
                              maxLength={50}
                            />
                          </div>
                          <div>
                            <Label htmlFor="shippingCustomerName" className="text-base font-semibold mb-2 block">
                              Customer Name (Optional)
                            </Label>
                            <Input
                              id="shippingCustomerName"
                              value={shippingData.name}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^a-zA-Z\s]/g, '').slice(0, 50);
                                setShippingData({ ...shippingData, name: value });
                              }}
                              placeholder="Enter name (optional)"
                              className="text-base"
                              maxLength={50}
                            />
                          </div>
                          <div>
                            <Label htmlFor="shippingPhone" className="text-base font-semibold mb-2 block">
                              Phone (Optional)
                            </Label>
                            <Input
                              id="shippingPhone"
                              type="tel"
                              value={shippingData.phone}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                                setShippingData({ ...shippingData, phone: value });
                              }}
                              placeholder="Enter phone (optional)"
                              className="text-base"
                              maxLength={10}
                            />
                          </div>
                          <div>
                            <Label htmlFor="shippingEmail" className="text-base font-semibold mb-2 block">
                              Email
                            </Label>
                            <Input
                              id="shippingEmail"
                              type="email"
                              value={shippingData.email}
                              onChange={(e) => {
                                setShippingData({ ...shippingData, email: e.target.value });
                              }}
                              placeholder="Enter email (optional)"
                              className="text-base"
                              data-testid="input-shipping-email"
                            />
                          </div>
                          <div>
                            <Label htmlFor="shippingGstin" className="text-base font-semibold mb-2 block">
                              GSTIN {billConfig.gstEnabled && <span className="text-destructive">*</span>}
                            </Label>
                            <Input
                              id="shippingGstin"
                              value={shippingData.gstin}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\s/g, '').slice(0, 15);
                                setShippingData({ ...shippingData, gstin: value });
                              }}
                              placeholder={billConfig.gstEnabled ? "Enter GSTIN (required)" : "Enter GSTIN (optional)"}
                              className="text-base"
                              maxLength={15}
                            />
                          </div>
                        </div>
                        <div className="mt-4">
                          <Label htmlFor="shippingAddress" className="text-base font-semibold mb-2 block">
                            Address
                          </Label>
                          <Textarea
                            id="shippingAddress"
                            value={shippingData.address}
                            onChange={(e) =>
                              setShippingData({ ...shippingData, address: e.target.value.slice(0, 200) })
                            }
                            placeholder="Enter address (optional)"
                            className="text-base min-h-[80px]"
                            maxLength={200}
                          />
                        </div>
                        <div className="grid md:grid-cols-3 gap-4 mt-4">
                          <div>
                            <Label htmlFor="shippingCity" className="text-base font-semibold mb-2 block">
                              City <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="shippingCity"
                              value={shippingData.city}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^a-zA-Z\s]/g, '').slice(0, 40);
                                setShippingData({ ...shippingData, city: value });
                              }}
                              placeholder="Enter city (required)"
                              className="text-base"
                              maxLength={40}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="shippingState" className="text-base font-semibold mb-2 block">
                              State <span className="text-destructive">*</span>
                            </Label>
                            <Input
                              id="shippingState"
                              value={shippingData.state}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^a-zA-Z\s]/g, '').slice(0, 40);
                                setShippingData({ ...shippingData, state: value });
                              }}
                              placeholder="Enter state (required)"
                              className="text-base"
                              maxLength={40}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="shippingPostalCode" className="text-base font-semibold mb-2 block">
                              Postal Code
                            </Label>
                            <Input
                              id="shippingPostalCode"
                              value={shippingData.postalCode}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '').slice(0, 15);
                                setShippingData({ ...shippingData, postalCode: value });
                              }}
                              placeholder="Enter postal code (optional)"
                              className="text-base"
                              maxLength={15}
                            />
                          </div>
                        </div>
                        <Button
                          onClick={() => {
                            const nameRegex = /^[a-zA-Z\s]+$/;
                            const shopNameRegex = /^[a-zA-Z0-9\s]+$/;
                            const phoneRegex = /^\d{10}$/;
                            const gstinRegex = /^[a-zA-Z0-9]+$/;
                            
                            // Validate shop name (required)
                            if (!shippingData.shopName.trim()) {
                              toast({
                                title: "Validation Error",
                                description: "Shop name is required",
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            if (!shopNameRegex.test(shippingData.shopName.trim())) {
                              toast({
                                title: "Validation Error",
                                description: "Shop name can only contain letters and numbers",
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            // Validate customer name (optional)
                            if (shippingData.name.trim() && !nameRegex.test(shippingData.name.trim())) {
                              toast({
                                title: "Validation Error",
                                description: "Customer name must contain only letters",
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
                            
                            // Validate city (required)
                            if (!shippingData.city.trim()) {
                              toast({
                                title: "Validation Error",
                                description: "City is required",
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            if (!nameRegex.test(shippingData.city.trim())) {
                              toast({
                                title: "Validation Error",
                                description: "City must contain only letters",
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            // Validate state (required)
                            if (!shippingData.state.trim()) {
                              toast({
                                title: "Validation Error",
                                description: "State is required",
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            if (!nameRegex.test(shippingData.state.trim())) {
                              toast({
                                title: "Validation Error",
                                description: "State must contain only letters",
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            saveCustomerMutation.mutate(shippingData);
                          }}
                          disabled={saveCustomerMutation.isPending || !shippingData.shopName.trim() || !shippingData.city.trim() || !shippingData.state.trim()}
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

                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6">
                    <Button
                      variant="secondary"
                      onClick={() => setCurrentStep(1)}
                      className="w-full sm:flex-1 text-sm sm:text-base py-4 sm:py-6"
                      data-testid="button-back-config"
                    >
                      ← Back
                    </Button>
                    <Button
                      onClick={() => setCurrentStep(3)}
                      disabled={!canProceedFromCustomer}
                      className="w-full sm:flex-1 text-sm sm:text-base py-4 sm:py-6"
                      data-testid="button-next-products"
                    >
                      Next: Products →
                    </Button>
                  </div>
                </div>
              </Card>
            )}

            {currentStep === 3 && (
              <Card className="p-4 sm:p-6 md:p-8 rounded-[15px] sm:rounded-[20px] shadow-xl" data-testid="card-products">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <Package className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Add Products</h2>
                </div>
                {productsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <span className="ml-3 text-lg">Loading products...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mb-6">
                    {products.map((product) => {
                      const gstRate = parseFloat(product.gstRate || "0");
                      const hasGST = gstRate > 0;
                      const isWeightBased = product.unit.toLowerCase() === "kg";
                      return (
                      <Card
                        key={product.id}
                        className="p-3 sm:p-4 rounded-xl transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-primary border-2 cursor-pointer relative"
                        onClick={() => handleAddProduct(product)}
                        data-testid={`card-product-${product.id}`}
                      >
                        {hasGST ? (
                          <div className="absolute top-2 right-2 flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-1.5 py-0.5 rounded-full text-[10px] font-semibold">
                            <Star className="w-2.5 h-2.5 fill-current" />
                            <span>{gstRate}%</span>
                          </div>
                        ) : (
                          <div className="absolute top-2 right-2 flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full text-[10px] font-semibold">
                            <Circle className="w-2.5 h-2.5 fill-current" />
                            <span>0%</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5 mb-1.5">
                          {isWeightBased ? (
                            <div className="flex items-center gap-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded-full text-[10px] font-semibold">
                              <Weight className="w-2.5 h-2.5" />
                              <span>Kg</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-1.5 py-0.5 rounded-full text-[10px] font-semibold">
                              <Hash className="w-2.5 h-2.5" />
                              <span>Qty</span>
                            </div>
                          )}
                          <h3 className="font-bold text-sm sm:text-base pr-12 line-clamp-1">{product.name}</h3>
                        </div>
                        {product.description && (
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                            {product.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs sm:text-sm">
                          <span className="text-muted-foreground">HSN: {product.hsn}</span>
                          <span className="font-bold text-primary">
                            ₹{parseFloat(product.defaultPrice).toFixed(2)}/{product.unit}
                          </span>
                        </div>
                      </Card>
                      );
                    })}
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <Button
                    variant="secondary"
                    onClick={() => setCurrentStep(2)}
                    className="w-full sm:flex-1 text-sm sm:text-base py-4 sm:py-6"
                    data-testid="button-back-customer"
                  >
                    ← Back
                  </Button>
                  <Button
                    onClick={() => setCurrentStep(4)}
                    disabled={!canProceedFromProducts}
                    className="w-full sm:flex-1 text-sm sm:text-base py-4 sm:py-6"
                    data-testid="button-next-review"
                  >
                    Next: Review →
                  </Button>
                </div>
              </Card>
            )}

            {currentStep === 4 && (
              <Card className="p-4 sm:p-6 md:p-8 rounded-[15px] sm:rounded-[20px] shadow-xl" data-testid="card-review">
                <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                  <FileCheck className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">Additional Charges & Review</h2>
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
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <Button
                      variant="secondary"
                      onClick={() => setCurrentStep(3)}
                      className="w-full sm:flex-[2] text-sm sm:text-base py-4 sm:py-6"
                      data-testid="button-back-products"
                    >
                      ← Back
                    </Button>
                    <Button
                      onClick={handleGeneratePDF}
                      disabled={createInvoiceMutation.isPending || !canGeneratePDF}
                      className="w-full sm:flex-[3] text-sm sm:text-base py-4 sm:py-6 bg-success hover:bg-success/90 text-success-foreground"
                      data-testid="button-generate-pdf"
                    >
                      {createInvoiceMutation.isPending ? (
                        <>
                          <Loader2 className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 animate-spin" />
                          <span className="hidden sm:inline">Generating...</span>
                          <span className="sm:hidden">Generating PDF...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                          <span className="hidden sm:inline">Generate & Download PDF</span>
                          <span className="sm:hidden">Download PDF</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>

          <div className="w-full">
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
    </div>
  );
}
