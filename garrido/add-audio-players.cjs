const fs = require('fs');
const path = require('path');

// Episode file mappings
const episodes = [
    { file: 'chaos.html', audioPath: '/garrido/audio/ep01-chaos.mp3', title: 'Chaos Is the Only Constant' },
    { file: 'respect.html', audioPath: '/garrido/audio/ep02-respect.mp3', title: 'Respect the Game, Not the Result' },
    { file: 'teach.html', audioPath: '/garrido/audio/ep03-teach.mp3', title: 'Let the Game Teach the Game' },
    { file: 'failure.html', audioPath: '/garrido/audio/ep04-failure.mp3', title: 'Failure as Information' },
    { file: 'poetry.html', audioPath: '/garrido/audio/ep05-poetry.mp3', title: 'The Poetry of Practice' },
    { file: 'team.html', audioPath: '/garrido/audio/ep06-team.mp3', title: 'The Team Within the Team' },
    { file: 'architecture.html', audioPath: '/garrido/audio/ep07-architecture.mp3', title: 'Practice Architecture' },
    { file: 'flow.html', audioPath: '/garrido/audio/ep08-flow.mp3', title: 'Flow & Focus' },
    { file: 'memory.html', audioPath: '/garrido/audio/ep09-memory.mp3', title: 'Institutional Memory' },
    { file: 'legacy.html', audioPath: '/garrido/audio/ep10-legacy.mp3', title: 'Legacy Over Victory' }
];

// Proper audio player HTML template
const getAudioPlayerHTML = (audioPath, title) => `<audio controls style="width: 100%;">
                    <source src="${audioPath}" type="audio/mpeg">
                    Your browser does not support the audio element.
                </audio>
                <p style="margin-top: 1rem; color: var(--text-quaternary); font-size: 0.9rem;">
                    <i class="fas fa-info-circle"></i> Audio files will be generated via NotebookLM. Player will activate once files are uploaded.
                </p>`;

// Process each episode
episodes.forEach(episode => {
    const filePath = path.join(__dirname, episode.file);

    if (!fs.existsSync(filePath)) {
        console.log(`❌ ${episode.file} not found, skipping...`);
        return;
    }

    let html = fs.readFileSync(filePath, 'utf-8');

    // Pattern to match the audio-placeholder div and replace it with proper audio player
    const audioPlaceholderRegex = /<div class="audio-placeholder">[\s\S]*?<\/div>/;

    if (html.match(audioPlaceholderRegex)) {
        html = html.replace(audioPlaceholderRegex, getAudioPlayerHTML(episode.audioPath, episode.title));
        fs.writeFileSync(filePath, html, 'utf-8');
        console.log(`✅ Updated ${episode.file} with audio player`);
    } else {
        console.log(`ℹ️  ${episode.file} already has audio player or different structure`);
    }
});

console.log('\n🎵 Audio player integration complete!');
console.log('\nNext steps:');
console.log('1. Generate audio files via NotebookLM (use episode transcripts)');
console.log('2. Save MP3 files to /garrido/audio/ directory');
console.log('3. Test audio playback on at least one episode');
