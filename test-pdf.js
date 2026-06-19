const pdfService = require('./src/shared/utils/pdf.service');
const fs = require('fs');

async function test() {
  const invoice = { invoiceNumber: 'INV-12345', generatedDate: new Date(), invoiceType: 'PAYMENT', paidAmount: 2000 };
  const loan = { loanNumber: 'GL-98765', status: 'ACTIVE', interestRate: 12, ornamentType: 'Bangles', goldPurity: '22K', goldWeight: 24.5, goldValue: 150000, approvedAmount: 100000, totalPaid: 20000, remainingPrincipal: 80000, interestAmount: 0, penaltyAmount: 0 };
  const customer = { firstName: 'Muthu', lastName: 'Kumar', customerCode: 'CUST-001', mobileNumber: '9876543210' };
  const payment = { principalPaid: 1000, interestPaid: 1000, penaltyPaid: 0, paymentAmount: 2000 };

  try {
    const buffer = await pdfService.generateLoanInvoice(invoice, loan, customer, payment);
    fs.writeFileSync('test_invoice.pdf', buffer);
    console.log('PDF Generated successfully: test_invoice.pdf');
    process.exit(0);
  } catch (e) {
    console.error('Failed:', e);
    process.exit(1);
  }
}

test();
