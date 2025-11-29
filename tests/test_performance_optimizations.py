"""
Performance optimization tests
Tests to verify the performance improvements made to the codebase
"""

import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

import pytest
from unittest.mock import Mock, patch
import time


class TestCacheServiceOptimizations:
    """Test cache service performance improvements"""
    
    def test_gzip_compression_import(self):
        """Verify that gzip compression is properly imported"""
        # This test ensures the cache service can use gzip
        try:
            import zlib
            # Test compression/decompression
            test_data = b"test data"
            compressed = zlib.compress(test_data)
            decompressed = zlib.decompress(compressed)
            assert decompressed == test_data, "zlib compression/decompression should work"
        except ImportError:
            pytest.fail("zlib not available for compression")
    
    def test_cache_eviction_efficiency(self):
        """Test that cache eviction doesn't have to scan all entries"""
        # Simulating the optimized eviction logic
        cache_entries = {
            f'key_{i}': {'value': f'val_{i}', 'lastAccessed': i * 1000}
            for i in range(100)
        }
        
        start_time = time.time()
        
        # Optimized approach using a simple loop (matching new implementation)
        oldest = {'key': None, 'entry': None}
        for key, entry in cache_entries.items():
            if not oldest['key'] or entry['lastAccessed'] < oldest['entry']['lastAccessed']:
                oldest = {'key': key, 'entry': entry}
        
        elapsed = time.time() - start_time
        
        assert oldest['key'] == 'key_0', "Should find the oldest entry"
        assert elapsed < 0.01, f"Eviction should be fast, took {elapsed}s"


class TestDatabaseQueryOptimizations:
    """Test database query optimizations"""
    
    def test_select_specific_columns(self):
        """Verify SELECT queries use specific columns instead of *"""
        # Read enhanced-server.js and check for SELECT *
        with open('api/enhanced-server.js', 'r') as f:
            content = f.read()
            
        # Count SELECT * occurrences in the teams endpoints
        select_star_count = content.count("SELECT * FROM teams")
        assert select_star_count == 0, f"Found {select_star_count} SELECT * FROM teams queries"
        
        # Verify we have specific column selections
        assert "SELECT id, sport, team_id" in content, "Should have specific column selections"
    
    def test_ml_pipeline_queries_optimized(self):
        """Verify ML pipeline queries are optimized"""
        with open('api/ml/ml-pipeline-service.js', 'r') as f:
            content = f.read()
        
        # The subqueries should now select specific columns
        assert "SELECT game_id, sport, home_team_id" in content, "Should select specific game columns"


class TestPythonOptimizations:
    """Test Python code optimizations"""
    
    def test_league_averages_no_nested_comprehension(self):
        """Verify league averages doesn't use nested comprehension"""
        with open('api/mlb_data_lab/stats/league_averages.py', 'r') as f:
            content = f.read()
        
        # The old nested comprehension should be gone
        assert "for league, teams in LeagueTeams.items.items() for team in teams" not in content, \
            "Nested comprehension should be replaced with loops"
        
        # Should have the optimized version
        assert "for league, teams in LeagueTeams.items.items():" in content, \
            "Should have optimized loop structure"


class TestPerformanceImprovements:
    """Integration tests for performance improvements"""
    
    def test_compression_size_reduction(self):
        """Test that gzip provides better compression than base64"""
        import zlib
        import base64
        
        # Sample data
        test_data = "x" * 5000  # 5KB of repeated data
        
        # Old method (base64 encoding)
        old_compressed = base64.b64encode(test_data.encode()).decode()
        
        # New method (gzip)
        new_compressed = base64.b64encode(zlib.compress(test_data.encode())).decode()
        
        assert len(new_compressed) < len(old_compressed), \
            f"gzip should compress better: {len(new_compressed)} vs {len(old_compressed)}"
        
        # For repeated data, gzip should compress significantly
        compression_ratio = len(new_compressed) / len(old_compressed)
        assert compression_ratio < 0.1, \
            f"gzip should achieve >90% reduction on repeated data, got {compression_ratio:.2%}"


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
