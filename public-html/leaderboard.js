let UPDATE_INTERVAL = 1 * 60 * 1000;
let FETCH_INTERVAL = 15 * 60 * 1000;

async function requestJsonLeaderboard(year, board, token) {
    let url = "leaderboard.json";
    const response = await fetch(url);
    const json = await response.json();
    console.log(json);
    return json;
}

function should_update() {
    let last_updated_str = window.localStorage.getItem("last_updated");

    if (last_updated_str == null) {
        console.debug("no last_updated key found");
        return true;
    }

    let now = new Date();
    let last_updated = new Date(last_updated_str);

    let time_to_update = now - last_updated > FETCH_INTERVAL;

    return time_to_update;
}

function get_last_updated_string() {
    let last_updated = window.localStorage.getItem("last_updated");

    if (last_updated == null) {
        return "never";
    }

    return new Date(last_updated).toLocaleString("sv");
}

function store_data(data) {
    console.log("writing cache");
    window.localStorage.setItem("leaderboard_data", JSON.stringify(data));
    window.localStorage.setItem("last_updated", new Date().toISOString());
}

async function fetch_data(force) {
    let cached_data = window.localStorage.getItem("leaderboard_data");

    if (cached_data == null) {
        console.debug("cached data is null");
    }
    if (should_update()) {
        console.debug("should_update is true");
    }
    if (force) {
        console.debug("force is true");
    }

    if (cached_data == null || should_update() || force) {
        console.log("fetching new data");
        let data = await requestJsonLeaderboard(
            window.localStorage.getItem("control_year"),
            window.localStorage.getItem("control_board"),
            window.localStorage.getItem("control_token")
        );
        store_data(data);
        return data;
    } else {
        console.log("using cached data");
        return JSON.parse(cached_data);
    }
}

function parse_days(day_data) {
    var days = Array.apply(null, Array(25)).map(function () {
        return 0;
    });

    for (index in Object.keys(day_data)) {
        let accessor = Number(index) + 1;
        let day = day_data[accessor];

        if (day == null) {
            continue;
        }

        days[Number(index)] = Object.keys(day).length;
    }
    return days;
}

function parse_and_sort(raw_input) {
    var members = [];

    for (var key of Object.keys(raw_input["members"])) {
        let member_data = raw_input["members"][key];
        members.push({
            name: member_data["name"],
            total: member_data["stars"],
            days: parse_days(member_data["completion_day_level"]),
        });
    }

    members.sort(function (a, b) {
        return b.total - a.total;
    });

    return members;
}

function draw_days(arr, elem) {
    for (var idx in arr) {
        let span = document.createElement("span");
        let i = document.createElement("i");

        if (arr[idx] == 2) {
            span.className = "two";
            i.className = "fa-solid fa-star";
        } else if (arr[idx] == 1) {
            span.className = "one";
            i.className = "fa-solid fa-star";
        } else {
            span.className = "zero";
            i.className = "fa-regular fa-star";
        }
        span.appendChild(i);
        elem.appendChild(span);
    }
}

async function populate_leaderboard(force) {
    if (force != true) {
        force = false;
    }

    let data = await fetch_data(force);
    console.log("here");
    console.log(data);

    let members = parse_and_sort(data);

    let leaderboard = document.getElementById("leaderboard");
    leaderboard.replaceChildren();
    for (var index in members) {
        let member = members[index];

        let ele = document.createElement("li");
        ele.className = "member";

        let total = document.createElement("div");
        total.className = "total";
        total.innerHTML = member["total"];
        ele.append(total);

        let days = document.createElement("div");
        days.className = "days";
        draw_days(member["days"], days);
        ele.append(days);

        let name = document.createElement("div");
        name.className = "name";
        name.innerHTML = member["name"];
        ele.appendChild(name);

        leaderboard.appendChild(ele);
    }

    let info = document.getElementById("info");
    info.replaceChildren();

    let last_updated = document.createElement("li");
    last_updated.className = "update";
    last_updated.innerHTML = "last updated: " + get_last_updated_string();

    info.appendChild(last_updated);
}

function update_time() {
    let time = document.getElementById("time");

    var options = { weekday: "short", month: "short", day: "numeric" };
    var today = new Date();

    time.innerHTML = today.toLocaleString("en-CA", options) + " " + today.toLocaleTimeString("sv");
}

function populate_control(control_name, default_value) {
    let control = document.getElementById(control_name);

    let stored_value = window.localStorage.getItem(control_name);

    if (stored_value == null) {
        control.value = default_value;
    } else {
        control.value = stored_value;
    }
}

function save_control(control_name) {
    let control = document.getElementById(control_name);
    window.localStorage.setItem(control_name, control.value);
}

function populate_settings() {
    populate_control("control_year", new Date().getFullYear());
    populate_control("control_board", "");
    populate_control("control_token", "");
}

function save_settings() {
    save_control("control_year");
    save_control("control_board");
    save_control("control_token");
}

function load() {
    // Hide settings if board ID set already
    let control = document.getElementById("content-settings");
    control.hidden = window.localStorage.getItem("control_board") != null;

    populate_settings();

    update_time();

    populate_leaderboard(false);
}

function show_hide_settings() {
    let control = document.getElementById("content-settings");
    control.hidden = !control.hidden;
}

window.onload = load;

setInterval(function () {
    console.debug("updating now");
    populate_leaderboard(false);
}, UPDATE_INTERVAL);

setInterval(function () {
    update_time();
}, 1000);

$(function () {
    $("#content-main").draggable({ handle: "h1.title" });
});

$(function () {
    $("#content-config").draggable({ handle: "h1.title" });
});
