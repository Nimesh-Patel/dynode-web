import { NumberInput } from "../forms/NumberInput";
import { Mitigations } from "../mitigations/Mitigations";
import { FormGroup } from "../forms/FormGroup";
import { useDays, useParams } from "../ModelState";

// let ag = () => [
//     { value: "0-19", label: "0-19" },
//     { value: "20-39", label: "20-39" },
//     { value: "40-59", label: "40-59" },
//     { value: "60-79", label: "60-79" },
//     { value: "80+", label: "80+" },
// ];

export function ParamsEditor() {
    let [days, setDays] = useDays();

    let [params, updateParams] = useParams();
    return (
        <div className="p-1">
            <FormGroup>
                <label>Days</label>
                <NumberInput
                    range
                    min={1}
                    max={400}
                    step={10}
                    value={days}
                    numberType="int"
                    onValue={(d) => setDays(d)}
                />
            </FormGroup>
            <FormGroup>
                <label>Population size</label>
                <NumberInput
                    min={0}
                    value={params.population}
                    step={1_000_000}
                    numberType="int"
                    onValue={(population) => updateParams({ population })}
                />
            </FormGroup>

            <FormGroup>
                <label>Initial infections</label>
                <NumberInput
                    min={0}
                    step={100}
                    value={params.initial_infections}
                    onValue={(initial_infections) =>
                        updateParams({ initial_infections })
                    }
                />
            </FormGroup>
            <FormGroup>
                <label>R0</label>
                <NumberInput
                    range
                    min={0.8}
                    max={2.2}
                    step={0.1}
                    value={params.r0}
                    numberType="float"
                    onValue={(r0) => updateParams({ r0 })}
                />
            </FormGroup>
            <FormGroup>
                <label>Latent period</label>
                <NumberInput
                    range
                    min={0.5}
                    max={2.5}
                    step={0.1}
                    value={params.latent_period}
                    numberType="float"
                    onValue={(latent_period) => updateParams({ latent_period })}
                />
            </FormGroup>
            <FormGroup>
                <label>Infectious period</label>
                <NumberInput
                    range
                    min={1}
                    max={4.5}
                    step={0.1}
                    value={params.infectious_period}
                    numberType="float"
                    onValue={(infectious_period) =>
                        updateParams({ infectious_period })
                    }
                />
            </FormGroup>
            <Mitigations />
        </div>
    );
}
