
export interface Loan {
  id: string;
  employeeName: string;
  department: string;
  pagibigIdNumber?: string; // New field for Pag-IBIG ID Number
  loanType: 'SSS' | 'HDMF' | 'SSS_EMERGENCY';
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
  dateReloan?: string; // New field for reloan date
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
