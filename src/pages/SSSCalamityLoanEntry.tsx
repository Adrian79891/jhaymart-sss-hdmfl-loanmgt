import React from 'react';
import SSSLoanEntryForm from '@/components/SSSLoanEntryForm';

const SSSCalamityLoanEntry = () => (
  <SSSLoanEntryForm
    loanType="SSS_CALAMITY"
    label="SSS Calamity Loan"
    idPrefix="SSSCAL"
    accent={{ text: 'text-amber-600', bg: 'bg-amber-500', button: 'bg-amber-600 hover:bg-amber-700' }}
  />
);

export default SSSCalamityLoanEntry;
