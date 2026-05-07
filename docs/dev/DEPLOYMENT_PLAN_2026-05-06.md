# YZSCHROS 生产部署策略

## Context

YZSCHROS 猎头管理系统需要部署到阿里云 ECS 服务器 (47.97.62.57)。
服务器配置: 2核 / 1.8GB RAM / 40GB 磁盘 / Alibaba Cloud Linux 3 / 宝塔面板。

之前尝试直接部署时遇到多个问题: MinIO 未安装导致 API 崩溃重启、pgvector 扩展未安装、数据库 schema 同步问题等。
需要先制定完整策略再执行。

## 服务器当前状态

| 组件 | 状态 | 版本 |
|------|------|------|
| Node.js | 已安装 | v20.20.2 |
| pnpm | 已安装 | 10.33.3 |
| PM2 | 已安装 | 7.0.1 |
| Git | 已安装 | 2.43.7 |
| PostgreSQL | 已安装 | 13.23 |
| Redis | 已安装 | 6.2.20 |
| Nginx | 已安装 (aa_nginx) | 1.22.1 |
| MinIO | 未安装 | - |
| pgvector | 未安装 | - |
| Swap | 已配置 | 2GB |

## 关键问题清单

### 阻塞性问题 (必须解决)

1. **pgvector 扩展缺失** -- 候选人和职位表有 `vector(1024)` 列，TypeORM 同步和查询依赖 pgvector。PostgreSQL 13 需要手动编译安装 pgvector
2. **MinIO 缺失** -- API 启动时连接 MinIO 端口 9000 失败导致崩溃。需要安装 MinIO 或使 StorageModule 优雅降级
3. **生产环境 TypeORM synchronize=false** -- 无 migration 文件，生产环境不会自动建表。需要先以 development 模式运行一次初始化 schema，或创建 migration
4. **CORS 硬编码 localhost** -- `apps/api/src/main.ts:14` 只有 localhost 来源，生产环境前端无法访问 API
5. **Next.js API proxy 硬编码 localhost** -- `apps/web/next.config.ts:8` rewrite 目标写死为 `http://localhost:3001/api/:path*`

### 重要问题

6. **JWT secret 回退到开发值** -- 生产必须设置强随机密钥
7. **AI API 密钥** -- 需要配置智谱/DeepSeek API Key 才能使用 AI 功能
8. **MinerU 服务** -- PDF 结构化提取，非必须但影响简历解析质量

## 部署方案选择

### 方案 A: Docker Compose 全容器化

```
docker-compose up -d postgres(pgvector) redis minio
PM2 启动 API + Web (native)
Nginx 反向代理
```

**优点**: pgvector 开箱即用、MinIO 一键启动、环境隔离
**缺点**: Docker 内存开销 (~200-300MB)，1.8GB 服务器偏紧
**风险**: 内存不足可能导致 OOM

### 方案 B: 全原生安装

```
原生 PostgreSQL 13 + 编译 pgvector
原生 Redis (已装)
原生 MinIO (二进制)
PM2 启动 API + Web
Nginx 反向代理
```

**优点**: 内存最省、无 Docker 开销
**缺点**: pgvector 需手动编译、MinIO 需手动配置 systemd
**风险**: pgvector 编译可能遇到依赖问题

### 方案 C: 混合方案 (已选定)

```
Docker 运行: PostgreSQL(pgvector) + MinIO + MinerU (设 memory limit)
原生运行: Redis (已装) + API + Web
PM2 管理 API + Web
Nginx 反向代理
```

**内存预估** (1.8GB RAM + 2GB swap):

| 服务 | 方式 | 预估内存 | 内存优化措施 |
|------|------|----------|--------------|
| PostgreSQL + pgvector | Docker | ~200MB | 设置 `shared_buffers=128MB` 等资源限制 |
| MinIO | Docker | ~150MB | - |
| MinerU | Docker (memory 256m) | ~256MB | 强制 Docker 级别 `mem_limit: 256m` |
| Redis | 原生 systemd | ~20MB | - |
| API (NestJS) | PM2 | ~150MB | 增加 Node 参数 `--max-old-space-size=256` |
| Web (Next.js) | PM2 | ~150MB | 增加 Node 参数 `--max-old-space-size=256` |
| Nginx | 原生 systemd | ~10MB | - |
| **合计** | | **~936MB** | |
| OS + 缓冲 | | ~300MB | |
| **总计** | | **~1.2GB** (剩余 0.6GB + 2GB swap) | 整体处于安全水位 |

PDF 解析三级降级策略保持完整: MinerU(结构化) -> pdf-parse(纯文本) -> Vision LLM(AI提取)。

## 部署步骤

### Phase 1: 代码修复 (本地，3 个文件)

**文件: `apps/api/src/main.ts`**
- 修改 CORS origin 从硬编码 localhost 改为读取 `CORS_ORIGINS` 环境变量
- 当前代码 (line 14): `origin: ['http://localhost:3000', 'http://localhost:3002', 'http://localhost:3003']`
- 改为: `origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000']`

**文件: `apps/web/next.config.ts`**
- 修改 API proxy 目标从硬编码改为环境变量
- 当前代码 (line 8): `destination: 'http://localhost:3001/api/:path*'`
- 改为: `destination: (process.env.API_INTERNAL_URL || 'http://localhost:3001') + '/api/:path*'`

**文件: 新建 `deploy/docker-compose.prod.yml`**
- 定义 postgres(pgvector)、minio、mineru 三个服务
- postgres 和 minio 使用已有的 docker-compose.yml 配置
- mineru 添加 `mem_limit: 256m`
- 停掉原生的 postgres (systemctl stop postgresql)

### Phase 2: 基础设施 (服务器)

4. **安装 Docker + Docker Compose**
5. **停掉原生 PostgreSQL** (`systemctl stop postgresql && systemctl disable postgresql`)
6. **启动 Docker 服务**: `docker compose -f deploy/docker-compose.prod.yml up -d`
7. **验证所有容器运行**: postgres(5432), minio(9000/9001), mineru(8000)
8. **验证 Redis**: `systemctl status redis`

### Phase 3: 数据库初始化

9. **创建数据库用户和库**
10. **启用 pgvector 扩展**: `CREATE EXTENSION IF NOT EXISTS vector;`
11. **首次以 NODE_ENV=development 启动 API** 让 TypeORM synchronize 建表
12. **验证表创建完成** 后停掉 API，切回 production 模式

### Phase 4: 应用部署

13. **rsync 最新代码到服务器** (排除 node_modules/.git/.next)
14. **pnpm install + pnpm build:api + pnpm build:web**
15. **配置 /opt/yzschros/.env** (见下方环境变量清单)
16. **PM2 启动 API + Web**

### Phase 5: Nginx + 验收

17. **配置 Nginx 反向代理**
    - `/` -> `http://127.0.0.1:3000` (Next.js)
    - `/api` -> `http://127.0.0.1:3001` (NestJS API)
    - 静态资源缓存、gzip 压缩
18. **gstack 浏览器 QA** -- 访问 http://47.97.62.57 全面测试
19. **PM2 startup** -- 配置开机自启
20. **配置阿里云安全组** -- 开放 80 端口

### 需要修改/新建的文件

| 文件 | 修改内容 |
|------|----------|
| `apps/api/src/main.ts:14` | CORS 添加环境变量来源 |
| `apps/web/next.config.ts:8` | API proxy 目标改为环境变量 |
| 新建 `deploy/docker-compose.prod.yml` | 生产 Docker 配置 (PG+MinIO+MinerU) |
| 新建 `deploy/nginx.conf` | Nginx 反向代理配置 |
| 新建 `ecosystem.config.js` | PM2 生产配置 |

### 生产环境变量清单

```env
# 数据库 (Docker PG pgvector)
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_USER=yzschros
DATABASE_PASSWORD=yzschros_prod_2026
DATABASE_NAME=yzschros

# Redis (原生)
REDIS_URL=redis://127.0.0.1:6379

# MinIO (Docker)
MINIO_ENDPOINT=127.0.0.1
MINIO_PORT=9000
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin_prod_2026
MINIO_USE_SSL=false

# JWT
JWT_SECRET=<64-char-random>
JWT_REFRESH_SECRET=<64-char-random>
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# AI 服务 (从本地 .env 复制)
ZHIPU_API_KEY=<from-local-env>
ZHIPU_EMBEDDING_MODEL=embedding-3
DEEPSEEK_API_KEY=<from-local-env>

# MinerU (Docker)
MINERU_URL=http://127.0.0.1:8000

# 应用
API_PORT=3001
NODE_ENV=production
CORS_ORIGINS=http://47.97.62.57
API_INTERNAL_URL=http://127.0.0.1:3001
LOCAL_AI_ENABLED=false
```

### 验证方案

1. `curl http://47.97.62.57/api/health` -- 检查 API 是否存活
2. `curl http://47.97.62.57/` -- 检查前端页面是否渲染
3. 浏览器访问 http://47.97.62.57 进行登录测试 (手机号 + 密码)
4. 测试简历上传 + PDF 解析 (验证 MinIO 和 MinerU 链路)

---

## 附录：核心配置文件模板

以下配置文件已针对 2C 1.8G 服务器进行了极简与内存优化。

### 1. `deploy/docker-compose.prod.yml`
```yaml
version: '3.8'

services:
  postgres:
    image: ankane/pgvector:v0.5.1
    container_name: yzschros-postgres
    restart: always
    environment:
      POSTGRES_USER: ${DATABASE_USER:-yzschros}
      POSTGRES_PASSWORD: ${DATABASE_PASSWORD:-yzschros_prod_2026}
      POSTGRES_DB: ${DATABASE_NAME:-yzschros}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    command: ["postgres", "-c", "shared_buffers=128MB", "-c", "max_connections=100"]

  minio:
    image: minio/minio:RELEASE.2023-11-20T22-40-07Z
    container_name: yzschros-minio
    restart: always
    environment:
      MINIO_ROOT_USER: ${MINIO_ROOT_USER:-minioadmin}
      MINIO_ROOT_PASSWORD: ${MINIO_ROOT_PASSWORD:-minioadmin_prod_2026}
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - miniodata:/data
    command: server /data --console-address ":9001"

  mineru:
    image: opendatalab/miner_u:latest
    container_name: yzschros-mineru
    restart: always
    ports:
      - "8000:8000"
    deploy:
      resources:
        limits:
          memory: 256M

volumes:
  pgdata:
  miniodata:
```

### 2. `ecosystem.config.js` (放于项目根目录)
利用 `--max-old-space-size=256` 限制 V8 内存，防止 OOM。
```javascript
module.exports = {
  apps: [
    {
      name: 'yzschros-api',
      script: 'pnpm',
      args: 'run start:prod --filter @yzschros/api',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env_production: {
        NODE_ENV: 'production',
        NODE_OPTIONS: '--max-old-space-size=256'
      }
    },
    {
      name: 'yzschros-web',
      script: 'pnpm',
      args: 'start --filter @yzschros/web',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        NODE_OPTIONS: '--max-old-space-size=256'
      }
    }
  ]
};
```

### 3. `deploy/nginx.conf`
需在宝塔面板或原生的 `/etc/nginx/conf.d/yzschros.conf` 中配置。
```nginx
server {
    listen 80;
    server_name 47.97.62.57; # 或者配置域名

    # Gzip 压缩提升传输性能
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # 代理前端 Next.js
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 代理后端 NestJS API
    location /api/ {
        proxy_pass http://127.0.0.1:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # SSE 配置 (针对简历解析进度推送)
        proxy_set_header Connection '';
        chunked_transfer_encoding off;
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 300s;
    }
}
```
