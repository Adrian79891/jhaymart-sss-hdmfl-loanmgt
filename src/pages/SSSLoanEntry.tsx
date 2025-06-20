import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Save, Trash } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { addLoan, getLoans, updateLoan, getSettings, deleteLoan } from '@/utils/storage';
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
    isReloan: false
  });

  if (!isAuthenticated) {
    navigate('/');
    return null;
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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

    if (confirm(`Are you sure you want to delete all SSS loans for ${formData.employeeName}?`)) {
      const loans = getLoans();
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

      employeeSSLoans.forEach(loan => {
        deleteLoan(loan.id);
      });

      toast({
        title: "SSS Loans Deleted",
        description: `Deleted ${employeeSSLoans.length} SSS loan(s) for ${formData.employeeName}.`,
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
        isReloan: false
      });
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

    const calculations = calculateLoanDetails(
      principalAmount,
      loanTerm,
      monthlyAmortization,
      formData.dateGranted,
      'SSS'
    );

    // Handle reloan logic - mark existing loans as inactive and zero balance
    if (formData.isReloan) {
      const existingLoans = getLoans();
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
      
      console.log(`Marked ${employeeLoans.length} existing SSS loans as inactive for reloan`);
    }

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
      isActive: true,
      createdAt: new Date().toISOString()
    };

    console.log('Creating SSS loan with auto-payment calculation:', settings.autoCalculatePastPayments);
    addLoan(newLoan);

    toast({
      title: "SSS Loan Created",
      description: `Loan for ${formData.employeeName} has been successfully created${formData.isReloan ? ' as a reloan with previous balance zeroed' : ''}.`,
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
      isReloan: false
    });
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
          <p className="text-gray-600">Create a new SSS loan application</p>
          {settings.autoCalculatePastPayments && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
              ✅ Smart payment calculation enabled - past due payments will be auto-marked as paid
            </div>
          )}
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span>SSS Loan Application</span>
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

              <div className="pt-4 flex space-x-2">
                <Button type="submit" className="flex-1 bg-purple-600 hover:bg-purple-700">
                  <Save className="h-4 w-4 mr-2" />
                  Create SSS Loan
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
