
import { generateAndMarkPayments } from './paymentCalculations';

export const calculateLoanDetails = (
  principalAmount: number,
  loanTerm: number,
  monthlyAmortization: number,
  dateGranted: string,
  loanType: 'SSS' | 'HDMF'
) => {
  const totalLoan = monthlyAmortization * loanTerm;
  
  let interest = 0;
  if (loanType === 'HDMF') {
    interest = totalLoan - principalAmount;
  }
  
  // Start of amortization is 2 months after date granted
  const grantedDate = new Date(dateGranted);
  const startDate = new Date(grantedDate);
  startDate.setMonth(startDate.getMonth() + 2);
  
  // End date is start date + loan term months
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + loanTerm);
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  return {
    totalLoan: Math.round(totalLoan * 100) / 100,
    interest: Math.round(interest * 100) / 100,
    startOfAmortization: formatDate(startDate),
    amortizationPeriod: `${formatDate(startDate)} to ${formatDate(endDate)}`,
    remainingBalance: Math.round(totalLoan * 100) / 100, // This will be updated by payment calculations
    remainingMonths: loanTerm // This will be updated by payment calculations
  };
};

// Legacy function - kept for backward compatibility but not used for new loans
export const generatePaymentSchedule = (
  loanId: string,
  startDate: string,
  loanTerm: number,
  monthlyAmortization: number
) => {
  console.warn('generatePaymentSchedule is deprecated. Use generateAndMarkPayments instead.');
  return generateAndMarkPayments(loanId, startDate, loanTerm, monthlyAmortization);
};
