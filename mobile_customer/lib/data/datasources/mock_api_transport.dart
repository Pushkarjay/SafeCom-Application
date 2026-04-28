import 'package:dio/dio.dart';

class MockApiTransport {
  final Dio _dio;

  MockApiTransport(this._dio);

  Future<Map<String, dynamic>> get(String path) async {
    // Keep Dio in the stack so switching from mock to real API requires only transport changes.
    _dio.options.baseUrl = 'https://mock.safecom.local';
    await Future<void>.delayed(const Duration(milliseconds: 140));

    final payload = _contracts[path];
    if (payload == null) {
      throw DioException(
        requestOptions: RequestOptions(path: path),
        message: 'No mock contract registered for path: $path',
      );
    }
    return payload;
  }

  static final Map<String, Map<String, dynamic>> _contracts = {
    '/customer/services': {
      'services': [
        {'id': 'installation', 'title': 'Installation', 'icon': '📹', 'enabled': true},
        {'id': 'maintenance', 'title': 'Maintenance', 'icon': '🛠', 'enabled': true},
        {'id': 'amc', 'title': 'AMC Plans', 'icon': '🧰', 'enabled': true},
        {'id': 'repair', 'title': 'Camera Repair', 'icon': '🔧', 'enabled': true},
        {'id': 'upgrade', 'title': 'System Upgrade', 'icon': '⬆️', 'enabled': true},
        {'id': 'accessories', 'title': 'Accessories', 'icon': '🧷', 'enabled': true},
      ],
    },
    '/pricing/installation': {
      'nvrByPackage': {'4': 4000, '8': 6400, '16': 9800, '32': 14800},
      'cameraByMp': {'2MP': 1800, '5MP': 2600},
      'hddBySize': {'1TB': 3500, '2TB': 5200, '3TB': 6900},
      'cableKitPrice': 950,
      'connectorPrice': 60,
      'wiringPrice': 35,
      'installationChargePrice': 250,
    },
    '/pricing/maintenance': {
      'planVisits': {'Basic': 1, 'Standard': 2, 'Comprehensive': 4},
      'itemTemplates': [
        {
          'key': 'inspection',
          'name': 'System Inspection Visit',
          'unitPrice': 799,
          'baseQuantity': 1,
          'multiplyByVisitCount': true,
          'canEditQuantity': false,
        },
        {
          'key': 'cleaning',
          'name': 'Camera Cleaning & Refocus',
          'unitPrice': 199,
          'baseQuantity': 8,
          'multiplyByVisitCount': false,
          'canEditQuantity': true,
        },
        {
          'key': 'healthcheck',
          'name': 'NVR/DVR Health Check',
          'unitPrice': 349,
          'baseQuantity': 1,
          'multiplyByVisitCount': false,
          'canEditQuantity': true,
        },
        {
          'key': 'rewiring',
          'name': 'Minor Rewiring Support',
          'unitPrice': 120,
          'baseQuantity': 10,
          'multiplyByVisitCount': false,
          'canEditQuantity': true,
        },
        {
          'key': 'labour',
          'name': 'Service Labor Charges',
          'unitPrice': 299,
          'baseQuantity': 1,
          'multiplyByVisitCount': true,
          'canEditQuantity': false,
        },
      ],
    },
    '/pricing/repair': {
      'issues': [
        {
          'id': 'no_video',
          'title': 'No Video Output',
          'visitFee': 299,
          'diagnosticFee': 399,
        },
        {
          'id': 'blurred_feed',
          'title': 'Blurred / Distorted Feed',
          'visitFee': 249,
          'diagnosticFee': 349,
        },
        {
          'id': 'recording_failure',
          'title': 'Recording Failure',
          'visitFee': 349,
          'diagnosticFee': 449,
        },
      ],
      'itemTemplates': [
        {
          'key': 'camera_fix',
          'name': 'Camera Repair Unit',
          'unitPrice': 899,
          'quantity': 1,
          'canEditQuantity': true,
        },
        {
          'key': 'connector_replacement',
          'name': 'Connector Replacement',
          'unitPrice': 80,
          'quantity': 4,
          'canEditQuantity': true,
        },
        {
          'key': 'cable_patch',
          'name': 'Cable Patch / Rework',
          'unitPrice': 120,
          'quantity': 5,
          'canEditQuantity': true,
        },
      ],
    },
    '/catalog/upgrade': {
      'bundles': [
        {
          'id': 'upg_2mp_to_5mp',
          'name': '2MP to 5MP Upgrade',
          'description': 'Upgrade existing cameras for better clarity.',
          'price': 6999,
        },
        {
          'id': 'upg_nvr_storage',
          'name': 'NVR + Storage Upgrade',
          'description': 'Increase channel and storage capacity.',
          'price': 8999,
        },
        {
          'id': 'upg_full_stack',
          'name': 'Full Surveillance Upgrade',
          'description': 'Camera, NVR, and network optimization bundle.',
          'price': 14999,
        },
      ],
    },
    '/catalog/accessories': {
      'items': [
        {'id': 'acc_junction', 'name': 'Junction Box', 'price': 220},
        {'id': 'acc_cat6', 'name': 'Cat6 Cable (10m)', 'price': 450},
        {'id': 'acc_poe', 'name': 'PoE Switch', 'price': 1999},
        {'id': 'acc_adapter', 'name': 'Power Adapter', 'price': 350},
      ],
    },
  };
}
