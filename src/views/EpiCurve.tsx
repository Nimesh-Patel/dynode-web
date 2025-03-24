import { useMemo } from "react";
import { useModelResult } from "../ModelState";
import { CategorizedResult, SEIRPlot } from "../plots/SEIRPlot";
// import { SelectInput } from "../forms/SelectInput";

import "./EpiCurve.css";
import { SEIRModelOutput } from "@wasm/wasm_dynode";
import { PlotGroup } from "../plots/PlotGroup";

type GroupedResults = Array<Array<CategorizedResult>>;

// Split a single SEIRModelOutput into multiple CategorizedResults by group
function splitValuesVecByGroup(modelResult: SEIRModelOutput[]): GroupedResults {
    let outputs: GroupedResults = [];
    modelResult.forEach((r, categoryIndex) => {
        r.values_vec.forEach((v) => {
            v.value.forEach((value, groupIndex) => {
                if (!outputs[groupIndex]) {
                    outputs[groupIndex] = [];
                }
                if (!outputs[groupIndex][categoryIndex]) {
                    outputs[groupIndex][categoryIndex] = {
                        label: r.label,
                        output_type: r.output_type,
                        values: [],
                    };
                }
                outputs[groupIndex][categoryIndex].values.push({
                    time: v.time,
                    value: value,
                });
            });
        });
    });
    return outputs;
}

// Age group options
// const ageGroupOptions = [
//     { value: "0", label: "All" },
//     // { value: "1", label: "0–4" },
//     // { value: "2", label: "5–19" },
//     // { value: "3", label: "20–64" },
//     // { value: "4", label: "65+" },
// ];

export function EpiCurve() {
    const { isRunning, modelResult } = useModelResult();
    // const [ageGroups, setAgeGroups] = useState([{ value: "0", label: "All" }]);

    const grouped: GroupedResults | null = useMemo(() => {
        if (!modelResult) return null;

        return splitValuesVecByGroup(modelResult);
    }, [modelResult]);

    return (
        <>
            <h3>Infection Incidence</h3>
            <div className="mb-4" style={{ opacity: isRunning ? "0.5" : "" }}>
                {modelResult && <SEIRPlot results={modelResult} />}
            </div>

            <h3 className="mb-1">By Age Group</h3>
            {/* <div className="mb-1">
                <SelectInput
                    value={ageGroups}
                    options={ageGroupOptions}
                    isMulti={true}
                    onChange={(selected) => {
                        setAgeGroups(selected ?? []);
                    }}
                />
            </div> */}

            <div className="mb-2" style={{ opacity: isRunning ? "0.5" : "" }}>
                <div className="row-2">
                    {grouped && (
                        <PlotGroup
                            groups={grouped}
                            yTicks={5}
                            showLegend={false}
                        />
                    )}
                </div>
            </div>
        </>
    );
}
