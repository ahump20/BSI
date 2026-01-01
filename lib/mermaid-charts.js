#!/usr/bin/env node

/**
 * Mermaid Chart Generator for Blaze Sports Intel
 * Creates interactive diagrams for system architecture and data flows
 */

import fs from 'fs/promises';
import path from 'path';

class MermaidChartGenerator {
  constructor(options = {}) {
    this.outputDir = options.outputDir || './docs/charts';
    this.theme = options.theme || 'default';
  }

  /**
   * Generate system architecture diagram
   */
  generateSystemArchitecture() {
    return `
graph TB
    %% User Interface Layer
    Web[🌐 Web Dashboard<br/>React + Three.js]
    Mobile[📱 Mobile App<br/>React Native]
    API_Docs[📚 API Documentation<br/>OpenAPI/Swagger]
    
    %% API Gateway
    Gateway[🚪 API Gateway<br/>Express.js + Helmet]
    
    %% Core Services
    Auth[🔐 Authentication<br/>JWT + Sessions]
    Biomech[🏃 Biomechanics Engine<br/>Pose Analysis]
    ML[🧠 ML Pipeline<br/>TensorFlow + Predictions]
    RealTime[⚡ Real-time Service<br/>WebSocket + SSE]
    
    %% Data Processing
    PoseProcessor[📊 Pose Processor<br/>3D Keypoint Analysis]
    Analytics[📈 Analytics Engine<br/>Statistical Calculations]
    VideoGen[🎥 Video Generator<br/>Clip Generation]
    
    %% Data Storage
    PostgreSQL[(🐘 PostgreSQL<br/>Primary Database)]
    Redis[(🔥 Redis<br/>Cache + Sessions)]
    MinIO[(📦 MinIO<br/>S3 Compatible Storage)]
    
    %% External APIs
    MLB_API[⚾ MLB Stats API<br/>Real Game Data]
    ESPN_API[🏈 ESPN API<br/>Sports Data]
    SO_API[📚 Stack Overflow API<br/>Community Support]
    
    %% Monitoring
    Grafana[📊 Grafana<br/>Monitoring Dashboard]
    Prometheus[📈 Prometheus<br/>Metrics Collection]
    
    %% Connections
    Web --> Gateway
    Mobile --> Gateway
    Gateway --> Auth
    Gateway --> Biomech
    Gateway --> ML
    Gateway --> RealTime
    
    Auth --> PostgreSQL
    Auth --> Redis
    
    Biomech --> PoseProcessor
    Biomech --> Analytics
    Biomech --> VideoGen
    
    PoseProcessor --> MinIO
    Analytics --> PostgreSQL
    VideoGen --> MinIO
    
    ML --> PostgreSQL
    ML --> Redis
    
    RealTime --> Redis
    RealTime --> PostgreSQL
    
    Gateway --> MLB_API
    Gateway --> ESPN_API
    Gateway --> SO_API
    
    Prometheus --> Gateway
    Prometheus --> PostgreSQL
    Prometheus --> Redis
    Grafana --> Prometheus
    
    %% Styling
    classDef frontend fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef backend fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef database fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef external fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef monitoring fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    
    class Web,Mobile,API_Docs frontend
    class Gateway,Auth,Biomech,ML,RealTime,PoseProcessor,Analytics,VideoGen backend
    class PostgreSQL,Redis,MinIO database
    class MLB_API,ESPN_API,SO_API external
    class Grafana,Prometheus monitoring
    `;
  }

  /**
   * Generate data flow diagram for biomechanics analysis
   */
  generateBiomechDataFlow() {
    return `
flowchart TD
    %% Input Sources
    Camera1[📹 Camera 1<br/>Front View]
    Camera2[📹 Camera 2<br/>Side View]
    Camera3[📹 Camera 3<br/>Back View]
    Camera4[📹 Camera 4<br/>Overhead]
    
    %% Pose Estimation
    PoseEst[🎯 3D Pose Estimation<br/>MediaPipe + OpenPose]
    
    %% Feature Extraction
    Features[🔍 Feature Extraction<br/>30+ Biomech Metrics]
    
    %% Feature Categories
    Kinematic[📐 Kinematic Features<br/>• Joint Angles<br/>• Angular Velocities<br/>• Linear Accelerations]
    Temporal[⏱️ Temporal Features<br/>• Ground Contact Time<br/>• Phase Durations<br/>• Rhythm Patterns]
    Spatial[📏 Spatial Features<br/>• Center of Mass<br/>• Hip-Shoulder Separation<br/>• Stride Length]
    
    %% Risk Assessment
    RiskEngine[⚠️ Risk Assessment<br/>Injury Prediction Model]
    
    %% Performance Analysis
    PerfAnalysis[📊 Performance Analysis<br/>Trait Scoring + Projections]
    
    %% Outputs
    Dashboard[📱 Coach Dashboard<br/>Real-time Metrics]
    Alerts[🚨 Risk Alerts<br/>Injury Prevention]
    Videos[🎥 Video Clips<br/>Annotated Highlights]
    Reports[📋 Performance Reports<br/>Detailed Analytics]
    
    %% Data Flow
    Camera1 --> PoseEst
    Camera2 --> PoseEst
    Camera3 --> PoseEst
    Camera4 --> PoseEst
    
    PoseEst --> Features
    
    Features --> Kinematic
    Features --> Temporal  
    Features --> Spatial
    
    Kinematic --> RiskEngine
    Temporal --> RiskEngine
    Spatial --> RiskEngine
    
    Kinematic --> PerfAnalysis
    Temporal --> PerfAnalysis
    Spatial --> PerfAnalysis
    
    RiskEngine --> Dashboard
    RiskEngine --> Alerts
    
    PerfAnalysis --> Dashboard
    PerfAnalysis --> Reports
    
    Features --> Videos
    
    %% Styling
    classDef input fill:#e3f2fd,stroke:#0d47a1,stroke-width:2px
    classDef processing fill:#f1f8e9,stroke:#33691e,stroke-width:2px
    classDef features fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef analysis fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef output fill:#fff8e1,stroke:#ff6f00,stroke-width:2px
    
    class Camera1,Camera2,Camera3,Camera4 input
    class PoseEst,Features processing
    class Kinematic,Temporal,Spatial features
    class RiskEngine,PerfAnalysis analysis
    class Dashboard,Alerts,Videos,Reports output
    `;
  }

  /**
   * Generate API endpoint flow diagram
   */
  generateAPIFlow() {
    return `
sequenceDiagram
    participant Client
    participant Gateway
    participant Auth
    participant Cache
    participant Database
    participant ExtAPI as External APIs
    participant ML as ML Pipeline
    
    Note over Client,ML: Biomechanics Analysis Request
    
    Client->>Gateway: POST /api/v1/pose/ingest
    Gateway->>Auth: Validate JWT Token
    Auth-->>Gateway: Token Valid
    
    Gateway->>Cache: Check Rate Limit
    Cache-->>Gateway: Within Limits
    
    Gateway->>Database: Store Pose Data
    Database-->>Gateway: Data Stored
    
    Gateway->>ML: Trigger Analysis
    
    ML->>Database: Fetch Historical Data
    Database-->>ML: Historical Metrics
    
    ML->>ML: Calculate Biomech Features
    ML->>ML: Risk Assessment
    ML->>ML: Performance Scoring
    
    ML->>Database: Store Analysis Results
    Database-->>ML: Results Stored
    
    ML-->>Gateway: Analysis Complete
    Gateway-->>Client: 202 Accepted
    
    Note over Client,ML: Real-time Results via WebSocket
    
    Gateway->>Client: WebSocket: Analysis Results
    
    Note over Client,ML: External Data Integration
    
    Client->>Gateway: GET /api/mlb/138
    Gateway->>Cache: Check Cache
    Cache-->>Gateway: Cache Miss
    
    Gateway->>ExtAPI: Fetch MLB Data
    ExtAPI-->>Gateway: Team Data
    
    Gateway->>ML: Calculate Analytics
    ML-->>Gateway: Pythagorean Win %
    
    Gateway->>Cache: Store Result (5min TTL)
    Gateway-->>Client: Team Data + Analytics
    `;
  }

  /**
   * Generate machine learning pipeline diagram
   */
  generateMLPipeline() {
    return `
graph LR
    %% Data Sources
    subgraph "📊 Data Sources"
        PoseData[3D Pose Data]
        GameData[Game Statistics]
        PlayerData[Player Profiles]
        VideoData[Video Footage]
    end
    
    %% Feature Engineering
    subgraph "🔧 Feature Engineering" 
        Extract[Feature Extraction]
        Transform[Data Transformation]
        Select[Feature Selection]
    end
    
    %% Model Training
    subgraph "🧠 Model Training"
        InjuryModel[Injury Risk Model<br/>Random Forest]
        PerfModel[Performance Model<br/>Neural Network]
        TraitModel[Trait Scoring Model<br/>XGBoost]
        OutcomeModel[Game Outcome Model<br/>Ensemble]
    end
    
    %% Model Evaluation
    subgraph "📈 Evaluation"
        Validation[Cross Validation]
        Metrics[Performance Metrics]
        Drift[Model Drift Detection]
    end
    
    %% Deployment
    subgraph "🚀 Deployment"
        API[REST API Endpoints]
        RealTime[Real-time Inference]
        Batch[Batch Processing]
    end
    
    %% Monitoring
    subgraph "📊 Monitoring"
        Logs[Model Logs]
        Alerts[Performance Alerts]
        Retraining[Auto Retraining]
    end
    
    %% Flow
    PoseData --> Extract
    GameData --> Extract
    PlayerData --> Extract
    VideoData --> Extract
    
    Extract --> Transform
    Transform --> Select
    
    Select --> InjuryModel
    Select --> PerfModel
    Select --> TraitModel
    Select --> OutcomeModel
    
    InjuryModel --> Validation
    PerfModel --> Validation
    TraitModel --> Validation
    OutcomeModel --> Validation
    
    Validation --> Metrics
    Metrics --> Drift
    
    InjuryModel --> API
    PerfModel --> RealTime
    TraitModel --> Batch
    OutcomeModel --> API
    
    API --> Logs
    RealTime --> Logs
    Batch --> Logs
    
    Logs --> Alerts
    Alerts --> Retraining
    Drift --> Retraining
    
    %% Styling
    classDef data fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef processing fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef models fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef deployment fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef monitoring fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    
    class PoseData,GameData,PlayerData,VideoData data
    class Extract,Transform,Select processing
    class InjuryModel,PerfModel,TraitModel,OutcomeModel models
    class API,RealTime,Batch deployment
    class Logs,Alerts,Retraining monitoring
    `;
  }

  /**
   * Generate database schema diagram
   */
  generateDatabaseSchema() {
    return `
erDiagram
    TEAMS {
        int id PK
        string name
        string sport
        string division
        string abbreviation
        timestamp created_at
        timestamp updated_at
    }
    
    PLAYERS {
        int id PK
        int team_id FK
        string name
        string position
        date birth_date
        decimal height_cm
        decimal weight_kg
        timestamp created_at
    }
    
    GAMES {
        int id PK
        int home_team_id FK
        int away_team_id FK
        datetime game_time
        int home_score
        int away_score
        string status
        int attendance
        jsonb weather_data
    }
    
    GAME_STATS {
        int id PK
        int game_id FK
        int player_id FK
        jsonb stats_data
        decimal minutes_played
        timestamp recorded_at
    }
    
    ANALYTICS {
        int id PK
        int team_id FK
        int season
        string metric_type
        decimal metric_value
        jsonb metric_data
        timestamp calculation_date
        string data_source
    }
    
    POSE_DATA {
        int id PK
        int player_id FK
        timestamp recorded_at
        jsonb keypoints
        string sport
        string action_type
        decimal confidence_score
    }
    
    BIOMECH_ANALYSIS {
        int id PK
        int pose_data_id FK
        int player_id FK
        jsonb biomech_metrics
        jsonb risk_assessment
        decimal overall_score
        timestamp analyzed_at
    }
    
    INJURIES {
        int id PK
        int player_id FK
        string injury_type
        string body_part
        date injury_date
        date return_date
        string severity
        text description
    }
    
    PREDICTIONS {
        int id PK
        int player_id FK
        string prediction_type
        jsonb prediction_data
        decimal confidence
        date prediction_date
        date target_date
        boolean is_realized
    }
    
    LIVE_SCORES {
        int id PK
        int game_id FK
        int quarter_period
        int home_score
        int away_score
        timestamp last_update
        jsonb event_data
    }
    
    API_CACHE {
        int id PK
        string cache_key UK
        jsonb response_data
        string api_source
        timestamp expires_at
        int hit_count
    }
    
    %% Relationships
    TEAMS ||--o{ PLAYERS : has
    TEAMS ||--o{ GAMES : "home team"
    TEAMS ||--o{ GAMES : "away team"
    TEAMS ||--o{ ANALYTICS : generates
    
    PLAYERS ||--o{ GAME_STATS : plays
    PLAYERS ||--o{ POSE_DATA : generates
    PLAYERS ||--o{ BIOMECH_ANALYSIS : analyzed
    PLAYERS ||--o{ INJURIES : suffers
    PLAYERS ||--o{ PREDICTIONS : subject_of
    
    GAMES ||--o{ GAME_STATS : contains
    GAMES ||--o{ LIVE_SCORES : tracked
    
    POSE_DATA ||--|| BIOMECH_ANALYSIS : analyzed_from
    `;
  }

  /**
   * Generate deployment architecture diagram
   */
  generateDeploymentArchitecture() {
    return `
graph TB
    %% CDN and Edge
    subgraph "🌐 Cloudflare Edge"
        CDN[CDN + Cache]
        WAF[Web Application Firewall]
        DDoS[DDoS Protection]
    end
    
    %% Load Balancing
    subgraph "⚖️ Load Balancing"
        LB[Application Load Balancer]
        HealthCheck[Health Checks]
    end
    
    %% Application Tier
    subgraph "🚀 Application Servers"
        App1[API Server 1<br/>Node.js + Express]
        App2[API Server 2<br/>Node.js + Express]
        App3[API Server 3<br/>Node.js + Express]
    end
    
    %% Processing Tier  
    subgraph "🔄 Processing Layer"
        Worker1[Pose Processor 1<br/>Python + OpenCV]
        Worker2[Pose Processor 2<br/>Python + OpenCV]
        MLService[ML Service<br/>TensorFlow Serving]
    end
    
    %% Data Tier
    subgraph "💾 Data Layer"
        PrimaryDB[(Primary PostgreSQL<br/>Read/Write)]
        ReplicaDB[(Read Replica<br/>Read Only)]
        RedisCluster[(Redis Cluster<br/>Cache + Sessions)]
    end
    
    %% Storage
    subgraph "📦 Object Storage"
        S3[MinIO/S3<br/>Video + Assets]
        Backup[Automated Backups<br/>Cross-Region Sync]
    end
    
    %% Monitoring
    subgraph "📊 Observability"
        Logs[Centralized Logging<br/>ELK Stack]
        Metrics[Metrics Collection<br/>Prometheus]
        Alerts[Alert Manager<br/>PagerDuty]
        Tracing[Distributed Tracing<br/>Jaeger]
    end
    
    %% External Services
    subgraph "🔌 External APIs"
        NeonDB[(Neon Database<br/>Serverless PostgreSQL)]
        SOAPI[Stack Overflow API]
        SportsAPIs[Sports Data APIs<br/>MLB, ESPN, etc.]
    end
    
    %% Traffic Flow
    Users[👥 Users] --> CDN
    CDN --> WAF
    WAF --> DDoS
    DDoS --> LB
    
    LB --> App1
    LB --> App2
    LB --> App3
    
    App1 --> Worker1
    App2 --> Worker2
    App3 --> MLService
    
    App1 --> PrimaryDB
    App2 --> ReplicaDB
    App3 --> RedisCluster
    
    Worker1 --> S3
    Worker2 --> S3
    MLService --> S3
    
    PrimaryDB --> Backup
    S3 --> Backup
    
    App1 --> Logs
    App2 --> Metrics
    App3 --> Alerts
    Worker1 --> Tracing
    
    App1 --> NeonDB
    App2 --> SOAPI
    App3 --> SportsAPIs
    
    HealthCheck --> App1
    HealthCheck --> App2
    HealthCheck --> App3
    
    %% Styling
    classDef edge fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef app fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef data fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px
    classDef storage fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef monitoring fill:#fce4ec,stroke:#880e4f,stroke-width:2px
    classDef external fill:#f1f8e9,stroke:#33691e,stroke-width:2px
    
    class CDN,WAF,DDoS,LB,HealthCheck edge
    class App1,App2,App3,Worker1,Worker2,MLService app
    class PrimaryDB,ReplicaDB,RedisCluster data
    class S3,Backup storage
    class Logs,Metrics,Alerts,Tracing monitoring
    class NeonDB,SOAPI,SportsAPIs external
    `;
  }

  /**
   * Generate HTML page with all charts
   */
  async generateHTMLPage() {
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blaze Sports Intel - System Architecture</title>
    <script src="https://cdn.jsdelivr.net/npm/mermaid@10.6.1/dist/mermaid.min.js"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
        }
        h1 {
            color: #ff6b00;
            text-align: center;
            margin-bottom: 10px;
            font-size: 2.5rem;
        }
        .subtitle {
            text-align: center;
            color: #666;
            margin-bottom: 40px;
            font-size: 1.2rem;
        }
        .chart-section {
            margin: 40px 0;
            padding: 20px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            background: #fafafa;
        }
        .chart-title {
            font-size: 1.5rem;
            font-weight: 600;
            color: #333;
            margin-bottom: 20px;
            text-align: center;
        }
        .chart-description {
            color: #666;
            margin-bottom: 20px;
            text-align: center;
            font-style: italic;
        }
        .mermaid {
            text-align: center;
            margin: 20px 0;
        }
        .toc {
            background: #f0f8ff;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
        }
        .toc h2 {
            margin-top: 0;
            color: #0066cc;
        }
        .toc ul {
            list-style-type: none;
            padding-left: 0;
        }
        .toc li {
            margin: 10px 0;
        }
        .toc a {
            color: #0066cc;
            text-decoration: none;
            font-weight: 500;
        }
        .toc a:hover {
            text-decoration: underline;
        }
        footer {
            text-align: center;
            margin-top: 60px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏆 Blaze Sports Intel</h1>
        <p class="subtitle">System Architecture & Data Flow Diagrams</p>
        
        <div class="toc">
            <h2>📋 Table of Contents</h2>
            <ul>
                <li><a href="#system-architecture">System Architecture Overview</a></li>
                <li><a href="#biomech-flow">Biomechanics Data Flow</a></li>
                <li><a href="#api-flow">API Request Flow</a></li>
                <li><a href="#ml-pipeline">Machine Learning Pipeline</a></li>
                <li><a href="#database-schema">Database Schema</a></li>
                <li><a href="#deployment">Deployment Architecture</a></li>
            </ul>
        </div>

        <div id="system-architecture" class="chart-section">
            <div class="chart-title">🏗️ System Architecture Overview</div>
            <div class="chart-description">
                High-level view of all system components including web interfaces, APIs, databases, and external integrations.
            </div>
            <div class="mermaid">
${this.generateSystemArchitecture()}
            </div>
        </div>

        <div id="biomech-flow" class="chart-section">
            <div class="chart-title">🏃 Biomechanics Data Flow</div>
            <div class="chart-description">
                Shows how pose data flows from multi-camera capture through 3D analysis to real-time coaching insights.
            </div>
            <div class="mermaid">
${this.generateBiomechDataFlow()}
            </div>
        </div>

        <div id="api-flow" class="chart-section">
            <div class="chart-title">🔄 API Request Flow</div>
            <div class="chart-description">
                Sequence diagram showing how API requests flow through authentication, caching, processing, and response delivery.
            </div>
            <div class="mermaid">
${this.generateAPIFlow()}
            </div>
        </div>

        <div id="ml-pipeline" class="chart-section">
            <div class="chart-title">🧠 Machine Learning Pipeline</div>
            <div class="chart-description">
                Complete ML workflow from data ingestion through model training, evaluation, deployment, and monitoring.
            </div>
            <div class="mermaid">
${this.generateMLPipeline()}
            </div>
        </div>

        <div id="database-schema" class="chart-section">
            <div class="chart-title">💾 Database Schema</div>
            <div class="chart-description">
                Entity relationship diagram showing all database tables, relationships, and key constraints.
            </div>
            <div class="mermaid">
${this.generateDatabaseSchema()}
            </div>
        </div>

        <div id="deployment" class="chart-section">
            <div class="chart-title">🚀 Deployment Architecture</div>
            <div class="chart-description">
                Production deployment setup with load balancing, auto-scaling, monitoring, and disaster recovery.
            </div>
            <div class="mermaid">
${this.generateDeploymentArchitecture()}
            </div>
        </div>

        <footer>
            <p>Generated by Blaze Sports Intel Mermaid Chart System | <a href="https://blazesportsintel.com">blazesportsintel.com</a></p>
            <p>Last updated: ${new Date().toLocaleString()}</p>
        </footer>
    </div>

    <script>
        mermaid.initialize({
            startOnLoad: true,
            theme: 'default',
            flowchart: {
                useMaxWidth: true,
                htmlLabels: true,
                curve: 'cardinal'
            },
            sequence: {
                diagramMarginX: 50,
                diagramMarginY: 10,
                actorMargin: 50,
                width: 150,
                height: 65,
                boxMargin: 10,
                boxTextMargin: 5,
                noteMargin: 10,
                messageMargin: 35
            }
        });
    </script>
</body>
</html>
    `;

    return html;
  }

  /**
   * Save all charts to files
   */
  async saveCharts() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });

      // Save individual mermaid files
      const charts = {
        'system-architecture.mmd': this.generateSystemArchitecture(),
        'biomech-data-flow.mmd': this.generateBiomechDataFlow(),
        'api-flow.mmd': this.generateAPIFlow(),
        'ml-pipeline.mmd': this.generateMLPipeline(),
        'database-schema.mmd': this.generateDatabaseSchema(),
        'deployment-architecture.mmd': this.generateDeploymentArchitecture(),
      };

      for (const [filename, content] of Object.entries(charts)) {
        const filePath = path.join(this.outputDir, filename);
        await fs.writeFile(filePath, content.trim());
      }

      // Save HTML page
      const htmlContent = await this.generateHTMLPage();
      const htmlPath = path.join(this.outputDir, 'architecture-diagrams.html');
      await fs.writeFile(htmlPath, htmlContent);

      return {
        outputDir: this.outputDir,
        charts: Object.keys(charts),
        htmlFile: 'architecture-diagrams.html',
      };
    } catch (error) {
      console.error('Error saving charts:', error);
      throw error;
    }
  }
}

export default MermaidChartGenerator;

// CLI usage (guarded for Workers compatibility)
if (
  typeof process !== 'undefined' &&
  process.argv &&
  import.meta.url === `file://${process.argv[1]}`
) {
  const generator = new MermaidChartGenerator();

  async function main() {
    try {
      const result = await generator.saveCharts();
    } catch (error) {
      console.error('❌ Error generating charts:', error);
      process.exit(1);
    }
  }

  main();
}
