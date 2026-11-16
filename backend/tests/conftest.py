"""Canonical weave matrix fixtures and test data for ThreadLore test suite."""

import pytest

from backend.app.core.types import BinaryMatrix


@pytest.fixture
def plain_1_1() -> BinaryMatrix:
    """Canonical 2x2 plain weave (tabby)."""
    return [
        [1, 0],
        [0, 1],
    ]


@pytest.fixture
def twill_1_2_z() -> BinaryMatrix:
    """1/2 weft-faced twill, Z-direction (diagonal right)."""
    return [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
    ]


@pytest.fixture
def twill_1_2_s() -> BinaryMatrix:
    """1/2 weft-faced twill, S-direction (diagonal left)."""
    return [
        [1, 0, 0],
        [0, 0, 1],
        [0, 1, 0],
    ]


@pytest.fixture
def twill_2_1_z() -> BinaryMatrix:
    """2/1 warp-faced twill, Z-direction."""
    return [
        [1, 1, 0],
        [0, 1, 1],
        [1, 0, 1],
    ]


@pytest.fixture
def twill_2_1_s() -> BinaryMatrix:
    """2/1 warp-faced twill, S-direction."""
    return [
        [1, 1, 0],
        [1, 0, 1],
        [0, 1, 1],
    ]


@pytest.fixture
def twill_1_3_z() -> BinaryMatrix:
    """1/3 weft-faced twill, Z-direction."""
    return [
        [1, 0, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 1],
    ]


@pytest.fixture
def twill_1_3_s() -> BinaryMatrix:
    """1/3 weft-faced twill, S-direction."""
    return [
        [1, 0, 0, 0],
        [0, 0, 0, 1],
        [0, 0, 1, 0],
        [0, 1, 0, 0],
    ]


@pytest.fixture
def twill_2_2_z() -> BinaryMatrix:
    """2/2 balanced twill, Z-direction."""
    return [
        [1, 1, 0, 0],
        [0, 1, 1, 0],
        [0, 0, 1, 1],
        [1, 0, 0, 1],
    ]


@pytest.fixture
def twill_2_2_s() -> BinaryMatrix:
    """2/2 balanced twill, S-direction."""
    return [
        [1, 1, 0, 0],
        [1, 0, 0, 1],
        [0, 0, 1, 1],
        [0, 1, 1, 0],
    ]


@pytest.fixture
def twill_3_1_z() -> BinaryMatrix:
    """3/1 warp-faced twill, Z-direction."""
    return [
        [1, 1, 1, 0],
        [0, 1, 1, 1],
        [1, 0, 1, 1],
        [1, 1, 0, 1],
    ]


@pytest.fixture
def twill_3_1_s() -> BinaryMatrix:
    """3/1 warp-faced twill, S-direction."""
    return [
        [1, 1, 1, 0],
        [1, 1, 0, 1],
        [1, 0, 1, 1],
        [0, 1, 1, 1],
    ]


@pytest.fixture
def satin_5_end() -> BinaryMatrix:
    """5-end regular satin (step 2), strictly requires 5 shafts and 5 treadles."""
    return [
        [1, 0, 0, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 0, 0, 1],
        [0, 1, 0, 0, 0],
        [0, 0, 0, 1, 0],
    ]


@pytest.fixture
def uniform_row_matrix() -> BinaryMatrix:
    """Matrix where row 0 is all 1s (weft never interlaces)."""
    return [
        [1, 1, 1, 1],
        [0, 1, 0, 1],
        [1, 0, 1, 0],
        [0, 1, 0, 1],
    ]


@pytest.fixture
def uniform_col_matrix() -> BinaryMatrix:
    """Matrix where column 0 is all 0s (warp never interlaces)."""
    return [
        [0, 1, 0, 1],
        [0, 0, 1, 1],
        [0, 1, 1, 0],
        [0, 0, 1, 0],
    ]
