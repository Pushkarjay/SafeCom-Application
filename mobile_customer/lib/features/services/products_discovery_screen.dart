import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/data/datasources/api_service.dart';
import 'package:mobile_customer/data/models/pricing_contracts.dart';
import 'package:mobile_customer/data/providers/cart_provider.dart';
import 'package:mobile_customer/features/booking/providers/active_order_provider.dart';
import 'package:mobile_customer/routes/app_router.dart';
import 'package:mobile_customer/core/theme/app_theme.dart';

/// Provider that fetches all master products from the backend
final allProductsProvider = FutureProvider<List<MasterProduct>>((ref) async {
  final apiService = ref.watch(apiServiceProvider);
  final data = await apiService.getAllProducts();
  final productsList = (data['products'] as List<dynamic>? ?? []);
  return productsList
      .map((p) => MasterProduct.fromJson(p as Map<String, dynamic>))
      .toList();
});

class ProductsDiscoveryScreen extends ConsumerStatefulWidget {
  const ProductsDiscoveryScreen({super.key});

  @override
  ConsumerState<ProductsDiscoveryScreen> createState() =>
      _ProductsDiscoveryScreenState();
}

class _ProductsDiscoveryScreenState
    extends ConsumerState<ProductsDiscoveryScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _selectedCategory = 'all';
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final productsAsync = ref.watch(allProductsProvider);
    final cart = ref.watch(cartProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('All Products'),
        elevation: 0,
        actions: [
          // Cart icon with badge
          Stack(
            alignment: Alignment.topRight,
            children: [
              IconButton(
                icon: const Icon(Icons.shopping_cart_outlined),
                onPressed: () => _showCartSheet(context),
              ),
              if (cart.totalItems > 0)
                Positioned(
                  right: 6,
                  top: 6,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: AppColors.error,
                      shape: BoxShape.circle,
                    ),
                    child: Text(
                      '${cart.totalItems}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Search Bar
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: 'Search products...',
                  prefixIcon: const Icon(Icons.search),
                  suffixIcon: _searchController.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear),
                          onPressed: () {
                            _searchController.clear();
                            setState(() => _searchQuery = '');
                          },
                        )
                      : null,
                  filled: true,
                  fillColor: AppColors.surfaceVariant,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(16),
                    borderSide: BorderSide.none,
                  ),
                  contentPadding: const EdgeInsets.symmetric(vertical: 14),
                ),
                onChanged: (value) {
                  setState(() => _searchQuery = value.toLowerCase());
                },
              ),
            ),

            // Category Filter Chips
            productsAsync.when(
              data: (products) {
                final categories = <String>{'all'};
                for (final p in products) {
                  if (p.category.isNotEmpty) categories.add(p.category);
                }
                return SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  child: Row(
                    children: categories.map((cat) {
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: _buildCategoryChip(cat, _formatCategory(cat)),
                      );
                    }).toList(),
                  ),
                );
              },
              loading: () => const SizedBox.shrink(),
              error: (_, __) => const SizedBox.shrink(),
            ),

            // Products Grid
            Expanded(
              child: productsAsync.when(
                data: (products) {
                  var filtered = products;

                  // Filter by category
                  if (_selectedCategory != 'all') {
                    filtered = filtered
                        .where((p) => p.category == _selectedCategory)
                        .toList();
                  }

                  // Filter by search
                  if (_searchQuery.isNotEmpty) {
                    filtered = filtered
                        .where((p) =>
                            p.productName.toLowerCase().contains(_searchQuery) ||
                            p.description.toLowerCase().contains(_searchQuery) ||
                            p.category.toLowerCase().contains(_searchQuery))
                        .toList();
                  }

                  if (filtered.isEmpty) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.search_off, size: 48, color: AppColors.textMuted),
                          const SizedBox(height: 16),
                          Text(
                            'No products found',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                          ),
                          const SizedBox(height: 8),
                          const Text('Try a different search or category'),
                        ],
                      ),
                    );
                  }

                  return GridView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: filtered.length,
                    gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: 0.62,
                    ),
                    itemBuilder: (context, index) {
                      final product = filtered[index];
                      return _ProductCard(product: product);
                    },
                  );
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (err, _) => Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.cloud_off_outlined, size: 48, color: AppColors.textMuted),
                        const SizedBox(height: 16),
                        Text('Failed to load products', style: Theme.of(context).textTheme.titleMedium),
                        const SizedBox(height: 8),
                        Text('$err', textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodySmall),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showCartSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const _CartSheet(),
    );
  }

  Widget _buildCategoryChip(String value, String label) {
    final isSelected = _selectedCategory == value;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (selected) {
        setState(() {
          _selectedCategory = selected ? value : 'all';
        });
      },
      backgroundColor: Colors.white,
      selectedColor: const Color(0xFFFFF3E0),
      side: BorderSide(
        color: isSelected ? AppColors.primary : AppColors.border,
      ),
      labelStyle: TextStyle(
        color: isSelected ? AppColors.primary : AppColors.primary,
        fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
      ),
    );
  }

  String _formatCategory(String cat) {
    if (cat == 'all') return 'All Products';
    return cat.replaceAll('_', ' ').split(' ').map((w) {
      if (w.isEmpty) return w;
      return w[0].toUpperCase() + w.substring(1);
    }).join(' ');
  }
}

class _ProductCard extends ConsumerWidget {
  final MasterProduct product;

  const _ProductCard({required this.product});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cart = ref.watch(cartProvider);
    final inCart = cart.items.any((item) => item.product.id == product.id);

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Category badge
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFFEFF6FF),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Text(
                product.category.replaceAll('_', ' ').toUpperCase(),
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  color: AppColors.primary,
                  letterSpacing: 0.5,
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              product.productName,
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: 4),
            if (product.description.isNotEmpty)
              Text(
                product.description,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              ),
            const Spacer(),
            Text(
              '₹${product.basePrice.toStringAsFixed(0)}',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: AppColors.primary,
                    fontWeight: FontWeight.w800,
                  ),
            ),
            const SizedBox(height: 8),
            // Add to Cart button
            SizedBox(
              width: double.infinity,
              child: inCart
                  ? OutlinedButton.icon(
                      onPressed: () {
                        ref.read(cartProvider.notifier).removeFromCart(product.id);
                      },
                      icon: const Icon(Icons.check, size: 16),
                      label: const Text('In Cart', style: TextStyle(fontSize: 12)),
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.success,
                        side: const BorderSide(color: AppColors.success),
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    )
                  : FilledButton.icon(
                      onPressed: () {
                        ref.read(cartProvider.notifier).addToCart(product);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('${product.productName} added to cart'),
                            duration: const Duration(seconds: 1),
                            behavior: SnackBarBehavior.floating,
                          ),
                        );
                      },
                      icon: const Icon(Icons.add_shopping_cart, size: 16),
                      label: const Text('Add to Cart', style: TextStyle(fontSize: 12)),
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        padding: const EdgeInsets.symmetric(vertical: 8),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ),
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Cart bottom sheet showing items, quantities, and checkout
class _CartSheet extends ConsumerWidget {
  const _CartSheet();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cart = ref.watch(cartProvider);

    return Container(
      height: MediaQuery.of(context).size.height * 0.7,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // Drag handle
          Container(
            margin: const EdgeInsets.symmetric(vertical: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                Text(
                  'Your Cart',
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
                ),
                const Spacer(),
                if (cart.items.isNotEmpty)
                  TextButton(
                    onPressed: () => ref.read(cartProvider.notifier).clearCart(),
                    child: const Text('Clear All', style: TextStyle(color: AppColors.error)),
                  ),
              ],
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: cart.items.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const Icon(Icons.shopping_cart_outlined, size: 64, color: AppColors.border),
                        const SizedBox(height: 16),
                        Text('Your cart is empty',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w600)),
                        const SizedBox(height: 8),
                        const Text('Browse products and add items to your cart',
                            style: TextStyle(color: AppColors.textMuted)),
                      ],
                    ),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: cart.items.length,
                    itemBuilder: (context, index) {
                      final item = cart.items[index];
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(14),
                        decoration: BoxDecoration(
                          color: AppColors.background,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(color: AppColors.border),
                        ),
                        child: Row(
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    item.product.productName,
                                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    '₹${item.product.basePrice.toStringAsFixed(0)} each',
                                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                                  ),
                                ],
                              ),
                            ),
                            // Quantity controls
                            Row(
                              children: [
                                _qtyButton(Icons.remove, () {
                                  ref.read(cartProvider.notifier).updateQuantity(
                                    item.product.id,
                                    item.quantity - 1,
                                  );
                                }),
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 12),
                                  child: Text(
                                    '${item.quantity}',
                                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                                  ),
                                ),
                                _qtyButton(Icons.add, () {
                                  ref.read(cartProvider.notifier).updateQuantity(
                                    item.product.id,
                                    item.quantity + 1,
                                  );
                                }),
                              ],
                            ),
                            const SizedBox(width: 12),
                            Text(
                              '₹${item.lineTotal.toStringAsFixed(0)}',
                              style: const TextStyle(
                                fontWeight: FontWeight.w800,
                                fontSize: 15,
                                color: AppColors.primary,
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
          ),
          // Bottom checkout section
          if (cart.items.isNotEmpty)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: AppColors.border)),
              ),
              child: SafeArea(
                child: Column(
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Subtotal (${cart.totalItems} items)',
                            style: Theme.of(context).textTheme.titleSmall),
                        Text('₹${cart.subtotal.toStringAsFixed(0)}',
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w800,
                                  color: AppColors.primary,
                                )),
                      ],
                    ),
                    const SizedBox(height: 12),
                    FilledButton(
                      onPressed: () {
                        final cart = ref.read(cartProvider);
                        if (cart.items.isEmpty) return;
                        
                        final lineItems = cart.items.map((item) => ActiveOrderLineItem(
                          name: item.product.name,
                          quantity: item.quantity,
                          unitPrice: item.product.basePrice,
                        )).toList();
                        
                        final total = cart.subtotal;
                        
                        ref.read(activeOrderProvider.notifier).setSummary(
                          ActiveOrderSummary(
                            serviceName: 'Product Purchase',
                            packageLabel: 'Cart Order',
                            estimatedTotal: total,
                            items: lineItems,
                          ),
                        );
                        
                         Navigator.pop(context);
                         context.push(AppRoutes.scheduling);
                      },
                      style: FilledButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        minimumSize: const Size(double.infinity, 52),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(14),
                        ),
                      ),
                      child: const Text('Proceed to Checkout',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _qtyButton(IconData icon, VoidCallback onPressed) {
    return InkWell(
      onTap: onPressed,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          color: const Color(0xFFEFF6FF),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: const Color(0xFFBFDBFE)),
        ),
        child: Icon(icon, size: 16, color: AppColors.primary),
      ),
    );
  }
}
