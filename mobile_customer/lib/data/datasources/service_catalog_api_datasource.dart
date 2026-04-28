import 'package:mobile_customer/data/datasources/mock_api_transport.dart';
import 'package:mobile_customer/data/models/pricing_contracts.dart';

class ServiceCatalogApiDataSource {
  final MockApiTransport _transport;

  ServiceCatalogApiDataSource(this._transport);

  Future<ServiceCatalogResponse> getCustomerServices() async {
    final response = await _transport.get('/customer/services');
    return ServiceCatalogResponse.fromJson(response);
  }
}
