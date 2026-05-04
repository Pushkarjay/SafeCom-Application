import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Products Discovery Screen
/// 
/// TODO: Connect to backend API for dynamic product catalog
/// - Search functionality
/// - Category filters
/// - Sorting options (price, popularity, rating)
/// - Product detail view with booking integration
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

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
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
              padding: const EdgeInsets.all(16),
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
                            setState(() {});
                          },
                        )
                      : null,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                onChanged: (value) {
                  setState(() {});
                },
              ),
            ),

            // Category Filter Chips
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  _buildCategoryChip('all', 'All Products'),
                  const SizedBox(width: 8),
                  _buildCategoryChip('installation', 'Installation'),
                  const SizedBox(width: 8),
                  _buildCategoryChip('maintenance', 'Maintenance'),
                  const SizedBox(width: 8),
                  _buildCategoryChip('accessories', 'Accessories'),
                  const SizedBox(width: 8),
                  _buildCategoryChip('amc', 'AMC Plans'),
                ],
              ),
            ),

            const SizedBox(height: 16),

            // Products Grid
            Expanded(
              child: _buildProductsPlaceholder(),
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
      backgroundColor: Colors.transparent,
      side: BorderSide(
        color: isSelected ? const Color(0xFF0A84FF) : Colors.grey,
      ),
      labelStyle: TextStyle(
        color: isSelected ? const Color(0xFF0A84FF) : Colors.black,
      ),
    );
  }

  Widget _buildProductsPlaceholder() {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        children: [
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Column(
              children: [
                const Icon(
                  Icons.inventory_2_outlined,
                  size: 48,
                  color: Color(0xFFA0AEC0),
                ),
                const SizedBox(height: 12),
                Text(
                  'Products Loading',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: const Color(0xFF475569),
                        fontWeight: FontWeight.w700,
                      ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Backend integration in progress. Products will be displayed here with full search, filter, and sort capabilities.',
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: const Color(0xFF64748B),
                      ),
                ),
                const SizedBox(height: 16),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    'Planned features:\n• Dynamic product catalog\n• Real-time search\n• Category & price filters\n• Sorting options\n• One-tap booking',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: const Color(0xFF0A84FF),
                        ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}
