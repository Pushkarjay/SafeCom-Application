import 'package:flutter/material.dart';

class AppTheme {
  static ThemeData get light => ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0A84FF),
          brightness: Brightness.light,
        ),
        fontFamily: 'Roboto',
        textTheme: TextTheme(
          displayLarge: TextStyle(
            fontSize: 32,
            fontWeight: FontWeight.bold,
            color: Colors.grey.shade900,
          ),
          titleLarge: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w600,
            color: Colors.grey.shade900,
          ),
          bodyLarge: TextStyle(
            fontSize: 16,
            color: Colors.grey.shade800,
          ),
          bodyMedium: TextStyle(
            fontSize: 14,
            color: Colors.grey.shade700,
          ),
          bodySmall: TextStyle(
            fontSize: 12,
            color: Colors.grey.shade600,
          ),
        ),
      );
}
