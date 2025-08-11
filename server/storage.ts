import { db } from './db';
import { users, products, orders, orderItems, wishlistItems, cartItems, categories, reviews, transactions, transactionEvents } from '../shared/schema';
import { eq, and, like, or } from 'drizzle-orm';

export const storage = {
  // User operations
  async createUser(userData: any) {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  },

  async getUser(id: string) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  },

  async getUserByEmail(email: string) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  },

  // Product operations
  async getProducts(filters: {
    category?: string;
    featured?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}) {
    let query = db.select().from(products);
    
    // Apply filters
    const conditions = [];
    if (filters.category) {
      conditions.push(eq(products.category, filters.category));
    }
    if (filters.featured !== undefined) {
      conditions.push(eq(products.featured, filters.featured));
    }
    if (filters.search) {
      conditions.push(
        or(
          like(products.name, `%${filters.search}%`),
          like(products.description, `%${filters.search}%`)
        )
      );
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as typeof query;
    }
    
    if (filters.limit) {
      query = query.limit(filters.limit) as typeof query;
    }
    
    if (filters.offset) {
      query = query.offset(filters.offset) as typeof query;
    }
    
    return await query;
  },

  async getProduct(id: string) {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  },

  async createProduct(productData: any) {
    const [product] = await db.insert(products).values(productData).returning();
    return product;
  },

  async updateProduct(id: string, updates: any) {
    const [product] = await db.update(products)
      .set(updates)
      .where(eq(products.id, id))
      .returning();
    return product;
  },

  async deleteProduct(id: string) {
    const result = await db.delete(products).where(eq(products.id, id));
    return (result.rowCount || 0) > 0;
  },

  // Category operations
  async getCategories() {
    try {
      console.log('Fetching categories from database...');
      const result = await db.select().from(categories);
      console.log(`Successfully fetched ${result.length} categories`);
      return result;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  },

  async createCategory(categoryData: any) {
    const [category] = await db.insert(categories).values(categoryData).returning();
    return category;
  },

  // Order operations
  async createOrder(orderData: any) {
    const [order] = await db.insert(orders).values(orderData).returning();
    return order;
  },

  async getOrders(userId: string) {
    return await db.select().from(orders).where(eq(orders.userId, userId));
  },

  async getOrder(id: string) {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  },

  // Order items operations
  async createOrderItem(orderItemData: any) {
    const [orderItem] = await db.insert(orderItems).values(orderItemData).returning();
    return orderItem;
  },

  async getOrderItems(orderId: string) {
    return await db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  },

  // Wishlist operations
  async getWishlistItems(userId: string) {
    return await db.select().from(wishlistItems).where(eq(wishlistItems.userId, userId));
  },

  async addToWishlist(itemData: any) {
    const [item] = await db.insert(wishlistItems).values(itemData).returning();
    return item;
  },

  async removeFromWishlist(userId: string, productId: string) {
    const result = await db.delete(wishlistItems)
      .where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId)));
    return (result.rowCount || 0) > 0;
  },

  // Cart operations
  async getCartItems(userId: string) {
    return await db.select().from(cartItems).where(eq(cartItems.userId, userId));
  },

  async addToCart(itemData: any) {
    const [item] = await db.insert(cartItems).values(itemData).returning();
    return item;
  },

  async updateCartItem(id: string, quantity: number) {
    const [item] = await db.update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
    return item;
  },

  async removeFromCart(id: string) {
    const result = await db.delete(cartItems).where(eq(cartItems.id, id));
    return (result.rowCount || 0) > 0;
  },

  async clearCart(userId: string) {
    const result = await db.delete(cartItems).where(eq(cartItems.userId, userId));
    return (result.rowCount || 0) > 0;
  },

  // Review operations
  async getReviews(productId: string) {
    return await db.select().from(reviews).where(eq(reviews.productId, productId));
  },

  async createReview(reviewData: any) {
    const [review] = await db.insert(reviews).values(reviewData).returning();
    return review;
  },

  // Transaction operations
  async createTransaction(transactionData: any) {
    const [transaction] = await db.insert(transactions).values(transactionData).returning();
    return transaction;
  },

  async updateTransaction(orderId: string, updates: any) {
    const [transaction] = await db.update(transactions)
      .set(updates)
      .where(eq(transactions.orderId, orderId))
      .returning();
    return transaction;
  },

  async createTransactionEvent(eventData: any) {
    const [event] = await db.insert(transactionEvents).values(eventData).returning();
    return event;
  }
};