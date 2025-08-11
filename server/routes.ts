import type { Express } from "express";
import { createServer, type Server } from "http";
import bcrypt from "bcryptjs";
import Stripe from "stripe";
import { db } from "./db";
import { storage } from "./storage";
import {
  products,
  insertUserSchema,
  insertProductSchema,
  insertCategorySchema,
  insertOrderSchema,
  insertOrderItemSchema,
  insertReviewSchema,
  insertCartItemSchema,
  insertWishlistItemSchema,
  insertTransactionSchema,
  insertTransactionEventSchema,
} from "@shared/schema";
import { eq } from 'drizzle-orm';

// Initialize Stripe with dummy key for development
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy_key_for_development", {
  apiVersion: "2023-10-16",
});

// Mock data fallback when database is not available
const mockCategories = [
  { id: '1', name: 'Furniture', description: 'Home and office furniture', image: null, created_at: new Date() },
  { id: '2', name: 'Lighting', description: 'Indoor and outdoor lighting', image: null, created_at: new Date() },
  { id: '3', name: 'Decor', description: 'Home decoration items', image: null, created_at: new Date() },
  { id: '4', name: 'Office', description: 'Office supplies and equipment', image: null, created_at: new Date() },
  { id: '5', name: 'Kitchen', description: 'Kitchen appliances and tools', image: null, created_at: new Date() }
];

const mockProducts = [
  {
    id: '1',
    name: 'Modern Office Chair',
    description: 'Ergonomic office chair with lumbar support',
    price: '299.99',
    original_price: '399.99',
    category: 'Office',
    images: ['https://images.pexels.com/photos/586344/pexels-photo-586344.jpeg'],
    stock: 15,
    rating: '4.5',
    review_count: 23,
    featured: true,
    tags: ['ergonomic', 'office', 'chair'],
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: '2',
    name: 'LED Desk Lamp',
    description: 'Adjustable LED desk lamp with USB charging port',
    price: '79.99',
    original_price: null,
    category: 'Lighting',
    images: ['https://images.pexels.com/photos/1112598/pexels-photo-1112598.jpeg'],
    stock: 8,
    rating: '4.2',
    review_count: 15,
    featured: false,
    tags: ['led', 'desk', 'lamp'],
    created_at: new Date(),
    updated_at: new Date()
  }
];

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ error: "User already exists" });
      }
      
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user || !await bcrypt.compare(password, user.password)) {
        return res.status(401).json({ error: "Invalid credentials" });
      }
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Login failed" });
    }
  });

  app.get("/api/auth/user/:id", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to get user" });
    }
  });

  // Products routes
  app.get("/api/products", async (req, res) => {
    try {
      console.log('GET /api/products - Query params:', req.query);
      
      const filters = {
        category: req.query.category as string | undefined,
        featured: req.query.featured ? req.query.featured === 'true' : undefined,
        search: req.query.search as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };
      
      console.log('Applying filters:', filters);
      try {
        const products = await storage.getProducts(filters);
        console.log(`Found ${products.length} products`);
        res.json({ products });
      } catch (dbError) {
        console.warn('Database not available, using mock products:', dbError.message);
        res.json(mockProducts);
      }
    } catch (error) {
      console.error('Error in GET /api/products:', error);
      res.json(mockProducts);
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      console.log('GET /api/products/:id - Product ID:', req.params.id);
      
      try {
        const product = await storage.getProduct(req.params.id);
        if (!product) {
          console.log('Product not found:', req.params.id);
          return res.status(404).json({ error: "Product not found" });
        }
        console.log('Found product:', product.name);
        res.json({ product });
      } catch (dbError) {
        console.warn('Database not available, using mock products:', dbError.message);
        const product = mockProducts.find(p => p.id === req.params.id);
        if (!product) {
          return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
      }
    } catch (error) {
      console.error('Error in GET /api/products/:id:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to get product" });
    }
  });

  app.post("/api/products", async (req, res) => {
    try {
      console.log('POST /api/products - Request body:', req.body);
      
      // Validate required fields
      if (!req.body.name || !req.body.price || !req.body.category) {
        return res.status(400).json({ 
          error: "Missing required fields: name, price, and category are required" 
        });
      }
      
      const productData = insertProductSchema.parse(req.body);
      console.log('Validated product data:', productData);
      
      try {
        const product = await storage.createProduct(productData);
        console.log('Created product successfully:', product);
        res.status(201).json({ product });
      } catch (dbError) {
        console.warn('Database not available, simulating product creation:', dbError.message);
        const newProduct = { ...req.body, id: Date.now().toString(), created_at: new Date(), updated_at: new Date() };
        mockProducts.push(newProduct);
        res.status(201).json(newProduct);
      }
    } catch (error) {
      console.error('Error in POST /api/products:', error);
      
      if (error instanceof Error && error.message.includes('duplicate key')) {
        return res.status(409).json({ error: "Product with this name already exists" });
      }
      
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid product data" });
    }
  });

  app.put("/api/products/:id", async (req, res) => {
    try {
      console.log('PUT /api/products/:id - Product ID:', req.params.id, 'Updates:', req.body);
      
      const updates = req.body;
      const updateData = { ...updates, updated_at: new Date() };
      
      try {
        const product = await storage.updateProduct(req.params.id, updates);
        
        if (!product) {
          console.log('Product not found for update:', req.params.id);
          return res.status(404).json({ error: "Product not found" });
        }
        
        console.log('Updated product successfully:', product);
        res.json({ product });
      } catch (dbError) {
        console.warn('Database not available, simulating product update:', dbError.message);
        const productIndex = mockProducts.findIndex(p => p.id === req.params.id);
        if (productIndex !== -1) mockProducts[productIndex] = { ...mockProducts[productIndex], ...updateData };
        res.json(mockProducts[productIndex] || { id: req.params.id, ...updateData });
      }
    } catch (error) {
      console.error('Error in PUT /api/products/:id:', error);
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update product" });
    }
  });

  app.delete("/api/products/:id", async (req, res) => {
    try {
      console.log('DELETE /api/products/:id - Product ID:', req.params.id);
      
      try {
        const success = await storage.deleteProduct(req.params.id);
        
        if (!success) {
          console.log('Product not found for deletion:', req.params.id);
          return res.status(404).json({ error: "Product not found" });
        }
        
        console.log('Deleted product successfully:', req.params.id);
        res.json({ success: true });
      } catch (dbError) {
        console.warn('Database not available, simulating product deletion:', dbError.message);
        res.status(204).send();
      }
    } catch (error) {
      console.error('Error in DELETE /api/products/:id:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to delete product" });
    }
  });

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    try {
      // Test database connection
      const testQuery = await db.select().from(products).limit(1);
      res.json({ 
        status: "healthy", 
        database: "connected",
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(503).json({ 
        status: "unhealthy", 
        database: "disconnected",
        error: error instanceof Error ? error.message : "Database connection failed",
        timestamp: new Date().toISOString()
      });
    }
  });
  // Categories routes
  app.get("/api/categories", async (req, res) => {
    try {
      console.log('GET /api/categories - Fetching categories');
      try {
        const categories = await storage.getCategories();
        console.log(`Found ${categories.length} categories`);
        res.json({ categories });
      } catch (dbError) {
        console.warn('Database not available, using mock categories:', dbError.message);
        res.json(mockCategories);
      }
    } catch (error) {
      console.error('Error in GET /api/categories:', error);
      res.json(mockCategories);
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      try {
        const categoryData = insertCategorySchema.parse(req.body);
        const category = await storage.createCategory(categoryData);
        res.status(201).json({ category });
      } catch (dbError) {
        console.warn('Database not available, simulating category creation:', dbError.message);
        const newCategory = { ...req.body, id: Date.now().toString(), created_at: new Date() };
        mockCategories.push(newCategory);
        res.status(201).json(newCategory);
      }
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid category data" });
    }
  });

  // Orders routes
  app.get("/api/orders/:userId", async (req, res) => {
    try {
      const orders = await storage.getOrders(req.params.userId);
      res.json({ orders });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to get orders" });
    }
  });

  app.post("/api/orders", async (req, res) => {
    try {
      const orderData = insertOrderSchema.parse(req.body);
      const order = await storage.createOrder(orderData);
      res.status(201).json({ order });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid order data" });
    }
  });

  // Cart routes
  app.get("/api/cart/:userId", async (req, res) => {
    try {
      const items = await storage.getCartItems(req.params.userId);
      res.json({ items });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to get cart items" });
    }
  });

  app.post("/api/cart", async (req, res) => {
    try {
      const itemData = insertCartItemSchema.parse(req.body);
      const item = await storage.addToCart(itemData);
      res.status(201).json({ item });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid cart item data" });
    }
  });

  app.put("/api/cart/:id", async (req, res) => {
    try {
      const { quantity } = req.body;
      const item = await storage.updateCartItem(req.params.id, quantity);
      if (!item) {
        return res.status(404).json({ error: "Cart item not found" });
      }
      res.json({ item });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update cart item" });
    }
  });

  app.delete("/api/cart/:id", async (req, res) => {
    try {
      const success = await storage.removeFromCart(req.params.id);
      if (!success) {
        return res.status(404).json({ error: "Cart item not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to remove cart item" });
    }
  });

  // Wishlist routes
  app.get("/api/wishlist/:userId", async (req, res) => {
    try {
      const items = await storage.getWishlistItems(req.params.userId);
      res.json({ items });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to get wishlist items" });
    }
  });

  app.post("/api/wishlist", async (req, res) => {
    try {
      const itemData = insertWishlistItemSchema.parse(req.body);
      const item = await storage.addToWishlist(itemData);
      res.status(201).json({ item });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid wishlist item data" });
    }
  });

  app.delete("/api/wishlist/:userId/:productId", async (req, res) => {
    try {
      const success = await storage.removeFromWishlist(req.params.userId, req.params.productId);
      if (!success) {
        return res.status(404).json({ error: "Wishlist item not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to remove wishlist item" });
    }
  });

  // Reviews routes
  app.get("/api/reviews/:productId", async (req, res) => {
    try {
      const reviews = await storage.getReviews(req.params.productId);
      res.json({ reviews });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : "Failed to get reviews" });
    }
  });

  app.post("/api/reviews", async (req, res) => {
    try {
      const reviewData = insertReviewSchema.parse(req.body);
      const review = await storage.createReview(reviewData);
      res.status(201).json({ review });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid review data" });
    }
  });

  // Transaction routes for payment tracking
  app.post("/api/transactions", async (req, res) => {
    try {
      const transactionData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(transactionData);
      res.status(201).json({ transaction });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid transaction data" });
    }
  });

  app.put("/api/transactions/:orderId", async (req, res) => {
    try {
      const updates = req.body;
      const transaction = await storage.updateTransaction(req.params.orderId, updates);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      res.json({ transaction });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Failed to update transaction" });
    }
  });

  app.post("/api/transaction-events", async (req, res) => {
    try {
      const eventData = insertTransactionEventSchema.parse(req.body);
      const event = await storage.createTransactionEvent(eventData);
      res.status(201).json({ event });
    } catch (error) {
      res.status(400).json({ error: error instanceof Error ? error.message : "Invalid event data" });
    }
  });

  // Stripe payment route for one-time payments
  app.post("/api/create-payment-intent", async (req, res) => {
    try {
      const { amount, currency = "usd", metadata = {} } = req.body;
      
      // For development with dummy keys, return mock response
      if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === "sk_test_dummy_key_for_development") {
        res.json({ 
          clientSecret: `pi_test_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
          paymentIntentId: `pi_test_${Date.now()}`
        });
        return;
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });
      
      res.json({ 
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      });
    } catch (error: any) {
      res
        .status(500)
        .json({ message: "Error creating payment intent: " + error.message });
    }
  });

  // Webhook endpoint for Stripe events
  app.post("/api/stripe-webhook", async (req, res) => {
    try {
      // For development with dummy keys, just acknowledge
      if (!process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY === "sk_test_dummy_key_for_development") {
        res.json({ received: true });
        return;
      }

      const sig = req.headers['stripe-signature'];
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!sig || !endpointSecret) {
        return res.status(400).send('Missing signature or webhook secret');
      }

      let event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
      } catch (err: any) {
        return res.status(400).send(`Webhook signature verification failed: ${err.message}`);
      }

      // Handle the event
      switch (event.type) {
        case 'payment_intent.succeeded':
          const paymentIntent = event.data.object;
          console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);
          // Update order status, send confirmation email, etc.
          break;
        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object;
          console.log(`Payment failed for PaymentIntent ${failedPayment.id}`);
          break;
        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Razorpay payment routes
  app.post('/api/payments/razorpay/create-order', async (req, res) => {
    try {
      const { amount, currency, receipt, notes } = req.body;
      
      // Validate input
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }
      
      // Mock Razorpay order creation for development
      const mockOrder = {
        id: `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        entity: 'order',
        amount: amount * 100, // Convert to paise
        amount_paid: 0,
        amount_due: amount * 100,
        currency: currency || 'INR',
        receipt: receipt,
        status: 'created',
        attempts: 0,
        notes: notes || {},
        created_at: Math.floor(Date.now() / 1000)
      };
      
      console.log('Created Razorpay order:', mockOrder);
      res.json({ success: true, order: mockOrder });
    } catch (error) {
      console.error('Error creating Razorpay order:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create order' });
    }
  });

  app.post('/api/payments/razorpay/verify', async (req, res) => {
    try {
      const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;
      
      // Validate input
      if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
        return res.status(400).json({ error: 'Missing payment verification data' });
      }
      
      // Mock payment verification for development
      console.log('Verifying Razorpay payment:', {
        orderId: razorpayOrderId,
        paymentId: razorpayPaymentId,
        signature: razorpaySignature
      });
      
      // Mock successful verification (in production, verify signature with Razorpay)
      const verificationResult = {
        verified: true,
        paymentId: razorpayPaymentId,
        orderId: razorpayOrderId,
        status: 'captured',
        amount: 100, // Mock amount in paise
        timestamp: Date.now()
      };
      
      res.json({ success: true, verification: verificationResult });
    } catch (error) {
      console.error('Error verifying Razorpay payment:', error);
      res.status(500).json({ error: error instanceof Error ? error.message : 'Payment verification failed' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}