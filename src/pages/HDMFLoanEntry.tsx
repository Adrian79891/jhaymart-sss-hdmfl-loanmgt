
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { ArrowLeft, Save, UserX, Edit, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { addLoan, getLoans, updateLoan, getSettings, getPayments, savePayments } from '@/utils/storage';
import { calculateLoanDetails } from '@/utils/loanCalculations';
import { Loan } from '@/types/loan';

const HDMFLoanEntry = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const settings = getSettings();
  
  const [formData, setFormData] = useState({
    employeeName: '',
    department: '',
    pagibigIdNumber: '',
    dateGranted: '',
    principalAmount: '',
    loanTerm: '',
    monthlyAmortization: '',
    interest: '',
    isReloan: false,
    dateReloan: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);
  const [searchEmployee, setSearchEmployee] = useState('');

  if (!isAuthenticated) {
    navigate('/');
    return null;
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleDateReloanChange = (date: Date | undefined) => {
    setFormData(prev => ({ 
      ...prev, 
      dateReloan: date ? date.toISOString().split('T')[0] : '' 
    }));
  };

  const handleSearchEmployee = () => {
    if (!searchEmployee.trim()) {
      toast({
        title: "Search Required",
        description: "Please enter an employee name to search.",
        variant: "destructive",
      });
      return;
    }

    const loans = getLoans();
    const employeeHDMFLoans = loans.filter(
      loan => loan.employeeName.toLowerCase().includes(searchEmployee.toLowerCase()) && 
              loan.loanType === 'HDMF' && 
              loan.isActive
    );

    if (employeeHDMFLoans.length === 0) {
      toast({
        title: "No Loans Found",
        description: `No active HDMF loans found for ${searchEmployee}.`,
        variant: "destructive",
      });
      return;
    }

    // Get the most recent loan for editing
    const latestLoan = employeeHDMFLoans.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    setFormData({
      employeeName: latestLoan.employeeName,
      department: latestLoan.department,
      pagibigIdNumber: latestLoan.pagibigIdNumber || '',
      dateGranted: latestLoan.dateGranted,
      principalAmount: latestLoan.principalAmount.toString(),
      loanTerm: latestLoan.loanTerm.toString(),
      monthlyAmortization: latestLoan.monthlyAmortization.toString(),
      interest: latestLoan.interest > 0 ? latestLoan.interest.toString() : '',
      isReloan: latestLoan.isReloan,
      dateReloan: latestLoan.dateReloan || ''
    });

    setIsEditing(true);
    setEditingLoanId(latestLoan.id);

    toast({
      title: "Loan Loaded",
      description: `Loaded loan for ${latestLoan.employeeName} for editing.`,
    });
  };

  const handleDeleteEmployee = () => {
    if (!formData.employeeName.trim()) {
      toast({
        title: "No Employee Selected",
        description: "Please enter an employee name to delete their loans.",
        variant: "destructive",
      });
      return;
    }

    if (confirm(`Are you sure you want to delete HDMF loan data for ${formData.employeeName}? This will only delete unpaid payments, paid payments will remain.`)) {
      const loans = getLoans();
      const payments = getPayments();
      
      const employeeLoans = loans.filter(
        loan => loan.employeeName.toLowerCase() === formData.employeeName.toLowerCase() && 
                loan.loanType === 'HDMF' && 
                loan.isActive
      );

      if (employeeLoans.length === 0) {
        toast({
          title: "No Active Loans Found",
          description: `No active HDMF loans found for ${formData.employeeName}.`,
          variant: "destructive",
        });
        return;
      }

      // Mark all active HDMF loans for this employee as inactive
      employeeLoans.forEach(loan => {
        updateLoan({ 
          ...loan, 
          isActive: false, 
          remainingBalance: 0,
          remainingMonths: 0
        });
      });

      // Filter out only unpaid payments for these loans, keep paid ones
      const loanIds = employeeLoans.map(loan => loan.id);
      const updatedPayments = payments.filter(payment => {
        if (loanIds.includes(payment.loanId)) {
          return payment.isPaid; // Keep only paid payments
        }
        return true; // Keep all other payments
      });

      savePayments(updatedPayments);

      toast({
        title: "Employee Loans Deleted",
        description: `Successfully deleted ${employeeLoans.length} HDMF loan(s) for ${formData.employeeName}. Paid payments were preserved.`,
      });

      // Reset form
      setFormData({
        employeeName: '',
        department: '',
        pagibigIdNumber: '',
        dateGranted: '',
        principalAmount: '',
        loanTerm: '',
        monthlyAmortization: '',
        interest: '',
        isReloan: false,
        dateReloan: ''
      });
      setIsEditing(false);
      setEditingLoanId(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const principalAmount = parseFloat(formData.principalAmount);
    const loanTerm = parseInt(formData.loanTerm);
    const monthlyAmortization = parseFloat(formData.monthlyAmortization);
    const customInterest = formData.interest ? parseFloat(formData.interest) : null;
    
    if (isNaN(principalAmount) || isNaN(loanTerm) || isNaN(monthlyAmortization)) {
      toast({
        title: "Invalid Input",
        description: "Please check your numeric inputs.",
        variant: "destructive",
      });
      return;
    }

    if (formData.interest && isNaN(customInterest!)) {
      toast({
        title: "Invalid Interest",
        description: "Please enter a valid interest amount.",
        variant: "destructive",
      });
      return;
    }

    if (formData.isReloan && !formData.dateReloan) {
      toast({
        title: "Date Required",
        description: "Please enter the date of reloan when marking as reloan.",
        variant: "destructive",
      });
      return;
    }

    const calculations = calculateLoanDetails(
      principalAmount,
      loanTerm,
      monthlyAmortization,
      formData.dateGranted,
      'HDMF'
    );

    // Fixed logic: Only use principal amount when interest field is blank
    let finalInterest = 0;
    let finalTotalLoan = principalAmount; // Default to principal amount only

    if (formData.interest.trim() !== '') {
      // Interest field has a value - use custom interest
      finalInterest = customInterest!;
      finalTotalLoan = principalAmount + customInterest!;
    }
    // If interest field is blank (empty string), keep finalInterest = 0 and finalTotalLoan = principalAmount

    if (isEditing && editingLoanId) {
      // Update existing loan
      const existingLoans = getLoans();
      const loanToUpdate = existingLoans.find(loan => loan.id === editingLoanId);
      
      if (loanToUpdate) {
        const updatedLoan: Loan = {
          ...loanToUpdate,
          employeeName: formData.employeeName,
          department: formData.department,
          pagibigIdNumber: formData.pagibigIdNumber,
          dateGranted: formData.dateGranted,
          principalAmount,
          loanTerm,
          monthlyAmortization,
          totalLoan: finalTotalLoan,
          interest: finalInterest,
          startOfAmortization: calculations.startOfAmortization,
          amortizationPeriod: calculations.amortizationPeriod,
          remainingBalance: finalTotalLoan,
          remainingMonths: calculations.remainingMonths,
          isReloan: formData.isReloan,
          dateReloan: formData.isReloan && formData.dateReloan ? formData.dateReloan : undefined
        };

        updateLoan(updatedLoan);

        toast({
          title: "HDMF Loan Updated",
          description: `Loan for ${formData.employeeName} has been successfully updated.`,
        });
      }
    } else {
      // Handle reloan logic - mark existing loans as inactive, zero out remaining balance, and mark payments as paid
      if (formData.isReloan) {
        const existingLoans = getLoans();
        const existingPayments = getPayments();
        
        const employeeLoans = existingLoans.filter(
          loan => loan.employeeName.toLowerCase() === formData.employeeName.toLowerCase() && 
                  loan.loanType === 'HDMF' && 
                  loan.isActive
        );
        
        // Mark existing loans as inactive and zero out remaining balance
        employeeLoans.forEach(loan => {
          updateLoan({ 
            ...loan, 
            isActive: false, 
            remainingBalance: 0,
            remainingMonths: 0
          });
        });
        
        // Mark all payments for existing loans as paid
        const updatedPayments = existingPayments.map(payment => {
          const isPaymentForExistingLoan = employeeLoans.some(loan => loan.id === payment.loanId);
          if (isPaymentForExistingLoan && !payment.isPaid) {
            return {
              ...payment,
              isPaid: true,
              paidDate: new Date().toISOString().split('T')[0]
            };
          }
          return payment;
        });
        
        // Save updated payments
        savePayments(updatedPayments);
        
        console.log(`Marked ${employeeLoans.length} existing HDMF loans as inactive for reloan`);
        console.log(`Marked payments as paid for existing loans`);
      }

      // Create new loan
      const newLoan: Loan = {
        id: `HDMF_${Date.now()}`,
        employeeName: formData.employeeName,
        department: formData.department,
        pagibigIdNumber: formData.pagibigIdNumber,
        loanType: 'HDMF',
        dateGranted: formData.dateGranted,
        principalAmount,
        loanTerm,
        monthlyAmortization,
        totalLoan: finalTotalLoan,
        interest: finalInterest,
        startOfAmortization: calculations.startOfAmortization,
        amortizationPeriod: calculations.amortizationPeriod,
        remainingBalance: finalTotalLoan,
        remainingMonths: calculations.remainingMonths,
        isReloan: formData.isReloan,
        dateReloan: formData.isReloan && formData.dateReloan ? formData.dateReloan : undefined,
        isActive: true,
        createdAt: new Date().toISOString()
      };

      console.log('Creating HDMF loan with auto-payment calculation:', settings.autoCalculatePastPayments);
      addLoan(newLoan);

      toast({
        title: "HDMF Loan Created",
        description: `Loan for ${formData.employeeName} has been successfully created${formData.isReloan ? ' as a reloan with previous balance zeroed and payments marked as paid' : ''}.`,
      });
    }

    // Reset form
    setFormData({
      employeeName: '',
      department: '',
      pagibigIdNumber: '',
      dateGranted: '',
      principalAmount: '',
      loanTerm: '',
      monthlyAmortization: '',
      interest: '',
      isReloan: false,
      dateReloan: ''
    });
    setIsEditing(false);
    setEditingLoanId(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">HDMF Loan Entry</h1>
          <p className="text-gray-600">{isEditing ? 'Edit existing' : 'Create a new'} HDMF loan application</p>
          {settings.autoCalculatePastPayments && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
              ✅ Smart payment calculation enabled - past due payments will be auto-marked as paid
            </div>
          )}
        </div>

        {/* Search Employee Section */}
        <Card className="shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-green-600" />
              <span>Search Employee for Edit</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Input
                value={searchEmployee}
                onChange={(e) => setSearchEmployee(e.target.value)}
                placeholder="Enter employee name to search and edit"
                className="flex-1"
              />
              <Button onClick={handleSearchEmployee} variant="outline">
                <Search className="h-4 w-4 mr-2" />
                Search & Edit
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">H</span>
                </div>
                <span>{isEditing ? 'Edit HDMF Loan' : 'HDMF Loan Application'}</span>
              </div>
              <Button
                onClick={handleDeleteEmployee}
                variant="destructive"
                size="sm"
                className="ml-2"
              >
                <UserX className="h-4 w-4 mr-2" />
                Delete Employee
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeName">Employee Name *</Label>
                  <Input
                    id="employeeName"
                    value={formData.employeeName}
                    onChange={(e) => handleInputChange('employeeName', e.target.value)}
                    placeholder="Enter employee full name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="department">Department *</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    placeholder="Enter department"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pagibigIdNumber">Pag-IBIG ID Number</Label>
                <Input
                  id="pagibigIdNumber"
                  value={formData.pagibigIdNumber}
                  onChange={(e) => handleInputChange('pagibigIdNumber', e.target.value)}
                  placeholder="Enter Pag-IBIG ID Number"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateGranted">Date Granted *</Label>
                  <Input
                    id="dateGranted"
                    type="date"
                    value={formData.dateGranted}
                    onChange={(e) => handleInputChange('dateGranted', e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="principalAmount">Principal Amount *</Label>
                  <Input
                    id="principalAmount"
                    type="number"
                    step="0.01"
                    value={formData.principalAmount}
                    onChange={(e) => handleInputChange('principalAmount', e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="loanTerm">Loan Term (months) *</Label>
                  <Input
                    id="loanTerm"
                    type="number"
                    value={formData.loanTerm}
                    onChange={(e) => handleInputChange('loanTerm', e.target.value)}
                    placeholder="24"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="monthlyAmortization">Monthly Amortization *</Label>
                  <Input
                    id="monthlyAmortization"
                    type="number"
                    step="0.01"
                    value={formData.monthlyAmortization}
                    onChange={(e) => handleInputChange('monthlyAmortization', e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="interest">Interest Amount (optional)</Label>
                <Input
                  id="interest"
                  type="number"
                  step="0.01"
                  value={formData.interest}
                  onChange={(e) => handleInputChange('interest', e.target.value)}
                  placeholder="Enter custom interest amount (leave blank for no interest)"
                />
                <p className="text-sm text-gray-500">
                  Leave blank to use only principal amount as total loan
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isReloan"
                  checked={formData.isReloan}
                  onCheckedChange={(checked) => handleInputChange('isReloan', checked === true)}
                />
                <Label htmlFor="isReloan" className="text-sm font-medium">
                  Mark as Reloan (will deactivate existing loan and zero balance)
                </Label>
              </div>

              {formData.isReloan && (
                <div className="space-y-2">
                  <Label htmlFor="dateReloan">Date of Reloan *</Label>
                  <DatePicker
                    date={formData.dateReloan ? new Date(formData.dateReloan) : undefined}
                    onDateChange={handleDateReloanChange}
                    placeholder="Select date of reloan"
                  />
                </div>
              )}

              <div className="pt-4">
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                  {isEditing ? <Edit className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  {isEditing ? 'Update HDMF Loan' : 'Create HDMF Loan'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HDMFLoanEntry;
