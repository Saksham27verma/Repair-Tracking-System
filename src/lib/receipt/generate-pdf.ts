import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { getReceiptLogoDataUri } from './logo';
import { RepairReceiptDocument, type RepairReceiptDocumentProps } from './RepairReceiptDocument';

export async function generateRepairReceiptPdf(
  data: Omit<RepairReceiptDocumentProps, 'logoDataUri'>
): Promise<Buffer> {
  const logoDataUri = await getReceiptLogoDataUri();
  const element = React.createElement(RepairReceiptDocument, {
    ...data,
    logoDataUri: logoDataUri || undefined,
  });
  const pdfBuffer = await renderToBuffer(element);
  return Buffer.from(pdfBuffer);
}
