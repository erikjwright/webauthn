import type { NextApiRequest, NextApiResponse } from 'next';
import type { Authenticator, Error } from '../../types';
import { PrismaClient } from '@prisma/client';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { rpID, origin } from '../../utils';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const prisma = new PrismaClient();

  let verification;
  if (req.method === 'POST') {
    // const created = await prisma.user.create({ data: body });

    const {
      body: { credential, username },
    }: { body: { credential: any; username: string } } = req;

    // const creds = body.username ?? body.email

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        authenticators: true,
      },
    });

    if (!user || !user.id || !user.username || !user.currentChallenge)
      return null;

    const expectedChallenge: string = user.currentChallenge;

    try {
      verification = await verifyRegistrationResponse({
        credential,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
      });
    } catch (error: Error | unknown) {
      console.error(error);
      return res.status(400).send({ error: 'there was an error' });
    }

    const { verified } = verification;

    const { registrationInfo } = verification;

    if (!registrationInfo) return null;

    const {
      credentialBackedUp,
      credentialDeviceType,
      credentialPublicKey,
      credentialID,
      counter,
    } = registrationInfo;

    const newAuthenticator: Authenticator = {
      credentialBackedUp,
      credentialDeviceType,
      credentialID,
      credentialPublicKey,
      counter,
      userId: user?.id,
    };

    await prisma.authenticator.create({ data: newAuthenticator });

    res
      .setHeader('Set-Cookie', [
        `authenticated=true; Expires=${new Date(
          Date.now() + 6.048e8
        )}; HttpOnly`,
      ])
      .status(200)
      .send({ verified });
  }
}
