#!/bin/bash

# 桶装水配送系统 - 一键部署脚本
# 支持传统部署和Docker部署

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的信息
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

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检查系统
check_system() {
    print_info "检查系统环境..."

    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        if [ -f /etc/os-release ]; then
            . /etc/os-release
            print_info "检测到系统: $PRETTY_NAME"
        fi
    else
        print_error "不支持的操作系统: $OSTYPE"
        print_info "本脚本仅支持Linux系统"
        exit 1
    fi
}

# 检查必要的命令
check_commands() {
    print_info "检查必要的命令..."

    local missing_commands=()

    if ! command_exists node; then
        missing_commands+=("node")
    fi

    if ! command_exists npm; then
        missing_commands+=("npm")
    fi

    if [ ${#missing_commands[@]} -gt 0 ]; then
        print_error "缺少必要的命令: ${missing_commands[*]}"
        print_info "请先安装Node.js和npm"
        exit 1
    fi

    print_success "所有必要的命令已安装"
}

# 安装Docker（如果选择Docker部署）
install_docker() {
    if ! command_exists docker; then
        print_warning "Docker未安装，正在安装..."

        if command_exists apt-get; then
            curl -fsSL https://get.docker.com -o get-docker.sh
            sudo sh get-docker.sh
            sudo usermod -aG docker $USER
        elif command_exists yum; then
            sudo yum install -y docker
            sudo systemctl start docker
            sudo systemctl enable docker
        else
            print_error "无法自动安装Docker，请手动安装"
            exit 1
        fi

        print_success "Docker安装成功"
    else
        print_success "Docker已安装"
    fi

    if ! command_exists docker-compose; then
        print_warning "Docker Compose未安装，正在安装..."

        sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        sudo chmod +x /usr/local/bin/docker-compose

        print_success "Docker Compose安装成功"
    else
        print_success "Docker Compose已安装"
    fi
}

# 安装PM2
install_pm2() {
    if ! command_exists pm2; then
        print_info "安装PM2..."
        sudo npm install -g pm2
        print_success "PM2安装成功"
    else
        print_success "PM2已安装"
    fi
}

# 安装Nginx
install_nginx() {
    if ! command_exists nginx; then
        print_info "安装Nginx..."
        sudo apt-get install -y nginx || sudo yum install -y nginx
        print_success "Nginx安装成功"
    else
        print_success "Nginx已安装"
    fi
}

# 安装依赖
install_dependencies() {
    print_info "安装项目依赖..."

    # 安装根目录依赖
    npm install

    # 安装后端依赖
    cd backend
    npm install

    # 安装前端依赖
    cd ../frontend
    npm install

    # 安装配送APP依赖
    cd ../delivery-app
    npm install

    cd ..

    print_success "依赖安装完成"
}

# 配置环境变量
setup_env() {
    print_info "配置环境变量..."

    if [ ! -f backend/.env ]; then
        if [ -f backend/.env.example ]; then
            cp backend/.env.example backend/.env
            print_warning "请编辑 backend/.env 文件，配置必要的环境变量"
            print_info "特别是API_KEY等敏感信息"
        else
            print_error "backend/.env.example 文件不存在"
            exit 1
        fi
    else
        print_success "环境变量文件已存在"
    fi
}

# 构建前端
build_frontend() {
    print_info "构建前端项目..."

    # 构建管理端
    print_info "构建管理端..."
    cd frontend
    npm run build

    # 构建配送APP
    print_info "构建配送APP..."
    cd ../delivery-app
    npm run build

    cd ..

    print_success "前端构建完成"
}

# 配置Nginx
setup_nginx() {
    print_info "配置Nginx..."

    # 复制Nginx配置
    sudo cp nginx/conf.d/default.conf /etc/nginx/conf.d/water-delivery.conf

    # 测试配置
    sudo nginx -t

    # 重启Nginx
    sudo systemctl restart nginx

    print_success "Nginx配置完成"
}

# Docker部署
deploy_docker() {
    print_info "开始Docker部署..."

    install_docker

    print_info "构建Docker镜像..."
    docker-compose -f docker-compose.prod.yml build

    print_info "启动Docker容器..."
    docker-compose -f docker-compose.prod.yml up -d

    print_success "Docker部署完成"
    print_info "查看日志: docker-compose -f docker-compose.prod.yml logs -f"
}

# 传统部署
deploy_traditional() {
    print_info "开始传统部署..."

    install_pm2
    install_nginx
    install_dependencies
    setup_env
    build_frontend
    setup_nginx

    # 启动后端服务
    print_info "启动后端服务..."
    cd backend
    pm2 start server.js --name water-delivery-api
    pm2 save
    pm2 startup | sudo -E bash -

    print_success "传统部署完成"
    print_info "查看日志: pm2 logs water-delivery-api"
}

# 显示部署选项
show_options() {
    echo ""
    echo "请选择部署方式:"
    echo "1) Docker部署（推荐）"
    echo "2) 传统部署"
    echo "3) 仅安装环境"
    echo "4) 仅构建前端"
    echo "5) 仅启动后端"
    echo "6) 退出"
    echo ""
}

# 主函数
main() {
    echo "=========================================="
    echo "   桶装水配送系统 - 一键部署脚本"
    echo "=========================================="
    echo ""

    check_system
    check_commands

    show_options
    read -p "请输入选项 (1-6): " choice

    case $choice in
        1)
            install_dependencies
            setup_env
            deploy_docker
            ;;
        2)
            install_dependencies
            setup_env
            deploy_traditional
            ;;
        3)
            install_dependencies
            print_success "环境安装完成"
            ;;
        4)
            build_frontend
            print_success "前端构建完成"
            ;;
        5)
            install_pm2
            cd backend
            pm2 start server.js --name water-delivery-api
            pm2 save
            print_success "后端启动完成"
            ;;
        6)
            print_info "退出"
            exit 0
            ;;
        *)
            print_error "无效的选项"
            exit 1
            ;;
    esac

    echo ""
    print_success "部署完成！"
    echo ""
    echo "访问地址:"
    if [ "$choice" == "1" ] || [ "$choice" == "2" ]; then
        echo "  - 后端API: http://localhost:3001"
        echo "  - 管理端: http://localhost"
        echo "  - 配送APP: http://localhost/delivery"
        echo ""
        echo "查看日志:"
        if [ "$choice" == "1" ]; then
            echo "  - Docker: docker-compose -f docker-compose.prod.yml logs -f"
        else
            echo "  - PM2: pm2 logs water-delivery-api"
            echo "  - Nginx: sudo tail -f /var/log/nginx/access.log"
        fi
    fi
    echo ""
}

# 运行主函数
main
