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
                    value={days}
                    numberType="int"
                    onValue={(d) => setDays(d)}
                />
            </FormGroup>
            <FormGroup>
                <label>Population size</label>
                <NumberInput
                    value={params.population}
                    numberType="float"
                    onValue={(population) => updateParams({ population })}
                />
            </FormGroup>

            <FormGroup>
                <label>Initial infections</label>
                <NumberInput
                    value={params.initial_infections}
                    onValue={(initial_infections) =>
                        updateParams({ initial_infections })
                    }
                />
            </FormGroup>
            <FormGroup>
                <label>R0</label>
                <NumberInput
                    value={params.r0}
                    numberType="float"
                    onValue={(r0) => updateParams({ r0 })}
                />
            </FormGroup>
            <FormGroup>
                <label>Latent period</label>
                <NumberInput
                    value={params.latent_period}
                    numberType="float"
                    onValue={(latent_period) => updateParams({ latent_period })}
                />
            </FormGroup>
            <FormGroup>
                <label>Infectious period</label>
                <NumberInput
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
