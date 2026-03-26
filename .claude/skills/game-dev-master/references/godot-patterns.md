# Godot 4 Patterns

Godot 4 patterns for 2D games, indie projects, solo development.

## GDScript vs C#

| GDScript | C# |
|----------|-----|
| Python-like, fast iteration | Type safety, IDE support |
| Native Godot integration | Familiar for Unity devs |
| Smaller binaries | Better refactoring |
| 90% of games | Performance-critical code |

**Recommendation:** Start with GDScript. Add C# only if you need .NET libraries or have C# experience.

## Node Lifecycle

```
_init()           ← Constructor (no scene tree access)
_enter_tree()     ← Added to scene tree
_ready()          ← Node and children ready (safe for init)
_process(delta)   ← Every frame
_physics_process(delta) ← Fixed timestep
_exit_tree()      ← Removed from scene tree
```

**Key Rule:** Use `_ready()` for initialization, not `_init()`.

## Scene Tree Architecture

```
Game (Node)
├── World (Node2D)
│   ├── TileMap
│   ├── Player (CharacterBody2D)
│   │   ├── Sprite2D
│   │   ├── CollisionShape2D
│   │   └── AnimationPlayer
│   └── Enemies (Node2D)
│       └── Enemy (scene instance)
└── UI (CanvasLayer)
    ├── HUD
    └── PauseMenu
```

**Scenes are reusable:** Create Enemy.tscn, instance it multiple times.

## Signals (Event System)

Signals decouple nodes. Prefer signals over direct references.

```gdscript
# Defining signals
signal health_changed(new_health: int)
signal died

# Emitting signals
func take_damage(amount: int) -> void:
    health -= amount
    health_changed.emit(health)
    if health <= 0:
        died.emit()

# Connecting signals (in code)
func _ready() -> void:
    player.health_changed.connect(_on_player_health_changed)
    player.died.connect(_on_player_died)

func _on_player_health_changed(new_health: int) -> void:
    health_bar.value = new_health

func _on_player_died() -> void:
    show_game_over()
```

**Connect in Editor:** Node > Signals tab > Connect

## CharacterBody2D Movement

```gdscript
extends CharacterBody2D

const SPEED = 300.0
const JUMP_VELOCITY = -400.0
const GRAVITY = 980.0

func _physics_process(delta: float) -> void:
    # Gravity
    if not is_on_floor():
        velocity.y += GRAVITY * delta

    # Jump
    if Input.is_action_just_pressed("jump") and is_on_floor():
        velocity.y = JUMP_VELOCITY

    # Movement
    var direction := Input.get_axis("move_left", "move_right")
    if direction:
        velocity.x = direction * SPEED
    else:
        velocity.x = move_toward(velocity.x, 0, SPEED)

    move_and_slide()
```

## Resources (Data Objects)

Like Unity ScriptableObjects. Store data separately from nodes.

```gdscript
# weapon_data.gd
class_name WeaponData
extends Resource

@export var name: String
@export var damage: int
@export var fire_rate: float
@export var icon: Texture2D
```

Create in Editor: New Resource > WeaponData

```gdscript
# Using resource
@export var weapon_data: WeaponData

func fire() -> void:
    deal_damage(weapon_data.damage)
    await get_tree().create_timer(weapon_data.fire_rate).timeout
```

## State Machine Pattern

```gdscript
# state_machine.gd
class_name StateMachine
extends Node

@export var initial_state: State

var current_state: State
var states: Dictionary = {}

func _ready() -> void:
    for child in get_children():
        if child is State:
            states[child.name.to_lower()] = child
            child.state_machine = self

    if initial_state:
        current_state = initial_state
        current_state.enter()

func _process(delta: float) -> void:
    current_state.update(delta)

func _physics_process(delta: float) -> void:
    current_state.physics_update(delta)

func transition_to(state_name: String) -> void:
    if not states.has(state_name):
        return
    current_state.exit()
    current_state = states[state_name]
    current_state.enter()
```

```gdscript
# state.gd
class_name State
extends Node

var state_machine: StateMachine

func enter() -> void:
    pass

func exit() -> void:
    pass

func update(_delta: float) -> void:
    pass

func physics_update(_delta: float) -> void:
    pass
```

## Autoloads (Singletons)

Global scripts accessible from anywhere.

Project > Project Settings > Autoload > Add script

```gdscript
# game_manager.gd (autoload as "GameManager")
extends Node

var score: int = 0
var high_score: int = 0

signal score_changed(new_score: int)

func add_score(points: int) -> void:
    score += points
    score_changed.emit(score)
    if score > high_score:
        high_score = score
```

```gdscript
# Access from any script
func _on_enemy_killed() -> void:
    GameManager.add_score(100)
```

## Object Pooling

```gdscript
class_name ObjectPool
extends Node

@export var scene: PackedScene
@export var pool_size: int = 20

var pool: Array[Node] = []

func _ready() -> void:
    for i in range(pool_size):
        var instance = scene.instantiate()
        instance.set_process(false)
        instance.hide()
        add_child(instance)
        pool.append(instance)

func get_object() -> Node:
    for obj in pool:
        if not obj.visible:
            obj.show()
            obj.set_process(true)
            return obj
    # Pool exhausted, create new
    var instance = scene.instantiate()
    add_child(instance)
    pool.append(instance)
    return instance

func return_object(obj: Node) -> void:
    obj.hide()
    obj.set_process(false)
```

## TileMap Patterns

```gdscript
# Get tile at position
var tile_coords = tilemap.local_to_map(position)
var tile_data = tilemap.get_cell_tile_data(0, tile_coords)

# Check custom data
if tile_data and tile_data.get_custom_data("is_solid"):
    # Handle solid tile

# Procedural tile placement
for x in range(width):
    for y in range(height):
        var tile_id = noise.get_noise_2d(x, y) > 0.5
        tilemap.set_cell(0, Vector2i(x, y), source_id, atlas_coords)
```

## Animation

```gdscript
# AnimationPlayer
@onready var anim_player: AnimationPlayer = $AnimationPlayer

func play_attack() -> void:
    anim_player.play("attack")
    await anim_player.animation_finished
    # Attack animation complete

# AnimatedSprite2D (frame-based)
@onready var sprite: AnimatedSprite2D = $AnimatedSprite2D

func _physics_process(_delta: float) -> void:
    if velocity.x != 0:
        sprite.play("run")
    else:
        sprite.play("idle")
```

## Input Handling

```gdscript
# Input Map: Project > Project Settings > Input Map
# Define actions: move_left, move_right, jump, attack

func _process(_delta: float) -> void:
    # Digital input
    if Input.is_action_just_pressed("jump"):
        jump()

    # Analog input
    var move_input := Input.get_vector("move_left", "move_right", "move_up", "move_down")

func _unhandled_input(event: InputEvent) -> void:
    # For UI-ignorable input
    if event.is_action_pressed("pause"):
        toggle_pause()
```

## Export Settings

```gdscript
# Platform detection
if OS.get_name() == "Android":
    # Mobile-specific code
elif OS.get_name() == "Windows":
    # Windows code

# Feature tags
if OS.has_feature("mobile"):
    # Mobile (iOS or Android)
if OS.has_feature("pc"):
    # Desktop (Windows, macOS, Linux)
```

**Export Templates:** Editor > Manage Export Templates > Download

## Common Gotchas

```gdscript
# BAD: Accessing node before ready
var player = $Player  # May be null in _init

# GOOD: @onready annotation
@onready var player = $Player

# BAD: String node paths everywhere
get_node("../Player/Weapon/Sprite")

# GOOD: Export and assign in editor
@export var weapon_sprite: Sprite2D

# BAD: Polling for one-time events
func _process(delta):
    if health <= 0 and not dead:
        die()
        dead = true

# GOOD: Signals
health_depleted.connect(die)

# BAD: Type-unsafe code
func take_damage(amount):
    health -= amount

# GOOD: Static typing
func take_damage(amount: int) -> void:
    health -= amount
```

## Performance Tips

```gdscript
# Disable processing when not needed
set_process(false)
set_physics_process(false)

# Use groups for bulk operations
add_to_group("enemies")
get_tree().call_group("enemies", "take_damage", 10)

# Avoid get_node in loops
# Cache references in _ready()

# Use StringName for frequent comparisons
const ENEMY_GROUP := &"enemies"  # StringName literal
```

## Mobile Patterns

```gdscript
# Touch input
func _input(event: InputEvent) -> void:
    if event is InputEventScreenTouch:
        if event.pressed:
            handle_touch(event.position)

# Virtual joystick (use plugin or custom)
@export var joystick: VirtualJoystick

func _physics_process(_delta: float) -> void:
    var input_vector := joystick.get_value()
    velocity = input_vector * SPEED
```

**Mobile Export Checklist:**
- [ ] Project Settings > Rendering > Textures > VRAM Compression (ETC2/ASTC)
- [ ] Enable touch emulation for testing
- [ ] Test on actual device (USB debugging or remote)
- [ ] Check orientation settings
