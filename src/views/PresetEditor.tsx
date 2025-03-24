import { get_default_parameters, Parameters } from "@wasm/wasm_dynode";
import { JSX, useEffect, useState } from "react";
import { useModelResult, useParams } from "../ModelState";

import "./PresetEditor.css";

export interface Preset {
    label: string;
    getParams(): Parameters;
}

const PRESETS: Record<string, Preset> = {
    default: {
        label: "Default (unmitigated)",
        getParams(): Parameters {
            return get_default_parameters();
        },
    },
    with_vaccines: {
        label: "With vaccines",
        getParams(): Parameters {
            const base = get_default_parameters();
            base.mitigations.vaccine.enabled = true;
            return base;
        },
    },
};
type PresetOption = keyof typeof PRESETS;

export function PresetEditor(): JSX.Element {
    let [selected, setSelected] = useState<PresetOption | null>(null);

    let [, , replaceParams] = useParams();

    const setPreset = (preset: PresetOption): void => {
        replaceParams(() => PRESETS[preset].getParams());
        setSelected(preset);
    };
    return (
        <div>
            <h4 className="preset-header">Presets</h4>
            <ul className="preset-list">
                {Object.entries(PRESETS).map(([key, { label }]) => {
                    let preset = key as PresetOption;
                    return (
                        <li
                            key={preset}
                            className={selected === preset ? "selected" : ""}
                            onClick={() => setPreset(preset)}
                        >
                            {label}
                        </li>
                    );
                })}
                <li
                    onClick={() => setSelected(null)}
                    className={!selected ? "selected" : ""}
                >
                    Custom&hellip;{" "}
                </li>
            </ul>

            <ModelRunStats />
        </div>
    );
}

function ModelRunStats() {
    let [count, setCount] = useState(0);
    let { isRunning, modelResult } = useModelResult();
    useEffect(() => {
        if (modelResult) {
            setCount((c) => c + 1);
        }
    }, [modelResult]);

    return (
        <div className="model-run-stats">
            Model run: {isRunning ? ".." : count}
        </div>
    );
}
