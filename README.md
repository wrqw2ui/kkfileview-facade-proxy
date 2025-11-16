# kkfileview 代理封装器
为kkFileView增加**文件缩略图生成**、**提取Office文件图片JSON功能**

本项目作为一个独立的门面服务，通过 HTTP 请求与后端的 kkFileView 实例进行交互。它本身并未修改或包含任何 kkFileView 的源代码。
核心依赖：kkFileView - 一个功能强大的开源文件在线预览解决方案。

## 支持的功能：
### 可视化预览 / Visual Preview 
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
Extracts content (like image lists or HTML) from documents and returns it in a JSON format.
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
Generates a thumbnail image for a given file.
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
