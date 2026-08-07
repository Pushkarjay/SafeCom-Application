// SDUI Renderer
//
// Core widget that takes a list of [SduiComponent]s and renders them
// into a scrollable column using the [SduiComponentRegistry].

import 'package:flutter/material.dart';
import 'package:mobile_customer/core/sdui/sdui_models.dart';
import 'package:mobile_customer/core/sdui/sdui_component_registry.dart';

/// Renders a list of SDUI components as a vertical list.
class SduiRenderer extends StatelessWidget {
  final List<SduiComponent> components;

  const SduiRenderer({super.key, required this.components});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: components
          .map((component) => _buildComponent(component, context))
          .toList(),
    );
  }

  Widget _buildComponent(SduiComponent component, BuildContext context) {
    return KeyedSubtree(
      key: ValueKey(component.id),
      child: SduiComponentRegistry.build(component, context),
    );
  }
}
