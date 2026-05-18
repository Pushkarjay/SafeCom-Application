import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_employee/data/providers/employee_providers.dart';
import 'package:mobile_employee/core/constants/app_routes.dart';
import 'package:mobile_employee/core/theme/app_theme.dart';

const _countryCodes = [
  ('🇮🇳', '+91', 'India'),
  ('🇺🇸', '+1', 'USA'),
  ('🇬🇧', '+44', 'UK'),
  ('🇦🇺', '+61', 'Australia'),
  ('🇨🇦', '+1', 'Canada'),
  ('🇦🇪', '+971', 'UAE'),
  ('🇸🇦', '+966', 'Saudi Arabia'),
  ('🇸🇬', '+65', 'Singapore'),
  ('🇲🇾', '+60', 'Malaysia'),
  ('🇧🇩', '+880', 'Bangladesh'),
  ('🇳🇵', '+977', 'Nepal'),
  ('🇱🇰', '+94', 'Sri Lanka'),
];

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> with SingleTickerProviderStateMixin {
  late TextEditingController _phoneController;
  late TextEditingController _passwordController;
  late AnimationController _animController;
  late Animation<double> _fadeIn;
  late Animation<Offset> _slideUp;
  bool _obscurePassword = true;
  bool _loading = false;
  String _countryCode = '+91';

  @override
  void initState() {
    super.initState();
    _phoneController = TextEditingController();
    _passwordController = TextEditingController();
    _animController = AnimationController(vsync: this, duration: const Duration(milliseconds: 1000));
    _fadeIn = Tween<double>(begin: 0, end: 1).animate(CurvedAnimation(
      parent: _animController,
      curve: const Interval(0, 0.5, curve: Curves.easeOut),
    ));
    _slideUp = Tween<Offset>(begin: const Offset(0, 0.15), end: Offset.zero).animate(CurvedAnimation(
      parent: _animController,
      curve: const Interval(0.1, 0.5, curve: Curves.easeOutCubic),
    ));
    _animController.forward();
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _passwordController.dispose();
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFFF5F2ED),
              Color(0xFFFFFBF5),
              Color(0xFFF5F2ED),
            ],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 60),
                FadeTransition(
                  opacity: _fadeIn,
                  child: SlideTransition(
                    position: _slideUp,
                    child: Column(
                      children: [
                        Container(
                          width: 80,
                          height: 80,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: AppColors.border, width: 0.5),
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.shadow,
                                blurRadius: 16,
                                offset: const Offset(0, 3),
                              ),
                            ],
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(19),
                            child: Image.asset(
                              'assets/images/safecom_employee_only_logo.jpeg',
                              width: 80,
                              height: 80,
                              fit: BoxFit.contain,
                            ),
                          ),
                        ),
                        const SizedBox(height: 20),
                        Text(
                          'SafeCom',
                          style: TextStyle(
                            fontSize: 26,
                            fontWeight: FontWeight.w800,
                            color: AppColors.textPrimary,
                            letterSpacing: -0.5,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppColors.primaryLight,
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            'TECHNICIAN PORTAL',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w700,
                              color: AppColors.primary,
                              letterSpacing: 3,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 48),
                FadeTransition(
                  opacity: _fadeIn,
                  child: SlideTransition(
                    position: _slideUp,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Sign In',
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'Enter your credentials to continue',
                          style: TextStyle(
                            fontSize: 14,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 28),
                FadeTransition(
                  opacity: _fadeIn,
                  child: SlideTransition(
                    position: Tween<Offset>(
                      begin: const Offset(0, 0.2),
                      end: Offset.zero,
                    ).animate(CurvedAnimation(
                      parent: _animController,
                      curve: const Interval(0.2, 0.6, curve: Curves.easeOutCubic),
                    )),
                    child: Row(
                      children: [
                        Container(
                          height: 50,
                          padding: const EdgeInsets.symmetric(horizontal: 8),
                          decoration: BoxDecoration(
                            color: AppColors.surface,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.border),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              value: _countryCode,
                              style: TextStyle(color: AppColors.textPrimary, fontSize: 16),
                              icon: const Icon(Icons.arrow_drop_down, color: Colors.grey),
                              items: _countryCodes.map((c) => DropdownMenuItem(
                                value: c.$2,
                                child: Text('${c.$1} ${c.$2}'),
                              )).toList(),
                              onChanged: (v) { if (v != null) setState(() => _countryCode = v); },
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: TextField(
                            controller: _phoneController,
                            keyboardType: TextInputType.phone,
                            decoration: InputDecoration(
                              labelText: 'Phone Number',
                              hintText: 'Enter number without country code',
                              prefixIcon: Icon(Icons.phone_outlined, color: AppColors.textMuted, size: 20),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                FadeTransition(
                  opacity: _fadeIn,
                  child: SlideTransition(
                    position: Tween<Offset>(
                      begin: const Offset(0, 0.25),
                      end: Offset.zero,
                    ).animate(CurvedAnimation(
                      parent: _animController,
                      curve: const Interval(0.3, 0.7, curve: Curves.easeOutCubic),
                    )),
                    child: TextField(
                      controller: _passwordController,
                      obscureText: _obscurePassword,
                      decoration: InputDecoration(
                        labelText: 'Password',
                        prefixIcon: Icon(Icons.lock_outlined, color: AppColors.textMuted, size: 20),
                        suffixIcon: IconButton(
                          icon: Icon(
                            _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                            color: AppColors.textMuted,
                            size: 20,
                          ),
                          onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 32),
                FadeTransition(
                  opacity: _fadeIn,
                  child: SlideTransition(
                    position: Tween<Offset>(
                      begin: const Offset(0, 0.3),
                      end: Offset.zero,
                    ).animate(CurvedAnimation(
                      parent: _animController,
                      curve: const Interval(0.4, 0.8, curve: Curves.easeOutCubic),
                    )),
                    child: SizedBox(
                      height: 50,
                      child: FilledButton(
                        onPressed: _loading ? null : _handleLogin,
                        style: FilledButton.styleFrom(
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: _loading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Text('Sign In'),
                                  SizedBox(width: 8),
                                  Icon(Icons.arrow_forward, size: 18),
                                ],
                              ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 48),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _handleLogin() async {
    final messenger = ScaffoldMessenger.of(context);
    if (_phoneController.text.isEmpty || _passwordController.text.isEmpty) {
      messenger.showSnackBar(const SnackBar(content: Text('Please enter phone and password')));
      return;
    }

    setState(() => _loading = true);

    try {
      final raw = _phoneController.text.trim().replaceAll(RegExp(r'\D'), '');
      final codeDigits = _countryCode.replaceAll(RegExp(r'\D'), '');
      final digits = raw.startsWith(codeDigits) ? raw.substring(codeDigits.length) : raw;
      final phone = '$_countryCode$digits';
      final email = '${phone.replaceAll(RegExp(r'\D'), '')}@safecom.local';
      final router = GoRouter.of(context);
      final authService = ref.read(authServiceProvider);

      final cred = await authService.signInWithEmail(email, _passwordController.text.trim());
      final user = cred.user;

      if (user != null) {
        await authService.linkUserToBackend(
          firebaseUid: user.uid,
          email: '', // Email is optional — leave empty for phone-only users
          displayName: user.displayName ?? 'Technician',
          phone: phone,
          location: 'Unspecified',
        );
      }

      if (!mounted) return;
      router.go(AppRoutes.home);
    } catch (e) {
      if (!mounted) return;
      messenger.showSnackBar(SnackBar(content: Text('Login failed: $e')));
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }
}
