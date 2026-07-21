// ================================================================
//  Marketplace+ v1.1.0  ·  by bas1874
//  Based on original seatags concept by Aqua
// ================================================================

function init() {
    $ui.register(function (ctx) {

        // ------------------------------------------------ settings
        var FEED_URL = "https://raw.githubusercontent.com/Bas1874/Seanime-Marketplace/refs/heads/main/Marketplace/Main.json"
        var DISCORD_GUILD = "1224767201551192224"
        var STORE_KEY = "mplus:feed:v2"
        var FRESH_FOR = 60 * 60 * 1000 // refetch after 1 hour
        var BATCH = 12                 // cards decorated per tick

        var STATUS_MENU = [
            ["all", "Any status"],
            ["working", "Working"],
            ["broken", "Broken"],
            ["deprecated", "Deprecated"],
            ["untagged", "Untagged"],
        ]
        var SORT_MENU = [
            ["default", "Default order"],
            ["stars", "Most stars"],
            ["updated", "Recently updated"],
        ]
        var NEW_FOR = 14 * 86400000 // "New" badge window: 14 days

        // Discord forum tag IDs worth showing as chips. Type tags (anime,
        // manga, torrent, …) are skipped — Seanime already displays the type.
        var TAG_CHIPS = {
            "1505936860441083904": ["Sub only", "mplus-audio"],
            "1505936927189110988": ["Dub only", "mplus-audio"],
            "1505937222891733062": ["Sub & Dub", "mplus-audio"],
            "1359259306087940146": ["Other", "mplus-plain"],
        }

        // Seanime UI classes reused so our controls look native
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
            ".mplus-alert-x:hover{background:rgba(225,225,225,.2)}"

        // ------------------------------------------------ state
        var stash = loadStash()
        var catalog = ctx.state(stash.items)
        var statusPick = ctx.state("all")
        var sortPick = ctx.state("default")
        var authorNeedle = ctx.state("")
        var searchText = ctx.state("") // mirror of Seanime's own search box
        var fetchedAt = stash.at
        var fetching = false

        var lookup = { id: {}, name: {} }
        var pageReady = false
        var epoch = 0               // bumped only on client reload
        var seenInputs = {}
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
        }
        // Needs the "settings" scope. Without it the plugin still runs,
        // just with fixed defaults and no tray.
        var settings = null
        try { settings = ctx.settings.define("marketplace-plus", DEFAULTS) } catch (e) { settings = null }

        function pref(k) {
            if (!settings) return DEFAULTS[k]
            try {
                var v = settings.get(k, DEFAULTS[k])
                return (v == null) ? DEFAULTS[k] : !!v
            } catch (e) { return DEFAULTS[k] }
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
                if (it.name) lookup.name[String(it.name).toLowerCase()] = it
            }
        }
        indexCatalog()

        // ------------------------------------------------ tiny utils
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
        function stripHtml(entry, key, ver) {
            var top = ""
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

        function matchEntry(html) {
            var m = html.match(/opacity-30[^>]*>([^<]+)</)
            if (m && lookup.id[m[1].trim()]) return lookup.id[m[1].trim()]
            m = html.match(/font-semibold[^>]*>([^<]+)</)
            if (m && lookup.name[m[1].trim().toLowerCase()]) return lookup.name[m[1].trim().toLowerCase()]
            return null
        }

        // Seanime reuses card elements when its own filters change, so a card
        // can suddenly represent a different extension. Each card carries a
        // hidden identity marker (data-for) — when it no longer matches the
        // content, the card is re-decorated with the right data.
        async function dressCard(card) {
            var html = (card && card.innerHTML) ? String(card.innerHTML) : ""
            var entry = matchEntry(html)
            var ver = nativeVersion(html)
            var st = statusOf(entry)
            var key = entry ? String(entry.id || entry.name || "") : ""
            var cid = (card && card.id != null) ? String(card.id) : ""

            // Synchronous guard: the observer can fire several times before
            // the (async) decoration below lands, so the innerHTML alone
            // can't be trusted to know whether a card was already handled.
            // Re-decoration is allowed whenever the readable native version
            // changes — e.g. a badge that rendered late, or "1.0.0 → 1.0.1"
            // becoming "1.0.1" after an update installs.
            if (cid) {
                var prev = marks[cid]
                if (prev && prev.key === key && prev.ver === ver) return
                marks[cid] = { el: card, entry: entry, status: st, key: key, ver: ver }
            }
            // Plugin restarted but the DOM still carries the right strip.
            // Only skip when the version chip also matches the (hidden but
            // still readable) native badge, so stale chips get refreshed.
            var m = html.match(/data-for=["']([^"']*)["']/)
            if (m && m[1] === key) {
                var cm = html.match(/mplus-ver["'][^>]*>v?([^<]*)</)
                var shown = cm ? cm[1].trim() : ""
                if (shown === (ver ? ver.replace(/^v/i, "") : "")) return
            }

            try { card.setAttribute("data-mplus", st) } catch (e) { }
            try { card.setAttribute("data-mplus-by", entry && entry.author ? String(entry.author).toLowerCase() : "") } catch (e) { }
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
            try { strip.setAttribute("data-for", key) } catch (e) { }

            if (!entry) {
                // invisible marker only — remembers this card was processed
                try { strip.setStyle("display", "none") } catch (e) { }
                try { card.append(strip) } catch (e) { }
                return
            }
            try { strip.setInnerHTML(stripHtml(entry, key, ver)) } catch (e) { }

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
                if (m && lookup.name[m[1].trim().toLowerCase()]) entry = lookup.name[m[1].trim().toLowerCase()]
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
            if (st !== "all") {
                css += '[class*="extension-card"]:not([data-mplus="' + st + '"]){display:none !important}'
            } else if (!searching && pref("hideBroken")) {
                // broken extensions stay hidden until searched for or filtered on
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

        // ------------------------------------------------ toolbar injection
        async function placeControls(searchInputs) {
            if (!searchInputs || !searchInputs.length) return
            for (var i = 0; i < searchInputs.length; i++) {
                var field = searchInputs[i]
                var fid = field && field.id ? String(field.id) : ""
                if (fid && seenInputs[fid]) continue
                if (fid) seenInputs[fid] = true
                try { field.setAttribute("data-mplus-ui", "1") } catch (e) { }
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

                // locate the search container + language <Select> on the same row
                var holder = null, row = null, langSel = []
                try { holder = await field.getParent() } catch (e) { }
                if (holder) { try { row = await holder.getParent() } catch (e) { } }
                if (row) { try { langSel = await row.query(".UI-Select__root") } catch (e) { } }

                var built = [null, null, null]
                try {
                    built = await Promise.all([
                        makeDropdown(STATUS_MENU, statusPick, function () { refreshFilter().catch(function () { }) }, myEpoch).catch(function () { return null }),
                        makeDropdown(SORT_MENU, sortPick, refreshSort, myEpoch).catch(function () { return null }),
                        makeAuthorBox(myEpoch).catch(function () { return null }),
                    ])
                } catch (e) { }
                var ddStatus = built[0], ddSort = built[1], authorBox = built[2]

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
            fetch(FEED_URL, { timeout: 15 }).then(function (res) {
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
        // Fallback when the provider can't be identified. TODO(bas1874):
        // append the plugin-forum channel ID for a direct forum link.
        var FORUM_URL = "https://discord.com/channels/" + DISCORD_GUILD

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
                text = "The player has been loading for a while — the selected streaming provider may be broken. Check the plugin forum on Discord:"
            }
            var buttons = ""
            if (entry && entry.threadId) buttons += chatHtml(entry.threadId)
            else buttons += "<a class='mplus-chip mplus-chat' href='" + FORUM_URL + "' target='_blank' rel='noreferrer' title='Open the Seanime plugin forum on Discord'>" + SVG_CHAT + " Plugin forum</a>"
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

        // Case 2: the client is still showing its "Loading stream"
        // placeholder, so no <video> has been created yet. Only called
        // when nothing is playing, to keep the text read off the hot path.
        async function wLoadingPlaceholder() {
            // reading the whole page's text isn't free — skip it on routes
            // that can't be streaming (unknown route still gets checked)
            if (wPath && wPath.indexOf("entry") === -1 && wPath.indexOf("onlinestream") === -1) return false
            var b = await body()
            if (!b) return false
            var t = null
            try { t = await b.getProperty("textContent") } catch (e) { return false }
            if (t == null) return false
            return String(t).toLowerCase().indexOf(W_LOADING_TEXT) !== -1
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
            // stuck = a video that never got a source, or the placeholder
            // still on screen with no video mounted at all
            var stuck = anyVideo
            if (!stuck) {
                try { stuck = await wLoadingPlaceholder() } catch (e) { stuck = false }
            }
            if (!stuck) { wHealthy(); return }
            var now = Date.now()

            // Switching provider starts a new attempt: the freshly picked
            // one deserves its own grace period, and any card naming the
            // previous provider is now wrong.
            var label = ""
            try { label = await readProviderLabel() } catch (e) { }
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
            showStuckCard(entryFromLabel(label)).catch(function () { })
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
            ".mpset-foot{padding-top:2px}"

        // One switch row. Falls back to a plain label if the field ref
        // couldn't be created, so a partial failure never breaks render.
        function sw(key, label) {
            var r = refFor(key)
            return r ? tray.switch(label, { fieldRef: r, size: "sm" }) : tray.text(label)
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
                            sw("hideBroken", "Hide broken until searched"),
                        ]),

                        group("Video player", [
                            sw("streamAlerts", "Warn when a stream is stuck"),
                        ]),

                        tray.div([
                            tray.button("Reset to defaults", { onClick: "mplus-reset", size: "sm", intent: "gray-subtle" }),
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
            marks = {}
            modalMarks = {}
            wVideos = {}
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
        }

        try { ctx.dom.onReady(function () { wipeHandles(); boot() }) } catch (e) { }
        try { ctx.dom.onMainTabReady(function () { wipeHandles(); boot() }) } catch (e) { }
        try {
            ctx.screen.onNavigate(function (e) {
                try { wPath = (e && e.pathname) ? String(e.pathname) : "" } catch (er) { wPath = "" }
                wHealthy(); watchControls(); watchCards(); watchModals(); watchVideos()
            })
        } catch (e) { }
        ctx.setTimeout(function () { if (!pageReady) boot() }, 3000)
    })
}
