"""Transport-neutral, saved-index relationship evidence. No note source bodies."""
from dataclasses import dataclass


@dataclass(frozen=True)
class GraphNode:
    path: str
    title: str
    revision: str
    href: str


@dataclass(frozen=True)
class LinkOccurrence:
    occurrence_id: int
    source: str
    source_revision: str
    target: str
    kind: str
    fragment: str
    position: tuple[int, ...]
    position_precision: str
    occurrence_kind: str
    state: str
    destination: str | None
    resource_type: str
    choices: tuple[str, ...] = ()


@dataclass(frozen=True)
class GraphEdge:
    source: str
    destination: str
    occurrence_count: int
    source_revision: str
    occurrence_id: int
    position: tuple[int, ...]
    position_precision: str = 'advisory'


@dataclass(frozen=True, kw_only=True)
class PageMetadata:
    state: str
    freshness: dict
    generation: int | None
    mutation: int
    relation_epoch: int
    projection_complete: bool
    observed_at: str
    limits: dict
    eligibility_version: str = ''
    limiting_reasons: tuple[str, ...] = ()
    next_cursor: str | None = None
    authoritative: bool = False
    untrusted_content: bool = True
    count_kind: str = 'observed_lower_bound'


@dataclass(frozen=True, kw_only=True)
class LinkPage(PageMetadata):
    items: tuple[LinkOccurrence, ...] = ()


@dataclass(frozen=True, kw_only=True)
class GraphPage(PageMetadata):
    nodes: tuple[GraphNode, ...] = ()
    edges: tuple[GraphEdge, ...] = ()
    boundary_connections: bool = False


@dataclass(frozen=True, kw_only=True)
class LinkIssuePage(PageMetadata):
    items: tuple = ()
