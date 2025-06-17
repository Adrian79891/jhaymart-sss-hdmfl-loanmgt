
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Home, Users, Search, FileText, Download, Database, LogOut } from 'lucide-react';

const Dashboard = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    {
      title: 'HDMF Loan Entry',
      description: 'Create and manage HDMF loan applications',
      icon: Home,
      path: '/hdmf-loan',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'SSS Loan Entry',
      description: 'Create and manage SSS loan applications',
      icon: Users,
      path: '/sss-loan',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'Search Loan Info',
      description: 'Search loans by employee name',
      icon: Search,
      path: '/search',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Auto PDF Report',
      description: 'Generate and view loan reports',
      icon: FileText,
      path: '/reports',
      color: 'bg-orange-500 hover:bg-orange-600'
    },
    {
      title: 'Manual Report Generator',
      description: 'Custom PDF and Excel reports',
      icon: Download,
      path: '/reports',
      color: 'bg-red-500 hover:bg-red-600'
    },
    {
      title: 'Backup / Restore',
      description: 'System data management',
      icon: Database,
      path: '/backup',
      color: 'bg-gray-500 hover:bg-gray-600'
    }
  ];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <img src="/lovable-uploads/5759f407-e51d-4223-97b8-5049d0cfc448.png" alt="Jhaymarts" className="h-8 mr-3" />
              <h1 className="text-xl font-semibold text-gray-900">Loan Monitoring System</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user}</span>
              <Button
                onClick={handleLogout}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Main Menu</h2>
          <p className="text-gray-600">Select an option to manage loans and generate reports</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <Card
                key={index}
                className="hover:shadow-lg transition-shadow duration-200 cursor-pointer group"
                onClick={() => navigate(item.path)}
              >
                <CardHeader className="pb-3">
                  <div className={`w-12 h-12 rounded-lg ${item.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200`}>
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-gray-700">
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {item.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
