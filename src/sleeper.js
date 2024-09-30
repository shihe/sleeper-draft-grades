(function($, window) {
    window.onload = () => {
        if (localStorage.getItem("draft-id")) {
            $('#draft-id').val(localStorage.getItem("draft-id"));
        }
        $('#search').on('click', function() {
            if ($('#draft-id').val()) {
                localStorage.setItem("draft-id", $('#draft-id').val());
                getDraft();
            } else {
                $("#error").show();
            }
        });
    };

    function getDraft() {
        $.when($.ajax({
            async: true,
            crossDomain: true,
            url: constructDraftPicksUrl(),
            method: 'GET',
            headers: {
                accept: 'application/json',
            }
        }), $.ajax({
            async: true,
            crossDomain: true,
            url: "https://shihe.github.io/sleeper-draft-grades/json/curr_fp_ros.json",
            method: 'GET',
            headers: {
                accept: 'application/json',
            }
        })).done(function(draftResponse, rosResponse) {
            console.log(draftResponse[0]);
            console.log(rosResponse[0]);
            displayDraft(draftResponse[0], rosResponse[0]);
        });
    }

    function constructDraftPicksUrl() {
        const draftNumberParam = $('#draft-id').val();
        return "https://api.sleeper.app/v1/draft/" + draftNumberParam + "/picks";
    }

    function displayDraft(draftJson, rosJson) {
        const tableContainer = $('#draft-table');
        tableContainer.empty();
        const table = $('<table>', {
            'class': 'table'
        });
        const header = $('<thead>');
        const body = $('<tbody>');
        const rounds = 15;
        for (let i = 1; i <= rounds; i += 1) {
            var roundJson = draftJson.filter(function(pick) {
                return pick.round == i;
            });
            body.append(constructRow(roundJson, rosJson, i));
        }
        table.append(header);
        table.append(body);
        tableContainer.append(table);
        tableContainer.show();
    }

    function constructRow(roundJson, rosJson, round) {
        const row = $('<tr>').css({
            'class': 'row'
        });
        for (let i = 0; i < roundJson.length; i += 1) {
            var pickJson = roundJson[i];
            // Look up entry in rosJson
            var rosJsonEntry = rosJson.filter(function(entry) {
                return entry["PLAYER NAME"].includes(pickJson.metadata.first_name) && entry["PLAYER NAME"].includes(pickJson.metadata.last_name);
            });
            // Construct pick html
            var pickHtml;
            var delta = -50;
            var color;
            if (rosJsonEntry.length > 0) {
                // Calculate delta
                delta = parseInt(pickJson.pick_no) - parseInt(rosJsonEntry[0]["RK"]);
                pickHtml = pickJson.round + "-" + pickJson.pick_no + "<br><b>" + pickJson.metadata.first_name[0] + ". " + pickJson.metadata.last_name + "<br>ROS:" + rosJsonEntry[0]["RK"] + "<br>" + rosJsonEntry[0]["POS"] + "<br>" + delta;
                color = getCellColor(pickJson.pick_no, rosJsonEntry[0]["RK"]);
            } else {
                pickHtml = pickJson.round + "-" + pickJson.pick_no + "<br><b>" + pickJson.metadata.first_name[0] + ". " + pickJson.metadata.last_name + "<br>ROS: N/A<br><br>" + delta;
                const totalPicks = "180";
                color = getCellColor(pickJson.pick_no, totalPicks);
            }
            const pick = $('<td>', {
                'class': 'cell',
            }).css({
                'background-color': color
            }).html(pickHtml);
            if (round % 2 == 0) {
                row.prepend(pick);
            } else {
                row.append(pick);
            }
        }
        console.log(row);
        return row;
    }

    function getCellColor(pick, rank) {
        var score = Math.sqrt(parseInt(pick)) - Math.sqrt(parseInt(rank));
        if (score < -0.8) {
            return "crimson";
        } else if (score >= -0.8 && score < -0.3) {
            return "lightcoral";
        } else if (score >= -0.3 && score <= 0.3) {
            return "grey";
        } else if (score > 0.3 && score <= 0.8) {
            return "darkseagreen";
        } else {
            return "seagreen";
        }
    }
})(jQuery, window);