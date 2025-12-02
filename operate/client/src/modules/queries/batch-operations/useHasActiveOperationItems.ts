/*
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH under
 * one or more contributor license agreements. See the NOTICE file distributed
 * with this work for additional information regarding copyright ownership.
 * Licensed under the Camunda License 1.0. You may not use this file
 * except in compliance with the Camunda License 1.0.
 */

import {useQuery} from '@tanstack/react-query';
import {useProcessInstancePageParams} from 'App/ProcessInstance/useProcessInstancePageParams';
import {queryBatchOperationItems} from 'modules/api/v2/batchOperations/queryBatchOperationItems';

const BATCH_OPERATION_ITEMS_ACTIVE_QUERY_KEY = 'batchOperationItemsActive';

const useHasActiveOperationItems = () => {
  const {processInstanceId} = useProcessInstancePageParams();

  return useQuery({
    queryKey: [BATCH_OPERATION_ITEMS_ACTIVE_QUERY_KEY, processInstanceId],
    queryFn: async () => {
      if (!processInstanceId) {
        return false;
      }

      const {response, error} = await queryBatchOperationItems({
        filter: {
          processInstanceKey: processInstanceId,
          state: 'ACTIVE',
        },
        page: {
          limit: 1,
        },
      });

      if (response !== null) {
        return response.items.length > 0;
      }

      throw error;
    },
    refetchInterval: 5000,
    enabled: processInstanceId !== undefined,
  });
};

export {useHasActiveOperationItems, BATCH_OPERATION_ITEMS_ACTIVE_QUERY_KEY};
