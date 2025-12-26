# Test Cart & Order API
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST API GIỎ HÀNG & ĐƠN HÀNG" -ForegroundColor Yellow
Write-Host "========================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:5000"

try {
    # Step 1: Login
    Write-Host "🔐 STEP 1: Login User..." -ForegroundColor Cyan
    $loginBody = @{
        email = "user@example.com"
        password = "123456"
    } | ConvertTo-Json

    $loginRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body $loginBody
    $token = $loginRes.token
    Write-Host "✅ Login thành công!" -ForegroundColor Green
    Write-Host "   User: $($loginRes.user.username)" -ForegroundColor Gray
    Write-Host "   Role: $($loginRes.user.role)" -ForegroundColor Gray
    Write-Host "   Token: $($token.Substring(0,30))...`n" -ForegroundColor Gray

    # Step 2: Add to cart
    Write-Host "🛒 STEP 2: Thêm sản phẩm vào giỏ..." -ForegroundColor Cyan
    
    $cart1Body = @{
        productId = 1
        quantity = 2
    } | ConvertTo-Json
    
    $cart1 = Invoke-RestMethod -Uri "$baseUrl/api/cart" -Method Post -Headers @{Authorization="Bearer $token"} -ContentType "application/json" -Body $cart1Body
    Write-Host "✅ Đã thêm $($cart1.data.product.name) x $($cart1.data.quantity)" -ForegroundColor Green
    
    $cart2Body = @{
        productId = 2
        quantity = 1
    } | ConvertTo-Json
    
    $cart2 = Invoke-RestMethod -Uri "$baseUrl/api/cart" -Method Post -Headers @{Authorization="Bearer $token"} -ContentType "application/json" -Body $cart2Body
    Write-Host "✅ Đã thêm $($cart2.data.product.name) x $($cart2.data.quantity)`n" -ForegroundColor Green

    # Step 3: View cart
    Write-Host "📦 STEP 3: Xem giỏ hàng..." -ForegroundColor Cyan
    $cart = Invoke-RestMethod -Uri "$baseUrl/api/cart" -Headers @{Authorization="Bearer $token"}
    Write-Host "✅ Giỏ hàng hiện tại:" -ForegroundColor Green
    Write-Host "   - Số sản phẩm: $($cart.data.summary.itemCount)" -ForegroundColor Gray
    Write-Host "   - Tổng số lượng: $($cart.data.summary.totalQuantity)" -ForegroundColor Gray
    Write-Host "   - Tổng tiền: $($cart.data.summary.subtotal) VND`n" -ForegroundColor Gray

    # Step 4: Create order
    Write-Host "📝 STEP 4: Tạo đơn hàng..." -ForegroundColor Cyan
    $orderBody = @{
        customerName = "Nguyễn Văn A"
        customerEmail = "nguyenvana@example.com"
        customerPhone = "0901234567"
        shippingAddress = "123 Đường Lê Lợi"
        shippingCity = "TP. Hồ Chí Minh"
        shippingDistrict = "Quận 1"
        shippingWard = "Phường Bến Nghé"
        shippingNote = "Gọi trước 15 phút"
        paymentMethod = "cod"
    } | ConvertTo-Json

    $order = Invoke-RestMethod -Uri "$baseUrl/api/orders" -Method Post -Headers @{Authorization="Bearer $token"} -ContentType "application/json" -Body $orderBody
    Write-Host "✅ Đặt hàng thành công!" -ForegroundColor Green
    Write-Host "   - Mã đơn hàng: $($order.data.orderNumber)" -ForegroundColor Yellow
    Write-Host "   - Trạng thái: $($order.data.orderStatus)" -ForegroundColor Gray
    Write-Host "   - Tổng tiền: $($order.data.total) VND" -ForegroundColor Gray
    Write-Host "   - Số sản phẩm: $($order.data.items.Count)`n" -ForegroundColor Gray

    $orderId = $order.data.id

    # Step 5: View order history
    Write-Host "📋 STEP 5: Xem lịch sử đơn hàng..." -ForegroundColor Cyan
    $history = Invoke-RestMethod -Uri "$baseUrl/api/orders/my" -Headers @{Authorization="Bearer $token"}
    Write-Host "✅ Lịch sử đơn hàng:" -ForegroundColor Green
    Write-Host "   - Tổng số đơn: $($history.data.Count)" -ForegroundColor Gray
    foreach ($o in $history.data) {
        Write-Host "   - [$($o.orderNumber)] $($o.orderStatus) - $($o.total) VND" -ForegroundColor Gray
    }
    Write-Host ""

    # Step 6: View order detail
    Write-Host "🔍 STEP 6: Xem chi tiết đơn hàng..." -ForegroundColor Cyan
    $detail = Invoke-RestMethod -Uri "$baseUrl/api/orders/$orderId" -Headers @{Authorization="Bearer $token"}
    Write-Host "✅ Chi tiết đơn hàng $($detail.data.orderNumber):" -ForegroundColor Green
    Write-Host "   - Khách hàng: $($detail.data.customerName)" -ForegroundColor Gray
    Write-Host "   - SĐT: $($detail.data.customerPhone)" -ForegroundColor Gray
    Write-Host "   - Địa chỉ: $($detail.data.shippingAddress), $($detail.data.shippingCity)" -ForegroundColor Gray
    Write-Host "   - Thanh toán: $($detail.data.paymentMethod)" -ForegroundColor Gray
    Write-Host "   - Trạng thái: $($detail.data.orderStatus) / $($detail.data.paymentStatus)" -ForegroundColor Gray
    Write-Host "   - Sản phẩm:" -ForegroundColor Gray
    foreach ($item in $detail.data.items) {
        Write-Host "     + $($item.productName) x $($item.quantity) = $($item.subtotal) VND" -ForegroundColor DarkGray
    }
    Write-Host ""

    # Success
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  ✅ TẤT CẢ TEST ĐỀU THÀNH CÔNG!" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Green

} catch {
    Write-Host "`n" -NoNewline
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails) {
        Write-Host "Details: $($_.ErrorDetails)" -ForegroundColor Red
    }
}
