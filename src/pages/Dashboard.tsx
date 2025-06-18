
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Building2, 
  Search, 
  FileText, 
  Download, 
  Database,
  Calendar,
  DollarSign,
  TrendingUp,
  LogOut,
  Plus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getLoans, refreshLoanBalances } from '@/utils/storage';
import { Loan } from '@/types/loan';

const Dashboard = () => {
  const { logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [stats, setStats] = useState({
    totalLoans: 0,
    activeLoans: 0,
    totalPrincipal: 0,
    totalRemaining: 0,
    hdmfLoans: 0,
    sssLoans: 0
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    // Refresh loan balances when dashboard loads
    refreshLoanBalances();
    
    const allLoans = getLoans();
    setLoans(allLoans);

    // Calculate statistics
    const activeLoans = allLoans.filter(loan => loan.isActive);
    const totalPrincipal = activeLoans.reduce((sum, loan) => sum + loan.principalAmount, 0);
    const totalRemaining = activeLoans.reduce((sum, loan) => sum + loan.remainingBalance, 0);
    const hdmfLoans = activeLoans.filter(loan => loan.loanType === 'HDMF').length;
    const sssLoans = activeLoans.filter(loan => loan.loanType === 'SSS').length;

    setStats({
      totalLoans: allLoans.length,
      activeLoans: activeLoans.length,
      totalPrincipal,
      totalRemaining,
      hdmfLoans,
      sssLoans
    });
  }, [isAuthenticated, navigate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const recentLoans = loans
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-4">
                <img 
                  src="/lovable-uploads/32a7fd81-825f-42e8-930f-88d1fe80cb7d.png" 
                  alt="Jhaymarts Industries Inc." 
                  className="h-12 w-auto"
                />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Jhaymarts Loan System</h1>
                  <p className="text-sm text-gray-500">SSS & HDMF Loan Management</p>
                </div>
              </div>
            </div>
            <Button 
              onClick={handleLogout}
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Total Loans</p>
                  <p className="text-3xl font-bold">{stats.totalLoans}</p>
                </div>
                <FileText className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Active Loans</p>
                  <p className="text-3xl font-bold">{stats.activeLoans}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total Principal</p>
                  <p className="text-lg font-bold">{formatCurrency(stats.totalPrincipal)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Total Outstanding</p>
                  <p className="text-lg font-bold">{formatCurrency(stats.totalRemaining)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-red-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Menu Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* HDMF Loan Entry */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <span>HDMF Loan Entry</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Create new HDMF loan applications with automated calculations</p>
              <div className="flex justify-between items-center mb-4">
                <Badge className="bg-blue-100 text-blue-800">{stats.hdmfLoans} Active</Badge>
              </div>
              <Button 
                onClick={() => navigate('/hdmf-loan')}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                New HDMF Loan
              </Button>
            </CardContent>
          </Card>

          {/* SSS Loan Entry */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center group-hover:bg-purple-600 transition-colors">
                  <User className="h-5 w-5 text-white" />
                </div>
                <span>SSS Loan Entry</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Create new SSS loan applications with flexible interest options</p>
              <div className="flex justify-between items-center mb-4">
                <Badge className="bg-purple-100 text-purple-800">{stats.sssLoans} Active</Badge>
              </div>
              <Button 
                onClick={() => navigate('/sss-loan')}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                New SSS Loan
              </Button>
            </CardContent>
          </Card>

          {/* Search Loan */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center group-hover:bg-green-600 transition-colors">
                  <Search className="h-5 w-5 text-white" />
                </div>
                <span>Search Loan Info</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Find loan details by employee name with complete history</p>
              <Button 
                onClick={() => navigate('/search')}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Search className="h-4 w-4 mr-2" />
                Search Loans
              </Button>
            </CardContent>
          </Card>

          {/* Payment Scheduler */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center group-hover:bg-orange-600 transition-colors">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <span>Payment Scheduler</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Manage payment schedules and track payment dates for all employees</p>
              <Button 
                onClick={() => navigate('/payment-scheduler')}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                <Calendar className="h-4 w-4 mr-2" />
                Manage Payments
              </Button>
            </CardContent>
          </Card>

          {/* Manual Report Generator */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center group-hover:bg-red-600 transition-colors">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <span>Reports</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Generate PDF and Excel reports with filtering options</p>
              <Button 
                onClick={() => navigate('/reports')}
                className="w-full bg-red-600 hover:bg-red-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Generate Reports
              </Button>
            </CardContent>
          </Card>

          {/* Backup / Restore */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center group-hover:bg-gray-600 transition-colors">
                  <Database className="h-5 w-5 text-white" />
                </div>
                <span>Backup & Restore</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">Backup system data and restore from previous backups</p>
              <Button 
                onClick={() => navigate('/backup')}
                variant="outline"
                className="w-full"
              >
                <Database className="h-4 w-4 mr-2" />
                Manage Data
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Loans */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span>Recent Loans</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentLoans.length > 0 ? (
              <div className="space-y-3">
                {recentLoans.map((loan) => (
                  <div key={loan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge 
                        variant={loan.loanType === 'HDMF' ? 'default' : 'secondary'}
                        className={loan.loanType === 'HDMF' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}
                      >
                        {loan.loanType}
                      </Badge>
                      <div>
                        <p className="font-medium">{loan.employeeName}</p>
                        <p className="text-sm text-gray-500">{loan.department}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(loan.principalAmount)}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(loan.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No loans created yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
