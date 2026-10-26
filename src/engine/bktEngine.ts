export interface BktParameters {
  transit: number;
  slip: number;
  guess: number;
}

export type BktObservation = "correct" | "incorrect";

function assertProbability(value: number, name: string): void {
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new RangeError(`${name} must be a finite number between 0 and 1`);
  }
}

/**
 * Updates P(L_t) from an observed response using the standard BKT model.
 */
export function updateMasteryProbability(
  previousMastery: number,
  observation: BktObservation,
  parameters: BktParameters,
): number {
  assertProbability(previousMastery, "previousMastery");
  assertProbability(parameters.transit, "transit");
  assertProbability(parameters.slip, "slip");
  assertProbability(parameters.guess, "guess");

  const { transit, slip, guess } = parameters;
  const likelihood =
    observation === "correct"
      ? (previousMastery * (1 - slip)) /
        (previousMastery * (1 - slip) + (1 - previousMastery) * guess)
      : (previousMastery * slip) /
        (previousMastery * slip + (1 - previousMastery) * (1 - guess));

  return likelihood + (1 - likelihood) * transit;
}
