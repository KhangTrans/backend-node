# Deploy lên Fly.io (FREE Tier)

## Tại sao Fly.io?
- ✅ **FREE tier**: 3 shared-cpu VMs, 256MB RAM mỗi VM
- ✅ Hỗ trợ WebSocket/Socket.IO tốt
- ✅ Deploy nhanh với Dockerfile hoặc auto-detect
- ✅ Global edge network
- ✅ Không sleep như Render

## Bước 1: Cài đặt Fly CLI

### Windows (PowerShell)
```powershell
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

### macOS/Linux
```bash
curl -L https://fly.io/install.sh | sh
```

## Bước 2: Login vào Fly.io

```bash
fly auth login
```

Browser sẽ mở, đăng nhập với GitHub.

## Bước 3: Tạo Fly App

Trong thư mục Backend:

```bash
fly launch
```

Fly sẽ hỏi:
- **App Name**: Nhập tên (vd: `backend-socketio`) hoặc để trống cho random
- **Region**: Chọn `Singapore (sin)` - gần Việt Nam nhất
- **Database**: Chọn **No** (dùng Aiven MySQL có sẵn)
- **Redis**: Chọn **No** (dùng Upstash có sẵn)

Fly sẽ tạo file `fly.toml` tự động.

## Bước 4: Configure fly.toml

File `fly.toml` đã được tạo. Cập nhật nội dung:

```toml
app = "backend-socketio"  # Tên app của bạn
primary_region = "sin"     # Singapore

[build]
  [build.env]
    NODE_VERSION = "18"

[env]
  PORT = "8080"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = false  # Không auto-sleep
  auto_start_machines = true
  min_machines_running = 1    # Luôn có ít nhất 1 machine chạy

[[http_service.checks]]
  grace_period = "10s"
  interval = "30s"
  method = "GET"
  timeout = "5s"
  path = "/health"

[[vm]]
  cpu_kind = "shared"
  cpus = 1
  memory_mb = 256
```

## Bước 5: Set Environment Variables

```bash
# Database (thay YOUR_PASSWORD bằng password thật từ .env)
fly secrets set DATABASE_URL="mysql://avnadmin:YOUR_PASSWORD@mysql-30cab664-trank7866-3a4c.c.aivencloud.com:27426/defaultdb?ssl-mode=REQUIRED"

# JWT
fly secrets set JWT_SECRET="your_jwt_secret_key_change_this_in_production"
fly secrets set JWT_EXPIRE="7d"

# Cloudinary
fly secrets set CLOUDINARY_CLOUD_NAME="dsom4uuux"
fly secrets set CLOUDINARY_API_KEY="456735213468847"
fly secrets set CLOUDINARY_API_SECRET="1o0dN-j_hSDrj3AuyFd2Ce8uozI"

# Frontend
fly secrets set FRONTEND_URL="https://frontend-ky7.vercel.app"

# Redis
fly secrets set REDIS_ENABLED="true"
fly secrets set UPSTASH_REDIS_REST_URL="https://exact-terrapin-53504.upstash.io"
fly secrets set UPSTASH_REDIS_REST_TOKEN="AdEAAAIncDFiNzEyN2M2MjU2ZDM0NDU2OWNkMThiOGQyZGQ3MTU3N3AxNTM1MDQ"
```

**Hoặc set tất cả cùng lúc:**

```bash
fly secrets set \
  DATABASE_URL="mysql://avnadmin:YOUR_PASSWORD@mysql-30cab664-trank7866-3a4c.c.aivencloud.com:27426/defaultdb?ssl-mode=REQUIRED" \
  JWT_SECRET="your_jwt_secret_key_change_this_in_production" \
  JWT_EXPIRE="7d" \
  CLOUDINARY_CLOUD_NAME="dsom4uuux" \
  CLOUDINARY_API_KEY="456735213468847" \
  CLOUDINARY_API_SECRET="1o0dN-j_hSDrj3AuyFd2Ce8uozI" \
  FRONTEND_URL="https://frontend-ky7.vercel.app" \
  REDIS_ENABLED="true" \
  UPSTASH_REDIS_REST_URL="https://exact-terrapin-53504.upstash.io" \
  UPSTASH_REDIS_REST_TOKEN="AdEAAAIncDFiNzEyN2M2MjU2ZDM0NDU2OWNkMThiOGQyZGQ3MTU3N3AxNTM1MDQ"
```

## Bước 6: Deploy

```bash
fly deploy
```

Fly sẽ:
1. Build Docker image từ code
2. Push lên Fly registry
3. Deploy lên VM
4. Run health checks

Chờ khoảng 2-3 phút.

## Bước 7: Verify Deployment

Kiểm tra app status:
```bash
fly status
```

Xem logs:
```bash
fly logs
```

Mở app trong browser:
```bash
fly open
```

URL app: `https://backend-socketio.fly.dev` (hoặc tên bạn đặt)

Kiểm tra health:
```bash
curl https://backend-socketio.fly.dev/health
```

## Bước 8: Run Migrations

Fly không tự động chạy migrations. Chạy thủ công:

```bash
fly ssh console
```

Trong console:
```bash
npx prisma migrate deploy
exit
```

Hoặc từ local:
```bash
fly ssh console -C "npx prisma migrate deploy"
```

## Bước 9: Scale (nếu cần)

Free tier có 3 VMs. Mặc định chỉ dùng 1:

```bash
# Xem hiện tại
fly scale show

# Scale up (nếu cần)
fly scale count 2  # Chạy 2 instances
```

## Commands hữu ích

```bash
# Xem logs real-time
fly logs -f

# Restart app
fly apps restart

# SSH vào container
fly ssh console

# Check secrets
fly secrets list

# Update secret
fly secrets set KEY=value

# Xem resource usage
fly status

# Open dashboard
fly dashboard
```

## Frontend Configuration

Update frontend config:

```javascript
// config/api.js
export const API_CONFIG = {
  REST_URL: 'https://backend-node-lilac-seven.vercel.app',  // Vercel
  SOCKET_URL: 'https://backend-socketio.fly.dev'            // Fly.io
};
```

## Troubleshooting

### Build failed

**Error**: Dependencies install failed
```bash
# Local test build
fly deploy --local-only

# Hoặc rebuild
fly deploy --build-only
```

### Database connection failed

**Fix**: Aiven cần whitelist Fly IPs (hoặc allow all)
- Fly IPs thay đổi động
- Trong Aiven: Allow `0.0.0.0/0` (tất cả IPs)

### Socket.IO not working

**Check**:
1. CORS settings trong server.js
2. Frontend đang connect đúng Fly URL
3. Fly logs: `fly logs -f`

### Health check failed

```bash
# Test health endpoint
curl https://backend-socketio.fly.dev/health

# Check logs
fly logs

# Restart
fly apps restart
```

### Memory issues (256MB not enough)

Free tier có 256MB RAM. Nếu không đủ:

```bash
# Scale memory (cần paid plan)
fly scale memory 512
```

## Monitoring

### Fly Dashboard
```bash
fly dashboard
```

### Metrics
```bash
fly status
fly metrics
```

### Logs
```bash
fly logs -f  # Follow logs
fly logs --tail 100  # Last 100 lines
```

## Cost (FREE Tier)

**Fly.io Free Tier includes:**
- 3 shared-cpu-1x VMs
- 256MB RAM each
- 160GB outbound data transfer/month
- **Enough for development & small projects**

**Paid plans start at $1.94/month** for more resources.

## Alternative: Dockerfile (nếu auto-detect không work)

Tạo `Dockerfile` trong root:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy prisma schema
COPY prisma ./prisma/

# Generate Prisma Client
RUN npx prisma generate

# Copy app files
COPY . .

# Expose port
EXPOSE 8080

# Start command
CMD ["npm", "start"]
```

Deploy lại:
```bash
fly deploy
```

## CI/CD (Optional)

### GitHub Actions

Tạo `.github/workflows/fly-deploy.yml`:

```yaml
name: Deploy to Fly.io

on:
  push:
    branches: [main, master]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - uses: superfly/flyctl-actions/setup-flyctl@master
      
      - run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

Get API token:
```bash
fly tokens create deploy
```

Add to GitHub Secrets: `FLY_API_TOKEN`

## Summary

✅ **Fly.io FREE tier**:
- 3 VMs, 256MB RAM each
- No auto-sleep (better than Render free tier)
- Singapore region (low latency cho VN)
- WebSocket/Socket.IO support

✅ **Deployment**:
```bash
fly launch
fly secrets set ... (env vars)
fly deploy
fly ssh console -C "npx prisma migrate deploy"
```

✅ **Your URL**: `https://backend-socketio.fly.dev`

✅ **Architecture**:
```
Frontend (Vercel) → REST API (Vercel) + Socket.IO (Fly.io)
```

Happy deploying! 🚀
