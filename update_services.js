const fs = require('fs');
const path = require('path');

const services = ['catalog-service', 'order-service', 'chat-service', 'api-gateway'];

services.forEach(service => {
  console.log(`Updating ${service}...`);
  
  // Update app.module.ts
  const appModulePath = path.join(__dirname, 'backend', service, 'src', 'app.module.ts');
  if (fs.existsSync(appModulePath)) {
    let appModuleContent = fs.readFileSync(appModulePath, 'utf8');
    if (!appModuleContent.includes('PrometheusModule')) {
      appModuleContent = appModuleContent.replace(
        "import { Module } from '@nestjs/common';",
        "import { Module } from '@nestjs/common';\nimport { PrometheusModule } from '@willsoto/nestjs-prometheus';"
      );
      appModuleContent = appModuleContent.replace(
        "imports: [",
        "imports: [\n    PrometheusModule.register(),"
      );
      fs.writeFileSync(appModulePath, appModuleContent);
      console.log(`  Updated app.module.ts for ${service}`);
    }
  }

  // Update main.ts
  const mainPath = path.join(__dirname, 'backend', service, 'src', 'main.ts');
  if (fs.existsSync(mainPath)) {
    let mainContent = fs.readFileSync(mainPath, 'utf8');
    if (!mainContent.includes('WinstonModule')) {
      mainContent = "import './tracing';\n" + mainContent;
      mainContent = mainContent.replace(
        "import { NestFactory } from '@nestjs/core';",
        "import { NestFactory } from '@nestjs/core';\nimport { WinstonModule } from 'nest-winston';\nimport * as winston from 'winston';"
      );
      
      const replacement = `const app = await NestFactory.create(AppModule, {
    logger: WinstonModule.createLogger({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json()
          ),
        }),
      ],
    }),
  });`;

      mainContent = mainContent.replace(
        "const app = await NestFactory.create(AppModule);",
        replacement
      );
      
      fs.writeFileSync(mainPath, mainContent);
      console.log(`  Updated main.ts for ${service}`);
    }
  }
});
console.log('Done updating services.');
