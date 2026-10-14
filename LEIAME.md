# MIGSummit – Landing Page (pacote HTML)

## Como abrir
- **Prévia online:** https://szeibell.github.io/migsummit/
- **Para ver:** dê dois cliques em `index.html`. Funciona offline em qualquer navegador.
- **Para publicar:** suba a pasta inteira, mantendo a estrutura, em qualquer servidor ou hospedagem estática (HubSpot File Manager, Netlify, Vercel, S3, etc.).

## Estrutura
```
index.html              página (HTML semântico, pt-BR)
css/migsummit.css       estilos: tokens do Design System MIGNOW v1.7.0 + estilos da LP
js/migsummit.js         configuração do evento, formulário, menu, analytics
assets/fonts/           Plain Light/Regular/Medium/Bold (WOFF2, subconjunto latino)
assets/img/             KV, logos, foguete e imagem de compartilhamento (og)
```
Sem frameworks, sem build e sem dependências externas.

## Configuração (início de js/migsummit.js)
| Campo | Uso |
|---|---|
| `reviewMode` | `true` (prévia) mostra Lorem ipsum onde faltam dados. `false` (produção) esconde o que não estiver preenchido. |
| `eventDate`, `eventTime`, `timezone`, `venue`, `eventFormat` | Dados do evento. Aparecem no banner e na inscrição quando preenchidos. |
| `calendar.start` / `calendar.end` | Datas ISO. Ativam "Adicionar à agenda" e o schema Event para o Google. |
| `registrationMode` | `"open"`, `"approval"` ou `"preregistration"`. Muda os botões e as mensagens. |
| `registrationEndpoint` | URL que recebe o POST JSON do formulário. Com `null`, fica em modo demonstração (nada é enviado). |
| `confirmationEmailEnabled` | `true` somente se o e-mail automático de confirmação existir. |
| `privacyUrl`, `termsUrl`, `contactEmail` | Rodapé e aviso de privacidade do formulário. |
| `speakers`, `agenda`, `faq` | As seções aparecem sozinhas quando houver conteúdo aprovado. |

## Cache
Os links de `css/migsummit.css` e `js/migsummit.js` no index.html levam `?v=...`. Mude esse número a cada atualização para que os navegadores baixem a versão nova.

## Antes de publicar
1. `reviewMode: false`.
2. Troque o título Lorem do banner (`h1` em index.html).
3. Conecte o formulário (`registrationEndpoint`) e teste um envio real.
4. Troque `og:image` por uma URL absoluta (ex.: https://seudominio.com/assets/img/og-migsummit.jpg) e adicione um favicon.
5. Analytics: os eventos `cta_click`, `form_start`, `form_submit_success`, `form_submit_error` e `share_click` vão para `window.dataLayer` (GTM/GA4), sem dados pessoais.

## HubSpot
Cole o conteúdo de index.html num template de página do Design Manager e inclua `{{ standard_header_includes }}` antes de `</head>` e `{{ standard_footer_includes }}` antes de `</body>`. Suba css, js, fontes e imagens no File Manager e atualize os caminhos. Para o formulário, use a Forms API v3 (`https://api.hsforms.com/submissions/v3/integration/submit/{portalId}/{formGuid}`), mapeando para `firstname`/`lastname`, `email`, `company` e `jobtitle`.

## Pendências do cliente
- Local ou plataforma e formato (data 11/11/2026, 14h às 18h, já configurada; horário considerado de Brasília).
- Modo de inscrição e destino do formulário (CRM).
- Política de privacidade, condições e contato oficial.
- Palestrantes (hoje o bloco mostra "Palestrantes em breve") e programação.
- Logos MIGSummit e MIGNOW em vetor (os atuais foram extraídos do KV).
- Domínio, analytics e favicon.
