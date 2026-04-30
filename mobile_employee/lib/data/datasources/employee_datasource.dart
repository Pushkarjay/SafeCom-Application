import 'package:mobile_employee/data/datasources/api_service.dart';
import 'package:mobile_employee/data/models/employee_models.dart';

class EmployeeDatasource {
  final ApiService _apiService;

  EmployeeDatasource(this._apiService);

  Future<EmployeeProfile> getEmployeeProfile(String employeeId) async {
    final response = await _apiService.get('/employees/$employeeId');
    if (response.statusCode == 200 && response.data is Map) {
      return EmployeeProfile.fromJson(Map<String, dynamic>.from(response.data as Map));
    }

    throw Exception('Failed to load employee profile');
  }
}
