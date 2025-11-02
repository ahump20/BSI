const fs = require('fs');
const path = require('path');

// Episode file mappings
const episodes = [
    { file: 'chaos.html', output: 'ep01-chaos-transcript.txt', title: 'EP01: Chaos Is the Only Constant' },
    { file: 'respect.html', output: 'ep02-respect-transcript.txt', title: 'EP02: Respect the Game, Not the Result' },
    { file: 'teach.html', output: 'ep03-teach-transcript.txt', title: 'EP03: Let the Game Teach the Game' },
    { file: 'failure.html', output: 'ep04-failure-transcript.txt', title: 'EP04: Failure as Information' },
    { file: 'poetry.html', output: 'ep05-poetry-transcript.txt', title: 'EP05: The Poetry of Practice' },
    { file: 'team.html', output: 'ep06-team-transcript.txt', title: 'EP06: The Team Within the Team' },
    { file: 'architecture.html', output: 'ep07-architecture-transcript.txt', title: 'EP07: Practice Architecture' },
    { file: 'flow.html', output: 'ep08-flow-transcript.txt', title: 'EP08: Flow & Focus' },
    { file: 'memory.html', output: 'ep09-memory-transcript.txt', title: 'EP09: Institutional Memory' },
    { file: 'legacy.html', output: 'ep10-legacy-transcript.txt', title: 'EP10: Legacy Over Victory' }
];

// Create transcripts directory if it doesn't exist
const transcriptsDir = path.join(__dirname, 'transcripts');
if (!fs.existsSync(transcriptsDir)) {
    fs.mkdirSync(transcriptsDir, { recursive: true });
    console.log('✅ Created /garrido/transcripts/ directory');
}

// Extract text from HTML transcript section
function extractTranscript(html) {
    // Try matching both possible HTML structures:
    // Structure 1 (EP01-02): <div class="transcript-section">
    // Structure 2 (EP03-10): <div class="transcript-content">

    let transcriptMatch = html.match(/<div class="transcript-section">([\s\S]*?)<\/div>\s*<\/div>/);

    if (!transcriptMatch) {
        // Try alternate structure
        transcriptMatch = html.match(/<div class="transcript-content"[^>]*>([\s\S]*?)<\/div>\s*<\/section>/);
    }

    if (!transcriptMatch) {
        return null;
    }

    let transcriptHTML = transcriptMatch[1];

    // Remove HTML tags but keep text content
    let text = transcriptHTML
        .replace(/<span class="timestamp">([^<]+)<\/span>/g, '\n\n[$1]\n')  // Keep timestamps
        .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/g, '\n\n## $1\n')               // Convert h3 to markdown headers
        .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/g, '\n\n### $1\n')              // Convert h4 to markdown headers
        .replace(/<p>([\s\S]*?)<\/p>/g, '$1\n\n')                           // Keep paragraphs with line breaks
        .replace(/<ul>([\s\S]*?)<\/ul>/g, '$1\n')                           // Keep list content
        .replace(/<li>([\s\S]*?)<\/li>/g, '- $1\n')                         // Convert li to bullet points
        .replace(/<strong>([\s\S]*?)<\/strong>/g, '**$1**')                 // Convert strong to markdown bold
        .replace(/<em>([\s\S]*?)<\/em>/g, '*$1*')                           // Convert em to markdown italic
        .replace(/<[^>]+>/g, '')                                            // Remove remaining HTML tags
        .replace(/&nbsp;/g, ' ')                                            // Replace HTML entities
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\n\s*\n\s*\n/g, '\n\n')                                   // Normalize multiple line breaks
        .trim();

    return text;
}

// Process each episode
let successCount = 0;
let failCount = 0;

episodes.forEach(episode => {
    const filePath = path.join(__dirname, episode.file);
    const outputPath = path.join(transcriptsDir, episode.output);

    if (!fs.existsSync(filePath)) {
        console.log(`❌ ${episode.file} not found, skipping...`);
        failCount++;
        return;
    }

    try {
        const html = fs.readFileSync(filePath, 'utf-8');
        const transcript = extractTranscript(html);

        if (!transcript) {
            console.log(`⚠️  Could not extract transcript from ${episode.file}`);
            failCount++;
            return;
        }

        // Add header with episode info
        const fullTranscript = `# ${episode.title}\n\nThe Garrido Code Podcast Series\n\n---\n\n${transcript}`;

        fs.writeFileSync(outputPath, fullTranscript, 'utf-8');
        console.log(`✅ Extracted ${episode.output} (${transcript.length} characters)`);
        successCount++;
    } catch (error) {
        console.error(`❌ Error processing ${episode.file}:`, error.message);
        failCount++;
    }
});

console.log('\n📄 Transcript Extraction Complete!');
console.log(`✅ Success: ${successCount} files`);
if (failCount > 0) {
    console.log(`❌ Failed: ${failCount} files`);
}

console.log('\n📁 Transcripts saved to: /garrido/transcripts/');
console.log('\nNext steps:');
console.log('1. Review extracted transcripts for formatting');
console.log('2. Upload transcripts to NotebookLM for audio generation');
console.log('3. Download generated MP3 files to /garrido/audio/');
