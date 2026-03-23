# 桶装水配送系统 - 快速部署指南

## 🚀 快速开始

本指南帮助您快速将桶装水配送系统部署到云服务器。

---

## 📋 部署前准备

### 1. 服务器要求
- **操作系统**：Ubuntu 20.04+（推荐）
- **CPU**：1核+
- **内存**：2GB+
- **硬盘**：20GB+
- **网络**：公网IP

### 2. 本地工具
- SSH客户端（PuTTY、Termius或终端）
- SCP/SFTP工具（WinSCP、FileZilla）
- Git

---

## 🎯 三种部署方案

| 方案 | 适用场景 | 部署时间 | 推荐度 |
|------|----------|----------|--------|
| **Docker部署** | 生产环境，推荐 | 30-60分钟 | ⭐⭐⭐⭐⭐ |
| **传统部署** | 测试环境，熟悉Node.js | 1-2小时 | ⭐⭐⭐ |
| **CloudBase** | 腾讯云用户，无服务器 | 15-30分钟 | ⭐⭐⭐⭐ |

---

## 🐳 方案一：Docker部署（推荐）

### 步骤1：连接服务器

```bash
ssh user@your-server-ip
```

### 步骤2：安装Docker

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# 重新登录或执行
newgrp docker

# 安装Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 步骤3：上传项目

```bash
# 方式1：使用Git克隆
git clone https://github.com/your-repo/water-delivery.git
cd water-delivery

# 方式2：使用SCP上传（在本地执行）
scp -r water-delivery-new user@your-server-ip:~/
```

### 步骤4：配置环境变量

```bash
cd water-delivery-new/prod
nano .env
```

编辑以下内容：
```env
# 后端配置
NODE_ENV=production
BACKEND_PORT=3001
API_KEY=your-secure-api-key-change-this
DB_PATH=/app/data/database.db

# 前端配置
VITE_API_URL=https://your-domain.com/api
VITE_APP_TITLE=桶装水配送管理系统

# 配送APP配置
VITE_DELIVERY_API_URL=https://your-domain.com/api
VITE_DELIVERY_APP_TITLE=配送助手

# Nginx配置
NGINX_PORT=80
DOMAIN=your-domain.com
DELIVERY_DOMAIN=your-domain.com
```

### 步骤5：构建和启动

```bash
# 构建镜像
docker-compose -f docker-compose.prod.yml build

# 启动服务
docker-compose -f docker-compose.prod.yml up -d

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f
```

### 步骤6：配置SSL证书（可选）

```bash
# 安装Certbot
sudo apt install -y certbot

# 获取证书
sudo certbot certonly --standalone -d your-domain.com

# 复制证书
sudo mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/
sudo chown -R $USER:$USER nginx/ssl
```

### 步骤7：配置域名解析

在您的域名DNS管理中添加记录：
```
类型: A
主机记录: @
记录值: 您的服务器IP

类型: A
主机记录: www
记录值: 您的服务器IP
```

### 完成！

访问地址：
- 管理端：`http://your-domain.com`
- 配送APP：`http://your-domain.com/delivery`
- 后端API：`http://your-domain.com/api`

---

## 💻 方案二：传统部署

### 步骤1：安装Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### 步骤2：安装PM2和Nginx

```bash
sudo npm install -g pm2
sudo apt install -y nginx
```

### 步骤3：上传项目

```bash
git clone https://github.com/your-repo/water-delivery.git
cd water-delivery/water-delivery-new
```

### 步骤4：安装依赖

```bash
npm install
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
cd delivery-app && npm install && cd ..
```

### 步骤5：配置环境变量

```bash
cd backend
cp .env.example .env
nano .env
```

### 步骤6：构建前端

```bash
cd frontend
npm run build
cd ../delivery-app
npm run build
cd ..
```

### 步骤7：配置Nginx

```bash
sudo cp nginx/conf.d/default.conf /etc/nginx/conf.d/water-delivery.conf
sudo nano /etc/nginx/conf.d/water-delivery.conf
```

修改server_name为您的域名。

```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 步骤8：启动后端

```bash
cd backend
pm2 start server.js --name water-delivery-api
pm2 save
pm2 startup | sudo -E bash -
```

### 完成！

访问地址：
- 管理端：`http://your-domain.com`
- 配送APP：`http://your-domain.com/delivery`
- 后端API：`http://your-domain.com/api`

---

## ☁️ 方案三：CloudBase部署

### 步骤1：开通CloudBase

1. 访问 [腾讯云CloudBase](https://cloud.tencent.com/product/tcb)
2. 开通服务并创建环境

### 步骤2：安装CLI

```bash
npm install -g @cloudbase/cli
```

### 步骤3：登录

```bash
tcb login
```

### 步骤4：配置项目

```bash
cd water-delivery-new
nano cloudbaserc.json
```

配置envId为您的CloudBase环境ID。

### 步骤5：部署

```bash
tcb framework deploy
```

### 完成！

部署完成后，CloudBase会提供访问地址。

---

## 🔧 常用命令

### Docker部署

```bash
# 查看容器状态
docker-compose -f docker-compose.prod.yml ps

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f

# 重启服务
docker-compose -f docker-compose.prod.yml restart

# 停止服务
docker-compose -f docker-compose.prod.yml down

# 更新服务
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

### 传统部署

```bash
# 查看PM2状态
pm2 status

# 查看日志
pm2 logs water-delivery-api

# 重启服务
pm2 restart water-delivery-api

# 停止服务
pm2 stop water-delivery-api

# Nginx重载
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔐 安全配置

### 1. 修改SSH端口

```bash
sudo nano /etc/ssh/sshd_config
# 修改 Port 22 为其他端口
sudo systemctl restart sshd
```

### 2. 配置防火墙

```bash
sudo apt install -y ufw
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 3. 配置自动备份

```bash
# 创建备份脚本
nano backup.sh

# 添加到crontab
crontab -e
# 添加：0 2 * * * /path/to/backup.sh
```

---

## 📊 监控和维护

### 查看系统资源

```bash
# CPU和内存
htop

# 磁盘使用
df -h

# 网络流量
nload
```

### 查看日志

```bash
# 应用日志
tail -f backend/logs/app.log

# Nginx日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PM2日志
pm2 logs
```

---

## ❓ 常见问题

### 1. 端口被占用

```bash
# 查看端口占用
sudo lsof -i :3001
sudo lsof -i :80

# 杀死进程
sudo kill -9 <PID>
```

### 2. 权限问题

```bash
# 修改文件权限
sudo chown -R $USER:$USER ~/water-delivery
chmod -R 755 ~/water-delivery
```

### 3. Docker容器无法启动

```bash
# 查看详细日志
docker-compose logs backend

# 重新构建
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### 4. Nginx 404错误

```bash
# 检查配置
sudo nginx -t

# 检查文件权限
ls -la frontend/dist/

# 重启Nginx
sudo systemctl restart nginx
```

---

## 📞 获取帮助

- 详细部署文档：`DEPLOYMENT_GUIDE.md`
- 部署检查清单：`DEPLOYMENT_CHECKLIST.md`
- 项目README：`README.md`

---

## 🎉 部署完成

恭喜！您的桶装水配送系统已成功部署到云服务器。

### 后续步骤

1. **配置域名和SSL**：使用Let's Encrypt免费SSL证书
2. **设置自动备份**：定期备份数据库和上传文件
3. **配置监控告警**：使用PM2监控、设置告警通知
4. **性能优化**：配置CDN、优化数据库查询
5. **安全加固**：定期更新系统、检查安全日志

### 默认账号

首次登录需要创建管理员账号，请访问管理端进行注册。

---

**祝您使用愉快！** 🚀
