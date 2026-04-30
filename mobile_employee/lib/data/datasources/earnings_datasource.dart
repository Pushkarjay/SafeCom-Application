import 'package:mobile_employee/data/datasources/api_service.dart';
import 'package:mobile_employee/data/models/employee_models.dart';

class EarningsDatasource {
  final ApiService _apiService;

  EarningsDatasource(this._apiService);

  Future<List<EarningEntry>> getEarnings(String employeeId) async {
    final response = await _apiService.get('/employees/$employeeId/earnings');
    if (response.statusCode == 200 && response.data is List) {
      final data = response.data as List<dynamic>;
      return data
          .map((item) => EarningEntry.fromJson(Map<String, dynamic>.from(item as Map)))
          .toList();
    }

    throw Exception('Failed to load earnings');
  }
}
