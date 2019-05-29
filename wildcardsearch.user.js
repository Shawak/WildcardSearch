// ==UserScript==
// @name         WildcardSearch
// @namespace    WildcardSearch
// @version      0.0.1
// @description  Search plugin for the project ascension talent builder
// @author       Shawak
// @match        *://project-ascension.com/development/builds
// @downloadURL  https://github.com/Shawak/WildcardSearch/wildcardsearch.user.js
// @updateURL    https://github.com/Shawak/WildcardSearch/wildcardsearch.user.js
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addStyle
// ==/UserScript==

GM_addStyle(`
#search-text {
  border: 0;
  background-color: inherit;
}

.highlighted-spell {
  border: 3px solid yellow;
  border-style: dashed;
  border-radius: 3px;
  margin-left: -3px;
  margin-top: -3px;
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
    <input id="search-text" type="text"></input>
  </div>
</li>
`;

var cache = {};
function loadCache() { cache = GM_getValue("cache", {}); }
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
    $('#search-text').on('input', onSearch);
    $('.atc-editor-classtabbar-content-wrapper').on('click', function() { setTimeout(update, 100); });
    update();
}

var highlightedIds = [];
var highlightedIndexes = [];

function onSearch(e) {
    highlightedIds = [];
    highlightedIndexes = [];

    var search = $(this).val().toLowerCase();
    if (search == "") {
        highlight();
        return;
    }

    $.each(cache, function(k, v) {
        if (v.info.name.toLowerCase().includes(search)
            || v.info.tooltip.text.toLowerCase().includes(search))
        {
            if (!highlightedIndexes.includes(v.index)) {
                highlightedIndexes.push(v.index);
            }
            highlightedIds.push(k);
        }
    });
    highlight();
}

function highlight() {
    $(".highlighted-spell").removeClass('highlighted-spell');
    $(".highlighted-classtab").removeClass('highlighted-classtab');

    $('[data-ascension-tooltip-id]').each(function() {
        var id = $(this).attr('data-ascension-tooltip-id');
        if (highlightedIds.indexOf(id) != -1) {
            $(this).addClass('highlighted-spell');
        }
    });

    $.each(highlightedIndexes, function(i, v) {
        console.log(v);
        $('.atc-editor-classtabbar-content-wrapper').children().eq(v).children('img').addClass('highlighted-classtab');
    });
}

function getCurrentClassIndex() {
    return $('.atc-editor-classtabbar-classtab-active').index();
}

function update() {
    $('.atc-editor-classtabbarcontent-container > .atc-editor-classtabbarcontent-content-wrapper-talenttree-table > tbody').each(function() {
        $(this).find('tr > td > div > div > div > div > div').each(function() {
            var tooltipId = $(this).attr('data-ascension-tooltip-id');
            getSpellInfo(tooltipId);
        });
    });
    saveCache();
    highlight();
}

(function() {
    setTimeout(main, 500);
})();