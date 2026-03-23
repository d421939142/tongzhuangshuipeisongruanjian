#!/bin/bash

# 桶装水配送系统 - 自动备份脚本

set -e

# 配置
BACKUP_DIR="/home/$(whoami)/backups/water-delivery"
PROJECT_DIR="/home/$(whoami)/water-delivery/water-delivery-new"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 创建备份目录
mkdir -p $BACKUP_DIR

print_info "开始备份 - $(date)"

# 1. 备份数据库
print_info "备份数据库..."
if [ -f "$PROJECT_DIR/backend/data/database.db" ]; then
    cp $PROJECT_DIR/backend/data/database.db $BACKUP_DIR/database_$DATE.db
    print_info "数据库备份完成"
else
    print_warning "数据库文件不存在"
fi

# 2. 备份上传的文件
print_info "备份上传的文件..."
if [ -d "$PROJECT_DIR/backend/uploads" ] && [ "$(ls -A $PROJECT_DIR/backend/uploads)" ]; then
    mkdir -p $BACKUP_DIR/uploads_$DATE
    cp -r $PROJECT_DIR/backend/uploads/* $BACKUP_DIR/uploads_$DATE/
    print_info "上传文件备份完成"
else
    print_warning "没有上传文件需要备份"
fi

# 3. 备份配置文件
print_info "备份配置文件..."
if [ -d "$PROJECT_DIR/backend/config" ]; then
    mkdir -p $BACKUP_DIR/config_$DATE
    cp -r $PROJECT_DIR/backend/config/* $BACKUP_DIR/config_$DATE/
    print_info "配置文件备份完成"
fi

# 4. 创建压缩包
print_info "创建压缩包..."
tar -czf $BACKUP_DIR/backup_$DATE.tar.gz \
    $BACKUP_DIR/database_$DATE.db \
    $BACKUP_DIR/uploads_$DATE \
    $BACKUP_DIR/config_$DATE \
    2>/dev/null || true

# 5. 清理临时文件
print_info "清理临时文件..."
rm -rf $BACKUP_DIR/database_$DATE.db
rm -rf $BACKUP_DIR/uploads_$DATE
rm -rf $BACKUP_DIR/config_$DATE

# 6. 删除过期备份
print_info "删除 $RETENTION_DAYS 天前的备份..."
find $BACKUP_DIR -name "backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete

# 7. 显示备份结果
echo ""
echo "=========================================="
echo "备份完成"
echo "=========================================="
echo "备份文件: $BACKUP_DIR/backup_$DATE.tar.gz"
echo "备份大小: $(du -h $BACKUP_DIR/backup_$DATE.tar.gz | cut -f1)"
echo "备份时间: $(date)"
echo "保留天数: $RETENTION_DAYS 天"
echo "=========================================="
echo ""

# 可选：上传到云存储（如需要）
# print_info "上传到云存储..."
# aws s3 cp $BACKUP_DIR/backup_$DATE.tar.gz s3://your-bucket/backups/

# 可选：发送通知（如需要）
# print_info "发送备份通知..."
# echo "备份完成: backup_$DATE.tar.gz" | mail -s "系统备份通知" admin@example.com

print_info "备份脚本执行完成"
