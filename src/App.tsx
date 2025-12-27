import { useMemo, useState } from 'react'
import { pricingSections, markupRate } from './pricingConfig'

type QuantityState = Record<string, number>

const buildInitialQuantities = (): QuantityState => {
  const state: QuantityState = {}
  pricingSections.forEach((section) => {
    section.items.forEach((item) => {
      state[item.id] = 0
    })
  })
  return state
}

const formatEuro = (value: number) =>
  value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })

const clampToInt = (value: number) => Math.max(0, Math.round(value))

function App() {
  const [quantities, setQuantities] = useState<QuantityState>(buildInitialQuantities)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const trelloCardId = useMemo(
    () => new URLSearchParams(window.location.search).get('trelloId'),
    [],
  )

  const handleToggle = (id: string) => {
    setQuantities((prev) => {
      const isActive = (prev[id] ?? 0) > 0
      return { ...prev, [id]: isActive ? 0 : 1 }
    })
  }

  const handleQuantityChange = (id: string, value: number) => {
    setQuantities((prev) => ({ ...prev, [id]: clampToInt(value) }))
  }

  const handleQuantityAdjust = (id: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[id] ?? 0
      const nextRaw = current === 0 && delta > 0 ? 1 : current + delta
      const next = clampToInt(nextRaw)
      return { ...prev, [id]: next }
    })
  }

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }))
  }

  const subtotal = useMemo(
    () =>
      pricingSections.reduce((sum, section) => {
        const sectionTotal = section.items.reduce(
          (sectionSum, item) => sectionSum + item.price * (quantities[item.id] ?? 0),
          0,
        )
        return sum + sectionTotal
      }, 0),
    [quantities],
  )

  const totalWithMarkup = Math.round((subtotal * (1 + markupRate) + Number.EPSILON) * 100) / 100

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1>Devis</h1>
        </div>
        {trelloCardId && (
          <div className="callout">
            <strong>Carte Trello détectée :</strong> {trelloCardId}
            <br />
            L’envoi automatique du devis sera ajouté à l’étape suivante.
          </div>
        )}
      </div>

      <section className="summary">
        <div className="summary-row">
          <span>Tarif</span>
          <strong>{formatEuro(subtotal)}</strong>
        </div>
        <div className="summary-row">
          <span>Tarif + {Math.round(markupRate * 100)}%</span>
          <strong>{formatEuro(totalWithMarkup)}</strong>
        </div>
      </section>

      <div className="sections">
        {pricingSections.map((section) => (
          <section key={section.id} className="card">
            <header className="card-header">
              <button
                type="button"
                className="collapse-btn"
                onClick={() => toggleSection(section.id)}
                aria-expanded={!collapsedSections[section.id]}
              >
                <span className={`chevron ${collapsedSections[section.id] ? '' : 'open'}`}>›</span>
                <h2>{section.title}</h2>
              </button>
            </header>
            {!collapsedSections[section.id] && (
              <div className="table">
                <div className="table-row table-head">
                  <div>Option</div>
                  <div>Tarif</div>
                  <div>Qté</div>
                  <div>Ligne</div>
                </div>
                {section.items.map((item) => {
                  const quantity = quantities[item.id] ?? 0
                  const active = quantity > 0
                  return (
                    <div
                      key={item.id}
                      className={`table-row ${active ? 'is-active' : ''}`}
                      role="group"
                      aria-label={item.label}
                    >
                      <label className="option-cell">
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() => handleToggle(item.id)}
                        />
                        <span>{item.label}</span>
                      </label>
                      <div className="price-cell">{formatEuro(item.price)}</div>
                      <div className="quantity-cell">
                        <div className="qty-controls">
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() => handleQuantityAdjust(item.id, -1)}
                            aria-label={`Diminuer ${item.label}`}
                          >
                            −
                          </button>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={quantity}
                            onChange={(event) =>
                              handleQuantityChange(item.id, Number(event.target.value))
                            }
                            aria-label={`Quantité pour ${item.label}`}
                          />
                          <button
                            type="button"
                            className="qty-btn"
                            onClick={() => handleQuantityAdjust(item.id, 1)}
                            aria-label={`Augmenter ${item.label}`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <div className="line-total">
                        {formatEuro(item.price * quantity)}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        ))}
      </div>
    </main>
  )
}

export default App
