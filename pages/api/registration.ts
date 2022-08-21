import type { NextApiRequest, NextApiResponse } from 'next';
import type { Authenticator, Error } from '../../types';
import { PrismaClient } from '@prisma/client';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { rpID, rpName } from '../../utils';

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

    const options = generateRegistrationOptions({
      rpName,
      rpID,
      userID: user.id,
      userName: user.username,
      // Don't prompt users for additional information about the authenticator
      // (Recommended for smoother UX)
      attestationType: 'indirect',
      // Prevent users from re-registering existing authenticators
      excludeCredentials: userAuthenticators.map((authenticator) => ({
        id: authenticator.credentialID,
        type: 'public-key',
        // Optional
        transports: authenticator.transports,
      })),
    });

    await prisma.user.update({
      where: { username: user?.username },
      data: { currentChallenge: options.challenge },
    });

    res.status(200).send({ username, ...options });
  }
}
