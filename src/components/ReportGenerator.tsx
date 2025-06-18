
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileText, Eye, Download } from 'lucide-react';
import { getLoans } from '@/utils/storage';
import { Loan } from '@/types/loan';
import PrintPreview from './PrintPreview';

const ReportGenerator = () => {
  const [employeeName, setEmployeeName] = useState('');
  const [preparedBy, setPreparedBy] = useState('');
  const [approvedBy, setApprovedBy] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [reportData, setReportData] = useState<any>(null);

  const generateReport = () => {
    if (!employeeName.trim()) {
      alert('Please enter an employee name');
      return;
    }

    const loans = getLoans();
    const employeeLoans = loans.filter(loan => 
      loan.employeeName.toLowerCase().includes(employeeName.toLowerCase()) && 
      loan.isActive
    );

    // Calculate balances as of 1st day of current month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    let sssBalance = 0;
    let hdmfBalance = 0;

    employeeLoans.forEach(loan => {
      if (loan.loanType === 'SSS') {
        sssBalance += loan.remainingBalance;
      } else if (loan.loanType === 'HDMF') {
        hdmfBalance += loan.remainingBalance;
      }
    });

    const data = {
      employeeName: employeeName.trim(),
      sssBalance: Math.round(sssBalance * 100) / 100,
      hdmfBalance: Math.round(hdmfBalance * 100) / 100,
      totalBalance: Math.round((sssBalance + hdmfBalance) * 100) / 100,
      preparedBy: preparedBy.trim() || 'N/A',
      approvedBy: approvedBy.trim() || 'N/A',
      reportDate: firstDayOfMonth.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      loans: employeeLoans
    };

    setReportData(data);
    setShowPreview(true);
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5 text-blue-600" />
          <span>Salary Loan Statement Generator</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label htmlFor="employeeName">Employee Name</Label>
            <Input
              id="employeeName"
              value={employeeName}
              onChange={(e) => setEmployeeName(e.target.value)}
              placeholder="Enter employee name"
            />
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
              Generate Preview
            </Button>
          </div>
        </div>

        {showPreview && reportData && (
          <Dialog open={showPreview} onOpenChange={setShowPreview}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Salary Loan Statement - Print Preview</DialogTitle>
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
