
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, User, Calendar, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { searchLoansByEmployee } from '@/utils/storage';
import { Loan } from '@/types/loan';

const SearchLoan = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Loan[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  if (!isAuthenticated) {
    navigate('/');
    return null;
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      const results = searchLoansByEmployee(searchTerm.trim());
      setSearchResults(results);
      setHasSearched(true);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

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
          <h1 className="text-3xl font-bold text-gray-900">Search Loan Information</h1>
          <p className="text-gray-600">Find loan details by employee name</p>
        </div>

        <Card className="shadow-lg mb-6">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5 text-green-600" />
              <span>Employee Loan Search</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="searchTerm" className="sr-only">Employee Name</Label>
                <Input
                  id="searchTerm"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Enter employee name..."
                  className="h-12"
                />
              </div>
              <Button type="submit" className="h-12 px-8 bg-green-600 hover:bg-green-700">
                <Search className="h-4 w-4 mr-2" />
                Search
              </Button>
            </form>
          </CardContent>
        </Card>

        {hasSearched && (
          <div className="space-y-4">
            {searchResults.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Loans Found</h3>
                  <p className="text-gray-600">No loan records found for "{searchTerm}"</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Search Results ({searchResults.length} loan{searchResults.length !== 1 ? 's' : ''} found)
                  </h2>
                </div>
                
                <div className="grid gap-4">
                  {searchResults.map((loan) => (
                    <Card key={loan.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center space-x-3">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {loan.employeeName}
                              </h3>
                              <Badge 
                                variant={loan.loanType === 'HDMF' ? 'default' : 'secondary'}
                                className={loan.loanType === 'HDMF' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}
                              >
                                {loan.loanType}
                              </Badge>
                              <Badge 
                                variant={loan.isActive ? 'default' : 'secondary'}
                                className={loan.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                              >
                                {loan.isActive ? 'Active' : 'Inactive'}
                              </Badge>
                              {loan.isReloan && (
                                <Badge variant="outline" className="bg-orange-100 text-orange-800">
                                  Reloan
                                </Badge>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Department</p>
                                <p className="font-medium">{loan.department}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Date Granted</p>
                                <div className="flex items-center space-x-1">
                                  <Calendar className="h-4 w-4 text-gray-400" />
                                  <span className="font-medium">{new Date(loan.dateGranted).toLocaleDateString()}</span>
                                </div>
                              </div>
                              <div>
                                <p className="text-gray-500">Amortization Period</p>
                                <p className="font-medium">{loan.amortizationPeriod}</p>
                              </div>
                            </div>
                          </div>
                          
                          <div className="mt-4 lg:mt-0 lg:ml-6 lg:text-right space-y-2">
                            <div className="flex lg:flex-col lg:items-end space-x-4 lg:space-x-0 lg:space-y-2">
                              <div>
                                <p className="text-sm text-gray-500">Principal Amount</p>
                                <p className="font-semibold text-green-600">{formatCurrency(loan.principalAmount)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Monthly Amortization</p>
                                <p className="font-semibold">{formatCurrency(loan.monthlyAmortization)}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Remaining Balance</p>
                                <p className="font-semibold text-red-600">{formatCurrency(loan.remainingBalance)}</p>
                              </div>
                            </div>
                            <div className="flex lg:justify-end">
                              <Badge variant="outline" className="text-xs">
                                {loan.remainingMonths} months remaining
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchLoan;
