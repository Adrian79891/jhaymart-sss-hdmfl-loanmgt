
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
    remainingBalance: Math.round(totalLoan * 100) / 100,
    remainingMonths: loanTerm
  };
};

export const generatePaymentSchedule = (
  loanId: string,
  startDate: string,
  loanTerm: number,
  monthlyAmortization: number
) => {
  const payments = [];
  const start = new Date(startDate);
  const paymentAmount = Math.round((monthlyAmortization / 2) * 100) / 100;
  
  for (let i = 0; i < loanTerm; i++) {
    const currentMonth = new Date(start);
    currentMonth.setMonth(currentMonth.getMonth() + i);
    
    // 15th payment
    const payment15 = new Date(currentMonth);
    payment15.setDate(15);
    
    payments.push({
      id: `${loanId}-${i}-15`,
      loanId,
      dueDate: payment15.toISOString().split('T')[0],
      amount: paymentAmount,
      isPaid: false
    });
    
    // 30th payment (or last day of month)
    const payment30 = new Date(currentMonth);
    payment30.setDate(30);
    
    payments.push({
      id: `${loanId}-${i}-30`,
      loanId,
      dueDate: payment30.toISOString().split('T')[0],
      amount: paymentAmount,
      isPaid: false
    });
  }
  
  return payments;
};
