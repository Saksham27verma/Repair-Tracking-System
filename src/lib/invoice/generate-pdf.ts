import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import { getReceiptLogoDataUri } from '@/lib/receipt/logo';
import { TaxInvoiceDocument, type TaxInvoiceDocumentProps } from './TaxInvoiceDocument';

export async function generateTaxInvoicePdf(
  data: Omit<TaxInvoiceDocumentProps, 'logoDataUri'>
): Promise<Buffer> {
  const logoDataUri = await getReceiptLogoDataUri();
  const element = React.createElement(TaxInvoiceDocument, {
    ...data,
    logoDataUri: logoDataUri || undefined,
  });
  const pdfBuffer = await renderToBuffer(element);
  return Buffer.from(pdfBuffer);
}
