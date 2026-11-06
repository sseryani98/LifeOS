// Builds OPA5 waitFor selectors with their success callback attached afterwards:
// a `success` key in the literal reads as a method not named for a verb.

import type UI5Element from "sap/ui/core/Element";
import type {
  MultiControlSelector,
  SingleControlSelector,
} from "sap/ui/test/Opa5";

/**
 * Builds a waitFor selector over many controls that hands the matches to confirm.
 * @param selector which controls to wait for
 * @param confirm the assertion run on the matched controls
 * @returns the selector with its success callback
 */
export const buildControlsWait = (
  selector: MultiControlSelector,
  confirm: (controls: UI5Element[]) => void,
): MultiControlSelector => {
  const wait = { ...selector };
  wait.success = confirm;
  return wait;
};

/**
 * Builds a waitFor selector over one control by id that hands it to confirm.
 * @param selector which control to wait for
 * @param confirm the assertion run on the matched control
 * @returns the selector with its success callback
 */
export const buildControlWait = (
  selector: SingleControlSelector,
  confirm: (control: UI5Element) => void,
): SingleControlSelector => {
  const wait = { ...selector };
  wait.success = confirm;
  return wait;
};
