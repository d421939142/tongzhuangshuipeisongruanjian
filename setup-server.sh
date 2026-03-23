#!/bin/bash

# 桶装水配送系统 - 服务器初始化配置脚本
# 适用于 Ubuntu 20.04+ / CentOS 7+

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检测系统
detect_system() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS=$ID
        VERSION=$VERSION_ID
    else
        print_error "无法检测操作系统"
        exit 1
    fi
    print_info "检测到操作系统: $PRETTY_NAME"
}

# 更新系统
update_system() {
    print_info "更新系统..."

    if [ "$OS" == "ubuntu" ] || [ "$OS" == "debian" ]; then
        sudo apt update
        sudo apt upgrade -y
        sudo apt autoremove -y
    elif [ "$OS" == "centos" ] || [ "$OS" == "rhel" ]; then
        sudo yum update -y
        sudo yum autoremove -y
    fi

    print_success "系统更新完成"
}

# 安装基础工具
install_base_tools() {
    print_info "安装基础工具..."

    if [ "$OS" == "ubuntu" ] || [ "$OS" == "debian" ]; then
        sudo apt install -y git curl wget vim net-tools unzip ufw
    elif [ "$OS" == "centos" ] || [ "$OS" == "rhel" ]; then
        sudo yum install -y git curl wget vim net-tools unzip firewalld
    fi

    print_success "基础工具安装完成"
}

# 安装Node.js
install_nodejs() {
    print_info "安装Node.js 18.x..."

    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        print_info "Node.js已安装: $NODE_VERSION"
        return
    fi

    if [ "$OS" == "ubuntu" ] || [ "$OS" == "debian" ]; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt install -y nodejs
    elif [ "$OS" == "centos" ] || [ "$OS" == "rhel" ]; then
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs
    fi

    # 验证安装
    node -v
    npm -v

    print_success "Node.js安装完成"
}

# 安装Docker
install_docker() {
    print_info "安装Docker..."

    if command -v docker &> /dev/null; then
        print_info "Docker已安装"
        return
    fi

    if [ "$OS" == "ubuntu" ] || [ "$OS" == "debian" ]; then
        curl -fsSL https://get.docker.com | sudo sh
        sudo usermod -aG docker $USER
    elif [ "$OS" == "centos" ] || [ "$OS" == "rhel" ]; then
        sudo yum install -y docker
        sudo systemctl start docker
        sudo systemctl enable docker
        sudo usermod -aG docker $USER
    fi

    # 验证安装
    sudo docker --version

    print_success "Docker安装完成"
    print_warning "请注销后重新登录以使docker组生效"
}

# 安装Docker Compose
install_docker_compose() {
    print_info "安装Docker Compose..."

    if command -v docker-compose &> /dev/null; then
        print_info "Docker Compose已安装"
        return
    fi

    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose

    # 验证安装
    docker-compose --version

    print_success "Docker Compose安装完成"
}

# 安装PM2
install_pm2() {
    print_info "安装PM2..."

    if command -v pm2 &> /dev/null; then
        print_info "PM2已安装"
        return
    fi

    sudo npm install -g pm2

    print_success "PM2安装完成"
}

# 安装Nginx
install_nginx() {
    print_info "安装Nginx..."

    if command -v nginx &> /dev/null; then
        print_info "Nginx已安装"
        return
    fi

    if [ "$OS" == "ubuntu" ] || [ "$OS" == "debian" ]; then
        sudo apt install -y nginx
    elif [ "$OS" == "centos" ] || [ "$OS" == "rhel" ]; then
        sudo yum install -y nginx
        sudo systemctl start nginx
        sudo systemctl enable nginx
    fi

    print_success "Nginx安装完成"
}

# 配置防火墙
configure_firewall() {
    print_info "配置防火墙..."

    if [ "$OS" == "ubuntu" ] || [ "$OS" == "debian" ]; then
        sudo ufw --force enable
        sudo ufw allow 22/tcp    # SSH
        sudo ufw allow 80/tcp    # HTTP
        sudo ufw allow 443/tcp   # HTTPS
        sudo ufw allow 3001/tcp  # 后端API
        sudo ufw status
    elif [ "$OS" == "centos" ] || [ "$OS" == "rhel" ]; then
        sudo systemctl start firewalld
        sudo systemctl enable firewalld
        sudo firewall-cmd --permanent --add-service=ssh
        sudo firewall-cmd --permanent --add-service=http
        sudo firewall-cmd --permanent --add-service=https
        sudo firewall-cmd --permanent --add-port=3001/tcp
        sudo firewall-cmd --reload
        sudo firewall-cmd --list-all
    fi

    print_success "防火墙配置完成"
}

# 配置SSH
configure_ssh() {
    print_info "配置SSH安全..."

    # 备份SSH配置
    sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

    # 安全设置（可选）
    # print_info "禁用root登录和密码登录"
    # sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
    # sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config

    print_success "SSH配置完成"
    print_warning "请手动检查 /etc/ssh/sshd_config 配置"
}

# 安装Git
install_git() {
    print_info "安装Git..."

    if command -v git &> /dev/null; then
        print_info "Git已安装"
        return
    fi

    if [ "$OS" == "ubuntu" ] || [ "$OS" == "debian" ]; then
        sudo apt install -y git
    elif [ "$OS" == "centos" ] || [ "$OS" == "rhel" ]; then
        sudo yum install -y git
    fi

    print_success "Git安装完成"
}

# 配置时区
configure_timezone() {
    print_info "配置时区..."

    sudo timedatectl set-timezone Asia/Shanghai
    timedatectl

    print_success "时区配置完成"
}

# 优化系统参数
optimize_system() {
    print_info "优化系统参数..."

    if [ "$OS" == "ubuntu" ] || [ "$OS" == "debian" ]; then
        # 增加文件描述符限制
        echo "* soft nofile 65535" | sudo tee -a /etc/security/limits.conf
        echo "* hard nofile 65535" | sudo tee -a /etc/security/limits.conf

        # 优化内核参数
        sudo tee -a /etc/sysctl.conf << EOF
# 网络优化
net.core.somaxconn = 1024
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 1024
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 30
EOF

        sudo sysctl -p
    fi

    print_success "系统参数优化完成"
}

# 创建项目目录
create_project_dir() {
    print_info "创建项目目录..."

    mkdir -p ~/water-delivery
    mkdir -p ~/backups
    mkdir -p ~/logs

    print_success "项目目录创建完成"
}

# 显示系统信息
show_system_info() {
    echo ""
    echo "=========================================="
    echo "  系统信息"
    echo "=========================================="
    echo "操作系统: $(uname -a)"
    echo "内存: $(free -h | grep Mem | awk '{print $2}')"
    echo "磁盘: $(df -h / | tail -1 | awk '{print $2}')"
    echo "CPU: $(nproc) 核"
    echo "IP地址: $(curl -s ifconfig.me)"
    echo "=========================================="
    echo ""
}

# 显示安装结果
show_result() {
    echo ""
    echo "=========================================="
    echo "  配置完成！"
    echo "=========================================="
    echo ""
    echo "已安装的软件:"
    echo "  - Node.js: $(node -v 2>/dev/null || echo '未安装')"
    echo "  - npm: $(npm -v 2>/dev/null || echo '未安装')"
    echo "  - Docker: $(docker --version 2>/dev/null || echo '未安装')"
    echo "  - Docker Compose: $(docker-compose --version 2>/dev/null || echo '未安装')"
    echo "  - PM2: $(pm2 -v 2>/dev/null || echo '未安装')"
    echo "  - Nginx: $(nginx -v 2>&1 | grep -oP 'nginx/\K[0-9.]+' || echo '未安装')"
    echo ""
    echo "开放的端口:"
    echo "  - SSH: 22"
    echo "  - HTTP: 80"
    echo "  - HTTPS: 443"
    echo "  - 后端API: 3001"
    echo ""
    echo "项目目录:"
    echo "  - ~/water-delivery"
    echo "  - ~/backups"
    echo "  - ~/logs"
    echo ""
    echo "服务器IP: $(curl -s ifconfig.me)"
    echo ""
    echo "=========================================="
    echo "  下一步"
    echo "=========================================="
    echo "1. 重新登录以使docker组生效"
    echo "2. 上传项目代码到 ~/water-delivery"
    echo "3. 按照部署文档配置环境变量"
    echo "4. 启动服务"
    echo "=========================================="
    echo ""
}

# 主函数
main() {
    echo "=========================================="
    echo "  桶装水配送系统 - 服务器初始化配置"
    echo "=========================================="
    echo ""
    echo "服务器IP: 43.138.207.105"
    echo ""
    echo "本脚本将执行以下操作:"
    echo "  1. 更新系统"
    echo "  2. 安装基础工具"
    echo "  3. 安装Node.js 18.x"
    echo "  4. 安装Docker和Docker Compose"
    echo "  5. 安装PM2和Nginx"
    echo "  6. 配置防火墙"
    echo "  7. 配置SSH安全"
    echo "  8. 优化系统参数"
    echo ""
    read -p "是否继续? (y/n): " confirm

    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        print_info "已取消"
        exit 0
    fi

    echo ""
    detect_system
    show_system_info

    update_system
    install_base_tools
    install_git
    install_nodejs
    install_docker
    install_docker_compose
    install_pm2
    install_nginx
    configure_firewall
    configure_ssh
    configure_timezone
    optimize_system
    create_project_dir

    show_result

    print_success "服务器配置完成！"
}

# 运行主函数
main
