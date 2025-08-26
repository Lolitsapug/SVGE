window.addEventListener("DOMContentLoaded", () => {
    const now = new Date();
    const events = [...document.querySelectorAll(".row.row-striped")];

    const parsedEvents = events.map(el => ({
        date: new Date(el.dataset.date),
        title: el.querySelector("h3")?.textContent || "Untitled Event",
        location: el.querySelector(".fa-location-arrow")?.parentElement.textContent.trim() || "Location TBA"
    }));

    const upcoming = parsedEvents.filter(e => e.date >= now);
    upcoming.sort((a, b) => a.date - b.date);

    const nextEl = document.getElementById("next-event");

    if (upcoming.length > 0) {
        const e = upcoming[0];
        const formattedDate = e.date.toLocaleDateString(undefined, {
            weekday: "short", month: "short", day: "numeric"
        });

        nextEl.innerHTML = `
					<div class="next-event-content">
					<span><strong>${e.title}</strong></span>
					<span>| ${formattedDate}</span>
					<span>| ${e.location}</span>
					</div>
				`;
    } else {
        nextEl.innerHTML = `<span>No upcoming events</span>`;
    }
});