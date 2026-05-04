import 'package:dio/dio.dart';
import '../../core/config/api_config.dart';

class MockApiTransport {
  final Dio _dio;

  MockApiTransport(this._dio);

  Future<Map<String, dynamic>> get(String path) async {
    final backendBase = ApiConfig.baseUrl;
    _dio.options.baseUrl = backendBase;

    final response = await _dio.get(path);
    if (response.statusCode == 200 && response.data is Map<String, dynamic>) {
      return Map<String, dynamic>.from(response.data as Map);
    }
    
    throw DioException(
      requestOptions: RequestOptions(path: path),
      message: 'Backend request failed with status: ${response.statusCode}',
    );
  }
}
