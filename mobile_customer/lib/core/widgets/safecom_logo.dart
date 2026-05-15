import 'package:flutter/material.dart';

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
            gradient: LinearGradient(
              colors: [
                const Color(0xFFD97706),
                const Color(0xFFF59E0B),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(size * 0.24),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFFD97706).withOpacity(0.3),
                blurRadius: size * 0.3,
                offset: Offset(0, size * 0.12),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(size * 0.2),
            child: Image.asset(
              'assets/images/safecom_logo_visual.jpeg',
              fit: BoxFit.cover,
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
          colors: [Color(0xFFD97706), Color(0xFFF59E0B)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(size * 0.24),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(size * 0.2),
        child: Image.asset(
          'assets/images/safecom_logo_visual.jpeg',
          fit: BoxFit.cover,
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