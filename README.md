# AI 图片标签识别与翻译系统

一个基于 Node.js 和 Ollama 的网页应用，用于图片识别、标签生成和翻译。

## 功能特性

- 📸 图片上传（支持拖拽上传）
- 🤖 使用 qwen2.5-vl:7b 模型进行图片识别
- 🌐 使用 deepseek-r1:8b 模型进行标签翻译
- 📝 自动生成每张图片对应的 .txt 标签文件
- 📦 批量导出所有标签文件为 ZIP

## 系统要求

- Node.js 14+ 
- Ollama 服务器（运行在 192.168.1.100:11434）
- 已安装的模型：
  - `qwen2.5-vl:7b`
  - `deepseek-r1:8b`

## 安装步骤

1. 安装依赖：
```bash
npm install
```

2. 确保 Ollama 服务器运行在 `192.168.1.100:11434`，并且已安装所需模型：
```bash
# 在 Ollama 服务器上执行
ollama pull qwen2.5-vl:7b
ollama pull deepseek-r1:8b
```

3. 启动服务器：
```bash
npm start
```

4. 在浏览器中打开：`http://localhost:3000`

## 使用方法

1. **上传图片**：点击"选择图片"按钮或直接拖拽图片到上传区域
2. **等待处理**：系统会自动识别图片并生成英文标签
3. **查看标签**：每张图片下方会显示生成的标签内容
4. **导出标签**：点击"导出所有标签"按钮下载 ZIP 文件

## 项目结构

```
translateWeb/
├── server.js          # Express 服务器
├── package.json       # 项目配置
├── public/
│   └── index.html     # 前端页面
├── uploads/           # 上传的图片（自动创建）
└── labels/            # 生成的标签文件（自动创建）
```

## API 接口

- `POST /api/upload` - 上传图片并处理
- `GET /api/images` - 获取所有图片列表
- `GET /api/label/:filename` - 获取指定标签文件内容
- `GET /api/export` - 导出所有标签为 ZIP
- `DELETE /api/image/:filename` - 删除图片和标签

## 注意事项

- 图片大小限制：10MB
- 支持的图片格式：JPEG, JPG, PNG, GIF, WEBP
- 处理时间取决于 Ollama 服务器的性能，可能需要几分钟

