import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/features/auth/providers/auth_provider.dart';
import 'package:mobile_customer/widgets/common/customer_bottom_navigation.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  late TextEditingController _nameController;
  late TextEditingController _phoneController;
  late TextEditingController _addressController;

  bool _isEditing = false;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    final customer = ref.read(authProvider).customer;
    _nameController = TextEditingController(text: customer?.name ?? '');
    _phoneController = TextEditingController(text: customer?.phone ?? '');
    _addressController = TextEditingController(text: customer?.address ?? '');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  Future<void> _handleSaveProfile() async {
    setState(() => _isSaving = true);
    try {
      final customer = ref.read(authProvider).customer;
      if (customer != null) {
        final updated = customer.copyWith(
          name: _nameController.text,
          phone: _phoneController.text,
          address: _addressController.text,
        );
        await ref.read(authProvider.notifier).updateProfile(updated);

        if (mounted) {
          setState(() {
            _isEditing = false;
            _isSaving = false;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text('Profile updated successfully'),
              backgroundColor: Colors.green,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSaving = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to update profile: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  Future<void> _handleLogout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Logout'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        await ref.read(authProvider.notifier).logout();
        if (mounted) {
          context.go('/login');
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text('Logout failed: $e'),
              backgroundColor: Colors.red,
            ),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final customer = authState.customer;

    if (customer == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Profile')),
        bottomNavigationBar: const CustomerBottomNavigation(selectedIndex: 2),
        body: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.blue[50],
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const CircleAvatar(
                      radius: 28,
                      child: Icon(Icons.person_outline, size: 30),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Guest profile',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'You can browse the app without logging in. Sign in only when you are ready to pay or manage bookings.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => context.go(AppRoutes.login),
                child: const Text('Sign in with email'),
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () async {
                  final router = GoRouter.of(context);
                  final messenger = ScaffoldMessenger.of(context);
                  try {
                    await ref.read(authProvider.notifier).continueWithGoogle();
                    if (mounted) {
                      router.go(AppRoutes.profile);
                    }
                  } catch (e) {
                    if (mounted) {
                      messenger.showSnackBar(
                        SnackBar(
                          content: Text('Google sign-in failed: $e'),
                          backgroundColor: Colors.red,
                        ),
                      );
                    }
                  }
                },
                icon: const Icon(Icons.account_circle_outlined),
                label: const Text('Continue with Google'),
              ),
              const SizedBox(height: 12),
              TextButton(
                onPressed: () => context.go(AppRoutes.home),
                child: const Text('Continue browsing'),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profile'),
        actions: [
          if (!_isEditing)
            IconButton(
              icon: const Icon(Icons.edit),
              onPressed: () => setState(() => _isEditing = true),
            ),
        ],
      ),
      bottomNavigationBar: const CustomerBottomNavigation(selectedIndex: 2),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Profile Header
            Container(
              color: Colors.blue[50],
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  Container(
                    width: 100,
                    height: 100,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: Colors.blue[200],
                      image: customer.profileImage != null
                          ? DecorationImage(
                        image: NetworkImage(customer.profileImage!),
                        fit: BoxFit.cover,
                      )
                          : null,
                    ),
                    child: customer.profileImage == null
                        ? Icon(
                      Icons.person,
                      size: 50,
                      color: Colors.blue[800],
                    )
                        : null,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    customer.name,
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    customer.email,
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                ],
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  // Stats
                  Row(
                    children: [
                      Expanded(
                        child: _buildStatCard(
                          label: 'Total Orders',
                          value: customer.totalOrders.toString(),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildStatCard(
                          label: 'Total Spent',
                          value: '₹${customer.totalSpent.toStringAsFixed(0)}',
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Edit Form
                  if (_isEditing) ...[
                    TextField(
                      controller: _nameController,
                      decoration: InputDecoration(
                        labelText: 'Full Name',
                        prefixIcon: const Icon(Icons.person_outlined),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _phoneController,
                      decoration: InputDecoration(
                        labelText: 'Phone Number',
                        prefixIcon: const Icon(Icons.phone_outlined),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _addressController,
                      decoration: InputDecoration(
                        labelText: 'Address',
                        prefixIcon: const Icon(Icons.location_on_outlined),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      maxLines: 3,
                    ),
                    const SizedBox(height: 24),
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton(
                            onPressed: _isSaving
                                ? null
                                : () => setState(() => _isEditing = false),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.grey[300],
                            ),
                            child: const Text('Cancel'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: _isSaving ? null : _handleSaveProfile,
                            child: _isSaving
                                ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                              ),
                            )
                                : const Text('Save'),
                          ),
                        ),
                      ],
                    ),
                  ] else ...[
                    // Display Mode
                    _buildInfoCard('Full Name', customer.name),
                    const SizedBox(height: 12),
                    _buildInfoCard('Email', customer.email),
                    const SizedBox(height: 12),
                    _buildInfoCard('Phone', customer.phone),
                    const SizedBox(height: 12),
                    if (customer.address != null && customer.address!.isNotEmpty)
                      _buildInfoCard('Address', customer.address!),
                    const SizedBox(height: 12),
                    if (customer.registeredDate != null)
                      _buildInfoCard(
                        'Member Since',
                        _formatDate(customer.registeredDate!),
                      ),
                    if (customer.status != null)
                      const SizedBox(height: 12),
                    if (customer.status != null)
                      _buildInfoCard(
                        'Account Status',
                        customer.status!.toUpperCase(),
                      ),
                  ],

                  const SizedBox(height: 32),

                  // Account Actions
                  if (!_isEditing) ...[
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () => context.push('/change-password'),
                        icon: const Icon(Icons.lock_outline),
                        label: const Text('Change Password'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.blue[400],
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () => context.push('/order-history'),
                        icon: const Icon(Icons.history),
                        label: const Text('View Order History'),
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton.icon(
                        onPressed: () => context.push('/payment-methods'),
                        icon: const Icon(Icons.payment),
                        label: const Text('Payment Methods'),
                      ),
                    ),
                    const SizedBox(height: 32),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _handleLogout,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.red[400],
                        ),
                        child: const Text('Logout'),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard({required String label, required String value}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey[300]!),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Text(
            value,
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
              color: Colors.blue,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(color: Colors.grey[600], fontSize: 12),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoCard(String label, String value) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey[300]!),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}
