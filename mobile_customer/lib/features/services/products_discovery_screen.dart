import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_customer/data/datasources/api_service.dart';
import 'package:mobile_customer/data/models/pricing_contracts.dart';

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

    return Scaffold(
      appBar: AppBar(
        title: const Text('All Products'),
        elevation: 0,
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
                  fillColor: const Color(0xFFF1F5F9),
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
                          const Icon(Icons.search_off, size: 48, color: Color(0xFF94A3B8)),
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
                      childAspectRatio: 0.75,
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
                        const Icon(Icons.cloud_off_outlined, size: 48, color: Color(0xFF94A3B8)),
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
      selectedColor: const Color(0xFFEFF6FF),
      side: BorderSide(
        color: isSelected ? const Color(0xFF0A84FF) : const Color(0xFFE2E8F0),
      ),
      labelStyle: TextStyle(
        color: isSelected ? const Color(0xFF0A84FF) : const Color(0xFF0F172A),
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

class _ProductCard extends StatelessWidget {
  final MasterProduct product;

  const _ProductCard({required this.product});

  @override
  Widget build(BuildContext context) {
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
                  color: Color(0xFF0A84FF),
                  letterSpacing: 0.5,
                ),
              ),
            ),
            const Spacer(),
            Text(
              product.productName,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
            ),
            const SizedBox(height: 4),
            if (product.description.isNotEmpty)
              Text(
                product.description,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: const Color(0xFF64748B),
                    ),
              ),
            const Spacer(),
            Text(
              'Rs ${product.basePrice.toStringAsFixed(0)}',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: const Color(0xFF0A84FF),
                    fontWeight: FontWeight.w800,
                  ),
            ),
            if (product.variants.isNotEmpty)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  '${product.variants.length} variant${product.variants.length > 1 ? 's' : ''} available',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: const Color(0xFF10B981),
                        fontWeight: FontWeight.w500,
                      ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
