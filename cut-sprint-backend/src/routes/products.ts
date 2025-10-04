import express, { Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { ProductService } from '../services/ProductService';
import { AuthenticatedRequest } from "../middleware/auth";

const router = express.Router();
const productService = new ProductService();

/**
 * @route GET /api/products
 * @desc Search products with pagination
 * @access Private
 */
router.get('/', [
  query('query').optional().isString().trim(),
  query('category').optional().isString().trim(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  query('offset').optional().isInt({ min: 0 })
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const searchParams = {
      query: req.query.query as string,
      category: req.query.category as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0
    };

    const result = await productService.searchProducts(searchParams);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error searching products:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/products/:id
 * @desc Get product by ID
 * @access Private
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const productId = req.params.id;
    const product = await productService.getProductById(productId);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error getting product:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/products/barcode/:barcode
 * @desc Get product by barcode
 * @access Private
 */
router.get('/barcode/:barcode', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const barcode = req.params.barcode;
    const product = await productService.getProductByBarcode(barcode);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    console.error('Error getting product by barcode:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route POST /api/products
 * @desc Create new product
 * @access Private
 */
router.post('/', [
  body('name').isString().trim().isLength({ min: 1, max: 255 }),
  body('brand').optional().isString().trim(),
  body('barcode').optional().isString().trim(),
  body('unit').optional().isString().trim(),
  body('calories_per_100g').isInt({ min: 0, max: 900 }),
  body('protein_per_100g').isFloat({ min: 0, max: 100 }),
  body('fat_per_100g').isFloat({ min: 0, max: 100 }),
  body('carbs_per_100g').isFloat({ min: 0, max: 100 }),
  body('fiber_per_100g').optional().isFloat({ min: 0, max: 100 }),
  body('sodium_per_100g').optional().isFloat({ min: 0, max: 10 }),
  body('is_global').optional().isBoolean()
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    const product = await productService.createProduct(req.body, userId);
    if (!product) {
      return res.status(500).json({
        success: false,
        error: 'Failed to create product'
      });
    }

    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully'
    });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route PUT /api/products/:id
 * @desc Update product
 * @access Private
 */
router.put('/:id', [
  body('name').optional().isString().trim().isLength({ min: 1, max: 255 }),
  body('brand').optional().isString().trim(),
  body('barcode').optional().isString().trim(),
  body('unit').optional().isString().trim(),
  body('calories_per_100g').optional().isInt({ min: 0, max: 900 }),
  body('protein_per_100g').optional().isFloat({ min: 0, max: 100 }),
  body('fat_per_100g').optional().isFloat({ min: 0, max: 100 }),
  body('carbs_per_100g').optional().isFloat({ min: 0, max: 100 }),
  body('fiber_per_100g').optional().isFloat({ min: 0, max: 100 }),
  body('sodium_per_100g').optional().isFloat({ min: 0, max: 10 }),
  body('is_global').optional().isBoolean()
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const productId = req.params.id;
    const product = await productService.updateProduct(productId, req.body);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product,
      message: 'Product updated successfully'
    });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route DELETE /api/products/:id
 * @desc Delete product
 * @access Private
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const productId = req.params.id;
    const success = await productService.deleteProduct(productId);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    res.json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/products/popular
 * @desc Get popular products
 * @access Private
 */
router.get('/popular', [
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
    const products = await productService.getPopularProducts(limit);

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error getting popular products:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/products/category/:category
 * @desc Get products by category
 * @access Private
 */
router.get('/category/:category', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const category = req.params.category;
    const products = await productService.getProductsByCategory(category);

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error getting products by category:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/products/search/autocomplete
 * @desc Search products with autocomplete
 * @access Private
 */
router.get('/search/autocomplete', [
  query('query').isString().trim().isLength({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 20 })
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const query = req.query.query as string;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;
    const products = await productService.searchProductsAutocomplete(query, limit);

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error searching products autocomplete:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/products/suggestions/:nutrient
 * @desc Get nutrition suggestions based on missing nutrient
 * @access Private
 */
router.get('/suggestions/:nutrient', [
  query('limit').optional().isInt({ min: 1, max: 20 })
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const nutrient = req.params.nutrient as 'protein' | 'carbs' | 'fat' | 'fiber';
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 5;

    if (!['protein', 'carbs', 'fat', 'fiber'].includes(nutrient)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid nutrient type'
      });
    }

    const products = await productService.getNutritionSuggestions(nutrient, limit);

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error getting nutrition suggestions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/products/alternatives/:productId
 * @desc Get low-sodium alternatives for a product
 * @access Private
 */
router.get('/alternatives/:productId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const productId = req.params.productId;
    const alternatives = await productService.getLowSodiumAlternatives(productId);

    res.json({
      success: true,
      data: alternatives
    });
  } catch (error) {
    console.error('Error getting low-sodium alternatives:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route GET /api/products/meal-type/:mealType
 * @desc Get products suitable for specific meal type
 * @access Private
 */
router.get('/meal-type/:mealType', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const mealType = req.params.mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack';

    if (!['breakfast', 'lunch', 'dinner', 'snack'].includes(mealType)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid meal type'
      });
    }

    const products = await productService.getProductsForMealType(mealType);

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error getting products for meal type:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * @route POST /api/products/:id/calculate-nutrition
 * @desc Calculate nutrition for a given quantity of product
 * @access Private
 */
router.post('/:id/calculate-nutrition', [
  body('quantity_grams').isFloat({ min: 0.1, max: 10000 })
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const productId = req.params.id;
    const quantityGrams = req.body.quantity_grams;

    const product = await productService.getProductById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        error: 'Product not found'
      });
    }

    const nutrition = productService.calculateNutrition(product, quantityGrams);

    res.json({
      success: true,
      data: nutrition
    });
  } catch (error) {
    console.error('Error calculating nutrition:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
