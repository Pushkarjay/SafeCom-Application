import { Router, Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { getDb } from '../services/firestore.js'
import { authenticateToken, AuthenticatedRequest, requireRole } from '../middleware/auth.js'
import { getCollection, getDocument, createDocument, updateDocument, deleteDocument } from '../services/firestore.js'
import { DocumentSnapshot, Query } from 'firebase-admin/firestore'
import type {
  MasterProduct,
  CreateUpdateProductRequest,
  ProductListResponse,
  ProductVariant,
  ProductPricingTier
} from '../contracts/canonical_contracts.js'

const productCreateUpdateSchema = z.object({
  productName: z.string().min(1, 'Product name required'),
  description: z.string().optional().nullable(),
  category: z.string().min(1, 'Category required'),
  group: z.string().optional().nullable(),
  basePrice: z.number().nonnegative('Price must be non-negative'),
  unit: z.string().optional().nullable(),
  pricingTiers: z.array(z.object({
    minQuantity: z.number().positive(),
    unitPrice: z.number().positive()
  })).optional().nullable(),
  variants: z.array(z.object({
    variantId: z.string().min(1),
    name: z.string().min(1),
    options: z.array(z.string()),
    allowMultiple: z.boolean(),
    required: z.boolean()
  })).optional().nullable(),
  stock: z.number().nonnegative().optional().nullable(),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  taxRate: z.number().default(18)
})

export const productsRouter = Router()

// GET /catalog/products - List all products with pagination and filters
productsRouter.get(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt((req.query.page as string) || '1')
      const pageSize = Math.min(parseInt((req.query.pageSize as string) || '200'), 500)
      const category = req.query.category as string | undefined
      const featured = req.query.featured === 'true'

       let query: Query = getCollection('catalog_product')

      // Apply filters
      if (category) {
        query = query.where('category', '==', category)
      }
      if (featured) {
        query = query.where('isFeatured', '==', true)
      }

      const snapshot = await query.get()
      const total = snapshot.docs.length
      
      // Paginate in memory (Firestore doesn't support offset natively in free tier)
      const startIndex = (page - 1) * pageSize
      const endIndex = startIndex + pageSize
      
       const products = snapshot.docs
         .slice(startIndex, endIndex)
         .map((doc: DocumentSnapshot) => {
           const data = doc.data() as Record<string, unknown>;
           return {
             productId: doc.id,
             ...data,
             productName: (data?.name ?? data?.productName ?? '').toString(),
             basePrice: Number((data?.price ?? data?.basePrice ?? 0) as number),
             isAvailable: data?.status ? data.status === 'active' : ((data?.isAvailable ?? true) as boolean)
           };
         }) as MasterProduct[]

      return res.json({
        success: true,
        data: {
          products,
          total,
          page,
          pageSize,
          hasMore: endIndex < total
        } as ProductListResponse
      })
    } catch (error) {
      next(error)
    }
  }
)

// GET /catalog/products/:id - Get single product
productsRouter.get(
  '/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const productId = req.params.id as string;
      const product = await getDocument<Record<string, unknown>>('catalog_product', productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }
      // Normalize product to match MasterProduct shape (include all fields including variants)
      const normalized: Record<string, unknown> = {
        productId: product.id,
        productName: (product.name ?? product.productName ?? '').toString(),
        description: (product.description ?? '').toString(),
        category: (product.category ?? '').toString(),
        group: product.group ? product.group.toString() : undefined,
        basePrice: Number(product.basePrice ?? product.price ?? 0),
        variants: product.variants ?? [],
        pricingTiers: product.pricingTiers ?? undefined,
        stock: product.stock ?? undefined,
        isAvailable: product.isAvailable ?? (product.status === 'active'),
        isFeatured: product.isFeatured ?? false,
        imageUrl: product.imageUrl?.toString(),
        taxRate: Number(product.taxRate ?? 18),
        createdAt: product.createdAt?.toString() ?? new Date().toISOString(),
        updatedAt: product.updatedAt?.toString() ?? new Date().toISOString()
      };
      return res.json({
        success: true,
        data: normalized
      });
    } catch (error) {
      next(error);
    }
  }
)

// POST /catalog/products - Create new product (ADMIN ONLY)
productsRouter.post(
  '/',
  authenticateToken,
  requireRole(['admin']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const parsed = productCreateUpdateSchema.parse(req.body);

      const now = new Date().toISOString();
      const docData: Record<string, unknown> = {
        ...parsed,
        name: parsed.productName,
        price: parsed.basePrice,
        status: parsed.isAvailable ? 'active' : 'inactive',
        createdAt: now,
        updatedAt: now
      };

      const db = getDb();
      const docRef = db.collection('catalog_product').doc();
      await docRef.set(docData);

      const normalized = {
        productId: docRef.id,
        productName: parsed.productName,
        description: parsed.description ?? '',
        category: parsed.category,
        group: parsed.group ?? '',
        basePrice: parsed.basePrice,
        variants: parsed.variants ?? [],
        pricingTiers: parsed.pricingTiers ?? undefined,
        stock: parsed.stock ?? undefined,
        isAvailable: parsed.isAvailable,
        isFeatured: parsed.isFeatured ?? false,
        imageUrl: parsed.imageUrl ?? undefined,
        taxRate: parsed.taxRate ?? 18,
        createdAt: now,
        updatedAt: now
      };

      return res.status(201).json({
        success: true,
        data: normalized
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors
        });
      }
      next(error);
    }
  }
)

// PATCH /catalog/products/:id - Update product (ADMIN ONLY)
productsRouter.patch(
  '/:id',
  authenticateToken,
  requireRole(['admin']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const productId = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];
      const partial = productCreateUpdateSchema.partial().parse(req.body);

      const existing = await getDocument<Record<string, unknown>>('catalog_product', productId);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      const now = new Date().toISOString();
      const updates: Record<string, unknown> = {
        ...partial,
        updatedAt: now
      };
      if (partial.productName !== undefined) {
        updates.name = partial.productName;
      }
      if (partial.basePrice !== undefined) {
        updates.price = partial.basePrice;
      }
      if (partial.isAvailable !== undefined) {
        updates.status = partial.isAvailable ? 'active' : 'inactive';
      }

      await updateDocument('catalog_product', productId, updates);

      const updated = await getDocument<Record<string, unknown>>('catalog_product', productId);
      const normalized = updated
        ? {
            productId: updated.id,
            productName: (updated.name ?? updated.productName ?? '').toString(),
            description: (updated.description ?? '').toString(),
            category: (updated.category ?? '').toString(),
            group: updated.group ? updated.group.toString() : undefined,
            basePrice: Number(updated.basePrice ?? updated.price ?? 0),
            variants: updated.variants ?? [],
            pricingTiers: updated.pricingTiers ?? undefined,
            stock: updated.stock,
            isAvailable: updated.isAvailable ?? (updated.status === 'active'),
            isFeatured: updated.isFeatured ?? false,
            imageUrl: updated.imageUrl?.toString(),
            taxRate: Number(updated.taxRate ?? 18),
            createdAt: updated.createdAt?.toString() ?? '',
            updatedAt: updated.updatedAt?.toString() ?? now
          }
        : null;

      return res.json({
        success: true,
        data: normalized
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors
        });
      }
      next(error);
    }
  }
)

// DELETE /catalog/products/:id - Delete product (ADMIN ONLY)
productsRouter.delete(
  '/:id',
  authenticateToken,
  requireRole(['admin']),
  async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const productId = typeof req.params.id === 'string' ? req.params.id : req.params.id[0];

      const existing = await getDocument<Record<string, unknown>>('catalog_product', productId);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        });
      }

      await deleteDocument('catalog_product', productId);

      return res.json({
        success: true,
        message: 'Product deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }
)

// GET /catalog/products/category/:category - List products by category
productsRouter.get(
  '/category/:category',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const category = typeof req.params.category === 'string' ? req.params.category : req.params.category[0]
      
       const snapshot = await getCollection('catalog_product')
        .where('category', '==', category)
        .get()

       const products = snapshot.docs.map((doc: DocumentSnapshot) => {
         const data = doc.data() as Record<string, unknown>;
         return {
           productId: doc.id,
           ...data,
           productName: (data?.name ?? data?.productName ?? '').toString(),
           basePrice: Number((data?.price ?? data?.basePrice ?? 0) as number),
           isAvailable: data?.status ? data.status === 'active' : ((data?.isAvailable ?? true) as boolean)
         };
       }) as MasterProduct[]

      return res.json({
        success: true,
        data: {
          products,
          total: products.length,
          category
        }
      })
    } catch (error) {
      next(error)
    }
  }
)
