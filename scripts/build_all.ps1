$ErrorActionPreference = "Stop"

$releaseDir = "E:\Projects\Working\SafeCom-Application\release_assets"
if (!(Test-Path -Path $releaseDir)) {
    New-Item -ItemType Directory -Force -Path $releaseDir | Out-Null
}

# ─── Pre-flight checks ───────────────────────────────────────
Write-Host "Checking prerequisites..."

# Check gcloud CLI availability and authentication
try {
    $gcloudVersion = gcloud version --format='value(Google Cloud SDK)' 2>$null
    if (-not $gcloudVersion) { throw "gcloud CLI not found or not working" }
    Write-Host "  ✓ gcloud CLI available: $gcloudVersion"
    
    $authList = gcloud auth list --filter=status:ACTIVE --format='value(account)' 2>$null
    if (-not $authList) { throw "No active gcloud account found. Run 'gcloud auth login' first." }
    Write-Host "  ✓ gcloud authenticated as: $authList"
} catch {
    Write-Host "  ✗ $($_.Exception.Message)"
    exit 1
}

Write-Host "========================================="
Write-Host "1. Deploying Backend to us-central1..."
Write-Host "========================================="
Set-Location "E:\Projects\Working\SafeCom-Application\backend_server"
gcloud run deploy safecom-backend --source . --region us-central1 --allow-unauthenticated --quiet --project safecom-application-01
if ($LASTEXITCODE -ne 0) { Write-Host "✗ Deploy to us-central1 failed"; exit 1 }

Write-Host "========================================="
Write-Host "2. Deploying Backend to asia-south1..."
Write-Host "========================================="
gcloud run deploy safecom-backend --source . --region asia-south1 --allow-unauthenticated --quiet --project safecom-application-01
if ($LASTEXITCODE -ne 0) { Write-Host "✗ Deploy to asia-south1 failed"; exit 1 }

Write-Host "========================================="
Write-Host "3. Building Admin Dashboard (Vite)..."
Write-Host "========================================="
Set-Location "E:\Projects\Working\SafeCom-Application\Admin\web_app\admin-dashboard"
npm install
if ($LASTEXITCODE -ne 0) { Write-Host "✗ npm install failed"; exit 1 }
npm run build
if ($LASTEXITCODE -ne 0) { Write-Host "✗ npm run build failed"; exit 1 }
$adminRelease = Join-Path $releaseDir "Admin-Dashboard"
if (Test-Path -Path $adminRelease) {
    Remove-Item -Recurse -Force $adminRelease
}
Copy-Item -Path dist -Destination $adminRelease -Recurse -Force

Write-Host "========================================="
Write-Host "4. Building Mobile Customer App (Flutter)..."
Write-Host "========================================="
Set-Location "E:\Projects\Working\SafeCom-Application\mobile_customer"
flutter clean
flutter pub get
if ($LASTEXITCODE -ne 0) { Write-Host "✗ flutter pub get failed"; exit 1 }
flutter build apk --release
if ($LASTEXITCODE -ne 0) { Write-Host "✗ flutter build apk failed"; exit 1 }
flutter build appbundle --release
if ($LASTEXITCODE -ne 0) { Write-Host "✗ flutter build appbundle failed"; exit 1 }
$customerRelease = Join-Path $releaseDir "Mobile-Customer"
if (!(Test-Path -Path $customerRelease)) {
    New-Item -ItemType Directory -Force -Path $customerRelease | Out-Null
}
Copy-Item -Path build\app\outputs\flutter-apk\app-release.apk -Destination (Join-Path $customerRelease "customer-app.apk") -Force
Copy-Item -Path build\app\outputs\bundle\release\app-release.aab -Destination (Join-Path $customerRelease "customer-app.aab") -Force

Write-Host "========================================="
Write-Host "5. Building Mobile Employee App (Flutter)..."
Write-Host "========================================="
Set-Location "E:\Projects\Working\SafeCom-Application\mobile_employee"
flutter clean
flutter pub get
if ($LASTEXITCODE -ne 0) { Write-Host "✗ flutter pub get failed"; exit 1 }
flutter build apk --release
if ($LASTEXITCODE -ne 0) { Write-Host "✗ flutter build apk failed"; exit 1 }
flutter build appbundle --release
if ($LASTEXITCODE -ne 0) { Write-Host "✗ flutter build appbundle failed"; exit 1 }
$employeeRelease = Join-Path $releaseDir "Mobile-Employee"
if (!(Test-Path -Path $employeeRelease)) {
    New-Item -ItemType Directory -Force -Path $employeeRelease | Out-Null
}
Copy-Item -Path build\app\outputs\flutter-apk\app-release.apk -Destination (Join-Path $employeeRelease "employee-app.apk") -Force
Copy-Item -Path build\app\outputs\bundle\release\app-release.aab -Destination (Join-Path $employeeRelease "employee-app.aab") -Force

Write-Host "========================================="
Write-Host "All builds and deployments finished successfully!"
Write-Host "========================================="
gcloud run deploy safecom-backend --source . --region asia-south1 --allow-unauthenticated --quiet --project safecom-application-01

Write-Host "========================================="
Write-Host "3. Building Admin Dashboard (Vite)..."
Write-Host "========================================="
cd E:\Projects\Working\SafeCom-Application\Admin\web_app\admin-dashboard
npm install
npm run build
$adminRelease = Join-Path $releaseDir "Admin-Dashboard"
if (Test-Path -Path $adminRelease) {
    Remove-Item -Recurse -Force $adminRelease
}
Copy-Item -Path dist -Destination $adminRelease -Recurse -Force

Write-Host "========================================="
Write-Host "4. Building Mobile Customer App (Flutter)..."
Write-Host "========================================="
cd E:\Projects\Working\SafeCom-Application\mobile_customer
flutter clean
flutter pub get
flutter build apk --release
flutter build appbundle --release
$customerRelease = Join-Path $releaseDir "Mobile-Customer"
if (!(Test-Path -Path $customerRelease)) {
    New-Item -ItemType Directory -Force -Path $customerRelease | Out-Null
}
Copy-Item -Path build\app\outputs\flutter-apk\app-release.apk -Destination (Join-Path $customerRelease "customer-app.apk") -Force
Copy-Item -Path build\app\outputs\bundle\release\app-release.aab -Destination (Join-Path $customerRelease "customer-app.aab") -Force

Write-Host "========================================="
Write-Host "5. Building Mobile Employee App (Flutter)..."
Write-Host "========================================="
cd E:\Projects\Working\SafeCom-Application\mobile_employee
flutter clean
flutter pub get
flutter build apk --release
flutter build appbundle --release
$employeeRelease = Join-Path $releaseDir "Mobile-Employee"
if (!(Test-Path -Path $employeeRelease)) {
    New-Item -ItemType Directory -Force -Path $employeeRelease | Out-Null
}
Copy-Item -Path build\app\outputs\flutter-apk\app-release.apk -Destination (Join-Path $employeeRelease "employee-app.apk") -Force
Copy-Item -Path build\app\outputs\bundle\release\app-release.aab -Destination (Join-Path $employeeRelease "employee-app.aab") -Force

Write-Host "========================================="
Write-Host "All builds and deployments finished successfully!"
Write-Host "========================================="
