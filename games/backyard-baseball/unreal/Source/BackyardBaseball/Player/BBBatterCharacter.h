#pragma once

#include "CoreMinimal.h"
#include "GameFramework/Character.h"
#include "InputActionValue.h"
#include "BBBatterCharacter.generated.h"

class UInputMappingContext;
class UInputAction;

UENUM(BlueprintType)
enum class EBBSwingType : uint8
{
    Normal,
    Power,
    Bunt
};

UCLASS()
class BACKYARDBASEBALL_API ABBBatterCharacter : public ACharacter
{
    GENERATED_BODY()

public:
    ABBBatterCharacter();

    UFUNCTION(BlueprintCallable, Category = "Input")
    void EnableInput(bool bEnable);

    UFUNCTION(BlueprintCallable, Category = "Swing")
    void StartSwing(EBBSwingType SwingType);

    UFUNCTION(BlueprintCallable, Category = "Swing")
    void ResetStance();

protected:
    virtual void BeginPlay() override;
    virtual void Tick(float DeltaTime) override;
    virtual void SetupPlayerInputComponent(class UInputComponent* PlayerInputComponent) override;

    UPROPERTY(EditDefaultsOnly, Category = "Input")
    UInputMappingContext* DefaultMappingContext;

    UPROPERTY(EditDefaultsOnly, Category = "Input")
    UInputAction* SwingAction;

    UPROPERTY(EditDefaultsOnly, Category = "Input")
    UInputAction* BuntAction;

    UPROPERTY(EditDefaultsOnly, Category = "Input")
    UInputAction* AimAction;

    UPROPERTY(EditDefaultsOnly, Category = "Swing")
    float BaseSwingSpeed = 3000.0f;

    UPROPERTY(EditDefaultsOnly, Category = "Swing")
    float PowerSwingMultiplier = 1.4f;

    UPROPERTY(EditDefaultsOnly, Category = "Swing")
    float BuntMultiplier = 0.3f;

    UPROPERTY(EditDefaultsOnly, Category = "Swing")
    float SwingDuration = 0.25f;

    UPROPERTY(EditDefaultsOnly, Category = "Swing")
    float PowerSwingHoldTime = 0.3f;

    UPROPERTY(VisibleAnywhere, Category = "Components")
    class UBoxComponent* BatCollider;

private:
    void OnSwingStarted(const FInputActionValue& Value);
    void OnSwingCompleted(const FInputActionValue& Value);
    void OnBuntTriggered(const FInputActionValue& Value);
    void OnAimInput(const FInputActionValue& Value);

    void UpdateSwing(float DeltaTime);
    void EndSwing(bool bHit, FVector ContactPoint, FVector ExitVelocity);
    FVector CalculateExitVelocity(FVector PitchVelocity, FVector ContactPoint);

    UFUNCTION()
    void OnBatOverlap(UPrimitiveComponent* OverlappedComponent, AActor* OtherActor,
                      UPrimitiveComponent* OtherComp, int32 OtherBodyIndex,
                      bool bFromSweep, const FHitResult& SweepResult);

    bool bInputEnabled;
    bool bIsSwinging;
    bool bSwingHeld;
    float SwingTimer;
    float SwingHoldTimer;
    float CurrentSwingSpeed;
    FVector2D AimOffset;
    EBBSwingType CurrentSwingType;
};
