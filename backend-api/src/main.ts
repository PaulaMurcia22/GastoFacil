import "reflect-metadata";

import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module";
import { getAppConfig } from "./config/env";

async function bootstrap() {
  const config = getAppConfig();
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: config.corsOrigin === "*" ? true : config.corsOrigin,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(config.port);
}

void bootstrap();
