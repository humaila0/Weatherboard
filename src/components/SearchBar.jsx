import { useEffect, useId, useRef, useState } from 'react'
import {
  ChevronRight,
  LoaderCircle,
  RefreshCw,
  Search,
  SearchX,
  TriangleAlert,
  X,
} from 'lucide-react'
import { useCitySearch } from '../hooks/useCitySearch'
import { formatCitySubtitle } from '../utils/city'
import { validateCityQuery } from '../utils/validation'

export function SearchBar({ onSelectCity, isOnline }) {
  const {
    query,
    setQuery,
    results,
    status,
    error: searchError,
    warning,
    providerLabel,
    retry,
    reset,
  } = useCitySearch({ isOnline })

  const [open, setOpen] = useState(false)
  const [fieldError, setFieldError] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const wrapperRef = useRef(null)
  const inputRef = useRef(null)
  const touchedRef = useRef(false)
  const suppressBlurRef = useRef(false)
  const inputId = useId()
  const errorId = useId()
  const listboxId = useId()

  const trimmedQuery = query.trim()
  const showPanel = open && trimmedQuery.length >= 2
  const hasResults = status === 'success' && results.length > 0

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  useEffect(() => {
    if (!showPanel || activeIndex < 0) return
    const option = document.getElementById(`${listboxId}-option-${activeIndex}`)
    option?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex, showPanel, listboxId])

  const fieldMessage = () => {
    const validation = validateCityQuery(query)
    if (validation) return validation
    if (status === 'error') return searchError
    if (status === 'success' && results.length === 0) {
      return 'No matching city found. Try another spelling.'
    }
    return ''
  }

  const selectCity = (city) => {
    if (!city) return
    onSelectCity(city)
    reset()
    setOpen(false)
    setFieldError('')
    setActiveIndex(-1)
    touchedRef.current = false
    suppressBlurRef.current = true
    inputRef.current?.blur()
  }

  const handleChange = (event) => {
    const value = event.target.value
    setQuery(value)
    setFieldError('')
    setActiveIndex(-1)
    setOpen(value.trim().length >= 2)
  }

  const handleFocus = () => {
    touchedRef.current = true
    if (trimmedQuery.length >= 2) setOpen(true)
  }

  const handleBlur = (event) => {
    if (suppressBlurRef.current) {
      suppressBlurRef.current = false
      return
    }
    if (wrapperRef.current?.contains(event.relatedTarget)) return
    setOpen(false)
    if (!touchedRef.current) return
    setFieldError(fieldMessage())
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    touchedRef.current = true

    const validation = validateCityQuery(query)
    if (validation) {
      setFieldError(validation)
      setOpen(false)
      inputRef.current?.focus()
      return
    }

    if (status === 'loading') {
      setFieldError('')
      setOpen(true)
      return
    }

    if (status === 'error') {
      setFieldError('')
      setOpen(true)
      return
    }

    if (status === 'success' && results.length === 0) {
      setFieldError('No matching city found. Try another spelling.')
      setOpen(true)
      return
    }

    if (results.length > 0) {
      selectCity(results[activeIndex >= 0 ? activeIndex : 0])
      return
    }

    setOpen(true)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      if (!open && results.length > 0) setOpen(true)
      if (results.length > 0) {
        event.preventDefault()
        setActiveIndex((current) => (current < 0 ? 0 : (current + 1) % results.length))
      }
      return
    }

    if (event.key === 'ArrowUp') {
      if (results.length > 0) {
        event.preventDefault()
        setActiveIndex((current) => (current <= 0 ? results.length - 1 : current - 1))
      }
      return
    }

    if (event.key === 'Enter') {
      if (open && results.length > 0) {
        event.preventDefault()
        selectCity(results[activeIndex >= 0 ? activeIndex : 0])
      }
      return
    }

    if (event.key === 'Escape') {
      event.preventDefault()
      setOpen(false)
      setActiveIndex(-1)
      if (fieldError) {
        setFieldError('')
        touchedRef.current = false
      }
      inputRef.current?.blur()
      return
    }

    if (event.key === 'Tab') setOpen(false)
  }

  const handleClear = () => {
    reset()
    setFieldError('')
    setOpen(false)
    setActiveIndex(-1)
    touchedRef.current = false
    inputRef.current?.focus()
  }

  const handleRetry = () => {
    retry()
    setFieldError('')
    setOpen(true)
  }

  const liveMessage =
    trimmedQuery.length < 2
      ? ''
      : status === 'loading'
        ? 'Searching for cities.'
        : status === 'success' && results.length === 0
          ? 'No matching cities found.'
          : status === 'success'
            ? `${results.length} city suggestions available.`
            : status === 'error'
              ? searchError
              : ''

  return (
    <form
      ref={wrapperRef}
      role="search"
      className="search-form header-search"
      onSubmit={handleSubmit}
      noValidate
    >
      <label className="sr-only" htmlFor={inputId}>
        Search for a city
      </label>

      <div
        className={[
          'search-field',
          fieldError ? 'search-field--error' : '',
          showPanel ? 'search-field--open' : '',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <Search className="search-field-icon" size={18} aria-hidden="true" />
        <input
          ref={inputRef}
          id={inputId}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={showPanel}
          aria-controls={hasResults ? listboxId : undefined}
          aria-activedescendant={
            showPanel && hasResults && activeIndex >= 0
              ? `${listboxId}-option-${activeIndex}`
              : undefined
          }
          aria-invalid={fieldError ? 'true' : 'false'}
          aria-describedby={fieldError && !showPanel ? errorId : undefined}
          autoComplete="off"
          spellCheck="false"
          enterKeyHint="search"
          maxLength={80}
          placeholder="Search city or town"
          value={query}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
        />
        {query ? (
          <button
            type="button"
            className="search-clear"
            onClick={handleClear}
            aria-label="Clear city search"
          >
            <X size={15} aria-hidden="true" />
          </button>
        ) : (
          <span className="search-shortcut" aria-hidden="true">
            ↵
          </span>
        )}
      </div>

      {fieldError && !showPanel ? (
        <p className="field-error" id={errorId} role="alert">
          <TriangleAlert size={13} aria-hidden="true" />
          <span>{fieldError}</span>
        </p>
      ) : null}

      <span className="sr-only" role="status" aria-live="polite">
        {liveMessage}
      </span>

      {showPanel ? (
        <div className="search-popover">
          {warning ? (
            <div className="search-warning" role="status">
              <TriangleAlert size={14} aria-hidden="true" />
              <span>{warning}</span>
            </div>
          ) : null}

          {status === 'loading' ? (
            <div className="search-message" role="status">
              <LoaderCircle className="spin" size={19} aria-hidden="true" />
              <div>
                <strong>Searching cities…</strong>
                <p>Looking for “{trimmedQuery}”.</p>
              </div>
            </div>
          ) : null}

          {status === 'error' ? (
            <div className="search-message search-message--error" role="alert">
              <TriangleAlert size={19} aria-hidden="true" />
              <div>
                <strong>City search failed</strong>
                <p>{searchError}</p>
                {isOnline ? (
                  <button type="button" className="text-button" onClick={handleRetry}>
                    <RefreshCw size={13} aria-hidden="true" />
                    Try again
                  </button>
                ) : (
                  <p className="search-message-hint">Reconnect to search for a new city.</p>
                )}
              </div>
            </div>
          ) : null}

          {status === 'success' && results.length === 0 ? (
            <div className="search-message">
              <SearchX size={20} aria-hidden="true" />
              <div>
                <strong>No matching city found</strong>
                <p>Try a different spelling, or add the country or region name.</p>
              </div>
            </div>
          ) : null}

          {hasResults ? (
            <>
              <ul className="search-list" id={listboxId} role="listbox" aria-label="City suggestions">
                {results.map((city, index) => (
                  <li
                    key={city.key}
                    id={`${listboxId}-option-${index}`}
                    role="option"
                    aria-selected={index === activeIndex}
                    className={`search-option ${index === activeIndex ? 'is-active' : ''}`}
                    onMouseDown={(event) => event.preventDefault()}
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => selectCity(city)}
                  >
                    <span className="search-option-text">
                      <span className="search-option-name">{city.name}</span>
                      <span className="search-option-meta">{formatCitySubtitle(city)}</span>
                    </span>
                    <ChevronRight size={15} aria-hidden="true" />
                  </li>
                ))}
              </ul>
              <div className="search-footer">
                <span>{providerLabel ? `Results from ${providerLabel}` : ''}</span>
                <span className="search-hint">↑↓ navigate · Enter select</span>
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </form>
  )
}
