
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CreditCard, Eye, Calendar, Download } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format, startOfMonth, endOfMonth, subMonths, addMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import { getLoans } from '@/utils/storage';
import * as XLSX from 'xlsx';

const NewlyGrantedLoansReport = () => {
  const [reportMonth, setReportMonth] = useState<Date>();
  const [preparedBy, setPreparedBy] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const generateReportData = () => {
    if (!reportMonth) {
      alert('Please select the report month');
      return null;
    }

    const loans = getLoans();
    
    // Get the previous month's date range
    const previousMonth = subMonths(reportMonth, 1);
    const startDate = startOfMonth(previousMonth);
    const endDate = endOfMonth(previousMonth);
    
    // Find loans granted in the previous month
    const newlyGrantedLoans = loans.filter(loan => {
      const grantedDate = new Date(loan.dateGranted);
      return grantedDate >= startDate && grantedDate <= endDate;
    });

    const employeeData = newlyGrantedLoans.map(loan => {
      // Calculate first amortization date (first payment date from payments array)
      const firstAmortizationDate = loan.payments && loan.payments.length > 0 
        ? format(new Date(loan.payments[0].dueDate), 'MMM dd, yyyy')
        : format(addMonths(new Date(loan.dateGranted), 1), 'MMM dd, yyyy');
      
      // Calculate last amortization date (last payment date from payments array)
      const lastAmortizationDate = loan.payments && loan.payments.length > 0
        ? format(new Date(loan.payments[loan.payments.length - 1].dueDate), 'MMM dd, yyyy')
        : format(addMonths(new Date(loan.dateGranted), loan.loanTerm), 'MMM dd, yyyy');

      return {
        employeeName: loan.employeeName,
        dateGranted: loan.dateGranted,
        loanTerm: loan.loanTerm,
        amortizationPeriod: `${firstAmortizationDate} to ${lastAmortizationDate}`,
        principalAmount: loan.principalAmount,
        monthlyAmortization: loan.monthlyAmortization,
        loanType: loan.loanType,
        totalLoan: loan.totalLoan,
        firstAmortizationDate: firstAmortizationDate
      };
    });

    return {
      reportMonth: format(reportMonth, 'MMMM yyyy'),
      previousMonth: format(previousMonth, 'MMMM yyyy'),
      employees: employeeData,
      totalEmployees: employeeData.length,
      totalPrincipalAmount: employeeData.reduce((sum, emp) => sum + emp.principalAmount, 0),
      totalMonthlyAmortization: employeeData.reduce((sum, emp) => sum + emp.monthlyAmortization, 0),
      preparedBy: preparedBy.trim() || 'N/A',
      reportDate: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    };
  };

  const generateReport = () => {
    const data = generateReportData();
    if (data) {
      setReportData(data);
      setShowPreview(true);
    }
  };

  const exportToExcel = () => {
    const data = generateReportData();
    if (!data) return;

    const worksheet = XLSX.utils.json_to_sheet([
      { A: 'Newly Granted Loans' },
      { A: `Loans granted in ${data.previousMonth}` },
      { A: '' },
      { A: 'Employee Name', B: 'Date Granted', C: 'Loan Term', D: 'Amortization Period', E: 'Principal Amount', F: 'Monthly Amortization' },
      ...data.employees.map((emp: any) => ({
        A: emp.employeeName,
        B: new Date(emp.dateGranted).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        C: `${emp.loanTerm} months`,
        D: emp.amortizationPeriod,
        E: `₱${emp.principalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        F: `₱${emp.monthlyAmortization.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      })),
      { A: '' },
      { A: `Total Employees: ${data.totalEmployees}` },
      { A: `Total Principal Amount: ₱${data.totalPrincipalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
      { A: `Total Monthly Amortization: ₱${data.totalMonthlyAmortization.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
      { A: '' },
      { A: `Prepared by: ${data.preparedBy}` },
      { A: `Generated on: ${data.reportDate}` }
    ]);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Newly Granted Loans');
    
    XLSX.writeFile(workbook, `Newly_Granted_Loans_Report_${format(reportMonth!, 'yyyy-MM')}.xlsx`);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5 text-blue-600" />
          <span>Newly Granted Loans Report</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Report Month</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !reportMonth && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {reportMonth ? format(reportMonth, "MMMM yyyy") : <span>Pick report month</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={reportMonth}
                    onSelect={setReportMonth}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-gray-500 mt-1">
                Report will show loans granted in the previous month
              </p>
            </div>
            
            <div>
              <Label htmlFor="preparedBy">Prepared By</Label>
              <Input
                id="preparedBy"
                value={preparedBy}
                onChange={(e) => setPreparedBy(e.target.value)}
                placeholder="Prepared by"
              />
            </div>
          </div>

          <div className="flex space-x-2">
            <Button onClick={generateReport} className="bg-blue-600 hover:bg-blue-700">
              <Eye className="h-4 w-4 mr-2" />
              Generate Preview
            </Button>
            <Button onClick={exportToExcel} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export to Excel
            </Button>
          </div>
        </div>

        {showPreview && reportData && (
          <Dialog open={showPreview} onOpenChange={setShowPreview}>
            <DialogContent className="max-w-6xl">
              <DialogHeader>
                <DialogTitle>Newly Granted Loans Report - Preview</DialogTitle>
              </DialogHeader>
              <div className="bg-white p-6 max-h-96 overflow-y-auto">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold">Newly Granted Loans</h2>
                  <p className="text-sm text-gray-600">Loans granted in {reportData.previousMonth}</p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2 text-left">Employee Name</th>
                        <th className="border border-gray-300 p-2 text-center">Date Granted</th>
                        <th className="border border-gray-300 p-2 text-center">Loan Term</th>
                        <th className="border border-gray-300 p-2 text-center">Amortization Period</th>
                        <th className="border border-gray-300 p-2 text-right">Principal Amount</th>
                        <th className="border border-gray-300 p-2 text-right">Monthly Amortization</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.employees.map((employee: any, index: number) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="border border-gray-300 p-2 font-medium">{employee.employeeName}</td>
                          <td className="border border-gray-300 p-2 text-center">
                            {new Date(employee.dateGranted).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </td>
                          <td className="border border-gray-300 p-2 text-center">{employee.loanTerm} months</td>
                          <td className="border border-gray-300 p-2 text-center">{employee.amortizationPeriod}</td>
                          <td className="border border-gray-300 p-2 text-right">
                            ₱{employee.principalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="border border-gray-300 p-2 text-right">
                            ₱{employee.monthlyAmortization.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-6 grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="font-semibold">Total Employees: {reportData.totalEmployees}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Total Principal: ₱{reportData.totalPrincipalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div>
                    <p className="font-semibold">Total Monthly: ₱{reportData.totalMonthlyAmortization.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
                
                <div className="mt-8 text-center">
                  <p>Prepared by: ____________________</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
};

export default NewlyGrantedLoansReport;
