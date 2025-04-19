export type RepairStatus =
  | 'Received'
  | 'Sent to Manufacturer'
  | 'Returned from Manufacturer'
  | 'Ready for Pickup'
  | 'Completed';

export type EstimateStatus = 
  | 'Pending' 
  | 'Approved' 
  | 'Declined' 
  | 'Not Required';

export type WarrantyStatus = '2 years warranty' | '3 years warranty' | '4 years warranty' | 'Out of warranty';

export type PaymentMode = 'Cash' | 'Card' | 'UPI' | 'Bank Transfer';

export type Ear = 'left' | 'right' | 'both';

export type CompanyType = 
  | 'Signia'
  | 'Phonak'
  | 'Widex'
  | 'Starkey'
  | 'GNResound'
  | 'Unitron'
  | 'Oticon'
  | 'Siemens'
  | 'Others';

export type MouldType = 
  | 'Soft Half Concha Mould'
  | 'Soft Full Concha Mould'
  | 'Hard Half Concha Mould'
  | 'Hard Full Concha Mould'
  | 'Soft Silicon Mould'
  | 'Hard Acrylic Mould'
  | 'Other';

// Array of hearing aid models
export const HEARING_AID_MODELS = [
  'BTE FAST P',
  'BTE FUN SP',
  'BTE RUN P',
  'BTE RUN SP',
  'CIC PROMPT CLICK LEFT',
  'ITC PROMPT CLICK LEFT',
  'PROMPT CUSTOM CIC',
  'PROMPT CUSTOM ITC',
  'BTE PROMPT P',
  'BTE PROMPT SP',
  'CIC INTUIS 3 CLICK LEFT',
  'INTUIS 3 CLICK ITC',
  'INTUIS 3 CUSTOM CIC',
  'INTUIS 3 CUSTOM ITC',
  'BTE INTUIS 3 P',
  'BTE INTUIS 3 SP',
  'INTUIS 3 RIC 312',
  'CIC SILK 1 PX RIGHT',
  'CICI INSIO 1 PX',
  'ITC INSIO 1 PX',
  'CIC INSIO 2 PX',
  'ITC INSIO 2 PX',
  'CIC INSIO 3 PX',
  'ITC INSIO 3 PX',
  'RIC PURE 1 PX',
  'RIC PURE 2 PX',
  'RIC PURE 3 PX',
  'BTE MOTION P 1 PX',
  'BTE MOTION SP 1 PX',
  'BTE MOTION P 2 PX',
  'BTE MOTION SP 2 PX',
  'BTE MOTION P 3 PX',
  'BTE MOTION SP 3 PX',
  'CIC INSIO 1 NX',
  'ITC INSIO 1 NX',
  'IIC INSIO 1 NX',
  'CIC INSIO 2 NX',
  'CIC INSIO 3 NX',
  'CIC SILK 1X',
  'RIC PURE 312 1X',
  'PURE C&G 1X (piece)',
  'RIC PURE C&G 2X (piece)',
  'KIT PURE C&G 1X (pair)',
  'KIT PURE C&G 2X (pair)',
  'KIT PURE C&G 3X (pair)',
  'BTE MOTION C&G P 1X (piece)',
  'BTE MOTION C&G SP 1X(piece)',
  'BYE MOTION C&G P 2X (piece)',
  'BTE MOTION C&G SP 2X (piece)',
  'KIT BTE MOTION C&G P 1X (pair)',
  'KIT BTE C&G MOTION SP 1X (pair)',
  'KIT BTE MOTION C&G P 2X (pair)',
  'KIT BTE MOTION C&G SP 2X',
  'ITE ACTIVE',
  'ITE ACTIVE PRO',
  'BTE INTUIS 4.0 P',
  'BTE INTUIS 4.0 SP',
  'BTE INTUIS 4.1 P',
  'BTE INTUIS 4.1 SP',
  'KIT PURE C&G 5 AX',
  'M CIC 100 ( Magnify)',
  'ITC MXP 30 ( Magnify)',
  'KIT PURE C&G 1AX',
  'KIT PURE C&G 2 AX',
  'KIT STYLETTO 1AX',
  'BTE L-30 UP',
  'KIT STYLETTO 5 AX',
  'ITC MXP 50 ( Magnify)',
  'RIC PURE 312 2 AX',
  'KIT STYLETTO 7 AX',
  'CIC 50 (ENJOY)',
  'BTE Naida M-30 SP',
  'BTE KIT MBR3D 50',
  'BTE Naida P-30 R single',
  'PURE C& G 1 AX ( Piece)',
  'KIT PURE C&G 7 AX',
  'KIT STYLETTO 3 AX',
  'M CIC 50 ( Magnify)',
  'BTE MBR3D 50 ( piece)',
  'ITC MXP 100 ( Magnify)',
  'BTE ENJOY FP 50',
  'RIC PURE 312 1AX',
  'KIT PURE C&G 3 AX',
  'BTE ENJOY FP 30',
  'KIT STYLETTO 2 AX',
  'M CIC 30 ( Magnify)',
  'Audeo M-30 R single',
  'BTE MBR3D 100 ( piece)',
  'BTE KIT MBR3D 100',
  'KIT MRR4D 110 (Moment Sheer)',
  'Audeo L-30 R single machine',
  'Audeo P-30 R single machine',
  'BTE VITUS UP',
  'AUDEO L-30 RL',
  'PURE CHARGE & GO 2AX',
  'BTE VESUVIO XTM P P4',
  'BTE VESUVIO XTM XP P4',
  'RIC MBR3D 50 ( piece)',
  'NOVAL 178',
  'BTE F-138',
  'RIC PURE 312 2X',
  'Noval 172',
  'CIC SILK 1X R',
  'Ric 312 7AX',
  'CIC Silk 1X L',
  'INTUIS 3 CUSTOM CIC',
  'Audeo L-90 R',
  'Signia S-10',
  'BTE NAIDA L-30 UP',
  'BTE NAIDA P-30 UP',
  'BTE MAGNIFY M-50',
  'BTE Enjoy E-30 FA',
  'Magnify MRB2D-50 RIC 312',
  'CIC Enjoy E-50 Left',
  'CIC Enjoy E-50 Right',
  'BTE Enjoy E-50 FS',
  'BTE Enjoy E-30 FP',
  'Demo KIT Pure 312 AX',
  'Magnify MRB2D 100 312',
  'Battery 10 size',
  'Battery 13 size',
  'Battery 312 size',
  'Battery 675 size',
  'Audeo L-50 R',
  'RIC PURE 312 3X',
  'BTE MOTION 13 P 1NX',
  'BTE INTUIS 4.2 SP',
  'BTE INTUIS 4.2 P',
  'Pure charge & Go 1X',
  'BTE VITUS +',
  'BTE RETUBING TIPS',
  'SYRINGE FOR IMPRESSION',
  'BTE TIPS',
  'CIC INSIO 1PX',
  'AUDEO L-50 RL',
  'Slim L-R RL',
  'KIT BTE NAIDA L-50 RL',
  'SILK 2X',
  'CROS/BiCROS Silk X Transmitter',
  'SILK 3X',
  'KIT SMARTRIC R D 440 DEMO',
  'CIC PROMPT FACEPLATE 65DB RECEIVER',
  'ITC PROMPT FACEPLATE LEFT 65DB RECEIVER',
  'ITC PROMPT FACEPLATE RIGHT 65 DB RECEIVER',
  'ITC VIRTO 312',
  'BTE AXON B-18',
  'PURE 312 5 AX',
  'PTA test',
  'Virto V-30 CIC',
  'BERA Test',
  'OAE Test',
  'Impedence Test',
  'Aided Audiometry',
  'Speech Discrimination Test',
  'Free Field Audiometry Test',
  'BOA Test',
  'PURE CHARGE & GO 1AX',
  'RIC CUSTOM MOULD',
  'BTE Mould Half Concha',
  'BTE Mould Full Concha',
  'MOMENT MRB2D 220 RIC 312',
  'BTE DYNAMO SP 8',
  'None',
  'Kit Active Pro',
  'CIC PROMPT CLICK RIGHT',
  'ITC PROMPT CLICK RIGHT',
  'CIC SILK 1 PX LEFT',
  'AUDEO L-70 RL',
  'AUDEO LR CROS',
  'BTE MOULD SOFT TIP SIZE',
  'BTE HARD MOULD FULL CONCHA',
  'Magnify 100 BTE 13D',
  'MAGNIFY 100 BTE 13 D',
  'VESUVIO STF P T3 BG',
  'VESUVIO STF XP T3 BG',
  'Kit Audeo L-30 R',
  'VIRTO P-30 312',
  'KIT AUDEO M -30 R',
  'AUDEO L-70 R',
  'DEMO PURE 312 NX',
  'DEMO PURE C & GO AX',
  'DEMO PURE 312 AX',
  'DEMO MOTION C & GO SP X',
  'DEMO BTE NAIDA UP',
  'DEMO AUDEO LUMITY',
  'DEMO MOMENT 110',
  'VITRO B-30',
  'VIRTO B-30',
  'TERRA+ BTE-UP',
  'ZIRCON-2 RIC MINI RITE',
  'KIT Silk C&Go 3 IX',
  'KIT AUDEO L-30 RL',
  'KIT SMARTRIC R D 110 TC',
  'PURE CHARGE& GO 1X SINGLE',
  'EAR HUK',
  'TERRA+BTE-SP',
  'TERRA-BTE-UP',
  'PURE 3PX',
  'BTE VESUVIO STF XP T3',
  'ITE CROSS SILK C& G 1X',
  'ITE SILK C&G S 31X',
  'KIT INSIO C&GO 1AX',
  'NAIDA L-70 BTE UP',
  'combi BTE 2 no.EPS ( PHONAK CHARGER)',
  'TERRA-BTE-SP',
  'ENYA 2 ITC',
  'ITC ENYA 2',
  'CIC INTUIS 3 CLICK RIGHT',
  'NEXIA CIC 4',
  'ITC INSIO C&GO 1AX',
  'KIT SILK C&GO DEMO IX',
  'VIRTO P-70 CIC',
  'Audeo L-90 PR',
  'KIT SILK 5 IX',
  'SILK 5 IX KIT',
  'KIT MAGNIFY MRR2D M05 RIC',
  'KIT BTE NAIDA L-30 PR',
  'RIC PURE 2NX',
  'KIT PURE C&G IA',
  'KIT PURE C&G 1IX',
  'Audeo L-90 RL',
  'BTE MOTION C&G P 1X (SINGLE)',
  'MOMENT 110-CIC',
  'KE288 BTE',
  'RIC KEY261',
  'NEXIA 760S-MICRO RIE',
  'DEMO X STYLETTO',
  'PURE C&GO SDEMO DIX(PAIR)',
  'STYLETTO 5 IX',
  'TERRA+M-BTE',
  'SET PORTABLE CHARGER RIC',
  'MULTI CHARGER',
  'ORION C&GO SP',
  'ORION C&GO P',
  'ORION C&G RIC 100',
  'ORION C&GO P 50',
  'ORION C&GO RIC 100',
  'ORION C&GO P 100',
  'KIT PURE C&GO 2 IX',
  'KIT STYLETTO 1 IX',
  'BTE IMPACT 100',
  'KIT PURE C&GO 1AX',
  'KIT ACTIVE IX',
  'KIT ACTIVE X',
  'NEXIA- 4TO9 RIE',
  'ORION C&G SP 200',
  'KIT SILK C&GO 1 IX',
  'ORION C&GO SP 50',
  'ORION C&GO SP 100',
  'KIT STYLETTO 2IX',
  'ORION C &GO RIC 50',
  'KIT NAIDA L-50 PR',
  'INTIUS 2CIC',
  'KIT PURE C&GO 3IX',
  'ORION C&GO P 75 BTE',
  'ORION C&G SP 75 BTE',
  'Audeo M30-R',
  'KEY 488 HP BTE',
  'KIT PURE C&G 7 IX',
  'PURE C&G 7 IX (single)',
  'kit smart ric',
  'KIT PURE C&G 5 IX',
  'RIC ORION C&G 200',
  'ORION C&G SP 100',
  'KEY461 RIC',
  'MAGNIFY MBB2-30 BTE',
  'NOAHLINK WIRELESS',
  'MAGNIFY MBB3D-50 BTE',
  'ENJOY-30-ITC',
  'KIT MAGNIFY MBR3D-50 BTE',
  'NAIDA P-30 PR (KIT)',
  'ORION C&G 75 RIC',
  'KIT INSIO C&GO 1AX -ITC',
  'BTE FUN P',
  'KIT STYLETTO 5 IX',
  'PURE C&GO 1IX (SINGLE)',
  'KEY 298 SP BTE',
  'ENJOY-30-ITC(DIGITAL HEARING AID )',
  'VIRTO P-30 10',
  'KIT INSIO C&GO 1AX -ITE',
  'ORION C&GO P 200 BTE',
  'PURE C&G 3 IX(SINGLE)',
  'IIC INSIO 2 IX',
  'NEXIA 460S RIC',
  'CIC INSIO 1 IX',
  'MAGNIFY MRR2D M100 M RIC RD KIT',
  'Other'
];

export interface RepairRecord {
  id: string;
  repair_id: string;
  created_at: string;
  updated_at: string;
  status: RepairStatus;
  
  // Customer Information
  patient_name: string;
  phone: string;
  email?: string;
  company?: CompanyType;
  
  // Product Information
  model_item_name: string;
  serial_no: string;
  quantity: number;
  warranty: WarrantyStatus;
  ear?: Ear;
  mould?: MouldType;
  purpose: string;
  
  // Notification Preferences
  notification_preference?: 'email' | 'sms' | 'both';
  
  // Dates
  date_of_receipt: string;
  date_out_to_manufacturer?: string;
  date_received_from_manufacturer?: string;
  date_out_to_customer?: string;
  
  // Financial Information
  repair_estimate_by_company?: number;
  estimate_by_us?: number;
  customer_paid?: number;
  payment_mode?: PaymentMode;
  
  // Estimate Approval
  estimate_status?: EstimateStatus;
  estimate_approval_date?: string;
  
  // Additional Information
  programming_done?: boolean;
  remarks?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  created_at: string;
  updated_at: string;
  repairs?: RepairRecord[];
}

export interface DashboardStats {
  active_repairs: number;
  awaiting_manufacturer: number;
  ready_for_pickup: number;
  completed_repairs: number;
  overdue_repairs: number;
} 