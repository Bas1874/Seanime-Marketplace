<div align="center">
  <img src="https://raw.githubusercontent.com/Pal-droid/Seanime-Android/main/images/seanime.png" width="90px" alt="Seanime Logo"/>

  <h1>Seanime Community Marketplace</h1>

  <p>
    <a href="https://github.com/Bas1874/Seanime-Marketplace/commits/main">
      <img src="https://img.shields.io/github/last-commit/Bas1874/Seanime-Marketplace?style=for-the-badge&logo=git&logoColor=white&labelColor=2d3748&color=805ad5" alt="Last Commit" />
    </a>
    <a href="https://github.com/Bas1874/Seanime-Marketplace/blob/main/LICENSE">
      <img src="https://img.shields.io/badge/License-Custom_Dual-805ad5?style=for-the-badge&labelColor=2d3748" alt="License" />
    </a>
    <a href="https://discord.gg/vKPhNTesWx">
      <img src="https://img.shields.io/discord/1224767201551192224?style=for-the-badge&color=5865F2&labelColor=2d3748&label=Discord&logo=discord&logoColor=white" alt="Discord Server" />
    </a>
  </p>

  <p>
    This repository contains custom <strong><a href="https://github.com/5rahim/seanime">Seanime</a></strong> plugins and extensions created by the Seanime Community.
  </p>
</div>

---

## 📂 Repository Structure

```text
├── Marketplace/
│   ├── Blacklist.json
│   ├── Blocked.json
│   ├── Failed.json
│   ├── Main.json
│   ├── ScanLog.json
│   ├── SeanimeDefaults.json
│   └── UserCache.json
├── index.html
├── LICENSE
└── README.md
```

## ⚙️ Installation

1. Open Seanime on your device.  
2. Navigate to the **Extensions** tab.  
   <br>
   <img src="https://raw.githubusercontent.com/Pal-droid/Seanime-Providers/refs/heads/main/public/first_step.jpg" width="700" alt="Step 1" />

3. Select **Change repository**.  
   <br>
   <img src="https://raw.githubusercontent.com/Pal-droid/Seanime-Providers/refs/heads/main/public/second_step.jpg" width="700" alt="Step 2" />

4. Paste the **raw GitHub URL** of the desired `manifest.json` file.  
   *(Example:)*
   ```text
   https://raw.githubusercontent.com/Bas1874/Seanime-Marketplace/refs/heads/main/Marketplace/Main.json
   ```
   <br>
   <img src="https://raw.githubusercontent.com/Pal-droid/Seanime-Providers/refs/heads/main/public/last_step.jpg" width="700" alt="Step 3" />

5. Seanime will automatically fetch and register the extension/provider.

---

## 🔗 Available Extensions

Wondering where to find the manifest URLs?  
👉 **[Click here to see the full list of available extensions](https://raw.githubusercontent.com/Bas1874/Seanime-Marketplace/refs/heads/main/Marketplace/Main.json)**

---

## 💬 Questions & Support

- **Direct:** [Hit me up on Discord!](https://discord.com/users/345994349966000128)
- **Community:** Join the official [Seanime Discord Server](https://discord.gg/vKPhNTesWx)


## Other Community Members Marketplaces


* **ASleepyDrink Marketplace**

  ```text
  https://raw.githubusercontent.com/ASleepyDrink/Seanime-Stuff/refs/heads/main/marketplace.json
  ```
  This marketplace is up to date and consists of only working extensions. All extensions get tested frequently to see if they are working or not.

* **Pal-droid Marketplace**

  ```text
  https://raw.githubusercontent.com/Pal-droid/Seanime-Providers/main/marketplace/main.json
  ```
  This repository contains custom Seanime plugins and extensions for adding support to various manga and anime sources created by Pal-droid

  

*More community marketplaces coming soon.*


---

## ❤️ Credits

* **[5rahim](https://github.com/5rahim)** — Creator of the amazing [Seanime](https://github.com/5rahim/seanime) project.
* **[Sleepy / ASleepyDrink](https://github.com/ASleepyDrink)** — Source code for the visual marketplace, original owner of the Anime News, Always Advanced Search, Cookie clicker, Anti-Seeding plugins, and Animepahe extension.
* **[Pal-droid](https://github.com/Pal-droid)** — Contributions to the project.
* **[Seanime Community](https://discord.gg/vKPhNTesWx)** — For creating all the amazing plugins and extensions.

<br>

## ⚖️ Terms of Use & Data Licensing

This repository provides a curated, enhanced marketplace dataset. To ensure compliance with Discord's Terms of Service, this data is gathered using an authorized, fully-permissioned Discord Bot. Because of this, strict usage rules apply to the data.

**✅ What you CAN do:**
You are fully allowed (and encouraged!) to use this marketplace data in your plugins, apps, or extensions by fetching the data via the raw GitHub link. As long as this repository remains the host, you are free to consume the data.
*Example:* `https://raw.githubusercontent.com/Bas1874/Seanime-Marketplace/main/Marketplace/Main.json`

**❌ What you CANNOT do:**
You may **not** scrape, clone, or copy the JSON files located in the `/Marketplace` folder to host them on your own GitHub repository, server, or alternative marketplace. 

⚠️ *Note: Any developers found illegally scraping or re hosting this repository's JSON files to bypass access restrictions will have their plugins permanently blacklisted from this marketplace.*

For full details, please read the [LICENSE](LICENSE) file. The HTML/code outside the `/Marketplace` folder is licensed under MIT, but the marketplace data itself is strictly restricted.
