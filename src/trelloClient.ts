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
