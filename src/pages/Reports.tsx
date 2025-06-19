
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ReportSelector from '@/components/ReportSelector';

const Reports = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Button
            onClick={() => navigate('/dashboard')}
            variant="outline"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Print</h1>
          <p className="text-gray-600">Generate comprehensive loan reports and export to Excel</p>
        </div>

        <div className="grid gap-6">
          <ReportSelector />
        </div>
      </div>
    </div>
  );
};

export default Reports;
