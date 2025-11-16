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
