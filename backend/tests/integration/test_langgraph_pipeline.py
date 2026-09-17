import asyncio

from graph.agents.safety_sentinel import route_after_sentinel, safety_sentinel_agent
from graph.pipeline import build_graph, empty_pipeline_state


def test_sentinel_routes_to_fast_track():
    state = empty_pipeline_state("crushing chest pain radiating to left arm")
    update = safety_sentinel_agent(state)
    merged = {**state, **update}
    assert route_after_sentinel(merged) == "emergency_fast_track"


def test_sentinel_routes_stable_cases_to_intake():
    state = empty_pipeline_state("mild runny nose and sneezing")
    update = safety_sentinel_agent(state)
    merged = {**state, **update}
    assert route_after_sentinel(merged) == "intake"


def test_emergency_path_completes_without_llm():
    graph = build_graph()

    async def _run():
        state = empty_pipeline_state("uncontrolled bleeding after a road accident")
        return await graph.ainvoke(state)

    result = asyncio.run(_run())
    assert result["is_emergency"] is True
    assert result["esi_level"] == 1
    assert result["selected_facility"]
    assert result["fhir_bundle"]["resourceType"] == "Bundle"
    assert result["referral_doc"]
    assert result["disclaimer"]
