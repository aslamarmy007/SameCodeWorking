import jsPDF from "jspdf";

interface InvoiceData {
  invoiceNumber: string;
  billDate: string;
  customer: {
    name: string;
    shopName: string;
    phone: string;
    gstin: string;
    address: string;
    city: string;
    state: string;
  };
  items: Array<{
    productName: string;
    hsn: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  transport: number;
  packaging: number;
  other: number;
  gstAmount: number;
  grandTotal: number;
  lorryNumber: string;
}

export function generateInvoicePDF(data: InvoiceData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Company header
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("AYESHA Coco Pith", pageWidth / 2, yPos, { align: "center" });
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Premium Coir Products", pageWidth / 2, yPos, { align: "center" });
  yPos += 5;
  doc.text("123 Garden Street, Chennai - 600001", pageWidth / 2, yPos, { align: "center" });
  yPos += 5;
  doc.text("Phone: +91 98765 43210 | Email: info@ayeshacoco.com", pageWidth / 2, yPos, { align: "center" });
  yPos += 10;

  // Border line
  doc.setLineWidth(0.5);
  doc.line(15, yPos, pageWidth - 15, yPos);
  yPos += 8;

  // Invoice details
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`Invoice No: ${data.invoiceNumber}`, 15, yPos);
  doc.text(`Date: ${data.billDate}`, pageWidth - 15, yPos, { align: "right" });
  yPos += 10;

  // Customer details box
  doc.rect(15, yPos, pageWidth - 30, 35);
  yPos += 6;
  doc.setFont("helvetica", "bold");
  doc.text("Bill To:", 18, yPos);
  yPos += 5;
  doc.setFont("helvetica", "normal");
  doc.text(`Customer: ${data.customer.name}`, 18, yPos);
  yPos += 5;
  if (data.customer.shopName) {
    doc.text(`Shop: ${data.customer.shopName}`, 18, yPos);
    yPos += 5;
  }
  doc.text(`Phone: ${data.customer.phone}`, 18, yPos);
  yPos += 5;
  if (data.customer.gstin) {
    doc.text(`GSTIN: ${data.customer.gstin}`, 18, yPos);
    yPos += 5;
  }
  if (data.customer.address) {
    doc.text(`Address: ${data.customer.address}, ${data.customer.city}, ${data.customer.state}`, 18, yPos);
  }
  yPos += 15;

  // Table header
  const startY = yPos;
  doc.setFillColor(230, 230, 230);
  doc.rect(15, yPos, pageWidth - 30, 8, "F");
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("S.No", 18, yPos + 5);
  doc.text("Description", 35, yPos + 5);
  doc.text("HSN", 100, yPos + 5);
  doc.text("Qty", 125, yPos + 5, { align: "right" });
  doc.text("Rate", 145, yPos + 5, { align: "right" });
  doc.text("Amount", pageWidth - 20, yPos + 5, { align: "right" });
  yPos += 8;

  // Table items
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  data.items.forEach((item, index) => {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.text(String(index + 1), 18, yPos + 5);
    doc.text(item.productName, 35, yPos + 5);
    doc.text(item.hsn, 100, yPos + 5);
    doc.text(String(item.quantity), 125, yPos + 5, { align: "right" });
    doc.text(item.price.toFixed(2), 145, yPos + 5, { align: "right" });
    doc.text(item.total.toFixed(2), pageWidth - 20, yPos + 5, { align: "right" });
    
    yPos += 7;
    doc.line(15, yPos, pageWidth - 15, yPos);
    yPos += 1;
  });

  yPos += 10;

  // Totals section
  const totalsX = pageWidth - 80;
  doc.setFont("helvetica", "bold");
  doc.text("Subtotal:", totalsX, yPos);
  doc.text(`₹${data.subtotal.toFixed(2)}`, pageWidth - 20, yPos, { align: "right" });
  yPos += 6;

  if (data.transport > 0) {
    doc.setFont("helvetica", "normal");
    doc.text("Transport:", totalsX, yPos);
    doc.text(`₹${data.transport.toFixed(2)}`, pageWidth - 20, yPos, { align: "right" });
    yPos += 6;
  }

  if (data.packaging > 0) {
    doc.text("Packaging:", totalsX, yPos);
    doc.text(`₹${data.packaging.toFixed(2)}`, pageWidth - 20, yPos, { align: "right" });
    yPos += 6;
  }

  if (data.other > 0) {
    doc.text("Other Charges:", totalsX, yPos);
    doc.text(`₹${data.other.toFixed(2)}`, pageWidth - 20, yPos, { align: "right" });
    yPos += 6;
  }

  if (data.gstAmount > 0) {
    doc.setFont("helvetica", "bold");
    doc.text("GST (18%):", totalsX, yPos);
    doc.text(`₹${data.gstAmount.toFixed(2)}`, pageWidth - 20, yPos, { align: "right" });
    yPos += 8;
  }

  doc.setLineWidth(0.5);
  doc.line(totalsX, yPos, pageWidth - 15, yPos);
  yPos += 6;

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("Grand Total:", totalsX, yPos);
  doc.text(`₹${data.grandTotal.toFixed(2)}`, pageWidth - 20, yPos, { align: "right" });

  if (data.lorryNumber) {
    yPos += 15;
    doc.setFontSize(10);
    doc.text(`Lorry/Vehicle No: ${data.lorryNumber}`, 15, yPos);
  }

  // Footer
  yPos = doc.internal.pageSize.getHeight() - 30;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Terms & Conditions:", 15, yPos);
  yPos += 5;
  doc.setFontSize(8);
  doc.text("1. Payment due within 30 days", 15, yPos);
  yPos += 4;
  doc.text("2. Goods once sold cannot be returned", 15, yPos);
  yPos += 10;
  doc.setFont("helvetica", "bold");
  doc.text("Authorized Signature", pageWidth - 15, yPos, { align: "right" });

  // Save PDF
  doc.save(`Invoice-${data.invoiceNumber}.pdf`);
}
