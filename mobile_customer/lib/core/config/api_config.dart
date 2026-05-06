// e:/Projects/Working/SafeCom-Application/mobile_customer/lib/core/config/api_config.dart
import 'dart:io';

class ApiConfig {
  // Base URL for the backend API - configurable via dart-define or environment
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://safecom-backend-177425757120.asia-south1.run.app/api',
  );
  
  // Timeout for API requests in milliseconds
  static const int timeoutMs = int.fromEnvironment(
    'API_TIMEOUT_MS',
    defaultValue: '10000',
  );
}
