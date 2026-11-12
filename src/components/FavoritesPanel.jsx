import { MapPin, Star, Trash2 } from 'lucide-react'
import { formatCitySubtitle } from '../utils/city'

export function FavoritesPanel({
  favorites,
  currentKey,
  onSelect,
  onRemove,
  storageAvailable,
  maxFavorites,
}) {
  return (
    <section className="card favorites-card" aria-labelledby="favorites-heading">
      <div className="card-header">
        <div>
          <h2 id="favorites-heading">Saved cities</h2>
          <p>
            {favorites.length} of {maxFavorites} saved
          </p>
        </div>
        <span className="card-icon" aria-hidden="true">
          <Star size={19} />
        </span>
      </div>

      {!storageAvailable ? (
        <p className="panel-notice" role="status">
          This browser is blocking local storage, so saved cities will disappear when you close the
          tab.
        </p>
      ) : null}

      {favorites.length === 0 ? (
        <div className="empty-state">
          <span className="empty-state-icon" aria-hidden="true">
            <Star size={20} />
          </span>
          <p className="empty-state-title">No saved cities yet</p>
          <p className="empty-state-copy">
            Search for a city, then tap the star on its weather card to pin it here for quick access.
          </p>
        </div>
      ) : (
        <ul className="favorites-list">
          {favorites.map((city) => {
            const isCurrent = city.key === currentKey
            return (
              <li className={`favorite-row ${isCurrent ? 'is-current' : ''}`} key={city.key}>
                <button
                  type="button"
                  className="favorite-select"
                  onClick={() => onSelect(city)}
                  aria-current={isCurrent ? 'true' : undefined}
                >
                  <span className="favorite-pin" aria-hidden="true">
                    <MapPin size={16} />
                  </span>
                  <span className="favorite-text">
                    <span className="favorite-name">{city.name}</span>
                    <span className="favorite-meta">{formatCitySubtitle(city) || 'City'}</span>
                  </span>
                </button>
                <button
                  type="button"
                  className="favorite-remove"
                  onClick={() => onRemove(city)}
                  aria-label={`Remove ${city.name} from favourites`}
                  title={`Remove ${city.name}`}
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      {favorites.length >= maxFavorites ? (
        <p className="panel-hint">Favourite limit reached. Remove a city before adding another.</p>
      ) : null}
    </section>
  )
}
