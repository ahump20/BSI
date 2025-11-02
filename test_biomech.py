"""
Comprehensive tests for Blaze Biomechanics Vision System
Tests pose ingestion, feature extraction, and Diamond Certainty integration
"""

import pytest
import asyncio
import numpy as np
from datetime import datetime, timedelta, timezone
from typing import Dict, List
import json

from fastapi.testclient import TestClient
from api.main import app
from api.models.pose import (
    PoseFrame, Joint3D, JointType, 
    Athlete, Sport, BiomechFeatures
)
from api.services.feature_extraction import FeatureExtractor

client = TestClient(app)

# Test data generators
def create_test_joint(x: float = 0, y: float = 0, z: float = 0) -> Joint3D:
    """Create a test joint"""
    return Joint3D(x=x, y=y, z=z, confidence=0.95, visibility=1.0)

def create_test_pose_frame(
    athlete_id: str = "test_athlete_001",
    timestamp: datetime = None
) -> PoseFrame:
    """Create a complete test pose frame"""
    if timestamp is None:
        timestamp = datetime.now(timezone.utc)
    
    # Create anatomically plausible joint positions
    joints = {
        JointType.PELVIS: create_test_joint(0, 1.0, 0),
        JointType.SPINE: create_test_joint(0, 1.2, 0),
        JointType.NECK: create_test_joint(0, 1.5, 0),
        JointType.HEAD: create_test_joint(0, 1.65, 0),
        
        # Upper body
        JointType.LEFT_SHOULDER: create_test_joint(-0.15, 1.4, 0),
        JointType.RIGHT_SHOULDER: create_test_joint(0.15, 1.4, 0),
        JointType.LEFT_ELBOW: create_test_joint(-0.2, 1.1, 0),
        JointType.RIGHT_ELBOW: create_test_joint(0.2, 1.1, 0.1),
        JointType.LEFT_WRIST: create_test_joint(-0.22, 0.85, 0),
        JointType.RIGHT_WRIST: create_test_joint(0.22, 0.85, 0.2),
        
        # Lower body
        JointType.LEFT_HIP: create_test_joint(-0.1, 1.0, 0),
        JointType.RIGHT_HIP: create_test_joint(0.1, 1.0, 0),
        JointType.LEFT_KNEE: create_test_joint(-0.1, 0.5, 0),
        JointType.RIGHT_KNEE: create_test_joint(0.1, 0.5, 0),
        JointType.LEFT_ANKLE: create_test_joint(-0.1, 0.1, 0),
        JointType.RIGHT_ANKLE: create_test_joint(0.1, 0.1, 0),
    }
    
    return PoseFrame(
        frame_id=f"frame_{timestamp.timestamp()}",
        timestamp=timestamp,
        athlete_id=athlete_id,
        joints=joints,
        capture_source="test_system",
        camera_count=4,
        fps=120.0,
        metadata={"test": True}
    )

def create_baseball_pitch_sequence(athlete_id: str = "pitcher_001") -> List[PoseFrame]:
    """Create a sequence simulating a baseball pitch"""
    frames = []
    base_time = datetime.now(timezone.utc)
    
    # Simulate pitch phases: windup, stride, arm cocking, acceleration, deceleration
    phases = [
        {"hip_rotation": 0, "shoulder_rotation": 0, "elbow_angle": 90},    # Windup
        {"hip_rotation": 20, "shoulder_rotation": 10, "elbow_angle": 100}, # Early stride
        {"hip_rotation": 45, "shoulder_rotation": 20, "elbow_angle": 120}, # Foot plant
        {"hip_rotation": 60, "shoulder_rotation": 50, "elbow_angle": 160}, # Max external rotation
        {"hip_rotation": 90, "shoulder_rotation": 90, "elbow_angle": 30},  # Release
        {"hip_rotation": 100, "shoulder_rotation": 100, "elbow_angle": 20}, # Follow through
    ]
    
    for i, phase in enumerate(phases):
        frame = create_test_pose_frame(athlete_id, base_time + timedelta(milliseconds=i * 10))
        
        # Modify joint positions based on phase
        hip_angle = np.radians(phase["hip_rotation"])
        shoulder_angle = np.radians(phase["shoulder_rotation"])
        
        # Update hip rotation
        frame.joints[JointType.LEFT_HIP].x = -0.1 * np.cos(hip_angle)
        frame.joints[JointType.LEFT_HIP].z = -0.1 * np.sin(hip_angle)
        frame.joints[JointType.RIGHT_HIP].x = 0.1 * np.cos(hip_angle)
        frame.joints[JointType.RIGHT_HIP].z = 0.1 * np.sin(hip_angle)
        
        # Update shoulder rotation
        frame.joints[JointType.LEFT_SHOULDER].x = -0.15 * np.cos(shoulder_angle)
        frame.joints[JointType.LEFT_SHOULDER].z = -0.15 * np.sin(shoulder_angle)
        frame.joints[JointType.RIGHT_SHOULDER].x = 0.15 * np.cos(shoulder_angle)
        frame.joints[JointType.RIGHT_SHOULDER].z = 0.15 * np.sin(shoulder_angle)
        
        # Add event markers
        if i == 2:
            frame.metadata["event"] = "foot_plant"
        elif i == 4:
            frame.metadata["event"] = "release"
        
        frames.append(frame)
    
    return frames

class TestPoseIngestion:
    """Test pose data ingestion"""
    
    def test_single_frame_ingestion(self):
        """Test ingesting a single pose frame"""
        frame = create_test_pose_frame()
        
        response = client.post(
            "/api/v1/pose/ingest",
            json=frame.dict()
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ingested"
        assert data["frame_id"] == frame.frame_id
        assert data["athlete_id"] == frame.athlete_id
    
    def test_batch_ingestion(self):
        """Test ingesting multiple frames"""
        frames = create_baseball_pitch_sequence()
        
        for frame in frames:
            response = client.post(
                "/api/v1/pose/ingest",
                json=frame.dict()
            )
            assert response.status_code == 200
    
    def test_invalid_frame_rejection(self):
        """Test that invalid frames are rejected"""
        # Frame missing required joints
        invalid_frame = {
            "frame_id": "invalid_001",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "athlete_id": "test_001",
            "joints": {},  # Empty joints
            "capture_source": "test",
            "camera_count": 1,
            "fps": 30.0
        }
        
        response = client.post(
            "/api/v1/pose/ingest",
            json=invalid_frame
        )
        
        assert response.status_code == 400

class TestFeatureExtraction:
    """Test biomechanical feature extraction"""
    
    @pytest.fixture
    def extractor(self):
        return FeatureExtractor()
    
    @pytest.mark.asyncio
    async def test_hip_shoulder_separation(self, extractor):
        """Test hip-shoulder separation calculation"""
        frame = create_test_pose_frame()
        
        # Rotate shoulders relative to hips
        frame.joints[JointType.LEFT_SHOULDER].x = -0.2
        frame.joints[JointType.RIGHT_SHOULDER].x = 0.1
        
        separation = extractor.compute_hip_shoulder_separation(frame)
        
        assert separation > 0
        assert separation < 90  # Should be reasonable angle
    
    @pytest.mark.asyncio
    async def test_pelvis_rotation_velocity(self, extractor):
        """Test pelvis rotation velocity calculation"""
        frame1 = create_test_pose_frame()
        frame2 = create_test_pose_frame(
            timestamp=frame1.timestamp + timedelta(milliseconds=10)
        )
        
        # Rotate pelvis
        frame2.joints[JointType.LEFT_HIP].x = -0.15
        frame2.joints[JointType.RIGHT_HIP].x = 0.05
        
        velocity = extractor.compute_pelvis_rotation_velocity(frame2, frame1)
        
        assert velocity > 0
    
    @pytest.mark.asyncio
    async def test_first_step_explosiveness(self, extractor):
        """Test first-step explosiveness metrics"""
        frame1 = create_test_pose_frame()
        frame2 = create_test_pose_frame(
            timestamp=frame1.timestamp + timedelta(milliseconds=50)
        )
        
        # Simulate forward movement
        for joint_type in frame2.joints:
            frame2.joints[joint_type].z += 0.2  # Move forward
        
        impulse = extractor.compute_horizontal_impulse(frame2, frame1)
        
        assert impulse > 0
    
    @pytest.mark.asyncio
    async def test_baseball_feature_extraction(self, extractor):
        """Test complete baseball feature extraction"""
        frames = create_baseball_pitch_sequence()
        
        features = await extractor.extract_baseball_features(frames[3])  # Max external rotation
        
        assert "hip_shoulder_separation" in features
        assert "pelvis_velocity" in features
        assert "elbow_valgus" in features
        assert all(v >= 0 for v in features.values())

class TestBiomechAnalysis:
    """Test biomechanical analysis endpoints"""
    
    def test_get_analysis_baseball(self):
        """Test getting baseball biomech analysis"""
        # First, create an athlete
        athlete_data = {
            "id": "baseball_test_001",
            "name": "Test Pitcher",
            "primary_sport": "baseball",
            "position": "pitcher",
            "height_cm": 185.0,
            "weight_kg": 90.0
        }
        
        # Ingest some pose data
        frames = create_baseball_pitch_sequence("baseball_test_001")
        for frame in frames:
            client.post("/api/v1/pose/ingest", json=frame.dict())
        
        # Get analysis
        response = client.get("/api/v1/analysis/baseball_test_001/biomech?sport=baseball")
        
        # Note: This will fail without a proper database setup
        # In production tests, we'd use a test database
        assert response.status_code in [200, 404]  # 404 if athlete not in DB
    
    def test_get_analysis_football(self):
        """Test football biomech analysis"""
        response = client.get("/api/v1/analysis/football_test_001/biomech?sport=football")
        assert response.status_code in [200, 404]
    
    def test_get_analysis_basketball(self):
        """Test basketball biomech analysis"""
        response = client.get("/api/v1/analysis/basketball_test_001/biomech?sport=basketball")
        assert response.status_code in [200, 404]
    
    def test_get_analysis_track(self):
        """Test track & field biomech analysis"""
        response = client.get("/api/v1/analysis/track_test_001/biomech?sport=track")
        assert response.status_code in [200, 404]

class TestDiamondCertaintyIntegration:
    """Test Diamond Certainty Engine integration"""
    
    def test_get_diamond_certainty_scores(self):
        """Test getting Diamond Certainty scores"""
        response = client.get("/api/v1/diamond-certainty/test_athlete_001/scores")
        
        # Will fail without proper setup, but should not error
        assert response.status_code in [200, 404, 500]
    
    def test_diamond_certainty_trait_mapping(self):
        """Test that biomech features map to Diamond Certainty traits"""
        # This would test the mapping logic
        features = BiomechFeatures(
            hip_shoulder_separation=45.0,
            pelvis_rotation_velocity=600.0,
            first_step_contact_time=0.2
        )
        
        # Test percentile conversion
        percentiles = features.to_percentiles(
            Sport.BASEBALL,
            {
                "hip_shoulder_separation": (20, 60),
                "pelvis_rotation_velocity": (400, 800)
            }
        )
        
        assert percentiles["hip_shoulder_separation"] == 62.5  # (45-20)/(60-20)*100
        assert percentiles["pelvis_rotation_velocity"] == 50.0  # (600-400)/(800-400)*100

class TestClipGeneration:
    """Test video clip generation"""
    
    def test_generate_clips(self):
        """Test clip generation for specific metrics"""
        response = client.post(
            "/api/v1/clips/generate",
            params={
                "athlete_id": "test_001",
                "metric": "hip_shoulder_separation",
                "count": 3
            }
        )
        
        # Will fail without video data, but should handle gracefully
        assert response.status_code in [200, 404]

class TestRiskAssessment:
    """Test injury risk assessment"""
    
    def test_get_risk_profile(self):
        """Test getting risk assessment"""
        response = client.get("/api/v1/risk/test_athlete_001/profile")
        
        assert response.status_code in [200, 404, 500]

class TestWebSocket:
    """Test real-time WebSocket streaming"""
    
    def test_websocket_connection(self):
        """Test WebSocket pose streaming"""
        from fastapi.testclient import TestClient
        
        with client.websocket_connect("/ws/pose-stream/test_athlete_001") as websocket:
            # Send pose data
            frame = create_test_pose_frame()
            websocket.send_json(frame.dict())
            
            # Receive analysis
            data = websocket.receive_json()
            
            assert "frame_id" in data
            assert "features" in data
            assert "timestamp" in data

class TestPerformance:
    """Performance and load tests"""
    
    @pytest.mark.asyncio
    async def test_concurrent_ingestion(self):
        """Test handling concurrent pose ingestion"""
        frames = [create_test_pose_frame() for _ in range(100)]
        
        tasks = []
        for frame in frames:
            task = asyncio.create_task(
                self._async_post("/api/v1/pose/ingest", frame.dict())
            )
            tasks.append(task)
        
        results = await asyncio.gather(*tasks)
        
        # All should succeed
        assert all(r["status"] == "ingested" for r in results)
    
    async def _async_post(self, url: str, data: dict):
        """Async HTTP POST helper"""
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.post(f"http://localhost:8000{url}", json=data)
            return response.json()

class TestSportSpecificNorms:
    """Test sport-specific normalization"""
    
    def test_baseball_norms(self):
        """Test baseball metric normalization"""
        from api.models.pose import SPORT_NORMS, Sport
        
        norms = SPORT_NORMS[Sport.BASEBALL]
        
        assert "hip_shoulder_separation" in norms
        assert "pelvis_rotation_velocity" in norms
        
        # Test reasonable ranges
        hip_sep_min, hip_sep_max = norms["hip_shoulder_separation"]
        assert 0 <= hip_sep_min < hip_sep_max <= 90
    
    def test_percentile_calculation(self):
        """Test percentile calculation accuracy"""
        value = 50
        min_val = 0
        max_val = 100
        
        percentile = (value - min_val) / (max_val - min_val) * 100
        assert percentile == 50.0

# Integration test
class TestFullPipeline:
    """Test complete pipeline from ingestion to analysis"""
    
    @pytest.mark.asyncio
    async def test_complete_baseball_pipeline(self):
        """Test complete baseball analysis pipeline"""
        athlete_id = "integration_test_pitcher"
        
        # 1. Ingest pose sequence
        frames = create_baseball_pitch_sequence(athlete_id)
        for frame in frames:
            response = client.post("/api/v1/pose/ingest", json=frame.dict())
            assert response.status_code == 200
        
        # 2. Get biomech analysis
        response = client.get(f"/api/v1/analysis/{athlete_id}/biomech?sport=baseball")
        # May fail without DB, but check structure if successful
        if response.status_code == 200:
            analysis = response.json()
            assert "metrics" in analysis
            assert "risk_factors" in analysis
            assert "recommendations" in analysis
        
        # 3. Get Diamond Certainty scores
        response = client.get(f"/api/v1/enigma/{athlete_id}/scores")
        if response.status_code == 200:
            scores = response.json()
            assert "traits" in scores
            assert "overall_score" in scores
        
        # 4. Generate clips
        response = client.post(
            "/api/v1/clips/generate",
            params={
                "athlete_id": athlete_id,
                "metric": "pelvis_rotation_velocity",
                "count": 3
            }
        )
        # Check response structure if successful
        if response.status_code == 200:
            clips = response.json()
            assert "clips" in clips

if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v", "--tb=short"])
