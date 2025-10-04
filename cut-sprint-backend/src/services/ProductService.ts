import { supabase } from '../lib/supabase';
import { Product, CreateProductRequest, ProductSearchParams, PaginatedResponse, NutritionInfo } from '../types';

export class ProductService {
  /**
   * Get product by ID
   */
  async getProductById(productId: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting product:', error);
      return null;
    }
  }

  /**
   * Search products
   */
  async searchProducts(params: ProductSearchParams): Promise<PaginatedResponse<Product>> {
    try {
      let query = supabase
        .from('products')
        .select('*', { count: 'exact' });

      // Apply search filter
      if (params.query) {
        query = query.ilike('name', `%${params.query}%`);
      }

      // Apply category filter
      if (params.category) {
        query = query.eq('category', params.category);
      }

      // Apply pagination
      const limit = params.limit || 20;
      const offset = params.offset || 0;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        total: count || 0,
        page: Math.floor(offset / limit) + 1,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('Error searching products:', error);
      return {
        data: [],
        total: 0,
        page: 1,
        limit: 20,
        totalPages: 0
      };
    }
  }

  /**
   * Get products by barcode
   */
  async getProductByBarcode(barcode: string): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('barcode', barcode)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting product by barcode:', error);
      return null;
    }
  }

  /**
   * Create new product
   */
  async createProduct(productData: CreateProductRequest, userId: string): Promise<Product | null> {
    try {
      const product: Partial<Product> = {
        name: productData.name,
        brand: productData.brand,
        barcode: productData.barcode,
        unit: productData.unit || 'g',
        calories_per_100g: productData.calories_per_100g,
        protein_per_100g: productData.protein_per_100g,
        fat_per_100g: productData.fat_per_100g,
        carbs_per_100g: productData.carbs_per_100g,
        fiber_per_100g: productData.fiber_per_100g || 0,
        sodium_per_100g: productData.sodium_per_100g || 0,
        is_global: productData.is_global || false,
        created_by: userId
      };

      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating product:', error);
      return null;
    }
  }

  /**
   * Update product
   */
  async updateProduct(productId: string, productData: Partial<CreateProductRequest>): Promise<Product | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', productId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating product:', error);
      return null;
    }
  }

  /**
   * Delete product
   */
  async deleteProduct(productId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting product:', error);
      return false;
    }
  }

  /**
   * Calculate nutrition for a given quantity of product
   */
  calculateNutrition(product: Product, quantityGrams: number): NutritionInfo {
    const multiplier = quantityGrams / 100; // Convert to per 100g basis

    return {
      calories: Math.round(product.calories_per_100g * multiplier),
      protein: Math.round((product.protein_per_100g * multiplier) * 100) / 100,
      fat: Math.round((product.fat_per_100g * multiplier) * 100) / 100,
      carbs: Math.round((product.carbs_per_100g * multiplier) * 100) / 100,
      fiber: Math.round((product.fiber_per_100g * multiplier) * 100) / 100,
      sodium: Math.round((product.sodium_per_100g * multiplier) * 100) / 100
    };
  }

  /**
   * Get popular products (most used)
   */
  async getPopularProducts(limit: number = 10): Promise<Product[]> {
    try {
      // This would require a more complex query to track usage
      // For now, return some default popular products
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_global', true)
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting popular products:', error);
      return [];
    }
  }

  /**
   * Get products by category
   */
  async getProductsByCategory(category: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_global', true)
        .ilike('name', `%${category}%`);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting products by category:', error);
      return [];
    }
  }

  /**
   * Search products with autocomplete
   */
  async searchProductsAutocomplete(query: string, limit: number = 5): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, brand, calories_per_100g')
        .or(`name.ilike.%${query}%,brand.ilike.%${query}%`)
        .eq('is_global', true)
        .limit(limit);

      if (error) throw error;
      return (data as any[]) || [];
    } catch (error) {
      console.error('Error searching products autocomplete:', error);
      return [];
    }
  }

  /**
   * Get nutrition suggestions based on missing nutrients
   */
  async getNutritionSuggestions(
    missingNutrient: 'protein' | 'carbs' | 'fat' | 'fiber',
    limit: number = 5
  ): Promise<Product[]> {
    try {
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_global', true)
        .limit(limit);

      // Filter by nutrient content
      switch (missingNutrient) {
        case 'protein':
          query = query.gte('protein_per_100g', 15);
          break;
        case 'carbs':
          query = query.gte('carbs_per_100g', 20);
          break;
        case 'fat':
          query = query.gte('fat_per_100g', 10);
          break;
        case 'fiber':
          query = query.gte('fiber_per_100g', 5);
          break;
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting nutrition suggestions:', error);
      return [];
    }
  }

  /**
   * Get low-sodium alternatives
   */
  async getLowSodiumAlternatives(originalProductId: string): Promise<Product[]> {
    try {
      const originalProduct = await this.getProductById(originalProductId);
      if (!originalProduct) return [];

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_global', true)
        .lt('sodium_per_100g', originalProduct.sodium_per_100g)
        .ilike('name', `%${originalProduct.name.split(' ')[0]}%`)
        .limit(5);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting low-sodium alternatives:', error);
      return [];
    }
  }

  /**
   * Get products suitable for specific meal types
   */
  async getProductsForMealType(mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack'): Promise<Product[]> {
    try {
      let query = supabase
        .from('products')
        .select('*')
        .eq('is_global', true);

      // Filter based on meal type characteristics
      switch (mealType) {
        case 'breakfast':
          query = query.or('name.ilike.%owsianka%,name.ilike.%jogurt%,name.ilike.%mleko%,name.ilike.%chleb%');
          break;
        case 'lunch':
          query = query.or('name.ilike.%kurczak%,name.ilike.%ryż%,name.ilike.%makaron%,name.ilike.%warzywa%');
          break;
        case 'dinner':
          query = query.or('name.ilike.%twaróg%,name.ilike.%ser%,name.ilike.%chleb%,name.ilike.%warzywa%');
          break;
        case 'snack':
          query = query.or('name.ilike.%orzechy%,name.ilike.%owoc%,name.ilike.%jogurt%');
          break;
      }

      const { data, error } = await query.limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting products for meal type:', error);
      return [];
    }
  }
}
