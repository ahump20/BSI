extends Control

## Menu Scene Script - Original Baseball Game
## Handles main menu interaction

func _ready() -> void:
	print("Menu loaded - Original Baseball Game")

func _on_play_button_pressed() -> void:
	# TODO: Load game scene when implemented
	# get_tree().change_scene_to_file("res://scenes/Game.tscn")
	print("Play button pressed - Game scene not yet implemented")
	push_warning("Game scene is a placeholder. Implement gameplay in scenes/Game.tscn")
