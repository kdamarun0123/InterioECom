import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { CreditCard, Loader, CheckCircle, AlertCircle } from 'lucide-react';
import { apiRequest } from '../../lib/queryClient';

interface SimpleRazorpayButtonProps {
  amount: number;
  orderId?: string;
  customerInfo?: {
    name: string;
    email: string;
    contact: string;
  };
  onSuccess: (result: PaymentResult) => void;
  onError: (error: string) => void;
  className?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}

interface PaymentResult {
  success: boolean;
  paymentId: string;
  orderId: string;
  amount: number;
  method: string;
  timestamp: number;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const SimpleRazorpayButton: React.FC<SimpleRazorpayButtonProps> = ({
  amount,
  orderId = `ORDER_${Date.now()}`,
  customerInfo = {
    name: 'Customer',
    email: 'customer@example.com',
    contact: '9999999999'
  },
  onSuccess,
  onError,
  className = '',
  disabled = false,
  children
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const loadRazorpayScript = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    if (disabled || isProcessing) return;

    setIsProcessing(true);
    setPaymentStatus('idle');

    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error('Failed to load Razorpay script');
      }

      // Create Razorpay order
      const orderResponse = await apiRequest<{
        success: boolean;
        order: any;
        keyId: string;
      }>('/api/payments/razorpay/create-order', {
        method: 'POST',
        body: JSON.stringify({
          amount: amount,
          currency: 'INR',
          receipt: orderId,
          notes: {
            customer_name: customerInfo.name,
            customer_email: customerInfo.email
          }
        })
      });

      if (!orderResponse.success) {
        throw new Error('Failed to create order');
      }

      // Configure Razorpay options
      const options = {
        key: orderResponse.keyId,
        amount: orderResponse.order.amount,
        currency: orderResponse.order.currency,
        name: 'Premium E-Commerce Store',
        description: `Payment for Order #${orderId}`,
        image: 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=100',
        order_id: orderResponse.order.id,
        prefill: {
          name: customerInfo.name,
          email: customerInfo.email,
          contact: customerInfo.contact,
        },
        theme: {
          color: '#F59E0B',
        },
        handler: async (response: any) => {
          try {
            // Verify payment
            const verification = await apiRequest<{
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

            if (verification.success && verification.verified) {
              setPaymentStatus('success');
              onSuccess({
                success: true,
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                amount: amount,
                method: 'Razorpay',
                timestamp: Date.now()
              });
            } else {
              throw new Error('Payment verification failed');
            }
          } catch (error) {
            setPaymentStatus('error');
            onError(error instanceof Error ? error.message : 'Payment verification failed');
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentStatus('idle');
            setIsProcessing(false);
            onError('Payment cancelled by user');
          }
        }
      };

      // Open Razorpay modal
      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      setPaymentStatus('error');
      setIsProcessing(false);
      onError(error instanceof Error ? error.message : 'Payment failed');
    }
  };

  const getButtonContent = () => {
    if (children) return children;

    if (isProcessing) {
      return (
        <span className="flex items-center justify-center">
          <Loader className="w-5 h-5 animate-spin mr-2" />
          Processing...
        </span>
      );
    }

    if (paymentStatus === 'success') {
      return (
        <span className="flex items-center justify-center">
          <CheckCircle className="w-5 h-5 mr-2" />
          Payment Successful
        </span>
      );
    }

    if (paymentStatus === 'error') {
      return (
        <span className="flex items-center justify-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          Try Again
        </span>
      );
    }

    return (
      <span className="flex items-center justify-center">
        <CreditCard className="w-5 h-5 mr-2" />
        Pay ₹{amount.toLocaleString('en-IN')}
      </span>
    );
  };

  const getButtonStyles = () => {
    const baseStyles = 'px-6 py-3 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2';
    
    if (paymentStatus === 'success') {
      return `${baseStyles} bg-green-600 text-white cursor-not-allowed`;
    }
    
    if (paymentStatus === 'error') {
      return `${baseStyles} bg-red-600 text-white hover:bg-red-700 focus:ring-red-500`;
    }
    
    if (disabled || isProcessing) {
      return `${baseStyles} bg-gray-400 text-white cursor-not-allowed`;
    }
    
    return `${baseStyles} bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`;
  };

  return (
    <motion.button
      onClick={handlePayment}
      disabled={disabled || isProcessing || paymentStatus === 'success'}
      className={`${getButtonStyles()} ${className}`}
      whileHover={(!disabled && !isProcessing && paymentStatus !== 'success') ? { scale: 1.02 } : {}}
      whileTap={(!disabled && !isProcessing && paymentStatus !== 'success') ? { scale: 0.98 } : {}}
    >
      {getButtonContent()}
    </motion.button>
  );
};

export default SimpleRazorpayButton;