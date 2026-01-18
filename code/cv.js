chrome.storage.local.get(["cvData"], ({ cvData }) => {
    if (!cvData) return;

    const el = document.getElementById("cv");

    const isNotSkillLabel = (item, key) => {
        const text = item[key] || "";
        return !text.toLowerCase().includes("skills:");
    };

    let htmlContent = `
        <div class="cv-header">
            <h1 contenteditable="true">${cvData.name || ""}</h1>
            ${cvData.headline ? `<p contenteditable="true"><strong>${cvData.headline}</strong></p>` : ""}
            ${cvData.location ? `<p contenteditable="true">${cvData.location}</p>` : ""}
        </div>
    `;

    if (cvData.summary) {
        htmlContent += `
            <section>
                <h2>PROFESSIONAL SUMMARY</h2>
                <p contenteditable="true">${cvData.summary}</p>
            </section>
        `;
    }

    if (cvData.experience?.length) {
        htmlContent += `<section><h2>EXPERIENCE</h2>`;
        cvData.experience
          .filter(e => isNotSkillLabel(e, 'title'))
          .forEach(e => {
            htmlContent += `
                <div class="item" contenteditable="true">
                    <strong>${e.title || ""}</strong>
                    ${e.company ? ` | ${e.company}` : ""}
                    <br>
                    ${e.duration ? `<small>${e.duration}</small>` : ""}
                </div>
            `;
        });
        htmlContent += `</section>`;
    }

    if (cvData.education?.length) {
        htmlContent += `<section><h2>EDUCATION</h2>`;
        cvData.education
          .filter(e => isNotSkillLabel(e, 'school'))
          .forEach(e => {
            htmlContent += `
                <div class="item" contenteditable="true">
                    <strong>${e.school || ""}</strong><br>
                    ${e.degree ? `${e.degree}<br>` : ""}
                    ${e.duration ? `<small>${e.duration}</small>` : ""}
                </div>
            `;
        });
        htmlContent += `</section>`;
    }

    if (cvData.certifications?.length) {
        htmlContent += `<section><h2>CERTIFICATIONS</h2>`;
        cvData.certifications
          .filter(c => isNotSkillLabel(c, 'name'))
          .forEach(c => {
            htmlContent += `
                <div class="item" contenteditable="true">
                    <strong>${c.name || ""}</strong><br>
                    <small>
                        ${c.issuer || ""}
                        ${c.date ? ` • ${c.date}` : ""}
                    </small>
                </div>
            `;
        });
        htmlContent += `</section>`;
    }

    if (cvData.skills?.length) {
        const cleanSkills = cvData.skills.filter(s => 
            s.length < 50 && 
            !s.toLowerCase().includes("institut teknologi") && 
            !s.toLowerCase().includes("sma negeri")
        );

        htmlContent += `
            <section>
                <h2>SKILLS</h2>
                <ul class="skill-list" contenteditable="true">
                    ${cleanSkills.map(s => `<li>${s}</li>`).join("")}
                </ul>
            </section>
        `;
    }

    el.innerHTML = htmlContent;
});

document.addEventListener("DOMContentLoaded", () => {
    const btn = document.querySelector("button");
    if (btn) {
        btn.onclick = () => window.print();
    }
});