"""
Real-Time Vision Analysis Engine for Communication Feedback

Capabilities:
- Facial expression analysis (7 emotions + micro-expressions)
- Body language analysis (posture, gestures)
- Eye contact tracking (gaze direction)
- Professional presence assessment
- Energy level estimation
- Engagement markers
"""

import cv2
import numpy as np
import mediapipe as mp
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
from scipy.spatial import distance
from collections import deque
import time

# MediaPipe solutions
mp_face_mesh = mp.solutions.face_mesh
mp_pose = mp.solutions.pose
mp_hands = mp.solutions.hands
mp_drawing = mp.solutions.drawing_utils
mp_drawing_styles = mp.solutions.drawing_styles


@dataclass
class FacialMetrics:
    """Facial expression and micro-expression analysis"""
    dominant_emotion: str
    emotion_confidence: float
    emotion_scores: Dict[str, float]
    micro_expressions: List[Dict[str, any]]
    eye_contact: float  # 0-100 score
    gaze_direction: Dict[str, float]
    blink_rate: float  # per minute
    smile_genuineness: float  # 0-1 (Duchenne marker)
    eyebrow_position: str  # 'raised', 'neutral', 'furrowed'
    mouth_openness: float  # 0-1
    head_pose: Dict[str, float]  # pitch, yaw, roll


@dataclass
class BodyMetrics:
    """Body language and posture analysis"""
    posture: str  # 'open', 'closed', 'neutral'
    posture_confidence: float
    gesture_count: int
    gestures: List[Dict[str, any]]
    fidgeting_level: float  # 0-100
    energy_level: float  # 0-100
    head_tilt: float  # degrees
    shoulder_tension: float  # 0-100
    lean_in: float  # -1 (back) to 1 (forward)
    centering: float  # 0-1 (how centered in frame)
    symmetry: float  # 0-1 (body symmetry)
    hand_positions: Dict[str, Dict[str, float]]


@dataclass
class ProfessionalPresenceMetrics:
    """Professional presence indicators"""
    frame_positioning: float  # 0-100
    lighting_quality: float  # 0-100
    background_appropriateness: float  # 0-100
    attire_professionalism: float  # 0-100
    overall_polish: float  # 0-100


@dataclass
class VisionAnalysisResult:
    """Complete vision analysis result"""
    facial: FacialMetrics
    body: BodyMetrics
    professional: ProfessionalPresenceMetrics
    frame_number: int
    timestamp_ms: int
    processing_time_ms: float
    has_face: bool
    has_body: bool


class VisionAnalyzer:
    """
    Real-time vision analysis for communication feedback
    Uses MediaPipe for landmark detection and custom algorithms for interpretation
    """

    def __init__(
        self,
        enable_face: bool = True,
        enable_pose: bool = True,
        enable_hands: bool = True,
        min_detection_confidence: float = 0.5,
        min_tracking_confidence: float = 0.5
    ):
        self.enable_face = enable_face
        self.enable_pose = enable_pose
        self.enable_hands = enable_hands

        # Initialize MediaPipe
        self.face_mesh = mp_face_mesh.FaceMesh(
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence
        ) if enable_face else None

        self.pose = mp_pose.Pose(
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence,
            model_complexity=1
        ) if enable_pose else None

        self.hands = mp_hands.Hands(
            max_num_hands=2,
            min_detection_confidence=min_detection_confidence,
            min_tracking_confidence=min_tracking_confidence
        ) if enable_hands else None

        # Tracking state
        self.blink_history = deque(maxlen=300)  # 10 seconds at 30fps
        self.emotion_history = deque(maxlen=30)  # 1 second at 30fps
        self.gesture_history = deque(maxlen=90)  # 3 seconds at 30fps
        self.last_hand_positions = None

        # Facial Action Unit (AU) baselines for emotion detection
        self.emotion_au_patterns = {
            'happy': {'AU6': 1, 'AU12': 1},  # Cheek raiser, lip corner puller
            'sad': {'AU1': 1, 'AU4': 1, 'AU15': 1},  # Inner brow raiser, brow lowerer, lip corner depressor
            'angry': {'AU4': 1, 'AU5': 1, 'AU7': 1, 'AU23': 1},  # Brow lowerer, upper lid raiser, lid tightener
            'fearful': {'AU1': 1, 'AU2': 1, 'AU5': 1, 'AU20': 1, 'AU26': 1},  # Brow raisers, lip stretch, jaw drop
            'surprised': {'AU1': 1, 'AU2': 1, 'AU5': 1, 'AU26': 1},  # Brow raisers, upper lid raiser, jaw drop
            'disgusted': {'AU9': 1, 'AU15': 1, 'AU17': 1},  # Nose wrinkler, lip corner depressor, chin raiser
            'neutral': {}
        }

    def analyze(
        self,
        frame: np.ndarray,
        frame_number: int,
        timestamp_ms: int
    ) -> VisionAnalysisResult:
        """
        Analyze a video frame for facial expressions, body language, and professional presence

        Args:
            frame: BGR image frame from OpenCV
            frame_number: Frame sequence number
            timestamp_ms: Timestamp of this frame

        Returns:
            VisionAnalysisResult with all metrics
        """
        start_time = time.time()

        # Convert BGR to RGB for MediaPipe
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)

        # Process with MediaPipe
        face_results = self.face_mesh.process(rgb_frame) if self.enable_face else None
        pose_results = self.pose.process(rgb_frame) if self.enable_pose else None
        hand_results = self.hands.process(rgb_frame) if self.enable_hands else None

        # Check if face and body are detected
        has_face = face_results is not None and face_results.multi_face_landmarks is not None
        has_body = pose_results is not None and pose_results.pose_landmarks is not None

        # Analyze facial expressions
        facial = self._analyze_facial(face_results, frame.shape) if has_face else self._empty_facial_metrics()

        # Analyze body language
        body = self._analyze_body(pose_results, hand_results, frame.shape) if has_body else self._empty_body_metrics()

        # Analyze professional presence
        professional = self._analyze_professional_presence(frame, has_face, has_body)

        processing_time = (time.time() - start_time) * 1000

        return VisionAnalysisResult(
            facial=facial,
            body=body,
            professional=professional,
            frame_number=frame_number,
            timestamp_ms=timestamp_ms,
            processing_time_ms=processing_time,
            has_face=has_face,
            has_body=has_body
        )

    def _analyze_facial(self, face_results, frame_shape) -> FacialMetrics:
        """Analyze facial expressions and micro-expressions"""
        landmarks = face_results.multi_face_landmarks[0]
        h, w, _ = frame_shape

        # Convert normalized landmarks to pixel coordinates
        face_landmarks = [(lm.x * w, lm.y * h, lm.z) for lm in landmarks.landmark]

        # Detect Action Units (simplified)
        action_units = self._detect_action_units(face_landmarks)

        # Classify emotion from AUs
        emotion_scores = self._classify_emotion_from_aus(action_units)
        dominant_emotion = max(emotion_scores, key=emotion_scores.get)
        emotion_confidence = emotion_scores[dominant_emotion]

        # Detect micro-expressions (rapid emotion changes)
        micro_expressions = self._detect_micro_expressions(emotion_scores)

        # Eye contact analysis
        eye_contact, gaze_direction = self._analyze_eye_contact(face_landmarks)

        # Blink detection
        blink_detected = self._detect_blink(face_landmarks)
        self.blink_history.append(1 if blink_detected else 0)
        blink_rate = sum(self.blink_history) / (len(self.blink_history) / 30) * 60  # per minute

        # Smile genuineness (Duchenne marker - cheek raises with smile)
        smile_genuineness = self._calculate_duchenne_smile(action_units)

        # Eyebrow position
        eyebrow_position = self._classify_eyebrow_position(action_units)

        # Mouth openness
        mouth_openness = self._calculate_mouth_openness(face_landmarks)

        # Head pose estimation
        head_pose = self._estimate_head_pose(face_landmarks, frame_shape)

        return FacialMetrics(
            dominant_emotion=dominant_emotion,
            emotion_confidence=emotion_confidence,
            emotion_scores=emotion_scores,
            micro_expressions=micro_expressions,
            eye_contact=eye_contact,
            gaze_direction=gaze_direction,
            blink_rate=blink_rate,
            smile_genuineness=smile_genuineness,
            eyebrow_position=eyebrow_position,
            mouth_openness=mouth_openness,
            head_pose=head_pose
        )

    def _detect_action_units(self, landmarks: List[Tuple[float, float, float]]) -> Dict[str, float]:
        """
        Detect Facial Action Units (simplified)
        AU1: Inner Brow Raiser
        AU2: Outer Brow Raiser
        AU4: Brow Lowerer
        AU5: Upper Lid Raiser
        AU6: Cheek Raiser
        AU7: Lid Tightener
        AU9: Nose Wrinkler
        AU12: Lip Corner Puller
        AU15: Lip Corner Depressor
        AU17: Chin Raiser
        AU20: Lip Stretcher
        AU23: Lip Tightener
        AU26: Jaw Drop
        """
        aus = {}

        # Landmark indices (MediaPipe Face Mesh)
        LEFT_EYE_TOP = 159
        LEFT_EYE_BOTTOM = 145
        RIGHT_EYE_TOP = 386
        RIGHT_EYE_BOTTOM = 374

        LEFT_BROW_INNER = 52
        LEFT_BROW_OUTER = 70
        RIGHT_BROW_INNER = 282
        RIGHT_BROW_OUTER = 300

        LEFT_MOUTH_CORNER = 61
        RIGHT_MOUTH_CORNER = 291
        UPPER_LIP = 13
        LOWER_LIP = 14

        NOSE_TIP = 1
        CHIN = 152

        # AU1, AU2: Brow raisers
        left_brow_height = landmarks[LEFT_BROW_INNER][1] - landmarks[LEFT_EYE_TOP][1]
        right_brow_height = landmarks[RIGHT_BROW_INNER][1] - landmarks[RIGHT_EYE_TOP][1]
        aus['AU1'] = float(max(0, min(1, abs(left_brow_height) / 30)))
        aus['AU2'] = float(max(0, min(1, abs(right_brow_height) / 30)))

        # AU4: Brow lowerer (negative brow height)
        aus['AU4'] = float(max(0, min(1, -left_brow_height / 20)))

        # AU5: Upper lid raiser
        left_eye_openness = abs(landmarks[LEFT_EYE_TOP][1] - landmarks[LEFT_EYE_BOTTOM][1])
        right_eye_openness = abs(landmarks[RIGHT_EYE_TOP][1] - landmarks[RIGHT_EYE_BOTTOM][1])
        aus['AU5'] = float(max(0, min(1, (left_eye_openness + right_eye_openness) / 40)))

        # AU12: Lip corner puller (smile)
        lip_width = abs(landmarks[LEFT_MOUTH_CORNER][0] - landmarks[RIGHT_MOUTH_CORNER][0])
        aus['AU12'] = float(max(0, min(1, lip_width / 100)))

        # AU15: Lip corner depressor (frown)
        mouth_corner_height = (landmarks[LEFT_MOUTH_CORNER][1] + landmarks[RIGHT_MOUTH_CORNER][1]) / 2
        aus['AU15'] = float(max(0, min(1, mouth_corner_height / 50)))

        # AU26: Jaw drop
        mouth_openness = abs(landmarks[UPPER_LIP][1] - landmarks[LOWER_LIP][1])
        aus['AU26'] = float(max(0, min(1, mouth_openness / 40)))

        return aus

    def _classify_emotion_from_aus(self, action_units: Dict[str, float]) -> Dict[str, float]:
        """Classify emotion from detected Action Units"""
        emotion_scores = {}

        for emotion, au_pattern in self.emotion_au_patterns.items():
            if not au_pattern:
                # Neutral - low activation of all AUs
                score = 1.0 - sum(action_units.values()) / len(action_units)
            else:
                # Calculate match score
                score = sum(action_units.get(au, 0) for au in au_pattern) / len(au_pattern)

            emotion_scores[emotion] = float(max(0, min(1, score)))

        # Normalize scores
        total = sum(emotion_scores.values())
        if total > 0:
            emotion_scores = {k: v / total for k, v in emotion_scores.items()}

        return emotion_scores

    def _detect_micro_expressions(self, current_emotions: Dict[str, float]) -> List[Dict[str, any]]:
        """
        Detect micro-expressions (brief involuntary facial expressions)
        Micro-expressions last 1/25 to 1/5 of a second
        """
        self.emotion_history.append(current_emotions.copy())

        micro_expressions = []

        if len(self.emotion_history) < 10:
            return micro_expressions

        # Look for rapid emotion changes
        recent_emotions = list(self.emotion_history)[-10:]

        for emotion in current_emotions.keys():
            values = [e[emotion] for e in recent_emotions]

            # Detect spike (sudden increase then decrease)
            if len(values) >= 5:
                mid = len(values) // 2
                before_avg = np.mean(values[:mid])
                peak = values[mid]
                after_avg = np.mean(values[mid+1:])

                if peak > before_avg + 0.3 and peak > after_avg + 0.3 and peak > 0.5:
                    micro_expressions.append({
                        'emotion': emotion,
                        'intensity': float(peak),
                        'duration_ms': 200  # Approximate
                    })

        return micro_expressions

    def _analyze_eye_contact(self, landmarks: List[Tuple[float, float, float]]) -> Tuple[float, Dict[str, float]]:
        """
        Analyze eye contact and gaze direction
        """
        # Iris landmarks (468-landmark model)
        LEFT_IRIS = 468
        RIGHT_IRIS = 473

        LEFT_EYE_LEFT = 33
        LEFT_EYE_RIGHT = 133
        RIGHT_EYE_LEFT = 362
        RIGHT_EYE_RIGHT = 263

        # Calculate iris position relative to eye corners
        left_iris_x = landmarks[LEFT_IRIS][0] if LEFT_IRIS < len(landmarks) else landmarks[LEFT_EYE_LEFT][0]
        left_eye_center_x = (landmarks[LEFT_EYE_LEFT][0] + landmarks[LEFT_EYE_RIGHT][0]) / 2

        right_iris_x = landmarks[RIGHT_IRIS][0] if RIGHT_IRIS < len(landmarks) else landmarks[RIGHT_EYE_LEFT][0]
        right_eye_center_x = (landmarks[RIGHT_EYE_LEFT][0] + landmarks[RIGHT_EYE_RIGHT][0]) / 2

        # Gaze direction (-1 left, 0 center, 1 right)
        left_gaze = (left_iris_x - left_eye_center_x) / 20
        right_gaze = (right_iris_x - right_eye_center_x) / 20
        gaze_x = float((left_gaze + right_gaze) / 2)

        # Vertical gaze (simplified)
        gaze_y = 0.0  # Would need more landmarks for accurate vertical gaze

        # Eye contact score (0-100)
        # Good eye contact = looking near center
        eye_contact_score = float(100 * (1.0 - min(abs(gaze_x), 1.0)))

        gaze_direction = {
            'x': gaze_x,
            'y': gaze_y
        }

        return eye_contact_score, gaze_direction

    def _detect_blink(self, landmarks: List[Tuple[float, float, float]]) -> bool:
        """Detect if eyes are blinking"""
        LEFT_EYE_TOP = 159
        LEFT_EYE_BOTTOM = 145
        RIGHT_EYE_TOP = 386
        RIGHT_EYE_BOTTOM = 374

        left_eye_height = abs(landmarks[LEFT_EYE_TOP][1] - landmarks[LEFT_EYE_BOTTOM][1])
        right_eye_height = abs(landmarks[RIGHT_EYE_TOP][1] - landmarks[RIGHT_EYE_BOTTOM][1])

        # Eye aspect ratio threshold
        EYE_CLOSED_THRESHOLD = 8

        return left_eye_height < EYE_CLOSED_THRESHOLD or right_eye_height < EYE_CLOSED_THRESHOLD

    def _calculate_duchenne_smile(self, action_units: Dict[str, float]) -> float:
        """
        Calculate genuineness of smile using Duchenne marker
        Genuine smile = AU12 (lip corner puller) + AU6 (cheek raiser)
        """
        lip_puller = action_units.get('AU12', 0)
        cheek_raiser = action_units.get('AU6', 0.5)  # Approximate from brow position

        # Genuine smile has both
        if lip_puller > 0.5:
            genuineness = (lip_puller + cheek_raiser) / 2
        else:
            genuineness = 0.0

        return float(min(genuineness, 1.0))

    def _classify_eyebrow_position(self, action_units: Dict[str, float]) -> str:
        """Classify eyebrow position"""
        raised_score = action_units.get('AU1', 0) + action_units.get('AU2', 0)
        lowered_score = action_units.get('AU4', 0)

        if raised_score > 0.5:
            return 'raised'
        elif lowered_score > 0.5:
            return 'furrowed'
        else:
            return 'neutral'

    def _calculate_mouth_openness(self, landmarks: List[Tuple[float, float, float]]) -> float:
        """Calculate mouth openness (0-1)"""
        UPPER_LIP = 13
        LOWER_LIP = 14

        mouth_height = abs(landmarks[UPPER_LIP][1] - landmarks[LOWER_LIP][1])
        return float(min(mouth_height / 40, 1.0))

    def _estimate_head_pose(self, landmarks: List[Tuple[float, float, float]], frame_shape) -> Dict[str, float]:
        """
        Estimate head pose (pitch, yaw, roll) using PnP algorithm
        """
        h, w, _ = frame_shape

        # 3D model points (generic face model)
        model_points = np.array([
            (0.0, 0.0, 0.0),  # Nose tip
            (0.0, -330.0, -65.0),  # Chin
            (-225.0, 170.0, -135.0),  # Left eye left corner
            (225.0, 170.0, -135.0),  # Right eye right corner
            (-150.0, -150.0, -125.0),  # Left mouth corner
            (150.0, -150.0, -125.0)  # Right mouth corner
        ], dtype=np.float64)

        # 2D image points from landmarks
        NOSE_TIP = 1
        CHIN = 152
        LEFT_EYE_CORNER = 33
        RIGHT_EYE_CORNER = 263
        LEFT_MOUTH = 61
        RIGHT_MOUTH = 291

        image_points = np.array([
            landmarks[NOSE_TIP][:2],
            landmarks[CHIN][:2],
            landmarks[LEFT_EYE_CORNER][:2],
            landmarks[RIGHT_EYE_CORNER][:2],
            landmarks[LEFT_MOUTH][:2],
            landmarks[RIGHT_MOUTH][:2]
        ], dtype=np.float64)

        # Camera internals
        focal_length = w
        center = (w / 2, h / 2)
        camera_matrix = np.array([
            [focal_length, 0, center[0]],
            [0, focal_length, center[1]],
            [0, 0, 1]
        ], dtype=np.float64)

        dist_coeffs = np.zeros((4, 1))  # Assuming no lens distortion

        # Solve PnP
        try:
            success, rotation_vector, translation_vector = cv2.solvePnP(
                model_points,
                image_points,
                camera_matrix,
                dist_coeffs,
                flags=cv2.SOLVEPNP_ITERATIVE
            )

            if success:
                # Convert rotation vector to Euler angles
                rotation_matrix, _ = cv2.Rodrigues(rotation_vector)
                pose_matrix = cv2.hconcat((rotation_matrix, translation_vector))
                _, _, _, _, _, _, euler_angles = cv2.decomposeProjectionMatrix(pose_matrix)

                pitch = float(euler_angles[0][0])
                yaw = float(euler_angles[1][0])
                roll = float(euler_angles[2][0])
            else:
                pitch, yaw, roll = 0.0, 0.0, 0.0
        except:
            pitch, yaw, roll = 0.0, 0.0, 0.0

        return {
            'pitch': pitch,
            'yaw': yaw,
            'roll': roll
        }

    def _analyze_body(self, pose_results, hand_results, frame_shape) -> BodyMetrics:
        """Analyze body language and posture"""
        landmarks = pose_results.pose_landmarks.landmark
        h, w, _ = frame_shape

        # Convert to pixel coordinates
        body_landmarks = [(lm.x * w, lm.y * h, lm.z, lm.visibility) for lm in landmarks]

        # Posture classification
        posture, posture_confidence = self._classify_posture(body_landmarks)

        # Gesture detection
        if hand_results and hand_results.multi_hand_landmarks:
            gestures, gesture_count = self._detect_gestures(hand_results, body_landmarks)
        else:
            gestures, gesture_count = [], 0

        # Fidgeting detection
        fidgeting_level = self._detect_fidgeting(body_landmarks)

        # Energy level estimation
        energy_level = self._estimate_energy_level(body_landmarks)

        # Head tilt
        head_tilt = self._calculate_head_tilt(body_landmarks)

        # Shoulder tension
        shoulder_tension = self._calculate_shoulder_tension(body_landmarks)

        # Lean in/out
        lean_in = self._calculate_lean(body_landmarks)

        # Frame centering
        centering = self._calculate_centering(body_landmarks, frame_shape)

        # Body symmetry
        symmetry = self._calculate_symmetry(body_landmarks)

        # Hand positions
        hand_positions = self._get_hand_positions(body_landmarks)

        return BodyMetrics(
            posture=posture,
            posture_confidence=posture_confidence,
            gesture_count=gesture_count,
            gestures=gestures,
            fidgeting_level=fidgeting_level,
            energy_level=energy_level,
            head_tilt=head_tilt,
            shoulder_tension=shoulder_tension,
            lean_in=lean_in,
            centering=centering,
            symmetry=symmetry,
            hand_positions=hand_positions
        )

    def _classify_posture(self, landmarks: List[Tuple[float, float, float, float]]) -> Tuple[str, float]:
        """Classify body posture"""
        # Shoulder and hip positions
        LEFT_SHOULDER = 11
        RIGHT_SHOULDER = 12
        LEFT_HIP = 23
        RIGHT_HIP = 24

        shoulder_width = abs(landmarks[LEFT_SHOULDER][0] - landmarks[RIGHT_SHOULDER][0])
        hip_width = abs(landmarks[LEFT_HIP][0] - landmarks[RIGHT_HIP][0])

        # Open posture: shoulders wider than hips
        # Closed posture: shoulders narrower or hunched
        if shoulder_width > hip_width * 1.1:
            posture = 'open'
            confidence = 0.8
        elif shoulder_width < hip_width * 0.9:
            posture = 'closed'
            confidence = 0.8
        else:
            posture = 'neutral'
            confidence = 0.6

        return posture, confidence

    def _detect_gestures(self, hand_results, body_landmarks) -> Tuple[List[Dict[str, any]], int]:
        """Detect hand gestures"""
        gestures = []

        for hand_idx, hand_landmarks in enumerate(hand_results.multi_hand_landmarks):
            hand_side = hand_results.multi_handedness[hand_idx].classification[0].label.lower()

            # Convert to list
            hand_points = [(lm.x, lm.y, lm.z) for lm in hand_landmarks.landmark]

            # Detect specific gestures
            if self._is_pointing(hand_points):
                gestures.append({
                    'type': 'pointing',
                    'hand': hand_side,
                    'confidence': 0.9
                })

            if self._is_open_palm(hand_points):
                gestures.append({
                    'type': 'open_palm',
                    'hand': hand_side,
                    'confidence': 0.85
                })

        return gestures, len(gestures)

    def _is_pointing(self, hand_landmarks: List[Tuple[float, float, float]]) -> bool:
        """Detect pointing gesture"""
        # Index finger extended, others curled
        INDEX_TIP = 8
        INDEX_MCP = 5
        MIDDLE_TIP = 12
        MIDDLE_MCP = 9

        index_extended = hand_landmarks[INDEX_TIP][1] < hand_landmarks[INDEX_MCP][1]
        middle_curled = hand_landmarks[MIDDLE_TIP][1] > hand_landmarks[MIDDLE_MCP][1]

        return index_extended and middle_curled

    def _is_open_palm(self, hand_landmarks: List[Tuple[float, float, float]]) -> bool:
        """Detect open palm gesture"""
        # All fingers extended
        finger_tips = [4, 8, 12, 16, 20]
        finger_mcps = [2, 5, 9, 13, 17]

        extended_count = sum(
            1 for tip, mcp in zip(finger_tips, finger_mcps)
            if hand_landmarks[tip][1] < hand_landmarks[mcp][1]
        )

        return extended_count >= 4

    def _detect_fidgeting(self, landmarks: List[Tuple[float, float, float, float]]) -> float:
        """Detect fidgeting from hand/body movement"""
        # Track hand position changes
        LEFT_HAND = 15
        RIGHT_HAND = 16

        current_positions = (landmarks[LEFT_HAND][:2], landmarks[RIGHT_HAND][:2])

        if self.last_hand_positions is not None:
            # Calculate movement
            left_movement = distance.euclidean(current_positions[0], self.last_hand_positions[0])
            right_movement = distance.euclidean(current_positions[1], self.last_hand_positions[1])
            total_movement = left_movement + right_movement

            # Normalize to 0-100 scale
            fidgeting = min(total_movement * 2, 100)
        else:
            fidgeting = 0.0

        self.last_hand_positions = current_positions

        return float(fidgeting)

    def _estimate_energy_level(self, landmarks: List[Tuple[float, float, float, float]]) -> float:
        """Estimate energy level from body movement and posture"""
        # Calculate overall body movement magnitude
        # (In a real implementation, would track changes over multiple frames)

        # For now, use posture openness as proxy
        LEFT_SHOULDER = 11
        RIGHT_SHOULDER = 12
        LEFT_HIP = 23
        RIGHT_HIP = 24

        shoulder_y = (landmarks[LEFT_SHOULDER][1] + landmarks[RIGHT_SHOULDER][1]) / 2
        hip_y = (landmarks[LEFT_HIP][1] + landmarks[RIGHT_HIP][1]) / 2

        # Upright posture indicates higher energy
        uprightness = abs(shoulder_y - hip_y)

        energy = min(uprightness / 2, 100)

        return float(energy)

    def _calculate_head_tilt(self, landmarks: List[Tuple[float, float, float, float]]) -> float:
        """Calculate head tilt angle"""
        NOSE = 0
        LEFT_EAR = 7
        RIGHT_EAR = 8

        if landmarks[LEFT_EAR][3] > 0.5 and landmarks[RIGHT_EAR][3] > 0.5:
            # Calculate angle from horizontal
            dx = landmarks[RIGHT_EAR][0] - landmarks[LEFT_EAR][0]
            dy = landmarks[RIGHT_EAR][1] - landmarks[LEFT_EAR][1]
            angle = np.degrees(np.arctan2(dy, dx))
            return float(angle)
        else:
            return 0.0

    def _calculate_shoulder_tension(self, landmarks: List[Tuple[float, float, float, float]]) -> float:
        """Estimate shoulder tension"""
        LEFT_SHOULDER = 11
        RIGHT_SHOULDER = 12
        NOSE = 0

        # Tension indicated by shoulders raised (closer to nose)
        shoulder_height = (landmarks[LEFT_SHOULDER][1] + landmarks[RIGHT_SHOULDER][1]) / 2
        nose_height = landmarks[NOSE][1]

        relative_height = nose_height - shoulder_height

        # Lower value = shoulders raised = higher tension
        tension = max(0, min(100, 100 - relative_height))

        return float(tension)

    def _calculate_lean(self, landmarks: List[Tuple[float, float, float, float]]) -> float:
        """Calculate forward/backward lean"""
        NOSE = 0
        LEFT_HIP = 23
        RIGHT_HIP = 24

        nose_z = landmarks[NOSE][2]
        hip_z = (landmarks[LEFT_HIP][2] + landmarks[RIGHT_HIP][2]) / 2

        # Positive = leaning forward, negative = leaning back
        lean = (nose_z - hip_z) * 10

        return float(max(-1, min(1, lean)))

    def _calculate_centering(self, landmarks: List[Tuple[float, float, float, float]], frame_shape) -> float:
        """Calculate how centered the person is in frame"""
        h, w, _ = frame_shape
        NOSE = 0

        nose_x = landmarks[NOSE][0]
        frame_center_x = w / 2

        # Distance from center
        distance_from_center = abs(nose_x - frame_center_x)
        max_distance = w / 2

        centering = 1.0 - (distance_from_center / max_distance)

        return float(max(0, min(1, centering)))

    def _calculate_symmetry(self, landmarks: List[Tuple[float, float, float, float]]) -> float:
        """Calculate body symmetry"""
        LEFT_SHOULDER = 11
        RIGHT_SHOULDER = 12
        LEFT_HIP = 23
        RIGHT_HIP = 24

        # Compare distances from center line
        shoulder_center_x = (landmarks[LEFT_SHOULDER][0] + landmarks[RIGHT_SHOULDER][0]) / 2
        hip_center_x = (landmarks[LEFT_HIP][0] + landmarks[RIGHT_HIP][0]) / 2

        left_shoulder_dist = abs(landmarks[LEFT_SHOULDER][0] - shoulder_center_x)
        right_shoulder_dist = abs(landmarks[RIGHT_SHOULDER][0] - shoulder_center_x)

        shoulder_symmetry = 1.0 - abs(left_shoulder_dist - right_shoulder_dist) / max(left_shoulder_dist, right_shoulder_dist, 1)

        return float(max(0, min(1, shoulder_symmetry)))

    def _get_hand_positions(self, landmarks: List[Tuple[float, float, float, float]]) -> Dict[str, Dict[str, float]]:
        """Get normalized hand positions"""
        LEFT_HAND = 15
        RIGHT_HAND = 16

        return {
            'left': {
                'x': float(landmarks[LEFT_HAND][0]),
                'y': float(landmarks[LEFT_HAND][1]),
                'z': float(landmarks[LEFT_HAND][2]),
                'visibility': float(landmarks[LEFT_HAND][3])
            },
            'right': {
                'x': float(landmarks[RIGHT_HAND][0]),
                'y': float(landmarks[RIGHT_HAND][1]),
                'z': float(landmarks[RIGHT_HAND][2]),
                'visibility': float(landmarks[RIGHT_HAND][3])
            }
        }

    def _analyze_professional_presence(
        self,
        frame: np.ndarray,
        has_face: bool,
        has_body: bool
    ) -> ProfessionalPresenceMetrics:
        """Analyze professional presence indicators"""
        # Frame positioning
        frame_positioning = 75.0 if has_face and has_body else 50.0

        # Lighting quality (analyze brightness and contrast)
        lighting_quality = self._analyze_lighting(frame)

        # Background appropriateness (detect clutter, motion)
        background_score = self._analyze_background(frame)

        # Attire professionalism (placeholder - would need object detection)
        attire_score = 70.0  # Neutral default

        # Overall polish
        overall_polish = (frame_positioning + lighting_quality + background_score + attire_score) / 4

        return ProfessionalPresenceMetrics(
            frame_positioning=frame_positioning,
            lighting_quality=lighting_quality,
            background_appropriateness=background_score,
            attire_professionalism=attire_score,
            overall_polish=overall_polish
        )

    def _analyze_lighting(self, frame: np.ndarray) -> float:
        """Analyze lighting quality"""
        # Convert to grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # Calculate mean brightness
        brightness = np.mean(gray)

        # Calculate contrast (standard deviation)
        contrast = np.std(gray)

        # Optimal brightness: 100-150, optimal contrast: 40-80
        brightness_score = 100 * (1.0 - abs(brightness - 125) / 125)
        contrast_score = 100 * (1.0 - abs(contrast - 60) / 60)

        lighting_quality = (brightness_score + contrast_score) / 2

        return float(max(0, min(100, lighting_quality)))

    def _analyze_background(self, frame: np.ndarray) -> float:
        """Analyze background appropriateness"""
        # Detect motion in background (simplified)
        # In production, would compare with previous frames

        # For now, analyze edge density (clutter indicator)
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        edges = cv2.Canny(gray, 50, 150)
        edge_density = np.sum(edges > 0) / edges.size

        # Lower edge density = cleaner background = higher score
        background_score = 100 * (1.0 - min(edge_density * 5, 1.0))

        return float(max(0, min(100, background_score)))

    def _empty_facial_metrics(self) -> FacialMetrics:
        """Return empty facial metrics when no face detected"""
        return FacialMetrics(
            dominant_emotion='neutral',
            emotion_confidence=0.0,
            emotion_scores={},
            micro_expressions=[],
            eye_contact=0.0,
            gaze_direction={'x': 0.0, 'y': 0.0},
            blink_rate=0.0,
            smile_genuineness=0.0,
            eyebrow_position='neutral',
            mouth_openness=0.0,
            head_pose={'pitch': 0.0, 'yaw': 0.0, 'roll': 0.0}
        )

    def _empty_body_metrics(self) -> BodyMetrics:
        """Return empty body metrics when no body detected"""
        return BodyMetrics(
            posture='neutral',
            posture_confidence=0.0,
            gesture_count=0,
            gestures=[],
            fidgeting_level=0.0,
            energy_level=0.0,
            head_tilt=0.0,
            shoulder_tension=0.0,
            lean_in=0.0,
            centering=0.0,
            symmetry=0.0,
            hand_positions={'left': {}, 'right': {}}
        )

    def to_dict(self, result: VisionAnalysisResult) -> Dict:
        """Convert result to dictionary for JSON serialization"""
        return {
            'facial': asdict(result.facial),
            'body': asdict(result.body),
            'professional': asdict(result.professional),
            'frame_number': result.frame_number,
            'timestamp_ms': result.timestamp_ms,
            'processing_time_ms': result.processing_time_ms,
            'has_face': result.has_face,
            'has_body': result.has_body
        }

    def __del__(self):
        """Cleanup MediaPipe resources"""
        if self.face_mesh:
            self.face_mesh.close()
        if self.pose:
            self.pose.close()
        if self.hands:
            self.hands.close()


# Singleton instance
_vision_analyzer_instance: Optional[VisionAnalyzer] = None


def get_vision_analyzer(**kwargs) -> VisionAnalyzer:
    """Get or create vision analyzer singleton"""
    global _vision_analyzer_instance

    if _vision_analyzer_instance is None:
        _vision_analyzer_instance = VisionAnalyzer(**kwargs)

    return _vision_analyzer_instance
