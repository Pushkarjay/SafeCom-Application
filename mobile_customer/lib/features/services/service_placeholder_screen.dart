import 'package:flutter/material.dart';
import 'package:mobile_customer/core/theme/app_theme.dart';

class ServicePlaceholderScreen extends StatelessWidget {
  final String serviceId;

  const ServicePlaceholderScreen({
    super.key,
    required this.serviceId,
  });

  @override
  Widget build(BuildContext context) {
    // Use the raw serviceId as the title; could be extended to fetch from API
    final label = serviceId.replaceAll('_', ' ').replaceAll('-', ' ').split(' ').map((w) {
      if (w.isEmpty) return w;
      return w[0].toUpperCase() + w.substring(1);
    }).join(' ');

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
                  color: Color(0xFFFFF3E0),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.engineering_outlined,
                  size: 42,
                  color: AppColors.primary,
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
                      color: AppColors.textSecondary,
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
