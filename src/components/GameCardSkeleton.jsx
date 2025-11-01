import './GameCard.css'

function GameCardSkeleton() {
  return (
    <article className="game-card game-card--skeleton" aria-hidden="true">
      <div className="skeleton skeleton--badge" />
      <div className="skeleton-team">
        <div className="skeleton-avatar" />
        <div className="skeleton-details">
          <div className="skeleton skeleton--line" />
          <div className="skeleton skeleton--line narrow" />
        </div>
        <div className="skeleton skeleton--score" />
      </div>
      <div className="skeleton-team">
        <div className="skeleton-avatar" />
        <div className="skeleton-details">
          <div className="skeleton skeleton--line" />
          <div className="skeleton skeleton--line narrow" />
        </div>
        <div className="skeleton skeleton--score" />
      </div>
      <div className="skeleton skeleton--linescore" />
      <div className="skeleton-meta">
        <div className="skeleton skeleton--chip" />
        <div className="skeleton skeleton--chip" />
        <div className="skeleton skeleton--chip short" />
      </div>
    </article>
  )
}

export default GameCardSkeleton
