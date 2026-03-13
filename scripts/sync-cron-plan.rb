#!/usr/bin/env ruby
# frozen_string_literal: true

require 'yaml'
require 'set'

ROOT = File.expand_path('..', __dir__)
PLAN_PATH = File.join(ROOT, 'infra/cloudflare/cron-triggers.yaml')
MODE = ARGV.include?('--check') ? :check : :write

unless File.exist?(PLAN_PATH)
  warn "Missing cron plan: #{PLAN_PATH}"
  exit 1
end

plan = YAML.load_file(PLAN_PATH)
workers = plan['workers'] || []
errors = []
updates = []


def sync_section(content, section_name, cron_line)
  section_regex = /^\[#{Regexp.escape(section_name)}\]\n(?<body>.*?)(?=^\[|\z)/m
  match = section_regex.match(content)
  return [content, false] unless match

  body = match[:body]
  new_body = if body.match?(/^\s*crons\s*=.*$/)
               body.gsub(/^\s*crons\s*=.*$/, cron_line)
             else
               "#{cron_line}\n#{body}"
             end

  return [content, false] if new_body == body

  [content.sub(section_regex, "[#{section_name}]\n#{new_body}"), true]
end

workers.each do |worker|
  config_rel = worker['wrangler_config']
  env = worker['env']
  schedules = worker['schedules'] || []

  if config_rel.nil? || config_rel.empty?
    errors << "Worker #{worker['name'] || '(unnamed)'} missing wrangler_config"
    next
  end

  config_path = File.join(ROOT, config_rel)
  unless File.exist?(config_path)
    errors << "Referenced wrangler config not found: #{config_rel}"
    next
  end

  crons = []
  seen = Set.new
  schedules.each do |schedule|
    cron = schedule['cron']
    next if cron.nil? || cron.empty? || seen.include?(cron)

    seen << cron
    crons << cron
  end

  cron_line = "crons = [#{crons.map { |c| '"' + c + '"' }.join(', ')}]"

  original = File.read(config_path)
  updated = original.dup
  changed = false

  updated, section_changed = sync_section(updated, 'triggers', cron_line)
  changed ||= section_changed

  if env
    updated, section_changed = sync_section(updated, "env.#{env}.triggers", cron_line)
    changed ||= section_changed
  end

  next unless changed

  if MODE == :write
    File.write(config_path, updated)
    updates << "updated #{config_rel}"
  else
    updates << "out-of-sync #{config_rel}"
  end
end

if errors.any?
  errors.each { |err| warn err }
  exit 1
end

if MODE == :check && updates.any?
  updates.each { |line| warn line }
  warn 'Cron plan check failed: run `ruby scripts/sync-cron-plan.rb` and commit the changes.'
  exit 1
end

puts(updates.empty? ? 'Cron plan already in sync.' : updates.join("\n"))
