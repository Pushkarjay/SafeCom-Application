import 'package:flutter/material.dart';
import 'package:mobile_customer/data/models/pricing_contracts.dart';
import 'package:mobile_customer/core/theme/app_theme.dart';

/// A recursive bottom sheet selector for deeply nested clubbed product options.
///
/// Database pattern: Product → Option → Sub → Sub Sub → … → Leaf (product details)
/// - Branch node: has children (show options, drill deeper on tap)
/// - Leaf node: has productId/price (selectable product)
///
/// Supports both single-select (radio) and multi-select (checkbox) modes.
class ClubbedProductSelector extends StatefulWidget {
  final String title;
  final List<ClubbedOption> options;
  final Function(ClubbedOption selectedLeaf)? onLeafSelected;
  final bool multiSelect;
  final Set<String>? preSelectedKeys;
  final Function(List<ClubbedOption> selected)? onMultiSelect;

  const ClubbedProductSelector({
    super.key,
    required this.title,
    required this.options,
    this.onLeafSelected,
    this.multiSelect = false,
    this.preSelectedKeys,
    this.onMultiSelect,
  });

  /// Show the selector as a modal bottom sheet (single-select mode).
  /// Returns the selected LEAF option, or null if dismissed.
  static Future<ClubbedOption?> show(
    BuildContext context, {
    required String title,
    required List<ClubbedOption> options,
  }) async {
    ClubbedOption? result;
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => ClubbedProductSelector(
        title: title,
        options: options,
        onLeafSelected: (leaf) {
          result = leaf;
          Navigator.of(ctx).pop();
        },
      ),
    );
    return result;
  }

  /// Show the selector as a modal bottom sheet (multi-select mode).
  /// Returns list of selected leaf options, or null if dismissed.
  static Future<List<ClubbedOption>?> showMulti(
    BuildContext context, {
    required String title,
    required List<ClubbedOption> options,
    Set<String>? preSelectedKeys,
  }) async {
    List<ClubbedOption>? result;
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => ClubbedProductSelector(
        title: title,
        options: options,
        multiSelect: true,
        preSelectedKeys: preSelectedKeys,
        onMultiSelect: (selected) {
          result = selected;
          Navigator.of(ctx).pop();
        },
      ),
    );
    return result;
  }

  @override
  State<ClubbedProductSelector> createState() => _ClubbedProductSelectorState();
}

class _ClubbedProductSelectorState extends State<ClubbedProductSelector> {
  late final List<_NavLevel> _navStack;
  ClubbedOption? _selectedLeaf;
  Set<String> _selectedKeys = {};

  @override
  void initState() {
    super.initState();
    _navStack = [
      _NavLevel(label: widget.title, options: widget.options),
    ];
    if (widget.multiSelect && widget.preSelectedKeys != null) {
      _selectedKeys = Set<String>.from(widget.preSelectedKeys!);
    }
  }

  _NavLevel get _current => _navStack.last;

  void _drillInto(ClubbedOption branch) {
    setState(() {
      if (!widget.multiSelect) _selectedLeaf = null;
      _navStack.add(_NavLevel(
        label: branch.productName.isNotEmpty ? branch.productName : branch.optionKey,
        options: branch.children,
      ));
    });
  }

  void _goBack() {
    if (_navStack.length > 1) {
      setState(() {
        if (!widget.multiSelect) _selectedLeaf = null;
        _navStack.removeLast();
      });
    }
  }

  void _jumpTo(int index) {
    if (index < _navStack.length - 1) {
      setState(() {
        if (!widget.multiSelect) _selectedLeaf = null;
        _navStack.removeRange(index + 1, _navStack.length);
      });
    }
  }

  void _toggleMultiSelection(ClubbedOption leaf) {
    if (!leaf.available) return;
    setState(() {
      if (_selectedKeys.contains(leaf.optionKey)) {
        _selectedKeys.remove(leaf.optionKey);
      } else {
        _selectedKeys.add(leaf.optionKey);
      }
    });
  }

  void _confirmMulti() {
    if (_selectedKeys.isEmpty) return;
    final allLeaves = _collectAllLeaves(widget.options);
    final selected = allLeaves.where((l) => _selectedKeys.contains(l.optionKey)).toList();
    widget.onMultiSelect?.call(selected);
  }

  List<ClubbedOption> _collectAllLeaves(List<ClubbedOption> options) {
    final result = <ClubbedOption>[];
    for (final opt in options) {
      if (opt.isLeaf) {
        result.add(opt);
      } else {
        result.addAll(_collectAllLeaves(opt.children));
      }
    }
    return result;
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.68,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          // ── Drag handle ──
          Container(
            margin: const EdgeInsets.symmetric(vertical: 12),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),

          // ── Breadcrumb trail ──
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: SizedBox(
              width: double.infinity,
              height: 32,
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    for (int i = 0; i < _navStack.length; i++) ...[
                      if (i > 0)
                        const Padding(
                          padding: EdgeInsets.symmetric(horizontal: 4),
                          child: Icon(Icons.chevron_right, size: 16, color: AppColors.textMuted),
                        ),
                      GestureDetector(
                        onTap: () => _jumpTo(i),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: i == _navStack.length - 1
                                ? AppColors.primary.withValues(alpha: 0.1)
                                : AppColors.surfaceVariant,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            _navStack[i].label,
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: i == _navStack.length - 1 ? FontWeight.w700 : FontWeight.w500,
                              color: i == _navStack.length - 1
                                  ? AppColors.primary
                                  : AppColors.textSecondary,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
          const Divider(height: 1),

          // ── Header ──
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
            child: Row(
              children: [
                if (_navStack.length > 1)
                  GestureDetector(
                    onTap: _goBack,
                    child: Container(
                      margin: const EdgeInsets.only(right: 12),
                      padding: const EdgeInsets.all(6),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceVariant,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.arrow_back_ios_new, size: 16, color: AppColors.textSecondary),
                    ),
                  ),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _current.label,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        widget.multiSelect
                            ? 'Select one or more options'
                            : _current.hasOnlyLeaves
                                ? 'Select a product option'
                                : 'Choose a category to drill deeper',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textMuted),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // ── Options list ──
          Expanded(
            child: _current.options.isEmpty
                ? const Center(
                    child: Text('No options available', style: TextStyle(color: AppColors.textMuted)),
                  )
                : ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    itemCount: _current.options.length,
                    itemBuilder: (context, index) {
                      final option = _current.options[index];
                      if (option.isLeaf) {
                        return _buildLeafTile(option);
                      } else {
                        return _buildBranchTile(option);
                      }
                    },
                  ),
          ),

          // ── Confirm button ──
          if (widget.multiSelect)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: AppColors.border)),
              ),
              child: SafeArea(
                child: FilledButton(
                  onPressed: _selectedKeys.isEmpty ? null : _confirmMulti,
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    minimumSize: const Size(double.infinity, 52),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: Text(
                    _selectedKeys.isEmpty
                        ? 'Select at least one option'
                        : 'Confirm (${_selectedKeys.length} selected)',
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                  ),
                ),
              ),
            )
          else if (_selectedLeaf != null)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: const BoxDecoration(
                color: Colors.white,
                border: Border(top: BorderSide(color: AppColors.border)),
              ),
              child: SafeArea(
                child: FilledButton(
                  onPressed: () => widget.onLeafSelected?.call(_selectedLeaf!),
                  style: FilledButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    minimumSize: const Size(double.infinity, 52),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  child: Text(
                    'Confirm: ${_selectedLeaf!.productName} — ₹${_selectedLeaf!.price.toStringAsFixed(0)}',
                    style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  /// Tile for a LEAF option — selectable product with radio/checkbox indicator
  Widget _buildLeafTile(ClubbedOption option) {
    final isSelected = widget.multiSelect
        ? _selectedKeys.contains(option.optionKey)
        : _selectedLeaf?.optionKey == option.optionKey;
    return GestureDetector(
      onTap: () {
        if (!option.available) return;
        if (widget.multiSelect) {
          _toggleMultiSelection(option);
        } else {
          setState(() => _selectedLeaf = option);
        }
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: !option.available
              ? const Color(0xFFF8F8F8)
              : isSelected
                  ? AppColors.secondaryLight
                  : Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            widget.multiSelect
                ? Container(
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      color: isSelected ? AppColors.primary : Colors.transparent,
                      borderRadius: BorderRadius.circular(4),
                      border: Border.all(
                        color: isSelected ? AppColors.primary : AppColors.border,
                        width: 2,
                      ),
                    ),
                    child: isSelected
                        ? const Icon(Icons.check, size: 18, color: Colors.white)
                        : null,
                  )
                : Container(
                    width: 24,
                    height: 24,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: isSelected ? AppColors.primary : AppColors.border,
                        width: isSelected ? 7 : 2,
                      ),
                    ),
                  ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    option.productName.isNotEmpty ? option.productName : option.optionKey,
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 15,
                      color: option.available ? AppColors.primary : AppColors.textMuted,
                    ),
                  ),
                  if (!option.available)
                    const Text(
                      'Currently unavailable',
                      style: TextStyle(fontSize: 12, color: AppColors.error),
                    ),
                  if (option.rigid)
                    const Text(
                      'Fixed quantity (cannot change)',
                      style: TextStyle(fontSize: 11, color: AppColors.textMuted, fontStyle: FontStyle.italic),
                    ),
                ],
              ),
            ),
            Text(
              '₹${option.price.toStringAsFixed(0)}',
              style: TextStyle(
                fontWeight: FontWeight.w800,
                fontSize: 16,
                color: option.available ? AppColors.primary : AppColors.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Tile for a BRANCH option — drills deeper on tap
  Widget _buildBranchTile(ClubbedOption option) {
    return GestureDetector(
      onTap: () => _drillInto(option),
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: AppColors.secondaryLight,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.folder_outlined, color: AppColors.primary, size: 20),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    option.productName.isNotEmpty ? option.productName : option.optionKey,
                    style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 15, color: AppColors.primary),
                  ),
                  Text(
                    '${option.children.length} option${option.children.length != 1 ? "s" : ""} available',
                    style: const TextStyle(fontSize: 12, color: AppColors.textSecondary),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: AppColors.textMuted),
          ],
        ),
      ),
    );
  }
}

/// Internal: represents one level in the navigation stack
class _NavLevel {
  final String label;
  final List<ClubbedOption> options;

  _NavLevel({required this.label, required this.options});

  bool get hasOnlyLeaves => options.every((o) => o.isLeaf);
}
