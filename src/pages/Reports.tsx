
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Download, Calendar } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ReportGenerator from '@/components/ReportGenerator';

const Reports = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Export</h1>
          <p className="text-gray-600">Generate and download loan reports</p>
        </div>

        <div className="grid gap-6">
          <ReportGenerator />

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-green-600" />
                <span>Payment Scheduler</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                View and manage payment schedules for all employees. Search by employee name and manually update payment statuses.
              </p>
              <Button 
                onClick={() => navigate('/payment-scheduler')}
                className="bg-green-600 hover:bg-green-700"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Open Payment Scheduler
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Download className="h-5 w-5 text-red-600" />
                <span>Export Options</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">
                Export loan data in various formats for backup or external analysis.
              </p>
              <div className="space-y-2">
                <Button className="w-full md:w-auto mr-0 md:mr-2 mb-2 md:mb-0 bg-red-600 hover:bg-red-700">
                  <Download className="h-4 w-4 mr-2" />
                  Export All Loans to PDF
                </Button>
                <Button variant="outline" className="w-full md:w-auto">
                  <Download className="h-4 w-4 mr-2" />
                  Export to Excel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Reports;
