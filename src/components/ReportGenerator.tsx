import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Eye, Calendar, Download } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { getLoans, getPayments } from '@/utils/storage';
import PrintPreview from './PrintPreview';
import * as XLSX from 'xlsx';

const ReportGenerator = () => {
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();
  const [preparedBy, setPreparedBy] = useState('');
  const [approvedBy, setApprovedBy] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const generateReportData = () => {
    if (!fromDate || !toDate) {
      alert('Please select both from and to dates');
      return null;
    }

    if (fromDate > toDate) {
      alert('From date cannot be later than to date');
      return null;
    }

    const loans = getLoans();
    const payments = getPayments();
    
    // Calculate the report period - use the first day of the previous month from selected date
    const reportMonth = new Date(fromDate.getFullYear(), fromDate.getMonth() - 1, 1);
    const reportEndDate = new Date(fromDate.getFullYear(), fromDate.getMonth(), 0); // Last day of previous month
    
    // Filter active loans that have monthly amortizations due in the report period
    // Include fully paid loans if their last payment was in the previous month
    // Exclude loans that have dateReloan (reloan records should not appear in report)
    const filteredLoans = loans.filter(loan => {
      // Exclude reloan records
      if (loan.dateReloan) return false;
      
      const loanStartDate = new Date(loan.startOfAmortization || loan.dateGranted);
      
      // Check if the loan was active during the report month OR if it's fully paid with last payment in previous month
      const wasActiveDuringReportMonth = loanStartDate <= reportEndDate;
      
      // Check if loan is fully paid and last payment was in the previous month
      const loanPayments = payments.filter(p => p.loanId === loan.id && p.isPaid);
      let lastPaymentInPreviousMonth = false;
      
      if (loanPayments.length > 0) {
        const lastPaidPayment = loanPayments.sort((a, b) => new Date(b.paidDate || '').getTime() - new Date(a.paidDate || '').getTime())[0];
        if (lastPaidPayment && lastPaidPayment.paidDate) {
          const lastPaymentDate = new Date(lastPaidPayment.paidDate);
          lastPaymentInPreviousMonth = lastPaymentDate >= reportMonth && lastPaymentDate <= reportEndDate;
        }
      }
      
      return wasActiveDuringReportMonth || lastPaymentInPreviousMonth;
    });

    // Group loans by employee and calculate their latest monthly amortization based on Payment Scheduler
    const employeeLoans = filteredLoans.reduce((acc, loan) => {
      const employeeName = loan.employeeName;
      
      // Get the latest paid payment for this loan from Payment Scheduler
      const loanPayments = payments.filter(p => p.loanId === loan.id && p.isPaid);
      const latestPaidPayment = loanPayments.length > 0 
        ? loanPayments.sort((a, b) => new Date(b.paidDate || '').getTime() - new Date(a.paidDate || '').getTime())[0]
        : null;
      
      // Include if there's a latest paid payment within the report period
      if (!latestPaidPayment) return acc;
      
      const latestPaidDate = new Date(latestPaidPayment.paidDate || '');
      if (latestPaidDate < reportMonth || latestPaidDate > reportEndDate) return acc;

      if (!acc[employeeName]) {
        acc[employeeName] = {
          employeeName,
          sssAmortization: 0,
          hdmfAmortization: 0,
          loans: []
        };
      }

      // Use the actual payment amount from the latest paid payment
      if (loan.loanType === 'SSS') {
        acc[employeeName].sssAmortization += latestPaidPayment.amount;
      } else if (loan.loanType === 'HDMF') {
        acc[employeeName].hdmfAmortization += latestPaidPayment.amount;
      }

      acc[employeeName].loans.push(loan);
      return acc;
    }, {} as any);

    const employeeData = Object.values(employeeLoans);

    // Calculate totals
    let totalSSSAmortization = 0;
    let totalHDMFAmortization = 0;

    employeeData.forEach((employee: any) => {
      totalSSSAmortization += employee.sssAmortization;
      totalHDMFAmortization += employee.hdmfAmortization;
      employee.sssAmortization = Math.round(employee.sssAmortization * 100) / 100;
      employee.hdmfAmortization = Math.round(employee.hdmfAmortization * 100) / 100;
      employee.totalAmortization = employee.sssAmortization + employee.hdmfAmortization;
    });

    return {
      fromDate: format(reportMonth, 'MMMM dd, yyyy'), // First day of report month
      toDate: format(reportEndDate, 'MMMM dd, yyyy'), // Last day of report month
      reportPeriod: format(reportMonth, 'MMMM yyyy'), // Show report month
      employees: employeeData,
      totalSSSAmortization: Math.round(totalSSSAmortization * 100) / 100,
      totalHDMFAmortization: Math.round(totalHDMFAmortization * 100) / 100,
      grandTotal: Math.round((totalSSSAmortization + totalHDMFAmortization) * 100) / 100,
      preparedBy: preparedBy.trim() || 'N/A',
      approvedBy: approvedBy.trim() || 'N/A',
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
      { A: 'JHAYMARTS INDUSTRIES, INC.' },
      { A: 'SALARY LOAN PER PAYROLL DEDUCTION REPORT' },
      { A: `As of ${data.reportPeriod}` },
      { A: '' },
      { A: 'Employee Name', B: 'SSS Amortization', C: 'HDMF Amortization', D: 'Total Amortization' },
      ...data.employees.map((emp: any) => ({
        A: emp.employeeName,
        B: `₱${emp.sssAmortization.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        C: `₱${emp.hdmfAmortization.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        D: `₱${emp.totalAmortization.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      })),
      { A: '' },
      { A: 'TOTALS:' },
      { A: 'Total SSS Amortization:', B: `₱${data.totalSSSAmortization.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
      { A: 'Total HDMF Amortization:', B: `₱${data.totalHDMFAmortization.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
      { A: 'Grand Total:', B: `₱${data.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
      { A: '' },
      { A: `Prepared by: ${data.preparedBy}` },
      { A: `Approved by: ${data.approvedBy}` },
      { A: `Generated on: ${data.reportDate}` }
    ]);

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payroll Deduction');
    
    XLSX.writeFile(workbook, `Payroll_Deduction_Report_${format(fromDate!, 'yyyy-MM-dd')}.xlsx`);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <span>Salary Loan per Payroll Deduction Report Generator</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>From Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !fromDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {fromDate ? format(fromDate, "PPP") : <span>Pick from date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={fromDate}
                    onSelect={setFromDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            <div>
              <Label>To Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !toDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {toDate ? format(toDate, "PPP") : <span>Pick to date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={toDate}
                    onSelect={setToDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="preparedBy">Prepared By</Label>
              <Input
                id="preparedBy"
                value={preparedBy}
                onChange={(e) => setPreparedBy(e.target.value)}
                placeholder="Prepared by"
              />
            </div>
            <div>
              <Label htmlFor="approvedBy">Approved By</Label>
              <Input
                id="approvedBy"
                value={approvedBy}
                onChange={(e) => setApprovedBy(e.target.value)}
                placeholder="Approved by"
              />
            </div>
          </div>

          <div className="flex space-x-2">
            <Button onClick={generateReport} className="bg-blue-600 hover:bg-blue-700">
              <Eye className="h-4 w-4 mr-2" />
              Generate Print Preview
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
                <DialogTitle>Salary Loan per Payroll Deduction Report - Print Preview</DialogTitle>
              </DialogHeader>
              <PrintPreview reportData={reportData} onClose={() => setShowPreview(false)} />
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
};

export default ReportGenerator;
