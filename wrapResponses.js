const fs = require('fs');
const path = require('path');

// 读取 openAPI.json
const inputPath = path.resolve(__dirname, 'openAPI.json');
const outputPath = path.resolve(__dirname, 'openAPI.transformed.json');

const raw = fs.readFileSync(inputPath, 'utf8');
const openAPI = JSON.parse(raw);

// 添加 ResponseWrapper schema 到 components.schemas
openAPI.components = openAPI.components || {};
openAPI.components.schemas = openAPI.components.schemas || {};

openAPI.components.schemas.ResponseWrapper = {
  type: 'object',
  properties: {
    success: { type: 'boolean', example: true },
    data: { type: 'object' }
  }
};

// 遍历 paths
for (const [pathKey, pathItem] of Object.entries(openAPI.paths)) {
  for (const method of Object.keys(pathItem)) {
    const operation = pathItem[method];
    if (!operation.responses) continue;

    const response200 = operation.responses['200'];
    if (
      response200 &&
      response200.content &&
      typeof response200.content === 'object'
    ) {
      for (const [contentType, content] of Object.entries(response200.content)) {
        const originalSchema = content.schema;
        if (!originalSchema) continue;

        // 包装成 allOf
        content.schema = {
          allOf: [
            { $ref: '#/components/schemas/ResponseWrapper' },
            {
              type: 'object',
              properties: {
                data: originalSchema
              }
            }
          ]
        };
      }
    }
  }
}

// 写入新的 JSON 文件
fs.writeFileSync(outputPath, JSON.stringify(openAPI, null, 2), 'utf8');
console.log(`✅ 已生成带响应包装的 OpenAPI 文件：${outputPath}`);
