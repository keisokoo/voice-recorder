chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({ url: "index.html" });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "saveFile") {
    chrome.downloads.download(
      {
        url: request.url,
        filename: request.filename,
        saveAs: false,
      },
      (downloadId) => {
        if (chrome.runtime.lastError) {
          sendResponse({
            success: false,
            error: chrome.runtime.lastError.message,
          });
        } else {
          sendResponse({ success: true, downloadId: downloadId });
        }
      }
    );
    return true; // 비동기 응답을 위해 true 반환
  }
});
