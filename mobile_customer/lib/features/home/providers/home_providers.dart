import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_customer/data/providers/data_providers.dart';

final homeServicesProvider = FutureProvider<List<HomeServiceItem>>((ref) async {
  final repository = ref.watch(serviceCatalogRepositoryProvider);
  final services = await repository.getCustomerServices();
  return services
      .where((item) => item.enabled)
      .map(
        (item) => HomeServiceItem(
          id: item.id,
          icon: item.icon,
          title: item.title,
          enabled: item.enabled,
        ),
      )
      .toList(growable: false);
});

final homeRecommendationsProvider = FutureProvider<List<HomeRecommendationItem>>((ref) async {
  final repository = ref.watch(serviceCatalogRepositoryProvider);
  // Fetch general recommendations for home screen
  final response = await repository.getRecommendations(placement: 'general');
  return response.recommendations.map((r) => HomeRecommendationItem(
    id: r.recommendationId,
    name: r.name,
    description: r.description,
    productIds: r.productIds,
  )).toList();
});

final homePopularProductsProvider = FutureProvider<List<HomeProductItem>>((ref) async {
  final repository = ref.watch(serviceCatalogRepositoryProvider);
  // Fetch a subset of products to show as "Popular" or "New Arrivals"
  final response = await repository.getProducts(pageSize: 10);
  return response.products.map((p) => HomeProductItem(
    id: p.id,
    name: p.name,
    price: p.price,
    imageUrl: p.imageUrl,
    category: p.category,
  )).toList();
});

class HomeServiceItem {
  final String id;
  final String icon;
  final String title;
  final bool enabled;

  const HomeServiceItem({
    required this.id,
    required this.icon,
    required this.title,
    this.enabled = true,
  });
}

class HomeRecommendationItem {
  final String id;
  final String name;
  final String description;
  final List<String> productIds;

  const HomeRecommendationItem({
    required this.id,
    required this.name,
    required this.description,
    required this.productIds,
  });
}

class HomeProductItem {
  final String id;
  final String name;
  final double price;
  final String? imageUrl;
  final String category;

  const HomeProductItem({
    required this.id,
    required this.name,
    required this.price,
    this.imageUrl,
    required this.category,
  });
}
