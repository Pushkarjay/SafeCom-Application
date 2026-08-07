import 'package:flutter/material.dart';
import 'package:mobile_customer/core/theme/app_theme.dart';

class SafeComLogo extends StatelessWidget {
  final double size;
  final bool showText;
  final Color? textColor;

  const SafeComLogo({
    super.key,
    this.size = 80,
    this.showText = true,
    this.textColor,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              colors: [AppColors.secondary, Color(0xFFF59E0B)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(size * 0.22),
            boxShadow: [
              BoxShadow(
                color: AppColors.secondary.withValues(alpha: 0.4),
                blurRadius: size * 0.3,
                offset: Offset(0, size * 0.1),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(size * 0.18),
            child: Image.asset(
              'assets/images/safecom_logo_visual.jpeg',
              fit: BoxFit.cover,
              filterQuality: FilterQuality.high,
              errorBuilder: (context, error, stackTrace) {
                return const Icon(
                  Icons.shield_outlined,
                  color: Colors.white,
                  size: 40,
                );
              },
            ),
          ),
        ),
        if (showText) ...[
          SizedBox(height: size * 0.2),
          Text(
            'SafeCom',
            style: TextStyle(
              fontSize: size * 0.35,
              fontWeight: FontWeight.w800,
              color: textColor ?? Colors.white,
              letterSpacing: -0.5,
            ),
          ),
        ],
      ],
    );
  }
}

class SafeComLogoSmall extends StatelessWidget {
  final double size;

  const SafeComLogoSmall({
    super.key,
    this.size = 40,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.secondary, Color(0xFFF59E0B)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(size * 0.22),
        boxShadow: [
          BoxShadow(
            color: AppColors.secondary.withValues(alpha: 0.3),
            blurRadius: size * 0.2,
            offset: Offset(0, size * 0.08),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(size * 0.18),
        child: Image.asset(
          'assets/images/safecom_logo_visual.jpeg',
          fit: BoxFit.cover,
          filterQuality: FilterQuality.high,
          errorBuilder: (context, error, stackTrace) {
            return Icon(
              Icons.shield_outlined,
              color: Colors.white,
              size: size * 0.5,
            );
          },
        ),
      ),
    );
  }
}
