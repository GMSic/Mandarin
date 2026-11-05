# Mandarin — Translate & understand

A replacement for GMSic/Mandarin's `index.html`, with a Google Translate-inspired two-pane interface and a character explorer. The supplied link ended in `index.htmlh`; the actual repository file is `index.html`. This package is a local replacement; it has not been committed or deployed to your GitHub repository.

## What it does

- English ↔ Mandarin dictionary lookup, simplified and traditional characters, tone-mark pinyin.
- Live English, Chinese and pinyin suggestions, including `nihao`, `ni3 hao3`, and `nǐ hǎo`.
- Click words, individual characters, and components to explore meanings.
- Expand radicals and components for a source-provided decomposition and explanation when available.
- Paste sentences for a word-by-word study gloss. Unknown words remain visible.
- Optional browser Mandarin speech and copying for word results.
- No LLM, API account, secret, paid service, external font, or JavaScript dependency.

**This is a dictionary learning tool, not a fluent sentence translator.** Dictionaries cannot reliably choose contextual senses, grammar, or Chinese word order. Longest-match segmentation can be ambiguous, English inflections may be missing, and pinyin gives dictionary readings rather than contextual tone changes. It deliberately does not disguise assembled word meanings as a natural translation. If fluent sentence translation becomes necessary, add a separate, explicitly labeled non-LLM translation engine with its own server; it is not part of this version.

## How the app works

`index.html` provides the interface. `worker.js` fetches both bundled dictionaries from your own site at startup and builds search indexes away from the interface thread. CC-CEDICT supplies word definitions, traditional/simplified pairs, and numbered pinyin. Make Me a Hanzi supplies character definitions, radicals, structural decomposition, and available etymology notes. Character cards expose both sources where available. The interface converts numbered pinyin to tone marks.

Search queries stay in the browser. The app searches local copies of multiple open sources, rather than calling third-party dictionary APIs for every keystroke. This avoids API keys, rate limits and cross-origin failures. It downloads the datasets on first load (about 13 MB uncompressed; host compression can reduce this). Normal HTTP caching may help subsequent visits, but this is not an installable offline app. It does not install a service worker.

Radicals and components are distinguished: the dictionary radical is an indexing component, while other components can contribute meaning or pronunciation. Missing definitions and historical explanations are explicitly marked. The app does not invent mnemonics or claim a component's modern meaning proves a character's origin.

The old `oa_key` and `oa_model` browser storage values are removed on this origin when the new app loads. Optional audio is supplied by the browser/OS, can require a Mandarin voice, and may use network speech services. Dictionary lookup itself sends no input to third parties.

## Deploy to your existing GitHub Pages repository

1. Unzip this package. Open your existing [GMSic/Mandarin repository](https://github.com/GMSic/Mandarin).
2. Replace the repository's **`index.html`** with this package's `index.html`.
3. Add **`worker.js` and the entire `data/` folder beside it**. Preserve the data license notices. Optionally also add `scripts/`, `tests/`, and this README for maintenance. Do not upload only the HTML file and do not name it `index.htmlh`.
4. Commit the files to `main`. Using a local Git checkout is easiest for the large dictionaries; GitHub's Add file → Upload files also accepts the individual files and folder contents within its upload limits.
5. In the repository, open **Settings → Pages**. Under **Build and deployment**, select **Deploy from a branch**, then **main** and **/(root)**, and Save. If Pages is already configured this way, committing the replacement is enough.
6. Wait for the Pages deployment to finish in Actions. Your expected project URL is `https://gmsic.github.io/Mandarin/` unless you have configured a custom domain. This is an expected URL, not a deployment verified by this package.
7. Open the published page. Confirm the status says the dictionaries are ready. Look up Friday, select 星 in 星期五, expand its components, and try 我喜欢学习中文。.

All paths are relative, so the app works under the `/Mandarin/` project path. There is no build step or backend. Any static host that serves HTML, JavaScript and JSON correctly can host it.

GitHub's official setup guide: https://docs.github.com/en/pages/quickstart

## Run locally

Open a terminal in the unpacked `mandarin` folder:

```sh
python3 -m http.server 8000
```

Then visit http://localhost:8000. Stop with Ctrl+C. Do not double-click `index.html`: file URLs commonly block workers and dictionary fetches.

## Refresh dictionary sources

The package already includes real data; this is optional maintenance:

```sh
python3 scripts/update_data.py
node tests/dictionary.cjs
```

Commit the updated `data/` files and notice to redeploy. The refresh script downloads CC-CEDICT's public export and Make Me a Hanzi's raw dataset; it does not scrape dictionary search pages. It validates the downloads before overwriting data. Keep the license files with every release.

## Files and licenses

- `index.html`: interface, pinyin formatting, interaction, audio, and rendering.
- `worker.js`: lookup, suggestions, sentence segmentation and character queries.
- `data/cedict.json`: CC-CEDICT transformed to `[traditional, simplified, pinyin, definitions]` records. [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/); attribution in `CC-CEDICT-NOTICE.txt`. Source: https://www.mdbg.net/chinese/dictionary?page=cedict
- `data/hanzi.jsonl`: unmodified Make Me a Hanzi `dictionary.txt`. [Project and sources](https://github.com/skishore/makemeahanzi). LGPL 3 or later; upstream COPYING, LGPL and GPL notices included. The separately licensed graphics dataset is not used.
- `scripts/update_data.py`: reproducible source refresh.
- `tests/dictionary.cjs`: real-data regression checks, run with Node.js.

## Troubleshooting

- **Dictionary unavailable:** confirm `worker.js`, `data/cedict.json` and `data/hanzi.jsonl` are at the same relative paths as this package; serve via HTTP/HTTPS and reload.
- **Slow first load:** wait for indexing; the UI remains responsive because search runs in a worker. Static hosting with compression and caching improves transfers.
- **No result:** try a base word, fewer words, Chinese characters or pinyin. There is no stemming or grammatical analysis.
- **Unexpected sentence meaning:** inspect each dictionary entry; automatic segmentation and first-sense glosses cannot resolve context.
- **No audio:** install a Mandarin system voice, or use another browser. The lookup features work without audio.
