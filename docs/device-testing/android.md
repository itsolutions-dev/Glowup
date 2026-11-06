# Il playground su un telefono Android vero

Come si compila il playground e lo si installa su un telefono Android collegato al computer con il cavo, come è stato
fatto il 6/11 su un ZTE Blade A51 (Android 11, 32 bit, 2 GB) da un portatile Windows. Scritto per essere seguito
**da Claude**, passo per passo, con una persona che fa la parte fisica (la sezione 1).

Si compila la versione **Release**: il codice JavaScript è dentro l'app, quindi il telefono non ha bisogno del computer
dopo l'installazione e la velocità è quella vera (la versione di sviluppo, con Metro, è molto più lenta e i tempi non
valgono).

## 1. La parte della persona (una volta sola)

- **Sul computer:** Android Studio installato (porta con sé l'SDK di Android e Java), Node 24, il progetto scaricato sul
  ramo `dev` e installato con `npm ci --ignore-scripts` dalla radice.
- **Sul telefono:**
  1. Impostazioni → Info telefono → toccare 7 volte **Numero build** ("Ora sei uno sviluppatore").
  2. Impostazioni → Sistema → Opzioni sviluppatore → **Debug USB** attivo.
  3. Nelle stesse Opzioni sviluppatore: **Configurazione USB predefinita** → **Trasferimento file**.
- **Il cavo:** deve portare **i dati**. Molti cavi USB-C/USB-C caricano soltanto: con quelli il computer non vede niente
  (e a volte il telefono non si carica nemmeno). Collegare il cavo direttamente al computer, non a un dock.
- Al primo collegamento il telefono chiede **"Consentire debug USB?"**: spuntare "Consenti sempre" e premere OK.

## 2. Il telefono è visto?

Su Windows `adb` sta in `%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe` (su Mac in `~/Library/Android/sdk/platform-tools/`).
Con Git Bash serve `export MSYS_NO_PATHCONV=1` prima dei comandi `adb shell`, altrimenti i percorsi `/...` diventano
`C:/Program Files/Git/...`.

```bash
adb devices -l
```

- `device` → bene, avanti.
- `unauthorized` → la persona deve accettare "Consentire debug USB?" sul telefono.
- **Nessuna riga** → il computer non vede il telefono. Quasi sempre è il cavo (vedi sopra). Per esserne sicuri, su
  Windows: `Get-PnpDevice -PresentOnly | ? { $_.Class -in 'WPD','AndroidUsbDeviceClass' }` non deve essere vuoto. Se
  Windows non mostra il telefono neppure così, non è un blocco aziendale (un blocco lascerebbe il dispositivo nell'elenco
  con un errore): è il collegamento fisico.

## 3. Che telefono è

```bash
adb shell getprop ro.product.model
adb shell getprop ro.build.version.release      # versione di Android
adb shell getprop ro.product.cpu.abilist        # il processore: decide la compilazione
adb shell getprop ro.config.low_ram             # true = telefono "a poca memoria"
```

Dalla **prima voce** di `abilist` si sceglie l'architettura da compilare:

| `abilist` comincia con | `-PreactNativeArchitectures=` |
| ---------------------- | ----------------------------- |
| `arm64-v8a`            | `arm64-v8a`                   |
| `armeabi-v7a` (32 bit) | `armeabi-v7a`                 |

Per un file `.apk` da mandare a più persone: `armeabi-v7a,arm64-v8a` (va su tutti, è più grande e ci mette di più).

## 4. Il progetto Android (solo la prima volta)

Se `apps/playground/android/` non esiste ancora, lo si genera da `apps/playground`:

```bash
GLOWUP_CI_APP_ID=dev.glowup.playground.ci npx expo prebuild --platform android --no-install
git checkout -- apps/playground/package.json    # prebuild riscrive gli script android/ios: si annulla
```

`apps/playground/android/` **non va mai committato**. Per non vederlo in `git status`, aggiungere a `.git/info/exclude`
(file locale, non nel progetto) la riga `/apps/playground/android/`.

Senza `GLOWUP_CI_APP_ID` il comando si ferma a chiedere il nome dell'app: il playground non ne ha uno suo (vedi
`apps/playground/app.config.ts`).

## 5. Solo su Windows: i nomi di file troppo lunghi

La parte C++ della compilazione crea file come
`...\apps\playground\android\app\.cxx\RelWithDebInfo\<hash>\armeabi-v7a\...\C_\Users\<nome>\...\node_modules\react-native-safe-area-context\...`,
oltre i **260 caratteri** che Windows accetta. L'errore è:

```
ninja: error: mkdir(safeareacontext_autolinked_build/CMakeFiles/...): No such file or directory
```

Il rimedio che funziona, senza permessi di amministratore: in `apps/playground/android/app/build.gradle`, dentro il
blocco `android {`, subito dopo la riga `ndkVersion ...`, aggiungere (con un percorso corto nella propria cartella
utente):

```gradle
    // local: short CMake staging dir, the default path overflows Windows' 260-character limit
    externalNativeBuild { cmake { buildStagingDirectory = file("C:/Users/<nome>/gx") } }
```

È un file generato e locale: un nuovo `prebuild` cancella la riga, e va rimessa.

**Non funzionano** (provati il 5/11):

- un'unità corta con `subst G: <cartella del progetto>`: da `G:` Metro non trova `expo-router/entry` (la stessa cartella
  con due nomi);
- saltare il passo del JavaScript con `-x createBundleReleaseJsAndAssets`: il plugin di React Native non lo permette.

Rimedi definitivi, se il problema torna spesso: i percorsi lunghi di Windows (`LongPathsEnabled`, serve l'IT) oppure il
progetto in una cartella corta, per esempio `C:\g\Glowup`.

## 6. Compilare

Da `apps/playground/android`, con queste variabili (PowerShell su Windows; su Mac/Linux `export` e `./gradlew`):

```powershell
$env:JAVA_HOME = 'C:\Program Files\Android\Android Studio\jbr'
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"
$env:GLOWUP_CI_APP_ID = 'dev.glowup.playground.ci'
Remove-Item Env:EXPO_PUBLIC_NATIVE_CHECK_ROUTE, Env:CI -ErrorAction SilentlyContinue
.\gradlew.bat :app:assembleRelease -PreactNativeArchitectures=armeabi-v7a
```

- `EXPO_PUBLIC_NATIVE_CHECK_ROUTE` non deve esserci: fa saltare l'app da sola alla pagina "Native check" dopo un minuto
  (serve solo alla CI). `CI` non deve esserci: con `CI=1` Metro non si comporta come in locale.
- **Tempi:** la prima volta 20–40 minuti (tutta la parte nativa). Dopo una modifica solo JavaScript, pochi minuti.
- **Se si ferma con** `Error: UNKNOWN: unknown error, open '...\drawable-mdpi\__node_modules_exporouter_assets_reactnavigation_elements_<nome>icon.png'`:
  `expo-router` ha due immagini (`clear-icon.png` e `clear-icon@1x.png`, lo stesso per `close-icon`) che finiscono nello
  stesso file, e Windows a volte rifiuta la seconda scrittura. Non dipende dal nostro codice: **si rilancia lo stesso
  comando** (di solito va al secondo tentativo; conviene un ciclo fino a 5 volte).
- Il file esce in `apps/playground/android/app/build/outputs/apk/release/app-release.apk`. È firmato con la chiave di
  debug: va bene per installarlo a mano, non per il Play Store.

## 7. Installare e aprire

```bash
adb install -r apps/playground/android/app/build/outputs/apk/release/app-release.apk
adb shell am start -n dev.glowup.playground.ci/.MainActivity
```

Il telefono può chiedere conferma o mostrare un avviso di Play Protect ("Installa comunque"): l'app non viene dal Play
Store. Dopo l'installazione il cavo si può staccare.

## 8. Il primo controllo automatico

La pagina "Native check" misura da sola 13 cose (altezze dei campi e dei pulsanti compatti, grafici, pivot, PDF):

```bash
adb logcat -c
adb shell am start -a android.intent.action.VIEW -d glowup://native-check dev.glowup.playground.ci
# aspettare ~45 s (su un telefono lento il PDF da 300 pagine ci mette un po')
adb logcat -d | grep -o "NATIVECHECK.*"
```

Tutte **PASS**, tranne la ricerca nel PDF che può essere **PENDING** ("search is off on this device"): su Android 11–14
serve un aggiornamento di sistema (SDK extension 13) che i telefoni vecchi spesso non hanno. È previsto. Un 1 px di
differenza nelle altezze compatte è normale (densità dello schermo).

Risultati del 6/11 sul ZTE Blade A51, come riferimento: avvio dell'app ~3 s, tutte PASS, PDF da 300 pagine aperto in
848 ms, ricerca PENDING.

## 9. Poi le prove a mano

La persona usa l'app: il menu ☰ in alto, le pagine dei componenti, Charts, Pivot, PDF. Cosa provare e dove scrivere i
risultati: [`native-verification.md`](native-verification.md), colonna **"Phone"**, con una fonte nella tabella delle
fonti (modello, versione di Android, data). Da guardare in particolare: velocità, tastiera sopra i campi, tema scuro,
rotazione, TalkBack (Impostazioni → Accessibilità; se manca, "Android Accessibility Suite" dal Play Store).

### Su un Android recente (15 e oltre)

L'app è compilata per Android 16 (`targetSdk 36`) e gira anche sulle versioni successive. Prima del 6/11 nessuna
versione oltre la 15 era mai stata provata (la CI usa gli emulatori 14 e 15). Su un telefono recente:

- quasi sempre il processore è solo a 64 bit (`abilist` comincia con `arm64-v8a`): si compila `arm64-v8a`;
- la **ricerca nel PDF** deve funzionare (da Android 15 è nel sistema): è la prima prova su un telefono vero;
- da guardare: l'app disegnata **sotto le barre di sistema** (in alto l'orologio, in basso la barra dei gesti: niente
  deve finirci sotto), il **gesto indietro** (scorrere dal bordo: torna alla pagina prima, chiude un dialogo aperto) e,
  se all'apertura compare un avviso di compatibilità sulla "dimensione della pagina di memoria" (telefoni con pagine da
  16 KB), segnarlo.

## 10. Misurare quanto ci mette una pagina (facoltativo)

Fotografare lo schermo a intervalli **non funziona**: mentre il telefono è occupato a disegnare, lo schermo resta fermo
sulla pagina vecchia e sembra "pronto". Il 6/11 i tempi si sono presi dall'app stessa: un componente provvisorio in
`apps/playground/app/_layout.tsx` (mai committato) che registra l'ora all'arrivo di un deep link
(`Linking.addEventListener("url", ...)`) e la scrive nel log, con `console.log`, quando cambia `usePathname()` e dopo il
frame successivo (`requestAnimationFrame`). `console.log` arriva in logcat anche nella Release. Poi si naviga con
`adb shell am start -a android.intent.action.VIEW -d glowup://<pagina> dev.glowup.playground.ci` e si legge logcat.
Finito, `git checkout -- apps/playground/app/_layout.tsx` e si ricompila.

## Da non committare mai

`apps/playground/android/`, le modifiche a `apps/playground/package.json` fatte da `prebuild`, e qualunque riga
provvisoria di misura.
