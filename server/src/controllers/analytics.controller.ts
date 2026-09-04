import type { NextFunction, Request, Response } from 'express';
import { Batch } from '../models/Batch';
import { Resume } from '../models/Resume';
import { AppError } from '../utils/AppError';
import { assertObjectId } from '../utils/validation';

interface DistributionAgg {
  _id: number | string;
  count: number;
}

interface TopSkillAgg {
  _id: string;
  count: number;
}

interface AverageAgg {
  _id: null;
  averageScore: number;
}

interface PassAgg {
  _id: null;
  total: number;
  passed: number;
}

const bucketLabels = new Map<number, string>([
  [0, '0-20'],
  [21, '21-40'],
  [41, '41-60'],
  [61, '61-80'],
  [81, '81-100'],
]);

export async function getBatchAnalytics(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const batchId = assertObjectId(req.params.batchId);
    const batch = await Batch.findOne({ _id: batchId, createdBy: req.user._id });
    if (!batch) {
      throw new AppError(404, 'BATCH_NOT_FOUND', 'Batch not found');
    }

    const match = { batchId: batch._id, createdBy: req.user._id, status: 'completed' };
    const [distribution, topSkills, average, pass, processedTotal] = await Promise.all([
      Resume.aggregate<DistributionAgg>([
        { $match: match },
        {
          $bucket: {
            groupBy: '$scoreBreakdown.totalScore',
            boundaries: [0, 21, 41, 61, 81, 101],
            default: 'unknown',
            output: { count: { $sum: 1 } },
          },
        },
      ]),
      Resume.aggregate<TopSkillAgg>([
        { $match: match },
        { $unwind: '$extractedData.skills' },
        { $group: { _id: '$extractedData.skills', count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
        { $limit: 10 },
      ]),
      Resume.aggregate<AverageAgg>([
        { $match: match },
        { $group: { _id: null, averageScore: { $avg: '$scoreBreakdown.totalScore' } } },
      ]),
      Resume.aggregate<PassAgg>([
        { $match: match },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            passed: { $sum: { $cond: [{ $gte: ['$scoreBreakdown.totalScore', 80] }, 1, 0] } },
          },
        },
      ]),
      Resume.countDocuments(match),
    ]);

    const distributionMap = new Map(distribution.map((item) => [item._id, item.count]));
    const scoreDistribution = [0, 21, 41, 61, 81].map((start) => ({
      range: bucketLabels.get(start) ?? String(start),
      count: distributionMap.get(start) ?? 0,
    }));

    const averageScore = Math.round(average[0]?.averageScore ?? 0);
    const passRate = pass[0]?.total ? Math.round((pass[0].passed / pass[0].total) * 100) : 0;
    const processingTimeMs =
      batch.startedAt && batch.completedAt ? batch.completedAt.getTime() - batch.startedAt.getTime() : 0;

    res.status(200).json({
      success: true,
      data: {
        scoreDistribution,
        topSkills: topSkills.map((skill) => ({ skill: skill._id, count: skill.count })),
        averageScore,
        passRate,
        processingTimeMs,
        totalProcessed: processedTotal,
      },
    });
  } catch (error) {
    next(error);
  }
}
