#pragma once

#include "CoreMinimal.h"
#include "GameFramework/GameStateBase.h"
#include "BBGameMode.h"
#include "BBGameState.generated.h"

UCLASS()
class BACKYARDBASEBALL_API ABBGameState : public AGameStateBase
{
    GENERATED_BODY()

public:
    ABBGameState();

    UPROPERTY(BlueprintReadOnly, ReplicatedUsing = OnRep_GamePhase, Category = "Game")
    EBBGamePhase CurrentPhase;

    UPROPERTY(BlueprintReadOnly, ReplicatedUsing = OnRep_Score, Category = "Game")
    int32 Score;

    UPROPERTY(BlueprintReadOnly, Replicated, Category = "Game")
    int32 Strikes;

    UPROPERTY(BlueprintReadOnly, Replicated, Category = "Game")
    int32 Balls;

    UPROPERTY(BlueprintReadOnly, Replicated, Category = "Game")
    int32 Outs;

    UPROPERTY(BlueprintReadOnly, Replicated, Category = "Game")
    int32 Inning;

    UFUNCTION(BlueprintPure, Category = "Game")
    FString GetCountString() const;

    UFUNCTION(BlueprintPure, Category = "Game")
    FString GetInningString() const;

protected:
    virtual void GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const override;

    UFUNCTION()
    void OnRep_GamePhase();

    UFUNCTION()
    void OnRep_Score();
};
