/*
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH under
 * one or more contributor license agreements. See the NOTICE file distributed
 * with this work for additional information regarding copyright ownership.
 * Licensed under the Camunda License 1.0. You may not use this file
 * except in compliance with the Camunda License 1.0.
 */

import {isMoveModificationTarget} from 'modules/bpmn-js/utils/isMoveModificationTarget';
import {hasMultiInstanceParent} from 'modules/bpmn-js/utils/isWithinMultiInstance';
import {IS_ADD_TOKEN_WITH_ANCESTOR_KEY_SUPPORTED} from 'modules/feature-flags';
import {useFlownodeInstancesStatistics} from 'modules/queries/flownodeInstancesStatistics/useFlownodeInstancesStatistics';
import {useTotalRunningInstancesByFlowNode} from 'modules/queries/flownodeInstancesStatistics/useTotalRunningInstancesForFlowNode';
import {useBusinessObjects} from 'modules/queries/processDefinitions/useBusinessObjects';
import {modificationsStore} from 'modules/stores/modifications';
import {hasMultipleScopes} from 'modules/utils/processInstanceDetailsDiagram';

const useFlowNodes = () => {
  const {data: statistics} = useFlownodeInstancesStatistics();
  const {data: totalRunningInstancesByFlowNode} =
    useTotalRunningInstancesByFlowNode();
  const {data: businessObjects} = useBusinessObjects();

  return Object.values(businessObjects ?? {}).map((flowNode) => {
    const flowNodeState = statistics?.items.find(
      ({elementId}) => elementId === flowNode.id,
    );

    return {
      id: flowNode.id,
      isCancellable:
        flowNodeState !== undefined &&
        (flowNodeState.active > 0 || flowNodeState.incidents > 0),
      isMoveModificationTarget: isMoveModificationTarget(flowNode),
      hasMultiInstanceParent: hasMultiInstanceParent(flowNode),
      hasMultipleScopes: hasMultipleScopes(
        flowNode.$parent,
        totalRunningInstancesByFlowNode,
      ),
    };
  });
};

const useAppendableFlowNodes = () => {
  const flowNodes = useFlowNodes();
  const {
    state: {status, sourceFlowNodeIdForMoveOperation},
    isMoveAllOperation,
  } = modificationsStore;

  const isSourceWithinMultiInstance = flowNodes.find(
    ({id}) => id === sourceFlowNodeIdForMoveOperation,
  )?.hasMultiInstanceParent;

  return flowNodes
    .filter((flowNode) => {
      if (!flowNode.isMoveModificationTarget) {
        return false;
      }

      if (!flowNode.hasMultipleScopes) {
        return !flowNode.hasMultiInstanceParent;
      }

      if (status !== 'moving-token') {
        return IS_ADD_TOKEN_WITH_ANCESTOR_KEY_SUPPORTED;
      }

      // Moving all tokens inside a multi-instance is not allowed
      if (isMoveAllOperation) {
        return false;
      }

      // Moving from a single-instance into a multi-instance is not allowed
      if (!isSourceWithinMultiInstance) {
        return false;
      }

      return true;
    })
    .map(({id}) => id);
};

const useCancellableFlowNodes = () => {
  return useFlowNodes()
    .filter((flowNode) => flowNode.isCancellable)
    .map(({id}) => id);
};

const useModifiableFlowNodes = () => {
  const appendableFlowNodes = useAppendableFlowNodes();
  const cancellableFlowNodes = useCancellableFlowNodes();

  // disable all flownodes while ancestor selection is required
  if (modificationsStore.state.status === 'requires-ancestor-selection') {
    return [];
  }

  if (modificationsStore.state.status === 'moving-token') {
    return appendableFlowNodes.filter(
      (flowNodeId) =>
        flowNodeId !==
        modificationsStore.state.sourceFlowNodeIdForMoveOperation,
    );
  } else {
    return Array.from(
      new Set([...appendableFlowNodes, ...cancellableFlowNodes]),
    );
  }
};

const useNonModifiableFlowNodes = () => {
  const flowNodes = useFlowNodes();
  const modifiableFlowNodes = useModifiableFlowNodes();

  return flowNodes
    .filter((flowNode) => !modifiableFlowNodes.includes(flowNode.id))
    .map(({id}) => id);
};

export {
  useAppendableFlowNodes,
  useCancellableFlowNodes,
  useModifiableFlowNodes,
  useNonModifiableFlowNodes,
};
