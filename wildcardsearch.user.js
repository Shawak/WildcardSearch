// ==UserScript==
// @name         WildcardSearch
// @namespace    WildcardSearch
// @version      0.2.0
// @description  Search plugin for the project ascension talent builder
// @author       Shawak
// @match        *://data.ascension.gg/talentcalculator#/talentsandabilities/editor
// @downloadURL  https://github.com/Shawak/WildcardSearch/raw/master/wildcardsearch.user.js
// @updateURL    https://github.com/Shawak/WildcardSearch/raw/master/wildcardsearch.user.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// ==/UserScript==

if (typeof GM_addStyle === 'undefined') {
  GM_addStyle = function(css) {
    let head = document.getElementsByTagName('head')[0], style = document.createElement('style');
    if (!head) {return}
    style.type = 'text/css';
    try {style.innerHTML = css}
    catch(x) {style.innerText = css}
    head.appendChild(style);
  };
}

GM_addStyle(`
#wcs-search-text {
  border: 0;
  background-color: inherit;
}

#wcs-delete-cache {
  vertical-align: middle;
  display: inline-grid;
}

.highlighted-spell {
  border: 3px solid yellow;
  border-style: dashed;
  border-radius: 3px;
  margin: -3px;
}

.highlighted-classtab {
  border: 3px solid orange;
  border-style: dashed;
  border-radius: 3px;
}
`);

String.prototype.stripHtml = function () {
    var div = document.createElement("div");
    div.innerHTML = this;
    return div.textContent || div.innerText || "";
};

(function($) {

    var wcs = {

        plguinHtml: `
<li id="search-plugin" class="atc-apptabs-container-content-wrapper-apptab atc-apptabs-container-content-wrapper-apptab-right">
  <div class="atc-apptabs-container-content-wrapper-apptab-content-wrapper">
    <input id="wcs-search-text" type="text"></input>
    <span id="wcs-delete-cache" title="Clear Cache">
      <svg title="Clear Cache" width="20" height="20" viewBox="0 0 48 48" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
        <g>
          <rect fill="none" id="canvas_background" height="402" width="582" y="-1" x="-1"/>
        </g>
        <g>
          <path fill="#ffd800" id="svg_3" d="m41,48l-34,0l0,-41l34,0l0,41zm-32,-2l30,0l0,-37l-30,0l0,37z"/>
          <path fill="#ffd800" id="svg_5" d="m35,9l-22,0l0,-8l22,0l0,8zm-20,-2l18,0l0,-4l-18,0l0,4z"/>
          <path fill="#ffd800" id="svg_7" d="m16,41c-0.553,0 -1,-0.447 -1,-1l0,-25c0,-0.553 0.447,-1 1,-1s1,0.447 1,1l0,25c0,0.553 -0.447,1 -1,1z"/>
          <path fill="#ffd800" id="svg_9" d="m24,41c-0.553,0 -1,-0.447 -1,-1l0,-25c0,-0.553 0.447,-1 1,-1s1,0.447 1,1l0,25c0,0.553 -0.447,1 -1,1z"/>
          <path fill="#ffd800" id="svg_11" d="m32,41c-0.553,0 -1,-0.447 -1,-1l0,-25c0,-0.553 0.447,-1 1,-1s1,0.447 1,1l0,25c0,0.553 -0.447,1 -1,1z"/>
          <rect fill="#ffd800" x="0.067491" id="svg_13" y="6.932509" width="48" height="2"/>
        </g>
      </svg>
    </span>
  </div>
</li>`,

        cache: null,
        search: "",

        loadCache: function() { this.cache = GM_getValue("cache", wcs.getGitHubCache()); },
        saveCache: function() { GM_setValue("cache", wcs.cache); },

        init: function() {
            wcs.loadCache();

            $('.atc-apptabs-container-content-wrapper').append(wcs.plguinHtml);
            $('#wcs-search-text').on('input', wcs.onSearch);
            $('.atc-editor-classtabbar-content-wrapper').on('click', function() { setTimeout(wcs.update, 100); });
            $('.atc-editor-classtabbarcontent-content-wrapper-talenttree-table-talent-container-content-wrapper-talent-images').on('click', function() { setTimeout(wcs.update, 100); });
            $('.atc-editor-classtabbarcontent-content-wrapper-talenttree-table-talent-container-content-wrapper-talent-images').on('contextmenu', function() { setTimeout(wcs.update, 100); });
            $('#wcs-delete-cache').on('click', function() {
                if (confirm('Are you sure to delete the cache?')) {
                    wcs.cache = {};
                    wcs.saveCache();
                    wcs.update();
                }
            });

            wcs.update();
        },

        getSpellInfo: function(id) {
            if (wcs.cache[id] === undefined) {
                wcs.cache[id] = {
                    index: wcs.getCurrentClassIndex(),
                    info: wcs.getTooltipInfo(id)
                }
            }
            return wcs.cache[id].info;
        },

        getGitHubCache: function() {
            var result = {};
            $.ajax({
                url: 'https://raw.githubusercontent.com/Shawak/WildcardSearch/master/cache.json',
                success: function(json) {
                    result = JSON.parse(json);
                },
                async: false
            });
            return result;
        },

        getTooltipInfo: function(id) {
            var result = null;
            $.ajax({
                url: 'https://data.project-ascension.com/api/spells/' + id,
                success: function(json) {
                    result = json;
                },
                async: false
            });
            return result;
        },

        getCurrentClassIndex: function() {
            return $('.atc-editor-classtabbar-classtab-active').index();
        },

        onSearch: function(e) {
            wcs.search = $(this).val().toLowerCase().trim();
            wcs.highlight();
        },

        highlight: function() {
            $(".highlighted-spell").removeClass('highlighted-spell');
            $(".highlighted-classtab").removeClass('highlighted-classtab');

            if (wcs.search == "") {
                return;
            }

            var highlightedIds = [];
            var highlightedIndexes = [];
            $.each(wcs.cache, function(k, v) {
                if (v.info.name.stripHtml().toLowerCase().includes(wcs.search)
                    || v.info.tooltip.text.stripHtml().toLowerCase().includes(wcs.search))
                {
                    if (!highlightedIndexes.includes(v.index)) {
                        highlightedIndexes.push(v.index);
                    }
                    highlightedIds.push(k);
                }
            });

            $('[data-ascension-tooltip-id]').each(function() {
                var id = $(this).attr('data-ascension-tooltip-id');
                if (highlightedIds.indexOf(id) != -1) {
                    $(this).parent().parent().parent().parent().addClass('highlighted-spell');
                }
            });

            $.each(highlightedIndexes, function(i, v) {
                $('.atc-editor-classtabbar-content-wrapper').children().eq(v).children('img').addClass('highlighted-classtab');
            });
        },

        update: function() {
            $('[data-ascension-tooltip-id]').each(function() {
                var id = $(this).attr('data-ascension-tooltip-id');
                wcs.getSpellInfo(id);
            });
            wcs.saveCache();
            wcs.highlight();
        }

    };

    setTimeout(wcs.init, 500);

})(jQuery);
