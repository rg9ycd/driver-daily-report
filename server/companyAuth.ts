import { timingSafeEqual } from "node:crypto";
import { parse } from "cookie";
import { jwtVerify, SignJWT } from "jose";
import type { Request } from "express";
import { ENV } from "./_core/env";

export const COMPANY_SESSION_COOKIE = "driver_company_session";
const SESSION_TTL_SECONDS = 60 * 60 * 12;
const SESSION_KIND = "driver-company-session";

export type CompanySession = {
  passwordVersion: string;
};

export function sessionHasCurrentPasswordVersion(session: CompanySession, currentPasswordVersion: string | undefined) {
  return Boolean(currentPasswordVersion) && session.passwordVersion === currentPasswordVersion;
}

function secretKey() {
  return new TextEncoder().encode(ENV.cookieSecret);
}

function safeEqual(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  if (actualBuffer.length !== expectedBuffer.length || expectedBuffer.length === 0) return false;
  return timingSafeEqual(actualBuffer, expectedBuffer);
}

export function isCompanyLoginConfigured() {
  return Boolean(process.env.COMPANY_LOGIN_ID && process.env.COMPANY_LOGIN_PASSWORD && process.env.COMPANY_PASSWORD_VERSION && ENV.cookieSecret);
}

export function validateCompanyCredentials(loginId: string, password: string) {
  if (!isCompanyLoginConfigured()) return false;
  return safeEqual(loginId, process.env.COMPANY_LOGIN_ID ?? "") && safeEqual(password, process.env.COMPANY_LOGIN_PASSWORD ?? "");
}

export async function createCompanySessionToken() {
  const passwordVersion = process.env.COMPANY_PASSWORD_VERSION;
  if (!passwordVersion || !ENV.cookieSecret) throw new Error("共通ログインの設定が完了していません。");

  return new SignJWT({ kind: SESSION_KIND, passwordVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secretKey());
}

export async function readCompanySession(req: Request): Promise<CompanySession | null> {
  const cookieHeader = req.headers.cookie;
  const token = cookieHeader ? parse(cookieHeader)[COMPANY_SESSION_COOKIE] : undefined;
  const passwordVersion = process.env.COMPANY_PASSWORD_VERSION;
  if (!token || !passwordVersion || !ENV.cookieSecret) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey());
    const session = { passwordVersion: typeof payload.passwordVersion === "string" ? payload.passwordVersion : "" };
    if (payload.kind !== SESSION_KIND || !sessionHasCurrentPasswordVersion(session, passwordVersion)) return null;
    return { passwordVersion: session.passwordVersion };
  } catch {
    return null;
  }
}

export function companySessionMaxAgeMs() {
  return SESSION_TTL_SECONDS * 1000;
}
