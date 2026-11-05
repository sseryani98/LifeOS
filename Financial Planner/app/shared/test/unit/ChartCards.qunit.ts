/// <reference types="qunit" />
import ApexChartCard from "com/financialplanner/shared/controls/ApexChartCard";
import VizFrameCard from "com/financialplanner/shared/controls/VizFrameCard";
import nextUIUpdate from "sap/ui/test/utils/nextUIUpdate";

import { CHART_CARD } from "../data/constants";

QUnit.module("ApexChartCard", () => {
  /** The card's container takes the bound size and the fpApexChartCard class the theme overrides style. */
  QUnit.test(
    "renders a sized container carrying its style class",
    async assert => {
      const card = new ApexChartCard({
        width: CHART_CARD.WIDTH,
        height: CHART_CARD.HEIGHT,
      });
      card.placeAt(CHART_CARD.FIXTURE_ID);
      await nextUIUpdate();

      const element = card.getDomRef() as HTMLElement;

      assert.ok(element.classList.contains(CHART_CARD.APEX_CLASS));
      assert.deepEqual(
        [element.style.width, element.style.height],
        [CHART_CARD.WIDTH, CHART_CARD.HEIGHT],
      );
      card.destroy();
    },
  );

  /** An unsized card fills its cell at 300px and draws a bar chart, the declared fallback. */
  QUnit.test(
    "declares full width, 300px height and a bar chart by default",
    assert => {
      const card = new ApexChartCard();

      assert.deepEqual(
        [card.getWidth(), card.getHeight(), card.getChartType()],
        [
          CHART_CARD.DEFAULT_WIDTH,
          CHART_CARD.DEFAULT_HEIGHT,
          CHART_CARD.APEX_DEFAULT_TYPE,
        ],
      );
      card.destroy();
    },
  );
});

QUnit.module("VizFrameCard", () => {
  /** The card's container takes the bound size and the fpVizFrameCard class the theme overrides style. */
  QUnit.test(
    "renders a sized container carrying its style class",
    async assert => {
      const card = new VizFrameCard({
        width: CHART_CARD.WIDTH,
        height: CHART_CARD.HEIGHT,
      });
      card.placeAt(CHART_CARD.FIXTURE_ID);
      await nextUIUpdate();

      const element = card.getDomRef() as HTMLElement;

      assert.ok(element.classList.contains(CHART_CARD.VIZ_CLASS));
      assert.deepEqual(
        [element.style.width, element.style.height],
        [CHART_CARD.WIDTH, CHART_CARD.HEIGHT],
      );
      card.destroy();
    },
  );

  /** An unsized card fills its cell at 300px and draws a column chart, the declared default. */
  QUnit.test(
    "declares full width, 300px height and a column chart by default",
    assert => {
      const card = new VizFrameCard();

      assert.deepEqual(
        [card.getWidth(), card.getHeight(), card.getChartType()],
        [
          CHART_CARD.DEFAULT_WIDTH,
          CHART_CARD.DEFAULT_HEIGHT,
          CHART_CARD.VIZ_DEFAULT_TYPE,
        ],
      );
      card.destroy();
    },
  );
});
