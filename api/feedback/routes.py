"""
FastAPI Routes for Real-Time AI Feedback System
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from typing import Optional, Dict, List
from pydantic import BaseModel, Field
from datetime import datetime
import json
import asyncio
import uuid

from .feedback_processor import get_feedback_processor, FeedbackProcessor

# Create router
router = APIRouter(prefix="/api/v1/feedback", tags=["feedback"])

# Initialize processor
feedback_processor: Optional[FeedbackProcessor] = None


def get_processor() -> FeedbackProcessor:
    """Get feedback processor instance"""
    global feedback_processor
    if feedback_processor is None:
        feedback_processor = get_feedback_processor(
            enable_audio=True,
            enable_vision=True,
            redis_url="redis://localhost:6379/0"
        )
    return feedback_processor


# ============================================================================
# Request/Response Models
# ============================================================================

class StartSessionRequest(BaseModel):
    user_id: str = Field(..., description="User ID")
    session_type: str = Field(default="practice", description="Session type: practice, live, review, calibration")
    title: Optional[str] = Field(None, description="Session title")
    description: Optional[str] = Field(None, description="Session description")


class StartSessionResponse(BaseModel):
    session_id: str
    user_id: str
    session_type: str
    start_time: float
    message: str = "Session started successfully"


class StopSessionResponse(BaseModel):
    session_id: str
    duration: float
    average_scores: Dict[str, float]
    frames_processed: int
    audio_chunks_processed: int
    message: str = "Session stopped successfully"


class ProcessFrameRequest(BaseModel):
    session_id: str
    frame_data: str  # Base64 encoded image
    timestamp_ms: int
    frame_number: Optional[int] = None


class ProcessAudioRequest(BaseModel):
    session_id: str
    audio_data: str  # Base64 encoded audio
    timestamp_ms: int
    sample_rate: int = 16000


class FeedbackResponse(BaseModel):
    timestamp_ms: int
    session_id: str
    type: str
    scores: Dict[str, float]
    metrics: Dict[str, any]
    suggestions: List[Dict[str, any]]
    trends: Dict[str, float]


# ============================================================================
# HTTP Endpoints
# ============================================================================

@router.post("/sessions/start", response_model=StartSessionResponse)
async def start_session(request: StartSessionRequest):
    """
    Start a new feedback session
    """
    try:
        processor = get_processor()

        # Generate session ID
        session_id = str(uuid.uuid4())

        # Start session
        session_data = await processor.start_session(
            session_id=session_id,
            user_id=request.user_id,
            session_type=request.session_type
        )

        return StartSessionResponse(
            session_id=session_id,
            user_id=request.user_id,
            session_type=request.session_type,
            start_time=session_data['start_time']
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/sessions/{session_id}/stop", response_model=StopSessionResponse)
async def stop_session(session_id: str):
    """
    Stop a feedback session and get summary
    """
    try:
        processor = get_processor()
        summary = await processor.stop_session(session_id)

        return StopSessionResponse(
            session_id=session_id,
            duration=summary['duration'],
            average_scores=summary['average_scores'],
            frames_processed=summary['frames_processed'],
            audio_chunks_processed=summary['audio_chunks_processed']
        )

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/process-frame")
async def process_frame(
    session_id: str = Form(...),
    timestamp_ms: int = Form(...),
    frame_number: Optional[int] = Form(None),
    frame: UploadFile = File(...)
):
    """
    Process a single video frame
    """
    try:
        processor = get_processor()

        # Read frame data
        frame_data = await frame.read()

        # Process frame
        result = await processor.process_frame(
            session_id=session_id,
            frame_data=frame_data,
            timestamp_ms=timestamp_ms,
            frame_number=frame_number
        )

        if result is None:
            return JSONResponse(
                content={"message": "Frame skipped (sampling)"},
                status_code=202
            )

        return JSONResponse(content=result)

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/process-audio")
async def process_audio(
    session_id: str = Form(...),
    timestamp_ms: int = Form(...),
    sample_rate: int = Form(16000),
    audio: UploadFile = File(...)
):
    """
    Process an audio chunk
    """
    try:
        processor = get_processor()

        # Read audio data
        audio_data = await audio.read()

        # Process audio
        result = await processor.process_audio(
            session_id=session_id,
            audio_data=audio_data,
            timestamp_ms=timestamp_ms,
            sample_rate=sample_rate
        )

        return JSONResponse(content=result)

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/generate-feedback", response_model=FeedbackResponse)
async def generate_feedback(
    session_id: str,
    audio_metrics: Optional[Dict] = None,
    vision_metrics: Optional[Dict] = None,
    timestamp_ms: Optional[int] = None
):
    """
    Generate comprehensive feedback from metrics
    """
    try:
        processor = get_processor()

        feedback = await processor.generate_feedback(
            session_id=session_id,
            audio_metrics=audio_metrics,
            vision_metrics=vision_metrics,
            timestamp_ms=timestamp_ms
        )

        return FeedbackResponse(
            timestamp_ms=feedback.timestamp_ms,
            session_id=feedback.session_id,
            type=feedback.type,
            scores=feedback.scores,
            metrics=feedback.metrics,
            suggestions=feedback.suggestions,
            trends=feedback.trends
        )

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# WebSocket Endpoint
# ============================================================================

class ConnectionManager:
    """Manage WebSocket connections"""

    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, session_id: str, websocket: WebSocket):
        """Connect a websocket to a session"""
        await websocket.accept()

        if session_id not in self.active_connections:
            self.active_connections[session_id] = []

        self.active_connections[session_id].append(websocket)

    def disconnect(self, session_id: str, websocket: WebSocket):
        """Disconnect a websocket"""
        if session_id in self.active_connections:
            self.active_connections[session_id].remove(websocket)

            if len(self.active_connections[session_id]) == 0:
                del self.active_connections[session_id]

    async def send_feedback(self, session_id: str, message: dict):
        """Send feedback to all connections for a session"""
        if session_id in self.active_connections:
            disconnected = []

            for connection in self.active_connections[session_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    disconnected.append(connection)

            # Clean up disconnected clients
            for conn in disconnected:
                self.disconnect(session_id, conn)


manager = ConnectionManager()


@router.websocket("/stream/{session_id}")
async def websocket_feedback_stream(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for real-time feedback streaming

    Client sends:
    {
        "type": "frame" | "audio" | "heartbeat",
        "timestamp_ms": 12345,
        "data": "base64_encoded_data"
    }

    Server sends:
    {
        "type": "feedback" | "error" | "ack",
        "timestamp_ms": 12345,
        "scores": {...},
        "metrics": {...},
        "suggestions": [...]
    }
    """
    await manager.connect(session_id, websocket)
    processor = get_processor()

    try:
        # Send connection acknowledgment
        await websocket.send_json({
            "type": "connected",
            "session_id": session_id,
            "message": "WebSocket connection established"
        })

        # Variables to accumulate metrics
        latest_audio_metrics = None
        latest_vision_metrics = None
        last_feedback_time = 0
        feedback_interval_ms = 1000  # Send feedback every 1 second

        while True:
            # Receive message from client
            message = await websocket.receive_text()
            data = json.loads(message)

            msg_type = data.get("type")
            timestamp_ms = data.get("timestamp_ms")

            if msg_type == "heartbeat":
                # Respond to heartbeat
                await websocket.send_json({
                    "type": "ack",
                    "timestamp_ms": timestamp_ms
                })

            elif msg_type == "frame":
                # Process video frame
                import base64
                frame_data = base64.b64decode(data.get("data"))

                vision_result = await processor.process_frame(
                    session_id=session_id,
                    frame_data=frame_data,
                    timestamp_ms=timestamp_ms,
                    frame_number=data.get("frame_number")
                )

                if vision_result:
                    latest_vision_metrics = vision_result

            elif msg_type == "audio":
                # Process audio chunk
                import base64
                audio_data = base64.b64decode(data.get("data"))

                audio_result = await processor.process_audio(
                    session_id=session_id,
                    audio_data=audio_data,
                    timestamp_ms=timestamp_ms,
                    sample_rate=data.get("sample_rate", 16000)
                )

                if audio_result:
                    latest_audio_metrics = audio_result

            # Generate and send feedback at regular intervals
            current_time = timestamp_ms if timestamp_ms else int(asyncio.get_event_loop().time() * 1000)

            if current_time - last_feedback_time >= feedback_interval_ms:
                if latest_audio_metrics or latest_vision_metrics:
                    feedback = await processor.generate_feedback(
                        session_id=session_id,
                        audio_metrics=latest_audio_metrics,
                        vision_metrics=latest_vision_metrics,
                        timestamp_ms=current_time
                    )

                    # Send feedback to client
                    await websocket.send_json({
                        "type": "feedback",
                        "timestamp_ms": feedback.timestamp_ms,
                        "scores": feedback.scores,
                        "metrics": feedback.metrics,
                        "suggestions": feedback.suggestions,
                        "trends": feedback.trends
                    })

                    last_feedback_time = current_time

    except WebSocketDisconnect:
        manager.disconnect(session_id, websocket)
        print(f"WebSocket disconnected for session {session_id}")

    except Exception as e:
        print(f"WebSocket error: {e}")
        try:
            await websocket.send_json({
                "type": "error",
                "message": str(e)
            })
        except:
            pass
        manager.disconnect(session_id, websocket)


# ============================================================================
# Analytics Endpoints
# ============================================================================

@router.get("/sessions/{session_id}")
async def get_session(session_id: str):
    """
    Get session details
    """
    # TODO: Implement database lookup
    return JSONResponse(
        content={"message": "Not implemented yet"},
        status_code=501
    )


@router.get("/sessions")
async def list_sessions(
    user_id: Optional[str] = None,
    session_type: Optional[str] = None,
    limit: int = 50,
    offset: int = 0
):
    """
    List feedback sessions with filters
    """
    # TODO: Implement database lookup
    return JSONResponse(
        content={"message": "Not implemented yet"},
        status_code=501
    )


@router.get("/analytics/{user_id}/trends")
async def get_user_trends(user_id: str, days: int = 30):
    """
    Get user performance trends over time
    """
    # TODO: Implement analytics query
    return JSONResponse(
        content={"message": "Not implemented yet"},
        status_code=501
    )


@router.get("/analytics/{session_id}/summary")
async def get_session_summary(session_id: str):
    """
    Get comprehensive session summary
    """
    # TODO: Implement summary generation
    return JSONResponse(
        content={"message": "Not implemented yet"},
        status_code=501
    )


@router.get("/analytics/{session_id}/timeline")
async def get_session_timeline(session_id: str):
    """
    Get session timeline with score evolution
    """
    # TODO: Implement timeline generation
    return JSONResponse(
        content={"message": "Not implemented yet"},
        status_code=501
    )


# ============================================================================
# Calibration Endpoints
# ============================================================================

@router.post("/calibrate/baseline")
async def calibrate_baseline(user_id: str):
    """
    Establish user baseline from calibration sessions
    """
    # TODO: Implement baseline calculation
    return JSONResponse(
        content={"message": "Not implemented yet"},
        status_code=501
    )


@router.get("/calibrate/status/{user_id}")
async def get_calibration_status(user_id: str):
    """
    Get user calibration status
    """
    # TODO: Implement status lookup
    return JSONResponse(
        content={"message": "Not implemented yet"},
        status_code=501
    )
