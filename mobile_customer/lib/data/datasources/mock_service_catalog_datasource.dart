import 'package:mobile_customer/data/models/service_catalog_item.dart';

class MockServiceCatalogDataSource {
  Future<List<ServiceCatalogItem>> getCustomerServices() async {
    await Future<void>.delayed(const Duration(milliseconds: 120));

    return const [
      ServiceCatalogItem(id: 'installation', title: 'Installation', icon: '📹'),
      ServiceCatalogItem(id: 'maintenance', title: 'Maintenance', icon: '🛠'),
      ServiceCatalogItem(id: 'amc', title: 'AMC Plans', icon: '🧰'),
      ServiceCatalogItem(id: 'repair', title: 'Camera Repair', icon: '🔧'),
      ServiceCatalogItem(id: 'upgrade', title: 'System Upgrade', icon: '⬆️'),
      ServiceCatalogItem(id: 'accessories', title: 'Accessories', icon: '🧷'),
    ];
  }
}
