
import { Loan, Payment } from '@/types/loan';
import { generateAndMarkPayments, updateLoanBalances } from './paymentCalculations';

const LOANS_KEY = 'jhaymarts_loans';
const PAYMENTS_KEY = 'jhaymarts_payments';
const SETTINGS_KEY = 'jhaymarts_settings';

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

export const getSettings = () => {
  const stored = localStorage.getItem(SETTINGS_KEY);
  return stored ? JSON.parse(stored) : { autoCalculatePastPayments: true };
};

export const saveSettings = (settings: any) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const addLoan = (loan: Loan) => {
  const loans = getLoans();
  const settings = getSettings();
  
  // Generate payments with auto-marking logic
  const payments = generateAndMarkPayments(
    loan.id,
    loan.dateGranted,
    loan.loanTerm,
    loan.monthlyAmortization,
    settings.autoCalculatePastPayments
  );
  
  // Update loan balances based on generated payments
  const balances = updateLoanBalances(
    loan.id,
    loan.totalLoan,
    loan.monthlyAmortization,
    payments
  );
  
  // Update loan with calculated balances
  const updatedLoan = {
    ...loan,
    remainingBalance: balances.remainingBalance,
    remainingMonths: balances.remainingMonths,
    payments
  };
  
  loans.push(updatedLoan);
  saveLoans(loans);
  
  // Save payments separately for easier management
  const allPayments = getPayments();
  allPayments.push(...payments);
  savePayments(allPayments);
  
  console.log(`Added loan ${loan.id} with ${payments.length} payments`);
  console.log(`Remaining balance: ${balances.remainingBalance}`);
  console.log(`Remaining months: ${balances.remainingMonths}`);
};

export const updateLoan = (updatedLoan: Loan) => {
  const loans = getLoans();
  const index = loans.findIndex(l => l.id === updatedLoan.id);
  if (index !== -1) {
    loans[index] = updatedLoan;
    saveLoans(loans);
  }
};

export const refreshLoanBalances = () => {
  const loans = getLoans();
  const payments = getPayments();
  const settings = getSettings();
  
  console.log('Refreshing loan balances for all loans...');
  
  loans.forEach(loan => {
    if (loan.isActive && settings.autoCalculatePastPayments) {
      // Get payments for this loan
      const loanPayments = payments.filter(p => p.loanId === loan.id);
      
      if (loanPayments.length === 0) {
        // Generate payments if none exist
        const newPayments = generateAndMarkPayments(
          loan.id,
          loan.dateGranted,
          loan.loanTerm,
          loan.monthlyAmortization,
          true
        );
        
        // Update loan with new payments
        loan.payments = newPayments;
        payments.push(...newPayments);
      } else {
        // Update existing payments based on current date
        const updatedPayments = generateAndMarkPayments(
          loan.id,
          loan.dateGranted,
          loan.loanTerm,
          loan.monthlyAmortization,
          true
        );
        
        // Replace old payments with updated ones
        const otherPayments = payments.filter(p => p.loanId !== loan.id);
        payments.length = 0;
        payments.push(...otherPayments, ...updatedPayments);
        
        loan.payments = updatedPayments;
      }
      
      // Update balances
      const balances = updateLoanBalances(
        loan.id,
        loan.totalLoan,
        loan.monthlyAmortization,
        loan.payments
      );
      
      loan.remainingBalance = balances.remainingBalance;
      loan.remainingMonths = balances.remainingMonths;
    }
  });
  
  saveLoans(loans);
  savePayments(payments);
  
  console.log('Loan balances refreshed successfully');
};

export const searchLoansByEmployee = (employeeName: string): Loan[] => {
  // Refresh balances before searching
  refreshLoanBalances();
  
  const loans = getLoans();
  return loans.filter(loan => 
    loan.employeeName.toLowerCase().includes(employeeName.toLowerCase())
  );
};
