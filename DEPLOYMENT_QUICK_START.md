# 服务器配置快速指南 - 43.138.207.105

## 📋 准备工作

### 1. 准备工具
- SSH客户端（推荐使用 PuTTY、Termius 或直接使用命令行）
- SCP/SFTP工具（推荐 WinSCP、FileZilla）

### 2. 获取服务器信息
- **服务器IP**: 43.138.207.105
- **SSH端口**: 22（默认）
- **用户名**: root（或您创建的用户）
- **密码**: 您的登录密码

---

## 🚀 第一步：连接服务器

### 方法1：使用命令行（推荐）

```bash
# 连接到服务器
ssh root@43.138.207.105

# 输入密码
```

### 方法2：使用PuTTY（Windows）

1. 打开PuTTY
2. Host Name: `43.138.207.105`
3. Port: `22`
4. 点击 "Open"
5. 输入用户名和密码

### 方法3：使用Termius

1. 新建主机
2. Hostname: `43.138.207.105`
3. Port: `22`
4. Username: `root`
5. 连接

---

## 🔧 第二步：运行配置脚本

### 1. 上传配置脚本

**方式A：使用WinSCP上传**
1. 连接到服务器
2. 将 `setup-server.sh` 上传到 `/root/` 或 `/home/your-username/`

**方式B：直接在服务器上创建**
```bash
# 连接到服务器后，创建并编辑脚本
cd ~
nano setup-server.sh
```

将脚本内容粘贴进去，按 `Ctrl+X`，然后 `Y`，最后 `Enter` 保存。

### 2. 赋予执行权限

```bash
chmod +x setup-server.sh
```

### 3. 运行配置脚本

```bash
./setup-server.sh
```

脚本会自动执行以下操作：
- ✅ 更新系统
- ✅ 安装Node.js 18.x
- ✅ 安装Docker和Docker Compose
- ✅ 安装PM2和Nginx
- ✅ 配置防火墙
- ✅ 优化系统参数
- ✅ 创建项目目录

### 4. 配置完成后重新登录

```bash
# 退出
exit

# 重新登录
ssh root@43.138.207.105
```

---

## 📦 第三步：上传项目代码

### 方法1：使用Git克隆（推荐）

```bash
cd ~/water-delivery

# 如果项目已推送到Git仓库
git clone https://github.com/your-username/water-delivery.git .
```

### 方法2：使用SCP上传（在本地执行）

```bash
# 在本地终端执行
scp -r water-delivery-new root@43.138.207.105:~/water-delivery/
```

### 方法3：使用WinSCP上传

1. 连接到服务器
2. 进入 `~/water-delivery` 目录
3. 上传整个 `water-delivery-new` 文件夹
4. 在服务器上重命名：
```bash
cd ~/water-delivery
mv water-delivery-new/* .
rm -rf water-delivery-new
```

---

## ⚙️ 第四步：配置环境变量

```bash
cd ~/water-delivery

# 进入生产环境配置目录
mkdir -p prod
cd prod

# 创建环境变量文件
nano .env
```

添加以下内容：

```env
# 后端配置
NODE_ENV=production
BACKEND_PORT=3001
API_KEY=your-secure-api-key-change-this-to-random-string
DB_PATH=/app/data/database.db
LOG_LEVEL=info
LOG_PATH=/app/logs

# 前端配置
VITE_API_URL=http://43.138.207.105/api
VITE_APP_TITLE=桶装水配送管理系统

# 配送APP配置
VITE_DELIVERY_API_URL=http://43.138.207.105/api
VITE_DELIVERY_APP_TITLE=配送助手

# Nginx配置
NGINX_PORT=80
DOMAIN=43.138.207.105
DELIVERY_DOMAIN=43.138.207.105
```

**重要提示：**
- 将 `your-secure-api-key-change-this-to-random-string` 替换为随机字符串
- 可以使用生成器：`openssl rand -base64 32`

---

## 🐳 第五步：使用Docker部署

### 1. 构建Docker镜像

```bash
cd ~/water-delivery

# 构建镜像（第一次需要较长时间）
docker-compose -f docker-compose.prod.yml build
```

### 2. 启动服务

```bash
# 启动所有容器
docker-compose -f docker-compose.prod.yml up -d

# 查看容器状态
docker-compose -f docker-compose.prod.yml ps
```

### 3. 查看日志

```bash
# 查看所有日志
docker-compose -f docker-compose.prod.yml logs -f

# 查看后端日志
docker-compose -f docker-compose.prod.yml logs -f backend

# 查看Nginx日志
docker-compose -f docker-compose.prod.yml logs -f nginx
```

---

## 🌐 第六步：配置域名（可选）

如果您有域名，可以配置DNS解析：

### 1. 添加DNS记录

在您的域名DNS管理中添加：

| 类型 | 主机记录 | 记录值 |
|------|----------|--------|
| A | @ | 43.138.207.105 |
| A | www | 43.138.207.105 |
| A | delivery | 43.138.207.105 |

### 2. 修改环境变量

```bash
cd ~/water-delivery/prod
nano .env
```

修改为：
```env
VITE_API_URL=http://your-domain.com/api
VITE_DELIVERY_API_URL=http://your-domain.com/api
DOMAIN=your-domain.com
DELIVERY_DOMAIN=your-domain.com
```

### 3. 重启服务

```bash
cd ~/water-delivery
docker-compose -f docker-compose.prod.yml restart
```

---

## 🔐 第七步：配置SSL证书（推荐）

### 1. 安装Certbot

```bash
sudo apt install -y certbot
```

### 2. 获取SSL证书

```bash
# 使用IP地址（临时证书，不建议生产环境）
# 如果有域名，直接使用域名

sudo certbot certonly --standalone -d 43.138.207.105
```

**如果有域名：**
```bash
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com -d delivery.your-domain.com
```

### 3. 复制证书到项目目录

```bash
sudo mkdir -p ~/water-delivery/nginx/ssl

# 复制证书
sudo cp /etc/letsencrypt/live/43.138.207.105/fullchain.pem ~/water-delivery/nginx/ssl/
sudo cp /etc/letsencrypt/live/43.138.207.105/privkey.pem ~/water-delivery/nginx/ssl/

# 设置权限
sudo chown -R $USER:$USER ~/water-delivery/nginx/ssl
chmod 600 ~/water-delivery/nginx/ssl/*.pem
```

### 4. 更新Nginx配置启用HTTPS

编辑 `nginx/conf.d/default.conf`，取消HTTPS配置的注释。

---

## 🧪 第八步：测试访问

### 1. 检查服务状态

```bash
# 查看容器状态
docker-compose -f docker-compose.prod.yml ps

# 应该看到所有容器都是 "Up" 状态
```

### 2. 测试后端API

```bash
# 测试健康检查
curl http://43.138.207.105/api/health

# 应该返回：{"status":"ok","timestamp":"..."}
```

### 3. 访问前端

在浏览器中打开：

- **管理端**: http://43.138.207.105
- **配送APP**: http://43.138.207.105/delivery

### 4. 测试登录

首次访问需要创建管理员账号，请按提示注册。

---

## 🔄 第九步：配置自动备份

### 1. 创建备份脚本

```bash
cd ~/water-delivery
chmod +x backup.sh
```

### 2. 测试备份

```bash
./backup.sh
```

### 3. 设置定时备份

```bash
# 编辑crontab
crontab -e

# 添加以下行（每天凌晨2点备份）
0 2 * * * /home/your-username/water-delivery/backup.sh >> ~/logs/backup.log 2>&1
```

---

## 📊 第十步：监控和维护

### 1. 查看系统资源

```bash
# CPU和内存
htop

# 磁盘使用
df -h

# Docker资源
docker stats
```

### 2. 查看日志

```bash
# 后端日志
docker-compose -f docker-compose.prod.yml logs backend

# Nginx日志
docker-compose -f docker-compose.prod.yml logs nginx

# PM2日志（如果使用传统部署）
pm2 logs
```

### 3. 常用命令

```bash
# 重启服务
docker-compose -f docker-compose.prod.yml restart

# 停止服务
docker-compose -f docker-compose.prod.yml down

# 启动服务
docker-compose -f docker-compose.prod.yml up -d

# 查看日志
docker-compose -f docker-compose.prod.yml logs -f

# 更新镜像
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

---

## ❓ 常见问题

### 1. 端口被占用

```bash
# 查看端口占用
sudo lsof -i :80
sudo lsof -i :3001

# 停止占用端口的进程
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
docker-compose -f docker-compose.prod.yml logs backend

# 重新构建
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### 4. 无法访问网站

```bash
# 检查防火墙
sudo ufw status

# 检查Nginx配置
docker-compose -f docker-compose.prod.yml logs nginx

# 检查DNS解析（如果有域名）
nslookup your-domain.com
```

### 5. 数据库连接失败

```bash
# 检查数据库文件
ls -la ~/water-delivery/backend/data/

# 检查权限
chmod 666 ~/water-delivery/backend/data/database.db
```

---

## 📝 配置检查清单

- [ ] 服务器连接成功
- [ ] 配置脚本执行成功
- [ ] Docker和Docker Compose已安装
- [ ] Node.js已安装
- [ ] Nginx已安装
- [ ] 项目代码已上传
- [ ] 环境变量已配置
- [ ] Docker镜像构建成功
- [ ] 服务已启动
- [ ] 后端API可访问
- [ ] 前端页面可访问
- [ ] 配送APP可访问
- [ ] 自动备份已配置
- [ ] 防火墙规则已配置
- [ ] SSL证书已配置（可选）

---

## 🎉 完成！

恭喜！您的桶装水配送系统已成功部署到服务器 43.138.207.105。

### 访问地址

- **管理端**: http://43.138.207.105
- **配送APP**: http://43.138.207.105/delivery
- **后端API**: http://43.138.207.105/api

### 下一步

1. ✅ 注册管理员账号
2. ✅ 添加产品信息
3. ✅ 添加客户信息
4. ✅ 添加送水工账号
5. ✅ 开始使用系统

---

## 📞 需要帮助？

如遇到问题，请查看：
- 详细部署文档：`DEPLOYMENT_GUIDE.md`
- 错误日志：`docker-compose logs`
- 系统监控：`htop`, `docker stats`

祝您使用愉快！🚀
