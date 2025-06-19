
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface PrintPreviewProps {
  reportData: any;
  onClose: () => void;
}

const PrintPreview: React.FC<PrintPreviewProps> = ({ reportData, onClose }) => {
  const reportRef = useRef<HTMLDivElement>(null);

  const printReport = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end space-x-2 mb-4 no-print">
        <Button onClick={printReport} variant="outline">
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
      </div>

      <div 
        ref={reportRef} 
        className="bg-white p-8 min-h-[11in] w-full mx-auto shadow-lg print-area"
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-1">JHAYMARTS INDUSTRIES, INC.</h1>
          <h2 className="text-2xl font-bold mb-2">SALARY LOAN PER PAYROLL DEDUCTION REPORT</h2>
          <p className="text-sm text-gray-600">As of {reportData.reportPeriod}</p>
        </div>

        {/* Employee Monthly Amortization Summary */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Monthly Payroll Deductions</h2>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-3 text-left">Employee Name</th>
                  <th className="border border-gray-300 p-3 text-right">SSS Loan Monthly</th>
                  <th className="border border-gray-300 p-3 text-right">HDMF Loan Monthly</th>
                  <th className="border border-gray-300 p-3 text-right">Total Monthly</th>
                </tr>
              </thead>
              <tbody>
                {reportData.employees.map((employee: any, index: number) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="border border-gray-300 p-3 font-medium">{employee.employeeName}</td>
                    <td className="border border-gray-300 p-3 text-right">
                      ₱{employee.sssAmortization.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="border border-gray-300 p-3 text-right">
                      ₱{employee.hdmfAmortization.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="border border-gray-300 p-3 text-right font-semibold">
                      ₱{employee.totalAmortization.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
                
                {/* Totals Row */}
                <tr className="bg-gray-200 font-bold">
                  <td className="border border-gray-300 p-3 text-center">TOTAL</td>
                  <td className="border border-gray-300 p-3 text-right text-blue-600">
                    ₱{reportData.totalSSSAmortization.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="border border-gray-300 p-3 text-right text-orange-600">
                    ₱{reportData.totalHDMFAmortization.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="border border-gray-300 p-3 text-right text-red-600">
                    ₱{reportData.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Boxes */}
        <div className="grid grid-cols-3 gap-6 mb-8">
          <div className="border rounded p-4 text-center">
            <h3 className="font-semibold mb-2 text-blue-600">Total SSS Loan Monthly</h3>
            <p className="text-xl font-bold">
              ₱{reportData.totalSSSAmortization.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          
          <div className="border rounded p-4 text-center">
            <h3 className="font-semibold mb-2 text-orange-600">Total HDMF Loan Monthly</h3>
            <p className="text-xl font-bold">
              ₱{reportData.totalHDMFAmortization.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="border rounded p-4 text-center bg-gray-50">
            <h3 className="font-semibold mb-2 text-red-600">Grand Total Monthly</h3>
            <p className="text-2xl font-bold">
              ₱{reportData.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Signatures */}
        <div className="mt-16">
          <div className="grid grid-cols-2 gap-8">
            <div className="text-center">
              <div className="border-b border-gray-400 mb-2 h-8"></div>
              <p className="font-semibold">Prepared By</p>
              <p className="text-sm">{reportData.preparedBy}</p>
            </div>
            <div className="text-center">
              <div className="border-b border-gray-400 mb-2 h-8"></div>
              <p className="font-semibold">Approved By</p>
              <p className="text-sm">{reportData.approvedBy}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Generated on {reportData.reportDate} at {new Date().toLocaleTimeString('en-US', { 
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
        </div>
      </div>

      {/* Print styles */}
      <style>
        {`
          @media print {
            .no-print {
              display: none !important;
            }
            
            body * {
              visibility: hidden;
            }
            
            .print-area, .print-area * {
              visibility: visible;
            }
            
            .print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
          }
        `}
      </style>
    </div>
  );
};

export default PrintPreview;
