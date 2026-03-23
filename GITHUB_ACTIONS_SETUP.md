# GitHub Actions 自动部署设置指南

仓库: https://github.com/d421939142/tongzhuangshuipeisongruanjian.git

---

## 🚀 设置步骤（只需要操作一次）

### 第1步：在服务器上生成SSH密钥

连接到服务器：

```bash
ssh root@43.138.207.105
```

在服务器上执行：

```bash
# 生成SSH密钥（如果还没有）
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions -N ""

# 查看公钥
cat ~/.ssh/github_actions.pub
```

**复制输出的公钥内容！**

---

### 第2步：在GitHub上添加部署密钥

1. 打开您的GitHub仓库
   https://github.com/d421939142/tongzhuangshuipeisongruanjian

2. 点击 **Settings** → **Secrets and variables** → **Actions**

3. 点击 **New repository secret**

4. 添加第一个Secret：
   - **Name**: `SSH_PRIVATE_KEY`
   - **Value**: 粘贴服务器上的**私钥**内容
   ```bash
   # 在服务器上执行获取私钥
   cat ~/.ssh/github_actions
   ```
   点击 **Add secret**

5. 点击 **Deploy keys** → **Add deploy key**

6. 添加Deploy key：
   - **Title**: `Auto Deploy Key`
   - **Key**: 粘贴步骤1复制的**公钥**内容
   - 勾选 **Allow write access**
   - 点击 **Add key**

---

### 第3步：在服务器上配置Git

在服务器上执行：

```bash
# 安装Git（如果没有）
apt install -y git

# 配置Git用户信息
git config --global user.name "Auto Deploy"
git config --global user.email "auto@deploy.com"

# 测试连接
ssh -i ~/.ssh/github_actions -T git@github.com
```

如果看到 "Hi username! You've successfully authenticated..." 说明配置成功！

---

### 第4步：推送代码到GitHub

在**本地电脑**执行：

```bash
cd "d:/CodeBuddy CN/桶装水APP/water-delivery-new"

# 初始化Git仓库（如果还没有）
git init
git add .
git commit -m "Initial commit"

# 添加远程仓库
git remote add origin https://github.com/d421939142/tongzhuangshuipeisongruanjian.git

# 推送代码
git branch -M main
git push -u origin main
```

**第一次推送需要输入GitHub用户名和密码（或Personal Access Token）**

---

### 第5步：查看自动部署

推送代码后：

1. 访问仓库的 **Actions** 标签页
   https://github.com/d421939142/tongzhuangshuipeisongruanjian/actions

2. 您会看到 "Deploy to Server" 工作流正在运行

3. 等待几分钟，查看部署日志

4. 部署成功后，访问 http://43.138.207.105

---

## 🎯 之后如何使用？

### 更新代码后自动部署

在本地修改代码后，只需：

```bash
git add .
git commit -m "描述您的修改"
git push
```

推送代码后，GitHub Actions会自动部署到服务器！

### 手动触发部署

1. 访问仓库的 **Actions** 标签页
2. 点击 "Deploy to Server"
3. 点击 "Run workflow"
4. 选择分支，点击 "Run workflow" 按钮

---

## 🔍 故障排查

### 问题1：部署失败 - SSH连接错误

**解决：**
```bash
# 在服务器上重新配置
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions -N ""
cat ~/.ssh/github_actions.pub
```

重新在GitHub上添加公钥和私钥

### 问题2：部署失败 - 权限错误

**解决：**
```bash
# 在服务器上执行
chmod 600 ~/.ssh/github_actions
chmod 644 ~/.ssh/github_actions.pub

# 将公钥添加到authorized_keys
cat ~/.ssh/github_actions.pub >> ~/.ssh/authorized_keys
```

### 问题3：Docker构建失败

**解决：**
```bash
# 在服务器上手动运行
cd ~/water-delivery
docker-compose -f docker-compose.prod.yml logs
```

查看具体错误信息

### 问题4：端口被占用

**解决：**
```bash
# 在服务器上执行
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3001/tcp
systemctl stop nginx  # 停止系统Nginx，使用Docker中的
```

---

## 📊 部署流程图

```
本地代码修改
    ↓
git push
    ↓
GitHub触发Actions
    ↓
拉取代码到服务器
    ↓
安装/检查依赖
    ↓
构建前端
    ↓
启动Docker服务
    ↓
部署完成
    ↓
访问 http://43.138.207.105
```

---

## ✅ 部署完成检查清单

- [ ] 服务器上已生成SSH密钥
- [ ] GitHub上已添加SSH_PRIVATE_KEY
- [ ] GitHub上已添加Deploy key
- [ ] 服务器上已安装Git
- [ ] 代码已推送到GitHub
- [ ] GitHub Actions正在运行
- [ ] 部署成功
- [ ] 可以访问 http://43.138.207.105

---

## 🎉 完成后

首次部署完成后：

1. **访问系统**: http://43.138.207.105
2. **注册管理员账号**
3. **开始使用系统**

以后每次更新代码，只需要：
```bash
git add .
git commit -m "更新内容"
git push
```

自动部署！

---

## 📞 需要帮助？

如果在设置过程中遇到问题：

1. 查看GitHub Actions日志
2. 查看服务器日志: `docker-compose logs`
3. 告诉我具体的错误信息

我会立即帮您解决！
