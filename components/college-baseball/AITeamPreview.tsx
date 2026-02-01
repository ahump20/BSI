'use client';

interface AITeamPreviewProps {
  teamId: string;
  teamName: string;
}

export function AITeamPreview({ teamId, teamName }: AITeamPreviewProps) {
  return (
    <div className="bg-charcoal/50 border border-border-subtle rounded-xl p-4 mt-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-burnt-orange text-xs font-semibold uppercase tracking-wider">AI Preview</span>
      </div>
      <p className="text-text-secondary text-sm">
        AI-powered team analysis for {teamName} coming soon. Stay tuned for scouting reports, matchup predictions, and performance trends.
      </p>
    </div>
  );
}
