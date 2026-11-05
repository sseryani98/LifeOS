/// <reference types="qunit" />
import ClearPropagation from "com/financialplanner/csvimportwizard/model/ClearPropagation";

import { DESCRIPTION, TAXONOMY_ID } from "../data/constants";
import { buildAmazonRow, buildNewRow } from "../data/rows";

QUnit.module("ClearPropagation — Clear", () => {
  /** Clear copies vendor, PT and EC to every uncleared row sharing the description. */
  QUnit.test("fills uncategorized siblings with the source's categorization", assert => {
    const clearing = new ClearPropagation();
    const source = buildAmazonRow();
    const sibling = buildNewRow();
    clearing.clearRow(source, [source, sibling]);
    assert.strictEqual(source.cleared, true);
    assert.strictEqual(sibling.cleared, false);
    assert.strictEqual(sibling.vendor_ID, TAXONOMY_ID.VENDOR_AMAZON);
    assert.strictEqual(sibling.purchaseType_ID, TAXONOMY_ID.PURCHASE_TYPE_SHOPPING);
    assert.strictEqual(sibling.earningCategory_ID, TAXONOMY_ID.EARNING_CATEGORY_ONLINE);
  });

  /** Propagation is keyed on raw_description — a different description is a different merchant. */
  QUnit.test("leaves rows with a different description untouched", assert => {
    const clearing = new ClearPropagation();
    const source = buildAmazonRow();
    const other = buildNewRow({ rawDescription: DESCRIPTION.COFFEE });
    clearing.clearRow(source, [source, other]);
    assert.strictEqual(other.vendor_ID, null);
  });

  /** Only uncleared rows receive values — a confirmed row is read-only. */
  QUnit.test("does not overwrite a row the user already cleared", assert => {
    const clearing = new ClearPropagation();
    const source = buildAmazonRow();
    const cleared = buildNewRow({ cleared: true });
    clearing.clearRow(source, [source, cleared]);
    assert.strictEqual(cleared.vendor_ID, null);
  });

  /** A row already carrying a suggestion or the user's pick keeps it, not the source's. */
  QUnit.test("does not overwrite a sibling that is already categorized", assert => {
    const clearing = new ClearPropagation();
    const source = buildAmazonRow();
    const categorized = buildNewRow({ vendor_ID: TAXONOMY_ID.VENDOR_COFFEE_SHOP });
    clearing.clearRow(source, [source, categorized]);
    assert.strictEqual(categorized.vendor_ID, TAXONOMY_ID.VENDOR_COFFEE_SHOP);
    assert.strictEqual(categorized.purchaseType_ID, null);
  });

  /** Import Uncategorized: clearing a bare row confirms it and spreads nothing. */
  QUnit.test("clears an uncategorized row without propagating to its siblings", assert => {
    const clearing = new ClearPropagation();
    const source = buildNewRow();
    const sibling = buildNewRow({ vendor_ID: null });
    clearing.clearRow(source, [source, sibling]);
    assert.strictEqual(source.cleared, true);
    assert.deepEqual(
      [sibling.vendor_ID, sibling.purchaseType_ID, sibling.earningCategory_ID],
      [null, null, null],
    );
  });
});

QUnit.module("ClearPropagation — isCategorized", () => {
  /** Any one of vendor, PT or EC makes a row categorized — each is checked alone. */
  QUnit.test("treats any single categorization field as categorized", assert => {
    const clearing = new ClearPropagation();
    assert.strictEqual(clearing.isCategorized(buildNewRow({ vendor_ID: TAXONOMY_ID.VENDOR_AMAZON })), true);
    assert.strictEqual(
      clearing.isCategorized(buildNewRow({ purchaseType_ID: TAXONOMY_ID.PURCHASE_TYPE_DINING })),
      true,
    );
    assert.strictEqual(
      clearing.isCategorized(buildNewRow({ earningCategory_ID: TAXONOMY_ID.EARNING_CATEGORY_DINING })),
      true,
    );
  });

  /** Clear All Matching only confirms pre-filled rows, so a bare row must read uncategorized. */
  QUnit.test("treats a row with no categorization as uncategorized", assert => {
    assert.strictEqual(new ClearPropagation().isCategorized(buildNewRow()), false);
  });
});

QUnit.module("ClearPropagation — Undo", () => {
  /** Undo reverts the row and every value its Clear propagated. */
  QUnit.test("reverts the source and restores every row its Clear filled", assert => {
    const clearing = new ClearPropagation();
    const source = buildAmazonRow();
    const first = buildNewRow();
    const second = buildNewRow();
    clearing.clearRow(source, [source, first, second]);
    clearing.restoreRow(source);
    assert.strictEqual(source.cleared, false);
    assert.deepEqual(
      [first.vendor_ID, first.purchaseType_ID, first.earningCategory_ID, second.vendor_ID],
      [null, null, null, null],
    );
  });

  /** Guard: a filled row the user then cleared is their confirmation — Undo must not strip it. */
  QUnit.test("leaves a filled row the user has since cleared", assert => {
    const clearing = new ClearPropagation();
    const source = buildAmazonRow();
    const sibling = buildNewRow();
    clearing.clearRow(source, [source, sibling]);
    sibling.cleared = true;
    clearing.restoreRow(source);
    assert.strictEqual(sibling.vendor_ID, TAXONOMY_ID.VENDOR_AMAZON);
  });

  /** Guard: a filled row the user re-categorized (any one field) is theirs — Undo leaves it. */
  QUnit.test("leaves a filled row whose vendor, PT or EC the user changed", assert => {
    const clearing = new ClearPropagation();
    const source = buildAmazonRow();
    const vendorEdited = buildNewRow();
    const typeEdited = buildNewRow();
    const categoryEdited = buildNewRow();
    clearing.clearRow(source, [source, vendorEdited, typeEdited, categoryEdited]);
    vendorEdited.vendor_ID = TAXONOMY_ID.VENDOR_COFFEE_SHOP;
    typeEdited.purchaseType_ID = TAXONOMY_ID.PURCHASE_TYPE_DINING;
    categoryEdited.earningCategory_ID = TAXONOMY_ID.EARNING_CATEGORY_DINING;
    clearing.restoreRow(source);
    assert.strictEqual(vendorEdited.vendor_ID, TAXONOMY_ID.VENDOR_COFFEE_SHOP);
    assert.strictEqual(typeEdited.vendor_ID, TAXONOMY_ID.VENDOR_AMAZON);
    assert.strictEqual(categoryEdited.vendor_ID, TAXONOMY_ID.VENDOR_AMAZON);
  });

  /** One Clear, one Undo — a second Undo must not re-revert rows the user has since re-filled. */
  QUnit.test("forgets the fills once they have been undone", assert => {
    const clearing = new ClearPropagation();
    const source = buildAmazonRow();
    const sibling = buildNewRow();
    clearing.clearRow(source, [source, sibling]);
    clearing.restoreRow(source);
    Object.assign(sibling, buildAmazonRow());
    clearing.restoreRow(source);
    assert.strictEqual(sibling.vendor_ID, TAXONOMY_ID.VENDOR_AMAZON);
  });

  /** A row confirmed by Clear All Matching has no fills, so Undo only reopens it. */
  QUnit.test("reopens a row that was never cleared through Clear", assert => {
    const clearing = new ClearPropagation();
    const row = buildAmazonRow({ cleared: true });
    clearing.restoreRow(row);
    assert.strictEqual(row.cleared, false);
    assert.strictEqual(row.vendor_ID, TAXONOMY_ID.VENDOR_AMAZON);
  });

  /** A re-parse replaces every row; fills recorded against the old rows must not survive into the new review. */
  QUnit.test("reset drops every recorded fill", assert => {
    const clearing = new ClearPropagation();
    const source = buildAmazonRow();
    const sibling = buildNewRow();
    clearing.clearRow(source, [source, sibling]);
    clearing.reset();
    clearing.restoreRow(source);
    assert.strictEqual(sibling.vendor_ID, TAXONOMY_ID.VENDOR_AMAZON);
  });
});
