import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_customer/data/datasources/mock_api_transport.dart';
import 'package:mobile_customer/data/datasources/pricing_api_datasource.dart';
import 'package:mobile_customer/data/datasources/service_catalog_api_datasource.dart';
import 'package:mobile_customer/data/repositories/pricing_repository.dart';
import 'package:mobile_customer/data/repositories/service_catalog_repository.dart';

final dioProvider = Provider<Dio>((ref) {
  return Dio();
});

final mockApiTransportProvider = Provider<MockApiTransport>((ref) {
  return MockApiTransport(ref.watch(dioProvider));
});

final serviceCatalogApiDataSourceProvider =
    Provider<ServiceCatalogApiDataSource>((ref) {
  return ServiceCatalogApiDataSource(ref.watch(mockApiTransportProvider));
});

final pricingApiDataSourceProvider = Provider<PricingApiDataSource>((ref) {
  return PricingApiDataSource(ref.watch(mockApiTransportProvider));
});

final serviceCatalogRepositoryProvider = Provider<ServiceCatalogRepository>((ref) {
  return ServiceCatalogRepository(ref.watch(serviceCatalogApiDataSourceProvider));
});

final pricingRepositoryProvider = Provider<PricingRepository>((ref) {
  return PricingRepository(ref.watch(pricingApiDataSourceProvider));
});
