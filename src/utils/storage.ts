
import { Loan, Payment } from '@/types/loan';

const LOANS_KEY = 'jhaymarts_loans';
const PAYMENTS_KEY = 'jhaymarts_payments';

export const saveLoans = (loans: Loan[]) => {
  localStorage.setItem(LOANS_KEY, JSON.stringify(loans));
};

export const getLoans = (): Loan[] => {
  const stored = localStorage.getItem(LOANS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const savePayments = (payments: Payment[]) => {
  localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments));
};

export const getPayments = (): Payment[] => {
  const stored = localStorage.getItem(PAYMENTS_KEY);
  return stored ? JSON.parse(stored) : [];
};

export const addLoan = (loan: Loan) => {
  const loans = getLoans();
  loans.push(loan);
  saveLoans(loans);
};

export const updateLoan = (updatedLoan: Loan) => {
  const loans = getLoans();
  const index = loans.findIndex(l => l.id === updatedLoan.id);
  if (index !== -1) {
    loans[index] = updatedLoan;
    saveLoans(loans);
  }
};

export const searchLoansByEmployee = (employeeName: string): Loan[] => {
  const loans = getLoans();
  return loans.filter(loan => 
    loan.employeeName.toLowerCase().includes(employeeName.toLowerCase())
  );
};
