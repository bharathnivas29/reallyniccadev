import pytest
from unittest.mock import Mock, MagicMock
from app.features.organize.services.relationship_classifier import RelationshipClassifier
from app.features.organize.schemas.extract import ExtractedRelationship
from app.shared.utils.gemini_client import GeminiClient

class TestRelationshipClassifierLLM:
    @pytest.fixture
    def classifier(self):
        return RelationshipClassifier()

    @pytest.fixture
    def mock_gemini(self):
        return Mock(spec=GeminiClient)

    def test_classify_relationships_with_llm_success(self, classifier, mock_gemini):
        # Setup input relationships
        relationships = [
            ExtractedRelationship(
                sourceEntity="Elon Musk",
                targetEntity="Tesla",
                type="cooccurrence",
                relationType="related_to",
                weight=0.8, # High weight, should be classified
                confidence=0.7,
                examples=["Elon Musk is the CEO of Tesla."]
            ),
            ExtractedRelationship(
                sourceEntity="Apple",
                targetEntity="Banana",
                type="cooccurrence",
                relationType="related_to",
                weight=0.2, # Low weight, should be skipped
                confidence=0.5,
                examples=["Apple and Banana are fruits."]
            )
        ]

        # Setup mock response
        mock_gemini.classify_relationship.return_value = {
            "type": "works_at",
            "confidence": 0.95
        }

        # Execute
        result = classifier.classify_relationships_with_llm(relationships, mock_gemini)

        # Verify
        assert len(result) == 2
        
        # Check high weight relationship
        rel1 = result[0]
        assert rel1.relationType == "works_at"
        assert rel1.confidence == 0.95
        mock_gemini.classify_relationship.assert_called_once()

        # Check low weight relationship (unchanged)
        rel2 = result[1]
        assert rel2.relationType == "related_to"
        assert rel2.confidence == 0.5

    def test_classify_relationships_with_llm_failure_handling(self, classifier, mock_gemini):
        relationships = [
            ExtractedRelationship(
                sourceEntity="Elon Musk",
                targetEntity="Tesla",
                type="cooccurrence",
                relationType="related_to",
                weight=0.8,
                confidence=0.7,
                examples=["Elon Musk is the CEO of Tesla."]
            )
        ]

        # Mock exception
        mock_gemini.classify_relationship.side_effect = Exception("API Error")

        # Execute
        result = classifier.classify_relationships_with_llm(relationships, mock_gemini)

        # Verify it didn't crash and kept original values
        assert len(result) == 1
        assert result[0].relationType == "related_to"
