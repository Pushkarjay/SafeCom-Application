import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:mobile_employee/data/models/job_models.dart';

class MapScreen extends StatefulWidget {
  final AssignedJob? job;
  final List<AssignedJob>? jobs;

  const MapScreen({
    super.key,
    this.job,
    this.jobs,
  });

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  Position? _currentPosition;
  bool _isLoading = true;
  String? _error;
  bool _isTracking = false;

  @override
  void initState() {
    super.initState();
    _initLocation();
  }

  Future<void> _initLocation() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // Check location services
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() {
          _error = 'Location services are disabled. Please enable them in settings.';
          _isLoading = false;
        });
        return;
      }

      // Check permissions
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          setState(() {
            _error = 'Location permission denied.';
            _isLoading = false;
          });
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        setState(() {
          _error = 'Location permissions are permanently denied. Please enable in settings.';
          _isLoading = false;
        });
        return;
      }

      // Get current position
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      ).timeout(
        const Duration(seconds: 10),
        onTimeout: () => throw Exception('Location timeout'),
      );

      setState(() {
        _currentPosition = position;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = 'Failed to get location: ${e.toString()}';
        _isLoading = false;
      });
    }
  }

  Future<void> _startTracking() async {
    setState(() => _isTracking = true);

    // Listen to location updates
    Geolocator.getPositionStream(
      locationSettings: const LocationSettings(
        accuracy: LocationAccuracy.high,
        distanceFilter: 10, // meters
      ),
    ).listen((Position position) {
      if (mounted) {
        setState(() {
          _currentPosition = position;
        });
      }
    });
  }

  void _stopTracking() {
    setState(() => _isTracking = false);
  }

  double _calculateDistance(double lat, double lng) {
    if (_currentPosition == null) return 0;
    return Geolocator.distanceBetween(
      _currentPosition!.latitude,
      _currentPosition!.longitude,
      lat,
      lng,
    );
  }

  String _formatDistance(double meters) {
    if (meters < 1000) {
      return '${meters.toStringAsFixed(0)} m';
    } else {
      return '${(meters / 1000).toStringAsFixed(1)} km';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.job != null ? 'Job Location' : 'My Location'),
        elevation: 0,
        actions: [
          IconButton(
            onPressed: _isTracking ? _stopTracking : _startTracking,
            icon: Icon(_isTracking ? Icons.location_off : Icons.location_searching),
            tooltip: _isTracking ? 'Stop tracking' : 'Start tracking',
          ),
          IconButton(
            onPressed: _initLocation,
            icon: const Icon(Icons.refresh),
            tooltip: 'Refresh location',
          ),
        ],
      ),
      body: _isLoading ? _buildLoading() : _error != null ? _buildError() : _buildMapContent(),
    );
  }

  Widget _buildLoading() {
    return const Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(),
          SizedBox(height: 16),
          Text('Getting your location...'),
        ],
      ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.location_off, size: 64, color: Colors.red.shade300),
            const SizedBox(height: 16),
            Text(
              'Location Error',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 8),
            Text(
              _error!,
              textAlign: TextAlign.center,
              style: TextStyle(color: Colors.grey.shade600),
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: _initLocation,
              icon: const Icon(Icons.refresh),
              label: const Text('Try Again'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMapContent() {
    return Column(
      children: [
        // Current location card
        Container(
          padding: const EdgeInsets.all(16),
          color: Colors.blue.shade50,
          child: Row(
            children: [
              Icon(Icons.my_location, color: Colors.blue.shade700, size: 32),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Current Location',
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    const SizedBox(height: 4),
                    if (_currentPosition != null)
                      Text(
                        '${_currentPosition!.latitude.toStringAsFixed(6)}, ${_currentPosition!.longitude.toStringAsFixed(6)}',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                              fontFamily: 'monospace',
                              color: Colors.grey.shade600,
                            ),
                      ),
                  ],
                ),
              ),
              if (_isTracking)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.green,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.circle, color: Colors.white, size: 8),
                      SizedBox(width: 4),
                      Text(
                        'LIVE',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ),

        // Job location or job list
        Expanded(
          child: widget.job != null
              ? _buildSingleJobView()
              : widget.jobs != null
                  ? _buildJobListView()
                  : _buildNoJobView(),
        ),
      ],
    );
  }

  Widget _buildSingleJobView() {
    final job = widget.job!;
    final distance = _calculateDistance(job.latitude, job.longitude);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Job location card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.location_on, color: Colors.red.shade700),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'Job Location',
                          style: Theme.of(context).textTheme.titleMedium,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  _buildInfoRow('Address', job.location),
                  _buildInfoRow(
                    'Coordinates',
                    '${job.latitude.toStringAsFixed(4)}, ${job.longitude.toStringAsFixed(4)}',
                  ),
                  _buildInfoRow('Distance', _formatDistance(distance)),
                  _buildInfoRow('Service', job.serviceType),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Directions card
          Card(
            color: Colors.green.shade50,
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.directions, color: Colors.green.shade700),
                      const SizedBox(width: 8),
                      Text(
                        'Directions',
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Distance: ${_formatDistance(distance)}',
                    style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Estimated time: ${_calculateTime(distance)}',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      onPressed: () => _openMapsApp(job.latitude, job.longitude),
                      icon: const Icon(Icons.directions_car),
                      label: const Text('Open in Maps'),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildJobListView() {
    final jobs = widget.jobs!;
    if (jobs.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.location_off, size: 64, color: Colors.grey.shade300),
            const SizedBox(height: 16),
            Text(
              'No jobs to show',
              style: Theme.of(context).textTheme.titleMedium,
            ),
          ],
        ),
      );
    }

    // Sort jobs by distance
    final sortedJobs = List<AssignedJob>.from(jobs)
      ..sort((a, b) {
        final distA = _calculateDistance(a.latitude, a.longitude);
        final distB = _calculateDistance(b.latitude, b.longitude);
        return distA.compareTo(distB);
      });

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: sortedJobs.length,
      itemBuilder: (context, index) {
        final job = sortedJobs[index];
        final distance = _calculateDistance(job.latitude, job.longitude);

        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            leading: CircleAvatar(
              backgroundColor: Colors.blue.shade100,
              child: const Icon(Icons.location_on, color: Colors.blue),
            ),
            title: Text(job.customerName),
            subtitle: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(job.serviceType),
                Text(
                  _formatDistance(distance),
                  style: TextStyle(
                    color: Colors.grey.shade600,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
            trailing: IconButton(
              icon: const Icon(Icons.directions),
              onPressed: () => _openMapsApp(job.latitude, job.longitude),
            ),
            isThreeLine: true,
          ),
        );
      },
    );
  }

  Widget _buildNoJobView() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.map, size: 64, color: Colors.grey.shade300),
          const SizedBox(height: 16),
          Text(
            'No job selected',
            style: Theme.of(context).textTheme.titleMedium,
          ),
          const SizedBox(height: 8),
          Text(
            'Select a job from the jobs list to view its location',
            style: TextStyle(color: Colors.grey.shade600),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: TextStyle(
                color: Colors.grey.shade600,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }

  String _calculateTime(double meters) {
    // Assume walking speed of 5 km/h
    final hours = meters / 5000;
    final minutes = (hours * 60).round();
    if (minutes < 1) return '< 1 min';
    if (minutes < 60) return '$minutes min';
    final hrs = minutes ~/ 60;
    final mins = minutes % 60;
    return '$hrs hr ${mins > 0 ? "$mins min" : ""}';
  }

  void _openMapsApp(double lat, double lng) {
    // In a real app, this would use url_launcher to open Google Maps
    // For now, show a snackbar
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Opening maps to: $lat, $lng'),
        duration: const Duration(seconds: 2),
      ),
    );
  }
}