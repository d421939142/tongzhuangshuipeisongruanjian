#!/bin/bash

# 桶装水配送系统 - 全自动部署脚本
# 使用方法: chmod +x auto-deploy.sh && ./auto-deploy.sh

set -e

# 配置
SERVER_IP="43.138.207.105"
PROJECT_NAME="water-delivery"
PROJECT_DIR="$HOME/$PROJECT_NAME"
BACKUP_DIR="$HOME/backups"
LOG_FILE="$HOME/logs/deploy-$(date +%Y%m%d_%H%M%S).log"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 日志函数
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

print_info() {
    log "${BLUE}[INFO]${NC} $1"
}

print_success() {
    log "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    log "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    log "${RED}[ERROR]${NC} $1"
}

# 创建日志目录
mkdir -p "$(dirname "$LOG_FILE")"

# 步骤1：系统更新
step1_update_system() {
    print_info "步骤1: 更新系统..."
    apt update && apt upgrade -y
    apt autoremove -y
    print_success "系统更新完成"
}

# 步骤2：安装基础工具
step2_install_base_tools() {
    print_info "步骤2: 安装基础工具..."
    apt install -y git curl wget vim net-tools unzip ufw software-properties-common
    print_success "基础工具安装完成"
}

# 步骤3：安装Node.js
step3_install_nodejs() {
    print_info "步骤3: 安装Node.js 18.x..."

    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        print_info "Node.js已安装: $NODE_VERSION"
        return
    fi

    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs

    node -v
    npm -v

    print_success "Node.js安装完成"
}

# 步骤4：安装Docker
step4_install_docker() {
    print_info "步骤4: 安装Docker和Docker Compose..."

    if command -v docker &> /dev/null; then
        print_info "Docker已安装"
    else
        curl -fsSL https://get.docker.com | sh
        usermod -aG docker $USER
    fi

    if command -v docker-compose &> /dev/null; then
        print_info "Docker Compose已安装"
    else
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi

    docker --version
    docker-compose --version

    print_success "Docker和Docker Compose安装完成"
}

# 步骤5：安装PM2和Nginx
step5_install_pm2_nginx() {
    print_info "步骤5: 安装PM2和Nginx..."

    if ! command -v pm2 &> /dev/null; then
        npm install -g pm2
    fi

    if ! command -v nginx &> /dev/null; then
        apt install -y nginx
    fi

    pm2 -v
    nginx -v 2>&1 | grep nginx

    print_success "PM2和Nginx安装完成"
}

# 步骤6：配置防火墙
step6_configure_firewall() {
    print_info "步骤6: 配置防火墙..."

    ufw --force enable
    ufw allow 22/tcp
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw allow 3001/tcp

    print_success "防火墙配置完成"
}

# 步骤7：配置时区和系统优化
step7_configure_system() {
    print_info "步骤7: 配置时区和系统优化..."

    # 配置时区
    timedatectl set-timezone Asia/Shanghai

    # 优化系统参数
    cat >> /etc/sysctl.conf <<EOF

# 网络优化
net.core.somaxconn = 1024
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 1024
net.ipv4.tcp_tw_reuse = 1
net.ipv4.tcp_fin_timeout = 30
EOF

    sysctl -p > /dev/null 2>&1

    # 增加文件描述符限制
    cat >> /etc/security/limits.conf <<EOF
* soft nofile 65535
* hard nofile 65535
EOF

    print_success "系统配置完成"
}

# 步骤8：创建项目目录
step8_create_directories() {
    print_info "步骤8: 创建项目目录..."

    mkdir -p "$PROJECT_DIR"
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$HOME/logs"

    print_success "项目目录创建完成"
}

# 步骤9：检查项目代码
step9_check_project() {
    print_info "步骤9: 检查项目代码..."

    if [ -z "$(ls -A $PROJECT_DIR)" ]; then
        print_error "项目目录为空！"
        print_info "请将项目代码上传到 $PROJECT_DIR 目录"
        print_info "或者使用Git克隆项目"
        echo ""
        print_info "等待中...请上传完成后按Enter继续"
        read

        # 再次检查
        if [ -z "$(ls -A $PROJECT_DIR)" ]; then
            print_error "项目目录仍然为空，无法继续"
            exit 1
        fi
    fi

    print_success "项目代码检查完成"
}

# 步骤10：创建环境变量
step10_create_env() {
    print_info "步骤10: 创建环境变量..."

    mkdir -p "$PROJECT_DIR/prod"

    ENV_FILE="$PROJECT_DIR/prod/.env"

    if [ ! -f "$ENV_FILE" ]; then
        cat > "$ENV_FILE" <<EOF
# 后端配置
NODE_ENV=production
BACKEND_PORT=3001
API_KEY=water-delivery-$(openssl rand -hex 16)
DB_PATH=/app/data/database.db
LOG_LEVEL=info
LOG_PATH=/app/logs

# 前端配置
VITE_API_URL=http://$SERVER_IP/api
VITE_APP_TITLE=桶装水配送管理系统

# 配送APP配置
VITE_DELIVERY_API_URL=http://$SERVER_IP/api
VITE_DELIVERY_APP_TITLE=配送助手

# Nginx配置
NGINX_PORT=80
DOMAIN=$SERVER_IP
DELIVERY_DOMAIN=$SERVER_IP
EOF

        print_success "环境变量文件创建完成"
    else
        print_info "环境变量文件已存在"
    fi
}

# 步骤11：构建前端
step11_build_frontend() {
    print_info "步骤11: 构建前端项目..."

    cd "$PROJECT_DIR/frontend"

    if [ ! -d "node_modules" ]; then
        print_info "安装前端依赖..."
        npm install
    fi

    print_info "构建管理端..."
    npm run build

    cd ../delivery-app

    if [ ! -d "node_modules" ]; then
        print_info "安装配送APP依赖..."
        npm install
    fi

    print_info "构建配送APP..."
    npm run build

    cd "$PROJECT_DIR"

    print_success "前端构建完成"
}

# 步骤12：启动Docker服务
step12_start_docker() {
    print_info "步骤12: 启动Docker服务..."

    cd "$PROJECT_DIR"

    # 检查Docker Compose文件
    if [ ! -f "docker-compose.prod.yml" ]; then
        print_error "docker-compose.prod.yml 不存在"
        return
    fi

    # 停止旧容器
    print_info "停止旧容器..."
    docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

    # 构建镜像
    print_info "构建Docker镜像（这可能需要几分钟）..."
    docker-compose -f docker-compose.prod.yml build

    # 启动服务
    print_info "启动服务..."
    docker-compose -f docker-compose.prod.yml up -d

    # 等待服务启动
    print_info "等待服务启动..."
    sleep 10

    # 查看状态
    docker-compose -f docker-compose.prod.yml ps

    print_success "Docker服务启动完成"
}

# 步骤13：配置Nginx
step13_configure_nginx() {
    print_info "步骤13: 配置Nginx..."

    # 停止系统Nginx（使用Docker中的Nginx）
    systemctl stop nginx 2>/dev/null || true
    systemctl disable nginx 2>/dev/null || true

    # 复制Nginx配置
    if [ -d "$PROJECT_DIR/nginx" ]; then
        print_info "Nginx配置已在Docker中配置"
    else
        print_warning "Nginx配置目录不存在，跳过"
    fi

    print_success "Nginx配置完成"
}

# 步骤14：验证部署
step14_verify() {
    print_info "步骤14: 验证部署..."

    # 检查容器状态
    echo ""
    print_info "检查容器状态..."
    docker-compose -f docker-compose.prod.yml ps

    # 检查后端API
    echo ""
    print_info "检查后端API..."
    sleep 5
    if curl -f http://localhost:3001/health > /dev/null 2>&1; then
        print_success "后端API正常"
    else
        print_warning "后端API可能还在启动中"
    fi

    print_success "部署验证完成"
}

# 步骤15：创建备份脚本
step15_setup_backup() {
    print_info "步骤15: 设置自动备份..."

    if [ -f "$PROJECT_DIR/backup.sh" ]; then
        chmod +x "$PROJECT_DIR/backup.sh"

        # 添加到crontab（每天凌晨2点备份）
        (crontab -l 2>/dev/null | grep -v "$PROJECT_DIR/backup.sh"; echo "0 2 * * * $PROJECT_DIR/backup.sh >> $LOG_FILE 2>&1") | crontab -

        print_success "自动备份已配置（每天凌晨2点）"
    else
        print_warning "备份脚本不存在，跳过"
    fi
}

# 显示部署结果
show_result() {
    echo ""
    echo "=========================================="
    echo "  部署完成！"
    echo "=========================================="
    echo ""
    echo "访问地址:"
    echo "  - 管理端:    http://$SERVER_IP"
    echo "  - 配送APP:   http://$SERVER_IP/delivery"
    echo "  - 后端API:   http://$SERVER_IP/api"
    echo ""
    echo "项目目录: $PROJECT_DIR"
    echo "日志目录: $HOME/logs"
    echo "备份目录: $BACKUP_DIR"
    echo ""
    echo "常用命令:"
    echo "  - 查看日志:   cd $PROJECT_DIR && docker-compose -f docker-compose.prod.yml logs -f"
    echo "  - 重启服务:   cd $PROJECT_DIR && docker-compose -f docker-compose.prod.yml restart"
    echo "  - 停止服务:   cd $PROJECT_DIR && docker-compose -f docker-compose.prod.yml down"
    echo "  - 查看状态:   cd $PROJECT_DIR && docker-compose -f docker-compose.prod.yml ps"
    echo ""
    echo "=========================================="
    echo ""
}

# 主函数
main() {
    clear

    echo "=========================================="
    echo "  桶装水配送系统 - 全自动部署"
    echo "=========================================="
    echo ""
    echo "服务器IP: $SERVER_IP"
    echo "项目目录: $PROJECT_DIR"
    echo "日志文件: $LOG_FILE"
    echo ""
    echo "本脚本将自动完成以下操作:"
    echo "  1. 更新系统"
    echo "  2. 安装基础工具"
    echo "  3. 安装Node.js"
    echo "  4. 安装Docker和Docker Compose"
    echo "  5. 安装PM2和Nginx"
    echo "  6. 配置防火墙"
    echo "  7. 配置时区和系统优化"
    echo "  8. 创建项目目录"
    echo "  9. 检查项目代码"
    echo "  10. 创建环境变量"
    echo "  11. 构建前端"
    echo "  12. 启动Docker服务"
    echo "  13. 配置Nginx"
    echo "  14. 验证部署"
    echo "  15. 设置自动备份"
    echo ""
    echo "预计耗时: 15-30分钟"
    echo ""

    read -p "是否继续? (y/n): " confirm

    if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
        print_info "已取消"
        exit 0
    fi

    echo ""

    # 执行所有步骤
    step1_update_system
    step2_install_base_tools
    step3_install_nodejs
    step4_install_docker
    step5_install_pm2_nginx
    step6_configure_firewall
    step7_configure_system
    step8_create_directories
    step9_check_project
    step10_create_env
    step11_build_frontend
    step12_start_docker
    step13_configure_nginx
    step14_verify
    step15_setup_backup

    show_result

    print_success "全自动部署完成！"
}

# 运行主函数
main
