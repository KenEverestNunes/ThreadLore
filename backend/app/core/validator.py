"""Structural interlacing and loom constraint validation for rising-shed drafts."""

from backend.app.core.types import LoomDraft, ValidationResult


def calculate_max_cyclic_run(sequence: list[int], target_val: int) -> int:
    """Calculate the longest contiguous cyclic run of target_val across periodic boundaries.

    Uses a 2N doubled array to simulate toroidal boundary wrapping, capped at len(sequence).
    """
    n = len(sequence)
    if n == 0:
        return 0

    doubled = sequence + sequence
    max_run = 0
    current_run = 0

    for cell in doubled:
        if cell == target_val:
            current_run += 1
            if current_run > max_run:
                max_run = current_run
        else:
            current_run = 0

    return min(max_run, n)


def validate_draft(draft: LoomDraft, max_allowed_float: int = 4) -> ValidationResult:
    """Validate physical loom boundaries, uniform thread interlacing, and cyclic floats.

    Enforces:
    1. Shafts ceiling: ≤ 4 shafts.
    2. Treadles ceiling: ≤ 4 treadles.
    3. Interlacing check: no completely uniform rows or columns (threads that never interlace).
    4. Cyclic float limit: maximum consecutive warp or weft floats ≤ max_allowed_float across 2N wrap.

    Note: This validation guarantees structural interlacing integrity for rising-shed looms;
    it does not substitute for empirical yarn friction or tensile wear testing.
    """
    errors: list[str] = []

    # 1. Loom ceiling checks
    if draft.shafts > 4:
        errors.append(
            f"Requires {draft.shafts} shafts, exceeding the physical 4-shaft loom ceiling."
        )
    if draft.treadles > 4:
        errors.append(
            f"Requires {draft.treadles} treadles, exceeding the physical 4-treadle loom ceiling."
        )

    drawdown = draft.drawdown
    h = len(drawdown)
    w = len(drawdown[0]) if h > 0 else 0

    if h == 0 or w == 0:
        return ValidationResult(
            is_valid=False,
            errors=["Drawdown matrix is empty."],
            shafts_used=draft.shafts,
            treadles_used=draft.treadles,
        )

    # 2. Interlacing check: Reject completely uniform rows (weft) and columns (warp)
    for i, row in enumerate(drawdown):
        if all(cell == 0 for cell in row):
            errors.append(f"Weft pick {i + 1} is entirely unraised; weft yarn never interlaces.")
        elif all(cell == 1 for cell in row):
            errors.append(f"Weft pick {i + 1} is entirely raised; weft yarn never interlaces.")

    for j in range(w):
        col = [drawdown[i][j] for i in range(h)]
        if all(cell == 0 for cell in col):
            errors.append(f"Warp end {j + 1} is entirely unraised; warp yarn never interlaces.")
        elif all(cell == 1 for cell in col):
            errors.append(f"Warp end {j + 1} is entirely raised; warp yarn never interlaces.")

    # 3. Cyclic float analysis across periodic boundaries
    overall_max_weft_float = 0
    overall_max_warp_float = 0

    # Horizontal runs along weft picks (rows)
    for i, row in enumerate(drawdown):
        weft_face_float = calculate_max_cyclic_run(row, 0)  # Weft over warp
        warp_face_float = calculate_max_cyclic_run(row, 1)  # Warp over weft

        if weft_face_float > overall_max_weft_float:
            overall_max_weft_float = weft_face_float
        if warp_face_float > overall_max_warp_float:
            overall_max_warp_float = warp_face_float

        if weft_face_float > max_allowed_float:
            errors.append(
                f"Weft pick {i + 1} has excessive cyclic weft float of length {weft_face_float} (max allowed: {max_allowed_float})."
            )
        if warp_face_float > max_allowed_float:
            errors.append(
                f"Weft pick {i + 1} has excessive cyclic warp float of length {warp_face_float} (max allowed: {max_allowed_float})."
            )

    # Vertical runs along warp ends (columns)
    for j in range(w):
        col = [drawdown[i][j] for i in range(h)]
        warp_face_float = calculate_max_cyclic_run(col, 1)  # Warp over weft
        weft_face_float = calculate_max_cyclic_run(col, 0)  # Weft over warp

        if warp_face_float > overall_max_warp_float:
            overall_max_warp_float = warp_face_float
        if weft_face_float > overall_max_weft_float:
            overall_max_weft_float = weft_face_float

        if warp_face_float > max_allowed_float:
            errors.append(
                f"Warp end {j + 1} has excessive cyclic warp float of length {warp_face_float} (max allowed: {max_allowed_float})."
            )
        if weft_face_float > max_allowed_float:
            errors.append(
                f"Warp end {j + 1} has excessive cyclic weft float of length {weft_face_float} (max allowed: {max_allowed_float})."
            )

    is_valid = len(errors) == 0

    return ValidationResult(
        is_valid=is_valid,
        errors=errors,
        max_warp_float=overall_max_warp_float,
        max_weft_float=overall_max_weft_float,
        shafts_used=draft.shafts,
        treadles_used=draft.treadles,
    )
