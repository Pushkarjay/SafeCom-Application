import 'dart:io';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

class PhotoGalleryScreen extends StatefulWidget {
  final String jobId;
  final String customerName;
  final List<String>? initialBeforePhotos;
  final List<String>? initialAfterPhotos;

  const PhotoGalleryScreen({
    super.key,
    required this.jobId,
    required this.customerName,
    this.initialBeforePhotos,
    this.initialAfterPhotos,
  });

  @override
  State<PhotoGalleryScreen> createState() => _PhotoGalleryScreenState();
}

class _PhotoGalleryScreenState extends State<PhotoGalleryScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final ImagePicker _picker = ImagePicker();
  
  List<XFile> _beforePhotos = [];
  List<XFile> _afterPhotos = [];
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    
    // Initialize with existing photos if provided
    if (widget.initialBeforePhotos != null) {
      _beforePhotos = widget.initialBeforePhotos!
          .map((path) => XFile(path))
          .toList();
    }
    if (widget.initialAfterPhotos != null) {
      _afterPhotos = widget.initialAfterPhotos!
          .map((path) => XFile(path))
          .toList();
    }
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _capturePhoto(bool isBefore) async {
    setState(() => _isLoading = true);

    try {
      final XFile? photo = await _picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 85,
        maxWidth: 1920,
        maxHeight: 1080,
      );

      if (photo != null) {
        setState(() {
          if (isBefore) {
            _beforePhotos.add(photo);
          } else {
            _afterPhotos.add(photo);
          }
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to capture photo: $e')),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _removePhoto(bool isBefore, int index) {
    setState(() {
      if (isBefore) {
        _beforePhotos.removeAt(index);
      } else {
        _afterPhotos.removeAt(index);
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Job #${widget.jobId} Photos'),
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          tabs: [
            Tab(
              icon: const Icon(Icons.hourglass_empty),
              text: 'Before (${_beforePhotos.length})',
            ),
            Tab(
              icon: const Icon(Icons.check_circle),
              text: 'After (${_afterPhotos.length})',
            ),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildPhotoTab(true),
          _buildPhotoTab(false),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _isLoading
            ? null
            : () {
                final isBefore = _tabController.index == 0;
                _capturePhoto(isBefore);
              },
        icon: _isLoading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2),
              )
            : const Icon(Icons.add_a_photo),
        label: Text(_tabController.index == 0 ? 'Add Before Photo' : 'Add After Photo'),
      ),
    );
  }

  Widget _buildPhotoTab(bool isBefore) {
    final photos = isBefore ? _beforePhotos : _afterPhotos;

    if (photos.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isBefore ? Icons.photo_camera_front : Icons.photo_camera,
              size: 64,
              color: Colors.grey.shade300,
            ),
            const SizedBox(height: 16),
            Text(
              'No ${isBefore ? "Before" : "After"} Photos',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(
              'Tap the + button to capture photos',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.grey.shade600,
                  ),
            ),
          ],
        ),
      );
    }

    return GridView.builder(
      padding: const EdgeInsets.all(16),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1,
      ),
      itemCount: photos.length,
      itemBuilder: (context, index) {
        return _buildPhotoCard(isBefore, index);
      },
    );
  }

  Widget _buildPhotoCard(bool isBefore, int index) {
    final photos = isBefore ? _beforePhotos : _afterPhotos;
    final photo = photos[index];

    return GestureDetector(
      onTap: () => _viewPhoto(photo.path, isBefore, index),
      child: Stack(
        fit: StackFit.expand,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Image.file(
              File(photo.path),
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) {
                return Container(
                  color: Colors.grey.shade200,
                  child: const Icon(Icons.broken_image, size: 48),
                );
              },
            ),
          ),
          Positioned(
            top: 8,
            right: 8,
            child: Material(
              color: Colors.black54,
              borderRadius: BorderRadius.circular(20),
              child: InkWell(
                onTap: () => _showDeleteDialog(isBefore, index),
                borderRadius: BorderRadius.circular(20),
                child: const Padding(
                  padding: EdgeInsets.all(6),
                  child: Icon(Icons.delete, color: Colors.white, size: 20),
                ),
              ),
            ),
          ),
          Positioned(
            bottom: 8,
            left: 8,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: isBefore ? Colors.orange : Colors.green,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                '#${index + 1}',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _viewPhoto(String path, bool isBefore, int index) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => _PhotoViewScreen(
          photoPath: path,
          isBefore: isBefore,
          index: index,
          totalPhotos: isBefore ? _beforePhotos.length : _afterPhotos.length,
        ),
      ),
    );
  }

  void _showDeleteDialog(bool isBefore, int index) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Photo'),
        content: const Text('Are you sure you want to delete this photo?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.pop(context);
              _removePhoto(isBefore, index);
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  Map<String, dynamic> getPhotoData() {
    return {
      'jobId': widget.jobId,
      'beforePhotos': _beforePhotos.map((p) => p.path).toList(),
      'afterPhotos': _afterPhotos.map((p) => p.path).toList(),
    };
  }
}

class _PhotoViewScreen extends StatelessWidget {
  final String photoPath;
  final bool isBefore;
  final int index;
  final int totalPhotos;

  const _PhotoViewScreen({
    required this.photoPath,
    required this.isBefore,
    required this.index,
    required this.totalPhotos,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: Text('${isBefore ? "Before" : "After"} Photo ${index + 1} of $totalPhotos'),
      ),
      body: Center(
        child: InteractiveViewer(
          child: Image.file(
            File(photoPath),
            fit: BoxFit.contain,
            errorBuilder: (context, error, stackTrace) {
              return const Icon(Icons.broken_image, size: 64, color: Colors.white);
            },
          ),
        ),
      ),
    );
  }
}