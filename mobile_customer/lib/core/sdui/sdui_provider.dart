/// SDUI Provider
///
/// Riverpod providers for fetching and caching SDUI layouts.
/// Includes in-memory cache with TTL and fallback to default layout.

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_customer/core/sdui/sdui_models.dart';
import 'package:mobile_customer/data/datasources/api_service.dart';
import 'package:mobile_customer/features/location/providers/location_provider.dart';

// ============================================
// CACHE
// ============================================

class _CachedLayout {
  final SduiLayout layout;
  final DateTime fetchedAt;

  _CachedLayout(this.layout, this.fetchedAt);

  bool isExpired() {
    final ttl = Duration(seconds: layout.meta.cacheSeconds);
    return DateTime.now().difference(fetchedAt) > ttl;
  }
}

final _layoutCache = <String, _CachedLayout>{};

// ============================================
// PROVIDERS
// ============================================

/// Fetches the SDUI layout for a given screen.
/// Automatically includes user location for personalization.
final sduiLayoutProvider =
    FutureProvider.family<SduiLayout, String>((ref, screen) async {
  // Check cache first
  final cached = _layoutCache[screen];
  if (cached != null && !cached.isExpired()) {
    return cached.layout;
  }

  // Get location for personalization
  final locationState = ref.read(locationProvider);
  final lat = locationState.latitude;
  final lng = locationState.longitude;

  try {
    final apiService = ref.read(apiServiceProvider);
    final response = await apiService.getScreenLayout(screen, lat: lat, lng: lng);

    // Parse the layout from API response
    final data = response['data'] as Map<String, dynamic>?;
    if (data == null) {
      return _fallbackLayout(screen);
    }

    final layout = SduiLayout.fromJson(data);

    // Cache the result
    _layoutCache[screen] = _CachedLayout(layout, DateTime.now());

    return layout;
  } catch (e) {
    // Return fallback layout if API fails
    return _fallbackLayout(screen);
  }
});

/// Invalidate the cache for a specific screen (e.g., after location change).
void invalidateSduiCache([String? screen]) {
  if (screen != null) {
    _layoutCache.remove(screen);
  } else {
    _layoutCache.clear();
  }
}

// ============================================
// FALLBACK
// ============================================

SduiLayout _fallbackLayout(String screen) {
  return SduiLayout(
    screen: screen,
    layout: [
      const SduiComponent(
        id: 'fallback_location_header',
        type: 'location_header',
        data: {'showChangeButton': true},
      ),
      const SduiComponent(
        id: 'fallback_spacer_1',
        type: 'spacer',
        data: {'height': 18},
      ),
      const SduiComponent(
        id: 'fallback_section_title',
        type: 'section_title',
        data: {'text': 'Book a Service'},
      ),
      const SduiComponent(
        id: 'fallback_spacer_2',
        type: 'spacer',
        data: {'height': 12},
      ),
      const SduiComponent(
        id: 'fallback_service_grid',
        type: 'service_grid',
        data: {'columns': 3},
      ),
    ],
    meta: const SduiScreenMeta(
      cacheSeconds: 60,
      fallbackScreen: 'home_fallback',
      version: 0,
    ),
    timestamp: DateTime.now().toIso8601String(),
  );
}
