var saveNeeded = false;

var saveTimeout;

var itemKey = getItemInventoryKey();
var releasedUnits;

var currentSort = showAlphabeticalSort;

var allUnits;
var tmrNumberByUnitId = {};
var tmrNameByUnitId = {};

function beforeShow() {
    $("#pleaseWaitMessage").addClass("hidden");
    $("#loginMessage").addClass("hidden");
    $("#units").removeClass("hidden");
    $("#searchBox").addClass("hidden");
    
    $(".nav-tabs li.alphabeticalSort").removeClass("active");
    $(".nav-tabs li.raritySort").removeClass("active");
    $(".nav-tabs li.tmrAlphabeticalSort").removeClass("active");
    $("#searchBox").prop("placeholder", "Enter unit name");
}

function showAlphabeticalSort() {
    beforeShow();
    currentSort = showAlphabeticalSort;
    $("#searchBox").removeClass("hidden");
    $(".nav-tabs li.alphabeticalSort").addClass("active");
    // filter, sort and display the results
    $("#results").html(displayUnits(sortAlphabetically(filterName(units))));
    $("#results").unmark({
        done: function() {
            var textToSearch = $("#searchBox").val();
            if (textToSearch && textToSearch.length != 0) {
                $("#results").mark(textToSearch);
            }
        }
    });
}

function showRaritySort() {
    beforeShow();
    currentSort = showRaritySort;
    $("#searchBox").removeClass("hidden");
    $(".nav-tabs li.raritySort").addClass("active");
    // filter, sort and display the results
    $("#results").html(displayUnitsByRarity(sortByRarity(filterName(units))));
    $("#results").unmark({
        done: function() {
            var textToSearch = $("#searchBox").val();
            if (textToSearch && textToSearch.length != 0) {
                $("#results").mark(textToSearch);
            }
        }
    });
}

function showTMRAlphabeticalSort() {
    beforeShow();
    currentSort = showTMRAlphabeticalSort;
    $("#searchBox").removeClass("hidden");
    $("#searchBox").prop("placeholder", "Enter TMR name");
    
    $(".nav-tabs li.tmrAlphabeticalSort").addClass("active");
    // filter, sort and display the results
    $("#results").html(displayUnits(sortTMRAlphabetically(filterTMRName(units)), true));
    $("#results").unmark({
        done: function() {
            var textToSearch = $("#searchBox").val();
            if (textToSearch && textToSearch.length != 0) {
                $("#results").mark(textToSearch);
            }
        }
    });
}

// Construct HTML of the results. String concatenation was chosen for rendering speed.
var displayUnits = function(units, useTmrName = false) {
    var html = '<div class="unitList">';
    for (var index = 0, len = units.length; index < len; index++) {
        var unit = units[index];
        html += getUnitDisplay(unit, useTmrName);
    }
    html += '</div>';
    return html;

};

function displayUnitsByRarity(units) {
    var lastMinRarity, lastMaxRarity;
    var first = true;
    
    var html = '';
    for (var index = 0, len = units.length; index < len; index++) {
        var unit = units[index];
        if (first) {
            html += '<div class="raritySeparator">' + getRarity(unit.min_rarity, unit.max_rarity) + "</div>"; 
            html += '<div class="unitList">';
            first = false;
        } else {
            if (unit.max_rarity != lastMaxRarity || unit.min_rarity != lastMinRarity) {
                html += '</div>';
                html += '<div class="raritySeparator">' + getRarity(unit.min_rarity, unit.max_rarity) + "</div>"; 
                html += '<div class="unitList">';
            }
        }
        lastMaxRarity = unit.max_rarity;
        lastMinRarity = unit.min_rarity;
        html += getUnitDisplay(unit);
    }
    html += '</div>';
    return html;

};

function getUnitDisplay(unit, useTmrName = false) { 
    var html = '<div class="unit ' + unit.id;
    if (ownedUnits[unit.id]) {
        html += ' owned"';
    } else {
        html += ' notOwned"';
    }
    html +=' onclick="addToOwnedUnits(\'' + unit.id + '\')">';
    html +='<div class="numberOwnedDiv numberDiv"><span class="glyphicon glyphicon-plus" onclick="event.stopPropagation();addToOwnedUnits(\'' + unit.id + '\')"></span>';
    html += '<span class="ownedNumber badge badge-success">' + (ownedUnits[unit.id] ? ownedUnits[unit.id].number : 0) + '</span>';
    html += '<span class="glyphicon glyphicon-minus" onclick="event.stopPropagation();removeFromOwnedUnits(\'' + unit.id +'\');"></span></div>';
    html +='<div class="farmableTMRDiv numberDiv"><span class="glyphicon glyphicon-plus" onclick="event.stopPropagation();addToFarmableNumberFor(\'' + unit.id + '\')"></span>';
    html += '<span class="farmableNumber badge badge-success">' + (ownedUnits[unit.id] ? ownedUnits[unit.id].farmable : 0) + '</span>';
    html += '<span class="glyphicon glyphicon-minus" onclick="event.stopPropagation();removeFromFarmableNumberFor(\'' + unit.id +'\');"></span></div>';
    html += '<div class="unitImageWrapper"><div><img class="unitImage" src="/img/units/unit_ills_' + unit.id + '.png"/></div></div>';
    html +='<div class="unitName">';
    if (useTmrName) {
        html += tmrNameByUnitId[unit.id];
    } else {
        html += unit.name;  
    }
    html += '</div>';
    html += '<div class="unitRarity">'
    html += getRarity(unit.min_rarity, unit.max_rarity);
    html += '</div></div>';
    return html;
}

function getRarity(minRarity, maxRarity) {
    var html = '';
    for (var rarityIndex = 0; rarityIndex < minRarity; rarityIndex++ ) {
        html += '<img src="/img/star_icon_filled.png"/>';
    }
    for (var rarityIndex = 0; rarityIndex < (maxRarity - minRarity); rarityIndex++ ) {
        html += '<img src="/img/star_icon.png"/>';
    }
    return html;
}


function addToOwnedUnits(unitId) {
    if (!ownedUnits[unitId]) {
        ownedUnits[unitId] = {"number":1, "farmable":0};
        $(".unit." + unitId).addClass("owned");
        $(".unit." + unitId).removeClass("notOwned");    
    } else {
        ownedUnits[unitId].number += 1;
    }
    if (!tmrNumberByUnitId[unitId] || (tmrNumberByUnitId[unitId] < ownedUnits[unitId].number)) {
        addToFarmableNumberFor(unitId);
    }
    $(".unit." + unitId + " .numberOwnedDiv .badge").html(ownedUnits[unitId].number);
    saveNeeded = true;
    if (saveTimeout) {clearTimeout(saveTimeout)}
    saveTimeout = setTimeout(saveUnits,3000);
    $(".saveInventory").removeClass("hidden");
}

function removeFromOwnedUnits(unitId) {
    if (!ownedUnits[unitId]) {
        return;
    }
    ownedUnits[unitId].number -= 1;
    if (ownedUnits[unitId].number == 0) {
        removeFromFarmableNumberFor(unitId);
        delete ownedUnits[unitId];
        $(".unit." + unitId).removeClass("owned");
        $(".unit." + unitId).addClass("notOwned");
    } else {
        $(".unit." + unitId + " .numberOwnedDiv .badge").html(ownedUnits[unitId].number);
        if (ownedUnits[unitId].number < ownedUnits[unitId].farmable) {
            removeFromFarmableNumberFor(unitId);
        }
    }
    
    saveNeeded = true;
    if (saveTimeout) {clearTimeout(saveTimeout)}
    saveTimeout = setTimeout(saveUnits,3000);
    $(".saveInventory").removeClass("hidden");
}

function addToFarmableNumberFor(unitId) {
    if (!ownedUnits[unitId]) {
        return;   
    } else {
        if (ownedUnits[unitId].farmable < ownedUnits[unitId].number) {
            ownedUnits[unitId].farmable += 1;
        } else {
            return;
        }
    }
    $(".unit." + unitId + " .farmableTMRDiv .badge").html(ownedUnits[unitId].farmable);
    saveNeeded = true;
    if (saveTimeout) {clearTimeout(saveTimeout)}
    saveTimeout = setTimeout(saveUnits,3000);
    $(".saveInventory").removeClass("hidden");
}

function removeFromFarmableNumberFor(unitId) {
    if (!ownedUnits[unitId] || ownedUnits[unitId].farmable == 0) {
        return;
    }
    ownedUnits[unitId].farmable -= 1;
    $(".unit." + unitId + " .farmableTMRDiv .badge").html(ownedUnits[unitId].farmable);
    saveNeeded = true;
    if (saveTimeout) {clearTimeout(saveTimeout)}
    saveTimeout = setTimeout(saveUnits,3000);
    $(".saveInventory").removeClass("hidden");
}

function filterName(units) {
    var result = [];
    var textToSearch = $("#searchBox").val();
    if (textToSearch) {
        textToSearch = textToSearch.toLowerCase();
        for (var index = units.length; index--;) {
            var unit = units[index];
            if (unit.name.toLowerCase().indexOf(textToSearch) >= 0) {
                result.push(unit);
            }
        }
    } else {
        return units;
    }
    return result;
}

function filterTMRName(units) {
    var result = [];
    var textToSearch = $("#searchBox").val();
    if (textToSearch) {
        textToSearch = textToSearch.toLowerCase();
        for (var index = units.length; index--;) {
            var unit = units[index];
            if (tmrNameByUnitId[unit.id] && tmrNameByUnitId[unit.id].toLowerCase().indexOf(textToSearch) >= 0) {
                result.push(unit);
            }
        }
    } else {
        for (var index = units.length; index--;) {
            var unit = units[index];
            if (tmrNameByUnitId[unit.id]) {
                result.push(unit);
            }
        }
    }
    return result;
}

function keepOnlyOneOfEachMateria() {
    var idsAlreadyKept = [];
    var result = [];
    for (var index in data) {
        var item = data[index];
        if (item.type == "materia" && !item.access.includes("not released yet") && !idsAlreadyKept.includes(item[itemKey])) {
            result.push(item);
            idsAlreadyKept.push(item[itemKey]);
        }
    }
    return result;
}

function sortAlphabetically(units) {
    return units.sort(function (unit1, unit2){
        return unit1.name.localeCompare(unit2.name);
    });
};

function sortTMRAlphabetically(units) {
    return units.sort(function (unit1, unit2){
        if (!tmrNameByUnitId[unit1.id]) {
            console.log(unit1.name);
        }
        return tmrNameByUnitId[unit1.id].localeCompare(tmrNameByUnitId[unit2.id]);
    });
};

function sortByRarity(units) {
    return units.sort(function (unit1, unit2){
        if (unit1.max_rarity == unit2.max_rarity) {
            if (unit1.min_rarity == unit2.min_rarity) {
                return unit1.name.localeCompare(unit2.name);
            } else {
                return unit2.min_rarity - unit1.min_rarity;
            }
        } else {
            return unit2.max_rarity - unit1.max_rarity;
        }
    });
};



function notLoaded() {
    $("#pleaseWaitMessage").addClass("hidden");
    $("#loginMessage").removeClass("hidden");
    $("#inventory").addClass("hidden");
}

function updateResults() {
    currentSort();
}

function inventoryLoaded() {
    if (units && data) {
        prepareData();
        showAlphabeticalSort();    
    }
}

function prepareData() {
    for (var index = data.length; index--; ) {
        var item = data[index];
        if (item.tmrUnit && allUnits[item.tmrUnit]) {
            var unitId = allUnits[item.tmrUnit].id;
            if (itemInventory[item.id]) {
                tmrNumberByUnitId[unitId] = itemInventory[item.id];
            }
            tmrNameByUnitId[unitId] = item.name;
        }
    }
}

// will be called by jQuery at page load)
$(function() {

	// Ajax calls to get the item and units data, then populate unit select, read the url hash and run the first update
    $.get(server + "/units.json", function(unitResult) {
        allUnits = unitResult;
        $.get(server + "/releasedUnits.json", function(releasedUnitResult) {
            units = [];
            for (var name in unitResult) {
                if (releasedUnitResult[name]) {
                    units.push(unitResult[name]);
                    unitResult[name].name = name;
                }
            }
            if (ownedUnits && data) {
                prepareData();
                showAlphabeticalSort();    
            }
        }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
            alert( errorThrown );
        });    
        
        /*$.get(server + "/lastItemReleases.json", function(result) {
            lastItemReleases = result;
            prepareLastItemReleases();
        }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
            alert( errorThrown );
        });*/
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
        alert( errorThrown );
    });
    $.get(server + "/data.json", function(result) {
        data = result;
        if (units && ownedUnits) {
            prepareData();
            showAlphabeticalSort();    
        }
    }, 'json').fail(function(jqXHR, textStatus, errorThrown ) {
        alert( errorThrown );
    });
    
	
    $("#results").addClass(server);
    
	
    $(window).on("beforeunload", function () {
        if  (saveNeeded) {
            return "Unsaved change exists !"
        }
    });
    
    $("#searchBox").on("input", $.debounce(300,updateResults));
    
});