import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import ReportPreview from "./ReportPreview";
import { createInitialReport, PRE_OPERATION_INSPECTION_LABEL } from "@shared/report";

describe("ReportPreview print labels", () => {
  it("shows only the suffixed vehicle number and the requested inspection label", () => {
    const data = createInitialReport();
    data.vehicleNumber = "12";

    const html = renderToStaticMarkup(<ReportPreview data={data} />);

    expect(html).toContain("12号車");
    expect(html.match(/号車/g)).toHaveLength(1);
    expect(html).not.toContain(">号車</span>");
    expect(html).toContain(PRE_OPERATION_INSPECTION_LABEL);
  });
});
