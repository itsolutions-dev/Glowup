# Prove su Mac e iPhone

Istruzioni per provare la libreria Glowup su iPhone, con un Mac. Finora l'app è stata provata su iPhone solo dalla CI,
che apre una pagina e fa delle foto ma non tocca e non scrive niente. Qui serve una persona che la usi davvero.

**Per un telefono Android** le istruzioni sono in [`android.md`](android.md): come compilare il playground e
installarlo su un telefono collegato con il cavo, scritte per essere seguite da Claude (la persona fa solo la parte del
telefono e del cavo).

In questa cartella:

| File                                                                     | Cosa si prova                                                                |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| [`native-verification.md`](native-verification.md)                       | I **123 componenti** della libreria, uno per uno (colonne iPhone e Phone)    |
| [`android.md`](android.md)                                               | Il playground su un **telefono Android** vero, dalla compilazione alle prove |
| [`layout-editor-device-checklist.md`](layout-editor-device-checklist.md) | L'**editor di layout** (pagina `/templates/editor`): 18 passi da seguire     |

## 1. Cosa serve sul Mac (una volta sola)

- **Xcode**, dall'App Store, con la piattaforma iOS installata (Xcode la chiede al primo avvio).
- **Node 24** e **CocoaPods** (`brew install node@24 cocoapods`, oppure come preferisci).
- In Xcode → Settings → Accounts, un **Apple ID** qualsiasi. Va bene quello gratuito.

## 2. Scaricare e avviare il playground

```bash
git clone <indirizzo della repo> Glowup
cd Glowup
git checkout dev
npm ci --ignore-scripts
cd apps/playground
```

**Sul simulatore iPhone** (per tocchi, tastiera, tema scuro, rotazione):

```bash
GLOWUP_CI_APP_ID=dev.glowup.playground.prove npx expo run:ios
```

La prima volta ci vogliono 15–30 minuti. Alla fine si apre il simulatore con l'app "Glowup". Il terminale resta
aperto: è Metro, che manda il codice all'app. Se cambia il codice, l'app si aggiorna da sola.

**Su un iPhone vero**, collegato con il cavo (serve per VoiceOver, il lettore di schermo):

```bash
GLOWUP_CI_APP_ID=dev.glowup.playground.<tuonome> npx expo run:ios --device --configuration Release
```

- `<tuonome>` rende il nome dell'app unico: con un Apple ID gratuito Apple non accetta un nome già usato da altri.
- `--configuration Release` mette il codice dentro l'app. Così il telefono non deve collegarsi al Mac via rete (la
  rete dell'ufficio lo blocca).
- Sul telefono: Impostazioni → Privacy e sicurezza → **Modalità sviluppatore** attiva; poi, al primo avvio,
  Impostazioni → Generali → VPN e gestione dispositivi → autorizzare il proprio Apple ID.
- Con l'Apple ID gratuito l'app funziona per 7 giorni, poi va reinstallata con lo stesso comando.
- Se Xcode si lamenta della firma: aprire `apps/playground/ios/*.xcworkspace`, scheda **Signing & Capabilities**,
  scegliere il proprio **Team**, e rilanciare il comando.

**Da non salvare in git:** il comando crea la cartella `apps/playground/ios/` e modifica `apps/playground/package.json`.
Sono file locali. Alla fine: `git checkout -- apps/playground/package.json`, e la cartella `ios/` non va mai committata.

## 3. Come si prova un componente

1. **Trovare la pagina:** il pulsante ☰ in alto apre il menu con tutti i componenti; la lente cerca per nome.
2. **Usarlo davvero:** toccare, scrivere, aprire e chiudere, scorrere. Nella tabella "✅" vuol dire "usato", non
   "visto disegnato".
3. **Le varianti:** il pannello **Properties** della pagina cambia le prop (variante, disabilitato, errore…).
4. **Tema scuro:** l'icona con la luna in alto. **Rotazione** del simulatore: ⌘← e ⌘→.
5. **VoiceOver** (solo sul telefono vero): Impostazioni → Accessibilità → VoiceOver. Comodo: Accessibilità →
   Abbreviazioni → VoiceOver, così si accende e si spegne con tre clic del tasto laterale. Si scorre con un dito da
   un elemento all'altro e si ascolta cosa dice.

Ordine consigliato per la tabella dei componenti: campi e tastiera; dialoghi, fogli e menu; liste e dati; pulsanti
e navigazione; i gesti di PDF, pivot e grafici; poi tema scuro e rotazione su ogni pagina; VoiceOver per ultimo.
Sono circa 120 pagine, 2–5 minuti l'una: si può fare in più volte, partendo dai componenti delle prime tabelle
(quelli che usa il CRM).

Per l'editor di layout si apre la pagina `/templates/editor` e si seguono i 18 passi della checklist, con il
telefono in verticale e poi in orizzontale.

## 4. Come mandare i risultati

Basta un messaggio o un file con, per ogni componente o passo:

- **ok**, oppure
- **non va** + una foto (sul simulatore ⌘S la salva sulla Scrivania) + una frase su cosa si è visto.

Aggiungere se era il simulatore o l'iPhone vero, e il modello e la versione di iOS. Le tabelle le aggiorniamo noi,
e i difetti li correggiamo noi: non serve toccare il codice.
