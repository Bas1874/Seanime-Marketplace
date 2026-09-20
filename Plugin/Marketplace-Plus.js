// ================================================================
//  Marketplace+ v1.2.2  ·  by bas1874
//  Based on original seatags concept by Aqua
// ================================================================

function init() {
    $ui.register(function (ctx) {

        // ------------------------------------------------ settings
        var FEED_URL = "https://raw.githubusercontent.com/Bas1874/Seanime-Marketplace/refs/heads/main/Marketplace/Main.json"
        var DISCORD_GUILD = "1224767201551192224"
        var STORE_KEY = "mplus:feed:v2"
        // One-shot flag for the first-run "use the recommended marketplace
        // source?" prompt. Lives in $storage, not settings, so "Reset to
        // defaults" in the tray never makes the plugin nag again.
        var ASK_KEY = "mplus:srcprompt:v1"
        // Last marketplace URL we know about. Cached because reading it back
        // from Seanime costs the user a permission prompt.
        var SRC_KEY = "mplus:src:v1"
        var FRESH_FOR = 60 * 60 * 1000 // refetch after 1 hour
        var BATCH = 12                 // cards decorated per tick

        var STATUS_MENU = [
            ["all", "Any status"],
            ["working", "Working"],
            ["broken", "Broken"],
            ["deprecated", "Deprecated"],
            ["untagged", "Untagged"],
        ]
        // Installed page only. "Disabled" is Seanime's own state, not a
        // marketplace tag, so it is a separate attribute and it is never
        // offered on the marketplace page — nothing there can be disabled,
        // and picking it would blank the whole list.
        var STATUS_MENU_INSTALLED = STATUS_MENU.concat([["disabled", "Disabled"]])
        var SORT_MENU = [
            ["default", "Default order"],
            ["stars", "Most stars"],
            ["updated", "Recently updated"],
        ]
        var NEW_FOR = 14 * 86400000 // "New" badge window: 14 days

        // Bulk enable/disable, installed page only. ctx.extensions offers
        // enable/disable/setDisabled and nothing else — there is no uninstall
        // and no way to ask Seanime what is installed, so the ids come from
        // matching the cards on screen against the marketplace feed. An
        // extension the feed doesn't know simply gets no checkbox.
        // Every id this plugin ships under. The published marketplace entry
        // uses "Marketplace-Plus"; the local development copy uses
        // "marketplace-enhancer". Both must be excluded, or Marketplace+ gets
        // a checkbox of its own and can switch itself off mid-run.
        var SELF_IDS = { "Marketplace-Plus": true, "marketplace-enhancer": true }
        function isSelf(id) { return !!SELF_IDS[id] }
        // "+ <label>" shortcuts that add every card of that type to the
        // selection. Values are the feed's own `type` field.
        var TYPE_PICKS = [
            ["anime-torrent-provider", "Torrent"],
            ["onlinestream-provider", "Streaming"],
            ["manga-provider", "Manga"],
            ["plugin", "Plugins"],
            ["custom-source", "Sources"],
        ]
        var ARM_FOR = 5000 // ms a primed Disable/Enable button stays primed

        // Discord forum tag IDs worth showing as chips. Type tags (anime,
        // manga, torrent, …) are skipped — Seanime already displays the type.
        var TAG_CHIPS = {
            "1505936860441083904": ["Sub only", "mplus-audio"],
            "1505936927189110988": ["Dub only", "mplus-audio"],
            "1505937222891733062": ["Sub & Dub", "mplus-audio"],
            "1359259306087940146": ["Other", "mplus-plain"],
        }

        // Seanime UI classes reused so our controls look native.
        // These come straight from the app's own Button anatomy, so the
        // Tailwind utilities are already in its stylesheet and the buttons
        // pick up the current theme instead of approximating it.
        var K_BTN = "UI-Button_root whitespace-nowrap font-medium rounded-lg inline-flex items-center " +
            "text-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-1 " +
            "ring-offset-1 ring-offset-[--background] focus-visible:ring-white/40"
        var K_BTN_MD = "text-sm h-9 px-3"
        var K_BTN_SM = "text-xs h-8 px-2.5"
        var K_INTENT = {
            gray: "text-[--gray] border bg-gray-100 border-transparent hover:bg-gray-200 active:bg-gray-300 dark:text-gray-100 dark:bg-opacity-10 dark:hover:bg-opacity-20",
            brand: "text-[--brand] border bg-brand-50 border-transparent hover:bg-brand-100 active:bg-brand-200 dark:bg-opacity-10 dark:hover:bg-opacity-20",
            warn: "text-[--orange] border bg-orange-50 border-transparent hover:bg-orange-100 active:bg-orange-200 dark:bg-opacity-10 dark:hover:bg-opacity-20",
            warnOn: "text-white border bg-orange-500 border-orange-400/20 active:bg-opacity-100 dark:bg-opacity-85 dark:hover:bg-opacity-90",
            ok: "text-[--green] border bg-green-50 border-transparent hover:bg-green-100 active:bg-green-200 dark:bg-opacity-10 dark:hover:bg-opacity-20",
            okOn: "text-white border bg-green-500 border-green-400/20 active:bg-opacity-100 dark:bg-opacity-85 dark:hover:bg-opacity-90",
        }
        function btnClass(size, intent, mark) {
            return K_BTN + " " + size + " " + (K_INTENT[intent] || K_INTENT.gray) + (mark ? " " + mark : "")
        }

        var K_MENU_BOX = "UI-Select__content w-full overflow-hidden rounded-[--radius] shadow-md bg-[--paper] border leading-none z-[100]"
        var K_MENU_PAD = "UI-Select__viewport p-1"
        var K_MENU_ROW = "UI-Select__item mplus-row text-base leading-none rounded-[--radius] flex items-center h-8 pr-2 pl-8 relative select-none"
        var K_TICK = "UI-Select__checkIcon absolute left-2 w-4 inline-flex items-center justify-center"
        var K_ICON_SLOT = "UI-Input__addons--icon pointer-events-none absolute inset-y-0 left-0 w-12 grid place-content-center text-gray-500 dark:text-gray-300"

        var SVG_TICK = "<svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='20 6 9 17 4 12'/></svg>"
        var SVG_DOWN = "<svg width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='m6 9 6 6 6-6'/></svg>"
        var SVG_USER = "<svg width='18' height='18' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2'/><circle cx='12' cy='7' r='4'/></svg>"
        var SVG_CHAT = "<svg width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'><path d='M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z'/></svg>"
        var SVG_APP = "<svg width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'><rect x='2' y='3' width='20' height='14' rx='2'/><path d='M8 21h8M12 17v4'/></svg>"

        var SHEET =
            // Two columns: the chip rows flex/wrap on the left, the support
            // buttons stay pinned right and vertically centred. Keeping them
            // out of the wrapping rows means a long author name can never
            // push them onto a line of their own.
            ".mplus-strip{display:flex;align-items:center;gap:8px;margin-top:8px}" +
            ".mplus-rows{display:flex;flex-direction:column;gap:6px;flex:1;min-width:0}" +
            ".mplus-line{display:flex;flex-wrap:wrap;gap:6px;align-items:center}" +
            ".mplus-chip{display:inline-flex;align-items:center;gap:4px;height:22px;padding:0 8px;border-radius:6px;font-size:11px;font-weight:600;line-height:1;white-space:nowrap;box-sizing:border-box;border:1px solid transparent}" +
            ".mplus-working{font-weight:700;background:rgba(62,207,142,.18);color:#5fe0a6;border-color:rgba(62,207,142,.5)}" +
            ".mplus-broken{font-weight:700;background:rgba(255,80,80,.18);color:#ff8585;border-color:rgba(255,80,80,.5)}" +
            ".mplus-deprecated{font-weight:700;background:rgba(255,180,60,.18);color:#ffce80;border-color:rgba(255,180,60,.5)}" +
            ".mplus-ver{background:rgba(225,225,225,.10);color:#cacaca;border-color:rgba(90,90,90,.4)}" +
            ".mplus-author{background:transparent;color:#cacaca;border-color:rgba(255,255,255,.10)}" +
            ".mplus-lang{background:rgba(239,246,255,.10);color:#93c5fd}" +
            ".mplus-plain{background:transparent;color:rgba(255,255,255,.4);padding:0}" +
            ".mplus-stars{background:transparent;color:#fcd34d;padding:0}" +
            ".mplus-new{font-weight:700;background:rgba(167,139,250,.16);color:#c4b5fd;border-color:rgba(167,139,250,.5)}" +
            ".mplus-audio{background:rgba(45,212,191,.12);color:#5eead4;border-color:rgba(45,212,191,.35)}" +
            ".mplus-chat{background:rgba(88,101,242,.16);color:#a5b0ff;border-color:rgba(88,101,242,.5);cursor:pointer;text-decoration:none;transition:background .15s}" +
            ".mplus-chat:hover{background:rgba(88,101,242,.34)}" +
            ".mplus-chatgrp{display:inline-flex;align-items:center;gap:6px;flex:none}" +
            ".mplus-mini{padding:0 7px}" +
            ".mplus-row:hover{background-color:var(--subtle)}" +
            ".mplus-info{margin-top:12px;padding-top:4px;border-top:1px solid rgba(255,255,255,.06);font-size:13px}" +
            ".mplus-info-row{display:flex;align-items:center;gap:12px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.05)}" +
            ".mplus-info-row:last-child{border-bottom:0}" +
            ".mplus-info-k{color:rgba(255,255,255,.45);width:110px;flex:none}" +
            ".mplus-info-v{color:#dedede;display:flex;align-items:center;gap:6px;flex-wrap:wrap;min-width:0;word-break:break-word}" +
            ".mplus-info-v .mplus-chatgrp{margin-left:0}" +
            ".mplus-info-v a.mplus-vt{color:#93c5fd;text-decoration:none}" +
            ".mplus-info-v a.mplus-vt:hover{text-decoration:underline}" +
            ".mplus-alert{position:fixed;right:16px;bottom:16px;z-index:9999;width:330px;max-width:calc(100vw - 32px);background:var(--paper,#141414);border:1px solid rgba(255,80,80,.45);border-radius:10px;padding:12px 14px;box-shadow:0 8px 30px rgba(0,0,0,.55);font-size:13px}" +
            ".mplus-alert-t{font-weight:700;color:#ff8585;margin-bottom:4px;font-size:14px}" +
            ".mplus-alert-b{color:#cacaca;margin-bottom:10px;line-height:1.45}" +
            ".mplus-alert-b b{color:#ff8585}" +
            ".mplus-alert .mplus-chatgrp{margin-left:0}" +
            ".mplus-alert-x{cursor:pointer;margin-left:auto}" +
            ".mplus-alert-x:hover{background:rgba(225,225,225,.2)}" +
            ".mplus-setup{border-color:rgba(88,101,242,.5);width:360px}" +
            ".mplus-setup .mplus-alert-t{color:#a5b0ff}" +
            ".mplus-setup .mplus-alert-b b{color:#a5b0ff}" +
            ".mplus-setup code{display:block;margin-top:6px;font-size:11px;color:rgba(255,255,255,.45);word-break:break-all}" +
            ".mplus-go{cursor:pointer;background:rgba(88,101,242,.22);color:#c3cbff;border-color:rgba(88,101,242,.6);transition:background .15s}" +
            ".mplus-go:hover{background:rgba(88,101,242,.4)}" +
            ".mplus-skip{cursor:pointer}" +
            ".mplus-skip:hover{background:rgba(225,225,225,.2)}" +
            // bulk selection
            ".mplus-off{background:rgba(255,180,60,.14);color:#ffce80;border-color:rgba(255,180,60,.4)}" +
            ".mplus-selbox{cursor:pointer;background:transparent;color:rgba(255,255,255,.55);border-color:rgba(255,255,255,.18);transition:background .15s}" +
            ".mplus-selbox:hover{background:rgba(225,225,225,.14)}" +
            ".mplus-selon{background:rgba(88,101,242,.28);color:#c3cbff;border-color:rgba(88,101,242,.65)}" +
            ".mplus-bcount{font-size:12px;opacity:.55;white-space:nowrap;padding:0 2px}"

        // ------------------------------------------------ state
        var stash = loadStash()
        var catalog = ctx.state(stash.items)
        var statusPick = ctx.state("all")
        var sortPick = ctx.state("default")
        var authorNeedle = ctx.state("")
        var searchText = ctx.state("") // mirror of Seanime's own search box
        var srcUrl = ctx.state(loadSrcUrl()) // last known marketplace source URL
        var srcCard = null             // first-run prompt element, if on screen
        var srcOpening = false         // guards the two awaits inside showSrcCard
        var srcBusy = false
        var fetchedAt = stash.at
        var fetching = false

        var lookup = { id: {}, name: {} }  // name → [entries], several share one
        var pageReady = false
        var epoch = 0               // bumped only on client reload
        var seenInputs = {}
        var onMarketplace = false   // true while the marketplace list is the one on screen
        var nativeBoxClass = ""
        var marks = {}              // element-id → { el, stars, status } for sorting
        var modalMarks = {}         // element-id → extension key, guards double-decoration
        var sheetEl = null          // static stylesheet
        var filterEl = null         // dynamic filter stylesheet
        var bodyEl = null
        var stopCards = null
        var stopControls = null
        var stopModals = null
        var stopVideos = null
        var refetchCards = null     // obs[1] of the card observer, for a forced pass

        // Bulk selection lives on the installed page only and is deliberately
        // not persisted: it dies with the page, so a stale selection can
        // never be acted on after a navigation or a reload.
        var selectMode = false
        var selected = {}           // extension id → true
        var bulkBusy = false
        var bulkArm = 0             // 0 none, 1 disable primed, 2 enable primed
        var bulkArmAt = 0
        var selBtnEl = null         // the "Select" toggle
        var selBarEl = null         // action row, hidden unless select mode
        var selLblEl = null         // "n selected"
        var bulkDisEl = null
        var bulkEnaEl = null
        var selWrapEl = null        // the Select control itself; outlives a selection

        // ------------------------------------------------ user settings
        // Everything Marketplace+ adds is opt-out, so the defaults reproduce
        // the behaviour from before settings existed. Seanime's own
        // preferences form (userConfig) only renders a flat list of fields
        // with no grouping, so the settings live in the plugin tray instead.
        var DEFAULTS = {
            chipVersion: true,
            chipStatus: true,
            chipNew: true,
            chipLang: true,
            chipAudio: true,
            chipAuthor: true,
            chipLanguage: true,
            chipStars: true,
            chipUpdated: true,
            chipSupport: true,
            detailsBox: true,
            hideBroken: true,
            streamAlerts: true,
            bulkTools: true,
        }
        // ctx.settings is plugin-local UI state and needs no scope of its
        // own — the "settings" scope is for ctx.appSettings, which is
        // Seanime's own app settings and is not used here. Values are
        // mirrored in $store and persisted through $storage, which the
        // "storage" scope covers. Still guarded: a failure here costs the
        // tray, not the plugin.
        var settings = null
        try { settings = ctx.settings.define("marketplace-plus", DEFAULTS) } catch (e) { settings = null }

        function pref(k) {
            if (!settings) return DEFAULTS[k]
            try {
                var v = settings.get(k, DEFAULTS[k])
                return (v == null) ? DEFAULTS[k] : !!v
            } catch (e) { return DEFAULTS[k] }
        }

        function loadSrcUrl() {
            try {
                var v = $storage.get(SRC_KEY)
                return (typeof v === "string") ? v : ""
            } catch (e) { return "" }
        }
        function loadStash() {
            try {
                var raw = $storage.get(STORE_KEY)
                if (raw && raw.items && raw.items.length) return raw
            } catch (e) { }
            return { at: 0, items: [] }
        }
        function indexCatalog() {
            lookup.id = {}
            lookup.name = {}
            var items = catalog.get()
            for (var i = 0; i < items.length; i++) {
                var it = items[i]
                if (it.id) lookup.id[it.id] = it
                if (it.name) {
                    // Display names are not unique in the catalogue — two
                    // MangaFire, two AniZone, two MangaDex, and so on, often
                    // with opposite status tags. The cards only show the name,
                    // so a last-one-wins map silently hands every one of them
                    // whichever entry came last in the feed. Keep them all and
                    // let matchEntry pick, or decline to guess.
                    var nk = String(it.name).trim().toLowerCase()
                    if (!lookup.name[nk]) lookup.name[nk] = []
                    lookup.name[nk].push(it)
                }
            }
        }
        indexCatalog()

        // ------------------------------------------------ tiny utils
        // Always ctx.fetch, never the global one. The global fetch settles
        // its promise from its own goroutine, so the .then callback runs
        // JS on the plugin VM while the scheduler may be running a tray
        // render on another goroutine. goja is not thread-safe: the race
        // shows up as a "response channel panic: ... not *goja.arrayObject"
        // warning followed by a nil-pointer panic inside the tray renderer,
        // at random, usually right after startup when the first feed fetch
        // lands on top of the first render. ctx.fetch queues the callback
        // on Seanime's scheduler, which serialises VM access.
        function http(url, opts) {
            try {
                if (ctx && typeof ctx.fetch === "function") return ctx.fetch(url, opts)
            } catch (e) { }
            return fetch(url, opts)
        }
        function xml(v) {
            return (v == null ? "" : String(v))
                .replace(/&/g, "&amp;").replace(/</g, "&lt;")
                .replace(/>/g, "&gt;").replace(/"/g, "&quot;")
        }
        function labelFor(menu, val) {
            for (var i = 0; i < menu.length; i++) if (menu[i][0] === val) return menu[i][1]
            return menu[0][1]
        }
        function statusOf(entry) {
            if (!entry) return "untagged"
            if (entry.brokenTag) return "broken"
            if (entry.deprecatedTag) return "deprecated"
            if (entry.workingTag) return "working"
            return "untagged"
        }
        function starsOf(entry) {
            return (entry && typeof entry.stars === "number" && entry.stars > 0) ? entry.stars : 0
        }
        // Default layout: working first, then untagged, deprecated, broken.
        // "Most stars" layout: highest star count first.
        function rankOf(status) {
            if (status === "working") return 0
            if (status === "untagged") return 1
            if (status === "deprecated") return 2
            return 3
        }
        function whenOf(v) {
            if (!v) return 0
            var t = Date.parse(String(v))
            return isNaN(t) ? 0 : t
        }
        function agoText(t) {
            var d = Math.floor((Date.now() - t) / 86400000)
            if (d <= 0) return "today"
            if (d === 1) return "yesterday"
            if (d < 7) return d + "d ago"
            if (d < 30) return Math.floor(d / 7) + "w ago"
            if (d < 365) return Math.floor(d / 30) + "mo ago"
            return Math.floor(d / 365) + "y ago"
        }
        var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
        function dateText(v) {
            var t = whenOf(v)
            if (!t) return ""
            var d = new Date(t)
            return MONTHS[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear()
        }
        function orderFor(entry, status) {
            var mode = sortPick.get()
            if (mode === "stars") return String(9999 - starsOf(entry))
            if (mode === "updated") {
                var t = whenOf(entry && entry.updatedAt)
                return String(t ? Math.floor((Date.now() - t) / 60000) : 99999999)
            }
            return String(rankOf(status))
        }
        async function body() {
            if (!bodyEl) { try { bodyEl = await ctx.dom.queryOne("body") } catch (e) { } }
            return bodyEl
        }
        async function mountStyle(text) {
            var b = await body()
            if (!b) return null
            try {
                var el = await ctx.dom.createElement("style")
                el.setText(text)
                b.append(el)
                return el
            } catch (e) { return null }
        }

        // Seanime renders its own state badges on each card. Marketplace+
        // hides that row and draws its own chips, so anything only Seanime
        // knows has to be read back out of the raw innerHTML first —
        // otherwise a disabled extension would show no sign of it while
        // this plugin is active.
        function hasBadge(html, want) {
            // Cut our own strip off first, exactly as nativeVersion does: it
            // renders a "Disabled" chip of its own, and on the next pass that
            // chip would otherwise read back as Seanime's badge and stick.
            var cut = html.indexOf("mplus-strip")
            if (cut !== -1) html = html.slice(0, cut)
            var parts = html.split("UI-Badge__root")
            for (var i = 1; i < parts.length; i++) {
                var texts = parts[i].match(/>([^<>]+)</g) || []
                for (var j = 0; j < texts.length && j < 4; j++) {
                    if (texts[j].slice(1, -1).trim() === want) return true
                }
            }
            return false
        }

        // enable/disable are optional in the same way the marketplace-source
        // calls are: older builds don't have them, and without the
        // "extensions" scope they throw. No API, no Select button.
        function extApi() {
            try {
                var api = ctx.extensions
                if (api && typeof api.setDisabled === "function") return api
            } catch (e) { }
            return null
        }
        function bulkSupported() { return !!extApi() }

        // ------------------------------------------------ card badges
        var STATUS_TEXT = { working: "Working", broken: "Broken", deprecated: "Deprecated" }

        function chip(text, cls) {
            return "<span class='mplus-chip " + cls + "'>" + xml(text) + "</span>"
        }
        function cap(s) {
            s = s == null ? "" : String(s)
            return s ? s.charAt(0).toUpperCase() + s.slice(1) : ""
        }
        function chatHtml(threadId) {
            var tid = xml(String(threadId))
            var web = "https://discord.com/channels/" + DISCORD_GUILD + "/" + tid
            var app = "discord://-/channels/" + DISCORD_GUILD + "/" + tid
            // Primary "Support" chip uses the universal discord.com link. This
            // works on every platform: on Android/iOS the Discord app registers
            // it as a verified app link and opens directly; on desktop it opens
            // the thread in the browser. The old discord:// scheme only worked
            // on Windows (and some Mac), never on Linux/Android.
            // The small companion chip keeps the discord:// scheme to jump into
            // the Discord *desktop* app (Windows/macOS/Linux) when it's set up.
            // No scripting is used, so we stay clear of dom-script-manipulation.
            return "<span class='mplus-chatgrp'>" +
                "<a class='mplus-chip mplus-chat' href='" + web + "' target='_blank' rel='noreferrer' title='Open the support thread — opens the Discord app on mobile, or the browser on desktop'>" + SVG_CHAT + " Support</a>" +
                "<a class='mplus-chip mplus-chat mplus-mini' href='" + app + "' title='Open in the Discord desktop app'>" + SVG_APP + "</a>" +
                "</span>"
        }

        // Mirrors Seanime's own badge look: two compact rows of chips,
        // with the support buttons in their own right-hand column.
        //   row 1 → version · status · lang code
        //   row 2 → author · language · stars · updated
        //   right → support (centred across both rows)
        function selChipHtml(id) {
            var on = !!selected[id]
            return "<span class='mplus-chip mplus-selbox" + (on ? " mplus-selon" : "") + "'>" +
                (on ? "\u2611" : "\u2610") + " Select</span>"
        }

        function stripHtml(entry, key, ver, off, selId) {
            var top = ""
            if (selId) top += selChipHtml(selId)
            if (off) top += chip("Disabled", "mplus-off")
            if (ver && pref("chipVersion")) top += chip("v" + ver.replace(/^v/i, ""), "mplus-ver")
            var st = statusOf(entry)
            if (STATUS_TEXT[st] && pref("chipStatus")) top += chip(STATUS_TEXT[st], "mplus-" + st)
            var added = whenOf(entry.addedAt)
            if (added && Date.now() - added < NEW_FOR && pref("chipNew")) top += chip("New", "mplus-new")
            var lang = entry.lang ? String(entry.lang) : ""
            if (lang && pref("chipLang")) top += chip(lang.toUpperCase(), lang.toLowerCase() === "multi" ? "mplus-plain" : "mplus-lang")
            if (entry.tags && entry.tags.length && pref("chipAudio")) {
                for (var ti = 0; ti < entry.tags.length; ti++) {
                    var tc = TAG_CHIPS[String(entry.tags[ti])]
                    if (tc) top += chip(tc[0], tc[1])
                }
            }

            var bottom = ""
            if (entry.author && pref("chipAuthor")) bottom += chip(String(entry.author), "mplus-author")
            if (entry.language && pref("chipLanguage")) bottom += chip(cap(String(entry.language)), "mplus-plain")
            var n = starsOf(entry)
            if (n > 0 && pref("chipStars")) bottom += chip("★ " + n, "mplus-stars")
            var up = whenOf(entry.updatedAt)
            if (up && pref("chipUpdated")) bottom += chip("updated " + agoText(up), "mplus-plain")

            // Skip empty rows so switching chips off doesn't leave gaps
            var rows = ""
            if (top) rows += "<div class='mplus-line'>" + top + "</div>"
            if (bottom) rows += "<div class='mplus-line'>" + bottom + "</div>"

            return "<div class='mplus-rows'>" + rows + "</div>" +
                ((entry.threadId && pref("chipSupport")) ? chatHtml(entry.threadId) : "")
        }

        // The version chip reuses the number the client itself rendered on
        // the card (Seanime shows its own version as a plain badge, e.g.
        // "0.5.0", or "0.5.0 → 0.5.1" when an update is pending) instead of
        // the marketplace feed's cached version, so the chip never disagrees
        // with what the user actually has. No feed fallback: if the badge
        // can't be read, no version chip is shown.
        var VERSION_RE = /^v?\d+(?:\.\d+)+(?:[-+][\w.]+)?(?:\s*(?:→|->)\s*v?\d+(?:\.\d+)+(?:[-+][\w.]+)?)?$/
        function nativeVersion(html) {
            // ignore our own strip from a previous pass — it also holds "vX.Y.Z"
            var cut = html.indexOf("mplus-strip")
            if (cut !== -1) html = html.slice(0, cut)
            var parts = html.split("UI-Badge__root")
            for (var i = 1; i < parts.length; i++) {
                var texts = parts[i].match(/>([^<>]+)</g) || []
                // only look at the first few text nodes of each badge
                for (var j = 0; j < texts.length && j < 4; j++) {
                    var t = texts[j].slice(1, -1).replace(/&gt;/g, ">").trim()
                    if (VERSION_RE.test(t)) return t
                }
            }
            return ""
        }

        // Resolve a name that more than one catalogue entry answers to. The
        // version on the card is the only other readable signal, so it breaks
        // the tie; when it can't, nothing is returned. No badge is better than
        // a confident wrong one — telling someone their working provider is
        // Broken is worse than telling them nothing.
        function nameHit(key, ver) {
            var list = lookup.name[key]
            if (!list || !list.length) return null
            if (list.length === 1) return list[0]
            if (!ver) return null
            // "1.0.2" and "1.0.2 → 1.0.3" both mean the installed 1.0.2
            var want = String(ver).replace(/^v/i, "").split(/\s*(?:→|->)\s*/)[0].trim()
            var found = null, n = 0
            for (var i = 0; i < list.length; i++) {
                var v = String(list[i].version == null ? "" : list[i].version).replace(/^v/i, "").trim()
                if (v && v === want) { found = list[i]; n++ }
            }
            return (n === 1) ? found : null
        }

        function matchEntry(html, ver) {
            // An id identifies an extension; a name does not. Try every place
            // an id can appear before falling back to the name.
            var m = html.match(/opacity-30[^>]*>([^<]+)</)
            if (m && lookup.id[m[1].trim()]) return lookup.id[m[1].trim()]
            m = html.match(/ID:\s*([^<]+)</)
            if (m && lookup.id[m[1].trim()]) return lookup.id[m[1].trim()]
            m = html.match(/font-semibold[^>]*>([^<]+)</)
            if (m) return nameHit(m[1].trim().toLowerCase(), ver)
            return null
        }

        // Seanime reuses card elements when its own filters change, so a card
        // can suddenly represent a different extension. Each card carries a
        // hidden identity marker (data-for) — when it no longer matches the
        // content, the card is re-decorated with the right data.
        async function dressCard(card) {
            var html = (card && card.innerHTML) ? String(card.innerHTML) : ""
            var ver = nativeVersion(html)
            var entry = matchEntry(html, ver)
            var st = statusOf(entry)
            var key = entry ? String(entry.id || entry.name || "") : ""
            var cid = (card && card.id != null) ? String(card.id) : ""
            var off = hasBadge(html, "Disabled")
            var extId = entry ? String(entry.id || "") : ""
            var extType = entry ? String(entry.type || "") : ""
            // No checkbox for: the marketplace page, extensions the feed
            // can't identify, Seanime's built-ins, and Marketplace+ itself —
            // it would switch itself off half way through its own loop.
            var selId = (selectMode && !onMarketplace && extId && !isSelf(extId) &&
                !hasBadge(html, "Built-in")) ? extId : ""
            var stamp = key + "|" + (off ? "1" : "0") + "|" + (selId ? "1" : "0")

            // Synchronous guard: the observer can fire several times before
            // the (async) decoration below lands, so the innerHTML alone
            // can't be trusted to know whether a card was already handled.
            // Re-decoration is allowed whenever the readable native version
            // changes — e.g. a badge that rendered late, or "1.0.0 → 1.0.1"
            // becoming "1.0.1" after an update installs — and whenever the
            // disabled state or select mode changes under it.
            if (cid) {
                var prev = marks[cid]
                if (prev && prev.key === key && prev.ver === ver && prev.off === off && prev.sel === selId) return
                marks[cid] = {
                    el: card, entry: entry, status: st, key: key, ver: ver,
                    off: off, sel: selId, id: extId, type: extType, selEl: null,
                }
            }
            // Plugin restarted but the DOM still carries the right strip.
            // Only skip when the version chip also matches the (hidden but
            // still readable) native badge, so stale chips get refreshed.
            var m = html.match(/data-for=["']([^"']*)["']/)
            if (m && m[1] === stamp) {
                var cm = html.match(/mplus-ver["'][^>]*>v?([^<]*)</)
                var shown = cm ? cm[1].trim() : ""
                if (shown === (ver ? ver.replace(/^v/i, "") : "")) return
            }

            try { card.setAttribute("data-mplus", st) } catch (e) { }
            try { card.setAttribute("data-mplus-by", entry && entry.author ? String(entry.author).toLowerCase() : "") } catch (e) { }
            // Set before the no-entry return below, so extensions the feed
            // doesn't know can still be filtered by their disabled state.
            try { card.setAttribute("data-mplus-off", off ? "1" : "0") } catch (e) { }
            try { card.setStyle("order", orderFor(entry, st)) } catch (e) { }

            // always drop leftovers from a previous identity or run
            try {
                var olds = await card.query(".mplus-strip")
                for (var i = 0; i < (olds || []).length; i++) { try { olds[i].remove() } catch (e) { } }
            } catch (e) { }

            var strip = null, oldBadges = []
            try {
                var got = await Promise.all([
                    ctx.dom.createElement("div").catch(function () { return null }),
                    card.query(".UI-Badge__root").catch(function () { return [] }),
                ])
                strip = got[0]
                oldBadges = got[1] || []
            } catch (e) { }
            if (!strip) return
            try { strip.setAttribute("class", "mplus-strip") } catch (e) { }
            try { strip.setAttribute("data-for", stamp) } catch (e) { }

            if (!entry) {
                // invisible marker only — remembers this card was processed
                try { strip.setStyle("display", "none") } catch (e) { }
                try { card.append(strip) } catch (e) { }
                return
            }
            try { strip.setInnerHTML(stripHtml(entry, key, ver, off, selId)) } catch (e) { }
            if (selId) {
                // One extra roundtrip per card, and only while select mode is
                // on. The handle is kept so ticking a box updates that chip
                // alone instead of re-decorating the whole page.
                try {
                    var boxes = await strip.query(".mplus-selbox")
                    if (boxes && boxes.length) {
                        if (cid && marks[cid]) marks[cid].selEl = boxes[0]
                        ;(function (id, ep) {
                            try {
                                boxes[0].addEventListener("click", function () {
                                    if (ep !== epoch) return
                                    toggleSel(id)
                                })
                            } catch (e) { }
                        })(selId, epoch)
                    }
                } catch (e) { }
            }

            var anchor = null
            if (oldBadges.length) { try { anchor = await oldBadges[0].getParent() } catch (e) { } }
            if (anchor) {
                try { anchor.setStyle("display", "none") } catch (e) { }
                try { anchor.after(strip) } catch (e) { }
            } else {
                try { card.append(strip) } catch (e) { }
            }
        }

        // Decorate in small batches so big marketplaces don't stall the UI
        function dressCards(cards) {
            if (!cards || !cards.length) return
            var i = 0
            function tick() {
                var stop = Math.min(i + BATCH, cards.length)
                for (; i < stop; i++) dressCard(cards[i]).catch(function () { })
                if (i < cards.length) { try { ctx.setTimeout(tick, 20) } catch (e) { } }
            }
            tick()
        }

        // ------------------------------------------------ details modal
        // Seanime's extension info dialog only shows what the client knows
        // (name, version, author, …). This appends the extra marketplace
        // data — status, stars, dates, scan results, support thread — the
        // same info the website's info box shows. Rows are only added when
        // the feed actually has the data.
        function infoRow(label, valueHtml) {
            return "<div class='mplus-info-row'><span class='mplus-info-k'>" + xml(label) + "</span><span class='mplus-info-v'>" + valueHtml + "</span></div>"
        }
        function infoHtml(entry) {
            var rows = ""
            var st = statusOf(entry)
            var chips = ""
            if (STATUS_TEXT[st]) chips += chip(STATUS_TEXT[st], "mplus-" + st)
            if (!entry.flags) chips += chip("Unscanned", "mplus-ver")
            if (chips) rows += infoRow("Status", chips)
            var n = starsOf(entry)
            if (n > 0) rows += infoRow("Stars", xml("★ " + n))
            var added = dateText(entry.addedAt)
            if (added) rows += infoRow("Added", xml(added))
            var up = dateText(entry.updatedAt)
            if (up) rows += infoRow("Updated", xml(up))
            if (entry.scannedOnVersion) rows += infoRow("Scanned on", xml("Seanime v" + String(entry.scannedOnVersion)))
            if (entry.lastWorkingVersion) rows += infoRow("Last working", xml("v" + String(entry.lastWorkingVersion)))
            if (entry.flags) {
                var flags = xml(String(entry.flags)) + " detections"
                if (entry.permalink) flags = "<a class='mplus-vt' href='" + xml(String(entry.permalink)) + "' target='_blank' rel='noreferrer'>" + flags + "</a>"
                rows += infoRow("VirusTotal", flags)
            }
            if (entry.threadId) rows += infoRow("Support", chatHtml(entry.threadId))
            return rows
        }

        async function decorateModal(modal) {
            var html = (modal && modal.innerHTML) ? String(modal.innerHTML) : ""
            // identify the extension from the "ID: …" badge, falling back to the title
            var entry = null
            var m = html.match(/ID:\s*([^<]+)</)
            if (m && lookup.id[m[1].trim()]) entry = lookup.id[m[1].trim()]
            if (!entry) {
                m = html.match(/font-semibold[^>]*>\s*([^<]+?)\s*</)
                if (m) entry = nameHit(m[1].trim().toLowerCase(), nativeVersion(html))
            }
            if (!entry) return // not an extension details dialog (or unknown extension)
            var key = String(entry.id || entry.name || "")

            // Disabled by the user — also strip any box left over from a
            // dialog that was already open when the switch was flipped.
            if (!pref("detailsBox")) {
                try {
                    var stale = await modal.query(".mplus-info")
                    for (var si = 0; si < (stale || []).length; si++) { try { stale[si].remove() } catch (e) { } }
                } catch (e) { }
                return
            }

            // Synchronous guard: the observer fires several times while the
            // dialog opens, and each async run would otherwise pass the
            // innerHTML check below before the first one has appended.
            var mid = (modal && modal.id != null) ? String(modal.id) : ""
            if (mid) {
                if (modalMarks[mid] === key) return
                modalMarks[mid] = key
            }

            // already decorated for this extension
            var dm = html.match(/mplus-info[^>]*data-for=["']([^"']*)["']/)
            if (dm && dm[1] === key) return

            // drop leftovers from a previous extension (reused dialog)
            try {
                var olds = await modal.query(".mplus-info")
                for (var i = 0; i < (olds || []).length; i++) { try { olds[i].remove() } catch (e) { } }
            } catch (e) { }

            var rows = infoHtml(entry)
            if (!rows) return
            var box = null
            try { box = await ctx.dom.createElement("div") } catch (e) { }
            if (!box) return
            try { box.setAttribute("class", "mplus-info") } catch (e) { }
            try { box.setAttribute("data-for", key) } catch (e) { }
            try { box.setInnerHTML(rows) } catch (e) { }
            var hosts = []
            try { hosts = await modal.query(".space-y-2") } catch (e) { }
            if (hosts && hosts.length) {
                try { hosts[0].append(box) } catch (e) { }
            } else {
                try { modal.append(box) } catch (e) { }
            }
        }
        function dressModals(modals) {
            if (!modals || !modals.length) return
            for (var i = 0; i < modals.length; i++) decorateModal(modals[i]).catch(function () { })
        }

        // ------------------------------------------------ filtering / sorting
        async function refreshFilter() {
            if (!filterEl) filterEl = await mountStyle("")
            if (!filterEl) return
            var css = ""
            var st = statusPick.get()
            var by = authorNeedle.get().toLowerCase().replace(/["\\]/g, "")
            var searching = searchText.get().length > 0 || by.length > 0
            // A stale "disabled" pick from the installed page would hide every
            // card on the marketplace, so it degrades to "any status" there.
            if (st === "disabled" && onMarketplace) st = "all"
            if (st === "disabled") {
                css += '[class*="extension-card"]:not([data-mplus-off="1"]){display:none !important}'
            } else if (st !== "all") {
                css += '[class*="extension-card"]:not([data-mplus="' + st + '"]){display:none !important}'
            } else if (!searching && onMarketplace && pref("hideBroken")) {
                // Marketplace only: broken extensions stay hidden until searched
                // for or filtered on. The installed page never hides them —
                // a card you have to reach to uninstall must stay reachable.
                css += '[class*="extension-card"][data-mplus="broken"]{display:none !important}'
            }
            if (by) css += '[class*="extension-card"]:not([data-mplus-by*="' + by + '"]){display:none !important}'
            try { filterEl.setText(css) } catch (e) { }
        }

        function refreshSort() {
            for (var k in marks) {
                var m = marks[k]
                try { m.el.setStyle("order", orderFor(m.entry, m.status)) } catch (e) { }
            }
        }

        // ------------------------------------------------ dropdown factory
        async function makeDropdown(menu, stateRef, onPick, myEpoch) {
            var parts = null
            try {
                parts = await Promise.all([
                    ctx.dom.createElement("div").catch(function () { return null }),
                    ctx.dom.createElement("div").catch(function () { return null }),
                    ctx.dom.createElement("div").catch(function () { return null }),
                ])
            } catch (e) { return null }
            if (!parts || !parts[0] || !parts[1] || !parts[2]) return null
            var shell = parts[0], trigger = parts[1], panel = parts[2]

            try { shell.setCssText("position:relative;flex:none;width:180px;box-sizing:border-box") } catch (e) { }

            try { trigger.setAttribute("class", nativeBoxClass) } catch (e) { }
            try { trigger.setCssText("display:flex;align-items:center;justify-content:space-between;padding-left:0.75rem;padding-right:0.75rem;width:100%;box-sizing:border-box;cursor:pointer") } catch (e) { }
            try {
                trigger.setInnerHTML(
                    "<span class='mplus-lbl' style='flex:1;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap'>" + xml(labelFor(menu, stateRef.get())) + "</span>" +
                    "<span class='ml-2 h-4 w-4 shrink-0 opacity-50'>" + SVG_DOWN + "</span>"
                )
            } catch (e) { }

            try { panel.setAttribute("class", K_MENU_BOX) } catch (e) { }
            try { panel.setCssText("position:absolute;top:calc(100% + 4px);left:0;width:100%;box-sizing:border-box;display:none") } catch (e) { }
            var rowsHtml = "<div class='" + K_MENU_PAD + "'>"
            for (var i = 0; i < menu.length; i++) {
                var on = menu[i][0] === stateRef.get()
                rowsHtml += "<div class='" + K_MENU_ROW + "' style='cursor:default'>" +
                    "<span class='" + K_TICK + " mplus-tick' style='display:" + (on ? "inline-flex" : "none") + "'>" + SVG_TICK + "</span>" +
                    "<span>" + xml(menu[i][1]) + "</span></div>"
            }
            rowsHtml += "</div>"
            try { panel.setInnerHTML(rowsHtml) } catch (e) { }
            try { shell.append(trigger) } catch (e) { }
            try { shell.append(panel) } catch (e) { }

            var lbl = null, rows = [], ticks = []
            try {
                var q = await Promise.all([
                    trigger.query(".mplus-lbl").catch(function () { return [] }),
                    panel.query(".mplus-row").catch(function () { return [] }),
                    panel.query(".mplus-tick").catch(function () { return [] }),
                ])
                lbl = (q[0] && q[0].length) ? q[0][0] : null
                rows = q[1] || []
                ticks = q[2] || []
            } catch (e) { }

            var open = false
            var offBody = null
            function syncTicks() {
                for (var t = 0; t < ticks.length && t < menu.length; t++) {
                    try { ticks[t].setStyle("display", menu[t][0] === stateRef.get() ? "inline-flex" : "none") } catch (e) { }
                }
            }
            function hide() {
                try { panel.setStyle("display", "none") } catch (e) { }
                open = false
                if (offBody) { try { offBody() } catch (e) { } offBody = null }
            }
            async function show() {
                syncTicks()
                try { panel.setStyle("display", "block") } catch (e) { }
                open = true
                var b = await body()
                if (b) { try { offBody = b.addEventListener("click", function () { if (myEpoch !== epoch) return; hide() }) } catch (e) { } }
            }

            for (var r = 0; r < rows.length && r < menu.length; r++) {
                (function (val, text, row) {
                    try {
                        row.addEventListener("click", function () {
                            if (myEpoch !== epoch) return
                            stateRef.set(val)
                            if (lbl) { try { lbl.setText(text) } catch (e) { } }
                            syncTicks()
                            hide()
                            onPick()
                        })
                    } catch (e) { }
                })(menu[r][0], menu[r][1], rows[r])
            }
            try { trigger.addEventListener("click", function () { if (myEpoch !== epoch) return; if (open) hide(); else show().catch(function () { }) }) } catch (e) { }
            return shell
        }

        // ------------------------------------------------ author search box
        async function makeAuthorBox(myEpoch) {
            var box = null
            try { box = await ctx.dom.createElement("div") } catch (e) { }
            if (!box) return null
            try { box.setCssText("position:relative;display:flex;align-items:center;flex:none;width:220px;max-width:220px;box-sizing:border-box") } catch (e) { }
            try {
                box.setInnerHTML(
                    "<span class='" + K_ICON_SLOT + "' style='z-index:1'>" + SVG_USER + "</span>" +
                    "<input type='text' placeholder='Filter by author…' class='" + xml(nativeBoxClass) + "' />"
                )
            } catch (e) { }
            var found = []
            try { found = await box.query("input") } catch (e) { }
            if (found && found.length) {
                var field = found[0]
                var pending = 0
                var onType = function () {
                    if (myEpoch !== epoch) return
                    var ticket = ++pending
                    try {
                        field.getProperty("value").then(function (v) {
                            if (ticket !== pending || myEpoch !== epoch) return
                            authorNeedle.set(v == null ? "" : String(v))
                            refreshFilter().catch(function () { })
                        }).catch(function () { })
                    } catch (e) { }
                }
                try { field.setProperty("value", authorNeedle.get()) } catch (e) { }
                try { field.addEventListener("input", onType) } catch (e) { }
                try { field.addEventListener("keyup", onType) } catch (e) { }
            }
            return box
        }

        // ------------------------------------------------ bulk enable/disable
        // Selection is keyed by extension id, never by element, so it
        // survives Seanime re-rendering the whole list under us — which it
        // does after every enable/disable.
        function selIds() {
            var out = []
            for (var k in selected) if (selected[k]) out.push(k)
            return out
        }
        // Which of the two extension pages we are on is worked out from the
        // toolbar, and the marketplace toolbar can mount before the control
        // that identifies it — so the first pass can read the marketplace as
        // the installed page and build the Select button there, where there is
        // nothing to enable or disable. Rather than trusting that one reading,
        // visibility is re-applied on every pass, so a later, correct one puts
        // it away.
        function syncBulkVisible() {
            if (!selWrapEl) return
            try { selWrapEl.setStyle("display", onMarketplace ? "none" : "inline-flex") } catch (e) { }
        }
        function resetSelection() {
            selectMode = false
            selected = {}
            bulkArm = 0
            selBtnEl = null
            selBarEl = null
            selLblEl = null
            bulkDisEl = null
            bulkEnaEl = null
        }
        function setSelChip(el, on) {
            try { el.setAttribute("class", "mplus-chip mplus-selbox" + (on ? " mplus-selon" : "")) } catch (e) { }
            try { el.setText((on ? "\u2611" : "\u2610") + " Select") } catch (e) { }
        }
        function disarm() { bulkArm = 0 }
        // Seanime asks the user to approve every single enable/disable: the
        // prompt is cached per extension and per direction, and there is no
        // batch call to ask once for many. "Don't Allow" (or letting the
        // prompt time out) is therefore the only cancel the user has, so it
        // is treated as one — the run stops instead of putting the whole
        // remaining queue of prompts on screen one after another.
        function isDenial(e) {
            var m = ""
            try { m = String((e && e.message) ? e.message : (e || "")) } catch (er) { m = "" }
            return /denied|deadline|timeout|cancel/i.test(m)
        }
        // Current disabled state of every card on screen, by extension id.
        function cardState() {
            var state = {}
            for (var cid in marks) {
                var m = marks[cid]
                if (m && m.id) state[m.id] = !!m.off
            }
            return state
        }
        // How many of the selected extensions that direction would actually
        // touch — the rest are already there and cost no prompt.
        function toChange(off) {
            var state = cardState()
            var ids = selIds()
            var n = 0
            for (var i = 0; i < ids.length; i++) {
                if (isSelf(ids[i]) || state[ids[i]] === off) continue
                n++
            }
            return n
        }
        function redressCards() {
            // Dropping the marks clears the re-decoration guard; the
            // observer's own refetch then redelivers every card.
            marks = {}
            if (refetchCards) { try { refetchCards(); return } catch (e) { } }
            watchCards()
        }
        // Two-step confirm without a dialog: the button primes itself, says
        // so, and un-primes a few seconds later. Cheaper than a modal, and it
        // keeps the whole feature inside the toolbar.
        function arm(kind) {
            bulkArm = kind
            var mine = ++bulkArmAt
            try {
                ctx.setTimeout(function () {
                    if (bulkArmAt !== mine || bulkArm !== kind) return
                    bulkArm = 0
                    refreshBulk()
                }, ARM_FOR)
            } catch (e) { }
            refreshBulk()
        }
        function btnLabel(el, kind, word, n, mark) {
            if (!el) return
            var armed = bulkArm === kind
            var intent = (kind === 1) ? (armed ? "warnOn" : "warn") : (armed ? "okOn" : "ok")
            try { el.setAttribute("class", btnClass(K_BTN_SM, intent, mark)) } catch (e) { }
            try { el.setText((armed ? "Confirm " + word.toLowerCase() : word) + (n ? " (" + n + ")" : "")) } catch (e) { }
        }
        function refreshBulk() {
            var n = selIds().length
            if (selLblEl) {
                // Once a button is primed, stop counting the selection and
                // start counting what it is about to cost: one permission
                // prompt per extension, which is the part that surprises people.
                var txt = n + " selected"
                if (bulkArm) {
                    var k = toChange(bulkArm === 1)
                    txt = k ? ("Seanime will ask " + k + " time" + (k === 1 ? "" : "s")) : "nothing to change"
                }
                try { selLblEl.setText(txt) } catch (e) { }
            }
            btnLabel(bulkDisEl, 1, "Disable", n, "mplus-bdis")
            btnLabel(bulkEnaEl, 2, "Enable", n, "mplus-bena")
        }
        function toggleSel(id) {
            if (!id || bulkBusy) return
            if (selected[id]) delete selected[id]
            else selected[id] = true
            disarm()
            for (var cid in marks) {
                var m = marks[cid]
                if (m && m.selEl && m.id === id) setSelChip(m.selEl, !!selected[id])
            }
            refreshBulk()
        }
        // An empty type means every selectable card currently on the page.
        // Only cards that got a checkbox are touched, so Marketplace+ itself
        // and anything the feed can't identify stay out of "All" too.
        function selectByType(type) {
            if (bulkBusy) return
            for (var cid in marks) {
                var m = marks[cid]
                if (!m || !m.selEl || !m.id) continue
                if (type && m.type !== type) continue
                selected[m.id] = true
                setSelChip(m.selEl, true)
            }
            disarm()
            refreshBulk()
        }
        function selectNone() {
            if (bulkBusy) return
            selected = {}
            for (var cid in marks) {
                var m = marks[cid]
                if (m && m.selEl) setSelChip(m.selEl, false)
            }
            disarm()
            refreshBulk()
        }
        function setSelectMode(on) {
            if (bulkBusy || selectMode === on) return
            selectMode = on
            if (!on) selected = {}
            bulkArm = 0
            if (selBtnEl) {
                try { selBtnEl.setAttribute("class", btnClass(K_BTN_MD, on ? "brand" : "gray", "mplus-selbtn")) } catch (e) { }
                try { selBtnEl.setText(on ? "Done" : "Select") } catch (e) { }
            }
            if (selBarEl) { try { selBarEl.setStyle("display", on ? "inline-flex" : "none") } catch (e) { } }
            refreshBulk()
            // The checkbox lives in the chip strip, so every card has to be
            // decorated again.
            redressCards()
        }
        async function runBulk(off) {
            var api = extApi()
            var ids = selIds()
            if (bulkBusy || !api || !ids.length) return
            bulkBusy = true
            bulkArm = 0
            refreshBulk()

            // What each id looks like right now, read off the cards. An
            // extension already in the target state is left alone, so it
            // costs no prompt and isn't counted as a change.
            var state = cardState()

            var ok = 0, same = 0, fail = 0, left = 0
            for (var i = 0; i < ids.length; i++) {
                var id = ids[i]
                if (isSelf(id) || state[id] === off) { same++; continue }
                var err = null
                try { await api.setDisabled(id, off) } catch (e) { err = e }
                if (!err) { ok++; continue }
                if (isDenial(err)) { left = ids.length - i - 1; break }
                fail++
            }

            bulkBusy = false
            var word = off ? "disabled" : "enabled"
            var msg = ok + " " + word
            if (same) msg += ", " + same + " already " + word
            if (fail) msg += ", " + fail + " failed"
            try {
                if (left) ctx.toast.info("Marketplace+: stopped — " + msg + ", " + left + " left")
                else if (fail && !ok) ctx.toast.alert("Marketplace+: " + msg)
                else ctx.toast.success("Marketplace+: " + msg)
            } catch (e) { }

            // A cancelled run keeps select mode and the selection, so the
            // user can drop a few and try again without starting over.
            if (left) { refreshBulk(); redressCards() }
            else setSelectMode(false)
        }

        // The Select toggle and its action row. Built once per toolbar mount,
        // installed page only; returns null when the running Seanime has no
        // enable/disable API to call, so older builds simply don't see it.
        async function makeBulkBox(myEpoch) {
            if (!pref("bulkTools") || !bulkSupported()) return null
            var parts = null
            try {
                parts = await Promise.all([
                    ctx.dom.createElement("div").catch(function () { return null }),
                    ctx.dom.createElement("div").catch(function () { return null }),
                ])
            } catch (e) { return null }
            if (!parts || !parts[0] || !parts[1]) return null
            var wrap = parts[0], bar = parts[1]

            // A fresh toolbar means a fresh page; never inherit a selection,
            // and never leave the previous control behind — the handle only
            // reaches one element, so a second one would be unreachable.
            resetSelection()
            if (selWrapEl) { try { selWrapEl.remove() } catch (e) { } }
            selWrapEl = wrap

            try { wrap.setCssText("display:inline-flex;align-items:center;gap:6px;flex-wrap:wrap") } catch (e) { }
            try { wrap.setInnerHTML("<button type='button' class='" + btnClass(K_BTN_MD, "gray", "mplus-selbtn") + "'>Select</button>") } catch (e) { }

            // Action order here is the order the handlers are bound in below.
            var plan = [["all", ""], ["none", ""]]
            var actBtn = function (text, mark) {
                return "<button type='button' class='" + btnClass(K_BTN_SM, "gray", mark) + "'>" + xml(text) + "</button>"
            }
            var barHtml = "<span class='mplus-bcount'>0 selected</span>" +
                actBtn("All", "mplus-act") + actBtn("None", "mplus-act")
            for (var i = 0; i < TYPE_PICKS.length; i++) {
                plan.push(["type", TYPE_PICKS[i][0]])
                barHtml += actBtn("+ " + TYPE_PICKS[i][1], "mplus-act")
            }
            barHtml += "<button type='button' class='" + btnClass(K_BTN_SM, "warn", "mplus-bdis") + "'>Disable</button>" +
                "<button type='button' class='" + btnClass(K_BTN_SM, "ok", "mplus-bena") + "'>Enable</button>"
            try { bar.setCssText("display:none;align-items:center;gap:6px;flex-wrap:wrap") } catch (e) { }
            try { bar.setInnerHTML(barHtml) } catch (e) { }
            try { wrap.append(bar) } catch (e) { }

            var found = null
            try {
                found = await Promise.all([
                    wrap.query(".mplus-selbtn").catch(function () { return [] }),
                    bar.query(".mplus-bcount").catch(function () { return [] }),
                    bar.query(".mplus-act").catch(function () { return [] }),
                    bar.query(".mplus-bdis").catch(function () { return [] }),
                    bar.query(".mplus-bena").catch(function () { return [] }),
                ])
            } catch (e) { }
            if (!found) return wrap

            selBarEl = bar
            selBtnEl = (found[0] && found[0].length) ? found[0][0] : null
            selLblEl = (found[1] && found[1].length) ? found[1][0] : null
            bulkDisEl = (found[3] && found[3].length) ? found[3][0] : null
            bulkEnaEl = (found[4] && found[4].length) ? found[4][0] : null

            if (selBtnEl) {
                try {
                    selBtnEl.addEventListener("click", function () {
                        if (myEpoch !== epoch) return
                        setSelectMode(!selectMode)
                    })
                } catch (e) { }
            }
            var acts = found[2] || []
            for (var a = 0; a < acts.length && a < plan.length; a++) {
                (function (el, kind, val) {
                    try {
                        el.addEventListener("click", function () {
                            if (myEpoch !== epoch) return
                            if (kind === "all") selectByType("")
                            else if (kind === "none") selectNone()
                            else selectByType(val)
                        })
                    } catch (e) { }
                })(acts[a], plan[a][0], plan[a][1])
            }
            if (bulkDisEl) {
                try {
                    bulkDisEl.addEventListener("click", function () {
                        if (myEpoch !== epoch || bulkBusy) return
                        if (bulkArm === 1) runBulk(true).catch(function () { })
                        else arm(1)
                    })
                } catch (e) { }
            }
            if (bulkEnaEl) {
                try {
                    bulkEnaEl.addEventListener("click", function () {
                        if (myEpoch !== epoch || bulkBusy) return
                        if (bulkArm === 2) runBulk(false).catch(function () { })
                        else arm(2)
                    })
                } catch (e) { }
            }
            refreshBulk()
            syncBulkVisible()
            return wrap
        }

        // ------------------------------------------------ toolbar injection
        async function placeControls(searchInputs) {
            if (!searchInputs || !searchInputs.length) return
            for (var i = 0; i < searchInputs.length; i++) {
                var field = searchInputs[i]
                var fid = field && field.id ? String(field.id) : ""
                try { field.setAttribute("data-mplus-ui", "1") } catch (e) { }

                // Which of the two extension pages is this? The Languages
                // <Select> sits on the marketplace row and nowhere else, so
                // its presence is the page test. Run before the seenInputs
                // guard so a remount that reuses an element id still
                // refreshes the flag.
                var holder = null, row = null, langSel = []
                try { holder = await field.getParent() } catch (e) { }
                if (holder) { try { row = await holder.getParent() } catch (e) { } }
                if (row) { try { langSel = await row.query(".UI-Select__root") } catch (e) { } }
                // Page test. The old one keyed off the Languages <Select>,
                // which only the marketplace row has — but it is a sibling that
                // can mount after this runs, so the marketplace read as the
                // installed page often enough to put a Select button there.
                // The search box names itself instead ("Search installed
                // extensions…" vs the marketplace's own text) and it is the
                // element this loop already holds, so there is nothing to wait
                // for. The Languages select stays as a cross-check, and when
                // neither says anything the answer is "marketplace", because a
                // missing Select button is a smaller fault than one that does
                // nothing where it does not belong.
                var ph = ""
                try { ph = String((await field.getAttribute("placeholder")) || "") } catch (e) { ph = "" }
                var saysInstalled = /installed/i.test(ph)
                var isMarket = saysInstalled ? false : true
                // Carrying a "Disabled" pick onto the marketplace would leave
                // the dropdown showing a value its own menu doesn't have.
                if (isMarket && statusPick.get() === "disabled") statusPick.set("all")
                if (onMarketplace !== isMarket) {
                    onMarketplace = isMarket
                    refreshFilter().catch(function () { })
                }
                // Select mode means nothing on the marketplace: the cards there
                // get no checkbox, so leaving it on would strand the action row
                // with a selection that can never be made.
                if (isMarket && selectMode) setSelectMode(false)
                syncBulkVisible()

                if (fid && seenInputs[fid]) continue
                if (fid) seenInputs[fid] = true
                var myEpoch = epoch

                if (!nativeBoxClass) {
                    try {
                        var c = await field.getAttribute("class")
                        nativeBoxClass = c ? String(c) : ""
                    } catch (e) { }
                }

                // mirror Seanime's search box so broken cards reappear while searching
                ;(function (f, ep) {
                    var pending = 0
                    var track = function () {
                        if (ep !== epoch) return
                        var ticket = ++pending
                        try {
                            f.getProperty("value").then(function (v) {
                                if (ticket !== pending || ep !== epoch) return
                                var s = v == null ? "" : String(v)
                                if (s !== searchText.get()) {
                                    searchText.set(s)
                                    refreshFilter().catch(function () { })
                                }
                            }).catch(function () { })
                        } catch (e) { }
                    }
                    try { f.addEventListener("input", track) } catch (e) { }
                    try { f.addEventListener("keyup", track) } catch (e) { }
                })(field, myEpoch)

                var built = [null, null, null, null]
                try {
                    built = await Promise.all([
                        makeDropdown(isMarket ? STATUS_MENU : STATUS_MENU_INSTALLED, statusPick, function () { refreshFilter().catch(function () { }) }, myEpoch).catch(function () { return null }),
                        makeDropdown(SORT_MENU, sortPick, refreshSort, myEpoch).catch(function () { return null }),
                        makeAuthorBox(myEpoch).catch(function () { return null }),
                        saysInstalled ? makeBulkBox(myEpoch).catch(function () { return null }) : Promise.resolve(null),
                    ])
                } catch (e) { }
                var ddStatus = built[0], ddSort = built[1], authorBox = built[2], bulkBox = built[3]

                if (langSel && langSel.length) {
                    // Marketplace row → [Status][Sort][Languages][Author][Search]
                    if (ddStatus) { try { langSel[0].before(ddStatus) } catch (e) { } }
                    if (ddSort) { try { langSel[0].before(ddSort) } catch (e) { } }
                    if (authorBox && holder) { try { holder.before(authorBox) } catch (e) { } }
                } else if (holder) {
                    // Installed page → inline group beside the search box.
                    // Only insert our own nodes; never move Seanime's (breaks React).
                    var group = null
                    try { group = await ctx.dom.createElement("div") } catch (e) { }
                    if (group) {
                        try { group.setCssText("display:inline-flex;vertical-align:top;flex-wrap:wrap;gap:8px;align-items:center;margin-right:8px") } catch (e) { }
                        if (ddStatus) { try { group.append(ddStatus) } catch (e) { } }
                        if (ddSort) { try { group.append(ddSort) } catch (e) { } }
                        if (authorBox) { try { group.append(authorBox) } catch (e) { } }
                        if (bulkBox) { try { group.append(bulkBox) } catch (e) { } }
                        try { holder.setStyle("display", "inline-flex") } catch (e) { }
                        try { holder.setStyle("vertical-align", "top") } catch (e) { }
                        try { holder.setStyle("width", "380px") } catch (e) { }
                        try { holder.setStyle("max-width", "100%") } catch (e) { }
                        try { holder.before(group) } catch (e) { }
                    }
                }
            }
        }

        // ------------------------------------------------ feed sync
        function syncFeed(force) {
            if (fetching) return
            var age = Date.now() - fetchedAt
            if (!force && catalog.get().length > 0 && age < FRESH_FOR) return
            fetching = true
            http(FEED_URL, { timeout: 15 }).then(function (res) {
                if (res.ok) {
                    var data = res.json()
                    if (Array.isArray(data)) {
                        catalog.set(data)
                        indexCatalog()
                        fetchedAt = Date.now()
                        try { $storage.set(STORE_KEY, { at: fetchedAt, items: data }) } catch (e) { }
                    }
                }
                fetching = false
                watchCards()
                watchModals()
            }).catch(function () { fetching = false })
        }

        // ------------------------------------------------ stuck-stream watchdog
        // The client silently retries when an onlinestream provider fails
        // (episode-source 500, or a provider whose search just never
        // resolves) — the player spins forever with no error shown. Two
        // distinct hangs happen in practice:
        //
        //   1. a <video> element is mounted but never gets a usable
        //      source, so it sits at readyState 0;
        //   2. the client never even reaches the player and keeps showing
        //      its "Loading stream" placeholder — no <video> exists at all.
        //
        // Case 2 is the common one when a provider fails during search,
        // so both are treated as stuck. Detection avoids Seanime's class
        // names (they change between releases): case 1 keys off the
        // <video> tag, case 2 off the visible placeholder text.
        //
        // Provider attribution is best-effort — the visible provider
        // dropdown text (e.g. "FR | Vostfree") is matched against the
        // feed's onlinestream-provider names; when no match is found the
        // card falls back to a generic Discord link.
        // Real detection latency is W_STUCK_AFTER plus up to two polls,
        // since the timer starts at the first poll that sees the stall.
        // 10s + 2s polling ≈ 10-14s on screen. Being early is cheap: the
        // card removes itself as soon as a stream actually loads, so a
        // slow-but-working provider just flashes it briefly.
        var W_STUCK_AFTER = 10000  // ms of no playable stream before we call it stuck
        var W_POLL = 2000          // watchdog poll interval
        // Placeholder text Seanime shows while resolving a stream. Lower-case.
        // If the ui-translation plugin localises this string the match fails
        // and detection falls back to the <video> readyState check.
        var W_LOADING_TEXT = "loading stream"
        // Lower-case text unique to the online-streaming player toolbar. Its
        // presence is what tells the watchdog it's looking at online streaming
        // and not debrid/torrent/local playback. Keep these specific — a
        // marker that also appears in other players would re-introduce the
        // debrid false-positive.
        var OS_MARKERS = ["try all available providers"]
        // Fallback link when the stuck provider isn't in the marketplace feed
        // (so there's no support thread to point at). Invite link to the
        // Discord server rather than the guild root, which lands on the
        // server's default channel.
        var FORUM_URL = "https://discord.gg/4KQ7QRAV6j"

        var wVideos = {}    // element-id → video element handle
        var wBadSince = 0   // when readyState 0 was first seen (0 = healthy)
        var wShown = false  // card fired for this stuck episode (resets on recovery/nav)
        var wCard = null
        var wPollEpoch = -1
        var wPath = ""          // last known route; "" = unknown, so don't gate
        var wProvLabel = null   // provider label seen last poll; null = not tracking

        function wHealthy() {
            wBadSince = 0
            wShown = false
            wProvLabel = null
            if (wCard) { try { wCard.remove() } catch (e) { } wCard = null }
        }

        function hideStuckCard() {
            if (wCard) { try { wCard.remove() } catch (e) { } wCard = null }
            // wShown stays true — don't nag again until recovery or navigation
        }

        function provList() {
            var items = catalog.get()
            var provs = []
            for (var i = 0; i < items.length; i++) {
                var it = items[i]
                if (it && it.type === "onlinestream-provider" && it.name) provs.push(it)
            }
            return provs
        }

        // Feed names carry the same shape as the dropdown label
        // ("FR | Vostfree"), so an exact or substring hit is reliable.
        function entryFromLabel(label) {
            if (!label) return null
            var provs = provList()
            for (var k = 0; k < provs.length; k++) {
                var n = String(provs[k].name).toLowerCase()
                if (label === n || (n.length >= 4 && label.indexOf(n) !== -1)) return provs[k]
            }
            return null
        }

        // Best-effort read of the selected provider's dropdown label. Used
        // both to name the provider on the card and to notice the user
        // switching provider mid-stall. Falls back to the first plausible
        // dropdown label so a provider missing from the feed still yields
        // a stable string to compare against.
        async function readProviderLabel() {
            var b = await body()
            if (!b) return ""
            var els = []
            try { els = await b.query("button[role='combobox'], [class*='UI-Select__trigger'], [class*='Select__value']") } catch (e) { }
            var provs = provList()
            var firstText = ""
            for (var j = 0; j < (els || []).length && j < 40; j++) {
                var t = ""
                try {
                    var v = await els[j].getProperty("textContent")
                    t = v == null ? "" : String(v)
                } catch (e) { continue }
                t = t.trim().toLowerCase()
                if (!t || t.length > 60) continue
                if (!firstText) firstText = t
                for (var k = 0; k < provs.length; k++) {
                    var n = String(provs[k].name).toLowerCase()
                    if (t === n || (n.length >= 4 && t.indexOf(n) !== -1)) return t
                }
            }
            return firstText
        }

        async function showStuckCard(entry) {
            if (wCard) return
            var b = await body()
            if (!b) return
            var card = null
            try { card = await ctx.dom.createElement("div") } catch (e) { }
            if (!card) return
            try { card.setAttribute("class", "mplus-alert") } catch (e) { }

            var title = entry ? xml(String(entry.name)) + " seems stuck" : "Stream seems stuck"
            var text
            if (entry) {
                text = "The player has been loading for a while. This provider " +
                    (statusOf(entry) === "broken"
                        ? "is marked <b>Broken</b> on the marketplace"
                        : "may be having issues") +
                    " — check its support thread:"
            } else {
                text = "The player has been loading for a while — the selected streaming provider may be broken. Ask on the Discord server:"
            }
            var buttons = ""
            if (entry && entry.threadId) buttons += chatHtml(entry.threadId)
            else buttons += "<a class='mplus-chip mplus-chat' href='" + FORUM_URL + "' target='_blank' rel='noreferrer' title='Open the Seanime marketplace Discord server'>" + SVG_CHAT + " Discord</a>"
            buttons += "<span class='mplus-chip mplus-ver mplus-alert-x'>Dismiss</span>"

            try {
                card.setInnerHTML(
                    "<div class='mplus-alert-t'>" + title + "</div>" +
                    "<div class='mplus-alert-b'>" + text + "</div>" +
                    "<div class='mplus-line'>" + buttons + "</div>"
                )
            } catch (e) { }
            try { b.append(card) } catch (e) { }
            wCard = card

            try {
                var xs = await card.query(".mplus-alert-x")
                if (xs && xs.length) xs[0].addEventListener("click", function () { hideStuckCard() })
            } catch (e) { }
        }

        // Single page-text read per poll. Reports two things at once:
        //   placeholder → the "Loading stream" text is on screen
        //   context     → we're actually in the online-streaming player
        // The context flag is the important one: debrid, torrent and local
        // playback also show "Loading stream" (the external MPV overlay sends
        // exactly that) and mount no <video>, so without a positive
        // online-stream signal the watchdog fired forever during debrid. The
        // "Try all available providers" control only exists on the integrated
        // streaming player, so it's the discriminator.
        async function wPageProbe() {
            var out = { placeholder: false, context: false }
            if (wPath && wPath.indexOf("entry") === -1 && wPath.indexOf("onlinestream") === -1) return out
            var b = await body()
            if (!b) return out
            var t = null
            try { t = await b.getProperty("textContent") } catch (e) { return out }
            if (t == null) return out
            var low = String(t).toLowerCase()
            out.placeholder = low.indexOf(W_LOADING_TEXT) !== -1
            for (var i = 0; i < OS_MARKERS.length; i++) {
                if (low.indexOf(OS_MARKERS[i]) !== -1) { out.context = true; break }
            }
            return out
        }

        async function wCheck() {
            if (!pref("streamAlerts")) { wHealthy(); return }
            var ids = []
            for (var k in wVideos) ids.push(k)
            var anyVideo = false, anyReady = false
            for (var i = 0; i < ids.length; i++) {
                var h = wVideos[ids[i]]
                var rs = null
                try { rs = await h.getProperty("readyState") } catch (e) { delete wVideos[ids[i]]; continue }
                anyVideo = true
                if (rs != null && Number(rs) >= 1) anyReady = true
            }
            if (anyReady) { wHealthy(); return }

            var probe = { placeholder: false, context: false }
            try { probe = await wPageProbe() } catch (e) { }
            // stuck = a video that never got a source, or the placeholder
            // still on screen with no video mounted at all
            var stuck = anyVideo || probe.placeholder
            if (!stuck) { wHealthy(); return }

            var label = ""
            try { label = await readProviderLabel() } catch (e) { }
            var known = entryFromLabel(label)

            // Gate: only the integrated online-streaming player triggers this.
            // Requires either an online-stream toolbar marker or a recognised
            // streaming provider selected. Debrid/torrent/local playback (esp.
            // an external MPV window) satisfies neither, so it never fires.
            if (!probe.context && !known) { wHealthy(); return }

            var now = Date.now()

            // Switching provider starts a new attempt: the freshly picked
            // one deserves its own grace period, and any card naming the
            // previous provider is now wrong.
            if (wProvLabel !== null && label !== wProvLabel) {
                if (wCard) { try { wCard.remove() } catch (e) { } wCard = null }
                wBadSince = now
                wShown = false
                wProvLabel = label
                return
            }
            wProvLabel = label

            if (!wBadSince) { wBadSince = now; return }
            if (now - wBadSince < W_STUCK_AFTER || wShown) return
            wShown = true
            showStuckCard(known).catch(function () { })
        }

        function wPoll(myEpoch) {
            if (myEpoch !== epoch) return
            wCheck().catch(function () { }).then(function () {
                try { ctx.setTimeout(function () { wPoll(myEpoch) }, W_POLL) } catch (e) { }
            })
        }

        function watchVideos() {
            if (!pageReady) return
            if (stopVideos) { try { stopVideos() } catch (e) { } stopVideos = null }
            wVideos = {}
            try {
                var obs = ctx.dom.observe("video", function (els) {
                    var next = {}
                    for (var i = 0; i < (els || []).length; i++) {
                        var el = els[i]
                        if (!el) continue
                        var id = (el.id != null) ? String(el.id) : ("x" + i)
                        next[id] = el
                    }
                    wVideos = next
                })
                stopVideos = (obs && obs.length) ? obs[0] : null
            } catch (e) { }
            if (wPollEpoch !== epoch) {
                wPollEpoch = epoch
                wPoll(epoch)
            }
        }

        // ------------------------------------------------ marketplace source
        // Seanime exposes the marketplace URL to plugins through
        // ctx.extensions.get/setMarketplaceUrl. Both are optional: older
        // builds don't have them and the call throws without the
        // "extensions" scope, so every path here degrades to a no-op and
        // the tray group simply doesn't render.
        //
        // Both calls put a permission prompt in front of the user, and
        // Seanime's approval cache for them lives on the plugin context, so
        // it starts empty on every launch. Nothing here may run on its own
        // at boot: the URL we last set is cached in $storage and the API is
        // only touched when the user presses something.
        function srcApi() {
            try {
                var api = ctx.extensions
                if (api && typeof api.setMarketplaceUrl === "function") return api
            } catch (e) { }
            return null
        }
        function srcSupported() { return !!srcApi() }

        async function readSrcUrl() {
            var api = srcApi()
            if (!api || typeof api.getMarketplaceUrl !== "function") return null
            var v = null
            try { v = await api.getMarketplaceUrl() } catch (e) { return null }
            var s = (v == null) ? "" : String(v).trim()
            srcUrl.set(s)
            try { $storage.set(SRC_KEY, s) } catch (e) { }
            try { if (srcInput) srcInput.setValue(s) } catch (e) { }
            return s
        }

        // true once the user has answered the prompt, either way
        function srcAsked() {
            try { return !!$storage.get(ASK_KEY) } catch (e) { return false }
        }
        function markSrcAsked() {
            try { $storage.set(ASK_KEY, true) } catch (e) { }
        }
        // $storage.remove exists on current builds; older ones get a null
        // write, which reads back falsy just the same.
        function dropKey(k) {
            try {
                if (typeof $storage.remove === "function") { $storage.remove(k); return }
            } catch (e) { }
            try { $storage.set(k, null) } catch (e) { }
        }
        // Puts the plugin back to how it looks on a fresh install: the
        // first-run card returns on the next start, the cached URL and the
        // cached feed are gone. Seanime's own marketplace URL is left alone
        // - clearing that would need a permission prompt, and the point of
        // this button is to test the prompt, not to fire one.
        function forgetSrc() {
            dropKey(ASK_KEY)
            dropKey(SRC_KEY)
            dropKey(STORE_KEY)
            srcUrl.set("")
            try { if (srcInput) srcInput.setValue("") } catch (e) { }
        }

        async function setSrcUrl(url, quiet) {
            var api = srcApi()
            if (!api) return false
            try {
                await api.setMarketplaceUrl(url)
                srcUrl.set(url)
                try { $storage.set(SRC_KEY, url) } catch (e) { }
                try { if (srcInput) srcInput.setValue(url) } catch (e) { }
                if (!quiet) {
                    try {
                        ctx.toast.success(url
                            ? "Marketplace source updated \u2014 reopen the Extensions page to load it"
                            : "Marketplace source cleared")
                    } catch (e) { }
                }
                syncFeed(true)
                return true
            } catch (e) {
                var m = (e && e.message) ? e.message : String(e)
                try { ctx.toast.alert("Couldn't set the marketplace source: " + m) } catch (er) { }
                return false
            }
        }

        function hideSrcCard() {
            if (srcCard) { try { srcCard.remove() } catch (e) { } srcCard = null }
        }

        // One-time offer, bottom-right, same shape as the stuck-stream card.
        // Answering either way writes the flag, so it is genuinely asked once.
        async function showSrcCard() {
            if (srcCard || srcOpening) return
            srcOpening = true
            var b = await body()
            if (!b) { srcOpening = false; return }
            var card = null
            try { card = await ctx.dom.createElement("div") } catch (e) { }
            if (!card) { srcOpening = false; return }
            try { card.setAttribute("class", "mplus-alert mplus-setup") } catch (e) { }

            // Deliberately doesn't read the URL Seanime currently has:
            // that read costs a permission prompt, and asking for one before
            // the user has agreed to anything is exactly the nagging this
            // card exists to avoid.
            var text = "Marketplace+ works best with the community marketplace feed. " +
                "Set it as Seanime's marketplace source? This replaces whatever " +
                "source is configured now.<code>" + xml(FEED_URL) + "</code>"

            try {
                card.setInnerHTML(
                    "<div class='mplus-alert-t'>Marketplace+ setup</div>" +
                    "<div class='mplus-alert-b'>" + text + "</div>" +
                    "<div class='mplus-line'>" +
                    "<span class='mplus-chip mplus-go mplus-src-yes'>Use recommended source</span>" +
                    "<span class='mplus-chip mplus-ver mplus-skip mplus-src-no'>Not now</span>" +
                    "</div>"
                )
            } catch (e) { }
            try { b.append(card) } catch (e) { }
            srcCard = card
            srcOpening = false

            try {
                var yes = await card.query(".mplus-src-yes")
                if (yes && yes.length) {
                    yes[0].addEventListener("click", function () {
                        if (srcBusy) return
                        srcBusy = true
                        markSrcAsked()
                        hideSrcCard()
                        setSrcUrl(FEED_URL, false).then(function () { srcBusy = false })
                            .catch(function () { srcBusy = false })
                    })
                }
                var no = await card.query(".mplus-src-no")
                if (no && no.length) {
                    no[0].addEventListener("click", function () {
                        markSrcAsked()
                        hideSrcCard()
                    })
                }
            } catch (e) { }
        }

        // Runs on every boot, but only ever does something the first time.
        // Once the user has answered, this returns before touching the
        // extensions API, so no permission prompt appears at startup again.
        function checkSrc() {
            if (!srcSupported()) return
            if (srcAsked()) return
            try { if (srcInput) srcInput.setValue(srcUrl.get()) } catch (e) { }
            showSrcCard().catch(function () { })
        }

        // ------------------------------------------------ settings tray
        // Card decoration is cached per element (marks), so flipping a
        // switch has to drop the cache and re-run the observers before
        // anything on screen changes.
        function applySettings() {
            marks = {}
            modalMarks = {}
            refreshFilter().catch(function () { })
            watchCards()
            watchModals()
            if (!pref("streamAlerts")) wHealthy()
        }

        var REFS = {}
        var srcInput = null
        try { srcInput = ctx.fieldRef("") } catch (e) { srcInput = null }
        function refFor(key) {
            if (REFS[key] !== undefined) return REFS[key]
            var r = null
            try { r = settings.fieldRef(key) } catch (e) { r = null }
            if (r) {
                try {
                    r.onValueChange(function (v) {
                        try { settings.set(key, !!v) } catch (e) { }
                        applySettings()
                    })
                } catch (e) { }
            }
            REFS[key] = r
            return r
        }

        var TRAY_CSS =
            ".mpset{width:300px;max-width:100%}" +
            ".mpset-head{padding:2px 2px 10px}" +
            ".mpset-title{font-weight:700;font-size:14px}" +
            ".mpset-sub{font-size:11px;opacity:.5;margin-top:2px}" +
            ".mpset-h{font-size:10px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;opacity:.45;margin:2px 2px 6px}" +
            ".mpset-card{background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.06);border-radius:8px;padding:8px 10px;margin-bottom:12px}" +
            ".mpset-foot{padding-top:2px}" +
            ".mpset-note{font-size:11px;opacity:.5;margin:0 2px 6px;word-break:break-all}" +
            ".mpset-btns{margin-top:6px}"

        // One switch row. Falls back to a plain label if the field ref
        // couldn't be created, so a partial failure never breaks render.
        function sw(key, label) {
            var r = refFor(key)
            return r ? tray.switch(label, { fieldRef: r, size: "sm" }) : tray.text(label)
        }
        // Line above the URL field in the tray. Shows the cached value,
        // not a live read - reading costs the user a permission prompt, so
        // that only happens when they press "Check current".
        function srcNote() {
            var u = srcUrl.get()
            if (!u) return "Not set through Marketplace+."
            if (u === FEED_URL) return "Set to the recommended source."
            return "Set to: " + u
        }
        // Rows of the "Marketplace source" group. The URL field is only
        // offered when a field ref could be created; the button that sets
        // the recommended source always works on its own.
        function srcRows() {
            var rows = [tray.text(srcNote(), { className: "mpset-note" })]
            var btns = []
            if (srcInput) {
                rows.push(tray.input("Marketplace URL", { fieldRef: srcInput, placeholder: "https://..." }))
                btns.push(tray.button("Save", { onClick: "mplus-src-save", size: "sm", intent: "primary-subtle" }))
            }
            btns.push(tray.button("Use recommended", { onClick: "mplus-src-default", size: "sm", intent: "gray-subtle" }))
            btns.push(tray.button("Check current", { onClick: "mplus-src-check", size: "sm", intent: "gray-subtle" }))
            rows.push(tray.flex(btns, { gap: 1, className: "mpset-btns" }))
            return rows
        }
        function group(title, rows) {
            return tray.div([
                tray.text(title, { className: "mpset-h" }),
                tray.stack(rows, { gap: 1, className: "mpset-card" }),
            ])
        }

        // Tray button icon — the marketplace's layered-stack logo. PNG, not
        // SVG: raw.githubusercontent serves .svg as text/plain so it never
        // renders in an <img>, and the tray rejects data URIs.
        var TRAY_ICON = "https://raw.githubusercontent.com/Bas1874/Seanime-Marketplace/refs/heads/main/Icons/favicon.png"

        var tray = null
        if (settings) {
            var trayOpts = { tooltipText: "Marketplace+ settings", withContent: true, isDrawer: false }
            if (TRAY_ICON) trayOpts.iconUrl = TRAY_ICON
            try { tray = ctx.newTray(trayOpts) } catch (e) { tray = null }
        }
        if (tray) {
            try {
                ctx.registerEventHandler("mplus-src-default", function () {
                    markSrcAsked()
                    setSrcUrl(FEED_URL, false).catch(function () { })
                })
                // The only place that reads the URL back, because Seanime
                // asks the user for permission the first time it is called
                // each launch. Pressing the button makes that prompt expected.
                ctx.registerEventHandler("mplus-src-forget", function () {
                    forgetSrc()
                    try {
                        ctx.toast.success("Setup reset \u2014 Marketplace+ will ask about the marketplace source again next time Seanime starts")
                    } catch (e) { }
                })
                ctx.registerEventHandler("mplus-src-check", function () {
                    readSrcUrl().then(function (u) {
                        if (u == null) return
                        try { ctx.toast.info(u ? ("Marketplace source: " + u) : "No marketplace source set") } catch (e) { }
                    }).catch(function () { })
                })
                ctx.registerEventHandler("mplus-src-save", function () {
                    var v = ""
                    try { v = srcInput ? String(srcInput.current || "").trim() : "" } catch (e) { v = "" }
                    markSrcAsked()
                    setSrcUrl(v, false).catch(function () { })
                })
            } catch (e) { }

            try {
                ctx.registerEventHandler("mplus-reset", function () {
                    try { settings.reset() } catch (e) { }
                    for (var k in REFS) {
                        if (REFS[k]) { try { REFS[k].setValue(DEFAULTS[k]) } catch (e) { } }
                    }
                    applySettings()
                    try { ctx.toast.success("Marketplace+ settings reset") } catch (e) { }
                })
            } catch (e) { }

            try {
                tray.render(function () {
                    return tray.stack([
                        tray.css(TRAY_CSS),
                        tray.div([
                            tray.text("Marketplace+", { className: "mpset-title" }),
                            tray.text("Choose what gets added to Seanime", { className: "mpset-sub" }),
                        ], { className: "mpset-head" }),

                        group("Card badges", [
                            sw("chipVersion", "Version"),
                            sw("chipStatus", "Status"),
                            sw("chipNew", "New"),
                            sw("chipLang", "Language code"),
                            sw("chipAudio", "Sub / dub tags"),
                            sw("chipAuthor", "Author"),
                            sw("chipLanguage", "Written language"),
                            sw("chipStars", "Stars"),
                            sw("chipUpdated", "Last updated"),
                            sw("chipSupport", "Support buttons"),
                        ]),

                        group("Marketplace", [
                            sw("detailsBox", "Extra info in details dialog"),
                            sw("hideBroken", "Hide broken on marketplace until searched"),
                            sw("bulkTools", "Bulk enable/disable on Installed"),
                        ]),

                        srcSupported() ? group("Marketplace source", srcRows()) : tray.div([]),

                        group("Video player", [
                            sw("streamAlerts", "Warn when a stream is stuck"),
                        ]),

                        tray.div([
                            tray.flex([
                                tray.button("Reset to defaults", { onClick: "mplus-reset", size: "sm", intent: "gray-subtle" }),
                                srcSupported()
                                    ? tray.button("Reset setup", { onClick: "mplus-src-forget", size: "sm", intent: "gray-subtle" })
                                    : tray.div([]),
                            ], { gap: 1 }),
                        ], { className: "mpset-foot" }),
                    ], { gap: 0, className: "mpset" })
                })
            } catch (e) { }
        }

        // ------------------------------------------------ observers / lifecycle
        function watchControls() {
            if (!pageReady) return
            if (stopControls) { try { stopControls() } catch (e) { } stopControls = null }
            try {
                var obs = ctx.dom.observe('input[placeholder*="extensions"]:not([data-mplus-ui])', function (els) { placeControls(els).catch(function () { }) })
                stopControls = (obs && obs.length) ? obs[0] : null
            } catch (e) { }
        }
        function watchCards() {
            if (!pageReady || catalog.get().length === 0) return
            if (stopCards) { try { stopCards() } catch (e) { } stopCards = null }
            try {
                // watch every card (not just new ones) so identity changes
                // from Seanime's own filters get picked up and re-decorated
                var obs = ctx.dom.observe('[class*="extension-card"]', dressCards, { withInnerHTML: true })
                stopCards = (obs && obs.length) ? obs[0] : null
                // obs[1] re-delivers every match on demand — used when select
                // mode toggles, since nothing in the DOM changes on its own.
                refetchCards = (obs && obs.length > 1 && typeof obs[1] === "function") ? obs[1] : null
            } catch (e) { }
            refreshFilter().catch(function () { })
        }
        function watchModals() {
            if (!pageReady || catalog.get().length === 0) return
            if (stopModals) { try { stopModals() } catch (e) { } stopModals = null }
            try {
                var obs = ctx.dom.observe(".UI-Modal__content", dressModals, { withInnerHTML: true })
                stopModals = (obs && obs.length) ? obs[0] : null
            } catch (e) { }
        }
        function wipeHandles() {
            // A client reload resets the frontend element-id counter, so any
            // held handles go stale — drop everything and rebuild fresh.
            epoch++
            if (sheetEl) { try { sheetEl.remove() } catch (e) { } sheetEl = null }
            if (filterEl) { try { filterEl.remove() } catch (e) { } filterEl = null }
            bodyEl = null
            seenInputs = {}
            onMarketplace = false
            marks = {}
            modalMarks = {}
            refetchCards = null
            resetSelection()
            selWrapEl = null
            wVideos = {}
            srcCard = null
            wCard = null
            wBadSince = 0
            wShown = false
            wProvLabel = null
        }
        function boot() {
            pageReady = true
            mountStyle(SHEET).then(function (el) { sheetEl = el }).catch(function () { })
            watchControls()
            watchCards()
            watchModals()
            watchVideos()
            syncFeed(false)
            try { checkSrc() } catch (e) { }
        }

        try { ctx.dom.onReady(function () { wipeHandles(); boot() }) } catch (e) { }
        try { ctx.dom.onMainTabReady(function () { wipeHandles(); boot() }) } catch (e) { }
        try {
            ctx.screen.onNavigate(function (e) {
                try { wPath = (e && e.pathname) ? String(e.pathname) : "" } catch (er) { wPath = "" }
                onMarketplace = false   // re-detected when the toolbar mounts
                resetSelection()        // a selection never crosses a navigation
                wHealthy(); watchControls(); watchCards(); watchModals(); watchVideos()
            })
        } catch (e) { }
        ctx.setTimeout(function () { if (!pageReady) boot() }, 3000)
    })
}
