// SDUI Component Registry
//
// Maps component `type` strings to widget builder functions.
// New component types can be registered without modifying the renderer.

import 'package:flutter/material.dart';
import 'package:mobile_customer/core/sdui/sdui_models.dart';
import 'package:mobile_customer/core/sdui/sdui_builders.dart';

/// Function signature for building a widget from an SDUI component.
typedef SduiWidgetBuilder = Widget Function(
  SduiComponent component,
  BuildContext context,
);

/// Registry of all known SDUI component types and their builders.
class SduiComponentRegistry {
  SduiComponentRegistry._();

  static final Map<String, SduiWidgetBuilder> _builders = {
    'location_header': buildLocationHeader,
    'section_title': buildSectionTitle,
    'service_grid': buildServiceGrid,
    'horizontal_services': buildHorizontalServices,
    'horizontal_recommendations': buildHorizontalRecommendations,
    'horizontal_products': buildHorizontalProducts,
    'banner': buildBanner,
    'promo_banner': buildPromoBanner,
    'info_card': buildInfoCard,
    'spacer': buildSpacer,
    'divider': buildDivider,
    'announcements_list': buildAnnouncementsList,
  };

  /// Register a custom component builder at runtime.
  static void register(String type, SduiWidgetBuilder builder) {
    _builders[type] = builder;
  }

  /// Build a widget from an SDUI component.
  /// Returns a fallback widget if the type is unregistered.
  static Widget build(SduiComponent component, BuildContext context) {
    final builder = _builders[component.type];
    if (builder != null) {
      return builder(component, context);
    }
    // Fallback for unknown component types — silent in release, visible in debug
    assert(() {
      debugPrint('SDUI: Unknown component type "${component.type}" (id=${component.id})');
      return true;
    }());
    return const SizedBox.shrink();
  }

  /// Check if a component type is registered.
  static bool hasBuilder(String type) => _builders.containsKey(type);
}
