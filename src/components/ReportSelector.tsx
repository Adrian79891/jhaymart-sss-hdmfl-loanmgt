
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, Users, CreditCard } from 'lucide-react';
import ReportGenerator from './ReportGenerator';
import FullyPaidLoansReport from './FullyPaidLoansReport';
import NewlyGrantedLoansReport from './NewlyGrantedLoansReport';

const ReportSelector = () => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Jhaymarts Loan System Reports</h1>
        <p className="text-gray-600">Generate comprehensive loan reports for your organization</p>
      </div>

      <Tabs defaultValue="payroll-deduction" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="payroll-deduction" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Payroll Deduction</span>
          </TabsTrigger>
          <TabsTrigger value="fully-paid" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Fully Paid Loans</span>
          </TabsTrigger>
          <TabsTrigger value="newly-granted" className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>Newly Granted Loans</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payroll-deduction">
          <ReportGenerator />
        </TabsContent>

        <TabsContent value="fully-paid">
          <FullyPaidLoansReport />
        </TabsContent>

        <TabsContent value="newly-granted">
          <NewlyGrantedLoansReport />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReportSelector;
