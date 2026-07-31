import React from 'react';
import SSSLoanEntryForm from '@/components/SSSLoanEntryForm';

const SSSEmergencyLoanEntry = () => (
  <SSSLoanEntryForm
    loanType="SSS_EMERGENCY"
    label="SSS Emergency Loan"
    idPrefix="SSSEMG"
    accent={{ text: 'text-pink-600', bg: 'bg-pink-500', button: 'bg-pink-600 hover:bg-pink-700' }}
  />
);

export default SSSEmergencyLoanEntry;
