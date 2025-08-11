import React, { useState } from 'react';
import { Smartphone, CreditCard, AlertCircle, Loader } from 'lucide-react';

interface StreamlinedRazorpayUPIProps {
  amount: number;
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
  disabled?: boolean;
}

export const StreamlinedRazorpayUPI: React.FC<StreamlinedRazorpayUPIProps> = ({
  amount,
  onSuccess,
  onError = () => {},
  disabled = false
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [upiId, setUpiId] = useState('');

  const handleUPIPayment = async () => {
    if (!upiId.trim()) {
      onError('Please enter a valid UPI ID');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Simulate UPI payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate mock payment ID
      const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      onSuccess(paymentId);
    } catch (error) {
      onError('UPI payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Smartphone className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">UPI Payment</h3>
          <p className="text-sm text-gray-600">Pay using your UPI ID</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="upi-id" className="block text-sm font-medium text-gray-700 mb-2">
            Enter UPI ID
          </label>
          <div className="relative">
            <input
              id="upi-id"
              type="text"
              value={upiId}
              onChange={(e) => setUpiId(e.target.value)}
              placeholder="yourname@paytm"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={disabled || isProcessing}
            />
            <CreditCard className="absolute right-3 top-3.5 w-5 h-5 text-gray-400" />
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Amount to pay:</span>
            <span className="text-xl font-bold text-gray-900">₹{amount.toFixed(2)}</span>
          </div>
        </div>

        <button
          onClick={handleUPIPayment}
          disabled={disabled || isProcessing || !upiId?.trim()}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Smartphone className="w-5 h-5" />
              Pay with UPI
            </>
          )}
        </button>

        <div className="flex items-start gap-2 text-sm text-gray-600">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>
            Your UPI payment will be processed securely. You'll receive a confirmation once the payment is successful.
          </p>
        </div>
      </div>
    </div>
  );
};

export default StreamlinedRazorpayUPI;