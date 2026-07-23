import { randomUUID } from 'node:crypto';
import { extname, join } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';

export const PRODUCT_IMAGES_DIR = join(process.cwd(), 'uploads', 'products');
export const PRODUCT_IMAGES_PUBLIC_PATH = '/api/uploads/products';

/** Escribe el buffer subido a disco con un nombre único y devuelve el filename. */
export async function saveProductImageFile(file: Express.Multer.File): Promise<string> {
  await mkdir(PRODUCT_IMAGES_DIR, { recursive: true });
  const filename = `${randomUUID()}${extname(file.originalname)}`;
  await writeFile(join(PRODUCT_IMAGES_DIR, filename), file.buffer);
  return filename;
}
