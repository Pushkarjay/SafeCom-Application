import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

class EmployeeProfileScreen extends ConsumerStatefulWidget {
  const EmployeeProfileScreen({super.key});

  @override
  ConsumerState<EmployeeProfileScreen> createState() => _EmployeeProfileScreenState();
}

class _EmployeeProfileScreenState extends ConsumerState<EmployeeProfileScreen> {
  bool _isEditing = false;
  
  // Mock employee data
  final Map<String, dynamic> _employee = {
    'id': 'EMP-001',
    'name': 'John Technician',
    'email': 'john.tech@safecom.com',
    'phone': '+91 98765 43210',
    'location': 'Mumbai, Maharashtra',
    'joinDate': DateTime(2024, 1, 15),
    'rating': 4.8,
    'totalJobs': 156,
    'completedJobs': 148,
    'skills': ['CCTV Installation', 'DVR Configuration', 'Wiring', 'Maintenance'],
    'status': 'active',
  };

  late TextEditingController _nameController;
  late TextEditingController _phoneController;
  late TextEditingController _locationController;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: _employee['name']);
    _phoneController = TextEditingController(text: _employee['phone']);
    _locationController = TextEditingController(text: _employee['location']);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('MMM dd, yyyy');

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        elevation: 0,
        actions: [
          if (!_isEditing)
            IconButton(
              icon: const Icon(Icons.edit),
              onPressed: () => setState(() => _isEditing = true),
            )
          else
            IconButton(
              icon: const Icon(Icons.close),
              onPressed: () {
                setState(() => _isEditing = false);
                _resetControllers();
              },
            ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            // Profile header
            Container(
              padding: const EdgeInsets.all(24),
              color: Colors.blue.shade50,
              child: Column(
                children: [
                  // Avatar
                  CircleAvatar(
                    radius: 50,
                    backgroundColor: Colors.blue.shade700,
                    child: Text(
                      _getInitials(_employee['name']),
                      style: const TextStyle(
                        fontSize: 36,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  
                  // Name and status
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        _employee['name'],
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: _employee['status'] == 'active' ? Colors.green : Colors.grey,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          _employee['status'].toString().toUpperCase(),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _employee['email'],
                    style: TextStyle(color: Colors.grey.shade600),
                  ),
                  const SizedBox(height: 16),

                  // Stats row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      _buildStatItem('Jobs', _employee['totalJobs'].toString()),
                      _buildStatItem('Completed', _employee['completedJobs'].toString()),
                      _buildStatItem('Rating', '${_employee['rating']} ⭐'),
                    ],
                  ),
                ],
              ),
            ),

            // Edit mode or info display
            Padding(
              padding: const EdgeInsets.all(16),
              child: _isEditing ? _buildEditForm(context) : _buildInfoSection(context, dateFormat),
            ),

            // Skills section
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Skills',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: (_employee['skills'] as List<String>).map((skill) {
                      return Chip(
                        label: Text(skill),
                        backgroundColor: Colors.blue.shade50,
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Action buttons
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  _buildActionTile(
                    context,
                    icon: Icons.notifications_outlined,
                    title: 'Notifications',
                    onTap: () => _showComingSoon(context),
                  ),
                  _buildActionTile(
                    context,
                    icon: Icons.security_outlined,
                    title: 'Privacy & Security',
                    onTap: () => _showComingSoon(context),
                  ),
                  _buildActionTile(
                    context,
                    icon: Icons.help_outline,
                    title: 'Help & Support',
                    onTap: () => _showComingSoon(context),
                  ),
                  _buildActionTile(
                    context,
                    icon: Icons.info_outline,
                    title: 'About',
                    onTap: () => _showAbout(context),
                  ),
                  const Divider(),
                  ListTile(
                    leading: const Icon(Icons.logout, color: Colors.red),
                    title: const Text('Logout', style: TextStyle(color: Colors.red)),
                    onTap: () => _showLogoutDialog(context),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            color: Colors.grey.shade600,
            fontSize: 12,
          ),
        ),
      ],
    );
  }

  Widget _buildInfoSection(BuildContext context, DateFormat dateFormat) {
    return Column(
      children: [
        _buildInfoTile(Icons.phone, 'Phone', _employee['phone']),
        _buildInfoTile(Icons.location_on, 'Location', _employee['location']),
        _buildInfoTile(Icons.calendar_today, 'Joined', dateFormat.format(_employee['joinDate'])),
        _buildInfoTile(Icons.badge, 'Employee ID', _employee['id']),
      ],
    );
  }

  Widget _buildInfoTile(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, color: Colors.blue.shade700),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: TextStyle(
                    color: Colors.grey.shade600,
                    fontSize: 12,
                  ),
                ),
                Text(
                  value,
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEditForm(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Edit Profile',
          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),
        const SizedBox(height: 16),
        TextField(
          controller: _nameController,
          decoration: const InputDecoration(
            labelText: 'Name',
            prefixIcon: Icon(Icons.person),
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _phoneController,
          decoration: const InputDecoration(
            labelText: 'Phone',
            prefixIcon: Icon(Icons.phone),
            border: OutlineInputBorder(),
          ),
          keyboardType: TextInputType.phone,
        ),
        const SizedBox(height: 12),
        TextField(
          controller: _locationController,
          decoration: const InputDecoration(
            labelText: 'Location',
            prefixIcon: Icon(Icons.location_on),
            border: OutlineInputBorder(),
          ),
        ),
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          child: FilledButton(
            onPressed: _saveProfile,
            child: const Text('Save Changes'),
          ),
        ),
      ],
    );
  }

  Widget _buildActionTile(
    BuildContext context, {
    required IconData icon,
    required String title,
    required VoidCallback onTap,
  }) {
    return ListTile(
      leading: Icon(icon, color: Colors.blue.shade700),
      title: Text(title),
      trailing: const Icon(Icons.chevron_right),
      onTap: onTap,
    );
  }

  String _getInitials(String name) {
    final parts = name.split(' ');
    if (parts.length >= 2) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  void _resetControllers() {
    _nameController.text = _employee['name'];
    _phoneController.text = _employee['phone'];
    _locationController.text = _employee['location'];
  }

  void _saveProfile() {
    // In a real app, this would call an API to update the profile
    setState(() {
      _employee['name'] = _nameController.text;
      _employee['phone'] = _phoneController.text;
      _employee['location'] = _locationController.text;
      _isEditing = false;
    });

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Profile updated successfully'),
        backgroundColor: Colors.green,
      ),
    );
  }

  void _showComingSoon(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Coming soon!')),
    );
  }

  void _showAbout(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('SafeCom Employee'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Version: 1.0.0'),
            SizedBox(height: 8),
            Text('SafeCom CCTV Services Application'),
            SizedBox(height: 8),
            Text('© 2026 SafeCom. All rights reserved.'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  void _showLogoutDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.pop(context);
              // In a real app, navigate to login
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Logged out successfully')),
              );
            },
            child: const Text('Logout'),
          ),
        ],
      ),
    );
  }
}