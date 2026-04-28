import 'package:mobile_customer/data/datasources/service_catalog_api_datasource.dart';
import 'package:mobile_customer/data/models/service_catalog_item.dart';

class ServiceCatalogRepository {
  final ServiceCatalogApiDataSource _dataSource;

  ServiceCatalogRepository(this._dataSource);

  Future<List<ServiceCatalogItem>> getCustomerServices() async {
    final response = await _dataSource.getCustomerServices();
    return response.services
        .map(
          (service) => ServiceCatalogItem(
            id: service.id,
            title: service.title,
            icon: service.icon,
            enabled: service.enabled,
          ),
        )
        .toList(growable: false);
  }
}
