"""Unit tests for the Product Catalog Tool."""

import pytest
from tools.product_catalog.service import load_products, map_risk, get_recommendations


class TestLoadProducts:
    """Test catalog loading from JSON."""

    def test_loads_from_custom_path(self, sample_catalog):
        products = load_products(str(sample_catalog))
        assert len(products) == 6
        assert products[0]["id"] == "SAV-001"

    def test_returns_tuple_for_caching(self, sample_catalog):
        products = load_products(str(sample_catalog))
        assert isinstance(products, tuple)


class TestMapRisk:
    """Test risk profile → catalog risk level mapping."""

    def test_conservative_maps_to_low(self):
        assert map_risk("conservative") == "low"

    def test_moderate_maps_to_moderate(self):
        assert map_risk("moderate") == "moderate"

    def test_aggressive_maps_to_high(self):
        assert map_risk("aggressive") == "high"

    def test_unknown_defaults_moderate(self):
        assert map_risk("invalid") == "moderate"


class TestGetRecommendations:
    """Test product filtering by risk, goals, and credit."""

    def test_conservative_gets_low_risk(self, sample_catalog):
        recs = get_recommendations(
            "conservative", ["emergency_fund"], 700,
            catalog_path=str(sample_catalog)
        )
        assert len(recs) > 0
        assert all(r["risk_level"] == "low" for r in recs)

    def test_aggressive_gets_high_risk(self, sample_catalog):
        recs = get_recommendations(
            "aggressive", ["wealth"], 750,
            catalog_path=str(sample_catalog)
        )
        assert len(recs) > 0
        assert all(r["risk_level"] == "high" for r in recs)

    def test_credit_score_filtering(self, sample_catalog):
        # With credit 500, should exclude products requiring > 500
        recs = get_recommendations(
            "conservative", ["emergency_fund"], 500,
            catalog_path=str(sample_catalog)
        )
        assert all(r["min_credit"] <= 500 for r in recs)

    def test_goal_matching(self, sample_catalog):
        recs = get_recommendations(
            "moderate", ["house"], 700,
            catalog_path=str(sample_catalog)
        )
        assert all(
            any(g in r["eligible_goals"] for g in ["house"])
            for r in recs
        )

    def test_max_results_cap(self, sample_catalog):
        recs = get_recommendations(
            "conservative", ["emergency_fund", "general"], 700,
            catalog_path=str(sample_catalog),
            max_results=2
        )
        assert len(recs) <= 2

    def test_no_match_returns_empty(self, sample_catalog):
        recs = get_recommendations(
            "aggressive", ["nonexistent_goal"], 300,
            catalog_path=str(sample_catalog)
        )
        assert recs == []

    def test_conservative_vs_aggressive_differ(self, sample_catalog):
        conservative = get_recommendations(
            "conservative", ["emergency_fund", "retirement"], 700,
            catalog_path=str(sample_catalog)
        )
        aggressive = get_recommendations(
            "aggressive", ["wealth", "retirement"], 700,
            catalog_path=str(sample_catalog)
        )
        conservative_ids = {r["id"] for r in conservative}
        aggressive_ids = {r["id"] for r in aggressive}
        assert conservative_ids != aggressive_ids  # Different product sets
