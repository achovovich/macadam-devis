import { useMemo, useState } from 'react'
import { pricingSections, markupRate } from './pricingConfig'
import { addCommentToCard, createCard, updateCardDescription } from './trelloClient'
import { trelloConfig } from './trelloConfig'

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
  const [trelloStatus, setTrelloStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [trelloError, setTrelloError] = useState<string | null>(null)
  const initialTrelloCardId = useMemo(
    () => new URLSearchParams(window.location.search).get('trelloId'),
    [],
  )
  const [trelloCardId, setTrelloCardId] = useState<string | null>(initialTrelloCardId)
  const [showNewClientModal, setShowNewClientModal] = useState(false)
  const [newClientError, setNewClientError] = useState<string | null>(null)
  const [createStatus, setCreateStatus] = useState<'idle' | 'loading'>('idle')
  const [newClient, setNewClient] = useState({
    title: '',
    description: '',
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
  })

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

  const handleReset = () => {
    setQuantities(buildInitialQuantities())
    setCollapsedSections({})
    setTrelloStatus('idle')
    setTrelloError(null)
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

  const selectedLines = useMemo(
    () =>
      pricingSections.flatMap((section) =>
        section.items
          .filter((item) => (quantities[item.id] ?? 0) > 0)
          .map((item) => ({
            section: section.title,
            label: item.label,
            quantity: quantities[item.id] ?? 0,
            lineTotal: item.price * (quantities[item.id] ?? 0),
          })),
      ),
    [quantities],
  )

  const handleSendToTrello = async () => {
    if (!trelloCardId) return
    if (selectedLines.length === 0) {
      setTrelloError('Aucune option selectionnee.')
      setTrelloStatus('error')
      return
    }
    setTrelloStatus('loading')
    setTrelloError(null)
    const linesText = selectedLines
      .map(
        (line) =>
          `- ${line.label} (${line.section}) x${line.quantity}: ${formatEuro(line.lineTotal)}`,
      )
      .join('\n')

    const comment = [
      'Devis rapide',
      `Total: ${formatEuro(subtotal)}`,
      `Total + ${Math.round(markupRate * 100)}%: ${formatEuro(totalWithMarkup)}`,
      '',
      'Detail :',
      linesText,
    ].join('\n')

    try {
      await addCommentToCard(trelloCardId, comment)
      setTrelloStatus('success')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue'
      setTrelloError(message)
      setTrelloStatus('error')
    }
  }

  const handleNewClientInput = (field: keyof typeof newClient, value: string) => {
    setNewClient((prev) => ({ ...prev, [field]: value }))
  }

  const handleCreateCard = async () => {
    if (!newClient.title.trim()) {
      setNewClientError('Le titre est obligatoire.')
      return
    }
    setNewClientError(null)
    setCreateStatus('loading')

    const contactLines = [
      `Nom: ${newClient.lastName || '-'}`,
      `Prenom: ${newClient.firstName || '-'}`,
      `Telephone: ${newClient.phone || '-'}`,
      `Email: ${newClient.email || '-'}`,
    ]

    const desc = [newClient.description.trim(), '', 'Contact :', ...contactLines].join('\n')
    const suffix = newClient.lastName.trim() ? ` - ${newClient.lastName.trim()}` : ''

    try {
      const card = await createCard({
        name: `${newClient.title.trim()}${suffix}`,
        desc,
      })

      const baseUrl = (trelloConfig as typeof trelloConfig & { formBaseUrl?: string }).formBaseUrl
      if (baseUrl) {
        const link = `${baseUrl}?trelloId=${encodeURIComponent(card.id)}`
        const updatedDesc = `${desc}\n\nFormulaire: ${link}`
        try {
          await updateCardDescription(card.id, updatedDesc)
        } catch {
          // ignore description update failure
        }
      }

      setTrelloCardId(card.id)
      setShowNewClientModal(false)
      setCreateStatus('idle')
      setTrelloStatus('idle')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erreur inconnue'
      setNewClientError(message)
      setCreateStatus('idle')
    }
  }

  return (
    <main className="page">
      <div className="page-header">
        <div>
          <h1
            role="button"
            tabIndex={0}
            onClick={() => window.location.reload()}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') window.location.reload()
            }}
          >
            Devis {trelloCardId ? <span className="muted">({trelloCardId})</span> : null}
          </h1>
        </div>
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
        {trelloCardId && (
          <div className="summary-actions">
            <button
              type="button"
              className="primary-btn"
              onClick={handleSendToTrello}
              disabled={trelloStatus === 'loading'}
            >
              {trelloStatus === 'loading'
                ? 'Envoi en cours...'
                : trelloStatus === 'success'
                  ? 'Envoye a Trello'
                  : 'Envoyer sur Trello'}
            </button>
            {trelloError && <p className="error">{trelloError}</p>}
            {trelloStatus === 'success' && <p className="success">Commentaire ajoute ✅</p>}
          </div>
        )}
        {!trelloCardId && (
          <div className="summary-actions">
            <button
              type="button"
              className="primary-btn"
              onClick={() => setShowNewClientModal(true)}
              disabled={createStatus === 'loading'}
            >
              {createStatus === 'loading' ? 'Creation en cours...' : 'Nouveau client'}
            </button>
            {newClientError && <p className="error">{newClientError}</p>}
          </div>
        )}
        <div className="summary-actions">
          <button type="button" className="secondary-btn" onClick={handleReset}>
            Reset
          </button>
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
                  <div>Qte</div>
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
                            aria-label={`Quantite pour ${item.label}`}
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
                      <div className="line-total">{formatEuro(item.price * quantity)}</div>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        ))}
      </div>

      {showNewClientModal && (
        <div className="modal-backdrop" role="dialog" aria-modal="true">
          <div className="modal">
            <header className="modal-header">
              <h3>Nouveau client</h3>
            </header>
            <div className="modal-body">
              <label className="field">
                <span>Titre *</span>
                <input
                  type="text"
                  value={newClient.title}
                  onChange={(e) => handleNewClientInput('title', e.target.value)}
                />
              </label>
              <label className="field">
                <span>Description</span>
                <textarea
                  rows={3}
                  value={newClient.description}
                  onChange={(e) => handleNewClientInput('description', e.target.value)}
                />
              </label>
              <div className="field-grid">
                <label className="field">
                  <span>Prenom</span>
                  <input
                    type="text"
                    value={newClient.firstName}
                    onChange={(e) => handleNewClientInput('firstName', e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Nom</span>
                  <input
                    type="text"
                    value={newClient.lastName}
                    onChange={(e) => handleNewClientInput('lastName', e.target.value)}
                  />
                </label>
              </div>
              <div className="field-grid">
                <label className="field">
                  <span>Telephone</span>
                  <input
                    type="tel"
                    value={newClient.phone}
                    onChange={(e) => handleNewClientInput('phone', e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Email</span>
                  <input
                    type="email"
                    value={newClient.email}
                    onChange={(e) => handleNewClientInput('email', e.target.value)}
                  />
                </label>
              </div>
              {newClientError && <p className="error">{newClientError}</p>}
            </div>
            <footer className="modal-footer">
              <button
                type="button"
                className="secondary-btn"
                onClick={() => {
                  setShowNewClientModal(false)
                  setNewClientError(null)
                }}
                disabled={createStatus === 'loading'}
              >
                Annuler
              </button>
              <button
                type="button"
                className="primary-btn"
                onClick={handleCreateCard}
                disabled={createStatus === 'loading'}
              >
                {createStatus === 'loading' ? 'Ajout en cours...' : 'Ajouter dans Trello'}
              </button>
            </footer>
          </div>
        </div>
      )}
    </main>
  )
}

export default App
