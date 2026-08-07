import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:mobile_customer/core/theme/app_theme.dart';
import 'package:url_launcher/url_launcher.dart';

class AboutScreen extends ConsumerWidget {
  const AboutScreen({super.key});

  Future<void> _launchUrl(String url) async {
    final uri = Uri.parse(url);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 200,
            pinned: true,
            backgroundColor: AppColors.primary,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [AppColors.primary, Color(0xFFD4760A)],
                  ),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const SizedBox(height: 40),
                    Container(
                      width: 80,
                      height: 80,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.2),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(16),
                        child: Image.asset(
                          'assets/images/safecom_logo_visual.jpeg',
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return const Center(
                              child: Text('🛡️', style: TextStyle(fontSize: 40)),
                            );
                          },
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Text(
                      'SafeCom',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const Text(
                      'Securing your world',
                      style: TextStyle(
                        color: Colors.white70,
                        fontSize: 16,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Padding(
                      padding: EdgeInsets.only(top: 20),
                      child: Text(
                        'About SafeCom',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                  const Text(
                    'Book home services. Pay in the app.',
                    style: TextStyle(
                      fontSize: 16,
                      color: AppColors.textSecondary,
                    ),
                  ),
                  const SizedBox(height: 24),

                  _buildSectionTitle('What SafeCom does'),
                  const SizedBox(height: 12),
                  _buildBulletPoint('Connect customers with verified technicians'),
                  _buildBulletPoint('CCTV sales and installation'),
                  _buildBulletPoint('Computer and laptop repair services'),
                  _buildBulletPoint('Home and office network setup'),
                  _buildBulletPoint('Printer services available'),
                  _buildBulletPoint('Website and app development'),

                  const SizedBox(height: 24),
                  _buildSectionTitle('Owner'),
                  const SizedBox(height: 12),
                  _buildDetailCard('Name', 'Pushkarjay Ajay'),
                  _buildDetailCard('Role', 'Founder & Lead Technician'),
                  _buildDetailCard('Experience', '5+ years in electronics repair, networking, and CCTV systems'),

                  const SizedBox(height: 24),
                  _buildSectionTitle('Contact & Support'),
                  const SizedBox(height: 12),
                  _buildContactCard(Icons.email_outlined, 'Email', 'pushkarjay.ajay1@gmail.com', () => _launchUrl('mailto:pushkarjay.ajay1@gmail.com')),
                  _buildContactCard(Icons.phone_outlined, 'Phone', '+91 8210164935', () => _launchUrl('tel:+918210164935')),
                  _buildContactCard(Icons.language_outlined, 'Website', 'safecomservices.in', () => _launchUrl('https://safecomservices.in')),
                  _buildContactCard(Icons.chat_outlined, 'WhatsApp', '+91 8210164935', () => _launchUrl('https://wa.me/918210164935')),

                  const SizedBox(height: 24),
                  _buildSectionTitle('Connect With Us'),
                  const SizedBox(height: 12),
                  _buildContactCard(Icons.link, 'LinkedIn', 'linkedin.com/company/safecom', () => _launchUrl('https://linkedin.com/company/safecom')),
                  _buildContactCard(Icons.videocam_outlined, 'YouTube', 'youtube.com/@safecom', () => _launchUrl('https://youtube.com/@safecom')),

                  const SizedBox(height: 24),
                  _buildSectionTitle('Business Hours'),
                  const SizedBox(height: 12),
                  _buildDetailCard('Monday - Saturday', '9:00 AM - 7:00 PM'),
                  _buildDetailCard('Sunday', '10:00 AM - 4:00 PM'),

                  const SizedBox(height: 24),
                  _buildSectionTitle('Our Location'),
                  const SizedBox(height: 12),
                  GestureDetector(
                    onTap: () => _launchUrl('https://maps.google.com/?q=Road+no+1,+Phase-01,+Vit+Vibagh+Colony,+Maurya+Path,+Khapura,+Patna,+Bihar+800014'),
                    child: Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.background,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.border),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.location_on, color: AppColors.primary, size: 20),
                              const SizedBox(width: 8),
                              const Text(
                                'Headquarters',
                                style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                              ),
                              const Spacer(),
                              Icon(Icons.open_in_new, size: 16, color: AppColors.primary.withValues(alpha: 0.7)),
                            ],
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Road no 1, Phase-01, Vit Vibagh Colony,\nMaurya Path, Khapura,\nPatna, Bihar 800014, IN',
                            style: TextStyle(fontSize: 13, color: AppColors.textSecondary, height: 1.4),
                          ),
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.pin_drop, size: 14, color: AppColors.primary),
                                SizedBox(width: 4),
                                Text(
                                  'Tap to view on Google Maps',
                                  style: TextStyle(fontSize: 12, color: AppColors.primary),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),

                  const SizedBox(height: 24),
                  _buildSectionTitle('Business Details'),
                  const SizedBox(height: 12),
                  _buildDetailCard('Business Name', 'SafeCom Services'),
                  _buildDetailCard('Type', 'Sole Proprietorship'),
                  _buildDetailCard('Service Area', 'Patna, Bihar (initial launch area)'),
                  _buildDetailCard('Services', 'CCTV, IT Repair, Networking, Web & App Development'),

                  const SizedBox(height: 24),
                  _buildSectionTitle('Customer Policies'),
                  const SizedBox(height: 12),
                  _buildPolicyCard('Privacy Policy', 'We only collect data needed to fulfil bookings and process payments. We do not sell personal data.'),
                  _buildPolicyCard('Terms of Service', 'By booking a service, you agree to pricing, scheduled visits, and technician availability.'),
                  _buildPolicyCard('Refunds', 'If a service cannot be delivered, we will process a refund back to the original payment method within 5-7 business days.'),

                  const SizedBox(height: 32),
                  Center(
                    child: Column(
                      children: [
                        const Text(
                          'SafeCom Customer App',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Payments powered by Razorpay',
                          style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          '© 2026 SafeCom Services',
                          style: TextStyle(fontSize: 12, color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.bold,
        color: AppColors.primary,
      ),
    );
  }

  Widget _buildBulletPoint(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('• ', style: TextStyle(fontSize: 14)),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(fontSize: 14, color: AppColors.textSecondary),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContactCard(IconData icon, String label, String value, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Icon(icon, size: 18, color: AppColors.primary),
            const SizedBox(width: 10),
            Text(
              '$label: ',
              style: const TextStyle(fontWeight: FontWeight.w500, fontSize: 14),
            ),
            Expanded(
              child: Text(
                value,
                style: const TextStyle(fontSize: 14, color: AppColors.primary),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailCard(String label, String value) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: const TextStyle(fontSize: 14),
          ),
        ],
      ),
    );
  }

  Widget _buildPolicyCard(String title, String content) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
          ),
          const SizedBox(height: 4),
          Text(
            content,
            style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }
}
