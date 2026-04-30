import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geocoding/geocoding.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:mobile_customer/features/location/providers/location_provider.dart';

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
    setState(() {
      _isLoading = true;
    });

    final locationState = ref.read(locationProvider);
    final service = ref.read(locationServiceProvider);

    try {
      if (locationState.latitude != null && locationState.longitude != null) {
        final latLng = LatLng(locationState.latitude!, locationState.longitude!);
        _setSelectedLocation(latLng, locationState.location);
      } else {
        final position = await service.fetchCurrentPosition();
        final address = await service.reverseGeocode(
          position.latitude,
          position.longitude,
        );
        _setSelectedLocation(LatLng(position.latitude, position.longitude), address);
      }
    } catch (_) {
      // ignore, will show default
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _setSelectedLocation(LatLng latLng, String address) {
    setState(() {
      _selectedLatLng = latLng;
      _selectedAddress = address;
    });
    _mapController?.animateCamera(
      CameraUpdate.newLatLngZoom(latLng, 15),
    );
  }

  Future<void> _handleMapTap(LatLng position) async {
    setState(() {
      _selectedLatLng = position;
      _selectedAddress = null;
    });

    final service = ref.read(locationServiceProvider);
    final address = await service.reverseGeocode(
      position.latitude,
      position.longitude,
    );
    if (mounted) {
      setState(() {
        _selectedAddress = address;
      });
    }
  }

  Future<void> _search() async {
    final query = _searchController.text.trim();
    if (query.isEmpty) return;

    setState(() {
      _isSearching = true;
      _results = [];
    });

    try {
      final locations = await locationFromAddress(query);
      final results = <_SearchResult>[];
      final service = ref.read(locationServiceProvider);

      for (final location in locations.take(5)) {
        final address = await service.reverseGeocode(
          location.latitude,
          location.longitude,
        );
        results.add(
          _SearchResult(
            address: address,
            position: LatLng(location.latitude, location.longitude),
          ),
        );
      }

      if (mounted) {
        setState(() {
          _results = results;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _results = [];
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSearching = false;
        });
      }
    }
  }

  void _selectResult(_SearchResult result) {
    _setSelectedLocation(result.position, result.address);
    _searchFocus.unfocus();
    setState(() {
      _results = [];
    });
  }

  void _saveLocation() {
    final selected = _selectedLatLng;
    final address = _selectedAddress;
    if (selected == null || address == null) return;

    ref.read(locationProvider.notifier).setSelectedLocation(
          address: address,
          latitude: selected.latitude,
          longitude: selected.longitude,
        );

    if (mounted) {
      Navigator.of(context).pop();
    }
  }

  Widget _buildWebLocationPanel(BuildContext context, LatLng initialPosition) {
    return Container(
      color: const Color(0xFFF8FAFC),
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
                    const Icon(Icons.map_outlined, size: 40, color: Color(0xFF0A84FF)),
                    const SizedBox(height: 12),
                    Text(
                      'Map preview on web',
                      style: Theme.of(context).textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Chrome does not use the mobile map widget here. Search for an address or keep the current location and continue.',
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'Current area',
                      style: Theme.of(context).textTheme.labelMedium?.copyWith(
                            color: Colors.grey[700],
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _selectedAddress ?? 'Tap search or use the default location below',
                      style: Theme.of(context).textTheme.bodyLarge,
                    ),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton(
                        onPressed: _selectedAddress == null ? null : _saveLocation,
                        child: const Text('Use this location'),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Default location: ${initialPosition.latitude.toStringAsFixed(4)}, ${initialPosition.longitude.toStringAsFixed(4)}',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.grey[600],
                          ),
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
    final initialPosition = _selectedLatLng ?? const LatLng(20.2961, 85.8245);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Select Location'),
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
                      icon: const Icon(Icons.send),
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
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
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
                        initialCameraPosition: CameraPosition(
                          target: initialPosition,
                          zoom: 15,
                        ),
                        onMapCreated: (controller) => _mapController = controller,
                        myLocationButtonEnabled: true,
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
                          child: CircularProgressIndicator(),
                        ),
                    ],
                  ),
          ),
          Container(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(top: BorderSide(color: Color(0xFFE2E8F0))),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _selectedAddress ?? 'Tap on the map to drop a pin',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: FilledButton(
                    onPressed: _selectedAddress == null ? null : _saveLocation,
                    child: const Padding(
                      padding: EdgeInsets.symmetric(vertical: 14),
                      child: Text('Use this location'),
                    ),
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
