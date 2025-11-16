// utils/thumbnailer.js
const axios = require('axios');
const sharp = require('sharp');
const puppeteer = require('puppeteer');
const path = require('path');
const { extractContent, KKFILEVIEW_BASE_URL, encodeUrlForKkFileView } = require('./imageExtractor');

const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.tiff'];
const OFFICE_PDF_EXTENSIONS = ['.doc', '.docx', '.ppt', '.pptx', '.pdf'];
const EXCEL_EXTENSIONS = ['.xls', '.xlsx'];

async function getThumbnail(fileUrl) {
    const extension = path.extname(new URL(fileUrl).pathname).toLowerCase();

    // 1. 对于常见图片格式，直接处理
    if (IMAGE_EXTENSIONS.includes(extension)) {
        try {
            const response = await axios({ url: fileUrl, responseType: 'arraybuffer' });
            return sharp(response.data).resize(640).jpeg({ quality: 80 }).toBuffer(); 
        } catch (error) {
            console.error('Failed to process direct image thumbnail:', error.message);
            throw new Error('Failed to fetch or process image');
        }
    }

    // 2. 对于 Word/PDF/PPT，调用解析器取第一张图
    if (OFFICE_PDF_EXTENSIONS.includes(extension)) {
        try {
            const result = await extractContent(fileUrl);
            let firstImageUrl = null;
            if (result.type === 'images' && result.urls.length > 0) {
                firstImageUrl = result.urls[0];
            } else if (result.type === 'ppt' && result.data.data.length > 0) {
                firstImageUrl = result.data.data[0].url;
            }
            
            if (firstImageUrl) {
                const response = await axios({ url: firstImageUrl, responseType: 'arraybuffer' });
                return sharp(response.data).resize(640).jpeg({ quality: 80 }).toBuffer(); 
            }
        } catch (error) {
            console.log('Office/PDF thumbnail extraction failed, falling back to Puppeteer');
        }
    }

    // 3. 对于其他文件(包括 Excel 和失败的 Office 文件)，使用 Puppeteer 网页快照
    let browser = null;
    try {
        browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
        const page = await browser.newPage();
        const encodedUrl = encodeUrlForKkFileView(fileUrl);

        // --- [改进 2] ---
        // 确保 Excel 和其他文件使用正确的预览类型生成快照
        let previewUrl = `${KKFILEVIEW_BASE_URL}/onlinePreview?url=${encodedUrl}`;
        if (EXCEL_EXTENSIONS.includes(extension)) {
            previewUrl += '&officePreviewType=html';
        } else {
            previewUrl += '&officePreviewType=image';
        }
        
        console.log(`[PUPPETEER] Navigating to ${previewUrl} for thumbnail.`);
        
        await page.goto(previewUrl, { waitUntil: 'networkidle2', timeout: 60000 });
        await new Promise(resolve => setTimeout(resolve, 1000)); // 等待 JS 渲染
        
        const isUnsupported = await page.evaluate(() => {
            return document.body.innerText.includes('系统暂不支持在线预览');
        });

        if (isUnsupported) {
            throw new Error('Unsupported file type by kkFileView for Puppeteer thumbnail');
        }

        const buffer = await page.screenshot({ type: 'png', fullPage: false, clip: { x: 0, y: 0, width: 800, height: 600 } });
        
        // 压缩快照
        return sharp(buffer).resize(640).png().toBuffer();
    } catch (error) {
        console.error('Puppeteer thumbnail generation failed:', error.message);
        throw error;
    } finally {
        if (browser) await browser.close();
    }
}

module.exports = { getThumbnail };