import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(process.env.PORT ?? 3000); // I removed the "await app.listen(3000) line and use file .env to import PORT 3000 into .env. After that i call the port from this file main.ts
  console.log('Application is running');
}
bootstrap();
