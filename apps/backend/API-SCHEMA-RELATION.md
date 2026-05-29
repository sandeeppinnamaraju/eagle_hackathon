# API Schema Relation

This document captures schema/data relation diagrams for all currently available backend APIs. All endpoints are mounted under `/api`.

## 1) POST `/api/search-protocols`
Purpose: Search similar protocols from free text and therapeutic filters.

```mermaid
flowchart LR
    A[ProtocolSearchRequest\nsummary\ninclusion_criteria\nexclusion_criteria\ntherapeutic_areas\ntop_k]
    B[similarity_engine.search_similar_protocols]
    C[(public.protocols)]
    D[Ranked protocol matches]

    A --> B
    B --> C
    C --> B
    B --> D
```

## 2) GET `/api/protocol/{protocol_id}`
Purpose: Return full protocol dashboard payload by protocol id.

```mermaid
flowchart LR
    A[protocol_id]
    B[get_protocol_details]
    C[(public.protocols)]
    D[(public.protocol_sites)]
    E[protocol + kpis + sites + criteria + insights]

    A --> B
    B --> C
    B --> D
    C --> B
    D --> B
    B --> E
```

## 3) GET `/api/study-protocol/studies`
Purpose: Paginated and filtered study list.

```mermaid
flowchart LR
    A[Query params\npage, limit, search, filters, sort]
    B[get_studies]
    C[(public.studies)]
    D[StudiesPage\nitems, page, limit, total, hasMore]

    A --> B
    B --> C
    C --> B
    B --> D
```

## 4) GET `/api/study-protocol/`
Purpose: Alias endpoint for study list (same logic as `/api/study-protocol/studies`).

```mermaid
flowchart LR
    A[Alias route]
    B[get_studies]
    C[(public.studies)]
    D[StudiesPage]

    A --> B
    B --> C
    C --> B
    B --> D
```

## 5) GET `/api/health`
Purpose: Database connectivity health check.

```mermaid
flowchart LR
    A["/api/health"]
    B[get_conn_params]
    C[(PostgreSQL connection)]
    D["status: ok"]

    A --> B
    B --> C
    C --> D
```

## 6) GET `/api/db/version`
Purpose: Return PostgreSQL server version.

```mermaid
flowchart LR
    A["/api/db/version"]
    B[get_conn_params]
    C[(PostgreSQL)]
    D["SELECT version()"]
    E["version"]

    A --> B
    B --> C
    C --> D
    D --> E
```

## 8) GET `/api/study-protocol/active-count`
Purpose: Count active studies.

```mermaid
flowchart LR
    A["/active-count"]
    B[get_active_studies_count]
    C[(public.studies)]
    D["active_studies_count"]

    A --> B
    B --> C
    C --> B
    B --> D
```

## 9) GET `/api/study-protocol/on-track`
Purpose: Percentage and count of on-track active studies.

```mermaid
flowchart LR
    A["/on-track"]
    B[get_on_track_percentage]
    C[(public.studies)]
    D["percentage, total_active_studies, on_track_studies_count"]

    A --> B
    B --> C
    C --> B
    B --> D
```

## 10) GET `/api/study-protocol/off-track-or-at-risk`
Purpose: Percentage and count of off-track or at-risk active studies.

```mermaid
flowchart LR
    A["/off-track-or-at-risk"]
    B[get_off_track_or_at_risk_percentage]
    C[(public.studies)]
    D["percentage, total_active_studies, off_track_or_at_risk_studies_count"]

    A --> B
    B --> C
    C --> B
    B --> D
```

## 11) GET `/api/study-protocol/enrollment-vs-target`
Purpose: Actual vs target enrollment rollup and ratio.

```mermaid
flowchart LR
    A["/enrollment-vs-target"]
    B[get_enrollment_vs_target]
    C[(public.studies)]
    D["percentage, sum_actual, sum_target"]

    A --> B
    B --> C
    C --> B
    B --> D
```

## 12) GET `/api/study-protocol/velocity-vs-plan`
Purpose: Compute average enrollment_plan_percent for active studies.

```mermaid
flowchart LR
    A["/velocity-vs-plan"]
    B[get_average_velocity_vs_plan]
    C[(public.studies)]
    D[average_velocity_vs_plan]

    A --> B
    B --> C
    C --> B
    B --> D
```

## 13) GET `/api/study-protocol/kpi-details`
Purpose: Combined KPI payload using the same filter set as study listing.

```mermaid
flowchart LR
    A[Query params\nsearch, therapeuticArea, phase, status, portfolio, program, region]
    B[get_kpi_details]
    C[(public.studies)]
    D["active_studies, on_track, off_track_or_at_risk, enrollment_vs_target, schedule_adherence, velocity_vs_plan"]

    A --> B
    B --> C
    C --> B
    B --> D
```