
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, Upload, RotateCcw, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { getLoans, getPayments, saveLoans, savePayments } from '@/utils/storage';

const BackupRestore = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    navigate('/');
    return null;
  }

  const handleDownloadBackup = () => {
    const loans = getLoans();
    const payments = getPayments();
    
    const backupData = {
      loans,
      payments,
      timestamp: new Date().toISOString(),
      version: '1.0'
    };

    const dataStr = JSON.stringify(backupData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `jhaymarts_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Backup Downloaded",
      description: "System data has been successfully backed up.",
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const backupData = JSON.parse(e.target?.result as string);
        
        if (backupData.loans && backupData.payments) {
          saveLoans(backupData.loans);
          savePayments(backupData.payments);
          
          toast({
            title: "Restore Successful",
            description: "System data has been restored from backup.",
          });
        } else {
          throw new Error('Invalid backup format');
        }
      } catch (error) {
        toast({
          title: "Restore Failed",
          description: "Invalid backup file format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
    
    // Reset the input
    event.target.value = '';
  };

  const handleResetSystem = () => {
    const confirmed = window.confirm(
      'Are you sure you want to reset the entire system? This action cannot be undone and will delete all loan data, payments, and dashboard statistics.'
    );
    
    if (confirmed) {
      const doubleConfirmed = window.confirm(
        'This is your final warning. All data will be permanently deleted including all loans, payments, and dashboard statistics. Continue?'
      );
      
      if (doubleConfirmed) {
        // Clear all localStorage data
        localStorage.clear();
        
        // Clear all sessionStorage data
        sessionStorage.clear();
        
        // Reset storage with empty arrays
        saveLoans([]);
        savePayments([]);
        
        console.log('System completely reset - all data cleared');
        
        toast({
          title: "System Reset Complete",
          description: "All system data has been permanently deleted.",
        });
        
        // Redirect to login after reset
        setTimeout(() => {
          navigate('/');
          window.location.reload(); // Force a complete page reload to reset all state
        }, 2000);
      }
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Backup & Restore System</h1>
          <p className="text-gray-600">Manage your system data and create backups</p>
        </div>

        <div className="grid gap-6">
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Download className="h-5 w-5 text-green-600" />
                <span>Download Backup</span>
              </CardTitle>
              <CardDescription>
                Download your entire loan database as a JSON file for safekeeping
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleDownloadBackup} className="bg-green-600 hover:bg-green-700">
                <Download className="h-4 w-4 mr-2" />
                Download System Backup
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Upload className="h-5 w-5 text-blue-600" />
                <span>Restore from Backup</span>
              </CardTitle>
              <CardDescription>
                Upload a compatible backup file to restore your data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <input
                  type="file"
                  accept=".json,.txt"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-sm text-gray-600">
                  Supported formats: .json, .txt
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                <span>Danger Zone</span>
              </CardTitle>
              <CardDescription>
                Irreversible actions that will affect your entire system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-semibold text-red-800 mb-2">Reset Entire System</h4>
                  <p className="text-sm text-red-700 mb-4">
                    This will permanently delete all loan records, payments, dashboard statistics, and system data. 
                    This action cannot be undone and will reset everything including Total Loans, Active Loans, Total Principal, and Outstanding Loans to zero.
                  </p>
                  <Button 
                    onClick={handleResetSystem}
                    variant="destructive"
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset System
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BackupRestore;
