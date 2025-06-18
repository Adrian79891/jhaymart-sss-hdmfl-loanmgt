
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface PrintPreviewProps {
  reportData: any;
  onClose: () => void;
}

const PrintPreview: React.FC<PrintPreviewProps> = ({ reportData, onClose }) => {
  const reportRef = useRef<HTMLDivElement>(null);

  const downloadPDF = async () => {
    if (!reportRef.current) return;

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Salary_Loan_Statement_${reportData.employeeName}_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
  };

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
        <Button onClick={downloadPDF} className="bg-red-600 hover:bg-red-700">
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </div>

      <div 
        ref={reportRef} 
        className="bg-white p-8 min-h-[11in] w-full mx-auto shadow-lg"
        style={{ fontFamily: 'Arial, sans-serif' }}
      >
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">SALARY LOAN STATEMENT</h1>
          <p className="text-sm text-gray-600">As of {reportData.reportDate}</p>
        </div>

        {/* Employee Information */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Employee Information</h2>
          <div className="border-b pb-2">
            <p><strong>Employee Name:</strong> {reportData.employeeName}</p>
          </div>
        </div>

        {/* Loan Details */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Loan Details</h2>
          
          <div className="grid grid-cols-2 gap-8 mb-6">
            <div className="border rounded p-4">
              <h3 className="font-semibold text-center mb-3">SSS LOAN</h3>
              <div className="text-center">
                <p className="text-sm text-gray-600">Balance as of 1st day of the month</p>
                <p className="text-2xl font-bold text-blue-600">
                  ₱{reportData.sssBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            
            <div className="border rounded p-4">
              <h3 className="font-semibold text-center mb-3">HDMF LOAN</h3>
              <div className="text-center">
                <p className="text-sm text-gray-600">Balance as of 1st day of the month</p>
                <p className="text-2xl font-bold text-orange-600">
                  ₱{reportData.hdmfBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="border-t-2 border-gray-800 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">TOTAL LOAN BALANCE:</span>
              <span className="text-2xl font-bold text-red-600">
                ₱{reportData.totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Detailed Loan Information */}
        {reportData.loans.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Detailed Loan Information</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2 text-left">Loan Type</th>
                    <th className="border border-gray-300 p-2 text-left">Date Granted</th>
                    <th className="border border-gray-300 p-2 text-right">Principal</th>
                    <th className="border border-gray-300 p-2 text-right">Monthly Payment</th>
                    <th className="border border-gray-300 p-2 text-right">Remaining Balance</th>
                    <th className="border border-gray-300 p-2 text-center">Remaining Months</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.loans.map((loan: any, index: number) => (
                    <tr key={index}>
                      <td className="border border-gray-300 p-2">{loan.loanType}</td>
                      <td className="border border-gray-300 p-2">
                        {new Date(loan.dateGranted).toLocaleDateString('en-US')}
                      </td>
                      <td className="border border-gray-300 p-2 text-right">
                        ₱{loan.principalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="border border-gray-300 p-2 text-right">
                        ₱{loan.monthlyAmortization.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="border border-gray-300 p-2 text-right">
                        ₱{loan.remainingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="border border-gray-300 p-2 text-center">{loan.remainingMonths}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

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
          <p>Generated on {new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}</p>
        </div>
      </div>

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
