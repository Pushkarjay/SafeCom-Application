import 'package:flutter/material.dart';
import 'package:mobile_customer/data/models/pricing_contracts.dart';
import 'package:mobile_customer/core/theme/app_theme.dart';

/// A reusable bottom-sheet popup that lets users drill-down through
/// a recursive [ClubbedOption] tree and pick a single leaf product.
///
/// Usage:
/// ```dart
/// final selected = await showNestedSelectionPopup(context, options, 'Select Camera');
/// ```
Future<ClubbedOption?> showNestedSelectionPopup(
  BuildContext context,
  List<ClubbedOption> options,
  String title,
) async {
  return showModalBottomSheet<ClubbedOption>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) => _NestedSelectionSheet(
      options: options,
      title: title,
    ),
  );
}

class _NestedSelectionSheet extends StatefulWidget {
  final List<ClubbedOption> options;
  final String title;

  const _NestedSelectionSheet({
    required this.options,
    required this.title,
  });

  @override
  State<_NestedSelectionSheet> createState() => _NestedSelectionSheetState();
}

class _NestedSelectionSheetState extends State<_NestedSelectionSheet> {
  /// Stack of (title, options) representing the current breadcrumb path.
  late List<_BreadcrumbEntry> _breadcrumbs;

  @override
  void initState() {
    super.initState();
    _breadcrumbs = [
      _BreadcrumbEntry(title: widget.title, options: widget.options),
    ];
  }

  List<ClubbedOption> get _currentOptions => _breadcrumbs.last.options;
  String get _currentTitle => _breadcrumbs.last.title;
  bool get _canGoBack => _breadcrumbs.length > 1;

  void _navigateInto(ClubbedOption branch) {
    setState(() {
      _breadcrumbs.add(
        _BreadcrumbEntry(
          title: branch.productName.isNotEmpty
              ? branch.productName
              : branch.optionKey,
          options: branch.children,
        ),
      );
    });
  }

  void _goBack() {
    if (_canGoBack) {
      setState(() {
        _breadcrumbs.removeLast();
      });
    }
  }

  void _selectLeaf(ClubbedOption leaf) {
    Navigator.of(context).pop(leaf);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.7,
      ),
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // ── Handle bar ──
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          // ── Header with back + title ──
          Padding(
            padding: const EdgeInsets.fromLTRB(8, 8, 8, 4),
            child: Row(
              children: [
                if (_canGoBack)
                  IconButton(
                    icon: const Icon(Icons.arrow_back_ios_new, size: 18),
                    onPressed: _goBack,
                  ),
                Expanded(
                  child: Text(
                    _currentTitle,
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                    textAlign: _canGoBack ? TextAlign.left : TextAlign.center,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close, size: 20),
                  onPressed: () => Navigator.of(context).pop(null),
                ),
              ],
            ),
          ),
          // ── Breadcrumb trail ──
          if (_breadcrumbs.length > 1)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    for (int i = 0; i < _breadcrumbs.length; i++) ...[
                      if (i > 0)
                        const Icon(Icons.chevron_right,
                            size: 16, color: Colors.grey),
                      GestureDetector(
                        onTap: i < _breadcrumbs.length - 1
                            ? () {
                                setState(() {
                                  _breadcrumbs.removeRange(
                                      i + 1, _breadcrumbs.length);
                                });
                              }
                            : null,
                        child: Text(
                          _breadcrumbs[i].title,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: i < _breadcrumbs.length - 1
                                ? AppColors.primary
                                : Colors.grey.shade700,
                            fontWeight: i < _breadcrumbs.length - 1
                                ? FontWeight.w500
                                : FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          const Divider(height: 16),
          // ── Option list ──
          Flexible(
            child: _currentOptions.isEmpty
                ? const Padding(
                    padding: EdgeInsets.all(32),
                    child: Text('No options available.',
                        style: TextStyle(color: Colors.grey)),
                  )
                : ListView.separated(
                    shrinkWrap: true,
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                    itemCount: _currentOptions.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 8),
                    itemBuilder: (context, index) {
                      final opt = _currentOptions[index];
                      return _OptionTile(
                        option: opt,
                        onTap: () {
                          if (opt.isLeaf) {
                            _selectLeaf(opt);
                          } else {
                            _navigateInto(opt);
                          }
                        },
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }
}

class _OptionTile extends StatelessWidget {
  final ClubbedOption option;
  final VoidCallback onTap;

  const _OptionTile({required this.option, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final label =
        option.productName.isNotEmpty ? option.productName : option.optionKey;
    final isLeaf = option.isLeaf;

    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: onTap,
      child: Ink(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
        decoration: BoxDecoration(
          color: isLeaf ? Colors.white : AppColors.background,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color:
                isLeaf ? AppColors.border : const Color(0xFFDDD6FE),
            width: 1,
          ),
          boxShadow: const [
            BoxShadow(
              color: Color(0x08000000),
              blurRadius: 8,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            // Icon
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: isLeaf
                    ? AppColors.secondaryLight
                    : const Color(0xFFF3E8FF),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                isLeaf ? Icons.inventory_2_outlined : Icons.folder_outlined,
                size: 18,
                color: isLeaf
                    ? AppColors.primary
                    : const Color(0xFF8B5CF6),
              ),
            ),
            const SizedBox(width: 12),
            // Name + details
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: theme.textTheme.titleSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  if (isLeaf && option.price > 0)
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Text(
                        'Rs ${option.price.toStringAsFixed(0)}',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: const Color(0xFF059669),
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  if (!isLeaf)
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Text(
                        '${_countLeaves(option)} options inside →',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: Colors.grey.shade500,
                          fontSize: 11,
                        ),
                      ),
                    ),
                ],
              ),
            ),
            // Trailing icon
            Icon(
              isLeaf ? Icons.check_circle_outline : Icons.chevron_right,
              color: isLeaf
                  ? const Color(0xFF059669)
                  : const Color(0xFF8B5CF6),
              size: 20,
            ),
          ],
        ),
      ),
    );
  }

  int _countLeaves(ClubbedOption node) {
    if (node.isLeaf) return 1;
    int count = 0;
    for (final child in node.children) {
      count += _countLeaves(child);
    }
    return count;
  }
}

class _BreadcrumbEntry {
  final String title;
  final List<ClubbedOption> options;

  const _BreadcrumbEntry({required this.title, required this.options});
}
