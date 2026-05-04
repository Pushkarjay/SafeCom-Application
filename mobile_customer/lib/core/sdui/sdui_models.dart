/// Server-Driven UI (SDUI) Models
///
/// Dart models matching the backend SDUI JSON schema.
/// Used by [SduiRenderer] to render dynamic layouts.

/// Action to perform when a component is tapped.
class SduiAction {
  final String type; // 'navigate', 'deeplink', 'url', 'none'
  final String? route;
  final String? url;
  final Map<String, dynamic>? payload;

  const SduiAction({
    required this.type,
    this.route,
    this.url,
    this.payload,
  });

  factory SduiAction.fromJson(Map<String, dynamic> json) {
    return SduiAction(
      type: json['type'] as String? ?? 'none',
      route: json['route'] as String?,
      url: json['url'] as String?,
      payload: json['payload'] as Map<String, dynamic>?,
    );
  }
}

/// Conditional visibility rules for a component.
class SduiVisibility {
  final String? featureFlag;
  final List<String>? areaCodes;
  final bool? requireServiceable;
  final List<String>? roles;
  final String? startDate;
  final String? endDate;

  const SduiVisibility({
    this.featureFlag,
    this.areaCodes,
    this.requireServiceable,
    this.roles,
    this.startDate,
    this.endDate,
  });

  factory SduiVisibility.fromJson(Map<String, dynamic> json) {
    return SduiVisibility(
      featureFlag: json['featureFlag'] as String?,
      areaCodes: (json['areaCodes'] as List?)?.cast<String>(),
      requireServiceable: json['requireServiceable'] as bool?,
      roles: (json['roles'] as List?)?.cast<String>(),
      startDate: json['startDate'] as String?,
      endDate: json['endDate'] as String?,
    );
  }
}

/// A single UI component in the layout.
class SduiComponent {
  final String id;
  final String type;
  final Map<String, dynamic> data;
  final SduiAction? action;
  final SduiVisibility? visibility;
  final List<SduiComponent>? children;

  const SduiComponent({
    required this.id,
    required this.type,
    required this.data,
    this.action,
    this.visibility,
    this.children,
  });

  factory SduiComponent.fromJson(Map<String, dynamic> json) {
    return SduiComponent(
      id: json['id'] as String? ?? '',
      type: json['type'] as String? ?? 'unknown',
      data: (json['data'] as Map<String, dynamic>?) ?? {},
      action: json['action'] != null
          ? SduiAction.fromJson(json['action'] as Map<String, dynamic>)
          : null,
      visibility: json['visibility'] != null
          ? SduiVisibility.fromJson(json['visibility'] as Map<String, dynamic>)
          : null,
      children: (json['children'] as List?)
          ?.map((c) => SduiComponent.fromJson(c as Map<String, dynamic>))
          .toList(),
    );
  }
}

/// Metadata about the screen layout response.
class SduiScreenMeta {
  final int cacheSeconds;
  final String fallbackScreen;
  final int version;

  const SduiScreenMeta({
    this.cacheSeconds = 300,
    this.fallbackScreen = 'home_fallback',
    this.version = 1,
  });

  factory SduiScreenMeta.fromJson(Map<String, dynamic> json) {
    return SduiScreenMeta(
      cacheSeconds: json['cacheSeconds'] as int? ?? 300,
      fallbackScreen: json['fallbackScreen'] as String? ?? 'home_fallback',
      version: json['version'] as int? ?? 1,
    );
  }
}

/// Full layout response from GET /api/sdui/layout
class SduiLayout {
  final String screen;
  final List<SduiComponent> layout;
  final SduiScreenMeta meta;
  final String timestamp;

  const SduiLayout({
    required this.screen,
    required this.layout,
    required this.meta,
    required this.timestamp,
  });

  factory SduiLayout.fromJson(Map<String, dynamic> json) {
    return SduiLayout(
      screen: json['screen'] as String? ?? '',
      layout: (json['layout'] as List?)
              ?.map((c) => SduiComponent.fromJson(c as Map<String, dynamic>))
              .toList() ??
          [],
      meta: json['meta'] != null
          ? SduiScreenMeta.fromJson(json['meta'] as Map<String, dynamic>)
          : const SduiScreenMeta(),
      timestamp: json['timestamp'] as String? ?? '',
    );
  }
}
