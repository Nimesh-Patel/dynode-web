import { FormGroup } from "../forms/FormGroup";
import { NumberInput } from "../forms/NumberInput";
import { useMitigation } from "../ModelState";
import { AntiviralsParams } from "@wasm/wasm_dynode";

export function AntiviralsEditor() {
    let [params, updateParams] = useMitigation<AntiviralsParams>("antivirals");
    return (
        <div>
            <FormGroup>
                <label>Antiviral Efficacy: AVEi</label>
                <div className="input-details">
                    Prevention of transmission from treated infected
                </div>
                <NumberInput
                    value={params.ave_i}
                    onValue={(ave_i) => updateParams({ ave_i })}
                />
            </FormGroup>
            <FormGroup>
                <label>Antiviral Efficacy: AVEp</label>
                <div className="input-details">
                    Prevention of hospitalization/death
                </div>
                <NumberInput
                    value={params.ave_p}
                    onValue={(ave_p) => updateParams({ ave_p })}
                />
            </FormGroup>
        </div>
    );
}
