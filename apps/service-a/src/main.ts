import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable validation pipe
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));

  // // Setup Swagger
  // const config = new DocumentBuilder()
  //   .setTitle('Service A API')
  //   .setDescription('Service A API documentation')
  //   .setVersion('1.0')
  //   .build();
  //
  // const document = SwaggerModule.createDocument(app as any, config);
  // SwaggerModule.setup('api', app as any, document);

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Service A is running on: http://localhost:${process.env.PORT ?? 3000}`);
}
bootstrap();
