import type { AuthenticatorDevice } from '@simplewebauthn/typescript-types';

export interface Authenticator {
  credentialBackedUp: boolean;
  credentialDeviceType: string;
  credentialID: Buffer;
  credentialPublicKey: Buffer;
  counter: number;
  transports?: AuthenticatorTransport[];
  userId: string;
}

export interface Error {
  error: string;
}

export interface User {
  id?: string;
  authenticators?: Authenticator[];
  currentChallenge?: string;
  devices: AuthenticatorDevice[];
  email?: string;
  username: string;
}
