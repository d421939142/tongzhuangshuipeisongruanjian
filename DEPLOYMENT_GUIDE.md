# 桶装水配送系统 - 云服务器部署指南

## 目录
1. [服务器要求](#服务器要求)
2. [部署方案选择](#部署方案选择)
3. [方案一：传统部署](#方案一传统部署)
4. [方案二：Docker部署（推荐）](#方案二docker部署推荐)
5. [方案三：使用腾讯云CloudBase](#方案三使用腾讯云cloudbase)
6. [常见问题](#常见问题)
7. [安全配置](#安全配置)

---

## 服务器要求

### 最低配置
- **操作系统**：Ubuntu 20.04+ / CentOS 8+ / Debian 10+
- **CPU**：1核
- **内存**：2GB
- **硬盘**：20GB
- **网络**：公网IP

### 推荐配置
- **CPU**：2核
- **内存**：4GB
- **硬盘**：40GB SSD
- **网络**：公网IP（1Mbps+）

### 软件要求
- Node.js 18.x 或更高版本
- npm 9.x 或更高版本
- Git
- Nginx（可选，用于反向代理）
- Docker & Docker Compose（如果使用Docker部署）

---

## 部署方案选择

根据您的需求，可以选择以下三种部署方案：

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| 方案一：传统部署 | 简单直观，易于调试 | 环境配置复杂，维护成本高 | 开发测试环境 |
| 方案二：Docker部署（推荐） | 环境隔离，易于迁移，一键部署 | 需要Docker基础 | 生产环境（推荐） |
| 方案三：CloudBase | 无需服务器，自动扩缩容 | 依赖腾讯云生态 | 腾讯云用户 |

---

## 方案一：传统部署

### 步骤1：服务器准备

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y  # Ubuntu/Debian
# 或
sudo yum update -y  # CentOS/RHEL

# 安装必要的工具
sudo apt install -y git curl wget

# 安装Node.js（使用NodeSource）
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# 验证安装
node -v  # 应显示 v18.x.x
npm -v   # 应显示 9.x.x

# 安装PM2（进程管理器）
sudo npm install -g pm2
```

### 步骤2：上传项目到服务器

```bash
# 在服务器上创建项目目录
mkdir -p ~/water-delivery
cd ~/water-delivery

# 方式1：使用Git克隆（推荐）
git clone <your-repo-url> .

# 方式2：使用scp上传
# 在本地执行：
scp -r water-delivery-new user@your-server-ip:~/water-delivery
```

### 步骤3：安装依赖

```bash
cd ~/water-delivery/water-delivery-new

# 安装所有依赖
npm install
cd backend && npm install
cd ../frontend && npm install
cd ../delivery-app && npm install
```

### 步骤4：配置环境变量

```bash
# 创建生产环境配置
cd ~/water-delivery/water-delivery-new/backend
cp .env.example .env
nano .env
```

编辑 `.env` 文件：
```env
# 服务器配置
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# 数据库配置
DB_PATH=/path/to/database/data.db

# API配置
API_KEY=your-production-api-key-here

# 日志配置
LOG_LEVEL=info
LOG_PATH=/var/log/water-delivery

# CORS配置（前端域名）
FRONTEND_URL=https://your-domain.com
DELIVERY_APP_URL=https://delivery.your-domain.com
```

### 步骤5：构建前端

```bash
cd ~/water-delivery/water-delivery-new/frontend
npm run build

cd ../delivery-app
npm run build
```

### 步骤6：配置Nginx反向代理

```bash
# 安装Nginx
sudo apt install -y nginx

# 创建前端站点配置
sudo nano /etc/nginx/sites-available/water-delivery
```

添加以下内容：
```nginx
# 管理端前端
server {
    listen 80;
    server_name your-domain.com;

    root /home/your-username/water-delivery/water-delivery-new/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 反向代理API请求
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}

# 配送APP
server {
    listen 80;
    server_name delivery.your-domain.com;

    root /home/your-username/water-delivery/water-delivery-new/delivery-app/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # 反向代理API请求
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用站点：
```bash
sudo ln -s /etc/nginx/sites-available/water-delivery /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 步骤7：使用PM2启动后端服务

```bash
cd ~/water-delivery/water-delivery-new/backend

# 创建PM2配置文件
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'water-delivery-api',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
};
EOF

# 启动服务
pm2 start ecosystem.config.js

# 保存PM2配置
pm2 save

# 设置开机自启
pm2 startup | sudo -E bash -
```

### 步骤8：配置HTTPS（使用Let's Encrypt）

```bash
# 安装Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取SSL证书
sudo certbot --nginx -d your-domain.com -d delivery.your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

---

## 方案二：Docker部署（推荐）

### 步骤1：安装Docker和Docker Compose

```bash
# 安装Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

### 步骤2：创建生产环境配置

```bash
# 在项目根目录创建配置目录
mkdir -p ~/water-delivery/water-delivery-new/prod

# 复制docker-compose配置
cp ~/water-delivery/water-delivery-new/docker-compose.yml ~/water-delivery/water-delivery-new/prod/
cp ~/water-delivery/water-delivery-new/docker-compose.prod.yml ~/water-delivery/water-delivery-new/prod/
```

### 步骤3：创建生产环境环境变量文件

```bash
cd ~/water-delivery/water-delivery-new/prod
nano .env
```

添加以下内容：
```env
# 后端配置
NODE_ENV=production
BACKEND_PORT=3001
API_KEY=your-secure-api-key-here
DB_PATH=/app/data/database.db

# 前端配置
VITE_API_URL=https://your-domain.com/api
VITE_APP_TITLE=桶装水配送管理系统

# 配送APP配置
VITE_DELIVERY_API_URL=https://delivery.your-domain.com/api
VITE_DELIVERY_APP_TITLE=配送助手

# Nginx配置
NGINX_PORT=80
DOMAIN=your-domain.com
DELIVERY_DOMAIN=delivery.your-domain.com
```

### 步骤4：构建和启动容器

```bash
cd ~/water-delivery/water-delivery-new/prod

# 构建镜像
docker-compose -f docker-compose.yml build

# 启动服务
docker-compose -f docker-compose.yml up -d

# 查看日志
docker-compose -f docker-compose.yml logs -f
```

### 步骤5：配置SSL证书

使用Nginx容器配置HTTPS：

```bash
# 创建SSL证书目录
mkdir -p ~/water-delivery/water-delivery-new/prod/nginx/ssl

# 使用Certbot获取证书（需要先临时运行容器）
sudo apt install -y certbot
sudo certbot certonly --standalone -d your-domain.com -d delivery.your-domain.com

# 复制证书
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem ~/water-delivery/water-delivery-new/prod/nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem ~/water-delivery/water-delivery-new/prod/nginx/ssl/

# 设置权限
sudo chown -R $USER:$USER ~/water-delivery/water-delivery-new/prod/nginx/ssl
chmod 600 ~/water-delivery/water-delivery-new/prod/nginx/ssl/*.pem
```

更新Nginx配置启用HTTPS（在prod/nginx/nginx.conf中）。

### 步骤6：设置自动备份

```bash
# 创建备份脚本
cat > ~/water-delivery/water-delivery-new/prod/backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/home/your-username/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# 备份数据库
docker cp water-delivery-backend:/app/data/database.db $BACKUP_DIR/database_$DATE.db

# 备份上传的文件
docker cp water-delivery-backend:/app/uploads $BACKUP_DIR/uploads_$DATE

# 压缩备份
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz $BACKUP_DIR/*_$DATE.*

# 删除7天前的备份
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +7 -delete

echo "Backup completed: backup_$DATE.tar.gz"
EOF

chmod +x ~/water-delivery/water-delivery-new/prod/backup.sh

# 添加定时任务（每天凌晨2点备份）
crontab -e
# 添加：0 2 * * * /home/your-username/water-delivery/water-delivery-new/prod/backup.sh
```

---

## 方案三：使用腾讯云CloudBase

### 前提条件
- 已注册腾讯云账号
- 已开通CloudBase服务

### 步骤1：准备项目

```bash
# 创建CloudBase配置文件
cd ~/water-delivery/water-delivery-new
cat > cloudbaserc.json << 'EOF'
{
  "envId": "your-env-id",
  "version": "2.0",
  "$schema": "https://framework-1258016615.tcloudbaseapp.com/schema/latest.json",
  "framework": {
    "name": "water-delivery",
    "plugins": {
      "server": {
        "use": "@cloudbase/framework-plugin-node",
        "inputs": {
          "entry": "backend/server.js",
          "name": "water-delivery-api",
          "envVariables": {
            "NODE_ENV": "production",
            "PORT": "3001"
          }
        }
      },
      "web": {
        "use": "@cloudbase/framework-plugin-website",
        "inputs": {
          "buildCommand": "cd frontend && npm run build",
          "outputPath": "frontend/dist"
        }
      }
    }
  }
}
EOF
```

### 步骤2：安装CloudBase CLI

```bash
# 安装CLI工具
npm install -g @cloudbase/cli

# 登录
tcb login
```

### 步骤3：部署到CloudBase

```bash
cd ~/water-delivery/water-delivery-new

# 部署
tcb framework deploy

# 查看部署状态
tcb framework deploy -e your-env-id
```

---

## 常见问题

### 1. 端口被占用
```bash
# 查看端口占用
sudo lsof -i :3001
sudo lsof -i :80

# 修改端口
nano backend/.env
# 修改 PORT=3001 为其他端口
```

### 2. 权限问题
```bash
# 修改文件权限
sudo chown -R $USER:$USER ~/water-delivery
chmod -R 755 ~/water-delivery
```

### 3. 数据库连接失败
```bash
# 检查数据库文件路径
ls -la backend/data/
nano backend/.env
# 确认 DB_PATH 配置正确
```

### 4. Nginx 403/404错误
```bash
# 检查Nginx配置
sudo nginx -t

# 检查文件权限
sudo chmod -R 755 ~/water-delivery/water-delivery-new/frontend/dist

# 重启Nginx
sudo systemctl restart nginx
```

### 5. Docker容器无法启动
```bash
# 查看容器日志
docker-compose logs backend
docker-compose logs frontend

# 重新构建
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

---

## 安全配置

### 1. 防火墙配置
```bash
# 安装UFW
sudo apt install -y ufw

# 配置防火墙规则
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable

# 查看状态
sudo ufw status
```

### 2. 修改SSH端口
```bash
# 编辑SSH配置
sudo nano /etc/ssh/sshd_config

# 修改端口
Port 2222

# 重启SSH服务
sudo systemctl restart sshd
```

### 3. 配置自动更新
```bash
# 安装unattended-upgrades
sudo apt install -y unattended-upgrades

# 配置自动更新
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 4. 监控和日志
```bash
# 使用PM2监控
pm2 monit

# 查看日志
pm2 logs water-delivery-api

# Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 维护建议

### 1. 定期备份
- 每天备份数据库
- 每周备份上传文件
- 保留最近30天的备份

### 2. 监控服务
- 使用PM2监控后端服务
- 配置告警通知
- 定期查看系统资源

### 3. 更新依赖
```bash
# 每月更新一次依赖
npm update
cd backend && npm update
cd ../frontend && npm update
cd ../delivery-app && npm update

# 重新构建和部署
```

### 4. 安全检查
```bash
# 定期检查安全漏洞
npm audit

# 修复漏洞
npm audit fix
```

---

## 部署检查清单

- [ ] 服务器环境准备完成
- [ ] 项目代码上传成功
- [ ] 依赖安装完成
- [ ] 环境变量配置正确
- [ ] 前端构建成功
- [ ] 后端服务启动成功
- [ ] Nginx配置完成
- [ ] 域名解析正确
- [ ] HTTPS证书配置
- [ ] 防火墙规则设置
- [ ] 自动备份配置
- [ ] 监控告警配置

---

## 总结

本文档提供了三种部署方案：

1. **传统部署**：适合快速部署和调试
2. **Docker部署（推荐）**：适合生产环境，易于维护和迁移
3. **CloudBase部署**：适合腾讯云用户，无需服务器管理

推荐使用 **Docker部署** 方案，它具有以下优势：
- 环境隔离，避免依赖冲突
- 一键部署，易于迁移
- 便于扩展和更新
- 降低运维成本

如有问题，请参考常见问题部分或查看日志排查。
