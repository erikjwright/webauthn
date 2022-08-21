import type { NextApiRequest, NextApiResponse } from 'next';
import type { Authenticator, Error } from '../../types';
import { PrismaClient } from '@prisma/client';
import { generateAuthenticationOptions } from '@simplewebauthn/server';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const prisma = new PrismaClient();

  if (req.method === 'POST') {
    const {
      body: { username },
    }: { body: { username: string } } = req;

    // const creds = body.username ?? body.email

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        authenticators: true,
      },
    });

    if (!user || !user.id || !user.username || !user.authenticators)
      return null;

    const userAuthenticators: Authenticator[] = user.authenticators;

    const options = generateAuthenticationOptions({
      // Require users to use a previously-registered authenticator
      allowCredentials: userAuthenticators.map((authenticator) => ({
        id: authenticator.credentialID,
        type: 'public-key',
        // Optional
        transports: authenticator.transports,
      })),
      userVerification: 'preferred',
    });

    await prisma.user.update({
      where: { username },
      data: { currentChallenge: options.challenge },
    });

    res.status(200).send({ username, ...options });
  }
}
