"""Deterministic Boolean matrix factorization for 4-shaft rising-shed looms."""

from backend.app.core.types import (
    BinaryMatrix,
    InvalidDrawdownError,
    LoomDraft,
    LoomShaftOverflowError,
    LoomTreadleOverflowError,
)


def simulate_drawdown(
    threading: list[int],
    treadling: list[int],
    tieup: list[list[int]],
) -> BinaryMatrix:
    """Simulate rising-shed drawdown from threading, treadling, and tie-up matrices.

    Rising-shed convention:
    On pick i, treadle t = treadling[i] is pressed.
    Shaft s = threading[j] is raised if tieup[s-1][t-1] == 1.
    If shaft s is raised, warp end j rises over weft pick i (drawdown[i][j] = 1).
    Otherwise, weft pick i crosses over warp end j (drawdown[i][j] = 0).
    """
    h = len(treadling)
    w = len(threading)
    drawdown: list[list[int]] = []

    for i in range(h):
        t_idx = treadling[i] - 1  # 0-based treadle index
        row: list[int] = []
        for j in range(w):
            s_idx = threading[j] - 1  # 0-based shaft index
            cell = 1 if tieup[s_idx][t_idx] == 1 else 0
            row.append(cell)
        drawdown.append(row)

    return drawdown


def factor_matrix(drawdown: BinaryMatrix) -> LoomDraft:
    """Factor an arbitrary binary drawdown matrix into shafts, treadles, and tie-up.

    Underlying solver interface. Enforces 4-shaft / 4-treadle ceiling.
    Closed-form derivation: M[s, t] = D[i_t, j_s] from representative row/col intersections.
    """
    if not drawdown or not drawdown[0]:
        raise InvalidDrawdownError("Drawdown matrix cannot be empty.")

    h = len(drawdown)
    w = len(drawdown[0])

    # Validate rectangular shape and binary values
    for r_idx, row in enumerate(drawdown):
        if len(row) != w:
            raise InvalidDrawdownError(
                f"Row {r_idx} has length {len(row)}, expected {w} (ragged matrix)."
            )
        for c_idx, cell in enumerate(row):
            if cell not in (0, 1):
                raise InvalidDrawdownError(
                    f"Cell ({r_idx}, {c_idx}) has value {cell}; must be strictly 0 or 1."
                )

    # 1. Shaft allocation from unique column patterns (1-based)
    col_to_shaft: dict[tuple[int, ...], int] = {}
    threading: list[int] = []
    representative_cols: dict[int, int] = {}  # shaft -> col_idx

    for j in range(w):
        col_pattern = tuple(drawdown[i][j] for i in range(h))
        if col_pattern not in col_to_shaft:
            assigned_shaft = len(col_to_shaft) + 1
            col_to_shaft[col_pattern] = assigned_shaft
            representative_cols[assigned_shaft] = j
        threading.append(col_to_shaft[col_pattern])

    s_count = len(col_to_shaft)
    if s_count > 4:
        raise LoomShaftOverflowError(
            f"Pattern requires {s_count} shafts, exceeding the physical 4-shaft loom ceiling."
        )

    # 2. Treadle allocation from unique row patterns (1-based)
    row_to_treadle: dict[tuple[int, ...], int] = {}
    treadling: list[int] = []
    representative_rows: dict[int, int] = {}  # treadle -> row_idx

    for i in range(h):
        row_pattern = tuple(drawdown[i])
        if row_pattern not in row_to_treadle:
            assigned_treadle = len(row_to_treadle) + 1
            row_to_treadle[row_pattern] = assigned_treadle
            representative_rows[assigned_treadle] = i
        treadling.append(row_to_treadle[row_pattern])

    t_count = len(row_to_treadle)
    if t_count > 4:
        raise LoomTreadleOverflowError(
            f"Pattern requires {t_count} treadles, exceeding the physical 4-treadle loom ceiling."
        )

    # 3. Closed-Form Tie-Up Matrix Derivation (S × T)
    # M[s-1][t-1] = D[i_t, j_s]
    tieup: list[list[int]] = []
    for s in range(1, s_count + 1):
        tieup_row: list[int] = []
        j_s = representative_cols[s]
        for t in range(1, t_count + 1):
            i_t = representative_rows[t]
            tieup_row.append(drawdown[i_t][j_s])
        tieup.append(tieup_row)

    # 4. Mathematical Round-Trip Proof
    simulated = simulate_drawdown(threading, treadling, tieup)
    if simulated != drawdown:
        raise InvalidDrawdownError(
            "Mathematical round-trip verification failed: simulated drawdown does not match input."
        )

    return LoomDraft(
        shafts=s_count,
        treadles=t_count,
        warp_threads=w,
        weft_picks=h,
        threading=threading,
        treadling=treadling,
        tieup=tieup,
        drawdown=drawdown,
    )


def factor_drawdown(
    drawdown: BinaryMatrix,
    repeat_warp: int = 1,
    repeat_weft: int = 1,
) -> LoomDraft:
    """Factor an N×N master repeat tile (N ∈ {2, 3, 4}) with optional project repeat expansion."""
    if not drawdown or not drawdown[0]:
        raise InvalidDrawdownError("Master tile drawdown cannot be empty.")

    h = len(drawdown)
    w = len(drawdown[0])

    if h != w or h not in (2, 3, 4):
        raise InvalidDrawdownError(
            f"Master repeat tile must be square 2x2, 3x3, or 4x4. Received {h}x{w}."
        )

    if repeat_warp < 1 or repeat_weft < 1:
        raise InvalidDrawdownError("Repeat counts must be positive integers (≥ 1).")

    # Base factorization
    base_draft = factor_matrix(drawdown)

    if repeat_warp == 1 and repeat_weft == 1:
        return base_draft

    # Repeat expansion for practical loom projects
    expanded_threading = base_draft.threading * repeat_warp
    expanded_treadling = base_draft.treadling * repeat_weft
    expanded_drawdown = simulate_drawdown(expanded_threading, expanded_treadling, base_draft.tieup)

    return LoomDraft(
        shafts=base_draft.shafts,
        treadles=base_draft.treadles,
        warp_threads=w * repeat_warp,
        weft_picks=h * repeat_weft,
        threading=expanded_threading,
        treadling=expanded_treadling,
        tieup=base_draft.tieup,
        drawdown=expanded_drawdown,
    )
