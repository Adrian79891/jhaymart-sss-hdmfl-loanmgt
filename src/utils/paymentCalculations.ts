
import { Payment } from '@/types/loan';

export const generateAndMarkPayments = (
  loanId: string,
  dateGranted: string,
  loanTerm: number,
  monthlyAmortization: number,
  autoCalculatePastPayments: boolean = true
) => {
  const payments: Payment[] = [];
  const grantedDate = new Date(dateGranted);
  
  // Start of amortization is exactly 2 months after date granted
  const startDate = new Date(grantedDate);
  startDate.setMonth(startDate.getMonth() + 2);
  
  const today = new Date();
  const paymentAmount = Math.round(monthlyAmortization * 100) / 100; // Full monthly payment
  
  let currentDate = new Date(startDate);
  let paymentIndex = 0;
  const totalPayments = loanTerm; // One payment per month for the loan term
  
  console.log(`Generating payments for loan ${loanId}`);
  console.log(`Start date: ${startDate.toDateString()}`);
  console.log(`Today: ${today.toDateString()}`);
  console.log(`Total payments to generate: ${totalPayments}`);
  
  while (paymentIndex < totalPayments) {
    const dueDate = new Date(currentDate);
    const isPastDue = autoCalculatePastPayments && dueDate <= today;
    
    payments.push({
      id: `${loanId}-${paymentIndex}`,
      loanId,
      dueDate: dueDate.toISOString().split('T')[0],
      amount: paymentAmount,
      isPaid: isPastDue,
      paidDate: isPastDue ? dueDate.toISOString().split('T')[0] : undefined
    });
    
    // Move to the same day of the next month
    currentDate.setMonth(currentDate.getMonth() + 1);
    paymentIndex++;
  }
  
  return payments;
};

export const calculateRemainingBalance = (
  totalLoan: number,
  monthlyAmortization: number,
  payments: Payment[]
) => {
  const paidPayments = payments.filter(p => p.isPaid);
  const paidAmount = paidPayments.length * monthlyAmortization;
  const remainingBalance = Math.max(0, totalLoan - paidAmount);
  
  console.log(`Total loan: ${totalLoan}`);
  console.log(`Paid payments: ${paidPayments.length}`);
  console.log(`Paid amount: ${paidAmount}`);
  console.log(`Remaining balance: ${remainingBalance}`);
  
  return Math.round(remainingBalance * 100) / 100;
};

export const calculateRemainingMonths = (payments: Payment[]) => {
  const unpaidPayments = payments.filter(p => !p.isPaid);
  const remainingMonths = unpaidPayments.length;
  
  console.log(`Unpaid payments: ${unpaidPayments.length}`);
  console.log(`Remaining months: ${remainingMonths}`);
  
  return remainingMonths;
};

export const updateLoanBalances = (
  loanId: string,
  totalLoan: number,
  monthlyAmortization: number,
  payments: Payment[]
) => {
  const remainingBalance = calculateRemainingBalance(totalLoan, monthlyAmortization, payments);
  const remainingMonths = calculateRemainingMonths(payments);
  
  return {
    remainingBalance,
    remainingMonths
  };
};
