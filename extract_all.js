const fs = require('fs');

const files = {
    osnf: 'C:\\Users\\Igor\\.gemini\\antigravity-ide\\brain\\9510b996-3641-446f-afa0-3268e484f666\\.system_generated\\steps\\591\\content.md',
    deconjuracao: 'C:\\Users\\Igor\\.gemini\\antigravity-ide\\brain\\9510b996-3641-446f-afa0-3268e484f666\\.system_generated\\steps\\593\\content.md',
    osni: 'C:\\Users\\Igor\\.gemini\\antigravity-ide\\brain\\9510b996-3641-446f-afa0-3268e484f666\\.system_generated\\steps\\595\\content.md',
    sdol: 'C:\\Users\\Igor\\.gemini\\antigravity-ide\\brain\\9510b996-3641-446f-afa0-3268e484f666\\.system_generated\\steps\\597\\content.md'
};

const result = {};

for (const [key, filePath] of Object.entries(files)) {
    if (!fs.existsSync(filePath)) {
        console.log("File not found:", filePath);
        continue;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const videos = [];
    const rendererRegex = /\{"playlistVideoRenderer":\{"videoId":"([a-zA-Z0-9_-]{11})".*?"title":\{"runs":\[\{"text":"(.*?)"\}\]/g;
    let rMatch;
    while ((rMatch = rendererRegex.exec(content)) !== null) {
        videos.push({
            videoId: rMatch[1],
            title: rMatch[2]
        });
    }
    
    // De-duplicate
    const unique = [];
    const seen = new Set();
    for (const v of videos) {
        if (!seen.has(v.videoId)) {
            seen.add(v.videoId);
            unique.push(v);
        }
    }
    result[key] = unique;
    console.log(`Extracted ${unique.length} videos for ${key}`);
}

fs.writeFileSync('C:\\Users\\Igor\\.gemini\\antigravity-ide\\brain\\9510b996-3641-446f-afa0-3268e484f666\\scratch\\all_extracted.json', JSON.stringify(result, null, 2));
console.log("Extraction complete!");
