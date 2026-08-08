import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_customer/core/constants/app_routes.dart';
import 'package:mobile_customer/core/theme/app_theme.dart';
import 'package:mobile_customer/data/providers/cart_provider.dart';
import 'package:mobile_customer/features/booking/providers/active_order_provider.dart';
import 'package:mobile_customer/features/booking/providers/booking_flow_provider.dart';
import 'package:mobile_customer/widgets/common/customer_bottom_navigation.dart';

class CartScreen extends ConsumerWidget {
  const CartScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final cartState = ref.watch(cartProvider);
    final cartItems = cartState.items;
    final totalAmount = cartState.subtotal;
    final itemCount = cartState.totalItems;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Your Cart'),
        actions: [
          if (cartState.items.isNotEmpty)
            TextButton(
              onPressed: () => ref.read(cartProvider.notifier).clearCart(),
              child: const Text('Clear All', style: TextStyle(color: AppColors.error)),
            ),
        ],
      ),
      body: cartItems.isEmpty
          ? _EmptyCart(onBrowse: () => context.push(AppRoutes.productsDiscovery))
          : ListView.builder(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
              itemCount: cartItems.length + 1,
              itemBuilder: (context, index) {
                // Last row = the universal message/instruction box so the
                // customer can attach a note to the whole cart order.
                if (index == cartItems.length) {
                  return const _CustomMessageField();
                }
                final item = cartItems[index];
                return _CartItemCard(
                  item: item,
                  onIncrement: () {
                    ref.read(cartProvider.notifier).updateQuantity(item.product.id, item.quantity + 1);
                  },
                  onDecrement: () {
                    if (item.quantity > 1) {
                      ref.read(cartProvider.notifier).updateQuantity(item.product.id, item.quantity - 1);
                    }
                  },
                  onRemove: () => ref.read(cartProvider.notifier).removeFromCart(item.product.id),
                );
              },
            ),
      bottomNavigationBar: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (cartItems.isNotEmpty)
            SafeArea(
              top: false,
              child: Container(
                padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                decoration: const BoxDecoration(
                  color: AppColors.surface,
                  border: Border(top: BorderSide(color: AppColors.borderLight)),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          itemCount == 1 ? '1 item' : '$itemCount items',
                          style: Theme.of(context).textTheme.titleSmall,
                        ),
                        Text(
                          'Rs ${totalAmount.toStringAsFixed(0)}',
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w800,
                            color: AppColors.secondary,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      height: 52,
                      child: FilledButton(
                        onPressed: () => _proceedToSchedule(context, ref, cartItems),
                        style: FilledButton.styleFrom(
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                        ),
                        child: const Text('Proceed to Schedule',
                            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          const CustomerBottomNavigation(selectedIndex: 2),
        ],
      ),
    );
  }

  void _proceedToSchedule(BuildContext context, WidgetRef ref, List<CartItem> items) {
    final lineItems = items.map((item) => ActiveOrderLineItem(
      name: item.product.productName,
      quantity: item.quantity,
      unitPrice: item.product.basePrice,
    )).toList();

    final total = items.fold<double>(0.0, (sum, item) => sum + item.lineTotal);

    ref.read(activeOrderProvider.notifier).setSummary(
      ActiveOrderSummary(
        serviceName: 'Cart Order',
        packageLabel: '${items.length} items',
        estimatedTotal: total,
        items: lineItems,
      ),
    );

    context.push(AppRoutes.scheduling);
  }
}

class _CartItemCard extends StatelessWidget {
  final CartItem item;
  final VoidCallback onIncrement;
  final VoidCallback onDecrement;
  final VoidCallback onRemove;

  const _CartItemCard({
    required this.item,
    required this.onIncrement,
    required this.onDecrement,
    required this.onRemove,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderLight),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.product.productName,
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14),
                ),
                const SizedBox(height: 4),
                Text(
                  'Rs ${item.product.basePrice.toStringAsFixed(0)} each',
                ),
              ],
            ),
          ),
          Row(
            children: [
              _qtyButton(Icons.remove, onDecrement),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                child: Text(
                  '${item.quantity}',
                  style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16),
                ),
              ),
              _qtyButton(Icons.add, onIncrement),
            ],
          ),
          const SizedBox(width: 12),
          Text(
            'Rs ${item.lineTotal.toStringAsFixed(0)}',
            style: const TextStyle(
              fontWeight: FontWeight.w800,
              fontSize: 15,
              color: AppColors.secondary,
            ),
          ),
          const SizedBox(width: 8),
          InkWell(
            onTap: onRemove,
            borderRadius: BorderRadius.circular(8),
            child: Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: AppColors.errorLight,
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.close, size: 16, color: AppColors.error),
            ),
          ),
        ],
      ),
    );
  }

  Widget _qtyButton(IconData icon, VoidCallback onPressed) {
    return InkWell(
      onTap: onPressed,
      borderRadius: BorderRadius.circular(8),
      child: Container(
        width: 32,
        height: 32,
        decoration: BoxDecoration(
          color: AppColors.secondaryLight,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: AppColors.secondaryLight),
        ),
        child: Icon(icon, size: 16, color: AppColors.secondary),
      ),
    );
  }
}

/// Text field for attaching a custom instruction/request to the whole cart.
/// Stateful so the TextEditingController survives rebuilds — typing, backspace
/// and cursor movement behave like a normal input.
class _CustomMessageField extends ConsumerStatefulWidget {
  const _CustomMessageField();

  @override
  ConsumerState<_CustomMessageField> createState() => _CustomMessageFieldState();
}

class _CustomMessageFieldState extends ConsumerState<_CustomMessageField> {
  late final TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(
      text: ref.read(bookingFlowProvider).customTextBoxValue ?? '',
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final value = ref.watch(bookingFlowProvider).customTextBoxValue;
    if (value != _controller.text) {
      _controller.text = value ?? '';
    }

    return Container(
      margin: const EdgeInsets.only(top: 4, bottom: 12),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.accentLight,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.accent.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.notes_outlined, size: 18, color: AppColors.accent),
              const SizedBox(width: 8),
              Text(
                'Add Instructions / Request',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'Tell us anything about this order — the message goes to the technician with your invoice.',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const SizedBox(height: 10),
          TextField(
            controller: _controller,
            maxLines: 3,
            minLines: 2,
            textCapitalization: TextCapitalization.sentences,
            decoration: InputDecoration(
              hintText: 'e.g. Camera near the main gate is not working...',
              filled: true,
              fillColor: Colors.white,
              contentPadding: const EdgeInsets.all(12),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppColors.borderLight),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppColors.borderLight),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(10),
                borderSide: const BorderSide(color: AppColors.accent, width: 1.5),
              ),
            ),
            onChanged: (value) {
              ref
                  .read(bookingFlowProvider.notifier)
                  .setCustomTextBoxValue(value.trim().isEmpty ? null : value);
            },
          ),
        ],
      ),
    );
  }
}

class _EmptyCart extends StatelessWidget {
  final VoidCallback onBrowse;

  const _EmptyCart({required this.onBrowse});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                color: AppColors.surfaceVariant,
                borderRadius: BorderRadius.circular(50),
              ),
              child: const Icon(Icons.shopping_cart_outlined, size: 48, color: AppColors.textMuted),
            ),
            const SizedBox(height: 20),
            Text(
              'Your cart is empty',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            Text(
              'Browse our products and services\nand add items to your cart',
              textAlign: TextAlign.center,
              style: TextStyle(color: AppColors.textSecondary, height: 1.4),
            ),
            const SizedBox(height: 28),
            FilledButton.icon(
              onPressed: onBrowse,
              icon: const Icon(Icons.explore_outlined),
              label: const Text('Browse Products'),
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
