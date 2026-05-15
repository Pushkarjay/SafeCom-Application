import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/features/auth/providers/auth_provider.dart';
import 'package:mobile_customer/core/utils/error_handler.dart';
import 'package:mobile_customer/core/widgets/safecom_logo.dart';

/// Login Screen — Google Sign-In and Phone OTP only.
/// Email/password removed per SRS §3.1.
class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen>
    with SingleTickerProviderStateMixin {
  late final AnimationController _animController;
  late final Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 600),
    );
    _fadeAnim = CurvedAnimation(parent: _animController, curve: Curves.easeOut);
    _animController.forward();
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  Future<void> _handleGoogle() async {
    final router = GoRouter.of(context);
    try {
      await ref.read(authProvider.notifier).continueWithGoogle();
      if (mounted) {
        final authState = ref.read(authProvider);
        if (authState.customer != null &&
            (authState.customer!.phone.isEmpty || authState.customer!.phone == '+91')) {
          router.go('/phone-collection');
        } else {
          router.go(AppRoutes.home);
        }
      }
    } catch (e) {
      if (mounted) {
        AppErrorHandler.showDialog(context, e);
      }
    }
  }

  void _handlePhone() {
    context.push('/phone-auth');
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final theme = Theme.of(context);
    final isLoading = authState.isLoading;

    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF0F172A), Color(0xFF1E3A5F), Color(0xFF0F172A)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        child: SafeArea(
          child: FadeTransition(
            opacity: _fadeAnim,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 28),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const SizedBox(height: 60),
                  // Logo + brand
                  Center(
                    child: Column(
                      children: [
                        const SafeComLogo(size: 80),
                        const SizedBox(height: 20),
                        Text(
                          'SafeCom',
                          style: theme.textTheme.headlineMedium?.copyWith(
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                            letterSpacing: -0.5,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Secure CCTV Solutions',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: Colors.white60,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 56),
                  // Card
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.07),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: Colors.white.withOpacity(0.12)),
                    ),
                    padding: const EdgeInsets.all(28),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Welcome',
                          style: theme.textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.w700,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Sign in to book and manage your CCTV services.',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: Colors.white60,
                          ),
                        ),
                        const SizedBox(height: 28),
                        // Google button – PRIMARY
                        _AuthButton(
                          icon: 'G',
                          isIconText: true,
                          label: 'Continue with Google',
                          onPressed: isLoading ? null : _handleGoogle,
                          isLoading: isLoading,
                          isPrimary: true,
                        ),
                        const SizedBox(height: 14),
                        // Phone button – SECONDARY
                        _AuthButton(
                          icon: 'phone',
                          isIconText: false,
                          label: 'Continue with Phone',
                          onPressed: isLoading ? null : _handlePhone,
                          isLoading: false,
                          isPrimary: false,
                        ),
                      ],
                    ),
                  ),
                  const Spacer(),
                  // Guest
                  Center(
                    child: TextButton(
                      onPressed: isLoading ? null : () => context.go(AppRoutes.home),
                      child: Text(
                        'Continue as Guest',
                        style: TextStyle(
                          color: Colors.white54,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _AuthButton extends StatelessWidget {
  final String icon;
  final bool isIconText;
  final String label;
  final VoidCallback? onPressed;
  final bool isLoading;
  final bool isPrimary;

  const _AuthButton({
    required this.icon,
    required this.isIconText,
    required this.label,
    required this.onPressed,
    required this.isLoading,
    required this.isPrimary,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 56,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: isPrimary ? Colors.white : Colors.white.withOpacity(0.1),
          foregroundColor: isPrimary ? const Color(0xFF0F172A) : Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(14),
            side: isPrimary
                ? BorderSide.none
                : const BorderSide(color: Colors.white24),
          ),
        ),
        child: isLoading
            ? SizedBox(
                height: 22,
                width: 22,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: isPrimary ? const Color(0xFF0F172A) : Colors.white,
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  isIconText
                      ? Text(
                          icon,
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: isPrimary
                                ? const Color(0xFF4285F4)
                                : Colors.white,
                          ),
                        )
                      : Icon(
                          Icons.phone_android,
                          size: 20,
                          color: isPrimary ? const Color(0xFF0F172A) : Colors.white,
                        ),
                  const SizedBox(width: 12),
                  Text(
                    label,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
