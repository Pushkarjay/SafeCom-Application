import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_customer/data/datasources/api_service.dart';
import 'package:mobile_customer/data/datasources/pricing_api_datasource.dart';
import 'package:mobile_customer/data/datasources/service_catalog_api_datasource.dart';
import 'package:mobile_customer/data/repositories/pricing_repository.dart';
import 'package:mobile_customer/data/repositories/service_catalog_repository.dart';
import 'package:mobile_customer/data/models/pricing_contracts.dart';

final serviceCatalogApiDataSourceProvider =
    Provider<ServiceCatalogApiDataSource>((ref) {
  return ServiceCatalogApiDataSource(ref.watch(apiServiceProvider));
});

final pricingApiDataSourceProvider = Provider<PricingApiDataSource>((ref) {
  return PricingApiDataSource(ref.watch(apiServiceProvider));
});

final serviceCatalogRepositoryProvider = Provider<ServiceCatalogRepository>((ref) {
  return ServiceCatalogRepository(ref.watch(serviceCatalogApiDataSourceProvider));
});

final pricingRepositoryProvider = Provider<PricingRepository>((ref) {
  return PricingRepository(ref.watch(pricingApiDataSourceProvider));
});

/// Provider for fetching a single product by ID.
final productDetailProvider = FutureProvider.family<MasterProduct?, String>((ref, productId) async {
  final apiService = ref.watch(apiServiceProvider);
  final data = await apiService.getProduct(productId);
  return MasterProduct.fromJson(data);
});
