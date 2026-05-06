# Collections Schema

## PService
{
  id, name, slug, description, icon, bannerImage, thumbnail, status, visible, displayOrder, serviceType, pricingMode, createdAt, updatedAt
}

## Variants (subcollection of PService)
{
  name, slug, cameraCount, minQuantity, maxQuantity, displayOrder, status
}

## PricingRules (subcollection of PService)
{
  ruleType, min, max, price, unit, status
}

## MappedProducts (subcollection of PService)
{
  productId, productName, quantity, quantityFormula, required, editable, displayOrder
}

## Catalog_Product
{
  id, sku, name, category, group, brand, price, unit, status, stockEnabled, visible, images, tags, createdAt, updatedAt
}

## Customer_User
{
  uid, name, phone, email, profileImage, defaultLocationId, savedLocations, status, createdAt
}

## Orders
{
  customerId, serviceId, variantId, locationId, items, subtotal, tax, discount, total, status, paymentStatus, createdAt
}

## Bookings
{
  customerId, orderId, scheduledDate, assignedTechnician, status
}

## Configurations
Dynamic configs like homepage.

## Banners, Offers, Locations, Invoices
As defined.