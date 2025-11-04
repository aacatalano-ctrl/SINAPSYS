import { Request, Response } from 'express';
import { jobCategories, jobTypeCosts, jobTypePrefixMap } from '../database/constants.js';

export const getJobCategories = (req: Request, res: Response) => {
  res.json({ jobCategories, jobTypeCosts, jobTypePrefixMap });
};
