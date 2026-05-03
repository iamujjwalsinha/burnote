import Database from "@replit/database";

const db = new Database();

export interface SecretPayload {
  ciphertext: string;
  iv: string;
  burnOnRead: boolean;
  createdAt: number;
  expiresAt: number;
}

export async function storeSecret(
  id: string,
  payload: Omit<SecretPayload, "expiresAt">,
  ttlSeconds: number
): Promise<void> {
  const data: SecretPayload = {
    ...payload,
    expiresAt: Date.now() + ttlSeconds * 1000,
  };
  await db.set(id, JSON.stringify(data));
}

export async function getSecret(id: string): Promise<SecretPayload | null> {
  const raw = await db.get(id);
  if (!raw) return null;

  let data: SecretPayload;
  try {
    data = JSON.parse(raw as string) as SecretPayload;
  } catch {
    await db.delete(id);
    return null;
  }

  if (Date.now() > data.expiresAt) {
    await db.delete(id);
    return null;
  }

  return data;
}

export async function deleteSecret(id: string): Promise<void> {
  await db.delete(id);
}
