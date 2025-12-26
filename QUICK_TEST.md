# Quick Test Guide - Cart & Orders API

## Run these commands in order:

# 1. Start server (in a separate terminal)
node server.js

# 2. Login and get token
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method Post -ContentType "application/json" -Body '{"email":"user@example.com","password":"123456"}'
$token = $response.token
Write-Host "Token: $token"

# 3. Add product to cart
Invoke-RestMethod -Uri "http://localhost:5000/api/cart" -Method Post -Headers @{Authorization="Bearer $token"} -ContentType "application/json" -Body '{"productId":1,"quantity":2}'

# 4. Add another product
Invoke-RestMethod -Uri "http://localhost:5000/api/cart" -Method Post -Headers @{Authorization="Bearer $token"} -ContentType "application/json" -Body '{"productId":2,"quantity":1}'

# 5. View cart
Invoke-RestMethod -Uri "http://localhost:5000/api/cart" -Headers @{Authorization="Bearer $token"}

# 6. Create order
Invoke-RestMethod -Uri "http://localhost:5000/api/orders" -Method Post -Headers @{Authorization="Bearer $token"} -ContentType "application/json" -Body '{"customerName":"Nguyen Van A","customerEmail":"test@example.com","customerPhone":"0901234567","shippingAddress":"123 Le Loi","shippingCity":"Ho Chi Minh","paymentMethod":"cod"}'

# 7. View order history
Invoke-RestMethod -Uri "http://localhost:5000/api/orders/my" -Headers @{Authorization="Bearer $token"}

# 8. View order detail (replace 1 with your order ID)
Invoke-RestMethod -Uri "http://localhost:5000/api/orders/1" -Headers @{Authorization="Bearer $token"}

## User credentials:
## Email: user@example.com
## Password: 123456
