use crate::{DynodeModel, OutputItem, OutputItemVec, OutputType, Parameters};
use nalgebra::{Const, Matrix, MatrixView, SVector, Storage, StorageMut};
use ode_solvers::{Dopri5, System};
type State<const N: usize> = SVector<f64, { 8 * N }>;

pub struct SEIRModel<const N: usize> {
    pub(crate) parameters: Parameters<N>,
    contact_matrix_normalization: f64,
}

trait StateWrapper<const N: usize, S: Storage<f64, Const<{ 8 * N }>> + 'static>
where
    Self: 'static,
{
    fn get_s(&self) -> MatrixView<'_, f64, Const<N>, Const<1>, S::RStride, S::CStride>;
    fn get_e(&self) -> MatrixView<'_, f64, Const<N>, Const<1>, S::RStride, S::CStride>;
    fn get_i(&self) -> MatrixView<'_, f64, Const<N>, Const<1>, S::RStride, S::CStride>;
    fn get_r(&self) -> MatrixView<'_, f64, Const<N>, Const<1>, S::RStride, S::CStride>;
    fn get_sv(&self) -> MatrixView<'_, f64, Const<N>, Const<1>, S::RStride, S::CStride>;
    fn get_ev(&self) -> MatrixView<'_, f64, Const<N>, Const<1>, S::RStride, S::CStride>;
    fn get_iv(&self) -> MatrixView<'_, f64, Const<N>, Const<1>, S::RStride, S::CStride>;
    fn get_rv(&self) -> MatrixView<'_, f64, Const<N>, Const<1>, S::RStride, S::CStride>;
}

impl<const N: usize, S: Storage<f64, Const<{ 8 * N }>> + 'static> StateWrapper<N, S>
    for Matrix<f64, Const<{ 8 * N }>, Const<1>, S>
{
    fn get_s(&self) -> MatrixView<'_, f64, Const<N>, Const<1>, S::RStride, S::CStride> {
        self.fixed_view::<N, 1>(0, 0)
    }

    fn get_e(&self) -> MatrixView<'_, f64, Const<N>, Const<1>, <S>::RStride, <S>::CStride> {
        self.fixed_view::<N, 1>(N, 0)
    }

    fn get_i(&self) -> MatrixView<'_, f64, Const<N>, Const<1>, <S>::RStride, <S>::CStride> {
        self.fixed_view::<N, 1>(2 * N, 0)
    }

    fn get_r(&self) -> MatrixView<'_, f64, Const<N>, Const<1>, <S>::RStride, <S>::CStride> {
        self.fixed_view::<N, 1>(3 * N, 0)
    }

    fn get_sv(&self) -> MatrixView<'_, f64, Const<N>, Const<1>, <S>::RStride, <S>::CStride> {
        self.fixed_view::<N, 1>(4 * N, 0)
    }

    fn get_ev(&self) -> MatrixView<'_, f64, Const<N>, Const<1>, <S>::RStride, <S>::CStride> {
        self.fixed_view::<N, 1>(5 * N, 0)
    }

    fn get_iv(&self) -> MatrixView<'_, f64, Const<N>, Const<1>, <S>::RStride, <S>::CStride> {
        self.fixed_view::<N, 1>(6 * N, 0)
    }

    fn get_rv(&self) -> MatrixView<'_, f64, Const<N>, Const<1>, <S>::RStride, <S>::CStride> {
        self.fixed_view::<N, 1>(7 * N, 0)
    }
}

trait StateWrapperMut<const N: usize>
where
    Self: 'static,
{
    fn set_s<S2: Storage<f64, Const<N>> + 'static>(
        &mut self,
        value: &Matrix<f64, Const<N>, Const<1>, S2>,
    );

    fn set_e<S2: Storage<f64, Const<N>> + 'static>(
        &mut self,
        value: &Matrix<f64, Const<N>, Const<1>, S2>,
    );

    fn set_i<S2: Storage<f64, Const<N>> + 'static>(
        &mut self,
        value: &Matrix<f64, Const<N>, Const<1>, S2>,
    );

    fn set_r<S2: Storage<f64, Const<N>> + 'static>(
        &mut self,
        value: &Matrix<f64, Const<N>, Const<1>, S2>,
    );

    fn set_sv<S2: Storage<f64, Const<N>> + 'static>(
        &mut self,
        value: &Matrix<f64, Const<N>, Const<1>, S2>,
    );

    fn set_ev<S2: Storage<f64, Const<N>> + 'static>(
        &mut self,
        value: &Matrix<f64, Const<N>, Const<1>, S2>,
    );

    fn set_iv<S2: Storage<f64, Const<N>> + 'static>(
        &mut self,
        value: &Matrix<f64, Const<N>, Const<1>, S2>,
    );

    fn set_rv<S2: Storage<f64, Const<N>> + 'static>(
        &mut self,
        value: &Matrix<f64, Const<N>, Const<1>, S2>,
    );
}

impl<const N: usize, S: StorageMut<f64, Const<{ 8 * N }>> + 'static> StateWrapperMut<N>
    for Matrix<f64, Const<{ 8 * N }>, Const<1>, S>
{
    fn set_s<S2: Storage<f64, Const<N>> + 'static>(
        &mut self,
        value: &Matrix<f64, Const<N>, Const<1>, S2>,
    ) {
        self.fixed_view_mut::<N, 1>(0, 0).set_column(0, value);
    }

    fn set_e<S2: Storage<f64, Const<N>> + 'static>(
        &mut self,
        value: &Matrix<f64, Const<N>, Const<1>, S2>,
    ) {
        self.fixed_view_mut::<N, 1>(N, 0).set_column(0, value);
    }

    fn set_i<S2: Storage<f64, Const<N>> + 'static>(
        &mut self,
        value: &Matrix<f64, Const<N>, Const<1>, S2>,
    ) {
        self.fixed_view_mut::<N, 1>(2 * N, 0).set_column(0, value);
    }

    fn set_r<S2: Storage<f64, Const<N>> + 'static>(
        &mut self,
        value: &Matrix<f64, Const<N>, Const<1>, S2>,
    ) {
        self.fixed_view_mut::<N, 1>(3 * N, 0).set_column(0, value);
    }

    fn set_sv<S2: Storage<f64, Const<N>> + 'static>(
        &mut self,
        value: &Matrix<f64, Const<N>, Const<1>, S2>,
    ) {
        self.fixed_view_mut::<N, 1>(4 * N, 0).set_column(0, value);
    }

    fn set_ev<S2: Storage<f64, Const<N>> + 'static>(
        &mut self,
        value: &Matrix<f64, Const<N>, Const<1>, S2>,
    ) {
        self.fixed_view_mut::<N, 1>(5 * N, 0).set_column(0, value);
    }

    fn set_iv<S2: Storage<f64, Const<N>> + 'static>(
        &mut self,
        value: &Matrix<f64, Const<N>, Const<1>, S2>,
    ) {
        self.fixed_view_mut::<N, 1>(6 * N, 0).set_column(0, value);
    }

    fn set_rv<S2: Storage<f64, Const<N>> + 'static>(
        &mut self,
        value: &Matrix<f64, Const<N>, Const<1>, S2>,
    ) {
        self.fixed_view_mut::<N, 1>(7 * N, 0).set_column(0, value);
    }
}

impl<const N: usize> SEIRModel<N> {
    pub fn new(parameters: Parameters<N>) -> Self {
        let contact_matrix = parameters.contact_matrix;
        let (eigenvalue, _) = get_dominant_eigendata(&contact_matrix);
        SEIRModel {
            parameters,
            contact_matrix_normalization: eigenvalue,
        }
    }
}

impl<const N: usize> DynodeModel for SEIRModel<N>
where
    [(); 8 * N]: Sized,
{
    fn integrate(&self, days: usize) -> Vec<(OutputType, Vec<OutputItem>, Vec<OutputItemVec>)> {
        let population_fractions = self.parameters.population_fractions;
        let mut initial_state: State<N> = SVector::zeros();
        initial_state.set_s(
            &(population_fractions
                * (self.parameters.population - self.parameters.initial_infections)),
        );
        // Above replaces
        // initial_state.fixed_view_mut::<N, 1>(0, 0).set_column(
        //     0,
        //     &(population_fractions
        //         * (self.parameters.population - self.parameters.initial_infections)),
        // );
        initial_state.set_i(&(population_fractions * self.parameters.initial_infections));

        let mut stepper = Dopri5::new(self, 0.0, days as f64, 1.0, initial_state, 1e-6, 1e-6);
        let _res = stepper.integrate();

        let mut incidence = Vec::new();
        let mut incidence_vec = Vec::new();

        let mut first_loop = true;
        let mut prev_s_plus_e = SVector::zeros();
        for (time, state) in stepper.x_out().iter().zip(stepper.y_out().iter()) {
            let s_plus_e = state.get_s() + state.get_e() + state.get_sv() + state.get_ev();
            if first_loop {
                prev_s_plus_e = s_plus_e;
                first_loop = false;
            } else {
                let new_infections = prev_s_plus_e - s_plus_e;
                incidence.push(OutputItem {
                    time: *time,
                    value: new_infections.sum(),
                });
                incidence_vec.push(OutputItemVec {
                    time: *time,
                    value: new_infections.data.as_slice().into(),
                });
                prev_s_plus_e = s_plus_e;
            }
        }

        vec![(OutputType::Incidence, incidence, incidence_vec)]
    }
}

impl<const N: usize> System<f64, State<N>> for &SEIRModel<N> {
    fn system(&self, x: f64, y: &State<N>, dy: &mut State<N>) {
        let s = y.get_s();
        // Above replaces
        // let s = y.fixed_view::<N, 1>(0, 0);
        let e = y.get_e();
        let i = y.get_i();
        let r = y.get_r();

        let sv = y.get_sv();
        let ev = y.get_ev();
        let iv = y.get_iv();

        let beta = self.parameters.r0 / self.parameters.infectious_period;
        let i_effective = i + (1.0 - self.parameters.mitigations.vaccine.ve_i) * iv;
        let infection_rate =
            (beta / self.contact_matrix_normalization / self.parameters.population)
                * (self.parameters.contact_matrix * i_effective)
                    .component_div(&self.parameters.population_fractions);

        let ds_to_e = s.component_mul(&infection_rate);
        let de_to_i = e / self.parameters.latent_period;
        let di_to_r = i / self.parameters.infectious_period;

        let dsv_to_ev =
            sv.component_mul(&((1.0 - self.parameters.mitigations.vaccine.ve_s) * infection_rate));
        let dev_to_iv = ev / self.parameters.latent_period;
        let div_to_rv = iv / self.parameters.infectious_period;

        let administration_rate = if self.parameters.mitigations.vaccine.enabled {
            if x < self.parameters.mitigations.vaccine.start {
                0.0
            } else if (x - self.parameters.mitigations.vaccine.start)
                * self.parameters.mitigations.vaccine.administration_rate
                < self.parameters.mitigations.vaccine.doses_available
            {
                self.parameters.mitigations.vaccine.administration_rate
            } else {
                0.0
            }
        } else {
            0.0
        };
        let ds_to_sv = s
            .component_div(&(s + e + i + r))
            .component_mul(&self.parameters.population_fractions)
            * administration_rate;

        dy.set_s(&-(ds_to_e + ds_to_sv));
        // Above replaces
        // dy.fixed_view_mut::<N, 1>(0, 0)
        //     .set_column(0, &-(ds_to_e + ds_to_sv));
        dy.set_e(&(ds_to_e - de_to_i));
        dy.set_i(&(de_to_i - di_to_r));
        dy.set_r(&di_to_r);
        dy.set_sv(&(-dsv_to_ev + ds_to_sv));
        dy.set_ev(&(dsv_to_ev - dev_to_iv));
        dy.set_iv(&(dev_to_iv - div_to_rv));
        dy.set_rv(&div_to_rv);
    }
}

// Compute dominant eigenvalue and eigenvector using power algorithm
fn get_dominant_eigendata<const N: usize, S: Storage<f64, Const<N>, Const<N>>>(
    matrix: &Matrix<f64, Const<N>, Const<N>, S>,
) -> (f64, SVector<f64, N>) {
    let mut x = SVector::<f64, N>::from_element(1.0 / N as f64);
    let mut norm = 1.0 as f64;
    loop {
        x = matrix * x;
        let new_norm = x.lp_norm(1);
        x = x / new_norm;
        if (new_norm - norm).abs() < f64::EPSILON {
            return (norm, x);
        } else {
            norm = new_norm;
        }
    }
}

#[cfg(test)]
mod test {
    use nalgebra::{DVector, Matrix1, Vector1, matrix};

    use super::SEIRModel;
    use crate::{DynodeModel, MitigationParams, Parameters, model::get_dominant_eigendata};

    #[test]
    fn final_size_relation() {
        let model = SEIRModel::new(Parameters {
            population: 1.0,
            population_fractions: Vector1::new(1.0),
            population_fraction_labels: Vector1::new("All".to_string()),
            contact_matrix: Matrix1::new(1.0),
            initial_infections: 1e-8,
            r0: 2.0,
            latent_period: 1.0,
            infectious_period: 3.0,
            mitigations: MitigationParams::default(),
        });
        let (_, values, _) = &model.integrate(300)[0];

        let total_incidence: f64 = values.iter().map(|x| x.value).sum();
        let attack_rate = total_incidence / model.parameters.population;

        // Check final size relation
        assert!((0.7968216 - attack_rate).abs() < 1e-5);
    }

    #[test]
    fn final_size_relation_with_groups() {
        let mut params = Parameters::default();
        params.population = 1.0;
        params.initial_infections = 1e-8;
        params.r0 = 2.0;
        params.latent_period = 1.0;
        params.infectious_period = 3.0;

        let model = SEIRModel::new(params);
        let (_, values, values_vec) = &model.integrate(300)[0];

        let total_incidence: f64 = values.iter().map(|x| x.value).sum();
        let attack_rate = total_incidence / model.parameters.population;

        let incidence_by_group = values_vec
            .iter()
            .map(|x| DVector::from_vec(x.value.clone()))
            .reduce(|acc, elem| acc + elem)
            .unwrap();
        let attack_rate_by_group = incidence_by_group
            .component_div(&model.parameters.population_fractions)
            / model.parameters.population;

        // Check final size relation
        assert!((0.6755054 - attack_rate).abs() < 1e-5);

        // Check final size relation by group
        assert!((0.8658730 - attack_rate_by_group[0]).abs() < 1e-5);
        assert!((0.6120495 - attack_rate_by_group[1]).abs() < 1e-5);
    }

    #[test]
    fn test_vaccine() {
        let mut parameters = Parameters::default();
        parameters.mitigations.vaccine.enabled = true;
        let model = SEIRModel::new(parameters);
        let (_, values, _) = &model.integrate(200)[0];

        let total_incidence: f64 = values.iter().map(|x| x.value).sum();
        let attack_rate = total_incidence / model.parameters.population;

        println!("{}", attack_rate)
    }

    #[test]
    fn test_eigen() {
        let x = matrix![1.0, 3.0; 2.0, 4.0];
        let (eval, evec) = get_dominant_eigendata(&x);
        assert!((eval - 5.3722813).abs() < 1e-6);
        assert!((evec[0] - 0.4069297).abs() < 1e-6);
        assert!((evec[1] - 0.5930703).abs() < 1e-6);
    }
}
