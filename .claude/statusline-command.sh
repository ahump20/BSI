#!/bin/sh
input=$(cat)

cwd=$(echo "$input" | jq -r '.workspace.current_dir // .cwd // ""')
model=$(echo "$input" | jq -r '.model.display_name // ""')
used=$(echo "$input" | jq -r '.context_window.used_percentage // empty')
session=$(echo "$input" | jq -r '.session_name // empty')

# Shorten home directory to ~
cwd=$(echo "$cwd" | sed "s|^$HOME|~|")

# Build context indicator
if [ -n "$used" ]; then
  used_int=$(printf "%.0f" "$used")
  ctx=" | ctx ${used_int}%"
else
  ctx=""
fi

# Build session indicator
if [ -n "$session" ]; then
  sess=" | $session"
else
  sess=""
fi

printf "\033[2m%s\033[0m\033[2m | %s%s%s\033[0m" "$cwd" "$model" "$ctx" "$sess"
