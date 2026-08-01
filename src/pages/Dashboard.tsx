
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
  Plus,
  LifeBuoy,
  CloudLightning,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getLoans, refreshLoanBalances } from '@/utils/storage';
import { Loan } from '@/types/loan';
import { useParallaxTilt } from '@/hooks/use-parallax-tilt';

const Dashboard = () => {
  const { logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const tilt = useParallaxTilt(5);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [stats, setStats] = useState({
    totalLoans: 0,
    activeLoans: 0,
    totalPrincipal: 0,
    totalRemaining: 0,
    hdmfLoans: 0,
    sssLoans: 0,
    sssEmergencyLoans: 0,
    sssCalamityLoans: 0,
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
    const activeLoans = allLoans.filter((loan) => loan.isActive);
    const totalPrincipal = activeLoans.reduce((sum, loan) => sum + loan.principalAmount, 0);
    const totalRemaining = activeLoans.reduce((sum, loan) => sum + loan.remainingBalance, 0);

    setStats({
      totalLoans: allLoans.length,
      activeLoans: activeLoans.length,
      totalPrincipal,
      totalRemaining,
      hdmfLoans: activeLoans.filter((loan) => loan.loanType === 'HDMF').length,
      sssLoans: activeLoans.filter((loan) => loan.loanType === 'SSS').length,
      sssEmergencyLoans: activeLoans.filter((loan) => loan.loanType === 'SSS_EMERGENCY').length,
      sssCalamityLoans: activeLoans.filter((loan) => loan.loanType === 'SSS_CALAMITY').length,
    });
  }, [isAuthenticated, navigate]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
    }).format(amount);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const recentLoans = loans
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  const loanTypeLabel: Record<Loan['loanType'], string> = {
    SSS: 'SSS',
    HDMF: 'HDMF',
    SSS_EMERGENCY: 'SSS Emergency',
    SSS_CALAMITY: 'SSS Calamity',
  };

  const menuItems = [
    {
      title: 'HDMF Loan Entry',
      description: 'Create new HDMF loan applications with automated calculations',
      icon: Building2,
      material: 'icon-emerald',
      route: '/hdmf-loan',
      cta: 'New HDMF Loan',
      badge: `${stats.hdmfLoans} Active`,
    },
    {
      title: 'SSS Loan Entry',
      description: 'Create new SSS loan applications with flexible interest options',
      icon: User,
      material: 'icon-emerald',
      route: '/sss-loan',
      cta: 'New SSS Loan',
      badge: `${stats.sssLoans} Active`,
    },
    {
      title: 'SSS Emergency Loan',
      description: 'Create SSS Emergency Loan applications for employees',
      icon: LifeBuoy,
      material: 'icon-emerald',
      route: '/sss-emergency-loan',
      cta: 'New SSS Emergency Loan',
      badge: `${stats.sssEmergencyLoans} Active`,
    },
    {
      title: 'SSS Calamity Loan',
      description: 'Create SSS Calamity Loan applications with automatic scheduling',
      icon: CloudLightning,
      material: 'icon-emerald',
      route: '/sss-calamity-loan',
      cta: 'New SSS Calamity Loan',
      badge: `${stats.sssCalamityLoans} Active`,
    },
    {
      title: 'Search Loan Info',
      description: 'Find loan details by employee name with complete history',
      icon: Search,
      material: 'icon-chrome',
      route: '/search',
      cta: 'Search Loans',
    },
    {
      title: 'Payment Scheduler',
      description: 'Manage payment schedules and track payment dates for all employees',
      icon: Calendar,
      material: 'icon-chrome',
      route: '/payment-scheduler',
      cta: 'Manage Payments',
    },
    {
      title: 'Reports',
      description: 'Generate print and Excel reports with filtering options',
      icon: FileText,
      material: 'icon-chrome',
      route: '/reports',
      cta: 'Generate Reports',
      ctaIcon: Download,
    },
    {
      title: 'Backup & Restore',
      description: 'Backup system data and restore from previous backups',
      icon: Database,
      material: 'icon-chrome',
      route: '/backup',
      cta: 'Manage Data',
    },
  ];


  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="glass-panel-dark rounded-none border-x-0 border-t-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <img
                src="/lovable-uploads/32a7fd81-825f-42e8-930f-88d1fe80cb7d.png"
                alt="Jhaymarts Industries Inc."
                className="h-12 w-auto drop-shadow-[0_6px_14px_rgba(0,0,0,0.45)]"
              />
              <div>
                <h1 className="text-2xl font-bold text-white text-3d-light">Jhaymarts Loan System</h1>
                <p className="text-sm text-white/70">SSS &amp; HDMF Loan Management</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="btn-glass flex h-11 items-center gap-2 px-6 text-sm font-semibold text-white"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Loans', value: `${stats.totalLoans}`, icon: FileText, material: 'icon-chrome' },
            { label: 'Active Loans', value: `${stats.activeLoans}`, icon: TrendingUp, material: 'icon-emerald' },
            { label: 'Total Principal', value: formatCurrency(stats.totalPrincipal), icon: DollarSign, material: 'icon-emerald' },
            { label: 'Total Outstanding', value: formatCurrency(stats.totalRemaining), icon: TrendingUp, material: 'icon-chrome' },
          ].map((stat, i) => (
            <Card
              key={stat.label}
              onMouseMove={tilt.onMouseMove}
              onMouseLeave={tilt.onMouseLeave}
              className="glass-panel-dark light-follow floating-card animate-rise border-0 group"
              style={{ animationDelay: `${i * 70}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white/70 text-sm font-medium">{stat.label}</p>
                    <p className="text-2xl font-bold text-white text-3d-light">{stat.value}</p>
                  </div>
                  <div className={`icon-3d ${stat.material} w-12 h-12 flex items-center justify-center text-white`}>
                    <stat.icon className="h-6 w-6 relative z-10 drop-shadow" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Menu Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {menuItems.map((item, i) => {
            const CtaIcon = item.ctaIcon ?? Plus;
            return (
              <Card
                key={item.title}
                onMouseMove={tilt.onMouseMove}
                onMouseLeave={tilt.onMouseLeave}
                onClick={() => navigate(item.route)}
                className="glass-panel light-follow floating-card animate-rise group cursor-pointer border-0"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center space-x-3">
                    <div
                      className={`icon-3d ${item.material} w-12 h-12 flex items-center justify-center`}
                    >
                      <item.icon className="h-5 w-5 text-white relative z-10 drop-shadow" />
                    </div>
                    <span className="text-3d">{item.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">{item.description}</p>
                  {item.badge && (
                    <div className="mb-4">
                      <Badge className="rounded-full bg-primary/10 text-primary border border-primary/20">
                        {item.badge}
                      </Badge>
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(item.route);
                    }}
                    className="btn-glass btn-emerald flex h-11 w-full items-center justify-center gap-2 text-sm font-semibold"
                  >
                    <CtaIcon className="h-4 w-4" />
                    {item.cta}
                  </button>
                </CardContent>
              </Card>
            );
          })}
        </div>


        {/* Recent Loans */}
        <Card className="glass-panel">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
              <span className="text-3d">Recent Loans</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentLoans.length > 0 ? (
              <div className="space-y-3">
                {recentLoans.map((loan) => (
                  <div
                    key={loan.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-foreground/[0.04] border border-foreground/5"
                  >
                    <div className="flex items-center space-x-3">
                      <Badge variant="secondary">{loanTypeLabel[loan.loanType]}</Badge>
                      <div>
                        <p className="font-medium">{loan.employeeName}</p>
                        <p className="text-sm text-muted-foreground">{loan.department}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(loan.principalAmount)}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(loan.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No loans created yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
