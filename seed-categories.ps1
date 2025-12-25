# Script to seed categories to production
$baseUrl = "https://backend-node-lilac-seven.vercel.app"

Write-Host "=== SEED CATEGORIES TO PRODUCTION ===" -ForegroundColor Cyan
Write-Host ""

# Login first to get admin token
Write-Host "1. Login to get admin token..." -ForegroundColor Yellow
$loginBody = @{
    email = "vercel@test.com"
    password = "123456"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.data.token
    Write-Host "✓ Login successful!" -ForegroundColor Green
    Write-Host "Token: $($token.Substring(0,20))..." -ForegroundColor Gray
} catch {
    Write-Host "✗ Login failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "2. Creating categories..." -ForegroundColor Yellow

# Categories data
$categories = @(
    @{
        name = "Điện thoại"
        slug = "dien-thoai"
        description = "Điện thoại thông minh từ các thương hiệu hàng đầu như Apple, Samsung, Oppo, Xiaomi, Realme"
        imageUrl = "https://cdn.hoanghamobile.com/i/cat/Uploads/2023/08/17/image-removebg-preview-1.png"
    },
    @{
        name = "Laptop"
        slug = "laptop"
        description = "Laptop văn phòng, gaming, và cao cấp từ Dell, HP, Asus, Lenovo, MacBook Pro, MacBook Air"
        imageUrl = "https://cdn.hoanghamobile.com/i/cat/Uploads/2021/05/12/laptop.png"
    },
    @{
        name = "Máy tính bảng"
        slug = "may-tinh-bang"
        description = "iPad, Samsung Galaxy Tab, Xiaomi Pad và các máy tính bảng Android khác"
        imageUrl = "https://cdn.hoanghamobile.com/i/cat/Uploads/2020/10/13/ipad.png"
    },
    @{
        name = "Tai nghe"
        slug = "tai-nghe"
        description = "Tai nghe Bluetooth, tai nghe có dây, tai nghe gaming, AirPods, Galaxy Buds"
        imageUrl = "https://cdn.hoanghamobile.com/i/cat/Uploads/2020/10/13/tai-nghe.png"
    },
    @{
        name = "Phụ kiện"
        slug = "phu-kien"
        description = "Sạc, cáp, ốp lưng, miếng dán màn hình, bao da, giá đỡ và các phụ kiện công nghệ khác"
        imageUrl = "https://cdn.hoanghamobile.com/i/cat/Uploads/2020/10/13/phu-kien.png"
    }
)

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

$successCount = 0
$errorCount = 0

foreach ($category in $categories) {
    try {
        $body = $category | ConvertTo-Json
        $response = Invoke-RestMethod -Uri "$baseUrl/api/categories" -Method POST -Body $body -Headers $headers
        Write-Host "✓ Created: $($category.name)" -ForegroundColor Green
        $successCount++
    } catch {
        $errorMessage = $_.Exception.Message
        if ($errorMessage -like "*409*" -or $errorMessage -like "*already exists*") {
            Write-Host "○ Already exists: $($category.name)" -ForegroundColor Yellow
        } else {
            Write-Host "✗ Failed: $($category.name) - $errorMessage" -ForegroundColor Red
            $errorCount++
        }
    }
}

Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "✓ Created: $successCount" -ForegroundColor Green
Write-Host "✗ Errors: $errorCount" -ForegroundColor Red
Write-Host ""
Write-Host "Done! View all categories at:" -ForegroundColor Cyan
Write-Host "$baseUrl/api/categories" -ForegroundColor Gray
