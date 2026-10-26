import { assign, setup } from "xstate";

export type MacroState =
  | "diagnostic"
  | "activeCognitiveFriction"
  | "calibratedScaffolding"
  | "unrestrictedDelegation";

export interface PolicyContext {
  userId: string;
  layerId: string;
  masteryScore: number;
}

export interface SubmitCheckpointEvent {
  type: "SUBMIT_CHECKPOINT";
  passed: boolean;
  scoreDelta: number;
}

const nextMasteryScore = ({
  context,
  event,
}: {
  context: PolicyContext;
  event: SubmitCheckpointEvent;
}): number => Math.min(1, Math.max(0, context.masteryScore + event.scoreDelta));

export const policyMachine = setup({
  types: {
    context: {} as PolicyContext,
    events: {} as SubmitCheckpointEvent,
  },
  guards: {
    masteryAtLeast80: ({ context, event }) =>
      nextMasteryScore({ context, event }) >= 0.8,
    masteryAtLeast50: ({ context, event }) =>
      nextMasteryScore({ context, event }) >= 0.5,
    masteryBelow50: ({ context, event }) =>
      nextMasteryScore({ context, event }) < 0.5,
    masteryBelow80: ({ context, event }) =>
      nextMasteryScore({ context, event }) < 0.8,
  },
  actions: {
    applyCheckpointScore: assign({
      masteryScore: nextMasteryScore,
    }),
  },
}).createMachine({
  id: "skillLayerPolicy",
  initial: "diagnostic",
  context: {
    userId: "",
    layerId: "",
    masteryScore: 0.2,
  },
  states: {
    diagnostic: {
      on: {
        SUBMIT_CHECKPOINT: [
          {
            guard: "masteryAtLeast80",
            target: "unrestrictedDelegation",
            actions: "applyCheckpointScore",
          },
          {
            guard: "masteryAtLeast50",
            target: "calibratedScaffolding",
            actions: "applyCheckpointScore",
          },
          {
            target: "activeCognitiveFriction",
            actions: "applyCheckpointScore",
          },
        ],
      },
    },
    activeCognitiveFriction: {
      on: {
        SUBMIT_CHECKPOINT: [
          {
            guard: "masteryAtLeast80",
            target: "unrestrictedDelegation",
            actions: "applyCheckpointScore",
          },
          {
            guard: "masteryAtLeast50",
            target: "calibratedScaffolding",
            actions: "applyCheckpointScore",
          },
          { actions: "applyCheckpointScore" },
        ],
      },
    },
    calibratedScaffolding: {
      on: {
        SUBMIT_CHECKPOINT: [
          {
            guard: "masteryAtLeast80",
            target: "unrestrictedDelegation",
            actions: "applyCheckpointScore",
          },
          {
            guard: "masteryBelow50",
            target: "activeCognitiveFriction",
            actions: "applyCheckpointScore",
          },
          { actions: "applyCheckpointScore" },
        ],
      },
    },
    unrestrictedDelegation: {
      on: {
        SUBMIT_CHECKPOINT: [
          {
            guard: "masteryBelow50",
            target: "activeCognitiveFriction",
            actions: "applyCheckpointScore",
          },
          {
            guard: "masteryBelow80",
            target: "calibratedScaffolding",
            actions: "applyCheckpointScore",
          },
          { actions: "applyCheckpointScore" },
        ],
      },
    },
  },
});
