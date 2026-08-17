const box = document.getElementById("clients");
const nameInput = document.getElementById("name");
const phoneInput = document.getElementById("phone");
const typeInput = document.getElementById("type");
const dateInput = document.getElementById("date");
const timeInput = document.getElementById("time");
const freqInput = document.getElementById("freq");
const notesInput = document.getElementById("notes");

let editIndex = -1;

let currentFilter = "all";

function tick() {
    document.getElementById("clock").textContent = new Date().toLocaleString();
    check();
}

setInterval(tick, 1000);
tick();

updateNotificationButton();


function getData() {
    return JSON.parse(localStorage.getItem("clients") || "[]");
}

function setData(d) {
    localStorage.setItem("clients", JSON.stringify(d));
}

function saveClient() {
    const c = {
        id: editIndex === -1 ? Date.now() : getData()[editIndex].id,
        name: nameInput.value,
        phone: phoneInput.value,
        type: typeInput.value,
        date: dateInput.value,
        time: timeInput.value,
        freq: freqInput.value,
        notes: notesInput.value,
        lastAlert: null,
        attended: false,
    };
    if (
        !nameInput.value ||
        !phoneInput.value ||
        !dateInput.value ||
        !timeInput.value
    ) {
        alert("Please fill all required fields.");
        return;
    }

    const d = getData();

    if (editIndex === -1) {
        d.push(c);
    } else {
        c.attended = d[editIndex].attended;
        c.lastAlert = d[editIndex].lastAlert;

        d[editIndex] = c;

        editIndex = -1;

        document.querySelector(".card button").textContent = "Save Client";
    }

    setData(d);
    nameInput.value = "";
    phoneInput.value = "";
    dateInput.value = "";
    timeInput.value = "";
    notesInput.value = "";
    typeInput.selectedIndex = 0;
    freqInput.selectedIndex = 0;
    render();
}

function clearForm() {

    editIndex = -1;

    nameInput.value = "";
    phoneInput.value = "";
    dateInput.value = "";
    timeInput.value = "";
    notesInput.value = "";

    typeInput.selectedIndex = 0;
    freqInput.selectedIndex = 0;

    document.getElementById("saveBtn").textContent = "Save Client";
}

function render() {

    box.innerHTML = "";
    const data = getData().sort((a, b) => {
        return new Date(a.date + "T" + a.time) - new Date(b.date + "T" + b.time);
    });

    const search = document.getElementById("search").value.toLowerCase();
    let today = 0;
    let upcoming = 0;
    document.getElementById("totalClients").innerHTML = data.length;
    data.forEach((c, index) => {

        console.log(c);

        if (
            search &&
            !c.name.toLowerCase().includes(search) &&
            !c.phone.toLowerCase().includes(search) &&
            !c.type.toLowerCase().includes(search) &&
            !(c.notes || "").toLowerCase().includes(search)
        ) {
            return;
        }

        const now = new Date();

        const appointment = new Date(c.date + "T" + c.time);

        switch (currentFilter) {

            case "today":

                if (appointment.toDateString() != now.toDateString())
                    return;
                break;

            case "upcoming":

                if (appointment <= now)
                    return;
                break;

            case "attended":

                if (!c.attended)
                    return;
                break;

            case "missed":

                if (appointment > now || c.attended)
                    return;
                break;

        }

        if (appointment.toDateString() == now.toDateString())
            today++;

        if (appointment > now)
            upcoming++;
        box.innerHTML += `

<div class="client ${c.attended ? "done" : ""}">

<h2>

    👤 ${c.name}

</h2>

<hr>

<p>

    ☎ <a href="tel:${c.phone}">${c.phone}</a>

</p>

<p>

    📅 <b>${c.type}</b> Appointment

</p>

<p>

    🗓 ${c.date}

</p>

<p>

    🕒 ${c.time}

</p>

<p>

    📝 ${c.notes || "No Notes"}

</p>

    <div class="actions">

        <button

            class="attended"

            onclick="toggleAttended(${c.id})">

            ${c.attended ? "✅ Attended" : "✔ Mark Attended"}

        </button>

        <button

            class="edit"

            onclick="editClient(${c.id})">

            ✏ Edit

        </button>

        <button

            class="delete"

            onclick="deleteClient(${c.id})">

            🗑 Delete

        </button>

    </div>

</div>

`;

    });

    document.getElementById("todayCount").innerHTML = today;

    document.getElementById("upcomingCount").innerHTML = upcoming;

}

function check() {
    let d = getData();
    const now = new Date();
    d.forEach((c) => {
        if (!c.date || !c.time) return;
        const target = new Date(c.date + "T" + c.time);
        let due = false;
        switch (c.freq) {
            case "Once":
                due = Math.abs(now - target) < 1000;
                break;
            case "Daily":
                due =
                    now.getHours() == target.getHours() &&
                    now.getMinutes() == target.getMinutes();
                break;
            case "Weekly":
                due =
                    now.getDay() == target.getDay() &&
                    now.getHours() == target.getHours() &&
                    now.getMinutes() == target.getMinutes();
                break;
            case "Monthly":
                due =
                    now.getDate() == target.getDate() &&
                    now.getHours() == target.getHours() &&
                    now.getMinutes() == target.getMinutes();
                break;
        }
        const stamp = now.toDateString() + now.getHours() + ":" + now.getMinutes();
        if (due && c.lastAlert !== stamp) {

            if (Notification.permission === "granted") {

                new Notification("📅 Client Reminder", {
                    body: `${c.name}\n${c.type} Appointment`
                });

            } else {

                alert(
                    `📅 Client Reminder\n\n${c.name}\n${c.type} Appointment`
                );

            }

            c.lastAlert = stamp;
        }
    });

    setData(d);
}

render();

function deleteClient(id) {

    const client = getData().find(c => c.id === id);

    if (!client) return;

    if (!confirm(`Delete ${client.name}? This cannot be undone.`)) {
        return;
    }

    let data = getData();
    data = data.filter(c => c.id !== id);

    setData(data);
    render();
}

function toggleAttended(id) {

    let data = getData();
    const client = data.find(c => c.id === id);
    if (!client) return;

    client.attended = !client.attended;
    setData(data);
    render();
}

function editClient(id) {

    const data = getData();
    const client = data.find(c => c.id === id);
    if (!client) return;

    nameInput.value = client.name;
    phoneInput.value = client.phone;
    typeInput.value = client.type;
    dateInput.value = client.date;
    timeInput.value = client.time;
    freqInput.value = client.freq;
    notesInput.value = client.notes;

    editIndex = data.findIndex(c => c.id === id);
    document.getElementById("saveBtn").textContent = "Update Client";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function setFilter(filter) {

    currentFilter = filter;
    document.querySelector(".filter-btn").textContent =
        "⚙ " + filter.charAt(0).toUpperCase() + filter.slice(1) + " ▼";
    render();

}

function enableNotifications() {

    if (!("Notification" in window)) {
        alert("❌ Your browser does not support notifications.");
        return;
    }

    if (!window.isSecureContext) {
        alert(
            "🔒 Notifications require a secure connection.\n\n" +
            "Please open Business Helper using Live Server " +
            "or another localhost/HTTPS connection."
        );
        return;
    }

    if (Notification.permission === "granted") {

        updateNotificationButton();

        new Notification("🔔 Business Helper", {
            body: "Notifications are already enabled!"
        });

        return;
    }

    if (Notification.permission === "denied") {

        alert(
            "🔕 Notifications are blocked for this site.\n\n" +
            "Please allow notifications in your browser's site settings."
        );

        return;
    }

    Notification.requestPermission()
        .then(permission => {

            updateNotificationButton();

            if (permission === "granted") {

                new Notification("🔔 Notifications Enabled", {
                    body: "Client appointment reminders are now active."
                });

            } else {

                alert(
                    "Notifications were not enabled.\n\n" +
                    "Please choose 'Allow' when your browser asks."
                );

            }

        })
        .catch(error => {

            console.error("Notification error:", error);

            alert(
                "⚠️ Could not enable notifications.\n\n" +
                "Please make sure you are running the app on localhost or HTTPS."
            );

        });
}

function updateNotificationButton() {

    const btn = document.getElementById("notificationBtn");

    if (!btn) return;

    if (!("Notification" in window)) {

        btn.textContent = "🔕 Unsupported";
        btn.disabled = true;

        return;
    }

    if (Notification.permission === "granted") {

        btn.textContent = "🔔 Notifications Enabled";

    } else if (Notification.permission === "denied") {

        btn.textContent = "🔕 Notifications Blocked";

    } else {

        btn.textContent = "🔔 Enable Notifications";

    }
}

function exportData() {

    const data = getData();

    if (data.length === 0) {
        alert("There is no data to export.");
        return;
    }

    const blob = new Blob(
        [JSON.stringify(data, null, 2)],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;
    a.download = `business-helper-backup-${new Date().toISOString().split("T")[0]}.json`;

    a.click();

    URL.revokeObjectURL(url);
}

function importData(event) {

    const file = event.target.files[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function (e) {

        try {

            const imported = JSON.parse(e.target.result);

            if (!Array.isArray(imported)) {
                throw new Error("Invalid backup");
            }

            if (!confirm(
                "Import this backup?\n\n" +
                "This will replace the current client data."
            )) {
                return;
            }

            setData(imported);

            render();

            alert("✅ Backup imported successfully.");

        } catch (error) {

            alert("❌ Invalid backup file.");

        }

    };

    reader.readAsText(file);

    event.target.value = "";
}

