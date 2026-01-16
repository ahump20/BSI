#include "Player/BBBatterCharacter.h"
#include "Core/BBGameMode.h"
#include "Physics/BBBallActor.h"
#include "BackyardBaseball.h"
#include "Components/BoxComponent.h"
#include "EnhancedInputComponent.h"
#include "EnhancedInputSubsystems.h"
#include "Kismet/GameplayStatics.h"

ABBBatterCharacter::ABBBatterCharacter()
{
    PrimaryActorTick.bCanEverTick = true;

    BatCollider = CreateDefaultSubobject<UBoxComponent>(TEXT("BatCollider"));
    BatCollider->SetupAttachment(GetMesh(), TEXT("BatSocket"));
    BatCollider->SetBoxExtent(FVector(50.0f, 5.0f, 5.0f));
    BatCollider->SetCollisionEnabled(ECollisionEnabled::NoCollision);
    BatCollider->OnComponentBeginOverlap.AddDynamic(this, &ABBBatterCharacter::OnBatOverlap);

    bInputEnabled = false;
    bIsSwinging = false;
    bSwingHeld = false;
    SwingTimer = 0.0f;
    SwingHoldTimer = 0.0f;
    CurrentSwingSpeed = 0.0f;
    AimOffset = FVector2D::ZeroVector;
    CurrentSwingType = EBBSwingType::Normal;
}

void ABBBatterCharacter::BeginPlay()
{
    Super::BeginPlay();

    if (APlayerController* PlayerController = Cast<APlayerController>(Controller))
    {
        if (UEnhancedInputLocalPlayerSubsystem* Subsystem =
            ULocalPlayer::GetSubsystem<UEnhancedInputLocalPlayerSubsystem>(PlayerController->GetLocalPlayer()))
        {
            if (DefaultMappingContext)
            {
                Subsystem->AddMappingContext(DefaultMappingContext, 0);
            }
        }
    }
}

void ABBBatterCharacter::Tick(float DeltaTime)
{
    Super::Tick(DeltaTime);

    if (bSwingHeld)
    {
        SwingHoldTimer += DeltaTime;
    }

    if (bIsSwinging)
    {
        UpdateSwing(DeltaTime);
    }
}

void ABBBatterCharacter::SetupPlayerInputComponent(UInputComponent* PlayerInputComponent)
{
    Super::SetupPlayerInputComponent(PlayerInputComponent);

    if (UEnhancedInputComponent* EnhancedInputComponent = CastChecked<UEnhancedInputComponent>(PlayerInputComponent))
    {
        if (SwingAction)
        {
            EnhancedInputComponent->BindAction(SwingAction, ETriggerEvent::Started, this, &ABBBatterCharacter::OnSwingStarted);
            EnhancedInputComponent->BindAction(SwingAction, ETriggerEvent::Completed, this, &ABBBatterCharacter::OnSwingCompleted);
        }

        if (BuntAction)
        {
            EnhancedInputComponent->BindAction(BuntAction, ETriggerEvent::Triggered, this, &ABBBatterCharacter::OnBuntTriggered);
        }

        if (AimAction)
        {
            EnhancedInputComponent->BindAction(AimAction, ETriggerEvent::Triggered, this, &ABBBatterCharacter::OnAimInput);
        }
    }
}

void ABBBatterCharacter::EnableInput(bool bEnable)
{
    bInputEnabled = bEnable;
    if (!bEnable)
    {
        bIsSwinging = false;
        BatCollider->SetCollisionEnabled(ECollisionEnabled::NoCollision);
    }
}

void ABBBatterCharacter::OnSwingStarted(const FInputActionValue& Value)
{
    if (!bInputEnabled || bIsSwinging) return;

    bSwingHeld = true;
    SwingHoldTimer = 0.0f;
}

void ABBBatterCharacter::OnSwingCompleted(const FInputActionValue& Value)
{
    if (!bInputEnabled || bIsSwinging) return;

    bSwingHeld = false;

    if (SwingHoldTimer >= PowerSwingHoldTime)
    {
        StartSwing(EBBSwingType::Power);
    }
    else
    {
        StartSwing(EBBSwingType::Normal);
    }
}

void ABBBatterCharacter::OnBuntTriggered(const FInputActionValue& Value)
{
    if (!bInputEnabled || bIsSwinging) return;

    StartSwing(EBBSwingType::Bunt);
}

void ABBBatterCharacter::OnAimInput(const FInputActionValue& Value)
{
    if (!bInputEnabled) return;

    FVector2D Input = Value.Get<FVector2D>();
    AimOffset.X = FMath::Clamp(AimOffset.X + Input.X * 0.5f, -30.0f, 30.0f);
    AimOffset.Y = FMath::Clamp(AimOffset.Y + Input.Y * 0.5f, -30.0f, 30.0f);
}

void ABBBatterCharacter::StartSwing(EBBSwingType SwingType)
{
    bIsSwinging = true;
    SwingTimer = 0.0f;
    CurrentSwingType = SwingType;

    BatCollider->SetCollisionEnabled(ECollisionEnabled::QueryOnly);

    switch (SwingType)
    {
    case EBBSwingType::Power:
        CurrentSwingSpeed = BaseSwingSpeed * PowerSwingMultiplier;
        break;
    case EBBSwingType::Bunt:
        CurrentSwingSpeed = BaseSwingSpeed * BuntMultiplier;
        break;
    default:
        CurrentSwingSpeed = BaseSwingSpeed;
        break;
    }

    if (ABBGameMode* GameMode = Cast<ABBGameMode>(UGameplayStatics::GetGameMode(this)))
    {
        GameMode->TransitionToPhase(EBBGamePhase::Swinging);
    }

    UE_LOG(LogBackyardBaseball, Log, TEXT("Swing started: Type=%d, Speed=%f"), (int32)SwingType, CurrentSwingSpeed);
}

void ABBBatterCharacter::UpdateSwing(float DeltaTime)
{
    SwingTimer += DeltaTime;

    if (SwingTimer >= SwingDuration)
    {
        EndSwing(false, FVector::ZeroVector, FVector::ZeroVector);
    }
}

void ABBBatterCharacter::OnBatOverlap(UPrimitiveComponent* OverlappedComponent, AActor* OtherActor,
                                       UPrimitiveComponent* OtherComp, int32 OtherBodyIndex,
                                       bool bFromSweep, const FHitResult& SweepResult)
{
    if (!bIsSwinging) return;

    ABBBallActor* Ball = Cast<ABBBallActor>(OtherActor);
    if (!Ball) return;

    FVector ContactPoint = SweepResult.ImpactPoint;
    FVector ExitVelocity = CalculateExitVelocity(Ball->GetVelocity(), ContactPoint);

    Ball->Launch(ContactPoint, ExitVelocity);
    EndSwing(true, ContactPoint, ExitVelocity);
}

FVector ABBBatterCharacter::CalculateExitVelocity(FVector PitchVelocity, FVector ContactPoint)
{
    float SwingProgress = SwingTimer / SwingDuration;
    float SpeedMultiplier = FMath::Sin(SwingProgress * PI);

    FVector BatDirection = GetActorForwardVector();
    FVector AimAdjustment = FVector(
        FMath::Sin(FMath::DegreesToRadians(AimOffset.X)),
        0.0f,
        FMath::Sin(FMath::DegreesToRadians(AimOffset.Y))
    );

    FVector LaunchDirection = (BatDirection + AimAdjustment).GetSafeNormal();
    LaunchDirection.Z = FMath::Max(LaunchDirection.Z, 0.2f);

    float CombinedSpeed = CurrentSwingSpeed * SpeedMultiplier;
    float PitchContribution = PitchVelocity.Size() * 0.3f;
    float ExitSpeed = (CombinedSpeed + PitchContribution) * 0.55f;

    return LaunchDirection * ExitSpeed;
}

void ABBBatterCharacter::EndSwing(bool bHit, FVector ContactPoint, FVector ExitVelocity)
{
    bIsSwinging = false;
    BatCollider->SetCollisionEnabled(ECollisionEnabled::NoCollision);

    if (ABBGameMode* GameMode = Cast<ABBGameMode>(UGameplayStatics::GetGameMode(this)))
    {
        GameMode->OnSwingResult(bHit, ContactPoint, ExitVelocity);
    }

    UE_LOG(LogBackyardBaseball, Log, TEXT("Swing ended: Hit=%d, ExitSpeed=%f"), bHit, ExitVelocity.Size());
}

void ABBBatterCharacter::ResetStance()
{
    AimOffset = FVector2D::ZeroVector;
    bIsSwinging = false;
    BatCollider->SetCollisionEnabled(ECollisionEnabled::NoCollision);
}
