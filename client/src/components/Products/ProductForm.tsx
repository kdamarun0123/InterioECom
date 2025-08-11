import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, DollarSign, Tag, Image, Star, Save, Loader } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { productService } from '../../services/apiService';
import type { Category } from '@shared/schema';

const productSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.string().min(1, 'Price is required').refine(val => !isNaN(Number(val)) && Number(val) > 0, 'Price must be a positive number'),
  originalPrice: z.string().optional().refine(val => !val || (!isNaN(Number(val)) && Number(val) > 0), 'Original price must be a positive number'),
  category: z.string().min(1, 'Category is required'),
  stock: z.string().optional().refine(val => !val || (!isNaN(Number(val)) && Number(val) >= 0), 'Stock must be a non-negative number'),
  featured: z.boolean().optional(),
  tags: z.string().optional(),
  images: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categories: Category[];
  product?: any; // For editing existing products
}

const ProductForm: React.FC<ProductFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  categories,
  product,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
    watch,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    mode: 'onChange',
    defaultValues: product ? {
      name: product.name || '',
      description: product.description || '',
      price: product.price?.toString() || '',
      originalPrice: product.originalPrice?.toString() || '',
      category: product.category || '',
      stock: product.stock?.toString() || '0',
      featured: product.featured || false,
      tags: product.tags?.join(', ') || '',
      images: product.images?.join(', ') || '',
    } : {
      stock: '0',
      featured: false,
    },
  });

  const watchedPrice = watch('price');
  const watchedOriginalPrice = watch('originalPrice');

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      console.log('Submitting product form:', data);

      // Clear previous messages
      setSubmitError(null);
      setSubmitSuccess(null);

      // Prepare product data
      const productData = {
        name: data.name.trim(),
        description: data.description.trim(),
        price: data.price,
        originalPrice: data.originalPrice || undefined,
        category: data.category,
        stock: data.stock ? parseInt(data.stock) : 0,
        featured: data.featured || false,
        tags: data.tags ? data.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        images: data.images ? data.images.split(',').map(img => img.trim()).filter(Boolean) : [
          'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800'
        ],
      };

      console.log('Processed product data:', productData);

      if (product) {
        // Update existing product
        await productService.updateProduct(product.id, productData);
        console.log('Product updated successfully');
        setSubmitSuccess('Product updated successfully!');
      } else {
        // Create new product
        const result = await productService.createProduct(productData);
        console.log('Product created successfully:', result);
        setSubmitSuccess('Product created successfully!');
      }

      // Show success message for 2 seconds before closing
      setTimeout(() => {
        reset();
        onSuccess();
      }, 2000);
    } catch (error) {
      console.error('Error submitting product:', error);
      setSubmitError(error instanceof Error ? error.message : 'Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setSubmitError(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-4 md:inset-8 lg:inset-16 bg-white rounded-2xl z-50 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Package className="w-5 h-5 text-yellow-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {product ? 'Edit Product' : 'Add New Product'}
                </h2>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Form Content */}
            <div className="h-full overflow-y-auto p-6">
              {submitError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl"
                >
                  <p className="text-red-800 font-medium">{submitError}</p>
                </motion.div>
              )}

              {/* Success Display */}
              {submitSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl"
                >
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-green-800 font-medium">{submitSuccess}</p>
                  </div>
                </motion.div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Product Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Name *
                    </label>
                    <div className="relative">
                      <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        {...register('name')}
                        type="text"
                        className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                          errors.name 
                            ? 'border-red-300 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-yellow-500'
                        }`}
                        placeholder="Enter product name"
                      />
                    </div>
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category *
                    </label>
                    <div className="relative">
                      <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        {...register('category')}
                        className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                          errors.category 
                            ? 'border-red-300 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-yellow-500'
                        }`}
                      >
                        <option value="">Select a category</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.name}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.category && (
                      <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                    )}
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Price (₹) *
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        {...register('price')}
                        type="number"
                        step="0.01"
                        min="0"
                        className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                          errors.price 
                            ? 'border-red-300 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-yellow-500'
                        }`}
                        placeholder="0.00"
                      />
                    </div>
                    {errors.price && (
                      <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>
                    )}
                  </div>

                  {/* Original Price */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Original Price (₹) <span className="text-gray-400">(Optional)</span>
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        {...register('originalPrice')}
                        type="number"
                        step="0.01"
                        min="0"
                        className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                          errors.originalPrice 
                            ? 'border-red-300 focus:ring-red-500' 
                            : 'border-gray-300 focus:ring-yellow-500'
                        }`}
                        placeholder="0.00"
                      />
                    </div>
                    {errors.originalPrice && (
                      <p className="mt-1 text-sm text-red-600">{errors.originalPrice.message}</p>
                    )}
                    {watchedPrice && watchedOriginalPrice && Number(watchedOriginalPrice) <= Number(watchedPrice) && (
                      <p className="mt-1 text-sm text-amber-600">
                        Original price should be higher than current price
                      </p>
                    )}
                  </div>

                  {/* Stock */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stock Quantity
                    </label>
                    <input
                      {...register('stock')}
                      type="number"
                      min="0"
                      className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors ${
                        errors.stock 
                          ? 'border-red-300 focus:ring-red-500' 
                          : 'border-gray-300 focus:ring-yellow-500'
                      }`}
                      placeholder="0"
                    />
                    {errors.stock && (
                      <p className="mt-1 text-sm text-red-600">{errors.stock.message}</p>
                    )}
                  </div>

                  {/* Featured */}
                  <div className="flex items-center space-x-3">
                    <input
                      {...register('featured')}
                      type="checkbox"
                      className="w-5 h-5 text-yellow-600 bg-gray-100 border-gray-300 rounded focus:ring-yellow-500"
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Featured Product
                    </label>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    {...register('description')}
                    rows={4}
                    className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-colors resize-none ${
                      errors.description 
                        ? 'border-red-300 focus:ring-red-500' 
                        : 'border-gray-300 focus:ring-yellow-500'
                    }`}
                    placeholder="Enter detailed product description..."
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags <span className="text-gray-400">(comma-separated)</span>
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      {...register('tags')}
                      type="text"
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      placeholder="modern, furniture, living room"
                    />
                  </div>
                </div>

                {/* Images */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URLs <span className="text-gray-400">(comma-separated)</span>
                  </label>
                  <div className="relative">
                    <Image className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                    <textarea
                      {...register('images')}
                      rows={3}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-yellow-500 resize-none"
                      placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Leave empty to use default placeholder image
                  </p>
                </div>

                {/* Form Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={!isValid || isSubmitting}
                    className={`flex-1 py-4 rounded-xl font-semibold text-lg transition-colors flex items-center justify-center space-x-2 ${
                      isValid && !isSubmitting
                        ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        <span>{product ? 'Updating...' : 'Creating...'}</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-5 h-5" />
                        <span>{product ? 'Update Product' : 'Create Product'}</span>
                      </>
                    )}
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleClose}
                    disabled={isSubmitting}
                    className="flex-1 py-4 rounded-xl font-semibold text-lg border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default ProductForm;