import 'dart:io';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';

class PhotoCaptureScreen extends StatefulWidget {
  final String jobId;
  final String customerName;
  final bool isBeforePhoto;

  const PhotoCaptureScreen({
    super.key,
    required this.jobId,
    required this.customerName,
    required this.isBeforePhoto,
  });

  @override
  State<PhotoCaptureScreen> createState() => _PhotoCaptureScreenState();
}

class _PhotoCaptureScreenState extends State<PhotoCaptureScreen> {
  final ImagePicker _picker = ImagePicker();
  final List<XFile> _capturedPhotos = [];
  bool _isLoading = false;
  String? _error;

  Future<void> _takePhoto() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final XFile? photo = await _picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 85,
        maxWidth: 1920,
        maxHeight: 1080,
      );

      if (photo != null) {
        setState(() {
          _capturedPhotos.add(photo);
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Failed to capture photo: ${e.toString()}';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _pickFromGallery() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final List<XFile> photos = await _picker.pickMultiImage(
        imageQuality: 85,
        maxWidth: 1920,
        maxHeight: 1080,
      );

      if (photos.isNotEmpty) {
        setState(() {
          _capturedPhotos.addAll(photos);
        });
      }
    } catch (e) {
      setState(() {
        _error = 'Failed to pick photos: ${e.toString()}';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _removePhoto(int index) {
    setState(() {
      _capturedPhotos.removeAt(index);
    });
  }

  void _clearAll() {
    setState(() {
      _capturedPhotos.clear();
    });
  }

  @override
  Widget build(BuildContext context) {
    final photoType = widget.isBeforePhoto ? 'Before' : 'After';
    final title = '$photoType Photos - Job #${widget.jobId}';

    return Scaffold(
      appBar: AppBar(
        title: Text(title),
        elevation: 0,
        actions: [
          if (_capturedPhotos.isNotEmpty)
            IconButton(
              onPressed: _clearAll,
              icon: const Icon(Icons.delete_outline),
              tooltip: 'Clear all',
            ),
        ],
      ),
      body: _capturedPhotos.isEmpty ? _buildEmptyState(context) : _buildPhotoGrid(context),
      bottomNavigationBar: _buildBottomBar(context),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              widget.isBeforePhoto ? Icons.photo_camera_front : Icons.photo_camera,
              size: 80,
              color: Colors.grey.shade300,
            ),
            const SizedBox(height: 24),
            Text(
              'No ${widget.isBeforePhoto ? "Before" : "After"} Photos',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              'Capture photos of the work area before starting or after completing the job.',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.grey.shade600,
                  ),
            ),
            const SizedBox(height: 32),
            if (_error != null)
              Container(
                padding: const EdgeInsets.all(12),
                margin: const EdgeInsets.only(bottom: 24),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(Icons.error_outline, color: Colors.red.shade700),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _error!,
                        style: TextStyle(color: Colors.red.shade700),
                      ),
                    ),
                  ],
                ),
              ),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Expanded(
                  child: FilledButton.icon(
                    onPressed: _isLoading ? null : _takePhoto,
                    icon: _isLoading
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.camera_alt),
                    label: const Text('Take Photo'),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _isLoading ? null : _pickFromGallery,
                    icon: const Icon(Icons.photo_library),
                    label: const Text('Gallery'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPhotoGrid(BuildContext context) {
    return Column(
      children: [
        // Job info header
        Container(
          padding: const EdgeInsets.all(16),
          color: Colors.grey.shade100,
          child: Row(
            children: [
              Icon(
                widget.isBeforePhoto ? Icons.hourglass_empty : Icons.check_circle,
                color: widget.isBeforePhoto ? Colors.orange : Colors.green,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.customerName,
                      style: Theme.of(context).textTheme.titleMedium,
                    ),
                    Text(
                      '${_capturedPhotos.length} photo(s) captured',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: Colors.grey.shade600,
                          ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        // Photo grid
        Expanded(
          child: GridView.builder(
            padding: const EdgeInsets.all(16),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1,
            ),
            itemCount: _capturedPhotos.length,
            itemBuilder: (context, index) {
              return _buildPhotoCard(context, index);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildPhotoCard(BuildContext context, int index) {
    final photo = _capturedPhotos[index];
    return Stack(
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
        // Delete button
        Positioned(
          top: 8,
          right: 8,
          child: Material(
            color: Colors.black54,
            borderRadius: BorderRadius.circular(20),
            child: InkWell(
              onTap: () => _removePhoto(index),
              borderRadius: BorderRadius.circular(20),
              child: const Padding(
                padding: EdgeInsets.all(6),
                child: Icon(
                  Icons.close,
                  color: Colors.white,
                  size: 20,
                ),
              ),
            ),
          ),
        ),
        // Photo number
        Positioned(
          bottom: 8,
          left: 8,
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.black54,
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
    );
  }

  Widget _buildBottomBar(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: _isLoading ? null : _takePhoto,
                icon: const Icon(Icons.camera_alt),
                label: const Text('Add More'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: FilledButton.icon(
                onPressed: _capturedPhotos.isEmpty
                    ? null
                    : () => _savePhotos(context),
                icon: const Icon(Icons.check),
                label: const Text('Save Photos'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _savePhotos(BuildContext context) {
    // Return the captured photo paths
    final result = {
      'jobId': widget.jobId,
      'isBefore': widget.isBeforePhoto,
      'photos': _capturedPhotos.map((p) => p.path).toList(),
    };

    context.pop(result);
  }
}