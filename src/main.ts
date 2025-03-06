import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestApplication, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrapNest() {
  const app = await NestFactory.create<NestApplication>(AppModule);
  app.setGlobalPrefix('api', { exclude: ['/healthcheck'] });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.enableCors();

  await setUpSwagger(app);
  await app.listen(process.env.PORT || 8080, '0.0.0.0');

  console.log(`Server is running on port ${process.env.PORT || 8080}`);
}

async function setUpSwagger(app: NestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Mentat Backend')
    .setDescription('API description')
    .setVersion('1.0')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'authorization-token',
        in: 'header',
        description: 'Enter type',
      },
      'authorization-token',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
}

bootstrapNest();
