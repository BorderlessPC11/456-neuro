/**
 * ABA: rótulos dos botões de resposta.
 * Já existia o mapeamento por key; aqui apenas traduzimos os textos de interface
 * (label/sublabel) de EN -> PT para refletir a linguagem do produto.
 */
export const RESPONSE_TYPES = [
  { key: "independent", label: "Independente", sublabel: "Sem ajuda necessária", color: "#22c55e" },
  { key: "minimal_prompt", label: "Ajuda mínima", sublabel: "Visual / gesto", color: "#facc15" },
  { key: "partial_prompt", label: "Ajuda parcial", sublabel: "Guiado(a) parcialmente", color: "#fb923c" },
  { key: "full_prompt", label: "Ajuda total", sublabel: "Mão sobre mão", color: "#ef4444" },
  { key: "no_response", label: "Sem resposta", sublabel: "Não respondeu", color: "#9ca3af" },
];

/** @type {Record<string, (typeof RESPONSE_TYPES)[number]>} */
export const RESPONSE_TYPE_BY_KEY = RESPONSE_TYPES.reduce((acc, item) => {
  acc[item.key] = item;
  return acc;
}, {});

export const RESPONSE_KEYS = RESPONSE_TYPES.map((r) => r.key);

/** Empty counts object with one entry per response key */
export function emptyResponseCounts() {
  return RESPONSE_KEYS.reduce((acc, k) => {
    acc[k] = 0;
    return acc;
  }, {});
}
