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
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>kkFileView Facade Server | kkFileView 门面服务</title>
            <style>
                :root {
                    --bg-color: #f7f9fc;
                    --card-bg: #ffffff;
                    --text-color: #333;
                    --subtext-color: #666;
                    --primary-color: #007acc;
                    --border-color: #e0e6ed;
                    --code-bg: #2d2d2d;
                    --code-color: #f8f8f2;
                    --details-bg: #f9f9fb;
                }
                body {
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Helvetica Neue", "Arial", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
                    margin: 0;
                    padding: 20px;
                    background-color: var(--bg-color);
                    color: var(--text-color);
                    line-height: 1.7;
                }
                .container { max-width: 900px; margin: 20px auto; }
                .header { text-align: center; margin-bottom: 40px; }
                .header svg { width: 64px; height: 64px; margin-bottom: 10px; color: var(--primary-color); }
                h1 { font-size: 2rem; margin: 0; color: var(--text-color); }
                .zh-title { font-size: 1.2rem; color: var(--subtext-color); font-weight: normal; }
                .header p { font-size: 1.1rem; color: var(--subtext-color); max-width: 600px; margin: 10px auto 0; }
                .api-grid { display: grid; grid-template-columns: 1fr; gap: 25px; }
                .api-card {
                    background: var(--card-bg);
                    border-radius: 12px;
                    border: 1px solid var(--border-color);
                    padding: 25px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }
                .api-card:hover { transform: translateY(-5px); box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08); }
                h2 { font-size: 1.5rem; border-bottom: 2px solid var(--primary-color); padding-bottom: 10px; margin-top: 0; margin-bottom: 15px; }
                .zh-subtitle { font-size: 1.1rem; color: var(--subtext-color); font-weight: normal; margin-left: 10px; }
                .api-card p { margin: 0 0 15px 0; color: #555; }
                pre { background-color: var(--code-bg); color: var(--code-color); padding: 15px; border-radius: 8px; overflow-x: auto; font-size: 0.9rem; line-height: 1.5; margin-top: 10px; }
                code { font-family: "SF Mono", "Fira Code", "Consolas", "Monaco", monospace; }
                .example-link { display: inline-block; margin-top: 10px; font-weight: 500; word-break: break-all; }
                a { color: var(--primary-color); text-decoration: none; }
                a:hover { text-decoration: underline; }
                .footer { text-align: center; margin-top: 40px; color: #999; font-size: 0.9rem; }
                
                /* Styles for collapsible details */
                details { margin-top: 15px; border: 1px solid var(--border-color); border-radius: 8px; overflow: hidden; }
                summary {
                    padding: 10px 15px;
                    background-color: var(--details-bg);
                    cursor: pointer;
                    font-weight: 500;
                    color: #444;
                    outline: none;
                    transition: background-color 0.2s;
                }
                summary:hover { background-color: #e9eef5; }
                details[open] > summary { border-bottom: 1px solid var(--border-color); }
                .details-content { padding: 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <header class="header">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.311a15.045 15.045 0 01-7.5 0C4.508 19.64 2.25 15.354 2.25 10.5 2.25 5.646 4.508 1.36 8.25 1.36c3.742 0 6 4.284 6 9.14 0 4.856-2.258 9.14-6 9.14z" /></svg>
                    <h1>kkFileView Facade Server</h1>
                    <h2 class="zh-title">kkFileView 门面服务</h2>
                    <p>Adding document preview, file thumbnail generation, and extracting file images to JSON for kkFileView.<br>为kkFileView增加文档预览、文件缩略图生成、提取文件图片JSON功能。</p>
                </header>

                <main class="api-grid">
                    <div class="api-card">
                        <h2>Visual Preview <span class="zh-subtitle">可视化预览</span></h2>
                        <p>Renders a document in a user-friendly HTML page.<br>将文档渲染为一个用户友好的 HTML 页面。</p>
                        <pre><code>GET /api/preview?url=&lt;FILE_URL&gt;</code></pre>
                        <div class="example-link"><strong>Example / 示例:</strong> <a href="/api/preview?url=https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" target="_blank">/api/preview?url=.../dummy.pdf</a></div>
                        <details>
                            <summary>View Response Structure / 查看返回结构</summary>
                            <div class="details-content"><pre><code>&lt;!DOCTYPE html&gt;
&lt;html&gt;
  &lt;head&gt;...&lt;/head&gt;
  &lt;body&gt;
    &lt;!-- Renders a full HTML page with document images or an iframe. --&gt;
    &lt;!-- 渲染包含文档图片或 iframe 的完整 HTML 页面。 --&gt;
  &lt;/body&gt;
&lt;/html&gt;</code></pre></div>
                        </details>
                    </div>

                    <div class="api-card">
                        <h2>Structured Content <span class="zh-subtitle">结构化内容提取</span></h2>
                        <p>Extracts content (like image lists or HTML) from documents and returns it in a JSON format.<br>从文档中提取内容（如图片列表或HTML）并以 JSON 格式返回。</p>
                        <pre><code>GET /api/extract?url=&lt;FILE_URL&gt;</code></pre>
                        <div class="example-link"><strong>Example / 示例:</strong> <a href="/api/extract?url=https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" target="_blank">/api/extract?url=.../dummy.pdf</a></div>
                        <details>
                            <summary>View Response Structure / 查看返回结构</summary>
                            <div class="details-content"><pre><code>// Success (Word/PDF/PPT)
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
}</code></pre></div>
                        </details>
                    </div>

                    <div class="api-card">
                        <h2>Thumbnail Generation <span class="zh-subtitle">缩略图生成</span></h2>
                        <p>Generates a thumbnail image for a given file.<br>为指定的文件生成一个缩略图。</p>
                        <pre><code>GET /api/thumbnail?url=&lt;FILE_URL&gt;</code></pre>
                        <div class="example-link"><strong>Example / 示例:</strong> <a href="/api/thumbnail?url=https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf" target="_blank">/api/thumbnail?url=.../dummy.pdf</a></div>
                        <details>
                            <summary>View Response Structure / 查看返回结构</summary>
                            <div class="details-content"><pre><code>// On Success (HTTP 200)
// Returns binary image data with Content-Type: image/png
// 成功时返回二进制图片数据，Content-Type 为 image/png

// On Failure (HTTP 500)
// Returns an empty body
// 失败时返回空内容</code></pre></div>
                        </details>
                    </div>

                    <div class="api-card">
                        <h2>AI Knowledge Base <span class="zh-subtitle">AI 知识库</span></h2>
                        <p>A document that describes the project for AI assistant context.<br>一份为 AI 助手准备的描述项目的文档，作为上下文参考。</p>
                        <pre><code>GET /llm.txt</code></pre>
                        <div class="example-link"><strong>Access File / 访问文件:</strong> <a href="/llm.txt" target="_blank">/llm.txt</a></div>
                    </div>
                </main>
                
                <footer class="footer"><p>Server is running smoothly.</p></footer>
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