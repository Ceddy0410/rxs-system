// Thermal Receipt Printer Engine & Maintenance Service (Optimized for 58mm Mini Printers)

export class PrinterService {
  constructor() {
    this.status = {
      connected: true,
      paperReady: true,
      paperWidth: 32, // Standard 32 columns for 58mm Mini Thermal Printers
      printerModel: 'ESC/POS 58mm Mini Thermal (POS-58/Bluetooth/USB)',
      lastError: null,
      jobsCount: 0
    };
  }

  getStatus() {
    return this.status;
  }

  // Format receipt into ESC/POS style structured lines (strictly 32 columns for 58mm mini printers)
  formatReceipt(orderData, width = 32) {
    const {
      transactionId,
      items = [],
      subtotal = 0,
      discountType,
      discountAmount = 0,
      totalAmount = 0,
      paymentMethod = 'Cash',
      amountPaid = 0,
      changeAmount = 0,
      cashier = 'CeddyAdmin',
      createdAt = new Date().toLocaleString()
    } = orderData;

    const divider = '-'.repeat(width);
    const doubleDivider = '='.repeat(width);

    const center = (text) => {
      if (text.length >= width) return text.substring(0, width);
      const padLeft = Math.floor((width - text.length) / 2);
      const padRight = width - text.length - padLeft;
      return ' '.repeat(padLeft) + text + ' '.repeat(padRight);
    };

    const row = (label, val) => {
      const valStr = String(val);
      const maxLabel = width - valStr.length - 1;
      const cleanLabel = label.length > maxLabel ? label.substring(0, maxLabel) : label;
      const spaces = width - cleanLabel.length - valStr.length;
      return cleanLabel + ' '.repeat(Math.max(1, spaces)) + valStr;
    };

    const lines = [
      doubleDivider,
      center('RXS RESTAURANT'),
      center('Delicious Dining & Specialties'),
      center('Tel: 0912-345-6789'),
      doubleDivider,
      `Date/Time: ${createdAt}`,
      `Cashier  : ${cashier}`,
      `Receipt #: ${transactionId}`,
      doubleDivider,
      width <= 32 ? 'QTY ITEM            PRICE  TOTAL' : 'QTY  ITEM                     PRICE  TOTAL',
      divider
    ];

    items.forEach(item => {
      if (width <= 32) {
        // 32-column Mini Printer layout: Qty (2) + Name (16) + Price (5) + Total (6) = 32 chars
        const name = (item.name || '').length > 16 
          ? (item.name || '').substring(0, 15) + '.' 
          : (item.name || '').padEnd(16);
        const qty = String(item.qty || 1).padStart(2);
        const price = String(item.price || 0).padStart(5);
        const total = String((item.price || 0) * (item.qty || 1)).padStart(6);
        lines.push(`${qty} ${name} ${price} ${total}`);
      } else {
        // 42-column Standard Printer layout
        const name = (item.name || '').length > 20 
          ? (item.name || '').substring(0, 18) + '..' 
          : (item.name || '').padEnd(20);
        const qty = String(item.qty || 1).padStart(3);
        const price = String(item.price || 0).padStart(6);
        const total = String((item.price || 0) * (item.qty || 1)).padStart(6);
        lines.push(`${qty}  ${name} ${price} ${total}`);
      }
      if (item.spiceLevel && item.spiceLevel !== 'None') {
        lines.push(`   [Spice: ${item.spiceLevel}]`);
      }
      if (item.addons && item.addons.length > 0) {
        lines.push(`   [Addons: ${item.addons.join(', ')}]`);
      }
    });

    lines.push(divider);
    lines.push(row('Sub Total     :', `PHP ${Number(subtotal).toFixed(2)}`));
    if (Number(discountAmount) > 0) {
      lines.push(row(`Disc (${discountType || 'Promo'}):`, `-PHP ${Number(discountAmount).toFixed(2)}`));
    }
    lines.push(row('TOTAL DUE     :', `PHP ${Number(totalAmount).toFixed(2)}`));
    lines.push(doubleDivider);
    lines.push(row('Payment Method:', `${paymentMethod}`));
    lines.push(row('Amount Tender :', `PHP ${Number(amountPaid).toFixed(2)}`));
    lines.push(row('Change        :', `PHP ${Number(changeAmount).toFixed(2)}`));
    lines.push(divider);
    lines.push(center('Thank you for dining!'));
    lines.push(center('Please visit again!'));
    lines.push(center('*** RXS RESTAURANT POS ***'));
    lines.push(doubleDivider + '\n\n\n');

    return lines.join('\n');
  }

  async printReceipt(orderData) {
    if (!this.status.connected) {
      throw new Error('Printer Error: Device disconnected or offline. Check USB/Power cable.');
    }
    if (!this.status.paperReady) {
      throw new Error('Printer Error: Paper roll is empty or cover is open. Please reload 58mm paper roll.');
    }

    const formattedText = this.formatReceipt(orderData, this.status.paperWidth || 32);
    this.status.jobsCount++;

    console.log('[Thermal Printer] Printing Receipt #' + orderData.transactionId);
    console.log(formattedText);

    return {
      success: true,
      message: 'Receipt sent to thermal printer successfully (58mm Mini)',
      transactionId: orderData.transactionId,
      printedAt: new Date().toISOString(),
      rawReceipt: formattedText
    };
  }

  // Diagnostic hardware test
  testPrint() {
    return this.printReceipt({
      transactionId: 'TEST-OR-' + Math.floor(100000 + Math.random() * 900000),
      items: [
        { name: 'Kuro Ramen', qty: 1, price: 250, spiceLevel: 'Mild' },
        { name: 'Matcha Frappe', qty: 1, price: 95 }
      ],
      subtotal: 345,
      discountType: 'None',
      discountAmount: 0,
      totalAmount: 345,
      paymentMethod: 'Cash (Test)',
      amountPaid: 500,
      changeAmount: 155,
      cashier: 'CeddyAdmin (Test Mode)'
    });
  }

  setPaperStatus(isReady) {
    this.status.paperReady = isReady;
  }

  setConnectionStatus(isConnected) {
    this.status.connected = isConnected;
  }
}

export const printer = new PrinterService();
