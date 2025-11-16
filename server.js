// server.js
const express = require('express');
const axios = require('axios'); // [新增] 为 /api/extract 路由引入 axios
const path = require('path');
const { extractContent } = require('./utils/imageExtractor');
const { getThumbnail } = require('./utils/thumbnailer');

require('dotenv').config(); 

const app = express();
const PORT = 3800;

app.use(express.json());
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF--8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>kkFileView 代理封装器</title>
            <style>
                :root {
                    --bg-color: #ffffff;
                    --text-color: #24292e;
                    --border-color: #e1e4e8;
                    --code-bg-color: #f6f8fa;
                    --pre-bg-color: #2d2d2d;
                    --pre-text-color: #f8f8f2;
                    --link-color: #0366d6;
                }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
                    line-height: 1.6;
                    color: var(--text-color);
                    background-color: var(--bg-color);
                    margin: 0;
                    padding: 20px;
                }
                .container {
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                }
                h1, h2, h3 {
                    border-bottom: 1px solid var(--border-color);
                    padding-bottom: 0.3em;
                    margin-top: 24px;
                    margin-bottom: 16px;
                    font-weight: 600;
                }
                h1 { font-size: 2em; }
                h2 { font-size: 1.5em; }
                h3 { font-size: 1.25em; }
                p { margin-top: 0; margin-bottom: 16px; }
                strong { font-weight: 600; }
                a { color: var(--link-color); text-decoration: none; }
                a:hover { text-decoration: underline; }
                code {
                    padding: 0.2em 0.4em;
                    margin: 0;
                    font-size: 85%;
                    background-color: var(--code-bg-color);
                    border-radius: 3px;
                    font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
                }
                pre {
                    padding: 16px;
                    overflow: auto;
                    font-size: 85%;
                    line-height: 1.45;
                    background-color: var(--pre-bg-color);
                    color: var(--pre-text-color);
                    border-radius: 6px;
                }
                pre code {
                    display: inline;
                    padding: 0;
                    margin: 0;
                    overflow: visible;
                    line-height: inherit;
                    word-wrap: normal;
                    background-color: transparent;
                    border: 0;
                    font-size: 100%;
                    color: inherit;
                }
                blockquote {
                    margin: 0 0 16px 0;
                    padding: 0 1em;
                    color: #6a737d;
                    border-left: 0.25em solid var(--border-color);
                }
                .api-section {
                    margin-bottom: 30px;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>kkFileView 代理封装器</h1>
                <p>为 kkFileView 增加 <strong>文件缩略图生成</strong>、<strong>提取Office文件图片JSON功能</strong>。</p>
                <blockquote>
                    <p>本项目作为一个独立的门面服务，通过 HTTP 请求与后端的 kkFileView 实例进行交互。它本身并未修改或包含任何 kkFileView 的源代码。<br>
                    核心依赖：<a href="https://github.com/kekingcn/kkFileView" target="_blank">kkFileView</a> - 一个功能强大的开源文件在线预览解决方案。</p>
                </blockquote>

                <h2>支持的功能：</h2>

                <div class="api-section">
                    <h3>可视化预览 / Visual Preview</h3>
                    <p>对Office文件创建更简洁的html界面，对其他类型透传kkfileview原版界面。</p>
                    <pre><code>GET /api/preview?url=&lt;FILE_URL&gt;</code></pre>
                    <h4>返回结构：</h4>
                    <pre><code class="language-html">&lt;!DOCTYPE html&gt;
&lt;html&gt;
  &lt;head&gt;...&lt;/head&gt;
  &lt;body&gt;
    &lt;!-- Renders a full HTML page with document images or an iframe. --&gt;
    &lt;!-- 渲染包含文档图片或 iframe 的完整 HTML 页面。 --&gt;
  &lt;/body&gt;
&lt;/html&gt;</code></pre>
                </div>

                <div class="api-section">
                    <h3>结构化解析 / Structured Content</h3>
                    <p>Extracts content (like image lists or HTML) from documents and returns it in a JSON format.<br>仅支持Office文档，以 JSON 格式返回图片列表或HTML返回解析结果。</p>
                    <pre><code>GET /api/extract?url=&lt;FILE_URL&gt;</code></pre>
                    <h4>返回结构：</h4>
                    <pre><code class="language-json">// Success (Word/PDF/PPT)
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
  "content": "&lt;html&gt;&lt;body&gt;...&lt;/body&gt;&lt;/html&gt;"
}

// Error (Unsupported file type)
{
  "status": "error",
  "message": "File type (.xyz) is not supported for JSON extraction.",
  "preview_url": "http://localhost:3800/api/preview?url=..."
}</code></pre>
                </div>

                <div class="api-section">
                    <h3>缩略图生成 / Thumbnail Generation</h3>
                    <p>Generates a thumbnail image for a given file.<br>理论上支持kkfileview支持的所有文件类型，为指定的文件生成一个缩略图。</p>
                    <pre><code>GET /api/thumbnail?url=&lt;FILE_URL&gt;</code></pre>
                    <h4>返回结构：</h4>
                    <pre><code class="language-text">// 成功时返回二进制图片数据（200），Content-Type 为 image/png
// 失败时返回空内容（500）</code></pre>
                </div>
            </div>
        </body>
        </html>
    `);
});

// 将图片列表转换为 HTML 的辅助函数
function createHtmlFromImageUrls(urls, title = 'Document Preview') {
    const imageTags = urls.map(url => `
        <div class="img-area">
            <img class="my-photo" alt="loading" data-src="${url}" src="${url}">
        </div>
    `).join('');
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title}</title>
            <style>
                body { margin: 0; padding: 10px; background-color: #f0f2f5; font-family: sans-serif; }
                .container { max-width: 900px; margin: 0 auto; }
                .img-area { margin-bottom: 20px; text-align: center; } 
                .my-photo { 
                    max-width: 100%; 
                    border: 1px solid #ccc; 
                    background-color: white;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                }
            </style>
        </head>
        <body><div class="container">${imageTags}</div></body>
        </html>
    `;
}

// API: 获取 Office/PDF 文件的图片/内容 (预览)
app.get('/api/preview', async (req, res) => {
    const fileUrl = req.query.url;

    if (!fileUrl) {
        return res.status(400).json({ error: 'Missing "url" query parameter' });
    }

    try {
        const result = await extractContent(fileUrl); // officePreviewType is now handled inside extractContent

        switch (result.type) {
            case 'ppt':
                const pptImageUrls = result.data.data.map(page => page.url);
                const pptHtml = createHtmlFromImageUrls(pptImageUrls, 'PPT Preview');
                res.send(pptHtml);
                break;
            
            case 'images':
                const docHtml = createHtmlFromImageUrls(result.urls, 'Document Preview');
                res.send(docHtml);
                break;

            case 'excel':
                res.send(`
                    <!DOCTYPE html>
                    <html>
                    <head><title>Excel Preview</title><style>body,html,iframe{margin:0;padding:0;height:100%;width:100%;border:none;}</style></head>
                    <body>
                        <iframe src="${result.url}"></iframe>
                    </body>
                    </html>
                `);
                break;
            case 'fallback':
                res.send(result.html);
                break;
            
            default:
                 console.error(`[FATAL] Unknown content type received from extractor: ${result.type}`);
                 res.status(500).json({ error: 'Unknown content type from extractor' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to process file preview', details: error.message });
    }
});


// --- [改进 3] ---
// 新增 API: 结构化提取文件内容 (JSON)
const JSON_SUPPORTED_EXTENSIONS = new Set(['.doc', '.docx', '.ppt', '.pptx', '.pdf', '.xls', '.xlsx']);

app.get('/api/extract', async (req, res) => {
    const fileUrl = req.query.url;
    if (!fileUrl) {
        return res.status(400).json({ error: 'Missing "url" query parameter' });
    }

    try {
        const extension = path.extname(new URL(fileUrl).pathname).toLowerCase();

        if (!JSON_SUPPORTED_EXTENSIONS.has(extension)) {
            const previewUrl = `${req.protocol}://${req.get('host')}/api/preview?url=${encodeURIComponent(fileUrl)}`;
            return res.status(400).json({
                status: 'error',
                message: `File type (${extension}) is not supported for JSON extraction.`,
                preview_url: previewUrl
            });
        }
        
        const result = await extractContent(fileUrl);

        // Word, PDF, PPT
        if (result.type === 'images' || result.type === 'ppt') {
            const urls = (result.type === 'images') 
                ? result.urls 
                : result.data.data.map(page => page.url);

            return res.json({
                status: 'success',
                type: 'images',
                pages: urls
            });
        }

        // Excel
        if (result.type === 'excel') {
            // 读取 iframe 内嵌入的 HTML 文件内容
            const { data: excelHtmlContent } = await axios.get(result.url);
            return res.json({
                status: 'success',
                type: 'html',
                content: excelHtmlContent
            });
        }
        
        // 其他情况（如 fallback），也视为不支持 JSON 提取
        const previewUrl = `${req.protocol}://${req.get('host')}/api/preview?url=${encodeURIComponent(fileUrl)}`;
        return res.status(400).json({
            status: 'error',
            message: 'File could not be parsed into a structured JSON format.',
            preview_url: previewUrl
        });

    } catch (error) {
        res.status(500).json({ error: 'Failed to extract file content', details: error.message });
    }
});


// API: 获取文件缩略图
app.get('/api/thumbnail', async (req, res) => {
    const fileUrl = req.query.url;

    if (!fileUrl) {
        return res.status(400).json({ error: 'Missing "url" query parameter' });
    }

    try {
        const thumbnailBuffer = await getThumbnail(fileUrl);
        res.set('Content-Type', 'image/png');
        res.send(thumbnailBuffer);
    } catch (error) {
        // --- [改进 4] ---
        // 当缩略图生成失败时，返回 500 和空响应体
        res.status(500).send();
    }
});

app.use(express.static('public'));

app.listen(PORT, () => {
    console.log(`kkFileView Facade Server listening on port ${PORT}`);
});