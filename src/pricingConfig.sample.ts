export type PricingOption = {
  id: string
  label: string
  price: number
}

export type PricingSection = {
  id: string
  title: string
  items: PricingOption[]
}

export const markupRate = 0.1

export const pricingSections: PricingSection[] = [
  {
    id: 'housse',
    title: 'Housse',
    items: [
      { id: 'housse-simple-monobloc', label: 'Housse simple monobloc dès 140', price: 140 },
      {
        id: 'housse-avec-emp-monobloc',
        label: 'Housse avec empiècements monobloc',
        price: 170,
      },
      { id: 'housses-simples-bi-bloc', label: 'Housses simples bi bloc', price: 160 },
      {
        id: 'housses-emp-biblok',
        label: 'Housses avec empiècements bi bloc',
        price: 190,
      },
      { id: 'passepoil-housse', label: 'Passepoil / liseré', price: 20 },
    ],
  },
  {
    id: 'confort',
    title: 'Confort',
    items: [
      {
        id: 'confort-bultex-pilote-passager',
        label: 'Confort bultex pilote + passager',
        price: 200,
      },
      { id: 'confort-bultex-pilote', label: 'Confort bultex pilote', price: 110 },
      { id: 'confort-bultex-passager', label: 'Confort bultex passager', price: 100 },
      {
        id: 'confort-gel-pilote-passager',
        label: 'Confort gel pilote et passager',
        price: 230,
      },
      { id: 'confort-gel-pilote', label: 'Confort gel pilote', price: 135 },
      { id: 'confort-gel-passager', label: 'Confort gel passager', price: 115 },
      { id: 'rabais-mousse', label: 'Rabais de mousse', price: 90 },
      { id: 'modif-mousse', label: 'Modification mousse', price: 45 },
    ],
  },
  {
    id: 'customisations',
    title: 'Customisations',
    items: [
      {
        id: 'losanges-cotes',
        label: 'Losanges / côtes +30 / plateau',
        price: 30,
      },
      {
        id: 'losanges-doubles',
        label: 'Losanges doubles +45 / plateau',
        price: 45,
      },
      {
        id: 'nid-abeille',
        label: "Nid d'abeille +50 / plateau",
        price: 50,
      },
      { id: 'broderie', label: 'Broderie', price: 30 },
      {
        id: 'broderie-specifique',
        label: 'Broderie spécifique',
        price: 50,
      },
      {
        id: 'passepoil-lisere-custom',
        label: 'Passepoil / liseré',
        price: 20,
      },
      { id: 'dosseret-crea', label: 'Dosseret créa', price: 45 },
      {
        id: 'dossier-top-case',
        label: 'Dossier top case ou sissybar',
        price: 90,
      },
    ],
  },
  {
    id: 'contraintes',
    title: 'Contraintes',
    items: [
      { id: 'base-custom-metal', label: 'Base custom et métal', price: 35 },
      { id: 'selle-thermoformee', label: 'Selle thermoformée', price: 70 },
      { id: 'selle-collee-partiel', label: 'Selle collée partiellement', price: 20 },
      { id: 'selle-chauffante-pilote', label: 'Selle chauffante pilote si confort', price: 10 },
      {
        id: 'selle-chauffante-passager',
        label: 'Selle chauffante passager si confort',
        price: 10,
      },
    ],
  },
]
