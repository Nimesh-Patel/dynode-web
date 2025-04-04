import { Annotation } from "../plots/SEIRPlot";
// import { SelectInput } from "../forms/SelectInput";

import "./EpiCurve.css";
import { useModelRunData } from "../state/modelRuns";
import { ColumnTable, op } from "arquero";
import { useMemo } from "react";
import { SummaryTable } from "./SummaryTable";
import { useParams } from "../ModelState";
import { entries } from "../utils";
import {
    CommunityMitigationParamsExport,
    VaccineParams,
} from "@wasm/wasm_dynode";
import { OutputPlot } from "../plots/OutputPlot";

function getInfectionData(dt: ColumnTable): ColumnTable {
    return dt
        .filter((d) => d.output_type === "InfectionIncidence")
        .groupby("day", "mitigation_type")
        .rollup({ sum: op.sum("value") })
        .select({
            day: "x",
            sum: "y",
            mitigation_type: "mitigation_type",
        });
}

function getAgeGroupInfectionData(dt: ColumnTable): ColumnTable {
    return dt
        .filter((d) => d.output_type === "InfectionIncidence")
        .derive({
            group: (d, $) => $.params.population_fraction_labels[d.group],
        })
        .select({
            day: "x",
            value: "y",
            mitigation_type: "mitigation_type",
            group: "group",
        });
}

function getOutputs(dt: ColumnTable): ColumnTable {
    return dt
        .filter(
            (d) =>
                d.output_type === "HospitalIncidence" ||
                d.output_type === "DeathIncidence"
        )
        .groupby("day", "mitigation_type", "output_type")
        .rollup({ sum: op.sum("value") })
        .select({
            day: "x",
            sum: "y",
            mitigation_type: "mitigation_type",
            output_type: "output_type",
        })
        .derive({
            output_type: (d) => {
                if (d.output_type === "HospitalIncidence") {
                    return "Hospitalizations";
                } else if (d.output_type === "DeathIncidence") {
                    return "Deaths";
                }
            },
        });
}

export function EpiCurve() {
    let [params] = useParams();
    let { mitigation_types } = useModelRunData();
    mitigation_types = mitigation_types || [];
    let annotations = useMemo(() => {
        let annotations: Array<Annotation> = entries(params.mitigations)
            .map(([label, value]) => {
                if (!value.enabled) return;
                if (label == "vaccine") {
                    let { start } = value as VaccineParams;
                    return {
                        label: "Vaccination",
                        color: "var(--purple)",
                        x: start,
                    };
                } else if (label == "community") {
                    let { start, duration } =
                        value as CommunityMitigationParamsExport;
                    return [
                        {
                            label: "Community",
                            color: "var(--dark-purple)",
                            x: start,
                        },
                        {
                            label: "Community ends",
                            color: "var(--dark-purple)",
                            x: start + duration,
                        },
                    ];
                }
            })
            .filter((x) => x !== undefined)
            .flat();
        return annotations;
    }, [params]);

    return (
        <>
            <h3 className="mb-1">All Groups</h3>
            <h4 className="mb-1">Infection Incidence</h4>
            <div className="mb-2">
                <OutputPlot
                    withDt={getInfectionData}
                    groupBy="mitigation_type"
                    yLabel="Infection Incidence"
                    annotations={annotations}
                    showLegend={mitigation_types.length > 1}
                />
            </div>

            <div className="mb-4">
                <OutputPlot
                    withDt={getOutputs}
                    facetBy="output_type"
                    groupBy="mitigation_type"
                    yLabel="Incidence"
                    yTicks={5}
                    showLegend={false}
                />
            </div>

            <h3 className="mb-1">Infection Incidence by Age Group</h3>
            <div className="mb-4">
                <OutputPlot
                    withDt={getAgeGroupInfectionData}
                    facetBy="group"
                    groupBy="mitigation_type"
                    singleYAxis={true}
                    yTicks={5}
                    yLabel="Infection Incidence"
                    showLegend={false}
                />
            </div>

            <SummaryTable />
        </>
    );
}
