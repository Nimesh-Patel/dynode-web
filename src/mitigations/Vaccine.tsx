import { FormGroup } from "../forms/FormGroup";
import { SelectInput } from "../forms/SelectInput";
import { NumberInput } from "../forms/NumberInput";
import { useMitigation } from "../ModelState";
import { VaccineParams } from "@wasm/wasm_dynode";

export function VaccineEditor() {
    let [params, updateParams] = useMitigation<VaccineParams>("vaccine");
    let dosesOptions = [
        { value: 1, label: "One dose" },
        { value: 2, label: "Two doses" },
    ];
    return (
        <div>
            <FormGroup>
                <label>Vaccine type</label>
                <SelectInput
                    value={dosesOptions.find((o) => o.value === params.doses)}
                    options={dosesOptions}
                    onChange={(option: unknown) => {
                        let doses = (
                            option as { value: number; label: string } | null
                        )?.value;
                        if (doses) {
                            updateParams({ doses });
                        }
                    }}
                />
            </FormGroup>
            <FormGroup>
                <label>Vaccination start</label>
                <NumberInput
                    value={params.start}
                    onValue={(start) => updateParams({ start })}
                />
            </FormGroup>
            <FormGroup>
                <label>Vaccine doses available</label>
                <NumberInput
                    value={params.doses_available}
                    onValue={(doses_available) =>
                        updateParams({ doses_available })
                    }
                />
            </FormGroup>
            <FormGroup>
                <label>Vaccine administration rate</label>
                <NumberInput
                    value={params.administration_rate}
                    onValue={(administration_rate) =>
                        updateParams({ administration_rate })
                    }
                />
            </FormGroup>
            <FormGroup>
                <label>Vaccine effectiveness against infection</label>
                <NumberInput
                    value={params.ve_s}
                    onValue={(ve_s) => updateParams({ ve_s })}
                />
            </FormGroup>
            <FormGroup>
                <label>Vaccine effectiveness against onward transmission</label>
                <NumberInput
                    value={params.ve_i}
                    onValue={(ve_i) => updateParams({ ve_i })}
                />
            </FormGroup>
        </div>
    );
}
