import * as Plot from "@observablehq/plot";
import { MitigationType } from "@wasm/wasm_dynode";
import { useRef, useState, useEffect, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
import { Point } from "../state/modelRuns";
import "./SEIRPlot.css";
import { Tooltip } from "./Tooltip";

enum PlotColor {
    Default = "var(--default-plot-line-color)",
    Purple = "var(--purple)",
}

export type Annotation = {
    label: string;
    color: string;
    x: number;
};

function getColors(groupBy: keyof Point): {
    domain: string[];
    range: string[];
} | null {
    switch (groupBy) {
        case "mitigation_type":
            return {
                domain: ["Unmitigated", "Mitigated"] as MitigationType[],
                range: [PlotColor.Default, PlotColor.Purple],
            };
        default:
            return null;
    }
}

function computeTickInfo(
    yLabel: string,
    maxY: number
): [string, (d: number) => string] {
    let tickFormat = (d: number) => d.toLocaleString();
    if (maxY >= 1_000_000) {
        yLabel += " (millions)";
        tickFormat = (d) => (d / 1_000_000).toLocaleString("en-US");
    } else if (maxY >= 100_00) {
        yLabel += " (thousands)";
        tickFormat = (d) => (d / 1000).toLocaleString("en-US");
    }
    return [yLabel, tickFormat];
}

export interface SEIRPlotProps {
    data: Point[];
    groupBy: keyof Point;
    yDomain?: [number, number];
    showLegend?: boolean;
    yTicks?: number;
    yLabel: string;
    maxY?: number;
    annotations?: Annotation[];
}

export function SEIRPlot({
    yTicks = 10,
    yDomain,
    showLegend = true,
    data,
    groupBy,
    yLabel: yLabelBase,
    maxY: userMaxY,
    annotations = [],
}: SEIRPlotProps) {
    const plotRef = useRef<HTMLDivElement>(null);
    const [containerSize, setContainerSize] = useState<[number, number]>([
        800, 500,
    ]);
    const [tooltip, setTooltip] = useState<Tooltip<Point> | null>(null);
    const [tooltipData, setTooltipData] = useState<Point[] | null>(null);

    // TODO<ryl8@cdc.gov> clean this up and make it more generic
    if (annotations.length) {
        let mitigations = data.filter((d) => d.mitigation_type === "Mitigated");
        annotations = annotations.map((a) => ({
            ...a,
            y: mitigations.find((d) => d.x === a.x)?.y || 0,
        }));
    }

    useEffect(() => {
        if (!data.length || !plotRef.current) return;

        let colors = getColors(groupBy);

        let maxY = userMaxY || yDomain?.[1];
        if (!maxY) {
            maxY = Math.max(...data.map((d) => d.y));
        }

        const [yLabel, tickFormat] = computeTickInfo(yLabelBase, maxY);
        const plot = Plot.plot({
            figure: true,
            x: { label: "Days" },
            y: {
                label: yLabel,
                domain: yDomain || [0, maxY],
                grid: true,
                ticks: yTicks,
                tickFormat,
            },
            color: colors
                ? {
                      legend: showLegend,
                      ...colors,
                  }
                : undefined,
            width: containerSize[0],
            // TODO allow for aspect ratio to be set
            height: Math.max(containerSize[0] * 0.5, 200),
            marks: [
                Plot.line(data, {
                    x: "x",
                    y: "y",
                    stroke: groupBy,
                }),
                Plot.ruleX(annotations, {
                    x: "x",
                    y1: "y",
                    y2: maxY,
                    stroke: "color",
                    strokeDasharray: "2,2",
                }),
                Plot.text(
                    annotations,
                    Plot.dodgeY(
                        { anchor: "top", padding: 10 },
                        {
                            text: "label",
                            x: "x",
                            dy: -10,
                            dx: 3,
                            fill: "color",
                            stroke: "white",
                            textAnchor: "start",
                        }
                    )
                ),
            ],
        });

        // Append plot to the div
        plotRef.current.innerHTML = "";
        plotRef.current.appendChild(plot);

        let tooltip: Tooltip<Point> | null = null;

        if (plotRef.current) {
            let figure = plotRef.current.querySelector("figure");
            if (!figure) {
                console.warn("No figure element found in plot");
            } else {
                tooltip = new Tooltip({
                    containerEl: figure,
                    plot,
                    points: data,
                    xProperty: "x",
                    renderContent: (_, points) => {
                        setTooltipData(points || null);
                    },
                });
                setTooltip(tooltip);
            }
        }

        return () => {
            plot.remove();
            tooltip?.cleanup();
        };
    }, [data, containerSize, yLabelBase, yDomain, showLegend, yTicks]);

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
                    }, 100);
                }
            }
        });

        observer.observe(plotRef.current);

        return () => {
            observer.disconnect();
            if (timeoutId) clearTimeout(timeoutId);
        };
    }, []);

    return (
        <>
            <div ref={plotRef} />
            {tooltip?.tooltipEl
                ? createPortal(
                      <TooltipContent data={tooltipData} groupBy={groupBy} />,
                      tooltip.tooltipEl
                  )
                : null}
        </>
    );
}

function TooltipContent({
    data,
    groupBy,
}: {
    data: Point[] | null;
    groupBy: keyof Point;
}) {
    if (!data) return null;
    let day = data[0].x;
    return (
        <div className="plot-tooltip-content">
            <table>
                <thead>
                    <tr>
                        <th colSpan={2}>Day {day}</th>
                    </tr>
                </thead>
                <tbody>
                    {data.map((d, i) => (
                        <tr key={i}>
                            <td>{d[groupBy]}</td>
                            <td style={{ textAlign: "right" }}>
                                <strong>{formatTooltipNumber(d.y)}</strong>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function formatTooltipNumber(num: number): string {
    return (Math.round(num / 1000) * 1000).toLocaleString("en-US");
}
