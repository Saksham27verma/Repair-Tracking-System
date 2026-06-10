export const RECEIPT_TEMPLATE_KEY = 'repair_receipt_html';

export const RECEIPT_DEFAULTS = {
  documentType: 'Device Drop-Off Receipt',
  footerDisclaimer:
    'This is a computer-generated receipt, thus it does not require any physical signature or stamps.',
  footerTag: 'Device Intake Record / Patient Copy',
  trackingInstructions:
    'To check your repair status, please ask our centre staff for the tracking link and log in using your registered phone number ({{PATIENT_PHONE}}).',
  termsIntro: 'Repair Terms & Service Conditions',
} as const;

export const COMPANY_CONFIG = {
  legalName: 'Hope Digital Innovations Pvt Ltd',
  brandName: 'Hearing Hope',
  address: 'G-14, Ground Floor, King Mall, Rohini, Delhi - 85',
  phone: '9711871169',
  website: 'hearinghope.in',
  gstin: '07XXXXXXXXXX1Z5',
  state: 'Delhi',
  stateCode: '07',
  brandRed: '#A80000',
  logoPath: 'public/images/logohope.svg',
} as const;
