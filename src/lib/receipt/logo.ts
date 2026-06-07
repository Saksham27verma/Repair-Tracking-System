import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { COMPANY_CONFIG } from './receipt-template.config';

export async function getReceiptLogoDataUri(): Promise<string> {
  const logoPath = path.join(process.cwd(), COMPANY_CONFIG.logoPath);

  if (!fs.existsSync(logoPath)) {
    return '';
  }

  if (logoPath.endsWith('.svg')) {
    const pngBuffer = await sharp(logoPath).resize(180).png({ compressionLevel: 9 }).toBuffer();
    return `data:image/png;base64,${pngBuffer.toString('base64')}`;
  }

  const imageBuffer = fs.readFileSync(logoPath);
  const mime = logoPath.endsWith('.png') ? 'image/png' : 'image/jpeg';
  return `data:${mime};base64,${imageBuffer.toString('base64')}`;
}
