import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * Construye las opciones de conexión de TypeORM a partir de variables de entorno.
 * En desarrollo se usa `synchronize` para no depender de migraciones todavía (Fase 1).
 */
export function buildTypeOrmOptions(
  config: ConfigService,
): TypeOrmModuleOptions {
  const isProd = config.get<string>('NODE_ENV') === 'production';

  return {
    type: 'postgres',
    host: config.get<string>('DB_HOST', 'localhost'),
    port: config.get<number>('DB_PORT', 5432),
    username: config.get<string>('DB_USERNAME', 'eirys'),
    password: config.get<string>('DB_PASSWORD', 'eirys'),
    database: config.get<string>('DB_NAME', 'eirys'),
    autoLoadEntities: true,
    synchronize: !isProd,
    logging: config.get<string>('DB_LOGGING', 'false') === 'true',
  };
}
