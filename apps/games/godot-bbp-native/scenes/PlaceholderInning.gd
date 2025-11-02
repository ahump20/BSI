extends Node2D

func _ready():
    $Back.pressed.connect(_on_back_pressed)

func _on_back_pressed():
    get_tree().change_scene_to_file("res://scenes/Menu.tscn")
