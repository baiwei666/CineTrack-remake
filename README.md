# CineTrack 🎬

**CineTrack** 也就是 **CineTrack-remake**，是一个现代化的个人观影追踪应用，专为影迷打造。它结合了沉浸式的视觉体验与强大的数据管理功能，帮助你优雅地记录每一部看过的电影和剧集。

## ✨ 核心特性

### 1. 沉浸式视觉体验
- **动态详情页**: 采用高斯模糊海报叠加技术，配合光影流动动画，打造深邃的沉浸感。
- **现代化 UI**: 基于 Glassmorphism（毛玻璃）设计语言，支持深色/浅色主题切换。
- **自适应布局**: 优化的响应式设计，完美适配不同尺寸的窗口。

### 2. 强大的媒体库管理
- **智能合集 (Collections)**: 支持手动创建合集，或通过"智能整理"功能自动基于片名归类系列电影。
- **双重视图**: 只有"所有记录"和"我的合集"两种视图，简单纯粹。
- **多维度筛选**: 支持通过类型、年份、标签等组合筛选影片。

### 3. 数据与统计
- **可视化仪表盘**: 内置丰富图表，包括年度类型分布、观影趋势、Top 导演/演员统计。
- **年度报告**: 生成精美的年度观影报告。
- **数据安全**:
    - 数据与程序分离，支持自定义存储路径。
    - 提供全量数据备份与恢复功能。
    - 一键清除数据（危险操作保护）。

### 4. 自动化元数据 (TMDB)
- **无缝集成**: 输入 TMDB API Key 后，支持自动补全影片信息。
- **丰富资讯**: 自动获取高清剧照、海报、以及剧集的分集剧情和演职员信息。
- **关联探索**: 鼠标悬停导演/演员，即刻探索库中相关作品。

## 🛠️ 技术栈

- **Core**: [Electron](https://www.electronjs.org/), [React](https://reactjs.org/), [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Animation**: [Framer Motion](https://www.framer.com/motion/)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)

  截图
  <img width="1885" height="970" alt="750e57bd98b38cb6e81da6adeb2567cb" src="https://github.com/user-attachments/assets/9bfe191d-0a5a-4e81-b65e-7fbacaf08e1b" />
<img width="1880" height="930" alt="836d365908b57538c4de9e6162b0cab7" src="https://github.com/user-attachments/assets/69876747-034a-42c1-b281-4175fa0e8db4" />
<img width="1875" height="1015" alt="24f9d395879e2947106fa0a34f14aeb6" src="https://github.com/user-attachments/assets/6db77893-bda1-4921-96dc-83470422cc80" />
<img width="1870" height="993" alt="b4d0c2fb77f49e3bf10b53693f6916e1" src="https://github.com/user-attachments/assets/9799c9f3-5127-43f7-8498-506438caac6c" />
<img width="1884" height="986" alt="1b4baa735c5f6aa1736ff67d0f6f7a02" src="https://github.com/user-attachments/assets/e3cdfbb6-b1c3-4f97-a75d-4f517e0a00aa" />
<img width="1748" height="985" alt="331596b5f714589603a39bb84f0e95d0" src="https://github.com/user-attachments/assets/84936cf0-254e-4043-b6c9-74c41d448014" />
<img width="1870" height="970" alt="c7547ee057e6859e8b8b2eb0a8771527" src="https://github.com/user-attachments/assets/0dfbe9f0-b7f8-4166-bd83-8df01bc2fa07" />


## 🚀 快速开始

### 开发环境

1.  **安装依赖**
    ```bash
    npm install
    ```

2.  **启动开发服务器 (Web mode)**
    ```bash
    npm run dev
    ```

3.  **启动 Electron 开发模式**
    ```bash
    npm run electron:dev
    ```

### 构建打包

生成 Windows 可执行文件 (.exe):

```bash
npm run electron:build
```

构建产物将位于 `dist/` 目录下。
- **免安装版**: `dist/win-unpacked/CineTrack.exe`
- **安装包**: `dist/CineTrack Setup <version>.exe` (需配置签名环境)

## 📂 项目结构

```
src/
├── components/     # 通用 UI 组件 (Cards, Modals, Charts...)
├── context/        # 全局状态 (DataProvider, ThemeProvider)
├── pages/          # 路由页面 (Dashboard, Library, MovieDetail...)
├── services/       # 外部服务 (TMDB API, File System)
├── electron/       # Electron 主进程代码
├── types.ts        # TypeScript 类型定义
└── utils/          # 工具函数
```

## 📝 License

MIT License.
