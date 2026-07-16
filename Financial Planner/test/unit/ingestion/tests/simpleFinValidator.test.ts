import { SimpleFINValidator } from "../../../../srv/modules/ingestion/simpleFinValidator.js";

import {
  VALID_CLAIM,
  CLAIM_MISSING_TOKEN,
  CLAIM_MISSING_NAME,
  CONNECTION_ID,
} from "../../../shared/data/ingestion/simplefin.js";

describe("SimpleFINValidator", () => {
  describe("validateClaimRequest", () => {
    /** A complete claim must pass so onboarding can proceed to the token-claim round-trip — over-strict validation would block connecting an account. */
    it("accepts a complete claim request", () => {
      expect(SimpleFINValidator.validateClaimRequest(VALID_CLAIM)).toEqual([]);
    });

    /** The setup token is the credential exchanged with SimpleFIN — catching a blank one early avoids a doomed network round-trip. */
    it("flags a missing setup token", () => {
      expect(
        SimpleFINValidator.validateClaimRequest(CLAIM_MISSING_TOKEN),
      ).toContainEqual({
        field: "setupToken",
        messageKey: "simplefin.setupTokenRequired",
      });
    });

    /** The display name is how the user identifies this connection later — requiring it prevents saving an unlabelled account. */
    it("flags a blank display name", () => {
      expect(
        SimpleFINValidator.validateClaimRequest(CLAIM_MISSING_NAME),
      ).toContainEqual({
        field: "displayName",
        messageKey: "simplefin.displayNameRequired",
      });
    });

    /** Errors must accumulate rather than fail-fast, so the user sees every missing field in one pass instead of fixing them one at a time. */
    it("flags both fields when entirely empty", () => {
      const errors = SimpleFINValidator.validateClaimRequest({
        setupToken: null,
        displayName: null,
      });
      expect(errors).toHaveLength(2);
    });
  });

  describe("validateConnectionId", () => {
    /** A present connection id must validate so refresh and sync operations can target an existing connection. */
    it("accepts a present id", () => {
      expect(SimpleFINValidator.validateConnectionId(CONNECTION_ID)).toEqual([]);
    });

    /** Without a connection id there is nothing to look up — rejecting null guards the sync path before a null-keyed query. */
    it("flags a missing id", () => {
      expect(SimpleFINValidator.validateConnectionId(null)).toContainEqual({
        field: "connectionId",
        messageKey: "simplefin.connectionIdRequired",
      });
    });
  });
});
