import 'package:mobile_customer/data/datasources/pricing_api_datasource.dart';
import 'package:mobile_customer/data/models/pricing_contracts.dart';

class PricingRepository {
  final PricingApiDataSource _dataSource;

  PricingRepository(this._dataSource);

  Future<InstallationPricingContract> getInstallationPricing() {
    return _dataSource.getInstallationPricing();
  }

  Future<MaintenancePricingContract> getMaintenancePricing() {
    return _dataSource.getMaintenancePricing();
  }

  Future<RepairPricingContract> getRepairPricing() {
    return _dataSource.getRepairPricing();
  }

  Future<AmcPricingContract> getAmcPricing() {
    return _dataSource.getAmcPricing();
  }

  Future<UpgradeCatalogContract> getUpgradeCatalog() {
    return _dataSource.getUpgradeCatalog();
  }

  Future<AccessoryCatalogContract> getAccessoryCatalog() {
    return _dataSource.getAccessoryCatalog();
  }
}
