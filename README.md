<p align="center">
  <img src="https://raw.githubusercontent.com/Pal-droid/Seanime-Android/main/images/seanime.png" alt="Seanime" width="140">
</p>

<h1 align="center">Seanime Community Marketplace</h1>

<p align="center">
  Community-made extensions, plugins and providers for <a href="https://github.com/5rahim/seanime">Seanime</a>:
  anime streaming sources, manga sources, torrent providers and UI plugins, all in one place.
</p>

<p align="center">
  <a href="https://bas1874.github.io/Seanime-Marketplace/"><img src="https://img.shields.io/website?url=https%3A%2F%2Fbas1874.github.io%2FSeanime-Marketplace%2F&label=Marketplace&color=2ea44f&style=for-the-badge" alt="Marketplace"></a>
  <a href="https://github.com/Bas1874/Seanime-Marketplace/commits/main"><img src="https://img.shields.io/github/last-commit/Bas1874/Seanime-Marketplace?style=for-the-badge&logo=git&logoColor=white&labelColor=2d3748&color=805ad5" alt="Last Commit"></a>
  <a href="https://discord.gg/vKPhNTesWx"><img src="https://img.shields.io/discord/1224767201551192224?style=for-the-badge&color=5865F2&labelColor=2d3748&label=Discord&logo=discord&logoColor=white" alt="Discord"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-Custom_Dual-805ad5?style=for-the-badge&labelColor=2d3748" alt="License"></a>
</p>

---

The easiest way to browse everything is the **[visual marketplace](https://bas1874.github.io/Seanime-Marketplace/)**. It shows every extension with its status (working / broken / deprecated), type and language, and lets you copy install links directly.

Prefer raw JSON? The full list lives in [`Marketplace/Main.json`](https://raw.githubusercontent.com/Bas1874/Seanime-Marketplace/refs/heads/main/Marketplace/Main.json).

## Installation

1. Open Seanime and go to the **Extensions** tab

   <img src="https://raw.githubusercontent.com/Pal-droid/Seanime-Providers/refs/heads/main/public/first_step.jpg" width="600">

2. Select **Change repository**

   <img src="https://raw.githubusercontent.com/Pal-droid/Seanime-Providers/refs/heads/main/public/second_step.jpg" width="600">

3. Paste the marketplace URL:

   ```
   https://raw.githubusercontent.com/Bas1874/Seanime-Marketplace/refs/heads/main/Marketplace/Main.json
   ```

   <img src="https://raw.githubusercontent.com/Pal-droid/Seanime-Providers/refs/heads/main/public/last_step.jpg" width="600">

4. That's it. Seanime fetches and registers everything automatically.

## What's in here

```
Marketplace/   Extension index (Main.json) plus status tracking
Plugin/        Plugin sources
Icons/         Extension icons
index.html     The visual marketplace site
```

The marketplace data is kept up to date automatically and extensions are flagged when they break, so you don't have to guess which providers still work.

## Other community marketplaces

A few other people maintain their own Seanime extension repos worth checking out:

| Marketplace | Notes |
|---|---|
| [ASleepyDrink](https://github.com/ASleepyDrink/Seanime-Stuff) | Only working extensions, tested frequently. `https://raw.githubusercontent.com/ASleepyDrink/Seanime-Stuff/refs/heads/main/marketplace.json` |
| [Pal-droid](https://github.com/Pal-droid/Seanime-Providers) | Providers for various manga and anime sources. `https://raw.githubusercontent.com/Pal-droid/Seanime-Providers/main/marketplace/main.json` |
| [Jhoorodre](https://github.com/Jhoorodre/seanime-provider) | Portuguese (PT-BR) anime and manga extensions. `https://raw.githubusercontent.com/Jhoorodre/seanime-provider/master/marketplace.json` |
| [Carloss616](https://github.com/Carloss616/seanime-extensions) | Manga-focused: custom catalogs, metadata, progress sync. `https://raw.githubusercontent.com/Carloss616/seanime-extensions/main/marketplace.json` |

Run your own marketplace and want it listed? [Message me on Discord](https://discord.com/users/345994349966000128).

## Support

For questions, broken extensions or requests, [message me directly](https://discord.com/users/345994349966000128) or ask in the [Seanime Discord](https://discord.gg/vKPhNTesWx).

## Using the marketplace data

You're welcome to consume the data in your own plugins by fetching it from the raw GitHub link, as long as this repo stays the host:

```
https://raw.githubusercontent.com/Bas1874/Seanime-Marketplace/main/Marketplace/Main.json
```

What you can't do is scrape or re-host the JSON files from `/Marketplace` on your own repo or server. The data is gathered through an authorized Discord bot, and re-hosting it breaks the access rules it operates under. Developers caught re-hosting the data get their plugins blacklisted from this marketplace.

Code outside `/Marketplace` is MIT. Full details in [LICENSE](LICENSE).

## Credits

- [5rahim](https://github.com/5rahim), creator of [Seanime](https://github.com/5rahim/seanime)
- [ASleepyDrink](https://github.com/ASleepyDrink) whose marketplace served as an early reference for the visual marketplace
- [Pal-droid](https://github.com/Pal-droid) for contributions to the project
- The [Seanime community](https://discord.gg/vKPhNTesWx) for building all of these extensions in the first place
