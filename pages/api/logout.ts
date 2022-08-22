import type { NextApiRequest, NextApiResponse } from 'next';
import type { Error } from '../../types';
// import { PrismaClient } from '@prisma/client';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res
    .setHeader('Set-Cookie', [`authenticated=false`])
    .status(200)
    .send({ loggedOut: true });
}
