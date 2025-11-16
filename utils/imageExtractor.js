// utils/imageExtractor.js
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
require('dotenv').config();
const KKFILEVIEW_BASE_URL = process.env.KKFILEVIEW_BASE_URL;

if (!KKFILEVIEW_BASE_URL) {
    console.error("[FATAL] KKFILEVIEW_BASE_URL is not defined in your .env file.");
    process.exit(1); // 如果变量未定义，则退出程序
}
function encodeUrlForKkFileView(originalUrl) {
    const base64Url = Buffer.from(originalUrl).toString('base64');
    return encodeURIComponent(base64Url);
}

// 传入的 officePreviewType 仅作为默认值
async function extractContent(fileUrl, officePreviewType = 'image') {
    // --- [改进 2] ---
    // 检查文件扩展名，如果是 Excel，则强制使用 'html' 预览类型
    let effectiveOfficePreviewType = officePreviewType;
    try {
        const extension = path.extname(new URL(fileUrl).pathname).toLowerCase();
        if (['.xls', '.xlsx'].includes(extension)) {
            effectiveOfficePreviewType = 'html';
            console.log(`[INFO] Excel file (${extension}) detected. Forcing officePreviewType=html.`);
        }
    } catch (e) {
        console.warn(`[WARN] Could not parse file URL to determine extension: ${fileUrl}`);
    }

    const encodedUrl = encodeUrlForKkFileView(fileUrl);
    // 使用 effectiveOfficePreviewType
    const previewUrl = `${KKFILEVIEW_BASE_URL}/onlinePreview?url=${encodedUrl}&officePreviewType=${effectiveOfficePreviewType}`;

    console.log(`[DEBUG] Requesting kkFileView with URL: ${previewUrl}`);

    try {
        const { data: html } = await axios.get(previewUrl, {
            timeout: 60000 
        });

        if (html.includes('系统暂不支持在线预览')) {
            throw new Error('Unsupported file type by kkFileView');
        }

        const $ = cheerio.load(html);

        // 1. 提取 PPT 的 JSON 数据
        let pptData = null;
        $('script').each((i, el) => {
            if (pptData) return; // 优化：一旦找到就停止遍历
            const scriptContent = $(el).html();
            if (scriptContent && scriptContent.includes('var resultData =')) {
                const startIndex = scriptContent.indexOf('{', scriptContent.indexOf('var resultData ='));
                if (startIndex === -1) return;
                
                let openBraces = 0;
                let endIndex = -1;
                for (let j = startIndex; j < scriptContent.length; j++) {
                    if (scriptContent[j] === '{') openBraces++;
                    else if (scriptContent[j] === '}') openBraces--;
                    if (openBraces === 0) {
                        endIndex = j;
                        break;
                    }
                }
                
                if (endIndex !== -1) {
                    const jsonString = scriptContent.substring(startIndex, endIndex + 1);
                    try {
                        const repairedJsonString = jsonString.replace(/,\s*([}\]])/g, '$1');
                        pptData = JSON.parse(repairedJsonString);
                    } catch (e) {
                        console.error('[ERROR] Failed to parse extracted JSON string.', e.message);
                        console.error('[DEBUG] Extracted JSON string was:', jsonString);
                    }
                }
            }
        });
        if (pptData) {
            return { type: 'ppt', data: pptData };
        }

        // 2. 提取 Excel 的 iframe src
        const iframeEl = $('iframe');
        if (iframeEl.length > 0) {
            const iframeSrc = iframeEl.attr('src');
            console.log(`[DEBUG] Found iframe with src: ${iframeSrc}`);
            if (iframeSrc) {
                const excelHtmlUrl = new URL(iframeSrc, KKFILEVIEW_BASE_URL).toString();
                return { type: 'excel', url: excelHtmlUrl };
            }
        }

        // 3. 提取 Word/PDF 的图片列表
        const imageEls = $('.img-area .my-photo');
        if (imageEls.length > 0) {
            const imageUrls = [];
            imageEls.each((i, el) => {
                const src = $(el).attr('data-src') || $(el).attr('src');
                if (src && !src.includes('loading.gif')) {
                    const absoluteUrl = new URL(src, previewUrl).toString();
                    imageUrls.push(absoluteUrl);
                }
            });
            console.log(`[DEBUG] Found ${imageUrls.length} image URLs.`);
            if (imageUrls.length > 0) {
                return { type: 'images', urls: imageUrls };
            }
        }

        // 优雅降级逻辑
        console.log(`[INFO] No structured content found for ${fileUrl}. Falling back to raw HTML proxy.`);
        
        $('link, script, img, a').each((i, el) => {
            const element = $(el);
            ['href', 'src'].forEach(attr => {
                const relativeUrl = element.attr(attr);
                if (relativeUrl && !relativeUrl.startsWith('http') && !relativeUrl.startsWith('//') && !relativeUrl.startsWith('data:')) {
                    try {
                       const absoluteUrl = new URL(relativeUrl, KKFILEVIEW_BASE_URL).toString();
                       element.attr(attr, absoluteUrl);
                    } catch (e) {
                       console.warn(`[WARN] Could not create absolute URL for: ${relativeUrl}`);
                    }
                }
            });
        });

        return { type: 'fallback', html: $.html() };

    } catch (error) {
        console.error(`Error processing ${fileUrl} (Requesting ${previewUrl}):`, error.message);
        throw error;
    }
}

module.exports = { extractContent, KKFILEVIEW_BASE_URL, encodeUrlForKkFileView };