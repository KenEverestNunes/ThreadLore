"""Unit tests for structural interlacing and cyclic float validation engine."""

from backend.app.core.compiler import factor_drawdown
from backend.app.core.types import BinaryMatrix, LoomDraft
from backend.app.core.validator import calculate_max_cyclic_run, validate_draft


def test_calculate_max_cyclic_run() -> None:
    """Cyclic run counter must correctly measure contiguous runs across 2N boundaries."""
    # [1, 1, 0, 0] wrapped -> [1, 1, 0, 0, 1, 1, 0, 0]
    # run of 1s is 2, run of 0s is 2
    assert calculate_max_cyclic_run([1, 1, 0, 0], 1) == 2
    assert calculate_max_cyclic_run([1, 1, 0, 0], 0) == 2

    # Wrapping across boundary: [1, 0, 0, 1]
    # 1s at ends wrap into each other: [1, 0, 0, 1, 1, 0, 0, 1] -> max run of 1s is 2!
    assert calculate_max_cyclic_run([1, 0, 0, 1], 1) == 2
    assert calculate_max_cyclic_run([1, 0, 0, 1], 0) == 2

    # Uniform sequence capped at N
    assert calculate_max_cyclic_run([1, 1, 1, 1], 1) == 4
    assert calculate_max_cyclic_run([1, 1, 1, 1], 0) == 0


def test_all_11_canonical_weaves_pass_validation(
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
    """All 11 canonical supported weaves must pass validation with 0 errors and floats ≤ 4."""
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
        result = validate_draft(draft)
        assert result.is_valid, f"Failed for matrix: {matrix}, errors: {result.errors}"
        assert len(result.errors) == 0
        assert result.max_warp_float <= 4
        assert result.max_weft_float <= 4
        assert result.shafts_used <= 4
        assert result.treadles_used <= 4


def test_uniform_row_rejection(uniform_row_matrix: BinaryMatrix) -> None:
    """A matrix where a row is completely uniform must be rejected (weft never interlaces)."""
    draft = factor_drawdown(uniform_row_matrix)
    result = validate_draft(draft)
    assert not result.is_valid
    assert any("weft yarn never interlaces" in err for err in result.errors)


def test_uniform_col_rejection(uniform_col_matrix: BinaryMatrix) -> None:
    """A matrix where a column is completely uniform must be rejected (warp never interlaces)."""
    draft = factor_drawdown(uniform_col_matrix)
    result = validate_draft(draft)
    assert not result.is_valid
    assert any("warp yarn never interlaces" in err for err in result.errors)


def test_excessive_cyclic_float_rejection() -> None:
    """Draft with cyclic float > max_allowed must be rejected."""
    # Synthetic draft with float length of 5 on a 6-thread repeat
    draft = LoomDraft(
        shafts=2,
        treadles=2,
        warp_threads=6,
        weft_picks=6,
        threading=[1, 2, 1, 2, 1, 2],
        treadling=[1, 2, 1, 2, 1, 2],
        tieup=[[1, 0], [0, 1]],
        drawdown=[
            [1, 1, 1, 1, 1, 0],  # run of 5 ones!
            [0, 1, 0, 1, 0, 1],
            [1, 0, 1, 0, 1, 0],
            [0, 1, 0, 1, 0, 1],
            [1, 0, 1, 0, 1, 0],
            [0, 1, 0, 1, 0, 1],
        ],
    )
    result = validate_draft(draft, max_allowed_float=4)
    assert not result.is_valid
    assert any("excessive cyclic" in err for err in result.errors)
