# SSH连接问题解决方案

## 问题：Host key verification failed

这是因为服务器的SSH密钥已经更改，但您的本地还保存着旧的记录。

---

## 🔧 解决方法

### 方法1：删除旧的SSH密钥记录（推荐）

在Git Bash中执行：

```bash
# 删除对应服务器的SSH记录
ssh-keygen -R 43.138.207.105
```

然后重新连接：

```bash
ssh root@43.138.207.105
```

第一次连接会提示：
```
The authenticity of host '43.138.207.105' can't be established.
ED25519 key fingerprint is SHA256:xxx.
Are you sure you want to continue connecting (yes/no)?
```

输入：`yes`

然后输入密码即可连接成功！

---

### 方法2：手动删除known_hosts文件

如果方法1不行，试试这个：

```bash
# 删除known_hosts文件
rm ~/.ssh/known_hosts
```

然后重新连接：

```bash
ssh root@43.138.207.105
```

输入 `yes` 和密码。

---

### 方法3：使用特定参数跳过验证（临时方案）

```bash
ssh -o StrictHostKeyChecking=no root@43.138.207.105
```

这会跳过密钥验证，直接连接。

---

## ✅ 连接成功后的操作

连接到服务器后，执行以下命令：

```bash
# 1. 更新系统
apt update && apt upgrade -y

# 2. 安装Git（如果没有）
apt install -y git

# 3. 生成SSH密钥
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions -N ""

# 4. 查看公钥（复制这个内容）
cat ~/.ssh/github_actions.pub
```

**复制公钥内容，用于GitHub配置！**

---

## 📋 完整操作步骤

### 第1步：修复SSH连接问题

在Git Bash中执行：

```bash
ssh-keygen -R 43.138.207.105
```

### 第2步：连接到服务器

```bash
ssh root@43.138.207.105
```

输入 `yes` 和密码

### 第3步：生成SSH密钥

```bash
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_actions -N ""
cat ~/.ssh/github_actions.pub
```

复制输出的公钥！

### 第4步：配置GitHub

1. 打开：https://github.com/d421939142/tongzhuangshuipeisongruanjian/settings/keys

2. 添加Deploy Key：
   - Title: `Auto Deploy Key`
   - Key: 粘贴刚才复制的公钥
   - 勾选 **Allow write access**
   - 点击 **Add key**

3. 添加SSH_PRIVATE_KEY：
   - 访问：https://github.com/d421939142/tongzhuangshuipeisongruanjian/settings/secrets/actions
   - 点击 **New repository secret**
   - Name: `SSH_PRIVATE_KEY`
   - Value: 粘贴服务器上的私钥（`cat ~/.ssh/github_actions`）
   - 点击 **Add secret**

### 第5步：推送代码

在本地执行：

```bash
cd "d:/CodeBuddy CN/桶装水APP/water-delivery-new"
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/d421939142/tongzhuangshuipeisongruanjian.git
git branch -M main
git push -u origin main
```

---

## ❓ 其他常见SSH问题

### 问题：Connection refused

**解决：** 检查服务器是否运行，IP地址是否正确

### 问题：Permission denied

**解决：** 检查用户名和密码是否正确

### 问题：Connection timed out

**解决：** 检查网络连接，服务器防火墙是否开放22端口

---

## ✅ 现在开始操作

**第1步：修复SSH连接**

在Git Bash中执行：

```bash
ssh-keygen -R 43.138.207.105
```

**第2步：重新连接**

```bash
ssh root@43.138.207.105
```

输入 `yes` 和密码

---

完成SSH连接后，告诉我，我继续指导下一步！
