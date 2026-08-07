import 'package:flutter/foundation.dart';
import 'package:mobile_customer/data/datasources/api_service.dart';
import 'package:mobile_customer/data/models/pricing_contracts.dart';

class PricingApiDataSource {
  final ApiService _apiService;

  PricingApiDataSource(this._apiService);

  Future<InstallationPricingContract> getInstallationPricing() async {
    final response = await _apiService.getInstallationPricing();
    try {
      return InstallationPricingContract.fromJson(response);
    } catch (e, st) {
      debugPrint('*** INSTALL ERROR *** PricingApiDataSource.getInstallationPricing fromJson error: $e');
      debugPrint('*** INSTALL ERROR *** StackTrace: $st');
      rethrow;
    }
  }

  Future<MaintenancePricingContract> getMaintenancePricing() async {
    final response = await _apiService.getMaintenancePricing();
    return MaintenancePricingContract.fromJson(response);
  }

  Future<MaintenancePricingContract> getMaintenanceTreePricing() async {
    final response = await _apiService.getMaintenancePricing();
    return MaintenancePricingContract.fromJson(response);
  }

  Future<RepairPricingContract> getRepairPricing() async {
    final response = await _apiService.getRepairPricing();
    return RepairPricingContract.fromJson(response);
  }

  Future<AmcPricingContract> getAmcPricing() async {
    final response = await _apiService.getAmcPricing();
    return AmcPricingContract.fromJson(response);
  }

  Future<UpgradeCatalogContract> getUpgradeCatalog() async {
    final response = await _apiService.getUpgradeBundles();
    return UpgradeCatalogContract.fromJson(response);
  }

  Future<AccessoryCatalogContract> getAccessoryCatalog() async {
    final response = await _apiService.getAccessories();
    return AccessoryCatalogContract.fromJson(response);
  }
}
