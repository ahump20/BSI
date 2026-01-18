#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"
#include "BBGameMode.generated.h"

UENUM(BlueprintType)
enum class EBBGamePhase : uint8
{
    Loading,
    MainMenu,
    PrePitch,
    Pitching,
    Swinging,
    BallInFlight,
    Result,
    GameOver
};

UENUM(BlueprintType)
enum class EBBBallResult : uint8
{
    HomeRun,
    Hit,
    Foul,
    Out,
    Strike,
    Ball
};

UENUM(BlueprintType)
enum class EBBPitchType : uint8
{
    Fastball,
    Changeup,
    Curveball
};

DECLARE_DYNAMIC_MULTICAST_DELEGATE_OneParam(FOnPhaseChanged, EBBGamePhase, NewPhase);
DECLARE_DYNAMIC_MULTICAST_DELEGATE_TwoParams(FOnScoreChanged, int32, Score, int32, Outs);

UCLASS()
class BACKYARDBASEBALL_API ABBGameMode : public AGameModeBase
{
    GENERATED_BODY()

public:
    ABBGameMode();

    UPROPERTY(BlueprintAssignable, Category = "Events")
    FOnPhaseChanged OnPhaseChanged;

    UPROPERTY(BlueprintAssignable, Category = "Events")
    FOnScoreChanged OnScoreChanged;

    UFUNCTION(BlueprintCallable, Category = "Game")
    void TransitionToPhase(EBBGamePhase NewPhase);

    UFUNCTION(BlueprintCallable, Category = "Game")
    void OnSwingResult(bool bHit, FVector ContactPoint, FVector ExitVelocity);

    UFUNCTION(BlueprintCallable, Category = "Game")
    void OnBallLanded(EBBBallResult Result);

    UFUNCTION(BlueprintCallable, Category = "Game")
    void OnPitchReachedPlate(bool bInStrikeZone);

    UFUNCTION(BlueprintPure, Category = "Game")
    EBBGamePhase GetCurrentPhase() const { return CurrentPhase; }

    UFUNCTION(BlueprintPure, Category = "Game")
    int32 GetScore() const { return Score; }

    UFUNCTION(BlueprintPure, Category = "Game")
    int32 GetStrikes() const { return Strikes; }

    UFUNCTION(BlueprintPure, Category = "Game")
    int32 GetBalls() const { return Balls; }

    UFUNCTION(BlueprintPure, Category = "Game")
    int32 GetOuts() const { return Outs; }

    UFUNCTION(BlueprintCallable, Category = "Game")
    EBBPitchType GetRandomPitchType() const;

protected:
    virtual void BeginPlay() override;

private:
    UPROPERTY()
    EBBGamePhase CurrentPhase;

    UPROPERTY()
    int32 Strikes;

    UPROPERTY()
    int32 Balls;

    UPROPERTY()
    int32 Score;

    UPROPERTY()
    int32 Outs;

    UPROPERTY(EditDefaultsOnly, Category = "Config")
    float PrePitchDelay = 1.5f;

    UPROPERTY(EditDefaultsOnly, Category = "Config")
    float ResultDisplayTime = 2.0f;

    UPROPERTY(EditDefaultsOnly, Category = "Config")
    int32 HomeRunPoints = 4;

    UPROPERTY(EditDefaultsOnly, Category = "Config")
    int32 HitPoints = 1;

    UPROPERTY(EditDefaultsOnly, Category = "Config")
    int32 WalkPoints = 1;

    UPROPERTY(EditDefaultsOnly, Category = "Config")
    int32 OutsPerGame = 3;

    void EnterPhase(EBBGamePhase Phase);
    void ExitPhase(EBBGamePhase Phase);
    void StartPitch();
    void ResetAtBat();
    void RegisterStrike();
    void RegisterOut();

    FTimerHandle PhaseTimerHandle;
};
