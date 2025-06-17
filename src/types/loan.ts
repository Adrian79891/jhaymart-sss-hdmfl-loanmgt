
export interface Loan {
  id: string;
  employeeName: string;
  department: string;
  loanType: 'SSS' | 'HDMF';
  dateGranted: string;
  principalAmount: number;
  loanTerm: number;
  monthlyAmortization: number;
  totalLoan: number;
  interest: number;
  startOfAmortization: string;
  amortizationPeriod: string;
  remainingBalance: number;
  remainingMonths: number;
  isReloan: boolean;
  isActive: boolean;
  createdAt: string;
  payments?: Payment[];
}

export interface Payment {
  id: string;
  loanId: string;
  dueDate: string;
  amount: number;
  isPaid: boolean;
  paidDate?: string;
}
