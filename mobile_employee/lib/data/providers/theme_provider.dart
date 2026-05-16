import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_employee/core/theme/app_theme.dart';

final themeModeProvider = StateNotifierProvider<ThemeNotifier, ThemeMode>((ref) {
  return ThemeNotifier();
});

class ThemeNotifier extends StateNotifier<ThemeMode> {
  ThemeNotifier() : super(ThemeMode.light);

  void toggle() {
    state = state == ThemeMode.light ? ThemeMode.dark : ThemeMode.light;
  }

  void setLight() => state = ThemeMode.light;
  void setDark() => state = ThemeMode.dark;
}

final themeDataProvider = Provider<ThemeData>((ref) {
  final mode = ref.watch(themeModeProvider);
  return mode == ThemeMode.dark ? AppTheme.dark : AppTheme.light;
});
