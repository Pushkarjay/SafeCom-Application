// e:/Projects/Working/SafeCom-Application/mobile_customer/lib/core/config/api_config.dart
import 'dart:io';

class ApiConfig {
  // Base URL for the customer app backend - asia-south1
  static const String baseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://safecom-backend-177425757120.asia-south1.run.app/api',
  );
  
  // Timeout for API requests in milliseconds
  static const int timeoutMs = int.fromEnvironment(
    'API_TIMEOUT_MS',
    defaultValue: 10000,
  );

  // TODO: Fetch from backend config endpoint instead of hardcoding
  static const double bookingAmount = 100.0;
  static const double minimumPaymentAmount = 100.0;
  static const double gstRate = 0.0; // GST inclusive in product prices
  static const String gstLabel = 'GST';
}
