
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Eye, Calendar, Download, Users } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { getLoans } from '@/utils/storage';
import * as XLSX from 'xlsx';

const FullyPaidLoansReport = () => {
  const [asOfDate, setAsOfDate] = useState<Date>();
  const [preparedBy, setPreparedBy] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const generateReport = () => {
    if (!asOfDate) {
      alert('Please select the "As of" date');
      return;
    }

    const loans = getLoans();
    const asOfDateString = asOfDate.toISOString().split('T')[0];
    
    // Find loans that were fully paid by the selected date
    const fullyPaidLoans = loans.filter(loan => {
      if (!loan.payments || loan.payments.length === 0) return false;
      
      // Check if all payments were made by the asOfDate
      const paidPayments = loan.payments.filter(payment => 
        payment.isPaid && payment.paidDate && payment.paidDate <= asOfDateString
      );
      
      // Loan is fully paid if all payments are marked as paid and the last payment was made by asOfDate
      const allPaymentsPaid = loan.payments.every(payment => payment.isPaid);
      const lastPaymentDate = loan.payments
        .filter(payment => payment.isPaid && payment.paidDate)
        .sort((a, b) => (b.paidDate || '').localeCompare(a.paidDate || ''))[0]?.paidDate;
      
      return allPaymentsPaid && lastPaymentDate && lastPaymentDate <= asOfDateString;
    });

    const employeeData = fullyPaidLoans.map(loan => ({
      employeeName: loan.employeeName,
      monthlyAmortization: loan.monthlyAmortization,
      dateFullyPaid: loan.payments
        ?.filter(payment => payment.isPaid && payment.paidDate)
        .sort((a, b) => (b.paidDate || '').localeCompare(a.paidDate || ''))[0]?.paidDate || '',
      loanType: loan.loanType,
      totalLoan: loan.totalLoan
    }));

    const data = {
      asOfDate: format(asOfDate, 'MMMM dd, yyyy'),
      employees: employeeData,
      totalEmployees: employeeData.length,
      totalAmortization: employeeData.reduce((sum, emp) => sum + emp.monthlyAmortization, 0),
      preparedBy: preparedBy.trim() || 'N/A',
      reportDate: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    };

    setReportData(data);
    setShowPreview(true);
  };

  const exportToExcel = () => {
    if (!reportData) return;

    const worksheet = XLSX.utils.json_to_sheet([
      { A: 'Employee Fully Paid Loans' },
      { A: `As of ${reportData.asOfDate}` },
      { A: '' },
      { A: 'Employee Name', B: 'Amount (Monthly Amortization)', C: 'Date Fully Paid', D: 'Loan Type' },
      ...reportData.employees.map((emp: any) => ({
        A: emp.employeeName,
        B: `₱${emp.monthlyAmortization.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        C: new Date(emp.dateFullyPaid).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
        D: emp.loanType
      })),
      { A: '' },
      { A: `Total Employees: ${reportData.totalEmployees}` },
      { A: `Total Monthly Amortization: ₱${reportData.totalAmortization.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
      { A: '' },
      { A: `Prepared by: ${reportData.preparedBy}` },
      { A: `Generated on: ${reportData.reportDate}` }
    ]);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Fully Paid Loans');
    
    XLSX.writeFile(workbook, `Fully_Paid_Loans_Report_${format(asOfDate!, 'yyyy-MM-dd')}.xlsx`);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="h-5 w-5 text-green-600" />
          <span>Employee Fully Paid Loans Report</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>As of Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !asOfDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {asOfDate ? format(asOfDate, "PPP") : <span>Pick as of date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={asOfDate}
                    onSelect={setAsOfDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
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
            <Button onClick={generateReport} className="bg-green-600 hover:bg-green-700">
              <Eye className="h-4 w-4 mr-2" />
              Generate Preview
            </Button>
            {reportData && (
              <Button onClick={exportToExcel} variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export to Excel
              </Button>
            )}
          </div>
        </div>

        {showPreview && reportData && (
          <Dialog open={showPreview} onOpenChange={setShowPreview}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Employee Fully Paid Loans Report - Preview</DialogTitle>
              </DialogHeader>
              <div className="bg-white p-6 max-h-96 overflow-y-auto">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold">Employee Fully Paid Loans</h2>
                  <p className="text-sm text-gray-600">As of {reportData.asOfDate}</p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-gray-300 text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 p-2 text-left">Employee Name</th>
                        <th className="border border-gray-300 p-2 text-right">Amount (Monthly Amortization)</th>
                        <th className="border border-gray-300 p-2 text-center">Date Fully Paid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.employees.map((employee: any, index: number) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                          <td className="border border-gray-300 p-2 font-medium">{employee.employeeName}</td>
                          <td className="border border-gray-300 p-2 text-right">
                            ₱{employee.monthlyAmortization.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="border border-gray-300 p-2 text-center">
                            {new Date(employee.dateFullyPaid).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-6 text-center">
                  <p className="font-semibold">Total Employees: {reportData.totalEmployees}</p>
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

export default FullyPaidLoansReport;
