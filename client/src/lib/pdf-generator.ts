import jsPDF from "jspdf";
import logoImage from "@assets/cocologo_1761383042737.png";

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
    postalCode: string;
  };
  shipping: {
    name: string;
    shopName: string;
    phone: string;
    gstin: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
  };
  items: Array<{
    productName: string;
    hsn: string;
    quantity: number;
    price: number;
    total: number;
    gstRate: number;
    gstAmount: number;
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
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = 18;

  // Professional border around the page
  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.5);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // Header section with logo, center details, and CASH/CREDIT BILL
  // Logo on the left
  const logoWidth = 25;
  const logoHeight = 25;
  doc.addImage(logoImage, 'PNG', margin, yPos - 5, logoWidth, logoHeight);

  // Center company details - all caps and center aligned
  const centerStartY = yPos;
  doc.setFontSize(28);
  doc.setTextColor(0, 0, 0);
  doc.setFont("times", "bold");
  doc.text("AYESHA", pageWidth / 2, centerStartY, { align: "center" });
  
  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.text("SF NO. 460 - 2B1 - 460, 1473, UDALYAR STREET, NEMMAKKOTTAI,", pageWidth / 2, centerStartY + 6, { align: "center" });
  doc.text("ALANGUDI - 622 301, PUDUKKOTTAI DIST.", pageWidth / 2, centerStartY + 10, { align: "center" });

  // CASH/CREDIT BILL box on the right with double border
  const billBoxWidth = 30;
  const billBoxHeight = 8;
  const billBoxX = pageWidth - margin - billBoxWidth;
  const billBoxY = yPos - 1;
  
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.roundedRect(billBoxX, billBoxY, billBoxWidth, billBoxHeight, 2, 2, 'S');
  doc.roundedRect(billBoxX + 1, billBoxY + 1, billBoxWidth - 2, billBoxHeight - 2, 2, 2, 'S');
  
  doc.setFontSize(7);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("CASH/CREDIT BILL", billBoxX + billBoxWidth / 2, billBoxY + 5.5, { align: "center" });

  yPos += 28;

  // Thick separator line
  doc.setDrawColor(52, 73, 94);
  doc.setLineWidth(0.8);
  doc.line(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // Invoice title and details in a box
  doc.setFillColor(52, 73, 94);
  doc.rect(margin, yPos, pageWidth - (2 * margin), 11, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text("TAX INVOICE", margin + 4, yPos + 7.5);
  
  doc.setFontSize(10);
  doc.text("Invoice No: " + data.invoiceNumber, pageWidth - margin - 4, yPos + 7.5, { align: "right" });
  yPos += 16;

  // Date - positioned properly within margins
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  const formattedDate = new Date(data.billDate).toLocaleDateString('en-IN', { 
    day: '2-digit', 
    month: 'short', 
    year: 'numeric' 
  });
  doc.text("Date: " + formattedDate, pageWidth - margin - 4, yPos, { align: "right" });
  yPos += 5;

  // Customer details boxes - Bill To and Ship To side by side
  const boxWidth = (pageWidth - (2 * margin) - 4) / 2; // 4mm gap between boxes
  const boxHeight = 36;
  const leftBoxX = margin;
  const rightBoxX = margin + boxWidth + 4;
  
  // BILL TO Box
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.rect(leftBoxX, yPos, boxWidth, boxHeight);
  
  // "Bill To" header with background
  doc.setFillColor(240, 240, 240);
  doc.rect(leftBoxX, yPos, boxWidth, 7, "F");
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(52, 73, 94);
  doc.text("BILL TO:", leftBoxX + 3, yPos + 5);
  
  let billToY = yPos + 13;
  
  if (data.customer.shopName) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(data.customer.shopName, leftBoxX + 3, billToY);
    billToY += 4.5;
  }
  
  if (data.customer.name) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(data.customer.name, leftBoxX + 3, billToY);
    billToY += 4.5;
  }
  
  if (data.customer.address || data.customer.city || data.customer.state) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    const addressParts = [data.customer.address, data.customer.city, data.customer.state].filter(Boolean);
    const addressText = addressParts.join(", ");
    const splitAddress = doc.splitTextToSize(addressText, boxWidth - 6);
    doc.text(splitAddress, leftBoxX + 3, billToY);
    billToY += (splitAddress.length * 4);
  }
  
  if (data.customer.phone) {
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Ph: ", leftBoxX + 3, billToY);
    doc.setFont("helvetica", "normal");
    doc.text(data.customer.phone, leftBoxX + 3 + doc.getTextWidth("Ph: "), billToY);
    billToY += 4;
  }
  
  if (data.customer.gstin) {
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("GSTIN: ", leftBoxX + 3, billToY);
    doc.setFont("helvetica", "normal");
    doc.text(data.customer.gstin, leftBoxX + 3 + doc.getTextWidth("GSTIN: "), billToY);
  }
  
  // SHIP TO Box
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.rect(rightBoxX, yPos, boxWidth, boxHeight);
  
  // "Ship To" header with background
  doc.setFillColor(240, 240, 240);
  doc.rect(rightBoxX, yPos, boxWidth, 7, "F");
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(52, 73, 94);
  doc.text("SHIP TO:", rightBoxX + 3, yPos + 5);
  
  let shipToY = yPos + 13;
  
  if (data.shipping.shopName) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(data.shipping.shopName, rightBoxX + 3, shipToY);
    shipToY += 4.5;
  }
  
  if (data.shipping.name) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text(data.shipping.name, rightBoxX + 3, shipToY);
    shipToY += 4.5;
  }
  
  if (data.shipping.address || data.shipping.city || data.shipping.state) {
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    const addressParts = [data.shipping.address, data.shipping.city, data.shipping.state].filter(Boolean);
    const addressText = addressParts.join(", ");
    const splitAddress = doc.splitTextToSize(addressText, boxWidth - 6);
    doc.text(splitAddress, rightBoxX + 3, shipToY);
    shipToY += (splitAddress.length * 4);
  }
  
  if (data.shipping.phone) {
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Ph: ", rightBoxX + 3, shipToY);
    doc.setFont("helvetica", "normal");
    doc.text(data.shipping.phone, rightBoxX + 3 + doc.getTextWidth("Ph: "), shipToY);
    shipToY += 4;
  }
  
  if (data.shipping.gstin) {
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("GSTIN: ", rightBoxX + 3, shipToY);
    doc.setFont("helvetica", "normal");
    doc.text(data.shipping.gstin, rightBoxX + 3 + doc.getTextWidth("GSTIN: "), shipToY);
  }
  
  yPos += boxHeight + 4;

  // Items table with professional styling
  const tableStartY = yPos;
  
  // Table header
  doc.setFillColor(52, 73, 94);
  doc.rect(margin, yPos, pageWidth - (2 * margin), 9, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  
  const col1 = margin + 3;
  const col2 = margin + 15;
  const col3 = pageWidth / 2 + 5;
  const col4 = pageWidth / 2 + 30;
  const col5 = pageWidth / 2 + 50;
  const col6 = pageWidth - margin - 3;
  
  doc.text("S.No", col1, yPos + 6);
  doc.text("Description", col2, yPos + 6);
  doc.text("HSN", col3, yPos + 6);
  doc.text("Qty/Kg", col4, yPos + 6, { align: "center" });
  doc.text("Rate", col5, yPos + 6, { align: "right" });
  doc.text("Amount", col6, yPos + 6, { align: "right" });
  yPos += 9;

  // Table items
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  
  data.items.forEach((item, index) => {
    // Check if we need a new page
    if (yPos > pageHeight - 80) {
      doc.addPage();
      yPos = 20;
      
      // Redraw table header on new page
      doc.setFillColor(52, 73, 94);
      doc.rect(margin, yPos, pageWidth - (2 * margin), 9, "F");
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text("S.No", col1, yPos + 6);
      doc.text("Description", col2, yPos + 6);
      doc.text("HSN", col3, yPos + 6);
      doc.text("Qty/Kg", col4, yPos + 6, { align: "center" });
      doc.text("Rate", col5, yPos + 6, { align: "right" });
      doc.text("Amount", col6, yPos + 6, { align: "right" });
      yPos += 9;
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
    }

    // Alternate row colors
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(margin, yPos, pageWidth - (2 * margin), 7, "F");
    }

    doc.text(String(index + 1), col1, yPos + 5);
    doc.text(item.productName, col2, yPos + 5);
    doc.text(item.hsn, col3, yPos + 5);
    doc.text(String(item.quantity), col4, yPos + 5, { align: "center" });
    doc.text(item.price.toFixed(2), col5, yPos + 5, { align: "right" });
    doc.text(item.total.toFixed(2), col6, yPos + 5, { align: "right" });
    
    yPos += 7;
    
    // Light separator line
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.1);
    doc.line(margin, yPos, pageWidth - margin, yPos);
  });

  yPos += 6;

  // Totals section with professional styling
  const totalsBoxX = pageWidth - 80;
  const totalsBoxWidth = 65;
  
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  
  // Subtotal
  doc.text("Subtotal:", totalsBoxX, yPos);
  doc.text("Rs. " + data.subtotal.toFixed(2), pageWidth - margin - 3, yPos, { align: "right" });
  yPos += 5.5;

  // Additional charges
  if (data.transport > 0) {
    doc.text("Transport:", totalsBoxX, yPos);
    doc.text("Rs. " + data.transport.toFixed(2), pageWidth - margin - 3, yPos, { align: "right" });
    yPos += 5.5;
  }

  if (data.packaging > 0) {
    doc.text("Packaging:", totalsBoxX, yPos);
    doc.text("Rs. " + data.packaging.toFixed(2), pageWidth - margin - 3, yPos, { align: "right" });
    yPos += 5.5;
  }

  if (data.other > 0) {
    doc.text("Other Charges:", totalsBoxX, yPos);
    doc.text("Rs. " + data.other.toFixed(2), pageWidth - margin - 3, yPos, { align: "right" });
    yPos += 5.5;
  }

  // GST - Split into SGST and CGST (half of total GST each)
  const allGstRates = Array.from(new Set(data.items.map(item => item.gstRate)));
  if (allGstRates.length > 0) {
    const sortedRates = allGstRates.sort((a, b) => a - b);
    
    // Filter out 0% unless all rates are 0%
    const nonZeroRates = sortedRates.filter(rate => rate > 0);
    const ratesToShow = nonZeroRates.length > 0 ? nonZeroRates : sortedRates;
    const sgstCgstRates = ratesToShow.map(rate => rate / 2);
    const halfGstAmount = data.gstAmount / 2;
    
    doc.setFont("helvetica", "bold");
    
    // SGST
    if (sgstCgstRates.length === 1) {
      doc.text(`SGST (${sgstCgstRates[0]}%):`, totalsBoxX, yPos);
    } else {
      doc.text(`SGST (${sgstCgstRates.join('%, ')}%):`, totalsBoxX, yPos);
    }
    doc.text("Rs. " + halfGstAmount.toFixed(2), pageWidth - margin - 3, yPos, { align: "right" });
    yPos += 5.5;
    
    // CGST
    if (sgstCgstRates.length === 1) {
      doc.text(`CGST (${sgstCgstRates[0]}%):`, totalsBoxX, yPos);
    } else {
      doc.text(`CGST (${sgstCgstRates.join('%, ')}%):`, totalsBoxX, yPos);
    }
    doc.text("Rs. " + halfGstAmount.toFixed(2), pageWidth - margin - 3, yPos, { align: "right" });
    yPos += 6.5;
  }

  // Grand total box
  doc.setFillColor(52, 73, 94);
  doc.rect(totalsBoxX - 2, yPos - 2, totalsBoxWidth + 2, 9, "F");
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("Grand Total:", totalsBoxX, yPos + 4.5);
  doc.text("Rs. " + data.grandTotal.toFixed(2), pageWidth - margin - 3, yPos + 4.5, { align: "right" });
  yPos += 12;

  // Amount in words
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  const amountInWords = numberToWords(data.grandTotal);
  doc.text("Amount in words: " + amountInWords + " only", margin, yPos);
  yPos += 7;

  // Lorry number if provided
  if (data.lorryNumber) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text("Vehicle/Lorry No: " + data.lorryNumber, margin, yPos);
    yPos += 8;
  }

  // Footer section
  const footerY = pageHeight - 32;
  
  // Terms & Conditions
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Terms & Conditions:", margin, footerY);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("1. Payment due within 30 days from the date of invoice", margin, footerY + 4.5);
  doc.text("2. Goods once sold cannot be returned or exchanged", margin, footerY + 8.5);
  doc.text("3. Interest @ 18% p.a. will be charged on delayed payments", margin, footerY + 12.5);
  
  // Signature section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("For AYESHA Coco Pith", pageWidth - margin - 3, footerY + 8, { align: "right" });
  
  doc.setLineWidth(0.3);
  doc.line(pageWidth - 55, footerY + 13, pageWidth - margin - 3, footerY + 13);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Authorized Signatory", pageWidth - margin - 3, footerY + 17, { align: "right" });

  // Save and download the PDF
  const fileName = "Invoice-" + data.invoiceNumber + "-" + new Date().getTime() + ".pdf";
  
  try {
    const blob = doc.output('blob');
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('PDF generation error:', error);
    try {
      doc.save(fileName);
      return true;
    } catch (fallbackError) {
      console.error('Fallback PDF save error:', fallbackError);
      return false;
    }
  }
}

// Helper function to convert number to words (Indian system)
function numberToWords(num: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];

  if (num === 0) return 'Zero';

  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const hundred = Math.floor((num % 1000) / 100);
  const remainder = Math.floor(num % 100);
  const paise = Math.round((num % 1) * 100);

  let words = '';

  if (crore > 0) {
    words += convertTwoDigit(crore) + ' Crore ';
  }
  if (lakh > 0) {
    words += convertTwoDigit(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    words += convertTwoDigit(thousand) + ' Thousand ';
  }
  if (hundred > 0) {
    words += ones[hundred] + ' Hundred ';
  }
  if (remainder > 0) {
    words += convertTwoDigit(remainder) + ' ';
  }

  words += 'Rupees';

  if (paise > 0) {
    words += ' and ' + convertTwoDigit(paise) + ' Paise';
  }

  return words.trim();

  function convertTwoDigit(n: number): string {
    if (n < 10) return ones[n];
    if (n >= 10 && n < 20) return teens[n - 10];
    return tens[Math.floor(n / 10)] + (n % 10 > 0 ? ' ' + ones[n % 10] : '');
  }
}
