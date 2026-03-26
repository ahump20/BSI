# Unity Patterns

Unity 6 LTS patterns for 2D/3D games, mobile, VR/AR.

## MonoBehaviour Lifecycle

```
Awake()           ← Called once when script instance loads (before Start)
OnEnable()        ← Called when object becomes active
Start()           ← Called once before first Update (after all Awake calls)
FixedUpdate()     ← Called at fixed interval (physics)
Update()          ← Called every frame
LateUpdate()      ← Called after all Update calls (camera follow)
OnDisable()       ← Called when object becomes inactive
OnDestroy()       ← Called when object is destroyed
```

**Key Rule:** Use Awake for self-initialization, Start for external references.

```csharp
public class Enemy : MonoBehaviour
{
    private Rigidbody2D rb;
    private Player target;

    void Awake()
    {
        // Self-initialization - no external dependencies
        rb = GetComponent<Rigidbody2D>();
    }

    void Start()
    {
        // External references - other objects exist
        target = FindFirstObjectByType<Player>();
    }
}
```

## ScriptableObjects for Data

Store game data outside scenes. Survives play mode, version controllable, decouples data from behavior.

```csharp
[CreateAssetMenu(fileName = "WeaponData", menuName = "Game/Weapon")]
public class WeaponData : ScriptableObject
{
    public string weaponName;
    public int damage;
    public float fireRate;
    public Sprite icon;
    public AudioClip fireSound;
}

// Usage in MonoBehaviour
public class Weapon : MonoBehaviour
{
    [SerializeField] private WeaponData data;

    public void Fire()
    {
        // Use data.damage, data.fireRate, etc.
    }
}
```

**Pattern: Runtime Sets** - Track active objects without FindObjectsOfType:

```csharp
[CreateAssetMenu(menuName = "Game/Runtime Set")]
public class RuntimeSet<T> : ScriptableObject
{
    private List<T> items = new List<T>();

    public void Add(T item) => items.Add(item);
    public void Remove(T item) => items.Remove(item);
    public IReadOnlyList<T> Items => items;
}
```

## Input System (New)

Never use legacy `Input.GetKey`. Use the new Input System package.

```csharp
using UnityEngine.InputSystem;

public class PlayerController : MonoBehaviour
{
    private PlayerInput playerInput;
    private InputAction moveAction;
    private InputAction jumpAction;

    void Awake()
    {
        playerInput = GetComponent<PlayerInput>();
        moveAction = playerInput.actions["Move"];
        jumpAction = playerInput.actions["Jump"];
    }

    void Update()
    {
        Vector2 moveInput = moveAction.ReadValue<Vector2>();
        Move(moveInput);
    }

    // Called from Input System via Player Input component
    public void OnJump(InputAction.CallbackContext context)
    {
        if (context.performed) Jump();
    }
}
```

**Input Action Asset Setup:**
1. Create > Input Actions
2. Add Action Map (Player, UI)
3. Add Actions (Move, Jump, Attack)
4. Set bindings (Keyboard, Gamepad)
5. Reference via PlayerInput component

## Physics Optimization

```csharp
// Layer-based collision matrix
// Edit > Project Settings > Physics 2D > Layer Collision Matrix
// Disable unnecessary layer collisions

// Use layers instead of tags for physics
[SerializeField] private LayerMask groundLayer;

bool IsGrounded()
{
    return Physics2D.Raycast(transform.position, Vector2.down, 0.1f, groundLayer);
}

// Fixed timestep for deterministic physics
// Edit > Project Settings > Time > Fixed Timestep = 0.02 (50 FPS physics)
```

**Collision Optimization:**
- Use primitive colliders (Box, Circle, Capsule) over Mesh colliders
- Set Rigidbody2D to Kinematic for non-physics objects that need collision
- Disable unnecessary collision layers in matrix

## URP (Universal Render Pipeline)

For mobile, VR, and cross-platform. Default for new projects.

```csharp
// URP-specific features
// Shader Graph: Assets > Create > Shader Graph > URP
// 2D Renderer: Light2D, Shadow Caster 2D, Sprite Lit materials

// Post-processing via Volume component
// Add Volume to scene, create Volume Profile
// Add overrides: Bloom, Color Adjustments, Vignette
```

**Mobile URP Settings:**
- Disable HDR
- MSAA: Disabled or 2x
- Shadow Resolution: 512 or lower
- Render Scale: 0.75-1.0

## HDRP (High Definition Render Pipeline)

For high-end PC/console. Not for mobile.

**When to use HDRP:**
- Targeting PS5, Xbox Series X, high-end PC
- Need photorealistic lighting
- Ray tracing required
- Performance budget allows 60+ FPS at 1080p+ on target hardware

## Addressables

Load assets on demand instead of including everything in build.

```csharp
using UnityEngine.AddressableAssets;
using UnityEngine.ResourceManagement.AsyncOperations;

public class AssetLoader : MonoBehaviour
{
    [SerializeField] private AssetReference enemyPrefab;

    async void LoadEnemy()
    {
        AsyncOperationHandle<GameObject> handle = enemyPrefab.LoadAssetAsync<GameObject>();
        await handle.Task;

        if (handle.Status == AsyncOperationStatus.Succeeded)
        {
            Instantiate(handle.Result);
        }
    }

    void OnDestroy()
    {
        enemyPrefab.ReleaseAsset();
    }
}
```

**Addressables Benefits:**
- Smaller initial build size
- Download assets as needed
- Easy content updates without full rebuild
- Memory management (load/unload)

## Object Pooling

```csharp
public class BulletPool : MonoBehaviour
{
    [SerializeField] private GameObject bulletPrefab;
    [SerializeField] private int poolSize = 50;

    private Queue<GameObject> pool = new Queue<GameObject>();

    void Awake()
    {
        for (int i = 0; i < poolSize; i++)
        {
            GameObject bullet = Instantiate(bulletPrefab);
            bullet.SetActive(false);
            pool.Enqueue(bullet);
        }
    }

    public GameObject Get()
    {
        if (pool.Count > 0)
        {
            GameObject bullet = pool.Dequeue();
            bullet.SetActive(true);
            return bullet;
        }
        return Instantiate(bulletPrefab); // Expand if needed
    }

    public void Return(GameObject bullet)
    {
        bullet.SetActive(false);
        pool.Enqueue(bullet);
    }
}
```

## Animation State Machine

```csharp
public class CharacterAnimator : MonoBehaviour
{
    private Animator animator;
    private static readonly int IsRunning = Animator.StringToHash("IsRunning");
    private static readonly int IsJumping = Animator.StringToHash("IsJumping");
    private static readonly int AttackTrigger = Animator.StringToHash("Attack");

    void Awake()
    {
        animator = GetComponent<Animator>();
    }

    public void SetRunning(bool running) => animator.SetBool(IsRunning, running);
    public void SetJumping(bool jumping) => animator.SetBool(IsJumping, jumping);
    public void TriggerAttack() => animator.SetTrigger(AttackTrigger);
}
```

**Cache parameter hashes** - `Animator.StringToHash` is expensive per frame.

## ECS/DOTS (Data-Oriented Tech Stack)

Use for massive entity counts (10k+). Complex setup, significant performance gains.

```csharp
// Component - pure data
public struct Velocity : IComponentData
{
    public float3 Value;
}

public struct Speed : IComponentData
{
    public float Value;
}

// System - processes entities with matching components
public partial struct MovementSystem : ISystem
{
    public void OnUpdate(ref SystemState state)
    {
        float deltaTime = SystemAPI.Time.DeltaTime;

        foreach (var (transform, velocity) in
            SystemAPI.Query<RefRW<LocalTransform>, RefRO<Velocity>>())
        {
            transform.ValueRW.Position += velocity.ValueRO.Value * deltaTime;
        }
    }
}
```

**When to use DOTS:**
- 10,000+ similar entities
- CPU-bound simulation
- Willing to learn new paradigm

**When to skip DOTS:**
- <1000 entities (MonoBehaviour is fine)
- Rapid prototyping
- Team unfamiliar with ECS

## Mobile Optimization

```csharp
// Target frame rate
Application.targetFrameRate = 60; // or 30 for battery savings

// Quality settings per device
void SetQualityForDevice()
{
    int memoryMB = SystemInfo.systemMemorySize;
    if (memoryMB < 2048)
        QualitySettings.SetQualityLevel(0); // Low
    else if (memoryMB < 4096)
        QualitySettings.SetQualityLevel(1); // Medium
    else
        QualitySettings.SetQualityLevel(2); // High
}
```

**Mobile Checklist:**
- [ ] Texture compression (ASTC for modern, ETC2 fallback)
- [ ] Sprite atlases for 2D
- [ ] Audio compression (Vorbis, load on demand)
- [ ] Object pooling for frequent spawns
- [ ] Reduce draw calls (batching, atlases)
- [ ] Profile on actual low-end device

## Profiler Usage

```csharp
// Custom profiler markers
using Unity.Profiling;

static readonly ProfilerMarker s_AIMarker = new ProfilerMarker("AI.Update");

void UpdateAI()
{
    using (s_AIMarker.Auto())
    {
        // AI logic here
    }
}
```

**Profiler Window:** Window > Analysis > Profiler
- CPU: Find expensive methods
- GPU: Rendering bottlenecks
- Memory: Allocations per frame (should be near zero in gameplay)

## Common Anti-Patterns

```csharp
// BAD: GetComponent every frame
void Update()
{
    GetComponent<Rigidbody2D>().velocity = moveInput;
}

// GOOD: Cache in Awake
private Rigidbody2D rb;
void Awake() => rb = GetComponent<Rigidbody2D>();
void Update() => rb.velocity = moveInput;

// BAD: Find in Update
void Update()
{
    Player player = FindFirstObjectByType<Player>(); // Expensive!
}

// GOOD: Cache reference or use events
private Player player;
void Start() => player = FindFirstObjectByType<Player>();

// BAD: String tags
if (collision.gameObject.tag == "Enemy") { }

// GOOD: CompareTag (no allocation)
if (collision.gameObject.CompareTag("Enemy")) { }

// BAD: Instantiate/Destroy frequently
void Fire() => Instantiate(bulletPrefab);
void OnHit() => Destroy(gameObject);

// GOOD: Object pooling
void Fire() => bulletPool.Get();
void OnHit() => bulletPool.Return(gameObject);
```

## Platform Build Settings

```csharp
// Conditional compilation
#if UNITY_IOS
    // iOS-specific code
#elif UNITY_ANDROID
    // Android-specific code
#elif UNITY_STANDALONE
    // Desktop code
#endif

// Runtime platform check
if (Application.platform == RuntimePlatform.Android)
{
    // Android runtime logic
}
```

**Build Settings Path:** File > Build Settings
- Switch Platform before building
- Player Settings for icons, splash, capabilities
- Scripting Backend: IL2CPP for release, Mono for debug speed
