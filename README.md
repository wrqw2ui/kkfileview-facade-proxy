# kkfileview 代理封装器
为kkFileView增加**嵌入友好的文件浏览**、**文件缩略图生成**、**提取Office文件图片JSON功能**

本项目作为一个独立的门面服务，通过 HTTP 请求与后端的 kkFileView 实例进行交互。

<img width="2170" height="591" alt="image" src="https://github.com/user-attachments/assets/24bec41f-35aa-4947-8eac-b8c7a955deb4" />

## 为什么需要？
* 如果你想要在自己的网站或应用里无缝嵌入一个文档预览窗口，不想要 kkFileView 自带的那些额外的菜单和边框。...
* 如果你正在做一个网盘或者文件管理系统，需要在文件列表里为每个文档（如 Word, PDF, PPT）显示一个小小的封面图...
* 如果你需要自动获取一个文档（如 Word, PDF, PPT）里的每一页图片来做一个轮播图...

## 支持的功能：
### 可视化预览 / Visual Preview 
**如果你想要在自己的网站或应用里无缝嵌入一个文档预览窗口，不想要 kkFileView 自带的那些额外的菜单和边框。...**
对Office文件创建更简洁的html界面，对其他类型透传kkfileview原版界面
```
GET /api/preview?url=<FILE_URL>
```
返回结构：
```
<!DOCTYPE html>
<html>
  <head>...</head>
  <body>
    <!-- Renders a full HTML page with document images or an iframe. -->
    <!-- 渲染包含文档图片或 iframe 的完整 HTML 页面。 -->
  </body>
</html>
```
### 结构化解析 / Structured Content
**如果你需要自动获取一个文档（如 Word, PDF, PPT）里的每一页图片来做一个轮播图...**
仅支持Office文档，以 JSON 格式返回图片列表或HTML返回解析结果。
```
GET /api/extract?url=<FILE_URL>
```
返回结构：
```
// Success (Word/PDF/PPT)
{
  "status": "success",
  "type": "images",
  "pages": [
    "http://domain/path/to/page1.jpg",
    "http://domain/path/to/page2.jpg"
  ]
}

// Success (Excel)
{
  "status": "success",
  "type": "html",
  "content": "<html><body>...</body></html>"
}

// Error (Unsupported file type)
{
  "status": "error",
  "message": "File type (.xyz) is not supported for JSON extraction.",
  "preview_url": "http://localhost:3800/api/preview?url=..."
}
```
### 缩略图生成 / Thumbnail Generation
**如果你正在做一个网盘或者文件管理系统，需要在文件列表里为每个文档（如 Word, PDF, PPT）显示一个小小的封面图...**
理论上支持kkfileview支持的所有文件类型，为指定的文件生成一个缩略图。
```
GET /api/thumbnail?url=<FILE_URL>
```
返回结构：
```
// 成功时返回二进制图片数据（200），Content-Type 为 image/png
// 失败时返回空内容（500）
```

## 使用

### 步骤 1: 前提条件 - 准备 kkFileView
您需要一个正在运行的 kkFileView 实例。选择以下任一方式：
A. (推荐) 本地部署 kkFileView
使用 Docker 可以一键启动一个本地实例，稳定可靠。
```
docker run -it -p 8012:8012 keking/kkfileview
```
启动后，您的 kkFileView 服务地址为 http://localhost:8012。
B. (仅供测试) 使用官方 Demo 站
您可以直接使用官方提供的 Demo 服务进行快速测试。
地址: https://file.kkview.cn/
注意: 公共服务可能不稳定，建议仅用于临时测试。

## 步骤 2: 获取并安装项目
克隆本仓库到您的本地机器，并安装所需的依赖包。
```
# 1. 克隆仓库 (请替换为您自己的仓库地址)
git clone https://github.com/your-username/your-repository-name.git

# 2. 进入项目目录
cd your-repository-name

# 3. 安装依赖
npm install
```
## 步骤 3: 配置环境变量
在.env文件指定步骤1中，正在运行的 kkFileView 实例地址

## 步骤 4: 启动服务
一切就绪，运行以下命令启动服务：
```
node server.js
```
当您看到终端输出 kkFileView Facade Server listening on port 3800 时，表示服务已成功启动。
