import type { Model, PipelineStage } from 'mongoose';
import mongoose from 'mongoose';
import { ITEM_LIST_LIMITATION } from '../common/constants/limitations.constant';
import { parseFiltersFromRequest } from './filter/filter.server';

export type FetchItemResponse = null | {
  [key: string]: any;
};

export type FetchListResponse = FetchItemResponse & {
  page: number;
  total: number;
  items: null | any[];
};

/**
 * Fetch list of items that match filters in search params from the specified collection.
 *
 * @param {LoaderFunctionArgs['request']} request
 * @param {Model<any>}                    model
 * @param {PipelineStage[]}               initialPipeline
 * @param {PipelineStage[]}               finalPipeline
 *
 * @returns {Promise<FetchListResponse>}
 */
export async function fetchList(
  request: any,
  model: Model<any>,
  initialPipeline?: PipelineStage[],
  finalPipeline?: PipelineStage[],
): Promise<FetchListResponse> {
  // Get query params
  const searchParams = request?.query || {};
  const isExportingData = searchParams['export'];
  const countResultOnly = searchParams['countResultOnly'];

  // Prepare pagination
  const limit = Math.min(
    Number(searchParams.limit || ITEM_LIST_LIMITATION),
    ITEM_LIST_LIMITATION,
  );
  const page = Math.max(Number(searchParams.page || 1), 1);
  const skip = (page - 1) * limit;

  // Prepare sort options
  const sort = searchParams.sort;
  const [sortBy, sortDir] = sort?.split('|') || [];

  // Prepare filters
  const pipeline = [
    ...(initialPipeline || []),
    ...(await parseFiltersFromRequest(request, model)),
  ];

  // Fetch item list
  let items: any[] = [];
  const total = (
    await model.aggregate([...pipeline, { $count: 'total' }]).exec()
  )?.[0]?.total;

  if (!countResultOnly) {
    if (sortBy) {
      pipeline.push({
        $sort: {
          [sortBy as string]: sortDir?.toLowerCase() === 'desc' ? -1 : 1,
        },
      });
    } else if (
      !pipeline.find((stage: PipelineStage) =>
        Object.prototype.hasOwnProperty.call(stage, '$sort'),
      )
    ) {
      pipeline.push({ $sort: { updatedAt: -1 } });
    }

    if (finalPipeline?.length) {
      finalPipeline.forEach((stage) => pipeline.push(stage));
    }

    if (!isExportingData && limit > 0) {
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: limit });
      items = await (pipeline?.length
        ? model.aggregate(pipeline).exec()
        : model.find());
    }
  }

  return { page, total, items, limit };
}

/**
 * Fetch an item that match filters in search params from the specified collection.
 *
 * @param {LoaderFunctionArgs['request']} request
 * @param {Model<any>}                    model
 * @param {PipelineStage[]}               initialPipeline
 *
 * @returns {Promise<FetchItemResponse>}
 */
export async function fetchItem(
  request: any,
  model: Model<any>,
  initialPipeline?: PipelineStage[],
  finalPipeline?: PipelineStage[],
  id?: number | string,
): Promise<FetchItemResponse> {
  // Get query params
  if (!id) {
    const searchParams = request?.query || {};
    id = searchParams.id as string;
  }

  // Generate pipeline
  const {
    Types: { ObjectId },
  } = mongoose;

  const pipeline = [
    ...(initialPipeline || []),
    ...(id
      ? [
          {
            $match: {
              $or: [
                { id },
                {
                  _id: ObjectId.isValid(id as string)
                    ? new ObjectId(id as string)
                    : id,
                },
              ],
            },
          },
        ]
      : []),
    ...(finalPipeline || []),
  ];

  // Fetch item
  return pipeline?.length
    ? (await model.aggregate([...pipeline, { $limit: 1 }]).exec())?.[0]
    : null;
}
