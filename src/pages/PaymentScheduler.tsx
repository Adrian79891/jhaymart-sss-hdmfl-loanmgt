
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Search, Calendar, CheckSquare, Square } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getLoans, getPayments, savePayments, updateLoan } from '@/utils/storage';
import { Loan, Payment } from '@/types/loan';
import { updateLoanBalances } from '@/utils/paymentCalculations';

const PaymentScheduler = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [loans, setLoans] = useState<Loan[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);

  if (!isAuthenticated) {
    navigate('/');
    return null;
  }

  useEffect(() => {
    const allLoans = getLoans();
    const allPayments = getPayments();
    setLoans(allLoans);
    setPayments(allPayments);
    setFilteredPayments(allPayments);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      const filtered = payments.filter(payment => {
        const loan = loans.find(l => l.id === payment.loanId);
        return loan?.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
      });
      setFilteredPayments(filtered);
    } else {
      setFilteredPayments(payments);
    }
  };

  const handlePaymentToggle = (paymentId: string, isPaid: boolean) => {
    const updatedPayments = payments.map(payment => 
      payment.id === paymentId 
        ? { 
            ...payment, 
            isPaid, 
            paidDate: isPaid ? new Date().toISOString().split('T')[0] : undefined 
          }
        : payment
    );
    
    setPayments(updatedPayments);
    savePayments(updatedPayments);
    
    // Update filtered payments
    const filtered = searchTerm.trim() 
      ? updatedPayments.filter(payment => {
          const loan = loans.find(l => l.id === payment.loanId);
          return loan?.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
        })
      : updatedPayments;
    setFilteredPayments(filtered);
    
    // Update loan balances
    const payment = updatedPayments.find(p => p.id === paymentId);
    if (payment) {
      const loan = loans.find(l => l.id === payment.loanId);
      if (loan) {
        const loanPayments = updatedPayments.filter(p => p.loanId === loan.id);
        const balances = updateLoanBalances(
          loan.id,
          loan.totalLoan,
          loan.monthlyAmortization,
          loanPayments
        );
        
        const updatedLoan = {
          ...loan,
          remainingBalance: balances.remainingBalance,
          remainingMonths: balances.remainingMonths
        };
        
        updateLoan(updatedLoan);
        
        // Update local loans state
        const updatedLoans = loans.map(l => l.id === loan.id ? updatedLoan : l);
        setLoans(updatedLoans);
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const getEmployeeName = (loanId: string) => {
    const loan = loans.find(l => l.id === loanId);
    return loan?.employeeName || 'Unknown';
  };

  const getLoanType = (loanId: string) => {
    const loan = loans.find(l => l.id === loanId);
    return loan?.loanType || 'Unknown';
  };

  const sortedPayments = filteredPayments.sort((a, b) => {
    return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Payment Scheduler</h1>
          <p className="text-gray-600">Manage payment schedules for all employees</p>
        </div>

        <Card className="shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-blue-600" />
              <span>Search Employee Payments</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Enter employee name to filter payments..."
                  className="h-12"
                />
              </div>
              <Button type="submit" className="h-12 px-8 bg-blue-600 hover:bg-blue-700">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
              <Button 
                type="button" 
                variant="outline"
                className="h-12 px-8"
                onClick={() => {
                  setSearchTerm('');
                  setFilteredPayments(payments);
                }}
              >
                Clear
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-green-600" />
              <span>Payment Records ({filteredPayments.length} payments)</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee Name</TableHead>
                    <TableHead>Loan Type</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date Paid</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">
                        {getEmployeeName(payment.loanId)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={getLoanType(payment.loanId) === 'HDMF' ? 'default' : 'secondary'}
                          className={getLoanType(payment.loanId) === 'HDMF' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}
                        >
                          {getLoanType(payment.loanId)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(payment.dueDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(payment.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={payment.isPaid ? 'default' : 'secondary'}
                          className={payment.isPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}
                        >
                          {payment.isPaid ? 'Paid' : 'Unpaid'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {payment.paidDate ? new Date(payment.paidDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        }) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={payment.isPaid}
                            onCheckedChange={(checked) => 
                              handlePaymentToggle(payment.id, checked === true)
                            }
                          />
                          <span className="text-sm text-gray-600">
                            Mark as {payment.isPaid ? 'Unpaid' : 'Paid'}
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredPayments.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No payment records found.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaymentScheduler;
