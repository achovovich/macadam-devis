export type TrelloConfig = {
  /** Trello API key */
  key: string
  /** Trello API token (secret) */
  token: string
  /** Default board id where cards live */
  boardId: string
}

// Copie ce fichier en trelloConfig.ts et remplis les valeurs avant de lancer l’envoi vers Trello.
export const trelloConfig: TrelloConfig = {
  key: 'YOUR_TRELLO_KEY',
  token: 'YOUR_TRELLO_TOKEN',
  boardId: 'YOUR_TRELLO_BOARD_ID',
}
