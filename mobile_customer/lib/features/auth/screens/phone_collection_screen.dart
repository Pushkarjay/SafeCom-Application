import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/features/auth/providers/auth_provider.dart';
import 'package:mobile_customer/core/widgets/safecom_logo.dart';
import 'package:mobile_customer/core/theme/app_theme.dart';

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

class PhoneCollectionScreen extends ConsumerStatefulWidget {
  final String? continueRoute;

  const PhoneCollectionScreen({super.key, this.continueRoute});

  @override
  ConsumerState<PhoneCollectionScreen> createState() => _PhoneCollectionScreenState();
}

class _PhoneCollectionScreenState extends ConsumerState<PhoneCollectionScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  bool _isLoading = false;
  String? _error;
  String _countryCode = '+91';

  @override
  void initState() {
    super.initState();
    final customer = ref.read(authProvider).customer;
    if (customer != null) {
      if (customer.name.isNotEmpty && customer.name != 'Customer') {
        _nameController.text = customer.name;
      }
      _emailController.text = customer.email;
      _phoneController.text = customer.phone.replaceAll(RegExp(r'^\+\d+'), '');
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final name = _nameController.text.trim();
    final email = _emailController.text.trim();
    final digits = _phoneController.text.trim().replaceAll(RegExp(r'\D'), '');
    final phone = '$_countryCode$digits';

    if (name.isEmpty) {
      setState(() => _error = 'Please enter your full name');
      return;
    }
    if (email.isNotEmpty && !email.contains('@')) {
      setState(() => _error = 'Please enter a valid email address');
      return;
    }
    if (digits.isEmpty || digits.length < 7 || digits.length > 15) {
      setState(() => _error = 'Please enter a valid phone number');
      return;
    }

    setState(() { _isLoading = true; _error = null; });

    try {
      final customer = ref.read(authProvider).customer;
      final customerId = customer?.id;
      final authService = ref.read(authServiceProvider);

      if (email.isNotEmpty) {
        final emailTaken = await authService.checkEmailExists(email, excludeCustomerId: customerId);
        if (emailTaken) {
          if (mounted) {
            setState(() { _isLoading = false; _error = 'This email is already linked to another account. Please use a different email or sign in with Google.'; });
          }
          return;
        }
      }

      if (phone.isNotEmpty) {
        final phoneTaken = await authService.checkPhoneExists(phone, excludeCustomerId: customerId);
        if (phoneTaken) {
          if (mounted) {
            setState(() { _isLoading = false; _error = 'This phone number is already linked to another account. Please use a different number or sign in with this phone.'; });
          }
          return;
        }
      }

      if (customer != null) {
        final updated = customer.copyWith(name: name, email: email, phone: phone);
        await ref.read(authProvider.notifier).updateProfile(updated);
      }

      if (mounted) {
        final route = widget.continueRoute ?? AppRoutes.home;
        context.go(route);
      }
    } catch (e) {
      if (mounted) {
        setState(() { _isLoading = false; _error = 'Failed to save. Please try again.'; });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: Padding(
          padding: const EdgeInsets.only(left: 8),
          child: Container(
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.border, width: 0.5),
            ),
            child: IconButton(
              icon: const Icon(Icons.arrow_back_rounded, color: AppColors.textPrimary),
              onPressed: () => context.go(AppRoutes.home),
            ),
          ),
        ),
        actions: [
          const SafeComLogoSmall(size: 36),
          const SizedBox(width: 16),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 20),
              const Text(
                'Complete Your Profile',
                style: TextStyle(
                  fontSize: 26,
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 10),
              const Text(
                'We need these details to process your service requests and keep you updated.',
                style: TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 14,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 32),
              _buildField(
                controller: _nameController,
                hint: 'John Doe',
                label: 'Full Name',
                icon: Icons.person_outline,
              ),
              const SizedBox(height: 16),
              _buildField(
                controller: _emailController,
                hint: 'john@example.com',
                label: 'Email Address',
                icon: Icons.email_outlined,
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Container(
                    height: 56,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceVariant,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.border, width: 0.5),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _countryCode,
                        dropdownColor: AppColors.surface,
                        style: const TextStyle(color: AppColors.textPrimary, fontSize: 16),
                        icon: const Icon(Icons.arrow_drop_down, color: AppColors.textMuted),
                        items: _countryCodes.map((c) => DropdownMenuItem(
                          value: c.$2,
                          child: Text('${c.$1} ${c.$2}', style: const TextStyle(fontSize: 15)),
                        )).toList(),
                        onChanged: (v) { if (v != null) setState(() => _countryCode = v); },
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        color: AppColors.surfaceVariant,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.border, width: 0.5),
                      ),
                      child: TextField(
                        controller: _phoneController,
                        keyboardType: TextInputType.phone,
                        style: const TextStyle(color: AppColors.textPrimary, fontSize: 16),
                        decoration: const InputDecoration(
                          hintText: 'Phone number',
                          hintStyle: TextStyle(color: AppColors.textMuted),
                          border: InputBorder.none,
                          contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                        ),
                        inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                      ),
                    ),
                  ),
                ],
              ),
              if (_error != null) ...[
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: AppColors.errorLight,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.error.withOpacity(0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: AppColors.error, size: 18),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(_error!, style: const TextStyle(color: AppColors.error, fontSize: 13)),
                      ),
                    ],
                  ),
                ),
              ],
              const SizedBox(height: 28),
              SizedBox(
                height: 52,
                child: FilledButton(
                  onPressed: _isLoading ? null : _submit,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.secondary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          height: 20, width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                        )
                      : const Text('Continue', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
                ),
              ),
              const SizedBox(height: 16),
              Center(
                child: TextButton(
                  onPressed: _isLoading ? null : () => context.go(AppRoutes.profile),
                  style: TextButton.styleFrom(foregroundColor: AppColors.textSecondary),
                  child: const Text('Skip for now', style: TextStyle(fontWeight: FontWeight.w500)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildField({
    required TextEditingController controller,
    required String hint,
    required String label,
    required IconData icon,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceVariant,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border, width: 0.5),
      ),
      child: TextField(
        controller: controller,
        keyboardType: keyboardType,
        style: const TextStyle(color: AppColors.textPrimary, fontSize: 16),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(color: AppColors.textMuted),
          labelText: label,
          labelStyle: const TextStyle(color: AppColors.textSecondary),
          prefixIcon: Icon(icon, color: AppColors.textMuted),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
        ),
      ),
    );
  }
}
