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
import 'package:mobile_customer/features/home/widgets/horizontal_scroll_list.dart';
import 'package:mobile_customer/features/location/providers/location_provider.dart';
import 'package:mobile_customer/core/theme/app_theme.dart';

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

  final route = AppRoutes.serviceRouteMap[item.id];
  if (route != null) {
    context.push(route);
  } else {
    context.push('${AppRoutes.servicePlaceholder}/${item.id}', extra: {
      'title': item.title,
      'icon': item.icon,
    });
  }
}

// ============================================
// HORIZONTAL SERVICES LIST
// ============================================

Widget buildHorizontalServices(SduiComponent component, BuildContext context) {
  final title = component.data['title'] as String? ?? 'Our Services';
  return Consumer(
    builder: (context, ref, _) {
      final servicesAsync = ref.watch(homeServicesProvider);
      return servicesAsync.when(
        data: (services) => HorizontalScrollList(
          title: title,
          itemCount: services.length,
          onSeeAll: () {
            // Logic to see all services if needed
          },
          itemBuilder: (context, index) {
            final service = services[index];
            return _buildHorizontalServiceCard(context, service);
          },
        ),
        loading: () => const _HorizontalShimmer(),
        error: (error, _) => const SizedBox.shrink(),
      );
    },
  );
}

Widget _buildHorizontalServiceCard(BuildContext context, HomeServiceItem service) {
  return InkWell(
    onTap: () => _handleServiceTap(context, service),
    borderRadius: BorderRadius.circular(18),
    child: Ink(
      width: 110,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: const [
          BoxShadow(
            color: Color(0x0D000000),
            blurRadius: 10,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(service.icon, style: const TextStyle(fontSize: 28)),
            const SizedBox(height: 10),
            Text(
              service.title,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.w700,
                    color: const Color(0xFF334155),
                  ),
            ),
          ],
        ),
      ),
    ),
    );
  }

// ============================================
// HORIZONTAL RECOMMENDATIONS LIST
// ============================================

Widget buildHorizontalRecommendations(SduiComponent component, BuildContext context) {
  final title = component.data['title'] as String? ?? 'Recommended for You';
  return Consumer(
    builder: (context, ref, _) {
      final recsAsync = ref.watch(homeRecommendationsProvider);
      return recsAsync.when(
        data: (recs) {
          if (recs.isEmpty) return const SizedBox.shrink();
          return HorizontalScrollList(
            title: title,
            itemCount: recs.length,
            itemBuilder: (context, index) {
              final rec = recs[index];
              return _buildHorizontalRecommendationCard(context, rec);
            },
          );
        },
        loading: () => const _HorizontalShimmer(),
        error: (error, _) => const SizedBox.shrink(),
      );
    },
  );
}

Widget _buildHorizontalRecommendationCard(BuildContext context, HomeRecommendationItem rec) {
  return InkWell(
    onTap: () {
      // Navigate to recommendation detail or checkout with this
      context.push(AppRoutes.recommendation);
    },
    borderRadius: BorderRadius.circular(20),
    child: Ink(
      width: 240,
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.border),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE0F2FE),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.auto_awesome_outlined, 
                      size: 18, color: Color(0xFF0369A1)),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    rec.name,
                    style: const TextStyle(
                      fontWeight: FontWeight.w800,
                      fontSize: 14,
                      color: AppColors.primary,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Text(
              rec.description,
              style: const TextStyle(
                fontSize: 12,
                color: AppColors.textSecondary,
                height: 1.4,
              ),
            ),
            const Spacer(),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${rec.productIds.length} items included',
                  style: const TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    color: AppColors.primary,
                  ),
                ),
                const Icon(Icons.arrow_forward_rounded, 
                    size: 14, color: AppColors.primary),
              ],
            ),
          ],
        ),
      ),
    ),
  );
}

// ============================================
// HORIZONTAL PRODUCTS LIST
// ============================================

Widget buildHorizontalProducts(SduiComponent component, BuildContext context) {
  final title = component.data['title'] as String? ?? 'Popular Products';
  return Consumer(
    builder: (context, ref, _) {
      final productsAsync = ref.watch(homePopularProductsProvider);
      return productsAsync.when(
        data: (products) => HorizontalScrollList(
          title: title,
          itemCount: products.length,
          onSeeAll: () => context.push(AppRoutes.productsDiscovery),
          itemBuilder: (context, index) {
            final product = products[index];
            return _buildHorizontalProductCard(context, product);
          },
        ),
        loading: () => const _HorizontalShimmer(),
        error: (error, _) => const SizedBox.shrink(),
      );
    },
  );
}

Widget _buildHorizontalProductCard(BuildContext context, HomeProductItem product) {
  return InkWell(
    onTap: () {
      // In this app, we go to product discovery to add to cart
      context.push(AppRoutes.productsDiscovery);
    },
    borderRadius: BorderRadius.circular(20),
    child: Ink(
      width: 140,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.surfaceVariant),
        boxShadow: const [
          BoxShadow(
            color: Color(0x08000000),
            blurRadius: 10,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Container(
              width: double.infinity,
              decoration: BoxDecoration(
                color: AppColors.background,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
                image: product.imageUrl != null
                    ? DecorationImage(
                        image: NetworkImage(product.imageUrl!),
                        fit: BoxFit.cover,
                      )
                    : null,
              ),
              child: product.imageUrl == null
                  ? const Center(child: Icon(Icons.inventory_2_outlined, color: Colors.grey))
                  : null,
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  product.name,
                  style: const TextStyle(
                    fontWeight: FontWeight.w700,
                    fontSize: 12,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Rs ${product.price.toInt()}',
                  style: const TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 13,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    ),
  );
}

class _HorizontalShimmer extends StatelessWidget {
  const _HorizontalShimmer();
  @override
  Widget build(BuildContext context) {
    return Container(
      height: 140,
      margin: const EdgeInsets.symmetric(vertical: 12),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: 3,
        itemBuilder: (context, index) => Container(
          width: 140,
          margin: const EdgeInsets.only(right: 12),
          decoration: BoxDecoration(
            color: Colors.grey.shade100,
            borderRadius: BorderRadius.circular(18),
          ),
        ),
      ),
    );
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
      [AppColors.secondaryLight, AppColors.secondary];

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
// ANNOUNCEMENTS LIST
// ============================================

Widget buildAnnouncementsList(SduiComponent component, BuildContext context) {
  final title = component.data['title'] as String? ?? 'Latest Updates';
  final rawItems = component.data['items'] as List?;
  
  List<_Announcement> announcements = [];
  if (rawItems != null) {
    announcements = rawItems.map((item) {
      final map = item as Map<String, dynamic>;
      return _Announcement(
        title: map['title'] as String? ?? '',
        body: map['body'] as String? ?? '',
        icon: _parseIcon(map['icon'] as String?),
        color: _parseColor(map['color'] as String? ?? '#0A84FF'),
      );
    }).toList();
  }

  if (announcements.isEmpty) return const SizedBox.shrink();

  return Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(
        title,
        style: Theme.of(context).textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.w800,
            ),
      ),
      const SizedBox(height: 12),
      ...announcements.map((a) => Container(
            width: double.infinity,
            margin: const EdgeInsets.only(bottom: 10),
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: AppColors.surfaceVariant),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: a.color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(a.icon, color: a.color, size: 22),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        a.title,
                        style: Theme.of(context).textTheme.titleSmall?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        a.body,
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              color: AppColors.textSecondary,
                            ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          )),
    ],
  );
}

class _Announcement {
  final String title;
  final String body;
  final IconData icon;
  final Color color;

  const _Announcement({
    required this.title,
    required this.body,
    required this.icon,
    required this.color,
  });
}

// ============================================
// HELPERS
// ============================================

Color _parseColor(String hex) {
  hex = hex.replaceFirst('#', '');
  if (hex.length == 6) hex = 'FF$hex';
  try {
    return Color(int.parse(hex, radix: 16));
  } catch (e) {
    return AppColors.primary;
  }
}

IconData _parseIcon(String? iconName) {
  switch (iconName) {
    case 'engineering_outlined': return Icons.engineering_outlined;
    case 'map_outlined': return Icons.map_outlined;
    case 'card_giftcard_outlined': return Icons.card_giftcard_outlined;
    case 'info_outline': return Icons.info_outline;
    case 'local_offer_outlined': return Icons.local_offer_outlined;
    case 'new_releases_outlined': return Icons.new_releases_outlined;
    case 'campaign_outlined': return Icons.campaign_outlined;
    default: return Icons.notifications_active_outlined;
  }
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
