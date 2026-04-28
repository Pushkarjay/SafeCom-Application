import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_customer/features/auth/providers/auth_provider.dart';

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() =>
      _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _emailController = TextEditingController();
  final _otpController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  int _step = 1; // 1: Email, 2: OTP, 3: New Password
  String? _emailError;
  String? _otpError;
  String? _passwordError;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  int _otpTimer = 0;

  @override
  void dispose() {
    _emailController.dispose();
    _otpController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleRequestReset() async {
    _emailError = null;
    if (_emailController.text.isEmpty) {
      setState(() => _emailError = 'Email is required');
      return;
    }
    if (!_emailController.text.contains('@')) {
      setState(() => _emailError = 'Enter a valid email');
      return;
    }

    try {
      await ref.read(authProvider.notifier).requestPasswordReset(
        _emailController.text.trim(),
      );

      if (mounted) {
        setState(() => _step = 2);
        // Start OTP timer
        _startOtpTimer();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('OTP sent to your email'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _emailError = 'Failed to send OTP: $e');
      }
    }
  }

  void _startOtpTimer() {
    _otpTimer = 60;
    Future.delayed(const Duration(seconds: 1), () {
      if (mounted && _otpTimer > 0) {
        setState(() => _otpTimer--);
        _startOtpTimer();
      }
    });
  }

  Future<void> _handleVerifyOtp() async {
    _otpError = null;
    if (_otpController.text.isEmpty) {
      setState(() => _otpError = 'OTP is required');
      return;
    }
    if (_otpController.text.length != 6) {
      setState(() => _otpError = 'OTP must be 6 digits');
      return;
    }

    try {
      final isValid = await ref.read(authProvider.notifier).verifyOTP(
        email: _emailController.text.trim(),
        otp: _otpController.text,
      );

      if (isValid && mounted) {
        setState(() => _step = 3);
      } else if (mounted) {
        setState(() => _otpError = 'Invalid OTP. Please try again');
      }
    } catch (e) {
      if (mounted) {
        setState(() => _otpError = 'OTP verification failed: $e');
      }
    }
  }

  Future<void> _handleResetPassword() async {
    _passwordError = null;

    if (_passwordController.text.isEmpty) {
      setState(() => _passwordError = 'Password is required');
      return;
    }
    if (_passwordController.text.length < 6) {
      setState(() => _passwordError = 'Password must be at least 6 characters');
      return;
    }
    if (_confirmPasswordController.text != _passwordController.text) {
      setState(() => _passwordError = 'Passwords do not match');
      return;
    }

    try {
      await ref.read(authProvider.notifier).resetPassword(
        email: _emailController.text.trim(),
        newPassword: _passwordController.text,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Password reset successfully. Please login.'),
            backgroundColor: Colors.green,
          ),
        );
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        setState(() => _passwordError = 'Failed to reset password: $e');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Reset Password'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 20),

              // Step Indicator
              Row(
                children: [
                  _buildStepCircle(1, _step >= 1),
                  Expanded(
                    child: Container(
                      height: 2,
                      color: _step >= 2 ? Colors.blue : Colors.grey[300],
                    ),
                  ),
                  _buildStepCircle(2, _step >= 2),
                  Expanded(
                    child: Container(
                      height: 2,
                      color: _step >= 3 ? Colors.blue : Colors.grey[300],
                    ),
                  ),
                  _buildStepCircle(3, _step >= 3),
                ],
              ),
              const SizedBox(height: 32),

              // Step 1: Email
              if (_step == 1) ...[
                Text(
                  'Enter Your Email',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'We\'ll send you an OTP to reset your password',
                  style: TextStyle(color: Colors.grey[600]),
                ),
                const SizedBox(height: 24),
                TextField(
                  controller: _emailController,
                  enabled: !authState.isLoading,
                  decoration: InputDecoration(
                    labelText: 'Email Address',
                    prefixIcon: const Icon(Icons.email_outlined),
                    errorText: _emailError,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  keyboardType: TextInputType.emailAddress,
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: authState.isLoading ? null : _handleRequestReset,
                    child: authState.isLoading
                        ? const SizedBox(
                          height: 24,
                          width: 24,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                        : const Text('Send OTP'),
                  ),
                ),
              ],

              // Step 2: OTP
              if (_step == 2) ...[
                Text(
                  'Verify OTP',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Enter the 6-digit OTP sent to\n${_emailController.text}',
                  style: TextStyle(color: Colors.grey[600]),
                ),
                const SizedBox(height: 24),
                TextField(
                  controller: _otpController,
                  enabled: !authState.isLoading && _otpTimer > 0,
                  decoration: InputDecoration(
                    labelText: 'OTP',
                    hintText: '000000',
                    prefixIcon: const Icon(Icons.numbers_outlined),
                    errorText: _otpError,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                ),
                const SizedBox(height: 12),
                if (_otpTimer > 0)
                  Text(
                    'Resend OTP in ${_otpTimer}s',
                    style: TextStyle(color: Colors.grey[600], fontSize: 12),
                  )
                else
                  TextButton(
                    onPressed: _handleRequestReset,
                    child: const Text('Resend OTP'),
                  ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: (authState.isLoading || _otpTimer == 0)
                        ? null
                        : _handleVerifyOtp,
                    child: authState.isLoading
                        ? const SizedBox(
                          height: 24,
                          width: 24,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                        : const Text('Verify OTP'),
                  ),
                ),
              ],

              // Step 3: New Password
              if (_step == 3) ...[
                Text(
                  'Create New Password',
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Enter a strong password for your account',
                  style: TextStyle(color: Colors.grey[600]),
                ),
                const SizedBox(height: 24),
                TextField(
                  controller: _passwordController,
                  enabled: !authState.isLoading,
                  obscureText: _obscurePassword,
                  decoration: InputDecoration(
                    labelText: 'New Password',
                    prefixIcon: const Icon(Icons.lock_outlined),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword
                            ? Icons.visibility_outlined
                            : Icons.visibility_off_outlined,
                      ),
                      onPressed: () {
                        setState(
                          () => _obscurePassword = !_obscurePassword,
                        );
                      },
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _confirmPasswordController,
                  enabled: !authState.isLoading,
                  obscureText: _obscureConfirmPassword,
                  decoration: InputDecoration(
                    labelText: 'Confirm Password',
                    prefixIcon: const Icon(Icons.lock_outlined),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscureConfirmPassword
                            ? Icons.visibility_outlined
                            : Icons.visibility_off_outlined,
                      ),
                      onPressed: () {
                        setState(
                          () => _obscureConfirmPassword = !_obscureConfirmPassword,
                        );
                      },
                    ),
                    errorText: _passwordError,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
                const SizedBox(height: 32),
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: authState.isLoading ? null : _handleResetPassword,
                    child: authState.isLoading
                        ? const SizedBox(
                          height: 24,
                          width: 24,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                        : const Text('Reset Password'),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStepCircle(int step, bool isActive) {
    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: isActive ? Colors.blue : Colors.grey[300],
      ),
      child: Center(
        child: Text(
          '$step',
          style: TextStyle(
            color: isActive ? Colors.white : Colors.grey[600],
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }
}
