import type { NextRequest } from 'next/server';

/** Base URL for links in emails (production should set NEXT_PUBLIC_APP_URL). */
export function getAppBaseUrl(request?: NextRequest): string {
  const fromEnv = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  if (request?.nextUrl?.origin) return request.nextUrl.origin;
  return 'http://localhost:3000';
}

export function getRepairApprovalUrl(repairPublicId: string, request?: NextRequest): string {
  return `${getAppBaseUrl(request)}/repairs/${repairPublicId}`;
}
