import { useState } from "react";
import { useParams } from "../ModelState";
import "./GroupEditor.css";
type GroupEditorProps = {
    value: number[];
    onValue: (value: number[]) => void;
    label: string;
    renderInput: (
        value: number,
        onValue: (newValue: number) => void
    ) => React.ReactNode;
};

export function GroupEditor({
    label,
    value,
    onValue,
    renderInput,
}: GroupEditorProps) {
    let allSameValue = value.every((v) => v === value[0]);

    let [params] = useParams();
    let [sync, setSync] = useState(allSameValue);

    return (
        <div>
            <div className="group-editor-label">
                <label>{label}</label>
                <span className="group-editor-label-sync secondary-label">
                    <input
                        type="checkbox"
                        checked={sync}
                        onChange={(e) => {
                            if (e.target.checked) {
                                let newValue = value[0];
                                let updated = value.map(() => newValue);
                                onValue(updated);
                            }
                            setSync(e.target.checked);
                        }}
                    />{" "}
                    All
                </span>
            </div>
            {sync && allSameValue ? (
                renderInput(value[0], (newValue) => {
                    let updated = value.map(() => newValue);
                    onValue(updated);
                })
            ) : (
                <div className="row">
                    {value.map((v, g) => {
                        return (
                            <div key={g}>
                                <label className="secondary-label">
                                    {params.population_fraction_labels[g]}
                                </label>
                                {renderInput(v, (newValue) => {
                                    let updated = [...value];
                                    updated[g] = newValue;
                                    onValue(updated);
                                })}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
