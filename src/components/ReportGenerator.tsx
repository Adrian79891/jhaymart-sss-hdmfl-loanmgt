
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FileText, Eye, Calendar } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { getLoans } from '@/utils/storage';
import PrintPreview from './PrintPreview';

const ReportGenerator = () => {
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();
  const [preparedBy, setPreparedBy] = useState('');
  const [approvedBy, setApprovedBy] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const generateReport = () => {
    if (!fromDate || !toDate) {
      alert('Please select both from and to dates');
      return;
    }

    if (fromDate > toDate) {
      alert('From date cannot be later than to date');
      return;
    }

    const loans = getLoans();
    const activeLoans = loans.filter(loan => loan.isActive && loan.remainingBalance > 0);

    // Group loans by employee
    const employeeLoans = activeLoans.reduce((acc, loan) => {
      const employeeName = loan.employeeName;
      if (!acc[employeeName]) {
        acc[employeeName] = {
          employeeName,
          sssAmortization: 0,
          hdmfAmortization: 0,
          loans: []
        };
      }

      if (loan.loanType === 'SSS') {
        acc[employeeName].sssAmortization += loan.monthlyAmortization;
      } else if (loan.loanType === 'HDMF') {
        acc[employeeName].hdmfAmortization += loan.monthlyAmortization;
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

    const data = {
      fromDate: format(fromDate, 'MMMM dd, yyyy'),
      toDate: format(toDate, 'MMMM dd, yyyy'),
      reportPeriod: `${format(toDate, 'MMMM yyyy')}`,
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

    setReportData(data);
    setShowPreview(true);
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
