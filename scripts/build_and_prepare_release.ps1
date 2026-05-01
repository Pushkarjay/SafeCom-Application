<#
Build both Flutter apps and print artifact paths.
This script does not contain any secrets and is safe to run locally.
#>

Set-StrictMode -Version Latest

Write-Output "Building mobile_customer AAB..."
Push-Location mobile_customer
flutter clean
flutter pub get
flutter build appbundle --release
Write-Output "Customer AAB: $(Resolve-Path build/app/outputs/bundle/release/app-release.aab)"
Pop-Location

Write-Output "Building mobile_employee AAB..."
Push-Location mobile_employee
flutter clean
flutter pub get
flutter build appbundle --release
Write-Output "Employee AAB: $(Resolve-Path build/app/outputs/bundle/release/app-release.aab)"
Pop-Location

Write-Output "Build complete. Upload AABs using Play Console or the play_upload/upload_aab_template.py script (requires service account)."
