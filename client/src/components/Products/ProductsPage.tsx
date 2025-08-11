import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Filter, Grid, List, Plus, RefreshCw } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { productService, categoryService } from '../../services/apiService';
import { queryClient } from '../../lib/queryClient';
import ProductGrid from './ProductGrid';
import ProductForm from './ProductForm';

const ProductsPage: React.FC = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('latest');
  const [showProductForm, setShowProductForm] = useState(false);
  
  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: () => categoryService.getCategories(),
  });

  const { data: productsData, isLoading: productsLoading, error: productsError, refetch } = useQuery({
    queryKey: ['/api/products', { 
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      search: searchQuery || undefined,
      limit: 50 
    }],
    queryFn: () => productService.getProducts({ 
      category: selectedCategory === 'all' ? undefined : selectedCategory,
      search: searchQuery || undefined,
      limit: 50 
    }),
    retry: 3,
    retryDelay: 1000,
  });
  const categories = categoriesData?.categories || [];
  const products = productsData?.products || [];

  const handleProductCreated = () => {
    setShowProductForm(false);
    // Invalidate and refetch products
    queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    refetch();
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['/api/products'] });
    refetch();
  };

  return (
      <div className="min-h-screen bg-gray-50 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Our Products</h1>
            <p className="text-xl text-gray-600">Discover our complete collection of premium furniture and decor</p>
          </div>

          {/* Filters and Controls */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 mb-4">
              {/* Category Filter */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-yellow-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All Products
                </button>
                {!categoriesLoading && categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.name)}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      selectedCategory === category.name
                        ? 'bg-yellow-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>

              {/* Sort and View Controls */}
              <div className="flex items-center space-x-4">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="latest">Latest</option>
                  <option value="price">Price: Low to High</option>
                  <option value="popularity">Most Popular</option>
                </select>

                <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 ${viewMode === 'grid' ? 'bg-yellow-600 text-white' : 'bg-white text-gray-600'}`}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 ${viewMode === 'list' ? 'bg-yellow-600 text-white' : 'bg-white text-gray-600'}`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowProductForm(true)}
                className="flex items-center justify-center space-x-2 bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors"
              >
                <Plus className="w-5 h-5" />
                <span>Add New Product</span>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRefresh}
                disabled={productsLoading || isRefreshing}
                className="flex items-center justify-center space-x-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${(productsLoading || isRefreshing) ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </motion.button>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <span>Total Products: {products.length}</span>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {productsError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <Filter className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-900">Error Loading Products</h3>
                  <p className="text-red-700 text-sm mt-1">
                    {productsError instanceof Error ? productsError.message : 'Failed to load products'}
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleRefresh}
                className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Try Again
              </motion.button>
            </div>
          )}

          {/* Products Grid */}
          <ProductGrid 
            products={products}
            category={selectedCategory === 'all' ? undefined : selectedCategory}
            search={searchQuery || undefined}
          />

          {/* Product Form Modal */}
          {showProductForm && (
            <ProductForm
              isOpen={showProductForm}
              onClose={() => setShowProductForm(false)}
              onSuccess={handleProductCreated}
              categories={categories}
            />
          )}
        </div>
      </div>
  );
};

export default ProductsPage;