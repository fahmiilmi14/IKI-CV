function resetButton(btn) {
  btn.disabled = false;
  btn.textContent = "Extract LinkedIn Profile";
}

async function extract() {
  const btn = document.getElementById("extract");
  const output = document.getElementById("output");

  btn.disabled = true;
  btn.textContent = "Extracting...";

  try {
    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true
    });

    if (!tab.url.includes("linkedin.com")) {
      alert("Buka halaman LinkedIn dulu");
      resetButton(btn);
      return;
    }

    chrome.tabs.sendMessage(
      tab.id,
      { action: "SCRAPE_PROFILE" },
      (res) => {
        resetButton(btn);

        if (chrome.runtime.lastError || !res) {
          alert("Gagal extract. Refresh halaman LinkedIn.");
          return;
        }

        chrome.storage.local.get(["cvData"], (old) => {
          const prev = old.cvData || {
            experience: [],
            education: [],
            certifications: [],
            skills: []
          };

          const merged = {
            name: res.name || prev.name || "",
            headline: res.headline || prev.headline || "",
            location: res.location || prev.location || "",
            summary: res.summary || prev.summary || "",

            experience: res.experience?.length
              ? res.experience
              : prev.experience,

            education: res.education?.length
              ? res.education
              : prev.education,

            certifications: res.certifications?.length
              ? res.certifications
              : prev.certifications,

            skills: [
              ...new Set([...(prev.skills || []), ...(res.skills || [])])
            ]
          };

          chrome.storage.local.set({ cvData: merged }, () => {
            output.textContent = JSON.stringify(merged, null, 2);
          });
        });
      }
    );
  } catch (e) {
    console.error(e);
    resetButton(btn);
  }
}

function generateCV(mode) {
  chrome.storage.local.get(["cvData"], (res) => {
    if (!res.cvData || !res.cvData.name) {
      alert("Extract profil utama dulu");
      return;
    }

    chrome.storage.local.set({ cvMode: mode }, () => {
      chrome.tabs.create({
        url: chrome.runtime.getURL("cv.html")
      });
    });
  });
}

document.getElementById("extract").onclick = extract;
document.getElementById("ats").onclick = () => generateCV("ATS");
document.getElementById("visual").onclick = () => generateCV("VISUAL");

document.getElementById("reset").onclick = () => {
  if (confirm("Hapus semua data CV?")) {
    chrome.storage.local.remove("cvData", () => {
      document.getElementById("output").textContent = "";
      alert("Data direset");
    });
  }
};
