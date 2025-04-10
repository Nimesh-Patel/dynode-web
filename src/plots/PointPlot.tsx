import "./PointPlot.css";
import { ColumnTable, escape, op } from "arquero";
import { useEffect, useMemo, useRef, useState } from "react";
import * as Plot from "@observablehq/plot";
import { useResize } from "./useResize";
import {
    BasePoint,
    DataByGroupMap,
    DataByXMap,
    ValidGroupKey,
    computeTickInfo,
    DEFAULT_COLORS,
} from "./plotUtils";
import { PointTooltip } from "./PointTooltip";

type ObservablePlotType = (HTMLElement | SVGElement) & Plot.Plot;

interface ExtraRenderMarksData {
    xScale: Plot.Scale;
    yScale: Plot.Scale;
}

export interface PointPlotProps<
    P extends BasePoint,
    G extends ValidGroupKey<P>,
    F extends ValidGroupKey<P> = never
> {
    // Pass a raw data table with groupBy/ facetBy...
    dataTable: ColumnTable;
    groupBy: G;
    groupLabel?: (groupValue: P[G]) => string;
    facetBy?: F;
    facetLabel?: (facetValue: P[F]) => string;
    filter?: (d: P) => boolean;

    // Or, compute the raw data yourself and pass it in
    dataByGroup?: DataByGroupMap<P, G>;
    dataByX?: DataByXMap<P>;
    maxX?: number;
    maxY?: number;

    aspectRatio?: number;

    ticks?: number;
    colors?:
        | Map<P[G], string>
        | ((
              data: DataByGroupMap<P, G>,
              extra: ExtraRenderMarksData
          ) => Map<P[G], string>);

    singleYAxis?: boolean;
    yLabel: string;
    extraConfig?: Partial<Plot.PlotOptions>;
    renderMarks: (
        data: DataByGroupMap<P, G>,
        colorMap: Map<P[G], string>,
        extra: ExtraRenderMarksData
    ) => Plot.Markish[];
}

export function PointPlot<
    P extends BasePoint,
    G extends ValidGroupKey<P>,
    F extends ValidGroupKey<P> = never
>(props: PointPlotProps<P, G, F>) {
    let {
        dataTable,
        groupBy,
        facetBy,
        filter,
        singleYAxis,
        facetLabel: renderFacet,
    } = props;
    let innerProps = { ...props };

    let facetByResults = useMemo(() => {
        if (!facetBy) return null;
        const filtered = filter ? dataTable.filter(escape(filter)) : dataTable;
        const facetedDt = filtered.groupby(facetBy, groupBy);

        let facetedData = facetedDt.objects({
            grouped: true,
        }) as unknown as Map<P[F], Map<P[G], P[]>>;

        let maxX, maxY;
        if (singleYAxis) {
            let stats = filtered
                .groupby(facetBy, "x")
                .rollup({ y: op.sum("y") })
                .rollup({
                    maxX: op.max("x"),
                    maxY: op.max("y"),
                });
            maxX = stats.get("maxX") as number;
            maxY = stats.get("maxY") as number;
        }

        return {
            facetedDt,
            facetedData,
            maxX,
            maxY,
        };
    }, [dataTable, groupBy, facetBy, singleYAxis, filter]);

    if (facetBy && facetByResults) {
        let { facetedDt, facetedData, maxX, maxY } = facetByResults;

        if (typeof maxX === "number") {
            innerProps.maxX = maxX;
        }
        if (typeof maxY === "number") {
            innerProps.maxY = maxY;
        }

        return (
            <div className="row">
                {[...facetedData.entries()].map(([key], i) => (
                    <div key={i}>
                        <h4 className="mb-1">
                            {renderFacet ? renderFacet(key) : `${key}`}
                        </h4>
                        <PointPlotInner
                            {...innerProps}
                            dataTable={facetedDt.filter(
                                escape((d: P) => d[facetBy] === key)
                            )}
                        />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <PointPlotInner
            {...innerProps}
            dataTable={filter ? dataTable.filter(escape(filter)) : dataTable}
        />
    );
}

export function PointPlotInner<
    P extends BasePoint,
    G extends ValidGroupKey<P>,
    F extends ValidGroupKey<P> = never
>({
    aspectRatio = 0.5,
    extraConfig,
    ticks,
    renderMarks,
    dataTable,
    yLabel,
    colors,
    maxX: userMaxX,
    maxY: userMaxY,
    groupBy,
    groupLabel,
}: PointPlotProps<P, G, F>) {
    const plotRef = useRef<HTMLDivElement>(null);
    const [plot, setPlot] = useState<{
        plot: ObservablePlotType;
        colors: Map<P[G], string>;
    } | null>(null);

    let widthHeight = useResize(plotRef);

    let [dataByGroup, dataByX, maxX, maxY] = useMemo(() => {
        let dt = dataTable.groupby(groupBy, "x").rollup({
            y: op.sum("y"),
        });

        let [maxX, maxY] = calcMaxXY(userMaxX, userMaxY, dt);

        let dataByGroup = dt.groupby(groupBy).objects({
            grouped: true,
        }) as unknown as DataByGroupMap<P, G>;

        let dataByX = dt.groupby("x").objects({
            grouped: true,
        }) as unknown as DataByXMap<P>;

        return [dataByGroup, dataByX, maxX, maxY];
    }, [dataTable, userMaxX, userMaxY, groupBy]);

    // Render plot
    useEffect(() => {
        if (!plotRef.current || !widthHeight) return;

        let marginTop = extraConfig?.marginTop || 20;
        let marginBottom = extraConfig?.marginBottom || 30;
        let marginLeft = extraConfig?.marginLeft || 40;
        let marginRight = extraConfig?.marginRight || 20;

        let width = widthHeight[0];
        let height = Math.max(
            widthHeight[0] * aspectRatio,
            200 + marginBottom - marginTop
        );

        const isSmall = height < 300 || width < 300;

        let [yLabelExtended, tickFormat] = computeTickInfo(yLabel, maxY);

        let xScale = Plot.scale({
            x: {
                domain: [0, maxX],
                range: [marginLeft, width - marginRight],
            },
        });
        let yScale = Plot.scale({
            y: {
                domain: [0, maxY],
                range: [height - marginBottom, marginTop],
            },
        });

        let extra: ExtraRenderMarksData = {
            xScale,
            yScale,
        };

        let colorMap: Map<P[G], string>;
        if (typeof colors === "function") {
            colorMap = colors(dataByGroup, extra);
        } else if (colors) {
            colorMap = colors;
        } else {
            colorMap = new Map<P[G], string>(
                [...dataByGroup.keys()].map((key, i) => [
                    key,
                    DEFAULT_COLORS[i % DEFAULT_COLORS.length],
                ])
            );
        }

        const plot = Plot.plot({
            width,
            height,
            figure: true,
            color: {
                domain: [...colorMap.keys()],
                range: [...colorMap.values()],
            },
            x: {
                domain: [0, maxX],
            },
            y: {
                domain: [0, maxY],
            },
            marks: [
                Plot.axisX({
                    fontSize: 10,
                    label: null,
                    color: "#777",
                }),
                Plot.axisY({
                    fontSize: isSmall ? 10 : 12,
                    label: yLabelExtended,
                    tickFormat,
                    ticks: isSmall ? 5 : ticks,
                    color: "#333",
                }),
                Plot.gridY({
                    stroke: "#ddd",
                    opacity: 1,
                    ticks,
                    strokeDasharray: "2,2",
                }),
                ...renderMarks(dataByGroup, colorMap, extra),
            ],
            ...(extraConfig || {}),
            marginTop,
            marginBottom,
            marginLeft,
            marginRight,
        });

        plotRef.current.replaceChildren(plot);
        setPlot({ plot, colors: colorMap });
        return () => {
            plot.remove();
            setPlot(null);
        };
    }, [
        maxX,
        maxY,
        dataByGroup,
        dataByX,
        widthHeight,
        extraConfig,
        ticks,
        renderMarks,
        yLabel,
        aspectRatio,
        colors,
    ]);

    return (
        <>
            <div ref={plotRef} />
            {plot && (
                <PointTooltip
                    dataByX={dataByX}
                    plotRef={plotRef}
                    plot={plot.plot}
                    groupBy={groupBy}
                    groupLabel={groupLabel}
                    colors={plot.colors}
                />
            )}
        </>
    );
}

function calcMaxXY(
    maxX: number | undefined,
    maxY: number | undefined,
    dataTable: ColumnTable
): [number, number] {
    if (typeof maxX === "number" && typeof maxY === "number") {
        return [maxX, maxY];
    }
    const max = dataTable.rollup({
        maxX: op.max("x"),
        maxY: op.max("y"),
    });

    return [maxX ?? max.get("maxX") ?? 0, maxY ?? max.get("maxY") ?? 0];
}
