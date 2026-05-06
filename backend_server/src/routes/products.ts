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
  description: z.string().optional(),
  category: z.string().min(1, 'Category required'),
  group: z.string().optional(),
  basePrice: z.number().nonnegative('Price must be non-negative'),
  unit: z.string().optional(),
  pricingTiers: z.array(z.object({
    minQuantity: z.number().positive(),
    unitPrice: z.number().positive()
  })).optional(),
  variants: z.array(z.object({
    variantId: z.string().min(1),
    name: z.string().min(1),
    options: z.array(z.string()),
    allowMultiple: z.boolean(),
    required: z.boolean()
  })).optional(),
  stock: z.number().nonnegative().optional(),
  isAvailable: z.boolean().default(true),
  isFeatured: z.boolean().optional(),
  imageUrl: z.string().optional(),
  taxRate: z.number().default(18)
})

export const productsRouter = Router()

// GET /catalog/products - List all products with pagination and filters
productsRouter.get(
  '/',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = parseInt((req.query.page as string) || '1')
      const pageSize = Math.min(parseInt((req.query.pageSize as string) || '20'), 100)
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
      const productId = typeof req.params.id === 'string' ? req.params.id : req.params.id[0]
       const product = await getDocument<MasterProduct>('catalog_product', productId)
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        })
      }

       const normalized = {
         ...product,
         productId: (product as any).productId ?? productId,
         productName: ((product as any).productName ?? (product as any).name ?? '').toString(),
         basePrice: Number(((product as any).basePrice ?? (product as any).price ?? 0) as number),
         isAvailable: (product as any).isAvailable ?? ((product as any).status === 'active')
       }
       return res.json({
         success: true,
         data: normalized
       })
    } catch (error) {
      next(error)
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
      // Validate request body
      const validated = productCreateUpdateSchema.parse(req.body)

      const now = new Date().toISOString()
       const product: Omit<MasterProduct, 'productId'> = {
         productName: validated.productName,
         description: validated.description,
         category: validated.category,
         group: validated.group,
         basePrice: validated.basePrice,
         unit: validated.unit,
         pricingTiers: validated.pricingTiers,
         variants: validated.variants,
         stock: validated.stock ?? 0,
         isAvailable: validated.isAvailable,
         isFeatured: validated.isFeatured ?? false,
         imageUrl: validated.imageUrl,
         taxRate: validated.taxRate,
         createdAt: now,
         updatedAt: now
       }

       const productId = await createDocument('catalog_product', {
         ...product,
         name: product.productName,
         price: product.basePrice,
         status: product.isAvailable ? 'active' : 'inactive',
         unit: product.unit
       } as unknown as Record<string, unknown>)
      
       return res.status(201).json({
         success: true,
         data: {
           productId,
           ...product
         }
       })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors
        })
      }
      next(error)
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
      const productId = typeof req.params.id === 'string' ? req.params.id : req.params.id[0]
      
      // Validate request body (all fields optional for PATCH)
      const partial = productCreateUpdateSchema.partial().parse(req.body)

      // Check product exists
       const existing = await getDocument<MasterProduct>('catalog_product', productId)
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        })
      }

      const now = new Date().toISOString()
       const updates: Record<string, unknown> = {
         ...partial,
         updatedAt: now
       }
       if (partial.productName !== undefined) {
         updates.name = partial.productName
       }
       if (partial.basePrice !== undefined) {
         updates.price = partial.basePrice
       }
       if (partial.isAvailable !== undefined) {
         updates.status = partial.isAvailable ? 'active' : 'inactive'
       }

       await updateDocument('catalog_product', productId, updates)

       const updated = await getDocument<MasterProduct>('catalog_product', productId)
       const normalized = updated
         ? {
             ...updated,
             productId: (updated as any).productId ?? productId,
             productName: ((updated as any).productName ?? (updated as any).name ?? '').toString(),
             basePrice: Number(((updated as any).basePrice ?? (updated as any).price ?? 0) as number),
             isAvailable: (updated as any).isAvailable ?? ((updated as any).status === 'active')
           }
         : updated
        return res.json({
          success: true,
         data: normalized
        })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors
        })
      }
      next(error)
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
      const productId = typeof req.params.id === 'string' ? req.params.id : req.params.id[0]
      
      // Check product exists
       const existing = await getDocument<MasterProduct>('catalog_product', productId)
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Product not found'
        })
      }

       await deleteDocument('catalog_product', productId)

      return res.json({
        success: true,
        message: 'Product deleted successfully'
      })
    } catch (error) {
      next(error)
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
