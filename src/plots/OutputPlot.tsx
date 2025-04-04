import { useMemo } from "react";
import { Point, useModelRunData } from "../state/modelRuns";
import { ColumnTable, op } from "arquero";
import { SEIRPlot, SEIRPlotProps } from "./SEIRPlot";
import { useParams } from "../ModelState";

type OutputPlotProps = {
    withDt: (dt: ColumnTable) => ColumnTable;
    facetBy?: keyof Point;
    singleYAxis?: boolean;
};

export function OutputPlot({
    withDt,
    facetBy,
    singleYAxis = false,
    ...restProps
}: OutputPlotProps & Omit<SEIRPlotProps, "data">) {
    let { dt } = useModelRunData();
    let [params] = useParams();

    let [single, faceted] = useMemo(() => {
        if (!dt) return [null, null];
        let modifiedDt = withDt(dt.params({ params }) as ColumnTable);
        if (facetBy) {
            let yMax = singleYAxis
                ? modifiedDt
                      .ungroup()
                      .rollup({ max: op.max("y") })
                      .get("max")
                : null;
            return [
                null,
                [
                    // @ts-expect-error Actually check if the data table is correct
                    modifiedDt
                        .groupby(facetBy)
                        .objects({ grouped: true }) as Map<string, Point[]>,
                    yMax,
                ],
            ];
        }
        return [modifiedDt.objects() as Point[], null];
    }, [dt, params, withDt, facetBy, singleYAxis]);

    if (single) {
        return <SEIRPlot data={single} {...restProps} />;
    } else if (faceted) {
        let [facetedData, maxY] = faceted;
        let plotProps = { ...restProps };
        if (maxY !== null) {
            plotProps.maxY = maxY;
        }
        return (
            <div className="row">
                {[...facetedData.entries()].map(([key, data], i) => (
                    <div key={i}>
                        <h4 className="mb-1">{key}</h4>
                        <SEIRPlot data={data} {...plotProps} />
                    </div>
                ))}
            </div>
        );
    }
    return null;
}
