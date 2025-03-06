# 阅词名著 (ReadBook Classics)

## TO DO
1 提升翻译质量
- 顺序问题,重新跑一遍,根据顺序重新生成json文件
- 一致性问题,前两段的内容放进prompt,prompt加上翻译的背景信息,作者,书名,注意保持风格和名词翻译的一致性

阅词名著是一个支持中英对照阅读英语原著的网站，帮助用户更好地理解和欣赏经典文学作品。

## 功能特点

- 中英对照阅读：同时展示英文原文和中文翻译
- 自定义阅读设置：调整字体大小，选择显示语言
- 书籍分类与搜索：轻松找到感兴趣的书籍
- 阅读进度保存：记录阅读位置，随时继续阅读
- 响应式设计：适配PC端，提供良好的阅读体验

## 技术栈

- Next.js - React框架
- TypeScript - 类型安全的JavaScript
- Tailwind CSS - 实用优先的CSS框架

## 开发环境设置

1. 克隆仓库
```bash
git clone https://github.com/yourusername/readbook-classics.git
cd readbook-classics
```

2. 安装依赖
```bash
npm install
```

3. 启动开发服务器
```bash
npm run dev
```

4. 在浏览器中访问 [http://localhost:3000](http://localhost:3000)

## 项目结构

```
/app
  /components - 可复用组件
  /data - 模拟数据
  /types - TypeScript类型定义
  /lib - 工具函数
  /hooks - 自定义React Hooks
  /book/[id] - 书籍详情页
  /read/[bookId]/[chapterId] - 阅读页面
  /library - 书库页面
  /about - 关于页面
/public - 静态资源
```

## 部署到Vercel

### 方法一：使用Vercel CLI

1. 安装Vercel CLI
```bash
npm install -g vercel
```

2. 登录到Vercel
```bash
vercel login
```

3. 部署项目
```bash
vercel
```
按照提示进行操作，完成部署配置。

4. 如需生产环境部署
```bash
vercel --prod
```

### 方法二：通过GitHub仓库部署

1. 将代码推送到GitHub仓库
```bash
git add .
git commit -m "准备部署到Vercel"
git push
```

2. 登录[Vercel官网](https://vercel.com)

3. 点击"Add New..." > "Project"

4. 导入您的GitHub仓库

5. 配置项目：
   - 框架预设：Next.js
   - 构建命令：`next build`
   - 输出目录：`.next`

6. 点击"Deploy"开始部署

部署完成后，Vercel会提供一个URL访问您的应用。您也可以在Vercel控制面板中配置自定义域名。

## 贡献

欢迎提交问题和拉取请求。对于重大更改，请先开启一个问题讨论您想要更改的内容。

## 许可证

[MIT](https://choosealicense.com/licenses/mit/)
