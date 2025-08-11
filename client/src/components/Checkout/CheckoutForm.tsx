import React from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import SimpleOrderPlacement from './SimpleOrderPlacement';

interface CheckoutFormProps {
  onBack: () => void;
  onComplete?: () => void;
  product?: any;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ onBack, onComplete = () => {}, product }) => {
  const { items } = useSelector((state: RootState) => state.cart);

  return (
    <SimpleOrderPlacement
      product={product}
      cartItems={items}
      onBack={onBack}
      onComplete={onComplete}
    />
  );
};

export default CheckoutForm;