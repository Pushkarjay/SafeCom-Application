import 'package:mobile_customer/data/datasources/mock_api_transport.dart';
import 'package:mobile_customer/data/models/pricing_contracts.dart';

class PricingApiDataSource {
  final MockApiTransport _transport;

  PricingApiDataSource(this._transport);

  Future<InstallationPricingContract> getInstallationPricing() async {
    final response = await _transport.get('/pricing/installation');
    return InstallationPricingContract.fromJson(response);
  }

  Future<MaintenancePricingContract> getMaintenancePricing() async {
    final response = await _transport.get('/pricing/maintenance');
    return MaintenancePricingContract.fromJson(response);
  }

  Future<RepairPricingContract> getRepairPricing() async {
    final response = await _transport.get('/pricing/repair');
    return RepairPricingContract.fromJson(response);
  }

  Future<UpgradeCatalogContract> getUpgradeCatalog() async {
    final response = await _transport.get('/catalog/upgrade');
    return UpgradeCatalogContract.fromJson(response);
  }

  Future<AccessoryCatalogContract> getAccessoryCatalog() async {
    final response = await _transport.get('/catalog/accessories');
    return AccessoryCatalogContract.fromJson(response);
  }
}
