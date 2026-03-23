# 一键自动化部署指南 - 服务器 43.138.207.105

## 🚀 最简单的部署方式

我为您创建了一个**全自动部署脚本**，只需要两步就能完成所有配置和部署！

---

## 📋 部署前准备

### 必要条件
1. ✅ 服务器IP：43.138.207.105
2. ✅ 服务器密码
3. ✅ SSH访问权限
4. ✅ 本地项目代码（water-delivery-new 文件夹）

---

## 🎯 只需两步，立即部署！

### 步骤 1：上传项目到服务器

#### 方法A：使用WinSCP（Windows用户，推荐）

1. **下载并安装WinSCP**
   - 下载地址：https://winscp.net/
   - 安装后打开WinSCP

2. **连接到服务器**
   - 文件协议：SFTP
   - 主机名：`43.138.207.105`
   - 端口：`22`
   - 用户名：`root`
   - 密码：您的服务器密码
   - 点击"登录"

3. **上传项目**
   - 在左侧（本地）找到 `water-delivery-new` 文件夹
   - 右键点击，选择"上传"
   - 上传到服务器的 `/root/` 目录

4. **重命名项目**
   - 在服务器端（右侧），右键点击 `water-delivery-new`
   - 选择"重命名"
   - 改名为 `water-delivery`

完成！项目已上传。

#### 方法B：使用SCP命令（Mac/Linux用户）

在本地终端执行：

```bash
# 进入项目目录
cd "d:/CodeBuddy CN/桶装水APP"

# 上传项目（这可能需要几分钟）
scp -r water-delivery-new root@43.138.207.105:~/

# 在服务器上重命名
ssh root@43.138.207.105 "mv ~/water-delivery-new ~/water-delivery"
```

#### 方法C：使用Git克隆（如果项目已推送到Git）

```bash
# 连接到服务器
ssh root@43.138.207.105

# 克隆项目
cd ~
git clone https://github.com/your-username/your-repo.git water-delivery
```

---

### 步骤 2：运行全自动部署脚本

#### 方法A：在服务器上运行（推荐）

1. **连接到服务器**
   ```bash
   ssh root@43.138.207.105
   ```

2. **进入项目目录**
   ```bash
   cd ~/water-delivery
   ```

3. **执行部署脚本**
   ```bash
   chmod +x auto-deploy.sh
   ./auto-deploy.sh
   ```

4. **等待完成**
   - 脚本会自动完成所有配置
   - 预计耗时：15-30分钟
   - 期间不需要任何操作

5. **完成！**
   - 部署完成后，访问 http://43.138.207.105

---

## 📝 脚本会自动做什么？

全自动部署脚本会自动执行以下所有操作：

| 步骤 | 操作 | 说明 |
|------|------|------|
| 1 | 更新系统 | apt update && upgrade |
| 2 | 安装基础工具 | git, curl, wget, vim等 |
| 3 | 安装Node.js | Node.js 18.x |
| 4 | 安装Docker | Docker + Docker Compose |
| 5 | 安装PM2和Nginx | 进程管理和Web服务器 |
| 6 | 配置防火墙 | 开放80, 443, 3001端口 |
| 7 | 配置时区和系统 | Asia/Shanghai + 优化参数 |
| 8 | 创建项目目录 | ~/water-delivery, ~/backups, ~/logs |
| 9 | 检查项目代码 | 验证代码是否存在 |
| 10 | 创建环境变量 | 自动生成API_KEY |
| 11 | 构建前端 | npm run build |
| 12 | 启动Docker服务 | docker-compose up -d |
| 13 | 配置Nginx | 使用Docker中的Nginx |
| 14 | 验证部署 | 检查所有服务状态 |
| 15 | 设置自动备份 | 每天凌晨2点自动备份 |

---

## ✅ 部署完成后

### 1. 访问系统

在浏览器中打开：

- **管理端**: http://43.138.207.105
- **配送APP**: http://43.138.207.105/delivery
- **后端API**: http://43.138.207.105/api

### 2. 首次使用

1. 打开管理端
2. 注册管理员账号
3. 登录系统
4. 开始添加产品、客户、送水工等数据

---

## 🔧 常用命令

### 查看服务状态
```bash
cd ~/water-delivery
docker-compose -f docker-compose.prod.yml ps
```

### 查看日志
```bash
cd ~/water-delivery
docker-compose -f docker-compose.prod.yml logs -f
```

### 重启服务
```bash
cd ~/water-delivery
docker-compose -f docker-compose.prod.yml restart
```

### 停止服务
```bash
cd ~/water-delivery
docker-compose -f docker-compose.prod.yml down
```

### 启动服务
```bash
cd ~/water-delivery
docker-compose -f docker-compose.prod.yml up -d
```

### 手动备份
```bash
cd ~/water-delivery
./backup.sh
```

---

## ❓ 常见问题

### 1. 上传项目时断开连接
- **解决**: 使用WinSCP的"断点续传"功能，或使用Git克隆

### 2. 部署脚本执行失败
- **解决**: 检查项目代码是否完整上传，确保所有文件都在

### 3. 端口被占用
- **解决**: 脚本会自动处理，如果仍有问题，检查防火墙设置

### 4. 无法访问网站
- **解决**: 等待2-3分钟，服务可能还在启动中；检查防火墙是否开放80端口

### 5. 构建失败
- **解决**: 检查网络连接，确保能访问npm registry

---

## 📊 部署时间估算

| 操作 | 预计时间 |
|------|----------|
| 上传项目 | 5-10分钟 |
| 系统更新 | 2-3分钟 |
| 安装软件 | 5-8分钟 |
| 构建前端 | 5-10分钟 |
| 启动服务 | 1-2分钟 |
| **总计** | **15-30分钟** |

---

## 🎉 部署完成后检查清单

- [ ] 可以访问 http://43.138.207.105
- [ ] 可以访问 http://43.138.207.105/delivery
- [ ] 可以访问 http://43.138.207.105/api/health
- [ ] 所有Docker容器都是 "Up" 状态
- [ ] 可以注册和登录管理员账号
- [ ] 可以添加产品、客户、送水工等数据

---

## 🆘 需要帮助？

如果在部署过程中遇到任何问题：

1. **查看日志文件**
   ```bash
   cat ~/logs/deploy-*.log
   ```

2. **查看Docker日志**
   ```bash
   cd ~/water-delivery
   docker-compose -f docker-compose.prod.yml logs
   ```

3. **检查服务状态**
   ```bash
   cd ~/water-delivery
   docker-compose -f docker-compose.prod.yml ps
   ```

4. **告诉我问题**
   - 告诉我具体在哪一步失败
   - 告诉我错误信息是什么
   - 我会立即帮您解决

---

## 🚀 现在就开始！

**只需要两步：**

1. ✅ 上传项目到服务器（使用WinSCP或SCP）
2. ✅ 运行 `./auto-deploy.sh`

就这么简单！15分钟后您的系统就会运行在服务器上。

---

**准备好了吗？开始吧！** 🎯
