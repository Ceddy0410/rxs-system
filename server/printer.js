// Thermal Receipt Printer Engine & Maintenance Service

export class PrinterService {
  constructor() {
    this.status = {
      connected: true,
      paperReady: true,
      printerModel: 'ESC/POS 80mm Thermal (Virtual/Hardware)',
      lastError: null,
      jobsCount: 0
    };
  }

  getStatus() {
    return this.status;
  }

  // Format receipt into ESC/POS style structured lines
  formatReceipt(orderData) {
    const {
      transactionId,
      items,
      subtotal,
      discountType,
      discountAmount,
      totalAmount,
      paymentMethod,
      amountPaid,
      changeAmount,
      cashier = 'CeddyAdmin',
      createdAt = new Date().toLocaleString()
    } = orderData;

    const divider = '------------------------------------------';
    const doubleDivider = '==========================================';

    const lines = [
      '==========================================',
      '             RXS RESTAURANT               ',
      '     Delicious Dining & Specialties       ',
      '           Tel: 0912-345-6789             ',
      '==========================================',
      `Date/Time: ${createdAt}`,
      `Cashier  : ${cashier}`,
      `Receipt #: ${transactionId}`,
      doubleDivider,
      'QTY  ITEM                     PRICE  TOTAL',
      divider
    ];

    items.forEach(item => {
      const name = item.name.length > 20 ? item.name.substring(0, 18) + '..' : item.name.padEnd(20);
      const qty = String(item.qty).padStart(3);
      const price = String(item.price).padStart(6);
      const total = String(item.price * item.qty).padStart(6);
      lines.push(`${qty}  ${name} ${price} ${total}`);
      if (item.spiceLevel && item.spiceLevel !== 'None') {
        lines.push(`     [Spice: ${item.spiceLevel}]`);
      }
      if (item.addons && item.addons.length > 0) {
        lines.push(`     [Addons: ${item.addons.join(', ')}]`);
      }
    });

    lines.push(divider);
    lines.push(`Sub Total     :              PHP ${Number(subtotal).toFixed(2).padStart(10)}`);
    if (discountAmount > 0) {
      lines.push(`Discount (${discountType || 'Promo'}):       -PHP ${Number(discountAmount).toFixed(2).padStart(10)}`);
    }
    lines.push(`TOTAL DUE     :              PHP ${Number(totalAmount).toFixed(2).padStart(10)}`);
    lines.push(doubleDivider);
    lines.push(`Payment Method: ${paymentMethod}`);
    lines.push(`Amount Tender :              PHP ${Number(amountPaid).toFixed(2).padStart(10)}`);
    lines.push(`Change        :              PHP ${Number(changeAmount).toFixed(2).padStart(10)}`);
    lines.push(divider);
    lines.push('   Thank you for dining at RXS Restaurant! ');
    lines.push('           Please visit again!             ');
    lines.push('       *** RXS RESTAURANT POS ***          ');
    lines.push('==========================================\n\n\n');

    return lines.join('\n');
  }

  async printReceipt(orderData) {
    if (!this.status.connected) {
      throw new Error('Printer Error: Device disconnected or offline. Check USB/Power cable.');
    }
    if (!this.status.paperReady) {
      throw new Error('Printer Error: Paper roll is empty or cover is open. Please reload 80mm paper roll.');
    }

    const formattedText = this.formatReceipt(orderData);
    this.status.jobsCount++;

    console.log('[Thermal Printer] Printing Receipt #' + orderData.transactionId);
    console.log(formattedText);

    return {
      success: true,
      message: 'Receipt sent to thermal printer successfully',
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
