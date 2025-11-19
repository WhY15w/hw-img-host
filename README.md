# HW-img-host

一个简单的无服务器图片托管服务，支持图片上传、自动压缩和缩略图生成.

基于腾讯云 EdgeOne Pages Functions 和 CNB 仓库免费对象存储服务构建.

项目用到了，单独抽离出来方便个人使用。

![预览](./img/demo.png)

## 功能特性

- 📤 拖拽或点击上传图片
- 🗜️ 自动压缩图片，优化存储空间
- 🖼️ 自动生成缩略图
- 🔗 一键获取图片链接 (EdgeOne 代理)
- ⚡ 基于 Vue 3 + Vite 快速构建

## 技术栈

- **前端**: Vue 3 + TypeScript + Vite + TailwindCSS
- **后端**: EdgeOne Pages Node Functions + Express.js
- **上传**: Multer + CNB 对象存储服务

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

在EdgeOne控制台，配置以下环境变量：

```env
BASE_IMG_URL=你的图床域名，结尾带斜杠，例如：https://img.example.com/
SLUG_IMG=CNB图床仓库名，例如：your-username/your-repo
TOKEN_IMG=CNB图床仓库Token
```

## 获取 TOKEN_IMG

1. 登录 [CNB官网](https://cnb.cool/) 右上角头像点击 个人设置。

   ![个人设置](./img/1.png)

2. 选择“访问令牌”，找到你的图床仓库（自己创建一个空仓库即可）。

   ![访问令牌](./img/2.png)

3. 授权范围全部选最大（不放心自己研究官方文档）。

   ![生成Token](./img/3.png)

4. 点击“生成Token”按钮，复制生成的Token。

   ![生成Token](./img/4.png)

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

## 贡献

欢迎提交 issue 或 pull request 贡献代码！
