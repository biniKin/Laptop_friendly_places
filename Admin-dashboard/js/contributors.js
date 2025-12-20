async function loadContributors() {
  const contributors = await db.get("contributors");
  const places = await db.get("places");
  const reports = await db.get("reports");

  const table = document.getElementById("contributorsTable");
  const noContributors = document.getElementById("noContributors");

  table.innerHTML = "";

  if (contributors.length === 0) {
    noContributors.style.display = "block";
    return;
  }

  noContributors.style.display = "none";

  for (const contributor of contributors) {
    const contributorPlaces = places.filter(
      (p) => p.contributorId === contributor.id
    );
    let placesHTML = '<div style="max-width: 300px;">';

    if (contributorPlaces.length === 0) {
      placesHTML +=
        '<span style="color: var(--gray-500);">No places added</span>';
    } else {
      placesHTML +=
        '<ul style="margin: 0; padding-left: 20px; font-size: 14px;">';
      contributorPlaces.forEach((place) => {
        const placeReports = reports.filter((r) => r.placeId === place.id);
        const hasReports = placeReports.length > 0;
        const reportStatus = hasReports
          ? `<span class="status-badge ${
              placeReports.some((r) => r.status === "pending")
                ? "status-reported"
                : "status-verified"
            }" style="font-size: 10px; margin-left: 5px;">
                                ${
                                  placeReports.filter(
                                    (r) => r.status === "pending"
                                  ).length
                                } pending report${
              placeReports.filter((r) => r.status === "pending").length !== 1
                ? "s"
                : ""
            }
                            </span>`
          : "";

        placesHTML += `<li style="margin-bottom: 5px;">
                            ${place.name} 
                            <span class="status-badge ${
                              place.status === "verified"
                                ? "status-verified"
                                : "status-pending"
                            }" style="font-size: 10px; margin-left: 5px;">
                                ${place.status}
                            </span>
                            ${reportStatus}
                        </li>`;
      });
      placesHTML += "</ul>";
    }
    placesHTML += "</div>";

    const row = document.createElement("tr");
    row.innerHTML = `
                    <td><strong>${contributor.name}</strong></td>
                    <td>${contributor.email}</td>
                    <td>${contributor.placesAdded}</td>
                    <td>${placesHTML}</td>
                    <td>${contributor.joinDate}</td>
                `;
    table.appendChild(row);
  }
}
