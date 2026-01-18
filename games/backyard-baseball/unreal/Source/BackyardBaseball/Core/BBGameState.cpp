#include "Core/BBGameState.h"
#include "Net/UnrealNetwork.h"

ABBGameState::ABBGameState()
{
    CurrentPhase = EBBGamePhase::Loading;
    Score = 0;
    Strikes = 0;
    Balls = 0;
    Outs = 0;
    Inning = 1;
}

void ABBGameState::GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const
{
    Super::GetLifetimeReplicatedProps(OutLifetimeProps);

    DOREPLIFETIME(ABBGameState, CurrentPhase);
    DOREPLIFETIME(ABBGameState, Score);
    DOREPLIFETIME(ABBGameState, Strikes);
    DOREPLIFETIME(ABBGameState, Balls);
    DOREPLIFETIME(ABBGameState, Outs);
    DOREPLIFETIME(ABBGameState, Inning);
}

FString ABBGameState::GetCountString() const
{
    return FString::Printf(TEXT("%d-%d"), Balls, Strikes);
}

FString ABBGameState::GetInningString() const
{
    return FString::Printf(TEXT("Inning %d"), Inning);
}

void ABBGameState::OnRep_GamePhase()
{
}

void ABBGameState::OnRep_Score()
{
}
