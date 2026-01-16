#include "Core/BBGameMode.h"
#include "BackyardBaseball.h"
#include "TimerManager.h"

ABBGameMode::ABBGameMode()
{
    CurrentPhase = EBBGamePhase::Loading;
    Strikes = 0;
    Balls = 0;
    Score = 0;
    Outs = 0;
}

void ABBGameMode::BeginPlay()
{
    Super::BeginPlay();
    UE_LOG(LogBackyardBaseball, Log, TEXT("Game Mode BeginPlay"));
    TransitionToPhase(EBBGamePhase::PrePitch);
}

void ABBGameMode::TransitionToPhase(EBBGamePhase NewPhase)
{
    if (CurrentPhase == NewPhase) return;

    UE_LOG(LogBackyardBaseball, Log, TEXT("Phase transition: %d -> %d"), (int32)CurrentPhase, (int32)NewPhase);

    ExitPhase(CurrentPhase);
    CurrentPhase = NewPhase;
    EnterPhase(NewPhase);
    OnPhaseChanged.Broadcast(NewPhase);
}

void ABBGameMode::EnterPhase(EBBGamePhase Phase)
{
    switch (Phase)
    {
    case EBBGamePhase::PrePitch:
        GetWorldTimerManager().SetTimer(
            PhaseTimerHandle,
            this,
            &ABBGameMode::StartPitch,
            PrePitchDelay,
            false
        );
        break;

    case EBBGamePhase::Result:
        GetWorldTimerManager().SetTimer(
            PhaseTimerHandle,
            this,
            &ABBGameMode::ResetAtBat,
            ResultDisplayTime,
            false
        );
        break;

    case EBBGamePhase::GameOver:
        UE_LOG(LogBackyardBaseball, Log, TEXT("Game Over! Final Score: %d, Outs: %d"), Score, Outs);
        break;

    default:
        break;
    }
}

void ABBGameMode::ExitPhase(EBBGamePhase Phase)
{
    GetWorldTimerManager().ClearTimer(PhaseTimerHandle);
}

void ABBGameMode::StartPitch()
{
    TransitionToPhase(EBBGamePhase::Pitching);
}

void ABBGameMode::ResetAtBat()
{
    if (Outs >= OutsPerGame)
    {
        TransitionToPhase(EBBGamePhase::GameOver);
    }
    else
    {
        Strikes = 0;
        Balls = 0;
        TransitionToPhase(EBBGamePhase::PrePitch);
    }
}

void ABBGameMode::OnSwingResult(bool bHit, FVector ContactPoint, FVector ExitVelocity)
{
    if (!bHit)
    {
        RegisterStrike();
        TransitionToPhase(EBBGamePhase::Result);
        return;
    }

    UE_LOG(LogBackyardBaseball, Log, TEXT("Hit! Exit velocity: %f"), ExitVelocity.Size());
    TransitionToPhase(EBBGamePhase::BallInFlight);
}

void ABBGameMode::OnBallLanded(EBBBallResult Result)
{
    switch (Result)
    {
    case EBBBallResult::HomeRun:
        Score += HomeRunPoints;
        UE_LOG(LogBackyardBaseball, Log, TEXT("HOME RUN! Score: %d"), Score);
        break;

    case EBBBallResult::Hit:
        Score += HitPoints;
        break;

    case EBBBallResult::Foul:
        if (Strikes < 2) Strikes++;
        break;

    case EBBBallResult::Out:
        RegisterOut();
        break;

    case EBBBallResult::Strike:
        RegisterStrike();
        break;

    case EBBBallResult::Ball:
        Balls++;
        if (Balls >= 4)
        {
            Score += WalkPoints;
            Balls = 0;
            Strikes = 0;
        }
        break;
    }

    OnScoreChanged.Broadcast(Score, Outs);
    TransitionToPhase(EBBGamePhase::Result);
}

void ABBGameMode::OnPitchReachedPlate(bool bInStrikeZone)
{
    if (CurrentPhase != EBBGamePhase::Pitching) return;

    if (bInStrikeZone)
    {
        RegisterStrike();
    }
    else
    {
        Balls++;
        if (Balls >= 4)
        {
            Score += WalkPoints;
            Balls = 0;
            Strikes = 0;
        }
    }
    TransitionToPhase(EBBGamePhase::Result);
}

void ABBGameMode::RegisterStrike()
{
    Strikes++;
    UE_LOG(LogBackyardBaseball, Log, TEXT("Strike %d"), Strikes);
    if (Strikes >= 3)
    {
        RegisterOut();
    }
}

void ABBGameMode::RegisterOut()
{
    Outs++;
    Strikes = 0;
    Balls = 0;
    UE_LOG(LogBackyardBaseball, Log, TEXT("Out! Total outs: %d"), Outs);
}

EBBPitchType ABBGameMode::GetRandomPitchType() const
{
    float Roll = FMath::FRand();
    if (Roll < 0.5f) return EBBPitchType::Fastball;
    if (Roll < 0.8f) return EBBPitchType::Changeup;
    return EBBPitchType::Curveball;
}
