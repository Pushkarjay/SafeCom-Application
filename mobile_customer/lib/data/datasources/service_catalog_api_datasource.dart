import 'package:mobile_customer/data/datasources/api_service.dart';
import 'package:mobile_customer/data/models/pricing_contracts.dart';

class ServiceCatalogApiDataSource {
  final ApiService _apiService;

  ServiceCatalogApiDataSource(this._apiService);

  Future<ServiceCatalogResponse> getCustomerServices() async {
    final response = await _apiService.getServices();
    return ServiceCatalogResponse.fromJson(response);
  }

  Future<RecommendationCatalogResponse> getRecommendations({
    String placement = 'checkout',
    String? serviceType,
  }) async {
    final response = await _apiService.getRecommendations(
      placement: placement,
      serviceType: serviceType,
    );
    return RecommendationCatalogResponse.fromJson(response);
  }

  Future<InstallationPricingContract> getDynamicServicePricing(String serviceId) async {
    final response = await _apiService.getDynamicServicePricing(serviceId);
    return InstallationPricingContract.fromJson(response);
  }

  Future<MasterProductResponse> getProducts({int pageSize = 20}) async {
    final response = await _apiService.getAllProducts();
    return MasterProductResponse.fromJson(response);
  }
}
