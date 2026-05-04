/// SDUI Widget Builders
///
/// Each function maps a JSON SDUI component to a Flutter widget.
/// These builders reuse existing SafeCom widgets where possible.

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/core/sdui/sdui_models.dart';
import 'package:mobile_customer/features/home/providers/home_providers.dart';
import 'package:mobile_customer/features/home/widgets/location_header.dart';
import 'package:mobile_customer/features/home/widgets/service_grid.dart';
import 'package:mobile_customer/features/location/providers/location_provider.dart';

// ============================================
// LOCATION HEADER
// ============================================

Widget buildLocationHeader(SduiComponent component, BuildContext context) {
  // This builder needs Riverpod context — use a Consumer wrapper
  return Consumer(
    builder: (context, ref, _) {
      final locationState = ref.watch(locationProvider);
      return LocationHeader(
        location: locationState.location,
        onChange: () => context.push(AppRoutes.locationPicker),
      );
    },
  );
}

// ============================================
// SECTION TITLE
// ============================================

Widget buildSectionTitle(SduiComponent component, BuildContext context) {
  final text = component.data['text'] as String? ?? '';
  return Text(
    text,
    style: Theme.of(context).textTheme.titleLarge?.copyWith(
          fontWeight: FontWeight.w800,
        ),
  );
}

// ============================================
// SERVICE GRID
// ============================================

Widget buildServiceGrid(SduiComponent component, BuildContext context) {
  return Consumer(
    builder: (context, ref, _) {
      final servicesAsync = ref.watch(homeServicesProvider);
      return servicesAsync.when(
        data: (services) => ServiceGrid(
          services: services,
          onServiceTap: (item) => _handleServiceTap(context, item),
        ),
        loading: () => const Padding(
          padding: EdgeInsets.symmetric(vertical: 24),
          child: Center(child: CircularProgressIndicator()),
        ),
        error: (error, _) => Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
          ),
          child: Text('Failed to load services: $error'),
        ),
      );
    },
  );
}

void _handleServiceTap(BuildContext context, HomeServiceItem item) {
  if (!item.enabled) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('${item.title} is disabled.')),
    );
    return;
  }

  final routes = <String, String>{
    'installation': AppRoutes.serviceTypes,
    'maintenance': AppRoutes.maintenanceTypes,
    'amc': AppRoutes.amcPlans,
    'repair': AppRoutes.repairIssues,
    'upgrade': AppRoutes.systemUpgrade,
    'accessories': AppRoutes.accessories,
  };

  final route = routes[item.id];
  if (route != null) {
    context.push(route);
  } else {
    context.push('${AppRoutes.servicePlaceholder}/${item.id}');
  }
}

// ============================================
// BANNER (Gradient CTA Card)
// ============================================

Widget buildBanner(SduiComponent component, BuildContext context) {
  final title = component.data['title'] as String? ?? '';
  final subtitle = component.data['subtitle'] as String? ?? '';
  final gradientColors = (component.data['gradientColors'] as List?)
          ?.map((c) => _parseColor(c as String))
          .toList() ??
      [const Color(0xFF0A84FF), const Color(0xFF1E40AF)];

  return GestureDetector(
    onTap: () => _handleAction(context, component.action),
    child: Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: gradientColors,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white70,
                      ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),
          const Icon(Icons.arrow_forward_rounded, color: Colors.white),
        ],
      ),
    ),
  );
}

// ============================================
// PROMO BANNER
// ============================================

Widget buildPromoBanner(SduiComponent component, BuildContext context) {
  final title = component.data['title'] as String? ?? '';
  final subtitle = component.data['subtitle'] as String? ?? '';
  final bgColor = _parseColor(
    component.data['backgroundColor'] as String? ?? '#111827',
  );

  return GestureDetector(
    onTap: () => _handleAction(context, component.action),
    child: Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.w700,
                      ),
                ),
                const SizedBox(height: 6),
                Text(
                  subtitle,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: Colors.white70,
                      ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 10),
          const Icon(Icons.local_offer_outlined, color: Colors.white, size: 28),
        ],
      ),
    ),
  );
}

// ============================================
// INFO CARD
// ============================================

Widget buildInfoCard(SduiComponent component, BuildContext context) {
  final title = component.data['title'] as String? ?? '';
  final subtitle = component.data['subtitle'] as String? ?? '';
  final bgColor = _parseColor(
    component.data['backgroundColor'] as String? ?? '#F3F4F6',
  );
  final textColor = _parseColor(
    component.data['textColor'] as String? ?? '#111827',
  );

  return Container(
    width: double.infinity,
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      color: bgColor,
      borderRadius: BorderRadius.circular(16),
    ),
    child: Row(
      children: [
        Icon(Icons.info_outline, color: textColor, size: 24),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                      color: textColor,
                      fontWeight: FontWeight.w700,
                    ),
              ),
              if (subtitle.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  subtitle,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: textColor.withValues(alpha: 0.8),
                      ),
                ),
              ],
            ],
          ),
        ),
      ],
    ),
  );
}

// ============================================
// SPACER
// ============================================

Widget buildSpacer(SduiComponent component, BuildContext context) {
  final height = (component.data['height'] as num?)?.toDouble() ?? 16;
  return SizedBox(height: height);
}

// ============================================
// DIVIDER
// ============================================

Widget buildDivider(SduiComponent component, BuildContext context) {
  final thickness = (component.data['thickness'] as num?)?.toDouble() ?? 1;
  final color = _parseColor(component.data['color'] as String? ?? '#E5E7EB');
  return Divider(thickness: thickness, color: color);
}

// ============================================
// HELPERS
// ============================================

Color _parseColor(String hex) {
  hex = hex.replaceFirst('#', '');
  if (hex.length == 6) hex = 'FF$hex';
  return Color(int.parse(hex, radix: 16));
}

void _handleAction(BuildContext context, SduiAction? action) {
  if (action == null || action.type == 'none') return;

  switch (action.type) {
    case 'navigate':
      if (action.route != null) {
        context.push(action.route!);
      }
      break;
    case 'url':
    case 'deeplink':
      // For URLs/deeplinks, could use url_launcher
      // For now, try to push as an in-app route
      if (action.route != null) {
        context.push(action.route!);
      }
      break;
  }
}
