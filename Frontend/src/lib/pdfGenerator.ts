import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PurchaseOrder, SalesOrder } from '@/types';

// Company Information
const COMPANY_INFO = {
  name: 'MDVD Enterprise',
  address: '123 Business Street, Commerce City',
  phone: '+1 (555) 123-4567',
  email: 'info@mdvd.com',
  website: 'www.mdvd.com'
};

// PDF styling configuration
const PDF_CONFIG = {
  marginTop: 20,
  marginLeft: 20,
  marginRight: 20,
  lineHeight: 6,
  fontSize: {
    title: 20,
    subtitle: 14,
    header: 12,
    body: 10,
    small: 8
  },
  colors: {
    primary: [41, 128, 185], // Blue
    secondary: [52, 73, 94], // Dark gray
    accent: [231, 76, 60],   // Red
    text: [44, 62, 80],      // Dark blue-gray
    light: [149, 165, 166]   // Light gray
  }
};

export class PDFGenerator {
  private doc: jsPDF;
  private currentY: number = PDF_CONFIG.marginTop;

  constructor() {
    this.doc = new jsPDF();
    this.setupDocument();
  }

  private setupDocument(): void {
    this.doc.setFont('helvetica');
  }

  private addHeader(title: string): void {
    const pageWidth = this.doc.internal.pageSize.width;
    
    // Company Logo Area (placeholder)
    this.doc.setFillColor(...PDF_CONFIG.colors.primary);
    this.doc.rect(PDF_CONFIG.marginLeft, this.currentY, pageWidth - 2 * PDF_CONFIG.marginLeft, 25, 'F');
    
    // Company Name
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(PDF_CONFIG.fontSize.title);
    this.doc.text(COMPANY_INFO.name, PDF_CONFIG.marginLeft + 10, this.currentY + 15);
    
    // Document Title
    this.doc.setFontSize(PDF_CONFIG.fontSize.subtitle);
    const titleWidth = this.doc.getTextWidth(title);
    this.doc.text(title, pageWidth - PDF_CONFIG.marginRight - titleWidth - 10, this.currentY + 15);
    
    this.currentY += 35;
    
    // Company Details
    this.doc.setTextColor(...PDF_CONFIG.colors.text);
    this.doc.setFontSize(PDF_CONFIG.fontSize.small);
    this.doc.text(COMPANY_INFO.address, PDF_CONFIG.marginLeft, this.currentY);
    this.doc.text(`Phone: ${COMPANY_INFO.phone} | Email: ${COMPANY_INFO.email}`, PDF_CONFIG.marginLeft, this.currentY + 5);
    this.doc.text(`Website: ${COMPANY_INFO.website}`, PDF_CONFIG.marginLeft, this.currentY + 10);
    
    this.currentY += 25;
  }

  private addSection(title: string, content: { [key: string]: string | number }, width: number = 80): void {
    // Section title
    this.doc.setFontSize(PDF_CONFIG.fontSize.header);
    this.doc.setTextColor(...PDF_CONFIG.colors.secondary);
    this.doc.text(title, PDF_CONFIG.marginLeft, this.currentY);
    this.currentY += 10;
    
    // Section content
    this.doc.setFontSize(PDF_CONFIG.fontSize.body);
    this.doc.setTextColor(...PDF_CONFIG.colors.text);
    
    Object.entries(content).forEach(([key, value]) => {
      this.doc.text(`${key}:`, PDF_CONFIG.marginLeft + 5, this.currentY);
      this.doc.text(String(value), PDF_CONFIG.marginLeft + width, this.currentY);
      this.currentY += PDF_CONFIG.lineHeight;
    });
    
    this.currentY += 5;
  }

  private addItemsTable(items: any[], columns: string[], headers: string[]): void {
    const tableData = items.map(item => 
      columns.map(col => {
        const value = col.split('.').reduce((obj, key) => obj?.[key], item);
        if (typeof value === 'number' && (col.includes('cost') || col.includes('price') || col.includes('amount'))) {
          return `$${value.toFixed(2)}`;
        }
        return String(value || '');
      })
    );

    autoTable(this.doc, {
      startY: this.currentY,
      head: [headers],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: PDF_CONFIG.colors.primary,
        textColor: 255,
        fontSize: PDF_CONFIG.fontSize.body,
        fontStyle: 'bold'
      },
      bodyStyles: {
        fontSize: PDF_CONFIG.fontSize.body,
        textColor: PDF_CONFIG.colors.text
      },
      alternateRowStyles: {
        fillColor: [248, 249, 250]
      },
      margin: { left: PDF_CONFIG.marginLeft, right: PDF_CONFIG.marginRight },
      tableWidth: 'auto'
    });

    this.currentY = (this.doc as any).lastAutoTable.finalY + 10;
  }

  private addTotal(label: string, amount: number): void {
    const pageWidth = this.doc.internal.pageSize.width;
    this.doc.setFontSize(PDF_CONFIG.fontSize.header);
    this.doc.setTextColor(...PDF_CONFIG.colors.secondary);
    
    const totalText = `${label}: $${amount.toFixed(2)}`;
    const textWidth = this.doc.getTextWidth(totalText);
    
    this.doc.setFillColor(...PDF_CONFIG.colors.light);
    this.doc.rect(pageWidth - PDF_CONFIG.marginRight - textWidth - 20, this.currentY - 5, textWidth + 15, 15, 'F');
    
    this.doc.text(totalText, pageWidth - PDF_CONFIG.marginRight - textWidth - 10, this.currentY + 5);
    this.currentY += 20;
  }

  private addFooter(): void {
    const pageHeight = this.doc.internal.pageSize.height;
    const pageWidth = this.doc.internal.pageSize.width;
    
    // Footer line
    this.doc.setDrawColor(...PDF_CONFIG.colors.light);
    this.doc.line(PDF_CONFIG.marginLeft, pageHeight - 30, pageWidth - PDF_CONFIG.marginRight, pageHeight - 30);
    
    // Footer text
    this.doc.setFontSize(PDF_CONFIG.fontSize.small);
    this.doc.setTextColor(...PDF_CONFIG.colors.light);
    this.doc.text('Thank you for your business!', PDF_CONFIG.marginLeft, pageHeight - 20);
    
    // Page number and date
    const date = new Date().toLocaleDateString();
    const footerRight = `Generated on ${date} | Page 1`;
    const footerRightWidth = this.doc.getTextWidth(footerRight);
    this.doc.text(footerRight, pageWidth - PDF_CONFIG.marginRight - footerRightWidth, pageHeight - 20);
  }

  private openPrintPreview(filename: string): void {
    try {
      // Convert PDF to blob
      const pdfBlob = this.doc.output('blob');
      
      // Create URL for the blob
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      // Open in new window for printing
      const printWindow = window.open(pdfUrl, '_blank');
      
      if (printWindow) {
        printWindow.onload = () => {
          // Auto-trigger print dialog after a short delay to ensure PDF loads
          setTimeout(() => {
            printWindow.print();
            
            // Optional: Also download the PDF
            const link = document.createElement('a');
            link.href = pdfUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up the URL after some delay
            setTimeout(() => {
              URL.revokeObjectURL(pdfUrl);
            }, 1000);
          }, 500);
        };
      } else {
        // Fallback: just download if popup blocked
        this.doc.save(filename);
      }
    } catch (error) {
      console.error('Error opening print preview:', error);
      // Fallback: just download
      this.doc.save(filename);
    }
  }

  // Generate Purchase Order PDF
  public generatePurchaseOrderPDF(order: PurchaseOrder, showPrint: boolean = true): void {
    this.addHeader('PURCHASE ORDER');
    
    // Order Information
    this.addSection('Order Information', {
      'Order Number': order.orderNumber,
      'Status': order.status.toUpperCase(),
      'Order Date': new Date(order.createdAt).toLocaleDateString(),
      'Expected Delivery': order.expectedDeliveryDate 
        ? new Date(order.expectedDeliveryDate).toLocaleDateString() 
        : 'Not specified'
    });
    
    // Supplier Information
    this.addSection('Supplier Information', {
      'Supplier Name': order.supplier.name,
      'Phone': order.supplier.telephone,
      'Address': order.supplier.address,
      'Payment Terms': order.supplier.paymentTerms
    });
    
    // Items Table
    this.doc.setFontSize(PDF_CONFIG.fontSize.header);
    this.doc.setTextColor(...PDF_CONFIG.colors.secondary);
    this.doc.text('Order Items', PDF_CONFIG.marginLeft, this.currentY);
    this.currentY += 10;
    
    this.addItemsTable(
      order.items,
      ['name', 'quantity', 'unitCost', 'totalCost'],
      ['Item Name', 'Quantity', 'Unit Cost', 'Total Cost']
    );
    
    // Total
    this.addTotal('Total Amount', order.totalAmount);
    
    // Notes
    if (order.notes) {
      this.addSection('Notes', { 'Additional Information': order.notes });
    }
    
    this.addFooter();
    
    if (showPrint) {
      // Open print preview
      this.openPrintPreview(`purchase-order-${order.orderNumber}.pdf`);
    } else {
      // Just download
      this.doc.save(`purchase-order-${order.orderNumber}.pdf`);
    }
  }

  // Generate Sales Order PDF
  public generateSalesOrderPDF(order: SalesOrder, showPrint: boolean = true): void {
    this.addHeader('SALES ORDER');
    
    // Order Information
    this.addSection('Order Information', {
      'Order Number': order.orderNumber,
      'Status': order.status.toUpperCase(),
      'Order Date': new Date(order.orderDate).toLocaleDateString(),
      'Payment Method': order.paymentMethod.toUpperCase()
    });
    
    // Customer Information
    if (order.customer) {
      this.addSection('Customer Information', {
        'Customer Name': order.customer.name,
        'Phone': order.customer.telephone,
        'Address': order.customer.address,
        'Email': order.customer.email || 'Not provided'
      });
    }
    
    // Items Table
    this.doc.setFontSize(PDF_CONFIG.fontSize.header);
    this.doc.setTextColor(...PDF_CONFIG.colors.secondary);
    this.doc.text('Order Items', PDF_CONFIG.marginLeft, this.currentY);
    this.currentY += 10;
    
    this.addItemsTable(
      order.items,
      ['product.name', 'quantity', 'unitPrice', 'discount', 'totalPrice'],
      ['Item Name', 'Quantity', 'Unit Price', 'Discount', 'Total Price']
    );
    
    // Total
    this.addTotal('Total Amount', order.totalAmount);
    
    // Notes
    if (order.notes) {
      this.addSection('Notes', { 'Additional Information': order.notes });
    }
    
    this.addFooter();
    
    if (showPrint) {
      // Open print preview
      this.openPrintPreview(`sales-order-${order.orderNumber}.pdf`);
    } else {
      // Just download
      this.doc.save(`sales-order-${order.orderNumber}.pdf`);
    }
  }

  // Generate POS Receipt PDF
  public generatePOSReceiptPDF(saleData: {
    receiptNumber: string;
    date: Date;
    items: any[];
    subtotal: number;
    tax: number;
    discount: number;
    total: number;
    paymentMethod: string;
    cashier?: string;
  }, showPrint: boolean = true): void {
    // Use a smaller format for receipts
    this.doc = new jsPDF({
      format: [80, 200], // Receipt size
      unit: 'mm'
    });
    
    this.currentY = 10;
    const centerX = 40; // Center of receipt
    
    // Header
    this.doc.setFontSize(14);
    this.doc.setTextColor(...PDF_CONFIG.colors.primary);
    this.doc.text(COMPANY_INFO.name, centerX, this.currentY, { align: 'center' });
    this.currentY += 6;
    
    this.doc.setFontSize(8);
    this.doc.setTextColor(...PDF_CONFIG.colors.text);
    this.doc.text(COMPANY_INFO.address, centerX, this.currentY, { align: 'center' });
    this.currentY += 4;
    this.doc.text(COMPANY_INFO.phone, centerX, this.currentY, { align: 'center' });
    this.currentY += 8;
    
    // Receipt Info
    this.doc.setFontSize(10);
    this.doc.text(`Receipt: ${saleData.receiptNumber}`, 5, this.currentY);
    this.currentY += 4;
    this.doc.text(`Date: ${saleData.date.toLocaleDateString()}`, 5, this.currentY);
    this.currentY += 4;
    this.doc.text(`Time: ${saleData.date.toLocaleTimeString()}`, 5, this.currentY);
    if (saleData.cashier) {
      this.currentY += 4;
      this.doc.text(`Cashier: ${saleData.cashier}`, 5, this.currentY);
    }
    this.currentY += 8;
    
    // Items
    this.doc.setFontSize(8);
    this.doc.text('ITEMS', 5, this.currentY);
    this.currentY += 6;
    
    saleData.items.forEach(item => {
      // Item name
      this.doc.text(item.name, 5, this.currentY);
      this.currentY += 4;
      
      // Quantity x Price = Total
      const itemLine = `${item.quantity} x $${item.unitPrice.toFixed(2)} = $${item.totalPrice.toFixed(2)}`;
      this.doc.text(itemLine, 10, this.currentY);
      this.currentY += 6;
    });
    
    // Totals
    this.doc.setFontSize(9);
    this.currentY += 4;
    this.doc.text(`Subtotal: $${saleData.subtotal.toFixed(2)}`, 5, this.currentY);
    this.currentY += 4;
    if (saleData.discount > 0) {
      this.doc.text(`Discount: -$${saleData.discount.toFixed(2)}`, 5, this.currentY);
      this.currentY += 4;
    }
    if (saleData.tax > 0) {
      this.doc.text(`Tax: $${saleData.tax.toFixed(2)}`, 5, this.currentY);
      this.currentY += 4;
    }
    
    // Final total
    this.doc.setFontSize(12);
    this.doc.setTextColor(...PDF_CONFIG.colors.primary);
    this.doc.text(`TOTAL: $${saleData.total.toFixed(2)}`, 5, this.currentY);
    this.currentY += 6;
    
    // Payment method
    this.doc.setFontSize(9);
    this.doc.setTextColor(...PDF_CONFIG.colors.text);
    this.doc.text(`Payment: ${saleData.paymentMethod.toUpperCase()}`, 5, this.currentY);
    this.currentY += 8;
    
    // Footer
    this.doc.setFontSize(8);
    this.doc.text('Thank you for your business!', centerX, this.currentY, { align: 'center' });
    
    if (showPrint) {
      // Open print preview
      this.openPrintPreview(`receipt-${saleData.receiptNumber}.pdf`);
    } else {
      // Just download
      this.doc.save(`receipt-${saleData.receiptNumber}.pdf`);
    }
  }
}

// Export utility functions
export const generatePurchaseOrderPDF = (order: PurchaseOrder, showPrint: boolean = true) => {
  const generator = new PDFGenerator();
  generator.generatePurchaseOrderPDF(order, showPrint);
};

export const generateSalesOrderPDF = (order: SalesOrder, showPrint: boolean = true) => {
  const generator = new PDFGenerator();
  generator.generateSalesOrderPDF(order, showPrint);
};

export const generatePOSReceiptPDF = (saleData: any, showPrint: boolean = true) => {
  const generator = new PDFGenerator();
  generator.generatePOSReceiptPDF(saleData, showPrint);
}; 