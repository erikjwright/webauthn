import type { NextApiRequest, NextApiResponse } from 'next';
import type { Error } from '../../types';
import { PrismaClient } from '@prisma/client';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { origin, rpID } from '../../utils';

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

    if (!user || !user.id || !user.username || !user.currentChallenge) {
      res.status(500).send({});
      return;
    }

    const expectedChallenge: string = user.currentChallenge;

    const authenticator = user.authenticators.find(
      (authenticator) =>
        authenticator.credentialID.toString('base64url') === credential.id
    );

    if (!authenticator) {
      res.status(500).send({ message: 'No authenticator' });
      return;
    }

    try {
      verification = await verifyAuthenticationResponse({
        credential,
        expectedChallenge,
        expectedOrigin: origin,
        expectedRPID: rpID,
        authenticator,
      });
    } catch (error: Error | unknown) {
      console.error(error);
      return res.status(400).send({ error: 'there was an error' });
    }

    const { verified } = verification;

    const { authenticationInfo } = verification;
    const { newCounter: counter } = authenticationInfo;

    await prisma.authenticator.update({
      where: {
        userId: user.id,
      },
      data: {
        credentialBackedUp: authenticationInfo.credentialBackedUp,
        credentialDeviceType: authenticationInfo.credentialDeviceType,
        credentialID: authenticationInfo.credentialID,
        counter,
      },
    });

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
