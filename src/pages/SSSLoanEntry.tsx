import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { ArrowLeft, Save, Trash, Edit, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { addLoan, getLoans, updateLoan, getSettings, deleteLoan, getPayments, savePayments } from '@/utils/storage';
import { calculateLoanDetails } from '@/utils/loanCalculations';
import { Loan } from '@/types/loan';

const SSSLoanEntry = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const settings = getSettings();
  
  const [formData, setFormData] = useState({
    employeeName: '',
    department: '',
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
    const employeeSSLoans = loans.filter(
      loan => loan.employeeName.toLowerCase().includes(searchEmployee.toLowerCase()) && 
              loan.loanType === 'SSS' && 
              loan.isActive
    );

    if (employeeSSLoans.length === 0) {
      toast({
        title: "No Loans Found",
        description: `No active SSS loans found for ${searchEmployee}.`,
        variant: "destructive",
      });
      return;
    }

    // Get the most recent loan for editing
    const latestLoan = employeeSSLoans.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    setFormData({
      employeeName: latestLoan.employeeName,
      department: latestLoan.department,
      dateGranted: latestLoan.dateGranted,
      principalAmount: latestLoan.principalAmount.toString(),
      loanTerm: latestLoan.loanTerm.toString(),
      monthlyAmortization: latestLoan.monthlyAmortization.toString(),
      interest: latestLoan.interest.toString(),
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

  const handleDelete = () => {
    if (!formData.employeeName.trim()) {
      toast({
        title: "No Employee Selected",
        description: "Please enter an employee name to delete their SSS loans.",
        variant: "destructive",
      });
      return;
    }

    if (confirm(`Are you sure you want to delete SSS loan data for ${formData.employeeName}? This will only delete unpaid payments, paid payments will remain.`)) {
      const loans = getLoans();
      const payments = getPayments();
      
      const employeeSSLoans = loans.filter(
        loan => loan.employeeName.toLowerCase() === formData.employeeName.toLowerCase() && 
                loan.loanType === 'SSS'
      );

      if (employeeSSLoans.length === 0) {
        toast({
          title: "No Loans Found",
          description: `No SSS loans found for ${formData.employeeName}.`,
          variant: "destructive",
        });
        return;
      }

      // Delete loans and only unpaid payments
      employeeSSLoans.forEach(loan => {
        deleteLoan(loan.id);
      });

      // Filter out only unpaid payments for these loans, keep paid ones
      const loanIds = employeeSSLoans.map(loan => loan.id);
      const updatedPayments = payments.filter(payment => {
        if (loanIds.includes(payment.loanId)) {
          return payment.isPaid; // Keep only paid payments
        }
        return true; // Keep all other payments
      });

      savePayments(updatedPayments);

      toast({
        title: "SSS Loans Deleted",
        description: `Deleted ${employeeSSLoans.length} SSS loan(s) for ${formData.employeeName}. Paid payments were preserved.`,
      });

      // Reset form
      setFormData({
        employeeName: '',
        department: '',
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
    const interest = parseFloat(formData.interest) || 0;
    
    if (isNaN(principalAmount) || isNaN(loanTerm) || isNaN(monthlyAmortization)) {
      toast({
        title: "Invalid Input",
        description: "Please check your numeric inputs.",
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
      'SSS'
    );

    if (isEditing && editingLoanId) {
      // Update existing loan
      const existingLoans = getLoans();
      const loanToUpdate = existingLoans.find(loan => loan.id === editingLoanId);
      
      if (loanToUpdate) {
        const updatedLoan: Loan = {
          ...loanToUpdate,
          employeeName: formData.employeeName,
          department: formData.department,
          dateGranted: formData.dateGranted,
          principalAmount,
          loanTerm,
          monthlyAmortization,
          totalLoan: calculations.totalLoan,
          interest: Math.round(interest * 100) / 100,
          startOfAmortization: calculations.startOfAmortization,
          amortizationPeriod: calculations.amortizationPeriod,
          remainingBalance: calculations.remainingBalance,
          remainingMonths: calculations.remainingMonths,
          isReloan: formData.isReloan,
          dateReloan: formData.isReloan && formData.dateReloan ? formData.dateReloan : undefined
        };

        updateLoan(updatedLoan);

        toast({
          title: "SSS Loan Updated",
          description: `Loan for ${formData.employeeName} has been successfully updated.`,
        });
      }
    } else {
      // Handle reloan logic - mark existing loans as inactive, zero balance, and mark payments as paid
      if (formData.isReloan) {
        const existingLoans = getLoans();
        const existingPayments = getPayments();
        
        const employeeLoans = existingLoans.filter(
          loan => loan.employeeName.toLowerCase() === formData.employeeName.toLowerCase() && 
                  loan.loanType === 'SSS' && 
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
        
        console.log(`Marked ${employeeLoans.length} existing SSS loans as inactive for reloan`);
        console.log(`Marked payments as paid for existing loans`);
      }

      // Create new loan
      const newLoan: Loan = {
        id: `SSS_${Date.now()}`,
        employeeName: formData.employeeName,
        department: formData.department,
        loanType: 'SSS',
        dateGranted: formData.dateGranted,
        principalAmount,
        loanTerm,
        monthlyAmortization,
        totalLoan: calculations.totalLoan,
        interest: Math.round(interest * 100) / 100,
        startOfAmortization: calculations.startOfAmortization,
        amortizationPeriod: calculations.amortizationPeriod,
        remainingBalance: calculations.remainingBalance,
        remainingMonths: calculations.remainingMonths,
        isReloan: formData.isReloan,
        dateReloan: formData.isReloan && formData.dateReloan ? formData.dateReloan : undefined,
        isActive: true,
        createdAt: new Date().toISOString()
      };

      console.log('Creating SSS loan with auto-payment calculation:', settings.autoCalculatePastPayments);
      addLoan(newLoan);

      toast({
        title: "SSS Loan Created",
        description: `Loan for ${formData.employeeName} has been successfully created${formData.isReloan ? ' as a reloan with previous balance zeroed and payments marked as paid' : ''}.`,
      });
    }

    // Reset form
    setFormData({
      employeeName: '',
      department: '',
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
          <h1 className="text-3xl font-bold text-gray-900">SSS Loan Entry</h1>
          <p className="text-gray-600">{isEditing ? 'Edit existing' : 'Create a new'} SSS loan application</p>
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
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span>{isEditing ? 'Edit SSS Loan' : 'SSS Loan Application'}</span>
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
                <Label htmlFor="interest">Interest (Optional for SSS)</Label>
                <Input
                  id="interest"
                  type="number"
                  step="0.01"
                  value={formData.interest}
                  onChange={(e) => handleInputChange('interest', e.target.value)}
                  placeholder="0.00"
                />
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

              <div className="pt-4 flex space-x-2">
                <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">
                  {isEditing ? <Edit className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  {isEditing ? 'Update SSS Loan' : 'Create SSS Loan'}
                </Button>
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={handleDelete}
                  className="px-6"
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SSSLoanEntry;
