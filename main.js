const API_KEY = "API_GEMINI_KEY_HERE"; //เปลี่ยน "API_GEMINI_KEY_HERE" เป็น API key จริงของคุณ
const MODEL_NAME = "gemini-2.0-flash-thinking-exp";

function doPost(e) {
  // Check if the request contains required data
  if (!e || !e.postData || !e.postData.contents) {
    return ContentService.createTextOutput(
      JSON.stringify({ "error": "No data provided in the request." })
    ).setMimeType(ContentService.MimeType.JSON);
  }

  const requestData = JSON.parse(e.postData.contents);
  const prompt = requestData.prompt;
  const systemInstruction = requestData.systemInstruction;
  const history = requestData.history || ""; // Use empty string if no history

    
    const historyArray = history.split("\n").map(line => {
    const parts = line.split(": ", 2); // Split into "role: text"

        if (parts.length === 2){
           const role = parts[0].trim();
           const text = parts[1].trim();

            if(role.toLowerCase() === "user" || role.toLowerCase() === "model") {
                return {parts : [{text: text}] , role: role.toLowerCase() }
            }
        }
        return null;
    }).filter(item => item !== null);
    

  const url = `https://generativelanguage.googleapis.com/v1alpha/models/${MODEL_NAME}:generateContent?key=${API_KEY}`;

    const payload = {
      contents: [
          { parts: [{ text: systemInstruction }], role: "user" },
          ...historyArray,
          { parts: [{ text: prompt }], role: "user" }
        ],
    };

  const options = {
    method: "POST",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  };

  try {
    const response = UrlFetchApp.fetch(url, options);

    if (response.getResponseCode() === 200) {
      const jsonResponse = JSON.parse(response.getContentText());
      const candidates = jsonResponse.candidates;

      if (candidates && candidates.length > 0) {
        const contentParts = candidates[0].content.parts;
        let modelThoughts = "";
        let modelResponses = "";

        contentParts.forEach(part => {
          if (part.thought === true) {
            modelThoughts += part.text + "\n";
          } else {
            modelResponses += part.text + "\n";
          }
        });

        return ContentService.createTextOutput(
          JSON.stringify({
            "thought": modelThoughts.trim(),
            "response": modelResponses.trim()
          })
        ).setMimeType(ContentService.MimeType.JSON);
      } else {
        return ContentService.createTextOutput(
          JSON.stringify({ "error": "No response candidates found." })
        ).setMimeType(ContentService.MimeType.JSON);
      }
    } else {
      return ContentService.createTextOutput(
        JSON.stringify({ "error": `Error: ${response.getResponseCode()} - ${response.getContentText()}` })
      ).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (e) {
    return ContentService.createTextOutput(
      JSON.stringify({ "error": `Error occurred: ${e}` })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
