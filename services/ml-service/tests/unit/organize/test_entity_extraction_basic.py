import pytest
from app.features.organize.services.entity_extractor import extract_entities_spacy

class TestEntityExtractorBasic:
    def test_extract_entities_organization(self):
        """Test extraction of organization entities"""
        text_chunks = ["Google released Gemini 1.5 Pro yesterday."]
        doc_id = "test_doc"
        
        entities = extract_entities_spacy(text_chunks, doc_id)
        
        org_entities = [e for e in entities if e.type == "ORGANIZATION"]
        assert len(org_entities) > 0
        assert any("Google" in e.name for e in org_entities)
    
    def test_extract_entities_person(self):
        """Test extraction of person entities"""
        text_chunks = ["Albert Einstein developed the theory of relativity."]
        doc_id = "test_doc"
        
        entities = extract_entities_spacy(text_chunks, doc_id)
        
        person_entities = [e for e in entities if e.type == "PERSON"]
        assert len(person_entities) > 0
        assert any("Einstein" in e.name for e in person_entities)
    
    def test_entities_have_sources(self):
        """Test that all entities have source snippets"""
        text_chunks = ["Microsoft was founded by Bill Gates."]
        doc_id = "test_doc"
        
        entities = extract_entities_spacy(text_chunks, doc_id)
        
        for entity in entities:
            assert len(entity.sources) > 0
            assert entity.sources[0].docId == doc_id
            assert entity.sources[0].chunkIndex == 0
