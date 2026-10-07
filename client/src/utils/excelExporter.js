import * as XLSX from 'xlsx';

/**
 * Generates and downloads a super-detailed multi-sheet Excel (.xlsx) workbook for Luzzio OmniCommerce Management.
 * 
 * Sheet 1: Dashboard / Summary (Key Executive KPIs, Stock Totals, POS Sales, Discounts, Tax, Payment Methods)
 * Sheet 2: Inventory Report (SKU, Barcode, Product Name, Category, Pricing, Current Stock, Status, Valuation)
 * Sheet 3: POS Sales (Granular itemized transaction log with Cashier, Customer, Discounts, Tax, Payment Method)
 */
export const exportMultiSheetExcelReport = ({
   summaryData = {},
   inventoryData = [],
   posSalesData = [],
   filename = `Luzzio_Executive_Report_${new Date().toISOString().slice(0, 10)}.xlsx`
}) => {
   const wb = XLSX.utils.book_new();

   // =========================================================================
   // SHEET 1: DASHBOARD / SUMMARY
   // =========================================================================
   const summaryRows = [
      ['LUZZIO OMNICOMMERCE PLATFORM — EXECUTIVE SUMMARY & AUDIT REPORT'],
      ['Organization:', 'LUZZIO Luxury Apparel & Footwear'],
      ['Generated On:', new Date().toLocaleString()],
      ['System Version:', 'OmniCore v2.4 Professional Enterprise'],
      [],
      ['SECTION 1: INVENTORY & STOCK VALUATION METRICS', 'METRIC VALUE', 'UNIT / CURRENCY'],
      ['Total Catalog Products', summaryData.totalProducts ?? 0, 'Unique SKUs'],
      ['Total Stock Units', summaryData.totalStockUnits ?? 0, 'Physical Units'],
      ['Total Inventory Valuation', Number(summaryData.totalInventoryValue ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 }), 'LKR'],
      ['Low-Stock Products (<= Threshold)', summaryData.lowStockProducts ?? 0, 'Products'],
      ['Out-of-Stock Products (0 Units)', summaryData.outOfStockProducts ?? 0, 'Products'],
      [],
      ['SECTION 2: POINT OF SALE (POS) & SALES PERFORMANCE', 'METRIC VALUE', 'UNIT / CURRENCY'],
      ['Total POS Revenue', Number(summaryData.totalPOSSales ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 }), 'LKR'],
      ['Number of POS Orders Processed', summaryData.numberPOSOrders ?? 0, 'Transactions'],
      ['Total Items Sold (All Channels)', summaryData.totalItemsSold ?? 0, 'Units'],
      ['Total Discounts Issued', Number(summaryData.totalDiscounts ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 }), 'LKR'],
      ['Total Tax Collected', Number(summaryData.totalTax ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 }), 'LKR'],
      [],
      ['SECTION 3: SALES BREAKDOWN BY PAYMENT METHOD', 'TOTAL SALES (LKR)', 'TRANSACTIONS COUNT']
   ];

   if (summaryData.salesByPaymentMethod && Array.isArray(summaryData.salesByPaymentMethod) && summaryData.salesByPaymentMethod.length > 0) {
      summaryData.salesByPaymentMethod.forEach(pm => {
         summaryRows.push([
            pm.method || 'Standard Payment',
            Number(pm.totalSales || 0).toLocaleString('en-US', { minimumFractionDigits: 2 }),
            pm.orderCount || 0
         ]);
      });
   } else {
      summaryRows.push(['No payment breakdown records available', '0.00', '0']);
   }

   const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
   wsSummary['!cols'] = [
      { wch: 48 },
      { wch: 28 },
      { wch: 22 }
   ];
   XLSX.utils.book_append_sheet(wb, wsSummary, 'Dashboard & Summary');

   // =========================================================================
   // SHEET 2: INVENTORY REPORT
   // =========================================================================
   const inventoryHeaders = [
      'SKU',
      'Barcode',
      'Product Name',
      'Category',
      'Unit Price (LKR)',
      'Sale Price (LKR)',
      'Current Stock (Units)',
      'Stock Status',
      'Inventory Value (LKR)'
   ];

   const inventoryRows = [
      ['LUZZIO CENTRALIZED INVENTORY & STOCK VALUATION AUDIT'],
      [`Export Date: ${new Date().toLocaleString()}`],
      [],
      inventoryHeaders
   ];

   inventoryData.forEach(item => {
      inventoryRows.push([
         item.sku || 'N/A',
         item.barcode || 'N/A',
         item.name || 'Unnamed Product',
         item.category || 'Uncategorized',
         item.price || 0,
         item.salePrice || 0,
         item.stock || 0,
         item.stockStatus || (item.stock === 0 ? 'OUT OF STOCK' : item.stock <= 10 ? 'LOW STOCK' : 'IN STOCK'),
         item.inventoryValue || ((item.stock || 0) * (item.salePrice > 0 ? item.salePrice : (item.price || 0)))
      ]);
   });

   const wsInventory = XLSX.utils.aoa_to_sheet(inventoryRows);
   wsInventory['!cols'] = [
      { wch: 18 },
      { wch: 18 },
      { wch: 36 },
      { wch: 22 },
      { wch: 16 },
      { wch: 16 },
      { wch: 20 },
      { wch: 16 },
      { wch: 22 }
   ];
   XLSX.utils.book_append_sheet(wb, wsInventory, 'Inventory Report');

   // =========================================================================
   // SHEET 3: POS SALES
   // =========================================================================
   const posHeaders = [
      'Date & Time',
      'Order No.',
      'Product Name',
      'SKU',
      'Size Variant',
      'Qty Sold',
      'Unit Price (LKR)',
      'Discount (LKR)',
      'Tax (LKR)',
      'Total Amount (LKR)',
      'Payment Method',
      'Cashier / Terminal User',
      'Customer Identification'
   ];

   const posRows = [
      ['LUZZIO POINT OF SALE (POS) SALES & CASHIER AUDIT REGISTER'],
      [`Export Date: ${new Date().toLocaleString()}`],
      [],
      posHeaders
   ];

   if (posSalesData && posSalesData.length > 0) {
      posSalesData.forEach(sale => {
         posRows.push([
            sale.date || '',
            sale.orderNo || '',
            sale.product || '',
            sale.sku || 'N/A',
            sale.size || 'N/A',
            sale.qty || 1,
            sale.unitPrice || 0,
            sale.discount || 0,
            sale.tax || 0,
            sale.total || 0,
            sale.paymentMethod || 'CASH',
            sale.cashier || 'Staff Cashier',
            sale.customer || 'Walk-in Customer'
         ]);
      });
   } else {
      posRows.push(['No POS transactions recorded in this period.', '', '', '', '', '', '', '', '', '', '', '', '']);
   }

   const wsPOS = XLSX.utils.aoa_to_sheet(posRows);
   wsPOS['!cols'] = [
      { wch: 22 },
      { wch: 22 },
      { wch: 32 },
      { wch: 16 },
      { wch: 14 },
      { wch: 10 },
      { wch: 16 },
      { wch: 14 },
      { wch: 14 },
      { wch: 18 },
      { wch: 18 },
      { wch: 24 },
      { wch: 28 }
   ];
   XLSX.utils.book_append_sheet(wb, wsPOS, 'POS Sales');

   // Write and trigger download in browser
   XLSX.writeFile(wb, filename);
};
