"""Unit tests for deterministic Boolean weave compiler and factorization engine."""

import pytest

from backend.app.core.compiler import factor_drawdown, factor_matrix, simulate_drawdown
from backend.app.core.types import (
    BinaryMatrix,
    InvalidDrawdownError,
    LoomShaftOverflowError,
)


def test_plain_1_1_factorization(plain_1_1: BinaryMatrix) -> None:
    """Plain weave (2x2) must factor into 2 shafts, 2 treadles with 100% round-trip fidelity."""
    draft = factor_drawdown(plain_1_1)
    assert draft.shafts == 2
    assert draft.treadles == 2
    assert draft.warp_threads == 2
    assert draft.weft_picks == 2
    assert draft.threading == [1, 2]
    assert draft.treadling == [1, 2]
    assert draft.tieup == [[1, 0], [0, 1]]

    simulated = simulate_drawdown(draft.threading, draft.treadling, draft.tieup)
    assert simulated == plain_1_1


def test_twill_2_1_factorization(twill_2_1_z: BinaryMatrix) -> None:
    """2/1 twill (3x3) must factor into 3 shafts, 3 treadles."""
    draft = factor_drawdown(twill_2_1_z)
    assert draft.shafts == 3
    assert draft.treadles == 3
    assert draft.warp_threads == 3
    assert draft.weft_picks == 3

    simulated = simulate_drawdown(draft.threading, draft.treadling, draft.tieup)
    assert simulated == twill_2_1_z


def test_twill_2_2_factorization(twill_2_2_z: BinaryMatrix) -> None:
    """2/2 twill (4x4) must factor into 4 shafts, 4 treadles."""
    draft = factor_drawdown(twill_2_2_z)
    assert draft.shafts == 4
    assert draft.treadles == 4
    assert draft.warp_threads == 4
    assert draft.weft_picks == 4

    simulated = simulate_drawdown(draft.threading, draft.treadling, draft.tieup)
    assert simulated == twill_2_2_z


def test_all_11_canonical_weaves_factorization(
    plain_1_1: BinaryMatrix,
    twill_1_2_z: BinaryMatrix,
    twill_1_2_s: BinaryMatrix,
    twill_2_1_z: BinaryMatrix,
    twill_2_1_s: BinaryMatrix,
    twill_1_3_z: BinaryMatrix,
    twill_1_3_s: BinaryMatrix,
    twill_2_2_z: BinaryMatrix,
    twill_2_2_s: BinaryMatrix,
    twill_3_1_z: BinaryMatrix,
    twill_3_1_s: BinaryMatrix,
) -> None:
    """All 11 canonical supported weaves must factor under ≤ 4 shafts and ≤ 4 treadles."""
    canonical_set = [
        plain_1_1,
        twill_1_2_z,
        twill_1_2_s,
        twill_2_1_z,
        twill_2_1_s,
        twill_1_3_z,
        twill_1_3_s,
        twill_2_2_z,
        twill_2_2_s,
        twill_3_1_z,
        twill_3_1_s,
    ]

    for matrix in canonical_set:
        draft = factor_drawdown(matrix)
        assert draft.shafts <= 4
        assert draft.treadles <= 4
        # Closed-form tie-up must perfectly reproduce drawdown
        simulated = simulate_drawdown(draft.threading, draft.treadling, draft.tieup)
        assert simulated == matrix


def test_repeat_expansion(twill_2_2_z: BinaryMatrix) -> None:
    """Repeat expansion must tile threading, treadling, and drawdown without changing shaft count."""
    draft = factor_drawdown(twill_2_2_z, repeat_warp=10, repeat_weft=10)
    assert draft.shafts == 4
    assert draft.treadles == 4
    assert draft.warp_threads == 40
    assert draft.weft_picks == 40
    assert len(draft.threading) == 40
    assert len(draft.treadling) == 40
    assert len(draft.drawdown) == 40
    assert len(draft.drawdown[0]) == 40

    simulated = simulate_drawdown(draft.threading, draft.treadling, draft.tieup)
    assert simulated == draft.drawdown


def test_5_shaft_satin_overflow(satin_5_end: BinaryMatrix) -> None:
    """Underlying matrix solver must strictly reject matrices requiring > 4 shafts."""
    with pytest.raises(LoomShaftOverflowError) as exc_info:
        factor_matrix(satin_5_end)
    assert "exceeding the physical 4-shaft loom ceiling" in str(exc_info.value)


def test_invalid_drawdowns() -> None:
    """Compiler must reject non-binary, empty, ragged, or dimension-invalid matrices."""
    with pytest.raises(InvalidDrawdownError):
        factor_matrix([])

    with pytest.raises(InvalidDrawdownError):
        factor_matrix([[0, 2], [1, 0]])

    with pytest.raises(InvalidDrawdownError):
        factor_matrix([[0, 1], [1]])

    # factor_drawdown enforces square 2x2, 3x3, or 4x4
    with pytest.raises(InvalidDrawdownError):
        factor_drawdown([[1, 0, 0], [0, 1, 0]])  # 2x3 not square

    with pytest.raises(InvalidDrawdownError):
        factor_drawdown([[1] * 5 for _ in range(5)])  # 5x5 exceeds 4x4 repeat
