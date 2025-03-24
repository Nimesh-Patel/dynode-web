import * as Plot from "@observablehq/plot";
import { OutputItem } from "@wasm/wasm_dynode";

import { useRef, useState, useEffect, useLayoutEffect } from "react";

enum PlotColor {
    Default = "var(--default-plot-line-color)",
    Purple = "var(--purple)",
}

export interface CategorizedResult {
    label: string;
    output_type: string;
    values: OutputItem[];
}

export interface SEIRPlotProps {
    results: CategorizedResult[];
    yDomain?: [number, number];
    showLegend?: boolean;
    yTicks?: number;
}

export function SEIRPlot({
    yTicks = 10,
    results,
    yDomain,
    showLegend = true,
}: SEIRPlotProps) {
    const plotRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState<[number, number]>([
        800, 500,
    ]);

    useEffect(() => {
        if (!results.length || !plotRef.current) return;
        const [, maxY] = results.reduce(
            ([maxX, maxY], { values }) => [
                Math.max(maxX, values[values.length - 1].time),
                Math.max(maxY, ...values.map((d) => d.value)),
            ],
            [0, 0]
        );
        let yLabel = results[0].output_type;
        let tickFormat = (d: number) => d.toLocaleString();
        if (maxY >= 1_000_000) {
            yLabel += " (millions)";
            tickFormat = (d) => (d / 1_000_000).toLocaleString("en-US");
        } else if (maxY >= 100_00) {
            yLabel += " (thousands)";
            tickFormat = (d) => (d / 1000).toLocaleString("en-US");
        }
        let { marks, color } = getTypedPlotData(
            results,
            ["unmitigated", PlotColor.Default],
            ["mitigated", PlotColor.Purple]
        );
        const plot = Plot.plot({
            x: { label: "Days" },
            y: {
                label: yLabel,
                domain: yDomain || [0, maxY],
                grid: true,
                ticks: yTicks,
                tickFormat,
            },
            color: showLegend ? color : undefined,
            width: containerSize[0],
            // TODO allow for aspect ratio to be set
            height: Math.max(containerSize[0] * 0.5, 200),
            marks,
        });

        // Append plot to the div
        plotRef.current.innerHTML = "";
        plotRef.current.appendChild(plot);

        return () => plot.remove();
    }, [results, containerSize, yDomain, showLegend, yTicks]);

    useLayoutEffect(() => {
        if (!plotRef.current) return;

        let timeoutId: ReturnType<typeof setTimeout> | null = null;

        const observer = new ResizeObserver((entries) => {
            for (let entry of entries) {
                if (entry.contentRect.width) {
                    // Debounce resize
                    if (timeoutId) clearTimeout(timeoutId);
                    timeoutId = setTimeout(() => {
                        setContainerSize([
                            entry.contentRect.width,
                            entry.contentRect.height,
                        ]);
                    }, 100); // adjust delay if needed
                }
            }
        });

        observer.observe(plotRef.current);

        return () => {
            observer.disconnect();
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, []);

    return <div ref={plotRef} />;
}

type LineConfig = {
    x: keyof OutputItem;
    y: keyof OutputItem;
    stroke: PlotColor;
};

type TypedPlotData = {
    marks: Plot.Line[];
    color: ColorConfig;
};
type ColorConfig = {
    legend: boolean;
    domain: string[];
    range: string[];
};
function getTypedPlotData(
    outputs: CategorizedResult[],
    ...types: [string, PlotColor][]
): TypedPlotData {
    let marks: Plot.Line[] = [];
    let color: ColorConfig = {
        legend: true,
        domain: [],
        range: [],
    };
    for (let [type, plotColor] of types) {
        let mark = maybeRenderLine(outputs, type, plotColor);
        if (mark) {
            marks.push(mark);
            color.domain.push(type);
            color.range.push(plotColor);
        }
    }
    return { marks, color };
}

function maybeRenderLine(
    outputs: CategorizedResult[],
    label: string,
    color: PlotColor
) {
    let output = outputs.find((o) => o.label === label);
    if (!output) {
        return;
    }
    let config: LineConfig = {
        x: "time",
        y: "value",
        stroke: color,
    };
    return Plot.line(output.values, config);
}
