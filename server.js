const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const archiver = require('archiver');

const app = express();
const PORT = 3000;
const OLLAMA_BASE_URL = 'http://192.168.1.100:11434';

// 确保必要的目录存在
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const LABELS_DIR = path.join(__dirname, 'labels');

async function ensureDirectories() {
  try {
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.mkdir(LABELS_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating directories:', error);
  }
}

ensureDirectories();

// 配置 multer 用于文件上传
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureDirectories();
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只支持图片文件 (jpeg, jpg, png, gif, webp)'));
    }
  }
});

app.use(express.json());
app.use('/uploads', express.static(UPLOAD_DIR));
app.use(express.static('public'));

// 清理标签文本，去除多余的说明文字和引号
function cleanLabelText(text) {
  if (!text) return '';
  
  // 去除首尾空白
  let cleaned = text.trim();
  
  // 去除可能的引号
  cleaned = cleaned.replace(/^["'`]|["'`]$/g, '');
  
  // 如果包含"标签："等前缀，提取后面的内容
  const labelMatch = cleaned.match(/(?:标签[：:]\s*)?(.+)/);
  if (labelMatch) {
    cleaned = labelMatch[1].trim();
  }
  
  // 去除可能的"例如："等说明性文字
  cleaned = cleaned.replace(/^例如[：:]\s*/i, '');
  
  // 去除多余的换行和空白
  cleaned = cleaned.replace(/\n+/g, ', ').replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

// 调用 Ollama API 进行图片识别
async function recognizeImage(imagePath) {
  try {
    const imageBuffer = await fs.readFile(imagePath);
    const imageBase64 = imageBuffer.toString('base64');
    
    const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
      model: 'qwen2.5vl:7b',
      prompt: `你必须完整描述这张图片的所有重要特征。要求：
1. 详细观察图片的所有细节：主要对象、颜色、场景、风格、背景、构图等
2. 用中文简洁描述，格式为逗号分隔的标签
3. 必须包括所有重要的视觉元素，不能遗漏
4. 只输出标签，不要其他说明文字

示例格式："中国剪纸, 无人物, 红色主题, 白色背景"

现在开始描述图片，必须完整描述：`,
      images: [imageBase64],
      stream: false,
      options: {
        temperature: 0.3,
        top_p: 0.9,
        num_predict: 500
      }
    }, {
      timeout: 300000 // 5分钟超时（视觉模型可能需要更长时间）
    });

    return response.data.response || '';
  } catch (error) {
    console.error('Image recognition error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    throw new Error(`图片识别失败: ${error.message}`);
  }
}

// 调用 Ollama API 进行翻译
async function translateText(text) {
  try {
    const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
      model: 'deepseek-r1:8b',
      prompt: `你必须完整翻译以下所有中文标签为英文。要求：
1. 翻译所有标签，不能遗漏任何内容
2. 输出格式：用逗号分隔的简洁英文标签
3. 只输出翻译结果，不要任何说明、解释或其他文字
4. 必须完整输出，不能中途停止

示例格式："china cut paper, no humans, red theme, white background"

现在开始翻译，必须翻译完整：
${text}`,
      stream: false,
      options: {
        temperature: 0.3,
        top_p: 0.9,
        num_predict: 500
      }
    }, {
      timeout: 300000 // 5分钟超时
    });

    let translated = response.data.response || '';
    // 清理翻译结果
    translated = cleanLabelText(translated);
    return translated;
  } catch (error) {
    console.error('Translation error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    throw new Error(`翻译失败: ${error.message}`);
  }
}

// 保存标签到文件
async function saveLabel(imageFilename, labelText) {
  try {
    const labelFilename = path.basename(imageFilename, path.extname(imageFilename)) + '.txt';
    const labelPath = path.join(LABELS_DIR, labelFilename);
    await fs.writeFile(labelPath, labelText.trim(), 'utf8');
    return labelFilename;
  } catch (error) {
    console.error('Save label error:', error.message);
    throw new Error(`保存标签失败: ${error.message}`);
  }
}

// 上传图片并处理
app.post('/api/upload', upload.single('image'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '没有上传文件' });
  }

  try {
    const imagePath = req.file.path;
    const imageFilename = req.file.filename;

    console.log(`开始处理图片: ${imageFilename}`);
    
    // 步骤1: 图片识别
    console.log('步骤1: 正在进行图片识别...');
    const recognitionResult = await recognizeImage(imagePath);
    console.log('图片识别完成');
    
    // 步骤2: 翻译
    console.log('步骤2: 正在进行翻译...');
    const translatedLabel = await translateText(recognitionResult);
    console.log('翻译完成');
    
    // 步骤3: 保存标签文件
    console.log('步骤3: 正在保存标签文件...');
    const labelFilename = await saveLabel(imageFilename, translatedLabel);
    console.log(`标签文件已保存: ${labelFilename}`);
    
    res.json({
      success: true,
      imageFilename: imageFilename,
      labelFilename: labelFilename,
      originalLabel: recognitionResult,
      translatedLabel: translatedLabel,
      imageUrl: `/uploads/${imageFilename}`
    });

  } catch (error) {
    console.error('Processing error:', error);
    res.status(500).json({ error: error.message || '处理失败' });
  }
});

// 获取所有图片和标签
app.get('/api/images', async (req, res) => {
  try {
    const imageFiles = await fs.readdir(UPLOAD_DIR);
    const labelFiles = await fs.readdir(LABELS_DIR);
    
    const images = imageFiles
      .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
      .map(imageFile => {
        const baseName = path.basename(imageFile, path.extname(imageFile));
        const labelFile = labelFiles.find(lf => lf.startsWith(baseName + '.txt'));
        
        return {
          imageFilename: imageFile,
          imageUrl: `/uploads/${imageFile}`,
          labelFilename: labelFile || null,
          hasLabel: !!labelFile
        };
      });

    res.json({ images });
  } catch (error) {
    console.error('Get images error:', error);
    res.status(500).json({ error: '获取图片列表失败' });
  }
});

// 获取标签内容
app.get('/api/label/:filename', async (req, res) => {
  try {
    const labelPath = path.join(LABELS_DIR, req.params.filename);
    const content = await fs.readFile(labelPath, 'utf8');
    res.json({ content });
  } catch (error) {
    res.status(404).json({ error: '标签文件不存在' });
  }
});

// 手动翻译文本
app.post('/api/translate', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: '请输入要翻译的文本' });
    }

    console.log('开始翻译文本...');
    const translated = await translateText(text.trim());
    console.log('翻译完成');
    
    res.json({
      success: true,
      original: text.trim(),
      translated: translated
    });
  } catch (error) {
    console.error('Translation API error:', error);
    res.status(500).json({ error: error.message || '翻译失败' });
  }
});

// 导出所有图片和标签
app.get('/api/export', async (req, res) => {
  try {
    const imageFiles = await fs.readdir(UPLOAD_DIR);
    const labelFiles = await fs.readdir(LABELS_DIR);
    
    const imageFilesList = imageFiles.filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file));
    
    if (imageFilesList.length === 0 && labelFiles.length === 0) {
      return res.status(404).json({ error: '没有文件可导出' });
    }

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename=images-and-labels.zip');

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    // 添加所有图片文件到 images 目录
    for (const imageFile of imageFilesList) {
      const imagePath = path.join(UPLOAD_DIR, imageFile);
      archive.file(imagePath, { name: `images/${imageFile}` });
    }

    // 添加所有标签文件到 labels 目录
    for (const labelFile of labelFiles) {
      const labelPath = path.join(LABELS_DIR, labelFile);
      archive.file(labelPath, { name: `labels/${labelFile}` });
    }

    await archive.finalize();
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: '导出失败' });
  }
});

// 删除图片和标签
app.delete('/api/image/:filename', async (req, res) => {
  try {
    const imageFilename = req.params.filename;
    const imagePath = path.join(UPLOAD_DIR, imageFilename);
    const baseName = path.basename(imageFilename, path.extname(imageFilename));
    const labelPath = path.join(LABELS_DIR, baseName + '.txt');

    await fs.unlink(imagePath).catch(() => {});
    await fs.unlink(labelPath).catch(() => {});

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: '删除失败' });
  }
});

// 批量删除图片和标签
app.post('/api/images/delete', async (req, res) => {
  try {
    const { filenames } = req.body;
    
    if (!Array.isArray(filenames) || filenames.length === 0) {
      return res.status(400).json({ error: '请提供要删除的文件名数组' });
    }

    const results = [];
    
    for (const imageFilename of filenames) {
      try {
        const imagePath = path.join(UPLOAD_DIR, imageFilename);
        const baseName = path.basename(imageFilename, path.extname(imageFilename));
        const labelPath = path.join(LABELS_DIR, baseName + '.txt');

        await fs.unlink(imagePath).catch(() => {});
        await fs.unlink(labelPath).catch(() => {});

        results.push({ filename: imageFilename, success: true });
      } catch (error) {
        results.push({ filename: imageFilename, success: false, error: error.message });
      }
    }

    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ error: '批量删除失败' });
  }
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`Ollama 服务器: ${OLLAMA_BASE_URL}`);
});

