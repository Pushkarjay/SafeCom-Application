import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_employee/data/providers/employee_providers.dart';
import 'package:mobile_employee/core/constants/app_routes.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  late TextEditingController _phoneController;
  late TextEditingController _passwordController;

  @override
  void initState() {
    super.initState();
    _phoneController = TextEditingController();
    _passwordController = TextEditingController();
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 40),
              Text(
                'SafeCom',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.displayLarge,
              ),
              const SizedBox(height: 12),
              Text(
                'Employee App',
                textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 60),
              Text(
                'Technician Login',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 24),
              TextField(
                controller: _phoneController,
                keyboardType: TextInputType.phone,
                decoration: InputDecoration(
                  labelText: 'Phone Number',
                  hintText: '+91 9876543210',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  prefixIcon: const Icon(Icons.phone),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _passwordController,
                obscureText: true,
                decoration: InputDecoration(
                  labelText: 'Password',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                  prefixIcon: const Icon(Icons.lock),
                ),
              ),
              const SizedBox(height: 24),
              FilledButton(
                onPressed: () async {
                  final messenger = ScaffoldMessenger.of(context);
                  if (_phoneController.text.isEmpty || _passwordController.text.isEmpty) {
                    messenger.showSnackBar(const SnackBar(content: Text('Please fill all fields')));
                    return;
                  }

                  final raw = _phoneController.text.trim();
                  final email = raw.contains('@') ? raw : '$raw@safecom.local';
                  final router = GoRouter.of(context);
                  final authService = ref.read(authServiceProvider);

                  try {
                    final cred = await authService.signInWithEmail(email, _passwordController.text.trim());
                    final user = cred.user;

                    // Link user to backend Firestore after successful login
                    if (user != null) {
                      await authService.linkUserToBackend(
                        firebaseUid: user.uid,
                        email: email,
                        displayName: user.displayName ?? email,
                        phone: raw,
                        location: 'Unspecified',
                      );
                    }

                    // On success, navigate to home
                    if (!mounted) return;
                    router.go(AppRoutes.home);
                  } catch (e) {
                    messenger.showSnackBar(SnackBar(content: Text('Login failed: $e')));
                  }
                },
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                child: const Text('Login'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
