import 'package:flutter/material.dart';

class HorizontalScrollList extends StatelessWidget {
  final String title;
  final int itemCount;
  final Widget Function(BuildContext, int) itemBuilder;
  final VoidCallback? onSeeAll;

  const HorizontalScrollList({
    super.key,
    required this.title,
    required this.itemCount,
    required this.itemBuilder,
    this.onSeeAll,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4.0),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                      color: const Color(0xFF1E293B),
                    ),
              ),
              if (onSeeAll != null)
                TextButton(
                  onPressed: onSeeAll,
                  style: TextButton.styleFrom(
                    visualDensity: VisualDensity.compact,
                    foregroundColor: const Color(0xFF0A84FF),
                  ),
                  child: const Row(
                    children: [
                      Text('See all', style: TextStyle(fontWeight: FontWeight.w600, fontSize: 13)),
                      SizedBox(width: 4),
                      Icon(Icons.arrow_forward_ios_rounded, size: 10),
                    ],
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 160,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: itemCount,
            padding: const EdgeInsets.symmetric(horizontal: 4.0),
            separatorBuilder: (context, index) => const SizedBox(width: 12),
            itemBuilder: itemBuilder,
          ),
        ),
      ],
    );
  }
}
