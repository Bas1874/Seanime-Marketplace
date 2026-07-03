// ================================================================
//  Marketplace+ v1.0.0  ·  by bas1874
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

        var SHEET =
            ".mplus-strip{display:flex;flex-direction:column;gap:6px;margin-top:8px}" +
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
            ".mplus-chat{margin-left:auto;background:rgba(88,101,242,.16);color:#a5b0ff;border-color:rgba(88,101,242,.5);cursor:pointer;text-decoration:none;transition:background .15s}" +
            ".mplus-chat:hover{background:rgba(88,101,242,.34)}" +
            ".mplus-web{margin-left:0;padding:0 7px}" +
            ".mplus-row:hover{background-color:var(--subtle)}"

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
        var sheetEl = null          // static stylesheet
        var filterEl = null         // dynamic filter stylesheet
        var bodyEl = null
        var stopCards = null
        var stopControls = null

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
            var app = "discord://-/channels/" + DISCORD_GUILD + "/" + tid
            var web = "https://discord.com/channels/" + DISCORD_GUILD + "/" + tid
            // Main chip opens the Discord app directly; the small companion
            // chip opens the thread in the browser instead. No scripting —
            // plain links keep us clear of the dom-script-manipulation flag.
            return "<a class='mplus-chip mplus-chat' href='" + app + "' title='Open the support thread in the Discord app'>" + SVG_CHAT + " Support</a>" +
                "<a class='mplus-chip mplus-chat mplus-web' href='" + web + "' target='_blank' rel='noreferrer' title='Open the support thread in the browser'>↗</a>"
        }

        // Mirrors Seanime's own badge look: two compact rows of chips.
        //   row 1 → version · status · lang code
        //   row 2 → author · language · stars · support (right)
        function stripHtml(entry, key) {
            var top = ""
            if (entry.version) top += chip("v" + String(entry.version), "mplus-ver")
            var st = statusOf(entry)
            if (STATUS_TEXT[st]) top += chip(STATUS_TEXT[st], "mplus-" + st)
            var added = whenOf(entry.addedAt)
            if (added && Date.now() - added < NEW_FOR) top += chip("New", "mplus-new")
            var lang = entry.lang ? String(entry.lang) : ""
            if (lang) top += chip(lang.toUpperCase(), lang.toLowerCase() === "multi" ? "mplus-plain" : "mplus-lang")
            if (entry.tags && entry.tags.length) {
                for (var ti = 0; ti < entry.tags.length; ti++) {
                    var tc = TAG_CHIPS[String(entry.tags[ti])]
                    if (tc) top += chip(tc[0], tc[1])
                }
            }

            var bottom = ""
            if (entry.author) bottom += chip(String(entry.author), "mplus-author")
            if (entry.language) bottom += chip(cap(String(entry.language)), "mplus-plain")
            var n = starsOf(entry)
            if (n > 0) bottom += chip("★ " + n, "mplus-stars")
            var up = whenOf(entry.updatedAt)
            if (up) bottom += chip("updated " + agoText(up), "mplus-plain")
            if (entry.threadId) bottom += chatHtml(entry.threadId)

            return "<div class='mplus-line'>" + top + "</div><div class='mplus-line'>" + bottom + "</div>"
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
            var st = statusOf(entry)
            var key = entry ? String(entry.id || entry.name || "") : ""
            var cid = (card && card.id != null) ? String(card.id) : ""

            // Synchronous guard: the observer can fire several times before
            // the (async) decoration below lands, so the innerHTML alone
            // can't be trusted to know whether a card was already handled.
            if (cid) {
                var prev = marks[cid]
                if (prev && prev.key === key) return // already decorated for this extension
                marks[cid] = { el: card, entry: entry, status: st, key: key }
            }
            // plugin restarted but the DOM still carries the right strip
            var m = html.match(/data-for=["']([^"']*)["']/)
            if (m && m[1] === key) return

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
            try { strip.setInnerHTML(stripHtml(entry, key)) } catch (e) { }

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
            } else if (!searching) {
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
            }).catch(function () { fetching = false })
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
        function wipeHandles() {
            // A client reload resets the frontend element-id counter, so any
            // held handles go stale — drop everything and rebuild fresh.
            epoch++
            if (sheetEl) { try { sheetEl.remove() } catch (e) { } sheetEl = null }
            if (filterEl) { try { filterEl.remove() } catch (e) { } filterEl = null }
            bodyEl = null
            seenInputs = {}
            marks = {}
        }
        function boot() {
            pageReady = true
            mountStyle(SHEET).then(function (el) { sheetEl = el }).catch(function () { })
            watchControls()
            watchCards()
            syncFeed(false)
        }

        try { ctx.dom.onReady(function () { wipeHandles(); boot() }) } catch (e) { }
        try { ctx.dom.onMainTabReady(function () { wipeHandles(); boot() }) } catch (e) { }
        try { ctx.screen.onNavigate(function () { watchControls(); watchCards() }) } catch (e) { }
        ctx.setTimeout(function () { if (!pageReady) boot() }, 3000)
    })
}
