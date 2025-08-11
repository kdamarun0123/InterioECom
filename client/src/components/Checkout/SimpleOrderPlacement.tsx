import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, User, Mail, Phone, MapPin, CheckCircle, Package, Clock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch } from 'react-redux';
import { addOrder } from '../../store/slices/orderSlice';
import { clearCart } from '../../store/slices/cartSlice';

const shippingSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: z.string().email('Valid email address is required'),
  phone: z.string().min(10, 'Valid phone number is required').regex(/^\d+$/, 'Phone number must contain only digits'),
  address: z.string().min(10, 'Complete address is required'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zipCode: z.string().min(5, 'ZIP code is required'),
});

type ShippingData = z.infer<typeof shippingSchema>;

interface SimpleOrderPlacementProps {
  product?: any;
  cartItems?: any[];
  onBack: () => void;
  onComplete: () => void;
}

const SimpleOrderPlacement: React.FC<SimpleOrderPlacementProps> = ({ 
  product, 
  cartItems = [], 
  onBack, 
  onComplete 
}) => {
  const [currentStep, setCurrentStep] = useState(1); // 1: Shipping, 2: Confirmation
  const [shippingData, setShippingData] = useState<ShippingData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderConfirmed, setOrderConfirmed] = useState(false);
  const [orderId] = useState(`ORD-${Date.now()}`);
  const dispatch = useDispatch();

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ShippingData>({
    resolver: zodResolver(shippingSchema),
    mode: 'onChange',
  });

  // Calculate order details
  const orderItems = product ? 
    [{
      id: product.id,
      product: product,
      quantity: 1,
    }] : cartItems;

  const getProductPrice = (prod: any) => {
    const price = prod.price || prod.dealPrice;
    return typeof price === 'string' ? parseFloat(price) : (Number(price) || 0);
  };
  
  const baseAmount = product ? getProductPrice(product) : 
    cartItems.reduce((sum, item) => sum + (getProductPrice(item.product) * (item.quantity || 1)), 0);

  const finalAmount = baseAmount || 0;

  const onShippingSubmit = (data: ShippingData) => {
    setShippingData(data);
    setCurrentStep(2);
  };

  const handleOrderPlacement = () => {
    setIsProcessing(true);
    
    const newOrder = {
      id: orderId,
      items: orderItems,
      total: finalAmount,
      status: 'confirmed' as const,
      shippingAddress: { ...shippingData!, country: 'India' },
      paymentMethod: 'Cash on Delivery',
      transactionId: `COD_${Date.now()}`,
      createdAt: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    };

    dispatch(addOrder(newOrder));
    
    if (!product) {
      dispatch(clearCart());
    }
    
    setTimeout(() => {
      setOrderConfirmed(true);
      setIsProcessing(false);
    }, 2000);
  };

  const renderShippingForm = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Shipping Information</h2>
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
      </div>

      <div className="bg-blue-50 rounded-xl p-4">
        <p className="text-blue-800 text-sm">
          <strong>Cash on Delivery Only.</strong> Pay when you receive your order.
        </p>
      </div>

      <form onSubmit={handleSubmit(onShippingSubmit)} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                {...register('fullName')}
                type="text"
                className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                  errors.fullName 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="Enter your full name"
              />
            </div>
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-600">{errors.fullName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                {...register('email')}
                type="email"
                className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                  errors.email 
                    ? 'border-red-300 focus:ring-red-500' 
                    : 'border-gray-300 focus:ring-blue-500'
                }`}
                placeholder="Enter your email address"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number *
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              {...register('phone')}
              type="tel"
              className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                errors.phone 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="Enter your phone number"
            />
          </div>
          {errors.phone && (
            <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Complete Address *
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <textarea
              {...register('address')}
              rows={3}
              className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors resize-none ${
                errors.address 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="Enter your complete address"
            />
          </div>
          {errors.address && (
            <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City *
            </label>
            <input
              {...register('city')}
              type="text"
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                errors.city 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="City"
            />
            {errors.city && (
              <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State *
            </label>
            <input
              {...register('state')}
              type="text"
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                errors.state 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="State"
            />
            {errors.state && (
              <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ZIP Code *
            </label>
            <input
              {...register('zipCode')}
              type="text"
              className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                errors.zipCode 
                  ? 'border-red-300 focus:ring-red-500' 
                  : 'border-gray-300 focus:ring-blue-500'
              }`}
              placeholder="ZIP Code"
            />
            {errors.zipCode && (
              <p className="mt-1 text-sm text-red-600">{errors.zipCode.message}</p>
            )}
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={!isValid}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-xl font-medium
                     hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500
                     disabled:bg-gray-300 disabled:cursor-not-allowed
                     transition-colors duration-200"
          >
            Continue to Order Review
          </button>
        </div>
      </form>
    </motion.div>
  );

  const renderOrderConfirmation = () => (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Order Summary</h2>
        <button
          onClick={() => setCurrentStep(1)}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back</span>
        </button>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Items to Order</h3>
        <div className="space-y-4">
          {orderItems.map((item, index) => (
            <div key={index} className="flex items-center space-x-4 pb-4 border-b border-gray-100 last:border-b-0">
              <img 
                src={item.product.images?.[0] || '/placeholder.png'} 
                alt={item.product.name}
                className="w-16 h-16 object-cover rounded-lg"
              />
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{item.product.name}</h4>
                <p className="text-sm text-gray-600">Quantity: {item.quantity || 1}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  ₹{(getProductPrice(item.product) * (item.quantity || 1)).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Shipping Address */}
      {shippingData && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Shipping Address</h3>
          <div className="text-gray-700">
            <p className="font-medium">{shippingData.fullName}</p>
            <p>{shippingData.address}</p>
            <p>{shippingData.city}, {shippingData.state} {shippingData.zipCode}</p>
            <p className="mt-2">
              <span className="text-sm text-gray-600">Email:</span> {shippingData.email}
            </p>
            <p>
              <span className="text-sm text-gray-600">Phone:</span> {shippingData.phone}
            </p>
          </div>
        </div>
      )}

      {/* Order Total */}
      <div className="bg-gray-50 rounded-xl p-6">
        <div className="flex justify-between items-center text-xl font-bold text-gray-900">
          <span>Total Amount:</span>
          <span>₹{finalAmount.toLocaleString('en-IN')}</span>
        </div>
        <p className="text-sm text-gray-600 mt-2">Payment Method: Cash on Delivery</p>
      </div>

      {/* Place Order Button */}
      <div className="pt-4">
        <button
          onClick={handleOrderPlacement}
          disabled={isProcessing || orderConfirmed}
          className="w-full bg-green-600 text-white py-4 px-6 rounded-xl font-medium text-lg
                   hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500
                   disabled:bg-gray-400 disabled:cursor-not-allowed
                   transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Placing Order...</span>
            </>
          ) : orderConfirmed ? (
            <>
              <CheckCircle className="w-5 h-5" />
              <span>Order Confirmed!</span>
            </>
          ) : (
            <>
              <Package className="w-5 h-5" />
              <span>Place Order</span>
            </>
          )}
        </button>
      </div>

      {orderConfirmed && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-xl p-6 text-center"
        >
          <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-green-900 mb-2">Order Placed Successfully!</h3>
          <p className="text-green-700 mb-4">
            Your order <strong>#{orderId}</strong> has been confirmed.
          </p>
          <div className="flex items-center justify-center space-x-2 text-sm text-green-600 mb-4">
            <Clock className="w-4 h-4" />
            <span>Estimated delivery: 3-5 business days</span>
          </div>
          <button
            onClick={onComplete}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Continue Shopping
          </button>
        </motion.div>
      )}
    </motion.div>
  );

  return (
    <div className="max-w-4xl mx-auto p-4">
      {currentStep === 1 && renderShippingForm()}
      {currentStep === 2 && renderOrderConfirmation()}
    </div>
  );
};

export default SimpleOrderPlacement;