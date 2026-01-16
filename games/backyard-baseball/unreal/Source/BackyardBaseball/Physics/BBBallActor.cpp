#include "Physics/BBBallActor.h"
#include "Core/BBGameMode.h"
#include "BackyardBaseball.h"
#include "Components/SphereComponent.h"
#include "Components/StaticMeshComponent.h"
#include "NiagaraComponent.h"
#include "Kismet/GameplayStatics.h"

ABBBallActor::ABBBallActor()
{
    PrimaryActorTick.bCanEverTick = true;

    CollisionSphere = CreateDefaultSubobject<USphereComponent>(TEXT("CollisionSphere"));
    CollisionSphere->SetSphereRadius(3.65f);
    CollisionSphere->SetCollisionProfileName(TEXT("OverlapAllDynamic"));
    RootComponent = CollisionSphere;

    BallMesh = CreateDefaultSubobject<UStaticMeshComponent>(TEXT("BallMesh"));
    BallMesh->SetupAttachment(CollisionSphere);

    TrailVFX = CreateDefaultSubobject<UNiagaraComponent>(TEXT("TrailVFX"));
    TrailVFX->SetupAttachment(CollisionSphere);
    TrailVFX->bAutoActivate = false;

    Velocity = FVector::ZeroVector;
    bInFlight = false;
    bHasLanded = false;
    GroundZ = 0.0f;
}

void ABBBallActor::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);

    if (!bInFlight || bHasLanded) return;

    ApplyGravity(DeltaTime);
    ApplyDrag(DeltaTime);

    FVector NewPosition = GetActorLocation() + Velocity * DeltaTime;
    CheckGroundContact(NewPosition);
    SetActorLocation(NewPosition);

    CheckBoundaries();
}

void ABBBallActor::ResetBall()
{
    SetActorLocation(StartPosition);
    Velocity = FVector::ZeroVector;
    bInFlight = false;
    bHasLanded = false;

    if (TrailVFX)
    {
        TrailVFX->Deactivate();
    }
}

void ABBBallActor::SetPitchVelocity(FVector PitchVelocity)
{
    Velocity = PitchVelocity;
    bInFlight = true;
    bHasLanded = false;

    if (TrailVFX)
    {
        TrailVFX->Activate();
    }
}

void ABBBallActor::Launch(FVector NewPosition, FVector LaunchVelocity)
{
    SetActorLocation(NewPosition);
    Velocity = LaunchVelocity;
    bInFlight = true;
    bHasLanded = false;

    if (TrailVFX)
    {
        TrailVFX->Activate();
    }

    UE_LOG(LogBackyardBaseball, Log, TEXT("Ball launched: Velocity=%s"), *Velocity.ToString());
}

void ABBBallActor::ApplyGravity(float DeltaTime)
{
    Velocity.Z -= Gravity * DeltaTime;
}

void ABBBallActor::ApplyDrag(float DeltaTime)
{
    float Speed = Velocity.Size();
    if (Speed < 1.0f) return;

    float DragForce = 0.5f * AirDensity * Speed * Speed * DragCoefficient * BallCrossSection;
    float DragAcceleration = DragForce / Mass;
    FVector DragVector = -Velocity.GetSafeNormal() * DragAcceleration * DeltaTime;

    Velocity += DragVector;
}

void ABBBallActor::CheckGroundContact(FVector& Position)
{
    if (Position.Z <= GroundZ && Velocity.Z < 0)
    {
        Position.Z = GroundZ;

        if (Velocity.Size() < 100.0f)
        {
            Velocity = FVector::ZeroVector;
            bHasLanded = true;
            DetermineLandingResult();
            return;
        }

        Velocity.Z = -Velocity.Z * BounceDamping;
        Velocity.X *= (1.0f - GroundFriction * GetWorld()->GetDeltaSeconds());
        Velocity.Y *= (1.0f - GroundFriction * GetWorld()->GetDeltaSeconds());
    }
}

void ABBBallActor::CheckBoundaries()
{
    FVector Pos = GetActorLocation();
    float DistanceFromHome = FVector2D(Pos.X, Pos.Y).Size();

    if (Pos.Z > FenceHeight && DistanceFromHome > FenceDistance)
    {
        bHasLanded = true;
        bInFlight = false;

        if (ABBGameMode* GameMode = Cast<ABBGameMode>(UGameplayStatics::GetGameMode(this)))
        {
            GameMode->OnBallLanded(EBBBallResult::HomeRun);
        }
    }
}

void ABBBallActor::DetermineLandingResult()
{
    FVector Pos = GetActorLocation();
    float DistanceFromHome = FVector2D(Pos.X, Pos.Y).Size();
    float Angle = FMath::RadiansToDegrees(FMath::Atan2(Pos.X, Pos.Y));

    EBBBallResult Result;

    if (FMath::Abs(Angle) > FoulLineAngle)
    {
        Result = EBBBallResult::Foul;
    }
    else if (DistanceFromHome > FenceDistance)
    {
        Result = EBBBallResult::HomeRun;
    }
    else if (DistanceFromHome > InfieldRadius)
    {
        Result = EBBBallResult::Hit;
    }
    else
    {
        Result = EBBBallResult::Out;
    }

    bInFlight = false;

    if (ABBGameMode* GameMode = Cast<ABBGameMode>(UGameplayStatics::GetGameMode(this)))
    {
        GameMode->OnBallLanded(Result);
    }

    UE_LOG(LogBackyardBaseball, Log, TEXT("Ball landed: Result=%d, Distance=%f"), (int32)Result, DistanceFromHome);
}

FVector ABBBallActor::PredictLandingPosition() const
{
    if (!bInFlight) return FVector::ZeroVector;

    FVector Pos = GetActorLocation();
    FVector Vel = Velocity;
    float DT = 0.1f;
    int32 MaxIterations = 100;

    for (int32 i = 0; i < MaxIterations; i++)
    {
        Vel.Z -= Gravity * DT;
        Pos += Vel * DT;

        if (Pos.Z <= GroundZ)
        {
            return FVector(Pos.X, Pos.Y, GroundZ);
        }
    }

    return FVector::ZeroVector;
}
