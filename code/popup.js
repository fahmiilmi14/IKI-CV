const detailPages = [
    "details/experience/",
    "details/education/",
    "details/certifications/",
    "details/skills/",
    "details/languages/"
];

async function startAutoExtract() {
    const button = document.getElementById("extract");
    button.disabled = true;
    button.textContent = "Processing...";

    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url.includes("linkedin.com/in/")) {
        alert("Harap buka halaman profil LinkedIn Anda terlebih dahulu!");
        button.disabled = false;
        button.textContent = "Extract LinkedIn Profile";
        return;
    }

    const baseUrl = tab.url.split('/?')[0];

    button.textContent = "Extracting Main Profile...";
    await performScrape(tab.id);

    
    for (const page of detailPages) {
        const targetUrl = baseUrl.endsWith('/') ? `${baseUrl}${page}` : `${baseUrl}/${page}`;
        button.textContent = `Navigating to ${page.split('/')[1]}...`;

        await chrome.tabs.update(tab.id, { url: targetUrl });
        await waitTabComplete(tab.id);

        button.textContent = `Scraping ${page.split('/')[1]}...`;
        await performScrape(tab.id);
    }

    
    button.textContent = "Final Sync: Returning to Main Profile...";
    await chrome.tabs.update(tab.id, { url: baseUrl });
    await waitTabComplete(tab.id);
    await performScrape(tab.id);

    button.disabled = false;
    button.textContent = "Extract LinkedIn Profile";
    alert("Ekstraksi Otomatis Selesai! Data Anda telah disinkronkan.");
}


function waitTabComplete(tabId) {
    return new Promise(resolve => {
        chrome.tabs.onUpdated.addListener(function listener(tId, info) {
            if (tId === tabId && info.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(listener);
                setTimeout(resolve, 3000); 
            }
        });
    });
}

function performScrape(tabId) {
    return new Promise((resolve) => {
        chrome.tabs.sendMessage(tabId, { action: "SCRAPE_PROFILE" }, (res) => {
            if (!res) return resolve();

            chrome.storage.local.get(["cvData"], (result) => {
                let oldData = result.cvData || { 
                    experience: [], 
                    education: [], 
                    certifications: [], 
                    skills: [], 
                    languages: [] 
                };
                
                const mergedData = {
                    name: res.name || oldData.name || "",
                    headline: res.headline || oldData.headline || "",
                    location: res.location || oldData.location || "",
                    summary: res.summary || oldData.summary || "",
                    experience: res.experience.length > 0 ? res.experience : oldData.experience,
                    education: res.education.length > 0 ? res.education : oldData.education,
                    certifications: res.certifications.length > 0 ? res.certifications : oldData.certifications,
                    languages: (res.languages && res.languages.length > 0) ? res.languages : oldData.languages || [],
                    skills: [...new Set([...(oldData.skills || []), ...(res.skills || [])])]
                };

                chrome.storage.local.set({ cvData: mergedData }, resolve);
            });
        });
    });
}


document.getElementById("extract").onclick = startAutoExtract;

document.getElementById("ats").onclick = () => {
    chrome.tabs.create({ url: chrome.runtime.getURL("cv.html") });
};

document.getElementById("reset").onclick = () => {
    if (confirm("Apakah Anda yakin ingin menghapus semua data CV yang tersimpan?")) {
        chrome.storage.local.remove("cvData", () => {
            alert("Data berhasil dihapus!");
            location.reload(); 
        });
    }
};
