(() => {
  if (window.__IKI_LINKEDIN_SCRAPER__) return;
  window.__IKI_LINKEDIN_SCRAPER__ = true;

  function clean(text) {
    return text ? text.replace(/\s+/g, " ").trim() : "";
  }

  function getSectionByKeyword(keyword) {
    return [...document.querySelectorAll("section")]
      .find(s => s.innerText.toLowerCase().includes(keyword.toLowerCase()));
  }

  
  function getBaseProfile() {
    const aboutSection = getSectionByKeyword("about");

    let summary = "";
    if (aboutSection) {
      const spans = [...aboutSection.querySelectorAll("span[aria-hidden='true']")]
        .map(s => clean(s.innerText))
        .filter(t => t.length > 30); 

      summary = spans[0] || "";
    }

    return {
      name: clean(document.querySelector("h1")?.innerText),
      headline: clean(document.querySelector(".text-body-medium")?.innerText),
      location: clean(
        document.querySelector(".text-body-small.inline.t-black--light")?.innerText
      ),
      summary
    };
  }

  function extractList(sectionKeyword) {
    const section = getSectionByKeyword(sectionKeyword);
    if (!section) return [];

    return [...section.querySelectorAll("li")]
      .map(li =>
        [...li.querySelectorAll("span[aria-hidden='true']")]
          .map(s => clean(s.innerText))
          .filter(Boolean)
      )
      .filter(arr => arr.length > 0);
  }

  async function scrape() {
    const url = location.href;
    const base = getBaseProfile();

    let data = {
      ...base,
      experience: [],
      education: [],
      certifications: [],
      skills: [],
      languanges: []
    };

    
    if (url.includes("/details/experience")) {
      data.experience = extractList("experience").map(i => ({
        title: i[0] || "",
        company: i[1] || "",
        duration: i.find(t => t.includes("–") || t.includes("Present")) || "",
        description: i.slice(2).join(" ")
      }));
    }

    if (url.includes("/details/education")) {
      data.education = extractList("education").map(i => ({
        school: i[0] || "",
        degree: i[1] || "",
        duration: i.find(t => /\d{4}/.test(t)) || ""
      }));
    }

    
    if (url.includes("/details/certifications")) {
      data.certifications = extractList("certification").map(i => ({
        name: i[0] || "",
        issuer: i[1] || "",
        date: i[2] || ""
      }));
    }

    if (url.includes("/details/skills")) {
      data.skills = extractList("skill")
        .flat()
        .filter(s => s.length > 2 && !s.toLowerCase().includes("endorsement"));
    }

    if (url.includes("/details/languages")) {
        data.languages = extractList("language").map(i => ({
        name: i[0] || "",
        proficiency: i[1] || "" 
      }));
    }

    return data;
  }

  chrome.runtime.onMessage.addListener((req, _, sendResponse) => {
    if (req.action === "SCRAPE_PROFILE") {
      (async () => {
        const result = await scrape();
        sendResponse(result);
      })();
      return true;
    }
  });
})();
