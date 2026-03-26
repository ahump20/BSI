# Unreal Engine 5 Patterns

UE5 patterns for AAA-quality games: FPS, open-world, cinematic experiences.

## Blueprints vs C++

| Use Blueprints | Use C++ |
|----------------|---------|
| Prototyping, iteration | Performance-critical systems |
| Designer-facing logic | Core gameplay loops |
| Simple game logic | Complex algorithms |
| Visual scripting team | Programmer team |
| Quick changes | Systems that rarely change |

**Hybrid Approach (Recommended):**
- C++ base classes with core functionality
- Blueprint subclasses for designer tweaking
- Expose variables with UPROPERTY, functions with UFUNCTION

```cpp
UCLASS(Blueprintable)
class AWeapon : public AActor
{
    GENERATED_BODY()

public:
    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Weapon")
    int32 BaseDamage = 10;

    UPROPERTY(EditDefaultsOnly, BlueprintReadOnly, Category = "Weapon")
    float FireRate = 0.5f;

    UFUNCTION(BlueprintCallable, Category = "Weapon")
    virtual void Fire();

    UFUNCTION(BlueprintImplementableEvent, Category = "Weapon")
    void OnFire(); // Implement in Blueprint
};
```

## Actor Lifecycle

```
Constructor        ← C++ construction, no world context
PostInitProperties ← After UPROPERTY initialization
PostLoad           ← After loading from disk
BeginPlay          ← Game starts, safe for gameplay init
Tick               ← Every frame (disable if unused)
EndPlay            ← Actor removed or level unloaded
Destroyed          ← Final cleanup
```

**Key Rule:** Don't access other actors in constructor. Use BeginPlay.

## Component Architecture

```cpp
// Character with components
AMyCharacter::AMyCharacter()
{
    // Capsule collision (inherited from ACharacter)
    GetCapsuleComponent()->InitCapsuleSize(42.f, 96.0f);

    // Camera boom
    CameraBoom = CreateDefaultSubobject<USpringArmComponent>(TEXT("CameraBoom"));
    CameraBoom->SetupAttachment(RootComponent);
    CameraBoom->TargetArmLength = 400.0f;
    CameraBoom->bUsePawnControlRotation = true;

    // Camera
    FollowCamera = CreateDefaultSubobject<UCameraComponent>(TEXT("FollowCamera"));
    FollowCamera->SetupAttachment(CameraBoom, USpringArmComponent::SocketName);
    FollowCamera->bUsePawnControlRotation = false;
}
```

## Enhanced Input System

Replace legacy input. Required for UE5 projects.

```cpp
// Input Action asset: IA_Move, IA_Look, IA_Jump
// Input Mapping Context: IMC_Default

void AMyCharacter::SetupPlayerInputComponent(UInputComponent* PlayerInputComponent)
{
    UEnhancedInputComponent* EnhancedInput = Cast<UEnhancedInputComponent>(PlayerInputComponent);

    EnhancedInput->BindAction(MoveAction, ETriggerEvent::Triggered, this, &AMyCharacter::Move);
    EnhancedInput->BindAction(LookAction, ETriggerEvent::Triggered, this, &AMyCharacter::Look);
    EnhancedInput->BindAction(JumpAction, ETriggerEvent::Started, this, &ACharacter::Jump);
}

void AMyCharacter::Move(const FInputActionValue& Value)
{
    FVector2D MovementVector = Value.Get<FVector2D>();
    // Apply movement
}
```

## Gameplay Ability System (GAS)

For RPGs, action games with abilities, buffs, stats.

```cpp
// Ability System Component on character
UPROPERTY(VisibleAnywhere, BlueprintReadOnly)
UAbilitySystemComponent* AbilitySystemComponent;

// Gameplay Ability (spell, attack, etc.)
UCLASS()
class UGA_Fireball : public UGameplayAbility
{
    GENERATED_BODY()

public:
    virtual void ActivateAbility(...) override;
    virtual void EndAbility(...) override;
};

// Gameplay Effect (damage, buff, debuff)
// Created in Editor as Data Asset
// Applies modifiers to Attribute Set
```

**GAS Components:**
- AbilitySystemComponent: Hosts abilities and effects
- GameplayAbility: Individual ability (spell, attack)
- GameplayEffect: Stat modification (damage, heal, buff)
- AttributeSet: Character stats (health, mana, strength)
- GameplayTags: Hierarchical labels for filtering/state

## Nanite (Virtualized Geometry)

Automatic LOD for complex meshes. No manual LOD setup.

**Enable Nanite:**
1. Static Mesh > Details > Enable Nanite Support
2. Works automatically at runtime

**Best For:**
- Photogrammetry, scanned assets
- High-poly environment art
- Meshes with 100k+ triangles

**Not For:**
- Skeletal meshes (characters)
- Translucent materials
- World Position Offset animations

## Lumen (Global Illumination)

Real-time GI and reflections. No baking required.

**Project Settings:**
- Rendering > Global Illumination > Lumen
- Rendering > Reflections > Lumen

**Performance Tips:**
- Use Lumen Scene for large scale
- Use Lumen Detail Tracing for small props
- Software Ray Tracing for wider hardware support
- Hardware RT for highest quality (RTX required)

## World Partition (Open World)

Automatic level streaming for large worlds.

**Setup:**
1. World Settings > Enable World Partition
2. Enable Data Layers for dynamic streaming
3. Use Level Instances for repeated content (buildings)

**Key Concepts:**
- Cells: Auto-generated streaming units
- Data Layers: Group actors for manual streaming control
- Level Instances: Reusable sub-levels
- HLOD: Distance-based simplified geometry

## Behavior Trees (AI)

```cpp
// Blackboard: AI memory (target, patrol points)
// Behavior Tree: Decision logic

// Custom Task
UCLASS()
class UBTTask_FindPatrolPoint : public UBTTaskNode
{
    GENERATED_BODY()

public:
    virtual EBTNodeResult::Type ExecuteTask(UBehaviorTreeComponent& OwnerComp,
        uint8* NodeMemory) override;
};

// Custom Decorator (condition)
UCLASS()
class UBTDecorator_HasLineOfSight : public UBTDecorator
{
    GENERATED_BODY()

protected:
    virtual bool CalculateRawConditionValue(UBehaviorTreeComponent& OwnerComp,
        uint8* NodeMemory) const override;
};
```

**Behavior Tree Structure:**
```
Root
├── Selector (try children until one succeeds)
│   ├── Sequence: Attack
│   │   ├── Decorator: Has Target
│   │   ├── Task: Move To Target
│   │   └── Task: Attack
│   └── Sequence: Patrol
│       ├── Task: Find Patrol Point
│       └── Task: Move To Patrol Point
```

## Replication (Multiplayer)

```cpp
// Replicated property
UPROPERTY(ReplicatedUsing = OnRep_Health)
float Health;

UFUNCTION()
void OnRep_Health();

// Mark property for replication
void GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const override
{
    Super::GetLifetimeReplicatedProps(OutLifetimeProps);
    DOREPLIFETIME(AMyCharacter, Health);
}

// Server RPC (client calls, server executes)
UFUNCTION(Server, Reliable)
void Server_Fire();

// Client RPC (server calls, client executes)
UFUNCTION(Client, Reliable)
void Client_PlayHitEffect();

// Multicast RPC (server calls, all clients execute)
UFUNCTION(NetMulticast, Unreliable)
void Multicast_PlayExplosion();
```

## Performance Profiling

```cpp
// Stat commands in console
stat fps        // Frame rate
stat unit       // Frame time breakdown
stat game       // Game thread
stat gpu        // GPU time
stat scenerendering // Rendering stats

// Unreal Insights (detailed profiling)
// -trace=default on command line
// Session Frontend > Trace
```

**Common Bottlenecks:**
- Draw calls: Merge meshes, use instancing
- Skeletal mesh: Reduce bone count, LODs
- Physics: Simplify collision, reduce actors
- Blueprints: Nativize hot paths to C++

## Console/PC Build

```cpp
// Platform-specific code
#if PLATFORM_WINDOWS
    // Windows code
#elif PLATFORM_PS5
    // PS5 code
#elif PLATFORM_XBOXONE
    // Xbox code
#endif
```

**Shipping Checklist:**
- [ ] Shipping build configuration (not Development)
- [ ] Pak files enabled (File > Package Project > Use Pak File)
- [ ] Disable editor-only content
- [ ] Test on min-spec hardware
- [ ] Platform-specific TRCs/XRs compliance

## Common Patterns

### Singleton Subsystem

```cpp
// GameInstance subsystem - persists across levels
UCLASS()
class UMyGameSubsystem : public UGameInstanceSubsystem
{
    GENERATED_BODY()

public:
    UFUNCTION(BlueprintCallable)
    void SavePlayerData();
};

// Access from anywhere
UMyGameSubsystem* Subsystem = GetGameInstance()->GetSubsystem<UMyGameSubsystem>();
```

### Event Dispatcher

```cpp
// Delegate declaration
DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnHealthChanged, float, NewHealth);

UPROPERTY(BlueprintAssignable)
FOnHealthChanged OnHealthChanged;

// Broadcast event
OnHealthChanged.Broadcast(Health);
```

### Soft References (Async Loading)

```cpp
UPROPERTY(EditDefaultsOnly)
TSoftObjectPtr<UTexture2D> LazyTexture;

void LoadTexture()
{
    if (!LazyTexture.IsValid())
    {
        // Async load
        UAssetManager::GetStreamableManager().RequestAsyncLoad(
            LazyTexture.ToSoftObjectPath(),
            FStreamableDelegate::CreateUObject(this, &AMyActor::OnTextureLoaded)
        );
    }
}
```

## Anti-Patterns

```cpp
// BAD: Tick when not needed
void AMyActor::Tick(float DeltaTime)
{
    // Empty or rarely used
}

// GOOD: Disable tick
AMyActor::AMyActor()
{
    PrimaryActorTick.bCanEverTick = false;
}

// BAD: Hard reference everything
UPROPERTY()
UTexture2D* HugeTexture; // Always loaded

// GOOD: Soft reference
UPROPERTY()
TSoftObjectPtr<UTexture2D> HugeTexture; // Loaded on demand

// BAD: String-based lookups
AActor* Enemy = GetWorld()->GetActorByName("Enemy_01");

// GOOD: Direct reference or tag-based
TArray<AActor*> Enemies;
UGameplayStatics::GetAllActorsWithTag(GetWorld(), "Enemy", Enemies);
```
