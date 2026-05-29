import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePicker } from '@/components/ui/date-picker';
import { ArrowLeft, Save, Trash, Edit, Search, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import {
  addLoan,
  getLoans,
  updateLoan,
  getSettings,
  deleteLoan,
  getPayments,
  savePayments,
} from '@/utils/storage';
import { calculateLoanDetails } from '@/utils/loanCalculations';
import { Loan } from '@/types/loan';

const LOAN_TYPE: Loan['loanType'] = 'SSS_EMERGENCY';

const SSSEmergencyLoanEntry = () => {
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
    dateReloan: '',
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);
  const [searchEmployee, setSearchEmployee] = useState('');

  if (!isAuthenticated) {
    navigate('/');
    return null;
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleDateReloanChange = (date: Date | undefined) => {
    setFormData((prev) => ({
      ...prev,
      dateReloan: date ? date.toISOString().split('T')[0] : '',
    }));
  };

  const resetForm = () => {
    setFormData({
      employeeName: '',
      department: '',
      dateGranted: '',
      principalAmount: '',
      loanTerm: '',
      monthlyAmortization: '',
      interest: '',
      isReloan: false,
      dateReloan: '',
    });
    setIsEditing(false);
    setEditingLoanId(null);
  };

  const handleSearchEmployee = () => {
    if (!searchEmployee.trim()) {
      toast({
        title: 'Search Required',
        description: 'Please enter an employee name to search.',
        variant: 'destructive',
      });
      return;
    }

    const loans = getLoans();
    const matches = loans.filter(
      (loan) =>
        loan.employeeName.toLowerCase().includes(searchEmployee.toLowerCase()) &&
        loan.loanType === LOAN_TYPE &&
        loan.isActive
    );

    if (matches.length === 0) {
      toast({
        title: 'No Loans Found',
        description: `No active SSS Emergency Loans found for ${searchEmployee}.`,
        variant: 'destructive',
      });
      return;
    }

    const latest = matches.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    setFormData({
      employeeName: latest.employeeName,
      department: latest.department,
      dateGranted: latest.dateGranted,
      principalAmount: latest.principalAmount.toString(),
      loanTerm: latest.loanTerm.toString(),
      monthlyAmortization: latest.monthlyAmortization.toString(),
      interest: latest.interest.toString(),
      isReloan: latest.isReloan,
      dateReloan: latest.dateReloan || '',
    });
    setIsEditing(true);
    setEditingLoanId(latest.id);

    toast({
      title: 'Loan Loaded',
      description: `Loaded SSS Emergency Loan for ${latest.employeeName}.`,
    });
  };

  const handleDelete = () => {
    if (!formData.employeeName.trim()) {
      toast({
        title: 'No Employee Selected',
        description: 'Please enter an employee name to delete their SSS Emergency Loans.',
        variant: 'destructive',
      });
      return;
    }

    if (
      !confirm(
        `Are you sure you want to delete SSS Emergency Loan data for ${formData.employeeName}? This will only delete unpaid payments, paid payments will remain.`
      )
    )
      return;

    const loans = getLoans();
    const payments = getPayments();

    const targetLoans = loans.filter(
      (loan) =>
        loan.employeeName.toLowerCase() === formData.employeeName.toLowerCase() &&
        loan.loanType === LOAN_TYPE
    );

    if (targetLoans.length === 0) {
      toast({
        title: 'No Loans Found',
        description: `No SSS Emergency Loans found for ${formData.employeeName}.`,
        variant: 'destructive',
      });
      return;
    }

    targetLoans.forEach((loan) => deleteLoan(loan.id));

    const loanIds = targetLoans.map((l) => l.id);
    const updatedPayments = payments.filter((p) => {
      if (loanIds.includes(p.loanId)) return p.isPaid;
      return true;
    });
    savePayments(updatedPayments);

    toast({
      title: 'SSS Emergency Loans Deleted',
      description: `Deleted ${targetLoans.length} SSS Emergency Loan(s) for ${formData.employeeName}. Paid payments preserved.`,
    });

    resetForm();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const principalAmount = parseFloat(formData.principalAmount);
    const loanTerm = parseInt(formData.loanTerm);
    const monthlyAmortization = parseFloat(formData.monthlyAmortization);
    const interest = parseFloat(formData.interest) || 0;

    if (isNaN(principalAmount) || isNaN(loanTerm) || isNaN(monthlyAmortization)) {
      toast({
        title: 'Invalid Input',
        description: 'Please check your numeric inputs.',
        variant: 'destructive',
      });
      return;
    }

    if (principalAmount <= 0 || loanTerm <= 0) {
      toast({
        title: 'Invalid Values',
        description: 'Principal Amount and Loan Term must be greater than zero.',
        variant: 'destructive',
      });
      return;
    }

    if (monthlyAmortization > principalAmount) {
      toast({
        title: 'Invalid Amortization',
        description: 'Monthly Amortization cannot exceed the Principal Amount.',
        variant: 'destructive',
      });
      return;
    }

    if (formData.isReloan && !formData.dateReloan) {
      toast({
        title: 'Date Required',
        description: 'Please enter the Date of Reloan when marking as reloan.',
        variant: 'destructive',
      });
      return;
    }

    // Prevent duplicate active loans (unless editing or processing a reloan)
    if (!isEditing && !formData.isReloan) {
      const loans = getLoans();
      const hasActive = loans.some(
        (loan) =>
          loan.loanType === LOAN_TYPE &&
          loan.isActive &&
          loan.employeeName.toLowerCase() === formData.employeeName.toLowerCase()
      );
      if (hasActive) {
        toast({
          title: 'Duplicate Active Loan',
          description: `${formData.employeeName} already has an active SSS Emergency Loan. Mark as Reloan to replace it.`,
          variant: 'destructive',
        });
        return;
      }
    }

    const calculations = calculateLoanDetails(
      principalAmount,
      loanTerm,
      monthlyAmortization,
      formData.dateGranted,
      'SSS' // reuse SSS calc (no interest auto-added)
    );

    if (isEditing && editingLoanId) {
      const existing = getLoans().find((l) => l.id === editingLoanId);
      if (existing) {
        const updated: Loan = {
          ...existing,
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
          dateReloan:
            formData.isReloan && formData.dateReloan ? formData.dateReloan : undefined,
        };
        updateLoan(updated);
        toast({
          title: 'SSS Emergency Loan Updated',
          description: `Loan for ${formData.employeeName} updated successfully.`,
        });
      }
    } else {
      // Reloan handling — deactivate existing active SSS Emergency loans for this employee
      if (formData.isReloan) {
        const existingLoans = getLoans();
        const existingPayments = getPayments();
        const employeeLoans = existingLoans.filter(
          (loan) =>
            loan.employeeName.toLowerCase() === formData.employeeName.toLowerCase() &&
            loan.loanType === LOAN_TYPE &&
            loan.isActive
        );
        employeeLoans.forEach((loan) => {
          updateLoan({ ...loan, isActive: false, remainingBalance: 0, remainingMonths: 0 });
        });
        const updatedPayments = existingPayments.map((p) => {
          const belongs = employeeLoans.some((l) => l.id === p.loanId);
          if (belongs && !p.isPaid) {
            return { ...p, isPaid: true, paidDate: new Date().toISOString().split('T')[0] };
          }
          return p;
        });
        savePayments(updatedPayments);
      }

      const newLoan: Loan = {
        id: `SSSEMG_${Date.now()}`,
        employeeName: formData.employeeName,
        department: formData.department,
        loanType: LOAN_TYPE,
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
        dateReloan:
          formData.isReloan && formData.dateReloan ? formData.dateReloan : undefined,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      addLoan(newLoan);
      toast({
        title: 'SSS Emergency Loan Created',
        description: `Loan for ${formData.employeeName} created successfully${
          formData.isReloan ? ' as a reloan' : ''
        }.`,
      });
    }

    resetForm();
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
          <h1 className="text-3xl font-bold text-gray-900">SSS Emergency Loan Application</h1>
          <p className="text-gray-600">
            {isEditing ? 'Edit existing' : 'Create a new'} SSS Emergency Loan
          </p>
          {settings.autoCalculatePastPayments && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
              ✅ Smart payment calculation enabled - past due payments will be auto-marked as paid
            </div>
          )}
        </div>

        {/* Search Employee */}
        <Card className="shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-pink-600" />
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
              <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-white" />
              </div>
              <span>
                {isEditing ? 'Edit SSS Emergency Loan' : 'SSS Emergency Loan Application'}
              </span>
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
                <Button type="submit" className="flex-1 bg-pink-600 hover:bg-pink-700">
                  {isEditing ? <Edit className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                  {isEditing ? 'Update SSS Emergency Loan' : 'Create SSS Emergency Loan'}
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

export default SSSEmergencyLoanEntry;
