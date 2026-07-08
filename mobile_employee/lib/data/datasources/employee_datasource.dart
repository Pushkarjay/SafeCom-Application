import 'package:mobile_employee/data/datasources/api_service.dart';
import 'package:mobile_employee/data/models/employee_models.dart';

class EmployeeDatasource {
  final ApiService _apiService;

  EmployeeDatasource(this._apiService);

  Future<EmployeeProfile> getEmployeeProfile(String employeeId) async {
    // Use /me endpoint when no specific employeeId is passed (looks up by Firebase UID)
    final endpoint = employeeId.isEmpty ? '/employees/me' : '/employees/$employeeId';
    final response = await _apiService.get(endpoint);
    if (response.statusCode == 200 && response.data is Map) {
      final body = Map<String, dynamic>.from(response.data as Map);
      final employeeData = body['data'];
      if (employeeData is Map) {
        return EmployeeProfile.fromJson(Map<String, dynamic>.from(employeeData));
      }
      return EmployeeProfile.fromJson(body);
    }

    throw Exception('Failed to load employee profile');
  }
}
