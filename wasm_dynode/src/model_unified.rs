use std::any::Any;

use crate::{Parameters, ParametersExport, SEIRModel};
use serde::{Deserialize, Serialize};
use serde_wasm_bindgen::from_value;
use tsify::Tsify;
use wasm_bindgen::prelude::*;

#[derive(Tsify, Debug, Clone, Serialize, Deserialize)]
pub enum OutputType {
    Incidence,
}

#[derive(Tsify, Debug, Clone, Serialize, Deserialize)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct OutputItem {
    pub(crate) time: f64,
    pub(crate) value: f64,
}

#[derive(Tsify, Debug, Clone, Serialize, Deserialize)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct OutputItemVec {
    pub(crate) time: f64,
    pub(crate) value: Vec<f64>,
}

#[derive(Tsify, Debug, Clone, Serialize, Deserialize)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct SEIRModelOutput {
    pub(crate) label: String,
    pub(crate) output_type: OutputType,
    pub(crate) values: Vec<OutputItem>,
    pub(crate) values_vec: Vec<OutputItemVec>,
}

#[derive(Tsify, Debug, Clone, Serialize, Deserialize)]
#[tsify(into_wasm_abi, from_wasm_abi)]
pub struct SEIRModelOutputResult {
    output: Vec<SEIRModelOutput>,
}

impl SEIRModelOutputResult {
    pub fn new(output: Vec<SEIRModelOutput>) -> Self {
        SEIRModelOutputResult { output }
    }
}

pub trait DynodeModel: Any {
    fn integrate(&self, days: usize) -> Vec<(OutputType, Vec<OutputItem>, Vec<OutputItemVec>)>;
}

fn select_model(parameters: Parameters<2>) -> Box<dyn DynodeModel> {
    // TODO maybe we'll have other models to choose from
    Box::new(SEIRModel::new(parameters))
}

#[wasm_bindgen]
pub struct SEIRModelUnified {
    parameters: Parameters<2>,
}

#[wasm_bindgen]
impl SEIRModelUnified {
    #[wasm_bindgen(constructor)]
    pub fn new(js_params: JsValue) -> Self {
        let parameters: ParametersExport =
            from_value(js_params).expect("Failed to parse parameters");
        SEIRModelUnified {
            parameters: parameters.try_into().unwrap(),
        }
    }

    fn run_internal(&self, days: usize) -> Vec<SEIRModelOutput> {
        let base_label: String;
        let mut result: Vec<SEIRModelOutput> = Vec::new();

        // Run an unmitigated version if necessary
        if self.parameters.has_mitigations() {
            for (output_type, values, values_vec) in
                select_model(self.parameters.without_mitigations()).integrate(days)
            {
                result.push(SEIRModelOutput {
                    label: "unmitigated".to_string(),
                    output_type,
                    values,
                    values_vec,
                });
            }
            base_label = "mitigated".to_string();
        } else {
            base_label = "unmitigated".to_string();
        }

        // Run the base version
        for (output_type, values, values_vec) in
            select_model(self.parameters.clone()).integrate(days)
        {
            result.push(SEIRModelOutput {
                label: base_label.clone(),
                output_type,
                values,
                values_vec,
            });
        }

        result
    }

    #[wasm_bindgen]
    pub fn run(&self, days: usize) -> SEIRModelOutputResult {
        SEIRModelOutputResult::new(self.run_internal(days))
    }
}

#[cfg(test)]
mod tests {
    use std::any::TypeId;

    use super::*;

    #[test]
    fn test_select_model() {
        let mut parameters = Parameters::default();
        parameters.mitigations.vaccine.enabled = true;
        let model = select_model(parameters.clone());
        assert_eq!(model.as_ref().type_id(), TypeId::of::<SEIRModel<2>>());
    }

    #[test]
    fn test_with_mitigations() {
        let mut parameters = Parameters::default();
        parameters.mitigations.vaccine.enabled = true;
        let model = SEIRModelUnified { parameters };
        let output = model.run_internal(200);

        assert_eq!(output.len(), 2);
        assert_eq!(output[0].label, "unmitigated");
        assert_eq!(output[1].label, "mitigated");
    }
}
