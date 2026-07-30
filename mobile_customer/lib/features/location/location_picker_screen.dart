import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geocoding/geocoding.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:mobile_customer/features/location/providers/location_provider.dart';
import 'package:mobile_customer/core/theme/app_theme.dart';

class LocationPickerScreen extends ConsumerStatefulWidget {
  const LocationPickerScreen({super.key});

  @override
  ConsumerState<LocationPickerScreen> createState() =>
      _LocationPickerScreenState();
}

class _LocationPickerScreenState extends ConsumerState<LocationPickerScreen> {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocus = FocusNode();
  GoogleMapController? _mapController;
  LatLng? _selectedLatLng;
  String? _selectedAddress;
  bool _isLoading = true;
  bool _isSearching = false;
  List<_SearchResult> _results = [];

  @override
  void initState() {
    super.initState();
    _initLocation();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocus.dispose();
    _mapController?.dispose();
    super.dispose();
  }

  Future<void> _initLocation() async {
    setState(() { _isLoading = true; });

    final locationState = ref.read(locationProvider);
    final service = ref.read(locationServiceProvider);

    try {
      if (locationState.latitude != null && locationState.longitude != null) {
        final latLng = LatLng(locationState.latitude!, locationState.longitude!);
        _setSelectedLocation(latLng, locationState.location);
      } else {
        final position = await service.fetchCurrentPosition();
        final address = await service.reverseGeocode(position.latitude, position.longitude);
        _setSelectedLocation(LatLng(position.latitude, position.longitude), address);
      }
    } catch (e) {
      const patna = LatLng(25.5941, 85.1376);
      _setSelectedLocation(patna, 'Patna, Bihar');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Could not fetch current location. Using Patna as default.'),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) setState(() { _isLoading = false; });
    }
  }

  Future<void> _useCurrentLocation() async {
    final service = ref.read(locationServiceProvider);
    try {
      final position = await service.fetchCurrentPosition();
      final address = await service.reverseGeocode(position.latitude, position.longitude);
      _setSelectedLocation(LatLng(position.latitude, position.longitude), address);
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not get current location')),
        );
      }
    }
  }

  void _setSelectedLocation(LatLng latLng, String address) {
    setState(() {
      _selectedLatLng = latLng;
      _selectedAddress = address;
    });
    _mapController?.animateCamera(CameraUpdate.newLatLngZoom(latLng, 15));
  }

  Future<void> _handleMapTap(LatLng position) async {
    setState(() {
      _selectedLatLng = position;
      _selectedAddress = null;
    });

    try {
      final service = ref.read(locationServiceProvider);
      final address = await service.reverseGeocode(position.latitude, position.longitude);
      if (mounted) setState(() { _selectedAddress = address; });
    } catch (e) {
      if (mounted) {
        setState(() {
          _selectedAddress = '${position.latitude.toStringAsFixed(4)}, ${position.longitude.toStringAsFixed(4)}';
        });
      }
    }
  }

  Future<void> _search() async {
    final query = _searchController.text.trim();
    if (query.isEmpty) return;

    setState(() { _isSearching = true; _results = []; });

    try {
      final locations = await locationFromAddress(query);
      final results = <_SearchResult>[];
      final service = ref.read(locationServiceProvider);

      for (final location in locations.take(5)) {
        final address = await service.reverseGeocode(location.latitude, location.longitude);
        results.add(_SearchResult(address: address, position: LatLng(location.latitude, location.longitude)));
      }

      if (mounted) setState(() { _results = results; });
    } catch (_) {
      if (mounted) setState(() { _results = []; });
    } finally {
      if (mounted) setState(() { _isSearching = false; });
    }
  }

  void _selectResult(_SearchResult result) {
    _setSelectedLocation(result.position, result.address);
    _searchFocus.unfocus();
    setState(() { _results = []; });
  }

  Future<void> _saveLocation() async {
    final selected = _selectedLatLng;
    final address = _selectedAddress;
    if (selected == null || address == null) return;

    setState(() { _isLoading = true; });

    await ref.read(locationProvider.notifier).setSelectedLocation(
      address,
      selected.latitude,
      selected.longitude,
    );

    if (mounted) {
      setState(() { _isLoading = false; });

      final locationState = ref.read(locationProvider);
      if (!locationState.isServiceable) {
        showDialog(
          context: context,
          builder: (context) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: const Text('Out of Service Area'),
            content: Text(locationState.serviceabilityMessage ?? 'We do not currently serve this area.'),
            actions: [
              TextButton(
                onPressed: () { Navigator.pop(context); Navigator.pop(context); },
                child: const Text('Continue Anyway', style: TextStyle(fontWeight: FontWeight.w600)),
              ),
              FilledButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('Change Location'),
              ),
            ],
          ),
        );
      } else {
        Navigator.of(context).pop();
      }
    }
  }

  Widget _buildWebLocationPanel(BuildContext context, LatLng initialPosition) {
    return Container(
      color: AppColors.background,
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 520),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Card(
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.secondaryLight,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: const Icon(Icons.map_outlined, size: 28, color: AppColors.secondary),
                    ),
                    const SizedBox(height: 16),
                    Text('Map preview on web',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
                    ),
                    const SizedBox(height: 8),
                    Text('Chrome does not use the mobile map widget here. Search for an address or keep the current location and continue.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 16),
                    Text('Current area',
                      style: Theme.of(context).textTheme.labelLarge?.copyWith(color: AppColors.textMuted),
                    ),
                    const SizedBox(height: 4),
                    Text(_selectedAddress ?? 'Tap search or use the default location below',
                      style: Theme.of(context).textTheme.bodyLarge,
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        onPressed: _selectedAddress == null ? null : _saveLocation,
                        child: const Text('Use this location', style: TextStyle(fontWeight: FontWeight.w700)),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text('Default location: ${initialPosition.latitude.toStringAsFixed(4)}, ${initialPosition.longitude.toStringAsFixed(4)}',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final initialPosition = _selectedLatLng ?? const LatLng(25.5941, 85.1376);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Select Location'),
        actions: [
          IconButton(
            icon: const Icon(Icons.my_location_rounded),
            tooltip: 'Refresh location',
            onPressed: _useCurrentLocation,
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                TextField(
                  controller: _searchController,
                  focusNode: _searchFocus,
                  textInputAction: TextInputAction.search,
                  onSubmitted: (_) => _search(),
                  decoration: InputDecoration(
                    prefixIcon: const Icon(Icons.search),
                    suffixIcon: IconButton(
                      icon: const Icon(Icons.send_rounded),
                      onPressed: _search,
                    ),
                    hintText: 'Search city, area, or address',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
                if (_isSearching)
                  const Padding(
                    padding: EdgeInsets.only(top: 8),
                    child: LinearProgressIndicator(),
                  ),
                if (_results.isNotEmpty)
                  Container(
                    margin: const EdgeInsets.only(top: 12),
                    decoration: BoxDecoration(
                      color: AppColors.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.borderLight),
                    ),
                    child: ListView.separated(
                      shrinkWrap: true,
                      itemCount: _results.length,
                      separatorBuilder: (context, index) => const Divider(height: 1),
                      itemBuilder: (context, index) {
                        final result = _results[index];
                        return ListTile(
                          leading: const Icon(Icons.location_on_outlined),
                          title: Text(result.address),
                          onTap: () => _selectResult(result),
                        );
                      },
                    ),
                  ),
              ],
            ),
          ),
          Expanded(
            child: kIsWeb
                ? _buildWebLocationPanel(context, initialPosition)
                : Stack(
                    children: [
                      GoogleMap(
                        initialCameraPosition: CameraPosition(target: initialPosition, zoom: 15),
                        onMapCreated: (controller) => _mapController = controller,
                        myLocationEnabled: true,
                        onTap: _handleMapTap,
                        markers: _selectedLatLng == null
                            ? {}
                            : {
                                Marker(
                                  markerId: const MarkerId('selected'),
                                  position: _selectedLatLng!,
                                  draggable: true,
                                  onDragEnd: _handleMapTap,
                                ),
                              },
                      ),
                      if (_isLoading)
                        const Align(
                          alignment: Alignment.center,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        ),
                      Positioned(
                        right: 16,
                        bottom: 80,
                        child: FloatingActionButton.small(
                          heroTag: 'current_location',
                          onPressed: _useCurrentLocation,
                          backgroundColor: AppColors.surface,
                          child: const Icon(Icons.my_location, color: AppColors.secondary),
                        ),
                      ),
                    ],
                  ),
          ),
          Container(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
            decoration: const BoxDecoration(
              color: AppColors.surface,
              border: Border(top: BorderSide(color: AppColors.borderLight)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.location_on_rounded, color: AppColors.secondary, size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _selectedAddress ?? 'Tap on the map to drop a pin',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: FilledButton(
                    onPressed: _selectedAddress == null ? null : _saveLocation,
                    child: const Text('Use this location', style: TextStyle(fontWeight: FontWeight.w700)),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SearchResult {
  final String address;
  final LatLng position;

  const _SearchResult({
    required this.address,
    required this.position,
  });
}
