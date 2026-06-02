# CLAUDE.md — sympli project

## Project overview

`sympli` is a PyTorch library for tuning symplectic RKN splitting methods via
gradient-based optimization of integrator coefficients. The core idea: minimize
energy drift (backward-error proxy) over an ensemble of potentials and initial
conditions, using autodiff through the integrator.

## Architecture

Functional core, thin OO shell:

- **`flows.py`** — Pure `drift()` and `kick()` functions. `kick` uses
  `torch.autograd.grad` with `create_graph=True` for double-backprop.
- **`methods.py`** — `SplittingMethod` frozen dataclass. Immutable value object,
  no parameter ownership. ABA and BAB variants.
- **`integrator.py`** — `step()` + `rollout()` with optional gradient checkpointing.
- **`reparam.py`** — `nn.Module`s (`SymmetricABA`, `ConsistencyReparam`) that
  produce `SplittingMethod` instances with differentiable coefficients.
- **`objective.py`** — `energy_drift`, `energy_variance`, `smoothed_energy_drift`.
- **`baselines.py`** — Reference methods: leapfrog, Yoshida4, Ruth3, Blanes-Moan, Omelyan.
- **`potentials/`** — Potential functions as callables (closures, not classes).

## Conventions

- All tensors are `float64`.
- State shape: `(..., 2, D)` where `z[..., 0, :] = p`, `z[..., 1, :] = q`.
- ABA: K drift stages (`len(a) = K`), K+1 kick stages (`len(b) = K+1`).
- BAB: K kick stages (`len(b) = K`), K+1 drift stages (`len(a) = K+1`).
- Step size `h` is a Python float (not learned). Coefficients are Tensors.
- Potentials are `Callable[[Tensor], Tensor]`, not classes.

## Running

```bash
pip install -e ".[dev]"      # install with dev deps
python -m pytest tests/ -v   # run tests (27 tests)
python evals/bench.py        # graphical benchmarks (interactive)
python evals/bench.py --save # save figures to evals/figures/
```

## Git workflow

- Always commit and push after major code modifications.
- Keep `requirements.txt` and `requirements-dev.txt` up to date when adding dependencies.
- Use `.gitignore` — never commit `__pycache__`, `.egg-info`, or `.claude/`.

## Key correctness concerns

- `kick()` must NOT detach `q` — it carries dependence on method coefficients
  from prior drift steps. Breaking this kills gradient flow.
- Method coefficients (`a`, `b`) must sum to 1 (consistency condition).
  Verify this for any new baseline added.
- `create_graph=True` in `kick` is required for tuning (outer `loss.backward()`
  must differentiate through inner `autograd.grad`). Set `create_graph=False`
  only for evaluation/benchmarking.
