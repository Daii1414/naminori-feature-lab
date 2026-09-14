const toggle = document.getElementById("dubbingAntidoteToggle");

chrome.storage.sync.get(["dubbingAntidoteEnabled"]).then((stored) => {
  toggle.checked = stored.dubbingAntidoteEnabled ?? true;
});

toggle.addEventListener("change", () => {
  chrome.storage.sync.set({ dubbingAntidoteEnabled: toggle.checked });
});
