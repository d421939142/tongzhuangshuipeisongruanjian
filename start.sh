#!/bin/bash

# 桶装水配送系统 - 本地开发启动脚本

set -e

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# 检查依赖
check_dependencies() {
    print_info "检查依赖..."

    if ! command -v node &> /dev/null; then
        echo "错误: Node.js未安装"
        exit 1
    fi

    if ! command -v npm &> /dev/null; then
        echo "错误: npm未安装"
        exit 1
    fi

    print_success "依赖检查完成"
}

# 安装依赖
install_dependencies() {
    print_info "安装依赖..."

    # 安装根目录依赖
    if [ ! -d "node_modules" ]; then
        npm install
    fi

    # 安装后端依赖
    if [ ! -d "backend/node_modules" ]; then
        cd backend && npm install && cd ..
    fi

    # 安装前端依赖
    if [ ! -d "frontend/node_modules" ]; then
        cd frontend && npm install && cd ..
    fi

    # 安装配送APP依赖
    if [ ! -d "delivery-app/node_modules" ]; then
        cd delivery-app && npm install && cd ..
    fi

    print_success "依赖安装完成"
}

# 启动后端
start_backend() {
    print_info "启动后端服务..."

    cd backend

    # 检查环境变量
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env
            print_info "已创建 .env 文件（从 .env.example 复制）"
        else
            print_info "警告: .env 文件不存在"
        fi
    fi

    # 启动后端
    node server.js &
    BACKEND_PID=$!

    cd ..

    print_success "后端服务已启动 (PID: $BACKEND_PID)"
}

# 启动前端
start_frontend() {
    print_info "启动前端服务..."

    cd frontend
    npm run dev &
    FRONTEND_PID=$!
    cd ..

    print_success "前端服务已启动 (PID: $FRONTEND_PID)"
}

# 启动配送APP
start_delivery_app() {
    print_info "启动配送APP..."

    cd delivery-app
    npm run dev &
    DELIVERY_PID=$!
    cd ..

    print_success "配送APP已启动 (PID: $DELIVERY_PID)"
}

# 显示访问地址
show_urls() {
    echo ""
    echo "=========================================="
    echo "  服务已启动！"
    echo "=========================================="
    echo ""
    echo "访问地址:"
    echo "  - 后端API:    http://localhost:3001"
    echo "  - 管理端:     http://localhost:5173"
    echo "  - 配送APP:    http://localhost:5174"
    echo ""
    echo "停止服务: Ctrl+C"
    echo "=========================================="
    echo ""
}

# 清理进程
cleanup() {
    print_info "正在停止所有服务..."

    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
    fi

    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
    fi

    if [ ! -z "$DELIVERY_PID" ]; then
        kill $DELIVERY_PID 2>/dev/null || true
    fi

    print_success "所有服务已停止"
    exit 0
}

# 捕获退出信号
trap cleanup SIGINT SIGTERM

# 主函数
main() {
    echo "=========================================="
    echo "  桶装水配送系统 - 本地开发环境"
    echo "=========================================="
    echo ""

    check_dependencies
    install_dependencies

    # 询问启动选项
    echo "请选择启动选项:"
    echo "1) 启动所有服务（推荐）"
    echo "2) 仅启动后端"
    echo "3) 仅启动前端"
    echo "4) 仅启动配送APP"
    echo ""
    read -p "请输入选项 (1-4，默认1): " choice

    choice=${choice:-1}

    case $choice in
        1)
            start_backend
            sleep 2
            start_frontend
            sleep 2
            start_delivery_app
            ;;
        2)
            start_backend
            echo ""
            echo "后端API: http://localhost:3001"
            echo ""
            ;;
        3)
            start_frontend
            echo ""
            echo "管理端: http://localhost:5173"
            echo ""
            ;;
        4)
            start_delivery_app
            echo ""
            echo "配送APP: http://localhost:5174"
            echo ""
            ;;
        *)
            echo "无效的选项"
            exit 1
            ;;
    esac

    if [ "$choice" == "1" ]; then
        show_urls

        # 等待所有后台进程
        wait
    fi
}

# 运行主函数
main
