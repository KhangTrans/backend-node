# Fly.io Deployment Script

Write-Host "🚀 Deploying to Fly.io..." -ForegroundColor Cyan

# Check if flyctl is installed
if (!(Get-Command fly -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Fly CLI not installed!" -ForegroundColor Red
    Write-Host "Install with: powershell -Command 'iwr https://fly.io/install.ps1 -useb | iex'" -ForegroundColor Yellow
    exit 1
}

# Check if logged in
$flyAuth = fly auth whoami 2>&1
if ($flyAuth -like "*not authenticated*") {
    Write-Host "❌ Not logged in to Fly.io" -ForegroundColor Red
    Write-Host "Run: fly auth login" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Fly CLI ready" -ForegroundColor Green

# Deploy
Write-Host "`n📦 Deploying..." -ForegroundColor Cyan
fly deploy

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Deployment successful!" -ForegroundColor Green
    Write-Host "`n🌐 Your app is running at:" -ForegroundColor Cyan
    fly status
    
    Write-Host "`n📊 View logs with: fly logs -f" -ForegroundColor Yellow
    Write-Host "🔧 Open dashboard: fly dashboard" -ForegroundColor Yellow
} else {
    Write-Host "`n❌ Deployment failed!" -ForegroundColor Red
    Write-Host "Check logs with: fly logs" -ForegroundColor Yellow
}
