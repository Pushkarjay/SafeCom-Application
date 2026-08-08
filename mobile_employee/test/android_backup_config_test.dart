import 'dart:io';

import 'package:flutter_test/flutter_test.dart';

/// Guards the data-retention requirement for the Employee app: uninstalling
/// the app must clear ALL user data (email, auth token, saved session). If
/// Android auto-backup were enabled, SharedPreferences would survive reinstall
/// and session data would be silently retained — the opposite of the intended
/// behavior. This test fails if `allowBackup` is ever flipped back to true or
/// if a backup-rules file is added.
void main() {
  const manifestPath = 'android/app/src/main/AndroidManifest.xml';
  const backupRulesPath = 'android/app/src/main/res/xml/backup_rules.xml';

  test('AndroidManifest disables auto-backup so uninstall clears user data', () {
    final manifest = File(manifestPath);
    expect(manifest.existsSync(), isTrue,
        reason: '$manifestPath must exist for this test to be meaningful');

    final content = manifest.readAsStringSync();

    expect(content, contains('android:allowBackup="false"'),
        reason: 'allowBackup must be false so uninstalling clears all data');
    expect(content, isNot(contains('android:allowBackup="true"')),
        reason: 'allowBackup must never be re-enabled to true');

    // No fullBackupContent / dataExtractionRules reference may be added —
    // they would restore SharedPreferences (email + auth token) after reinstall.
    expect(content, isNot(contains('fullBackupContent')),
        reason: 'fullBackupContent must not be referenced');
    expect(content, isNot(contains('dataExtractionRules')),
        reason: 'dataExtractionRules must not be referenced');
    expect(content, isNot(contains('backup_rules')),
        reason: 'backup_rules must not be referenced');
  });

  test('backup_rules.xml is removed', () {
    final backupRules = File(backupRulesPath);
    expect(backupRules.existsSync(), isFalse,
        reason: 'backup_rules.xml must not exist — it restores data on reinstall');
  });
}
