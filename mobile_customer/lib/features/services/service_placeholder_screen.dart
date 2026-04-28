import 'package:flutter/material.dart';

class ServicePlaceholderScreen extends StatelessWidget {
  final String serviceId;

  const ServicePlaceholderScreen({
    super.key,
    required this.serviceId,
  });

  static const _serviceLabels = {
    'maintenance': 'Maintenance',
    'amc': 'AMC Plans',
    'repair': 'Camera Repair',
    'upgrade': 'System Upgrade',
    'accessories': 'Accessories',
  };

  @override
  Widget build(BuildContext context) {
    final label = _serviceLabels[serviceId] ?? 'Service';

    return Scaffold(
      appBar: AppBar(title: Text(label)),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                height: 88,
                width: 88,
                decoration: const BoxDecoration(
                  color: Color(0xFFEFF6FF),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.engineering_outlined,
                  size: 42,
                  color: Color(0xFF0A84FF),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                '$label module',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
              ),
              const SizedBox(height: 8),
              Text(
                'This dedicated flow is next in implementation. Dynamic packages, invoice and booking steps will be connected here.',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: const Color(0xFF475569),
                    ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
