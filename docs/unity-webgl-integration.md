# Unity WebGL Integration for Blaze Sports Intel

## Overview
This document outlines the integration strategy for Unity 6 WebGL builds with the Blaze Sports Intelligence platform, enabling immersive 3D player analytics and biomechanics visualization.

## Unity 6 WebGL Capabilities (2025)

### Key Features
- **Mobile WebGL Support**: Official support for mobile browsers
- **Universal Render Pipeline (URP)**: Optimized for web performance
- **WebAssembly**: Fast loading and execution
- **Real-time Analytics**: Built-in analytics integration
- **Sub-2-second Load Times**: With proper optimization

### Performance Targets
- 60 FPS on desktop (Chrome, Edge, Safari, Firefox)
- 30-45 FPS on mobile devices
- < 2 seconds initial load time
- < 50 MB compressed build size

## Integration Architecture

### 1. Unity Project Structure
```
BlazeSportsIntelUnity/
├── Assets/
│   ├── Scenes/
│   │   ├── PlayerBiomechanics.unity
│   │   ├── StadiumVisualization.unity
│   │   └── TeamAnalytics.unity
│   ├── Scripts/
│   │   ├── BlazeAPIConnector.cs
│   │   ├── BiomechanicsRenderer.cs
│   │   ├── PlayerDataManager.cs
│   │   └── WebGLCommunication.cs
│   ├── Materials/
│   │   └── BlazeSportsMaterials/
│   └── Prefabs/
│       ├── PlayerModel.prefab
│       ├── StadiumPrefab.prefab
│       └── DataVisualization.prefab
└── ProjectSettings/
    └── WebGL optimizations
```

### 2. JavaScript Bridge Communication

Unity and web page communicate via JavaScript:

```javascript
// From Web Page → Unity
function sendDataToUnity(playerData) {
    const unityInstance = window.unityInstance;
    if (unityInstance) {
        unityInstance.SendMessage(
            'GameManager',
            'ReceivePlayerData',
            JSON.stringify(playerData)
        );
    }
}

// From Unity → Web Page (implemented in Unity C#)
// UnityWebGL.jslib file:
mergeInto(LibraryManager.library, {
    SendAnalyticsToWeb: function(dataPtr) {
        const data = UTF8ToString(dataPtr);
        window.parent.postMessage({
            type: 'UNITY_ANALYTICS',
            payload: JSON.parse(data)
        }, '*');
    }
});
```

### 3. C# API Connector Script

```csharp
// BlazeAPIConnector.cs
using UnityEngine;
using UnityEngine.Networking;
using System.Collections;
using System.Collections.Generic;

public class BlazeAPIConnector : MonoBehaviour
{
    private const string API_BASE = "https://blazesportsintel.com/api";

    [System.Serializable]
    public class PlayerBiomechanics
    {
        public string playerId;
        public string sport;
        public float[] jointPositions;
        public float velocity;
        public float power;
        public float efficiency;
    }

    public IEnumerator FetchPlayerData(string playerId, string sport)
    {
        string url = $"{API_BASE}/player/{sport}/{playerId}/biomechanics";

        using (UnityWebRequest request = UnityWebRequest.Get(url))
        {
            request.SetRequestHeader("Accept", "application/json");
            request.SetRequestHeader("User-Agent", "BlazeSportsIntel-Unity/1.0");

            yield return request.SendWebRequest();

            if (request.result == UnityWebRequest.Result.Success)
            {
                PlayerBiomechanics data = JsonUtility.FromJson<PlayerBiomechanics>(
                    request.downloadHandler.text
                );
                ProcessBiomechanicsData(data);
            }
            else
            {
                Debug.LogError($"API Error: {request.error}");
                LoadDemoData();
            }
        }
    }

    private void ProcessBiomechanicsData(PlayerBiomechanics data)
    {
        // Update 3D visualization
        BiomechanicsRenderer renderer = GetComponent<BiomechanicsRenderer>();
        renderer.UpdateVisualization(data);

        // Send analytics back to web page
        SendAnalyticsToWeb(JsonUtility.ToJson(new {
            playerId = data.playerId,
            metricsCalculated = true,
            timestamp = System.DateTime.UtcNow.ToString("o")
        }));
    }

    [System.Runtime.InteropServices.DllImport("__Internal")]
    private static extern void SendAnalyticsToWeb(string jsonData);

    private void LoadDemoData()
    {
        // Fallback demo data
        PlayerBiomechanics demo = new PlayerBiomechanics {
            playerId = "demo-001",
            sport = "baseball",
            velocity = 95.4f,
            power = 87.2f,
            efficiency = 0.92f
        };
        ProcessBiomechanicsData(demo);
    }
}
```

### 4. WebGL Build Settings

**Unity Build Configuration:**
- **Compression Format**: Brotli (best for web)
- **Code Optimization**: Master (size and speed)
- **Strip Engine Code**: Enabled
- **Managed Stripping Level**: High
- **Enable Exceptions**: None (for size reduction)
- **Data Caching**: Enabled

**Build Command:**
```bash
# Unity build command (CI/CD)
unity-editor \
    -quit \
    -batchmode \
    -projectPath ./BlazeSportsIntelUnity \
    -buildTarget WebGL \
    -executeMethod WebGLBuilder.Build \
    -logFile unity-build.log
```

### 5. HTML Integration

```html
<!-- unity-player.html -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blaze Sports Intel - Unity Player Analytics</title>
    <style>
        #unity-container {
            width: 100%;
            height: 600px;
            background: #1a1a1a;
            border-radius: 12px;
            overflow: hidden;
        }
        #unity-canvas {
            width: 100%;
            height: 100%;
        }
        #unity-loading-bar {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
        }
        .progress-bar {
            width: 300px;
            height: 20px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #ff6b00, #ff8c00);
            width: 0%;
            transition: width 0.3s ease;
        }
    </style>
</head>
<body>
    <div id="unity-container">
        <canvas id="unity-canvas"></canvas>
        <div id="unity-loading-bar">
            <div class="progress-bar">
                <div class="progress-fill" id="unity-progress"></div>
            </div>
            <p style="color: white; text-align: center; margin-top: 10px;">
                Loading Unity WebGL...
            </p>
        </div>
    </div>

    <script src="Build/BlazeSportsIntel.loader.js"></script>
    <script>
        let unityInstance = null;

        const loadingBar = document.getElementById('unity-loading-bar');
        const progressFill = document.getElementById('unity-progress');

        createUnityInstance(document.querySelector("#unity-canvas"), {
            dataUrl: "Build/BlazeSportsIntel.data.br",
            frameworkUrl: "Build/BlazeSportsIntel.framework.js.br",
            codeUrl: "Build/BlazeSportsIntel.wasm.br",
            streamingAssetsUrl: "StreamingAssets",
            companyName: "Blaze Intelligence",
            productName: "Blaze Sports Intel",
            productVersion: "3.0.0",
        }, (progress) => {
            // Update progress bar
            progressFill.style.width = `${progress * 100}%`;
        }).then((instance) => {
            window.unityInstance = instance;
            loadingBar.style.display = 'none';
            console.log('✅ Unity WebGL loaded successfully');

            // Send initial data to Unity
            initializeUnityWithData();
        }).catch((error) => {
            console.error('❌ Unity load error:', error);
            alert('Failed to load Unity WebGL. Please check console.');
        });

        async function initializeUnityWithData() {
            try {
                // Fetch player data from Blaze API
                const response = await fetch('/api/player/baseball/player-001');
                const playerData = await response.json();

                // Send to Unity
                window.unityInstance.SendMessage(
                    'GameManager',
                    'ReceivePlayerData',
                    JSON.stringify(playerData)
                );
            } catch (error) {
                console.error('Failed to initialize Unity data:', error);
            }
        }

        // Listen for messages from Unity
        window.addEventListener('message', (event) => {
            if (event.data.type === 'UNITY_ANALYTICS') {
                console.log('Unity Analytics:', event.data.payload);
                // Process Unity analytics data
                updateWebDashboard(event.data.payload);
            }
        });

        function updateWebDashboard(analyticsData) {
            // Update main dashboard with Unity-calculated metrics
            document.dispatchEvent(new CustomEvent('unityAnalytics', {
                detail: analyticsData
            }));
        }
    </script>
</body>
</html>
```

## Deployment Strategy

### 1. Build Pipeline

```yaml
# .github/workflows/unity-build.yml
name: Unity WebGL Build

on:
  push:
    branches: [main]
    paths:
      - 'unity/**'

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - uses: game-ci/unity-builder@v2
        with:
          targetPlatform: WebGL
          buildName: BlazeSportsIntel

      - name: Compress Build
        run: |
          cd build/WebGL/WebGL
          brotli -q 11 Build/*.wasm
          brotli -q 11 Build/*.js
          brotli -q 11 Build/*.data

      - name: Deploy to Cloudflare
        run: |
          npm install -g wrangler
          wrangler pages deploy build/WebGL/WebGL \
            --project-name blazesportsintel-unity \
            --branch main
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

### 2. Cloudflare Pages Configuration

```toml
# wrangler-unity.toml
name = "blazesportsintel-unity"
compatibility_date = "2025-01-01"

[site]
bucket = "./build/WebGL/WebGL"

[[routes]]
pattern = "/unity/*"
custom_domain = true

[build]
command = "echo 'Pre-built Unity files'"
cwd = "."
watch_dirs = ["build/WebGL"]

[env.production.vars]
UNITY_VERSION = "6.0.0"
COMPRESSION = "brotli"
```

### 3. Integration Points

**Main Dashboard Integration:**
```html
<!-- In blaze-3d-sports-dashboard.html -->
<div class="unity-section" style="margin-top: 2rem;">
    <h2>🎮 Immersive Player Analytics (Unity WebGL)</h2>
    <iframe
        src="/unity-player.html"
        width="100%"
        height="600px"
        frameborder="0"
        allow="accelerometer; autoplay; encrypted-media; gyroscope"
        style="border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.4);"
    ></iframe>
</div>
```

## Performance Optimization

### 1. Asset Optimization
- Use texture atlases
- Compress meshes
- LOD (Level of Detail) for player models
- Occlusion culling

### 2. Code Optimization
- Object pooling for frequently instantiated objects
- Minimize GetComponent calls
- Use coroutines for async operations
- Cache references

### 3. WebGL-Specific
- Disable audio for web (optional)
- Reduce quality settings for mobile
- Use URP with optimized settings
- Enable GPU instancing

## Testing Strategy

### Cross-Browser Testing
- ✅ Chrome 120+ (WebGPU support)
- ✅ Edge 120+
- ✅ Safari 17+ (macOS Tahoe 26)
- ✅ Firefox 141+ (Windows)
- ⚠️ Mobile Safari (iOS 26+)
- ⚠️ Chrome Android (with reduced quality)

### Performance Benchmarks
| Device | Target FPS | Load Time | Build Size |
|--------|-----------|-----------|------------|
| Desktop High-End | 60 | < 2s | 40 MB |
| Desktop Mid-Range | 45 | < 3s | 40 MB |
| Mobile High-End | 45 | < 4s | 30 MB |
| Mobile Mid-Range | 30 | < 6s | 30 MB |

## Next Steps

1. **Create Unity Project**: Set up Unity 6 project with URP
2. **Develop Player Model**: Create rigged 3D player model with biomechanics
3. **API Integration**: Implement BlazeAPIConnector.cs
4. **Build Pipeline**: Set up automated WebGL builds
5. **Deploy to Cloudflare**: Integrate with main platform
6. **Performance Testing**: Cross-browser and device testing
7. **Documentation**: Complete API docs and user guides

## Resources

- **Unity Documentation**: https://docs.unity3d.com/Manual/webgl.html
- **Babylon.js + Unity**: Can coexist on same page
- **WebAssembly Performance**: https://webassembly.org/
- **Cloudflare Workers**: https://developers.cloudflare.com/workers/

---

**Status**: Documentation Complete | Implementation Pending
**Updated**: September 29, 2025
**Author**: Blaze Sports Intel Development Team