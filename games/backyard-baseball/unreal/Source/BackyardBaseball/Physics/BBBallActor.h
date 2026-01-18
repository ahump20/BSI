#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Actor.h"
#include "BBBallActor.generated.h"

class UNiagaraComponent;
class USphereComponent;
class UStaticMeshComponent;

UCLASS()
class BACKYARDBASEBALL_API ABBBallActor : public AActor
{
    GENERATED_BODY()

public:
    ABBBallActor();

    UFUNCTION(BlueprintCallable, Category = "Physics")
    void Launch(FVector StartPosition, FVector LaunchVelocity);

    UFUNCTION(BlueprintCallable, Category = "Physics")
    void SetPitchVelocity(FVector PitchVelocity);

    UFUNCTION(BlueprintCallable, Category = "Physics")
    void ResetBall();

    UFUNCTION(BlueprintPure, Category = "Physics")
    FVector GetVelocity() const { return Velocity; }

    UFUNCTION(BlueprintPure, Category = "Physics")
    bool IsInFlight() const { return bInFlight; }

    UFUNCTION(BlueprintPure, Category = "Physics")
    FVector PredictLandingPosition() const;

protected:
    virtual void Tick(float DeltaTime) override;

    UPROPERTY(VisibleAnywhere, Category = "Components")
    USphereComponent* CollisionSphere;

    UPROPERTY(VisibleAnywhere, Category = "Components")
    UStaticMeshComponent* BallMesh;

    UPROPERTY(VisibleAnywhere, Category = "Components")
    UNiagaraComponent* TrailVFX;

    UPROPERTY(EditDefaultsOnly, Category = "Physics")
    float Mass = 0.145f;

    UPROPERTY(EditDefaultsOnly, Category = "Physics")
    float DragCoefficient = 0.3f;

    UPROPERTY(EditDefaultsOnly, Category = "Physics")
    float GroundFriction = 0.7f;

    UPROPERTY(EditDefaultsOnly, Category = "Physics")
    float BounceDamping = 0.4f;

    UPROPERTY(EditDefaultsOnly, Category = "Field")
    float FenceDistance = 6000.0f;

    UPROPERTY(EditDefaultsOnly, Category = "Field")
    float FenceHeight = 300.0f;

    UPROPERTY(EditDefaultsOnly, Category = "Field")
    float FoulLineAngle = 45.0f;

    UPROPERTY(EditDefaultsOnly, Category = "Field")
    float InfieldRadius = 2000.0f;

private:
    void ApplyGravity(float DeltaTime);
    void ApplyDrag(float DeltaTime);
    void CheckGroundContact(FVector& Position);
    void CheckBoundaries();
    void DetermineLandingResult();

    FVector Velocity;
    FVector StartPosition;
    bool bInFlight;
    bool bHasLanded;
    float GroundZ;

    static constexpr float Gravity = 981.0f;
    static constexpr float AirDensity = 0.001225f;
    static constexpr float BallCrossSection = 42.0f;
};
