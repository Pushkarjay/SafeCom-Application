import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/features/auth/providers/auth_provider.dart';
import 'package:mobile_customer/core/utils/error_handler.dart';
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

class PhoneAuthScreen extends ConsumerStatefulWidget {
  const PhoneAuthScreen({super.key});

  @override
  ConsumerState<PhoneAuthScreen> createState() => _PhoneAuthScreenState();
}

class _PhoneAuthScreenState extends ConsumerState<PhoneAuthScreen> {
  final _phoneController = TextEditingController();
  final _otpController = TextEditingController();
  bool _otpSent = false;
  bool _isLoading = false;
  String? _verificationId;
  String? _error;
  String _countryCode = '+91';

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    super.dispose();
  }

  Future<void> _sendOtp() async {
    final digits = _phoneController.text.trim().replaceAll(RegExp(r'\D'), '');
    if (digits.isEmpty) {
      setState(() => _error = 'Enter a phone number');
      return;
    }
    if (digits.length < 7 || digits.length > 15) {
      setState(() => _error = 'Enter a valid phone number');
      return;
    }
    final formatted = '$_countryCode$digits';

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      await FirebaseAuth.instance.verifyPhoneNumber(
        phoneNumber: formatted,
        timeout: const Duration(seconds: 60),
        verificationCompleted: (PhoneAuthCredential credential) async {
          await _signInWithCredential(credential);
        },
        verificationFailed: (FirebaseAuthException e) {
          setState(() {
            _isLoading = false;
            _error = AppErrorHandler.mapFirebaseCode(e.code);
          });
        },
        codeSent: (String verificationId, int? resendToken) {
          setState(() {
            _verificationId = verificationId;
            _otpSent = true;
            _isLoading = false;
          });
        },
        codeAutoRetrievalTimeout: (String verificationId) {
          _verificationId = verificationId;
        },
      );
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = AppErrorHandler.mapError(e);
      });
    }
  }

  Future<void> _verifyOtp() async {
    final otp = _otpController.text.trim();
    if (otp.length != 6) {
      setState(() => _error = 'Enter the 6-digit OTP');
      return;
    }
    if (_verificationId == null) {
      setState(() => _error = 'Session expired. Please resend OTP.');
      return;
    }

    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final credential = PhoneAuthProvider.credential(
        verificationId: _verificationId!,
        smsCode: otp,
      );
      await _signInWithCredential(credential);
    } catch (e) {
      setState(() {
        _isLoading = false;
        _error = AppErrorHandler.mapError(e);
      });
    }
  }

  Future<void> _signInWithCredential(PhoneAuthCredential credential) async {
    try {
      await ref.read(authProvider.notifier).signInWithPhoneCredential(credential);
    } catch (e) {
      if (mounted) {
        setState(() {
          _isLoading = false;
          _error = AppErrorHandler.mapError(e);
        });
        return;
      }
    }

    if (mounted) {
      context.go(AppRoutes.home);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Container(
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.border, width: 0.5),
                    ),
                    child: IconButton(
                      onPressed: () => context.pop(),
                      icon: const Icon(Icons.arrow_back_rounded, color: AppColors.textPrimary),
                    ),
                  ),
                  const Spacer(),
                  const SafeComLogoSmall(size: 36),
                ],
              ),
              const SizedBox(height: 32),
              Text(
                _otpSent ? 'Enter OTP' : 'Phone Number',
                style: theme.textTheme.headlineMedium?.copyWith(
                  fontWeight: FontWeight.w800,
                  color: AppColors.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                _otpSent
                    ? 'We sent a 6-digit OTP to $_countryCode ${_phoneController.text}'
                    : 'We\'ll send you a verification code.',
                style: TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 14,
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 32),
              if (!_otpSent) ...[
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
                      child: _buildTextField(
                        controller: _phoneController,
                        hint: '98765 43210',
                        keyboardType: TextInputType.phone,
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly,
                          LengthLimitingTextInputFormatter(10),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                _buildPrimaryButton(
                  label: 'Send OTP',
                  onPressed: _isLoading ? null : _sendOtp,
                ),
              ] else ...[
                _buildTextField(
                  controller: _otpController,
                  hint: '• • • • • •',
                  keyboardType: TextInputType.number,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    LengthLimitingTextInputFormatter(6),
                  ],
                ),
                const SizedBox(height: 24),
                _buildPrimaryButton(
                  label: 'Verify & Sign In',
                  onPressed: _isLoading ? null : _verifyOtp,
                ),
                const SizedBox(height: 16),
                Center(
                  child: TextButton(
                    onPressed: _isLoading
                        ? null
                        : () => setState(() {
                              _otpSent = false;
                              _otpController.clear();
                            }),
                    style: TextButton.styleFrom(
                      foregroundColor: AppColors.textSecondary,
                    ),
                    child: const Text('Resend OTP', style: TextStyle(fontWeight: FontWeight.w500)),
                  ),
                ),
              ],
              if (_error != null) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  decoration: BoxDecoration(
                    color: AppColors.errorLight,
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: AppColors.error.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.error_outline, color: AppColors.error, size: 18),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          _error!,
                          style: const TextStyle(color: AppColors.error, fontSize: 13),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    required TextInputType keyboardType,
    List<TextInputFormatter>? inputFormatters,
  }) {
    return TextField(
      controller: controller,
      keyboardType: keyboardType,
      inputFormatters: inputFormatters,
      style: const TextStyle(color: AppColors.textPrimary, fontSize: 18, letterSpacing: 0.5),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: const TextStyle(color: AppColors.textMuted),
        filled: true,
        fillColor: AppColors.surfaceVariant,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: const BorderSide(color: AppColors.secondary, width: 1.5),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      ),
    );
  }

  Widget _buildPrimaryButton({
    required String label,
    required VoidCallback? onPressed,
  }) {
    return SizedBox(
      height: 52,
      child: FilledButton(
        onPressed: onPressed,
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
            : Text(label, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700)),
      ),
    );
  }
}
