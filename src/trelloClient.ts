import { trelloConfig } from './trelloConfig'

const API_ROOT = 'https://api.trello.com/1'

type TrelloError = {
  message: string
}

const ensureConfig = () => {
  if (!trelloConfig.key || !trelloConfig.token) {
    throw new Error('Clé ou token Trello manquant dans trelloConfig.ts')
  }
}

export const addCommentToCard = async (cardId: string, text: string) => {
  ensureConfig()
  const params = new URLSearchParams({
    key: trelloConfig.key,
    token: trelloConfig.token,
    text,
  })

  const response = await fetch(`${API_ROOT}/cards/${cardId}/actions/comments?${params.toString()}`, {
    method: 'POST',
  })

  if (!response.ok) {
    const errorText = await response.text()
    let details: string | undefined
    try {
      const parsed: TrelloError = JSON.parse(errorText)
      details = parsed.message
    } catch {
      details = errorText
    }
    throw new Error(`Erreur Trello (${response.status}): ${details}`)
  }

  return response.json()
}

type CreateCardInput = {
  name: string
  desc?: string
  listId?: string
}

export const createCard = async ({ name, desc, listId }: CreateCardInput) => {
  ensureConfig()
  const idList = listId ?? (trelloConfig as typeof trelloConfig & { listId?: string }).listId
  if (!idList) {
    throw new Error('Aucun listId Trello configuré dans trelloConfig.ts')
  }

  const params = new URLSearchParams({
    key: trelloConfig.key,
    token: trelloConfig.token,
    idList,
    name,
  })

  if (desc) params.append('desc', desc)

  const response = await fetch(`${API_ROOT}/cards?${params.toString()}`, {
    method: 'POST',
  })

  if (!response.ok) {
    const errorText = await response.text()
    let details: string | undefined
    try {
      const parsed: TrelloError = JSON.parse(errorText)
      details = parsed.message
    } catch {
      details = errorText
    }
    throw new Error(`Erreur Trello (${response.status}): ${details}`)
  }

  return (await response.json()) as { id: string; shortUrl?: string }
}

export const updateCardDescription = async (cardId: string, desc: string) => {
  ensureConfig()
  const params = new URLSearchParams({
    key: trelloConfig.key,
    token: trelloConfig.token,
    desc,
  })

  const response = await fetch(`${API_ROOT}/cards/${cardId}?${params.toString()}`, {
    method: 'PUT',
  })

  if (!response.ok) {
    const errorText = await response.text()
    let details: string | undefined
    try {
      const parsed: TrelloError = JSON.parse(errorText)
      details = parsed.message
    } catch {
      details = errorText
    }
    throw new Error(`Erreur Trello (${response.status}): ${details}`)
  }

  return response.json()
}
