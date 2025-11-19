# HW-img-host

一个简洁的图片托管服务，支持图片上传、自动压缩和缩略图生成。

## 功能特性

- 📤 拖拽或点击上传图片
- 🗜️ 自动压缩图片，优化存储空间
- 🖼️ 自动生成缩略图
- 🔗 一键获取图片链接
- ⚡ 基于 Vue 3 + Vite 快速构建

## 技术栈

- **前端**: Vue 3 + TypeScript + Vite + TailwindCSS
- **后端**: Express.js + Node Functions
- **上传**: Multer + CNB 图床服务

## 快速开始

### 环境要求

- Node.js >= 20.19.0 或 >= 22.12.0
- pnpm >= 10.18.2

### 安装依赖

```sh
pnpm install
```

### 开发运行

```sh
pnpm dev
```

访问 http://localhost:5173 即可使用。

### 构建生产版本

```sh
pnpm build
```

## 环境配置

在项目根目录创建 `.env` 文件，配置以下环境变量：

```env
BASE_IMG_URL=你的图床域名
```

## 项目结构

```
hw-img-host/
├── src/                    # 前端源码
│   ├── components/         # Vue 组件
│   ├── views/              # 页面视图
│   └── router/             # 路由配置
├── node-functions/         # 后端 API
│   └── api/                # Express 路由
└── public/                 # 静态资源
```

## 其他命令

```sh
# 代码检查
pnpm lint

# 代码格式化
pnpm format

# 预览构建结果
pnpm preview
```

## 开发说明

推荐使用 VS Code + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar) 扩展进行开发。
