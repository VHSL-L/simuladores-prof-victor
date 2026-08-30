# Registro de migração

## RCP

- Fonte: cópia do simulador `megacode-prof-victor-sequencial.html` disponível no contexto local.
- Estratégia: preservação integral do documento executável dentro de `public/simulators/rcp/index.html`.
- Adaptação externa: inclusão em uma rota própria por meio de um frame local responsivo.
- Lógica clínica: preservada, com uma correção solicitada pelo autor na cópia integrada para impedir repetição de epinefrina em ciclos consecutivos de 2 minutos.
- Fluxo, alternativas, feedbacks, casos, estados, traçados e resultado final: preservados.
- Timers: o simulador importado não usa temporizador.
- Áudio: o simulador importado não usa sons.
- API: nenhuma.
- Dependência do GPT Sites: nenhuma após a importação.

### Ajuste validado pelo autor

- Epinefrina: a simulação agora registra a dose anterior, exige intervalo de 3–5 minutos e apresenta a opção de não repetir a medicação quando o ciclo seguinte ocorre após apenas 2 minutos.

## Pendentes

- Ventilação Mecânica: módulo ainda não importado nesta etapa.
- Choque: módulo ainda não importado nesta etapa.
