import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Loader, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { apiRequest } from '../../lib/queryClient';

interface RazorpayPaymentProps {
  amount: number;
  orderId: string;
  customerInfo: {
    name: string;
    email: string;
    contact: string;
  };
  onSuccess: (paymentResult: any) => void;
  onError: (error: string) => void;
  onClose?: () => void;
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

// Declare Razorpay on window object
declare global {
  interface Window {
    Razorpay: any;
  }
}

const RazorpayPayment: React.FC<RazorpayPaymentProps> = ({
  amount,
  orderId,
  customerInfo,
  onSuccess,
  onError,
  onClose
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpayScript = () => {
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          setRazorpayLoaded(true);
          resolve(true);
        };
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };

    if (!window.Razorpay) {
      loadRazorpayScript();
    } else {
      setRazorpayLoaded(true);
    }
  }, []);

  const initiatePayment = async () => {
    if (!razorpayLoaded) {
      onError('Payment gateway not loaded. Please try again.');
      return;
    }

    setIsLoading(true);
    setPaymentStatus('processing');

    try {
      // Create Razorpay order
      const orderResponse = await apiRequest<{
        success: boolean;
        order: any;
        keyId: string;
      }>('/api/payments/razorpay/create-order', {
        method: 'POST',
        body: JSON.stringify({
          amount,
          currency: 'INR',
          receipt: orderId,
          notes: {
            customer_name: customerInfo.name,
            customer_email: customerInfo.email,
            order_id: orderId
          }
        })
      });

      if (!orderResponse.success) {
        throw new Error('Failed to create payment order');
      }

      // Configure Razorpay options
      const options = {
        key: orderResponse.keyId,
        amount: orderResponse.order.amount,
        currency: orderResponse.order.currency,
        name: 'Premium E-Commerce',
        description: `Payment for Order #${orderId}`,
        order_id: orderResponse.order.id,
        prefill: {
          name: customerInfo.name,
          email: customerInfo.email,
          contact: customerInfo.contact,
        },
        theme: {
          color: '#F59E0B',
        },
        handler: async (response: RazorpayResponse) => {
          await verifyPayment(response);
        },
        modal: {
          ondismiss: () => {
            setPaymentStatus('failed');
            setIsLoading(false);
            onError('Payment cancelled by user');
          }
        }
      };

      // Open Razorpay payment modal
      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Payment initiation error:', error);
      setPaymentStatus('failed');
      setIsLoading(false);
      onError(error instanceof Error ? error.message : 'Payment initiation failed');
    }
  };

  const verifyPayment = async (response: RazorpayResponse) => {
    try {
      const verificationResponse = await apiRequest<{
        success: boolean;
        verified: boolean;
        payment: any;
      }>('/api/payments/razorpay/verify', {
        method: 'POST',
        body: JSON.stringify({
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        })
      });

      if (verificationResponse.success && verificationResponse.verified) {
        setPaymentStatus('success');
        onSuccess({
          success: true,
          paymentId: response.razorpay_payment_id,
          orderId: response.razorpay_order_id,
          amount: amount,
          method: 'Razorpay',
          timestamp: Date.now(),
          paymentDetails: verificationResponse.payment
        });
      } else {
        throw new Error('Payment verification failed');
      }
    } catch (error) {
      console.error('Payment verification error:', error);
      setPaymentStatus('failed');
      onError(error instanceof Error ? error.message : 'Payment verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = () => {
    switch (paymentStatus) {
      case 'processing':
        return <Loader className="w-6 h-6 text-blue-600 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'failed':
        return <XCircle className="w-6 h-6 text-red-600" />;
      default:
        return <CreditCard className="w-6 h-6 text-gray-600" />;
    }
  };

  const getStatusMessage = () => {
    switch (paymentStatus) {
      case 'processing':
        return 'Processing payment...';
      case 'success':
        return 'Payment successful!';
      case 'failed':
        return 'Payment failed. Please try again.';
      default:
        return 'Ready to process payment';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg border border-gray-200 p-6 max-w-md mx-auto"
    >
      <div className="text-center mb-6">
        <div className="flex justify-center mb-4">
          {getStatusIcon()}
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Razorpay Payment
        </h3>
        <p className="text-gray-600">{getStatusMessage()}</p>
      </div>

      <div className="space-y-4 mb-6">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Order ID:</span>
            <span className="text-sm font-medium text-gray-900">{orderId}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Amount:</span>
            <span className="text-lg font-semibold text-gray-900">
              ₹{amount.toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Test Mode</p>
              <p>This is a test payment. Use test cards or UPI IDs.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <button
          onClick={initiatePayment}
          disabled={isLoading || !razorpayLoaded || paymentStatus === 'success'}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium
                   hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500
                   disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors duration-200"
        >
          {isLoading ? (
            <span className="flex items-center justify-center">
              <Loader className="w-5 h-5 animate-spin mr-2" />
              Processing...
            </span>
          ) : paymentStatus === 'success' ? (
            'Payment Completed'
          ) : (
            'Pay with Razorpay'
          )}
        </button>

        {onClose && (
          <button
            onClick={onClose}
            disabled={isLoading}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium
                     hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors duration-200"
          >
            Cancel
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default RazorpayPayment;