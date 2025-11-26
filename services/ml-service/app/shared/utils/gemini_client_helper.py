    def _get_type_specific_suggestions(self, source_type: str, target_type: str) -> List[str]:
        """
        Suggest likely relationship types based on entity type combinations.
        
        Args:
            source_type: Type of source entity (PERSON, ORGANIZATION, etc.)
            target_type: Type of target entity
            
        Returns:
            List of suggested relationship types
        """
        if not source_type or not target_type:
            return []
            
        # Normalize types to uppercase
        src = source_type.upper()
        tgt = target_type.upper()
        
        # Type combination → suggested relationship types
        suggestions_map = {
            ("PERSON", "ORGANIZATION"): ["founded", "works_at", "ceo_of", "leads"],
            ("PERSON", "PERSON"): ["colleague_of", "collaborated_with", "family_of"],
            ("PERSON", "CONCEPT"): ["developed", "researched", "created"],
            ("PERSON", "PAPER"): ["authored", "cited"],
            ("PERSON", "LOCATION"): ["born_in", "lives_in", "works_in"],
            ("PERSON", "DATE"): ["born_on", "died_on"],
            ("ORGANIZATION", "LOCATION"): ["located_in", "headquartered_in", "operates_in"],
            ("ORGANIZATION", "ORGANIZATION"): ["acquired_by", "part_of", "partners_with"],
            ("ORGANIZATION", "CONCEPT"): ["uses", "develops", "specializes_in"],
            ("ORGANIZATION", "DATE"): ["founded", "established_in"],
            ("CONCEPT", "CONCEPT"): ["related_to", "part_of", "precedes"],
            ("PAPER", "CONCEPT"): ["discusses", "proposes"],
        }
        
        # Try both directions
        suggestions = suggestions_map.get((src, tgt), [])
        if not suggestions:
            suggestions = suggestions_map.get((tgt, src), [])
            
        return suggestions
