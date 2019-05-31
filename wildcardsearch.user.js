// ==UserScript==
// @name         WildcardSearch
// @namespace    WildcardSearch
// @version      0.0.5
// @description  Search plugin for the project ascension talent builder
// @author       Shawak
// @match        *://project-ascension.com/development/builds
// @downloadURL  https://raw.githubusercontent.com/Shawak/WildcardSearch/master/wildcardsearch.user.js
// @updateURL    https://raw.githubusercontent.com/Shawak/WildcardSearch/master/wildcardsearch.user.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// ==/UserScript==

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

var plguinHtml = `
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
</li>`;

String.prototype.stripHtml = function () {
    var div = document.createElement("div");
    div.innerHTML = this;
    return div.textContent || div.innerText || "";
};

var cache,
    search = "";

function loadCache() { cache = GM_getValue("cache", getGitHubCache()); }
function saveCache() { GM_setValue("cache", cache); }

function getSpellInfo(id) {
    if (cache[id] === undefined) {
        cache[id] = {
            index: getCurrentClassIndex(),
            info: getTooltipInfo(id)
        }
    }
    return cache[id].info;
}

function getGitHubCache() {
    var result = {};
    $.ajax({
        url: 'https://raw.githubusercontent.com/Shawak/WildcardSearch/master/cache.json',
        success: function(json) {
            result = JSON.parse(json);
        },
        async: false
    });
    return result;
}

function getTooltipInfo(id) {
    var result = null;
    $.ajax({
        url: 'https://data.project-ascension.com/api/spells/' + id,
        success: function(json) {
            result = json;
        },
        async: false
    });
    return result;
}

function main() {
    loadCache();

    $('.atc-apptabs-container-content-wrapper').append(plguinHtml);
    $('#wcs-search-text').on('input', onSearch);
    $('.atc-editor-classtabbar-content-wrapper').on('click', function() { setTimeout(update, 100); });
    $('.atc-editor-classtabbarcontent-content-wrapper-talenttree-table-talent-container-content-wrapper-talent-images').on('click', function() { setTimeout(update, 100); });
    $('.atc-editor-classtabbarcontent-content-wrapper-talenttree-table-talent-container-content-wrapper-talent-images').on('contextmenu', function() { setTimeout(update, 100); });
    $('#wcs-delete-cache').on('click', function() {
        if (confirm('Are you sure to delete the cache?')) {
            cache = {};
            saveCache();
            update();
        }
    });

    update();
}

function onSearch(e) {
    search = $(this).val().toLowerCase().trim();
    highlight();
}

function highlight() {
    $(".highlighted-spell").removeClass('highlighted-spell');
    $(".highlighted-classtab").removeClass('highlighted-classtab');

    if (search == "") {
        return;
    }

    var highlightedIds = [];
    var highlightedIndexes = [];
    $.each(cache, function(k, v) {
        if (v.info.name.stripHtml().toLowerCase().includes(search)
            || v.info.tooltip.text.stripHtml().toLowerCase().includes(search))
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
}

function getCurrentClassIndex() {
    return $('.atc-editor-classtabbar-classtab-active').index();
}

function update() {
    $('[data-ascension-tooltip-id]').each(function() {
        var id = $(this).attr('data-ascension-tooltip-id');
        getSpellInfo(id);
    });
    saveCache();
    highlight();
}

(function() {
    setTimeout(main, 500);
})();